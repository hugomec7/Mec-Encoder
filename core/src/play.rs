//! Reprodução no app (botão de play).
//!
//! Um servidor HTTP local (só em 127.0.0.1, com uma senha aleatória no caminho) entrega ao player:
//! - o arquivo original, com pedidos de pedaço (`Range`), quando o player do app toca ele direto;
//! - uma conversão ao vivo para MP4 fragmentado (H.264 + AAC) quando não toca direto (FX30, HDR,
//!   ProRes...): o FFmpeg começa no ponto da agulha e o vídeo já vai saindo, sem esperar;
//! - a "prévia leve" guardada, para máquinas que não convertem em tempo real (serve como arquivo).
//!
//! Também monta os comandos do FFmpeg da conversão ao vivo e da prévia leve, e escolhe o encoder
//! H.264 que a máquina tiver (NVENC, Quick Sync, AMF, VideoToolbox ou a CPU).

use std::collections::HashMap;
use std::fs::File;
use std::io::{self, BufRead, BufReader, Read, Seek, SeekFrom, Write};
use std::net::{TcpListener, TcpStream};
use std::path::{Path, PathBuf};
use std::process::{Child, Stdio};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, Mutex};
use std::time::Duration;

use crate::command::{aspect_ratio, fmt_num, framed, hdr_chain, nvdec_supported, resolve};
use crate::progress::Progress;
use crate::{tools, MediaInfo, Preset};

fn s(a: &[&str]) -> Vec<String> { a.iter().map(|x| x.to_string()).collect() }

// ======================================================================
// Encoder da prévia
// ======================================================================

/// Encoder H.264 da conversão ao vivo e da prévia leve: o que a máquina tiver.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum LiveEnc {
    /// Placa NVIDIA.
    Nvenc,
    /// Intel (vídeo integrado ou Arc).
    Qsv,
    /// Placa AMD.
    Amf,
    /// Mac.
    VideoToolbox,
    /// Sem placa que codifique: CPU no modo mais leve.
    X264,
    /// Só para os testes (o Chromium dos testes não toca H.264): VP9 + Opus.
    #[doc(hidden)]
    TestVp9,
}

impl LiveEnc {
    pub fn name(self) -> &'static str {
        match self {
            LiveEnc::Nvenc => "nvenc", LiveEnc::Qsv => "qsv", LiveEnc::Amf => "amf",
            LiveEnc::VideoToolbox => "videotoolbox", LiveEnc::X264 => "cpu", LiveEnc::TestVp9 => "vp9",
        }
    }
    pub fn from_name(n: &str) -> Option<LiveEnc> {
        [LiveEnc::Nvenc, LiveEnc::Qsv, LiveEnc::Amf, LiveEnc::VideoToolbox, LiveEnc::X264, LiveEnc::TestVp9].into_iter().find(|e| e.name() == n)
    }
    fn pix(self) -> &'static str { match self { LiveEnc::Qsv | LiveEnc::Amf | LiveEnc::VideoToolbox => "nv12", _ => "yuv420p" } }
    /// `gop`: quadros entre quadros-chave. `file`: prévia guardada (um pouco mais de qualidade).
    fn video_args(self, gop: u32, file: bool) -> Vec<String> {
        let q = if file { "23" } else { "25" };
        let mut a = match self {
            LiveEnc::Nvenc => s(&["-c:v", "h264_nvenc", "-preset", "p2", "-tune", if file { "hq" } else { "ll" }, "-rc", "vbr", "-cq", q, "-b:v", "0"]),
            LiveEnc::Qsv => s(&["-c:v", "h264_qsv", "-preset", "veryfast", "-global_quality", q, "-look_ahead", "0"]),
            LiveEnc::Amf => s(&["-c:v", "h264_amf", "-usage", if file { "transcoding" } else { "lowlatency" }, "-quality", "speed", "-rc", "cqp", "-qp_i", q, "-qp_p", q]),
            LiveEnc::VideoToolbox => s(&["-c:v", "h264_videotoolbox", "-realtime", "1", "-q:v", "60"]),
            LiveEnc::X264 => if file { s(&["-c:v", "libx264", "-preset", "veryfast", "-crf", q]) }
                             else { s(&["-c:v", "libx264", "-preset", "ultrafast", "-tune", "zerolatency", "-crf", q]) },
            LiveEnc::TestVp9 => s(&["-c:v", "libvpx-vp9", "-deadline", "realtime", "-cpu-used", "8", "-row-mt", "1", "-b:v", "1500k"]),
        };
        a.extend(s(&["-bf", "0", "-g"]));
        a.push(gop.max(1).to_string());
        a
    }
    fn audio_args(self) -> Vec<String> {
        if self == LiveEnc::TestVp9 { s(&["-c:a", "libopus", "-b:a", "128k", "-ac", "2"]) } else { s(&["-c:a", "aac", "-b:a", "160k", "-ac", "2"]) }
    }
}

/// Testa se o encoder funciona nesta máquina (codifica um quadro preto).
pub fn encoder_works(ffmpeg: &Path, e: LiveEnc) -> bool {
    tools::command(ffmpeg)
        .args(["-hide_banner", "-v", "error", "-f", "lavfi", "-i", "color=c=black:s=320x240:r=30:d=0.3", "-vf"])
        .arg(format!("format={}", e.pix()))
        .args(e.video_args(15, false))
        .args(["-f", "null", "-"])
        .stdin(Stdio::null()).stdout(Stdio::null()).stderr(Stdio::null())
        .status().map(|s| s.success()).unwrap_or(false)
}

/// O melhor encoder que funciona aqui: placa NVIDIA (`nvenc` = já testado), Intel, AMD, Mac; senão a CPU.
pub fn pick_encoder(ffmpeg: &Path, nvenc: bool) -> LiveEnc {
    let mut list = Vec::new();
    if nvenc { list.push(LiveEnc::Nvenc); }
    if cfg!(target_os = "macos") { list.push(LiveEnc::VideoToolbox); } else { list.extend([LiveEnc::Qsv, LiveEnc::Amf]); }
    list.into_iter().find(|e| encoder_works(ffmpeg, *e)).unwrap_or(LiveEnc::X264)
}

// ======================================================================
// Comandos
// ======================================================================

/// Como a prévia vai ser feita.
#[derive(Clone, Debug)]
pub struct LiveOpts {
    /// Trechos [início, fim) em segundos, tocados um atrás do outro (como o arquivo juntado).
    /// Um só trecho que vai até o fim do arquivo = tocar dali até o fim.
    pub parts: Vec<(f64, f64)>,
    /// Mostra o resultado do preset (giro, proporção, HDR → SDR), como a prévia de quadros.
    pub output: bool,
    /// 360, 540, 720, 1080: o lado maior do quadro fica em altura × 16/9 (720 → 1280).
    pub height: u32,
    /// Quadros por segundo da agulha (n/d): cada quadro da prévia cai num quadro da linha do tempo.
    pub fps: (u32, u32),
    pub enc: LiveEnc,
    /// Deixa a placa decodificar o que ela lê (false = só a CPU, se a placa falhar com este arquivo).
    pub hw: bool,
}

/// Lado maior do quadro para uma altura (720 → 1280; 1080 → 1920).
pub fn long_side(height: u32) -> u32 { ((height.max(144) as f64 * 16.0 / 9.0 / 2.0).round() as u32) * 2 }

/// Filtros de vídeo da prévia: os mesmos da prévia de quadros, mais frame rate constante.
fn video_chain(info: &MediaInfo, p: &Preset, o: &LiveOpts) -> Vec<String> {
    let Some(v) = info.video.as_ref() else { return vec![] };
    let mut f = Vec::new();
    let user = if o.output { p.rotate % 360 } else { 0 };
    match (v.rotation + user) % 360 {
        90 => f.push("transpose=clock".to_string()),
        180 => f.push("hflip,vflip".to_string()),
        270 => f.push("transpose=cclock".to_string()),
        _ => {}
    }
    if o.output && aspect_ratio(p).is_some() {
        let (fw, fh) = framed(v, p);
        f.push(if p.aspect_mode == "pad" { format!("pad={fw}:{fh}:(ow-iw)/2:(oh-ih)/2:color=black") } else { format!("crop={fw}:{fh}") });
    }
    // diminui logo (nunca aumenta): o resto dos filtros fica leve
    let m = long_side(o.height);
    f.push(format!("scale=w='min({m},iw)':h='min({m},ih)':force_original_aspect_ratio=decrease:force_divisible_by=2:flags=bilinear"));
    if o.output && p.hdr_to_sdr && !v.hdr.is_empty() { f.extend(hdr_chain(v)); }
    let (n, d) = o.fps;
    f.push(format!("fps={}/{}", n.max(1), d.max(1)));
    f.push(format!("format={}", o.enc.pix()));
    f
}

/// Conversão ao vivo: MP4 fragmentado saindo no stdout; o andamento sai no stderr (`-progress pipe:2`).
pub fn live_args(info: &MediaInfo, p: &Preset, o: &LiveOpts) -> Vec<String> { media_args(info, p, o, None) }

/// Prévia leve guardada (arquivo inteiro, MP4 normal com o índice no começo); andamento no stdout.
pub fn proxy_args(info: &MediaInfo, p: &Preset, o: &LiveOpts, out: &Path) -> Vec<String> { media_args(info, p, o, Some(out)) }

fn media_args(info: &MediaInfo, p: &Preset, o: &LiveOpts, file: Option<&Path>) -> Vec<String> {
    let p = &resolve(info, p);
    let dur = info.duration.max(0.0);
    let mut a = s(&["-nostdin", "-hide_banner", "-v", "error", "-progress", if file.is_some() { "pipe:1" } else { "pipe:2" }, "-nostats"]);
    let mut parts: Vec<(f64, f64)> = o.parts.iter().map(|&(x, y)| (x.clamp(0.0, dur), y.clamp(0.0, dur))).filter(|(x, y)| y - x > 0.001).collect();
    if parts.is_empty() { parts.push((0.0, dur)); }
    let v = info.video.as_ref().filter(|_| !info.is_image);
    let has_a = !info.audio.is_empty();
    // a placa decodifica o que ela lê (H.264 8-bit 4:2:0, HEVC, AV1, VP9); o resto vai pela CPU
    let hw = o.hw && v.map_or(false, |v| nvdec_supported(v, false)) && o.enc != LiveEnc::TestVp9;
    let (fn_, fd) = (o.fps.0.max(1) as f64, o.fps.1.max(1) as f64);
    let n = parts.len();
    let open = |y: f64| n == 1 && y >= dur - 0.001;
    for &(x, y) in &parts {
        if hw { a.extend(s(&["-hwaccel", "auto"])); }
        if x > 0.0 { a.extend(["-ss".to_string(), fmt_num(x)]); }
        // um pouco a mais: o corte exato é feito em quadros/amostras pelos filtros
        if !open(y) { a.extend(["-t".to_string(), fmt_num(y - x + 0.25)]); }
        if v.map_or(false, |v| v.rotation != 0) { a.extend(s(&["-display_rotation", "0"])); }
        a.push("-i".into());
        a.push(info.path.to_string_lossy().into_owned());
    }
    let mut g = Vec::new();
    let mut labels = String::new();
    for (i, &(x, y)) in parts.iter().enumerate() {
        if v.is_some() {
            let mut c = video_chain(info, p, o);
            if !open(y) {
                let frames = ((y - x) * fn_ / fd).round().max(1.0) as u64;
                c.push(format!("trim=end_frame={frames}"));
                c.push("setpts=PTS-STARTPTS".into());
            }
            g.push(format!("[{i}:v:0]{}[v{i}]", c.join(",")));
            labels += &format!("[v{i}]");
        }
        if has_a {
            let mut c = vec!["aresample=48000".to_string()];
            if !open(y) {
                c.push("apad".into());
                c.push(format!("atrim=end_sample={}", ((y - x) * 48000.0).round().max(1.0) as u64));
                c.push("asetpts=PTS-STARTPTS".into());
            }
            g.push(format!("[{i}:a:0]{}[a{i}]", c.join(",")));
            labels += &format!("[a{i}]");
        }
    }
    let (vo, ao) = if n > 1 {
        g.push(format!("{labels}concat=n={n}:v={}:a={}{}{}", v.is_some() as u8, has_a as u8,
            if v.is_some() { "[v]" } else { "" }, if has_a { "[a]" } else { "" }));
        ("[v]".to_string(), "[a]".to_string())
    } else { ("[v0]".to_string(), "[a0]".to_string()) };
    a.push("-filter_complex".into());
    a.push(g.join(";"));
    if v.is_some() {
        a.extend(["-map".to_string(), vo]);
        // quadro-chave a cada 0,5 s (ao vivo: os pedaços saem rápido) ou 1 s (guardada)
        let fps = fn_ / fd;
        let gop = (fps * if file.is_some() { 1.0 } else { 0.5 }).round().max(1.0) as u32;
        a.extend(o.enc.video_args(gop, file.is_some()));
        a.extend(s(&["-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709", "-color_range", "tv"]));
    } else { a.push("-vn".into()); }
    if has_a { a.extend(["-map".to_string(), ao]); a.extend(o.enc.audio_args()); } else { a.push("-an".into()); }
    a.extend(s(&["-sn", "-dn", "-map_metadata", "-1", "-map_chapters", "-1"]));
    match file {
        Some(out) => {
            a.extend(s(&["-movflags", "+faststart", "-y"]));
            a.push(out.to_string_lossy().into_owned());
        }
        None => a.extend(s(&["-f", "mp4", "-movflags", "frag_keyframe+empty_moov+default_base_moof", "-flush_packets", "1", "pipe:1"])),
    }
    a
}

/// Tipo com codecs para o player perguntar se toca o arquivo direto (`canPlayType`).
/// None quando com certeza não toca (ProRes, 4:2:2, H.264 10-bit, PCM no vídeo, MKV...) ou é HDR
/// (a prévia de quadros mostra o HDR sem conversão; tocando direto, a cor mudaria ao pausar).
pub fn direct_hint(info: &MediaInfo) -> Option<String> {
    if info.is_image { return None; }
    let ext = info.path.extension()?.to_str()?.to_ascii_lowercase();
    let audio = info.audio.first();
    let Some(v) = info.video.as_ref() else {
        let a = audio?;
        let c = a.codec.as_str();
        return match ext.as_str() {
            "mp3" if c == "mp3" => Some("audio/mpeg".into()),
            "m4a" | "aac" | "mp4" if c == "aac" => Some("audio/mp4; codecs=\"mp4a.40.2\"".into()),
            "wav" if matches!(c, "pcm_u8" | "pcm_s16le" | "pcm_s24le" | "pcm_s32le" | "pcm_f32le") => Some("audio/wav".into()),
            "flac" if c == "flac" => Some("audio/flac".into()),
            "ogg" | "opus" if c == "opus" => Some("audio/ogg; codecs=\"opus\"".into()),
            "ogg" if c == "vorbis" => Some("audio/ogg; codecs=\"vorbis\"".into()),
            _ => None,
        };
    };
    if !v.hdr.is_empty() { return None; }
    let (mime, mp4) = match ext.as_str() { "mp4" | "m4v" | "mov" => ("video/mp4", true), "webm" => ("video/webm", false), _ => return None };
    let pf = v.pix_fmt.as_str();
    let c420 = matches!(pf, "" | "yuv420p" | "yuvj420p" | "yuv420p10le" | "nv12" | "p010le");
    let ten = v.bit_depth > 8;
    let vc = match v.codec.as_str() {
        "h264" if c420 && !ten => "avc1.640033",
        "hevc" if mp4 && c420 => if ten { "hvc1.2.4.L153.B0" } else { "hvc1.1.6.L153.B0" },
        "vp9" if c420 => if ten { "vp09.02.40.10" } else { "vp09.00.40.08" },
        "av1" if c420 => if ten { "av01.0.08M.10" } else { "av01.0.08M.08" },
        _ => return None,
    };
    let ac = match audio.map(|a| a.codec.as_str()) {
        None => None,
        Some("aac") if mp4 => Some("mp4a.40.2"),
        Some("mp3") if mp4 => Some("mp4a.6B"),
        Some("flac") if mp4 => Some("flac"),
        Some("opus") => Some("opus"),
        Some("vorbis") if !mp4 => Some("vorbis"),
        _ => return None,
    };
    Some(match ac { Some(a) => format!("{mime}; codecs=\"{vc}, {a}\""), None => format!("{mime}; codecs=\"{vc}\"") })
}

// ======================================================================
// Servidor
// ======================================================================

/// O que acontece numa conversão ao vivo.
#[derive(Clone, Debug, PartialEq)]
pub enum Event {
    /// Andamento: velocidade em relação ao tempo real (1,0 = consegue acompanhar) e segundos já convertidos.
    Speed { speed: f64, time: f64 },
    /// Terminou de converter tudo.
    Ended,
    /// O FFmpeg falhou (últimas linhas de erro).
    Failed(String),
}

type Callback = dyn Fn(&str, Event) + Send + Sync;

#[derive(Clone)]
enum Route {
    File(PathBuf),
    Live(Vec<String>),
}

struct Inner {
    ffmpeg: PathBuf,
    token: String,
    routes: Mutex<HashMap<String, Route>>,
    /// FFmpeg ao vivo rodando, por chave (geração, processo).
    live: Mutex<HashMap<String, (u64, Child)>>,
    gen: AtomicU64,
    cb: Box<Callback>,
}

/// Servidor de reprodução. Fica no ar enquanto existir.
pub struct Server {
    port: u16,
    inner: Arc<Inner>,
}

/// Senha da URL (128 bits): outro programa ou site não consegue pedir arquivos ao servidor.
fn token() -> String {
    use std::hash::{BuildHasher, Hasher};
    let t = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map(|d| d.as_nanos()).unwrap_or(0);
    (0u8..2).map(|i| {
        let mut h = std::collections::hash_map::RandomState::new().build_hasher();
        h.write_u128(t);
        h.write_u32(std::process::id());
        h.write_u8(i);
        format!("{:016x}", h.finish())
    }).collect()
}

impl Server {
    /// Sobe o servidor numa porta livre de 127.0.0.1. `cb` recebe o andamento das conversões ao vivo.
    pub fn start(ffmpeg: PathBuf, cb: impl Fn(&str, Event) + Send + Sync + 'static) -> io::Result<Server> {
        let listener = TcpListener::bind(("127.0.0.1", 0))?;
        let port = listener.local_addr()?.port();
        let inner = Arc::new(Inner {
            ffmpeg, token: token(), routes: Mutex::new(HashMap::new()), live: Mutex::new(HashMap::new()),
            gen: AtomicU64::new(0), cb: Box::new(cb),
        });
        let i2 = inner.clone();
        std::thread::Builder::new().name("mec-play".into()).spawn(move || {
            for st in listener.incoming().flatten() {
                let i = i2.clone();
                std::thread::spawn(move || { let _ = handle(i, st); });
            }
        })?;
        Ok(Server { port, inner })
    }

    pub fn port(&self) -> u16 { self.port }

    fn url(&self, key: &str) -> String { format!("http://127.0.0.1:{}/{}/{}", self.port, self.inner.token, key) }

    /// Entrega um arquivo (com Range) em `key`; devolve a URL.
    pub fn file(&self, key: &str, path: &Path) -> String {
        self.inner.routes.lock().unwrap().insert(key.to_string(), Route::File(path.to_path_buf()));
        self.url(key)
    }

    /// Conversão ao vivo em `key` (para a anterior desta chave); devolve a URL (nova a cada vez).
    pub fn live(&self, key: &str, args: Vec<String>) -> String {
        self.stop(key);
        self.inner.routes.lock().unwrap().insert(key.to_string(), Route::Live(args));
        let n = self.inner.gen.fetch_add(1, Ordering::SeqCst) + 1;
        format!("{}?n={n}", self.url(key))
    }

    /// Para a conversão ao vivo desta chave.
    pub fn stop(&self, key: &str) {
        let old = self.inner.live.lock().unwrap().remove(key);
        if let Some((_, mut c)) = old { let _ = c.kill(); let _ = c.wait(); }
    }

    /// Para todas as conversões ao vivo (ao fechar o app).
    pub fn stop_all(&self) {
        let all: Vec<_> = self.inner.live.lock().unwrap().drain().collect();
        for (_, (_, mut c)) in all { let _ = c.kill(); let _ = c.wait(); }
    }
}

impl Drop for Server {
    fn drop(&mut self) { self.stop_all(); }
}

fn reply(st: &mut TcpStream, status: &str, headers: &[(&str, String)], len: Option<u64>) -> io::Result<()> {
    let mut h = format!("HTTP/1.1 {status}\r\nAccess-Control-Allow-Origin: *\r\nConnection: close\r\n");
    for (k, v) in headers { h += &format!("{k}: {v}\r\n"); }
    if let Some(n) = len { h += &format!("Content-Length: {n}\r\n"); }
    h += "\r\n";
    st.write_all(h.as_bytes())
}

fn read_head(st: &mut TcpStream) -> io::Result<String> {
    let mut buf = Vec::with_capacity(1024);
    let mut chunk = [0u8; 1024];
    loop {
        let n = st.read(&mut chunk)?;
        if n == 0 { break; }
        buf.extend_from_slice(&chunk[..n]);
        if buf.windows(4).any(|w| w == b"\r\n\r\n") || buf.len() > 16 * 1024 { break; }
    }
    Ok(String::from_utf8_lossy(&buf).into_owned())
}

/// `Range: bytes=a-b`, `bytes=a-` ou `bytes=-n` → (início, fim incluído). None = fora do arquivo.
pub fn parse_range(r: &str, len: u64) -> Option<(u64, u64)> {
    let r = r.trim().strip_prefix("bytes=")?.split(',').next()?.trim();
    let (a, b) = r.split_once('-')?;
    if len == 0 { return None; }
    if a.trim().is_empty() {
        let n: u64 = b.trim().parse().ok()?;
        return (n > 0).then(|| (len.saturating_sub(n), len - 1));
    }
    let a: u64 = a.trim().parse().ok()?;
    let b: u64 = if b.trim().is_empty() { len - 1 } else { b.trim().parse::<u64>().ok()?.min(len - 1) };
    (a <= b && a < len).then_some((a, b))
}

/// Tipo do arquivo para o player (MOV vai como MP4: o player só toca se o conteúdo for compatível).
pub fn mime_of(p: &Path) -> &'static str {
    match p.extension().and_then(|e| e.to_str()).map(|e| e.to_ascii_lowercase()).as_deref() {
        Some("mp4" | "m4v" | "mov") => "video/mp4",
        Some("webm") => "video/webm",
        Some("mp3") => "audio/mpeg",
        Some("m4a" | "aac") => "audio/mp4",
        Some("wav") => "audio/wav",
        Some("flac") => "audio/flac",
        Some("ogg" | "opus") => "audio/ogg",
        _ => "application/octet-stream",
    }
}

fn handle(inner: Arc<Inner>, mut st: TcpStream) -> io::Result<()> {
    st.set_read_timeout(Some(Duration::from_secs(15)))?;
    st.set_write_timeout(Some(Duration::from_secs(60)))?;
    let _ = st.set_nodelay(true);
    let head = read_head(&mut st)?;
    let mut lines = head.split("\r\n");
    let req = lines.next().unwrap_or("");
    let mut it = req.split_whitespace();
    let (method, target) = (it.next().unwrap_or(""), it.next().unwrap_or(""));
    let range = lines.filter_map(|l| l.split_once(':')).find(|(k, _)| k.trim().eq_ignore_ascii_case("range")).map(|(_, v)| v.trim().to_string());
    if method == "OPTIONS" {
        return reply(&mut st, "204 No Content", &[("Access-Control-Allow-Headers", "Range".into())], Some(0));
    }
    if method != "GET" && method != "HEAD" { return reply(&mut st, "405 Method Not Allowed", &[], Some(0)); }
    let path = target.split('?').next().unwrap_or("");
    let mut seg = path.trim_start_matches('/').splitn(2, '/');
    let (tok, key) = (seg.next().unwrap_or(""), seg.next().unwrap_or(""));
    if tok != inner.token { return reply(&mut st, "404 Not Found", &[], Some(0)); }
    let route = inner.routes.lock().unwrap().get(key).cloned();
    match route {
        Some(Route::File(p)) => serve_file(&mut st, &p, range.as_deref(), method == "HEAD"),
        Some(Route::Live(args)) => serve_live(&inner, key, &mut st, &args, range.as_deref(), method == "HEAD"),
        None => reply(&mut st, "404 Not Found", &[], Some(0)),
    }
}

fn serve_file(st: &mut TcpStream, p: &Path, range: Option<&str>, head: bool) -> io::Result<()> {
    let Ok(mut f) = File::open(p) else { return reply(st, "404 Not Found", &[], Some(0)) };
    let len = f.metadata()?.len();
    let (a, b, partial) = match range {
        Some(r) => match parse_range(r, len) {
            Some((a, b)) => (a, b, true),
            None => return reply(st, "416 Range Not Satisfiable", &[("Content-Range", format!("bytes */{len}"))], Some(0)),
        },
        None => (0, len.saturating_sub(1), false),
    };
    let n = if len == 0 { 0 } else { b - a + 1 };
    let mut h = vec![("Content-Type", mime_of(p).to_string()), ("Accept-Ranges", "bytes".to_string()), ("Cache-Control", "no-cache".to_string())];
    if partial { h.push(("Content-Range", format!("bytes {a}-{b}/{len}"))); }
    reply(st, if partial { "206 Partial Content" } else { "200 OK" }, &h, Some(n))?;
    if head || n == 0 { return Ok(()); }
    f.seek(SeekFrom::Start(a))?;
    let mut f = f.take(n);
    let mut buf = vec![0u8; 256 * 1024];
    loop {
        let k = f.read(&mut buf)?;
        if k == 0 { break; }
        st.write_all(&buf[..k])?;
    }
    Ok(())
}

fn tail(lines: &[String], n: usize) -> String { lines[lines.len().saturating_sub(n)..].join("\n") }

fn serve_live(inner: &Arc<Inner>, key: &str, st: &mut TcpStream, args: &[String], range: Option<&str>, head: bool) -> io::Result<()> {
    // é um fluxo: só dá para pedir do começo
    if let Some(r) = range {
        let from0 = r.trim().strip_prefix("bytes=").map_or(false, |x| x.trim().starts_with("0-"));
        if !from0 { return reply(st, "416 Range Not Satisfiable", &[], Some(0)); }
    }
    let hdr = [("Content-Type", "video/mp4".to_string()), ("Cache-Control", "no-store".to_string())];
    if head { return reply(st, "200 OK", &hdr, None); }
    let mut child = tools::command(&inner.ffmpeg).args(args)
        .stdin(Stdio::null()).stdout(Stdio::piped()).stderr(Stdio::piped()).spawn()?;
    let mut out = child.stdout.take().ok_or_else(|| io::Error::other("no stdout"))?;
    let err = child.stderr.take().ok_or_else(|| io::Error::other("no stderr"))?;
    let gen = inner.gen.fetch_add(1, Ordering::SeqCst) + 1;
    let old = inner.live.lock().unwrap().insert(key.to_string(), (gen, child));
    if let Some((_, mut c)) = old { let _ = c.kill(); let _ = c.wait(); }
    // andamento (-progress pipe:2) e mensagens de erro vêm juntos pelo stderr
    let (i2, k2) = (inner.clone(), key.to_string());
    let errt = std::thread::spawn(move || {
        let mut prog = Progress::default();
        let mut msg = Vec::new();
        for line in BufReader::new(err).lines().map_while(Result::ok) {
            let is_prog = line.split_once('=').map_or(false, |(k, _)| !k.is_empty() && k.chars().all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '_'));
            if is_prog {
                if prog.feed(&line) && !prog.ended { (i2.cb)(&k2, Event::Speed { speed: prog.speed, time: prog.time }); }
            } else if !line.trim().is_empty() { msg.push(line); }
        }
        msg
    });
    let mut gone = reply(st, "200 OK", &hdr, None).is_err();
    if !gone {
        let mut buf = vec![0u8; 64 * 1024];
        loop {
            let n = match out.read(&mut buf) { Ok(0) | Err(_) => break, Ok(n) => n };
            if st.write_all(&buf[..n]).is_err() { gone = true; break; }
        }
    }
    // ainda é o nosso FFmpeg? (outro play pode ter tomado o lugar e já parado este)
    let mine = {
        let mut m = inner.live.lock().unwrap();
        if m.get(key).map(|x| x.0) == Some(gen) { m.remove(key).map(|x| x.1) } else { None }
    };
    let status = mine.and_then(|mut c| { if gone { let _ = c.kill(); } c.wait().ok() });
    drop(out);
    let msgs = errt.join().unwrap_or_default();
    if let (Some(stt), false) = (status, gone) {
        (inner.cb)(key, if stt.success() { Event::Ended } else { Event::Failed(if msgs.is_empty() { "ffmpeg failed".into() } else { tail(&msgs, 4) }) });
    }
    let _ = st.flush();
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::probe::{AudioInfo, VideoInfo};

    fn info(path: &str, codec: &str, pix: &str, bits: u8, hdr: &str, audio: &[&str]) -> MediaInfo {
        MediaInfo {
            path: PathBuf::from(path), duration: 10.0,
            video: (!codec.is_empty()).then(|| VideoInfo { codec: codec.into(), pix_fmt: pix.into(), bit_depth: bits, hdr: hdr.into(), width: 1080, height: 1920, coded_width: 1920, coded_height: 1080, rotation: 90, fps: 59.94, fps_nominal: 59.94, ..Default::default() }),
            audio: audio.iter().map(|c| AudioInfo { codec: c.to_string(), channels: 2, sample_rate: 48000, ..Default::default() }).collect(),
            ..Default::default()
        }
    }

    #[test]
    fn ranges() {
        assert_eq!(parse_range("bytes=0-", 100), Some((0, 99)));
        assert_eq!(parse_range("bytes=10-19", 100), Some((10, 19)));
        assert_eq!(parse_range("bytes=90-500", 100), Some((90, 99)));
        assert_eq!(parse_range("bytes=-10", 100), Some((90, 99)));
        assert_eq!(parse_range("bytes=100-", 100), None);
        assert_eq!(parse_range("bytes=5-2", 100), None);
        assert_eq!(parse_range("items=0-", 100), None);
        assert_eq!(parse_range("bytes=0-", 0), None);
    }

    #[test]
    fn hints() {
        // celular comum: toca direto
        assert_eq!(direct_hint(&info("a.mp4", "h264", "yuv420p", 8, "", &["aac"])).as_deref(), Some("video/mp4; codecs=\"avc1.640033, mp4a.40.2\""));
        // iPhone HEVC SDR: depende do suporte do Windows (pergunta ao player)
        assert!(direct_hint(&info("IMG.MOV", "hevc", "yuv420p10le", 10, "", &["aac"])).unwrap().contains("hvc1.2"));
        // iPhone HDR, FX30 (H.264 4:2:2 10-bit + PCM), ProRes, MKV: conversão ao vivo
        assert_eq!(direct_hint(&info("IMG.MOV", "hevc", "yuv420p10le", 10, "HLG", &["aac"])), None);
        assert_eq!(direct_hint(&info("C0001.MP4", "h264", "yuv422p10le", 10, "", &["pcm_s16be"])), None);
        assert_eq!(direct_hint(&info("a.mov", "prores", "yuv422p10le", 10, "", &["pcm_s24le"])), None);
        assert_eq!(direct_hint(&info("a.mkv", "h264", "yuv420p", 8, "", &["aac"])), None);
        assert_eq!(direct_hint(&info("a.mp4", "h264", "yuv420p", 8, "", &["pcm_s16le"])), None);
        // sem áudio
        assert_eq!(direct_hint(&info("a.mp4", "h264", "yuv420p", 8, "", &[])).as_deref(), Some("video/mp4; codecs=\"avc1.640033\""));
        // só áudio
        assert_eq!(direct_hint(&info("a.mp3", "", "", 0, "", &["mp3"])).as_deref(), Some("audio/mpeg"));
        assert_eq!(direct_hint(&info("a.wav", "", "", 0, "", &["pcm_s24le"])).as_deref(), Some("audio/wav"));
        assert_eq!(direct_hint(&info("a.aiff", "", "", 0, "", &["pcm_s16be"])), None);
    }

    #[test]
    fn live_command() {
        let i = info("C:/v/C0001.MP4", "h264", "yuv422p10le", 10, "", &["pcm_s16be"]);
        let p = Preset::default();
        let o = LiveOpts { parts: vec![(2.0, 10.0)], output: true, height: 720, fps: (60000, 1001), enc: LiveEnc::Nvenc, hw: true };
        let a = live_args(&i, &p, &o).join(" ");
        assert!(a.contains("-ss 2 -display_rotation 0 -i C:/v/C0001.MP4"), "{a}");
        assert!(!a.contains("-hwaccel"), "4:2:2 10-bit vai pela CPU: {a}");
        assert!(!a.contains(" -t "), "até o fim: sem duração: {a}");
        assert!(a.contains("transpose=clock"), "{a}");
        assert!(a.contains("min(1280,iw)") && a.contains("fps=60000/1001") && a.contains("h264_nvenc"), "{a}");
        assert!(a.contains("frag_keyframe+empty_moov") && a.ends_with("pipe:1"), "{a}");
        assert!(a.contains("-g 30 "), "quadro-chave a cada 0,5 s: {a}");
        // dois trechos: duas entradas e concat, cortes em quadros exatos
        let o = LiveOpts { parts: vec![(1.0, 2.0), (5.0, 5.5)], ..o };
        let a = live_args(&i, &p, &o).join(" ");
        assert!(a.contains("-ss 1 -t 1.25") && a.contains("-ss 5 -t 0.75"), "{a}");
        assert!(a.contains("trim=end_frame=60") && a.contains("trim=end_frame=30"), "{a}");
        assert!(a.contains("atrim=end_sample=48000") && a.contains("atrim=end_sample=24000"), "{a}");
        assert!(a.contains("[v0][a0][v1][a1]concat=n=2:v=1:a=1[v][a]"), "{a}");
        // HEVC 4:2:0 lê na placa
        let i = info("IMG.MOV", "hevc", "yuv420p10le", 10, "HLG", &["aac"]);
        assert!(live_args(&i, &p, &o).join(" ").contains("-hwaccel auto"));
        assert!(!live_args(&i, &p, &LiveOpts { hw: false, ..o }).join(" ").contains("-hwaccel"));
    }
}
