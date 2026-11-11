//! Downloader: baixa vídeo ou áudio de um link com o yt-dlp (YouTube, TikTok, X, Facebook, Reddit…)
//! na maior qualidade e, com "Pronto para web", entrega H.264 + AAC em .mp4 com o índice no começo,
//! que abre no WhatsApp, no Instagram e no navegador.
//!
//! O yt-dlp e o Deno (que o YouTube exige desde o fim de 2025) não vêm no instalador: o app baixa
//! os dois na primeira vez (veja `YTDLP_URL` e `DENO_URL`). Aqui ficam o comando, a leitura do
//! andamento, a tradução dos erros e o acabamento para web; nada de rede.

use std::collections::HashMap;
use std::io::{BufRead, BufReader};
use std::path::{Path, PathBuf};
use std::process::Stdio;
use std::sync::atomic::Ordering;
use std::sync::Mutex;

#[cfg(feature = "serde")]
use serde::Serialize;

use crate::command::{hdr_chain, Encoder, Plan};
use crate::probe::{probe, MediaInfo};
use crate::render::{run_ffmpeg, Hooks, Tick};
use crate::tools;

/// yt-dlp para Windows (já traz o resolvedor de desafios do YouTube) e a lista de hashes da mesma versão.
pub const YTDLP_URL: &str = "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe";
pub const YTDLP_SUMS: &str = "https://github.com/yt-dlp/yt-dlp/releases/latest/download/SHA2-256SUMS";
/// Deno para Windows: o yt-dlp acha o `deno.exe` sozinho quando ele está na mesma pasta.
pub const DENO_URL: &str = "https://github.com/denoland/deno/releases/latest/download/deno-x86_64-pc-windows-msvc.zip";
pub const DENO_SUM: &str = "https://github.com/denoland/deno/releases/latest/download/deno-x86_64-pc-windows-msvc.zip.sha256sum";

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Kind { Video, Audio }

/// Um download pedido pela interface.
#[derive(Clone, Debug)]
pub struct Job {
    pub url: String,
    pub kind: Kind,
    /// Vídeo: deixar em H.264 + AAC .mp4 (converte só o que precisar).
    pub web: bool,
    /// Áudio: "wav", "m4a", "mp3" ou "flac".
    pub audio: String,
    /// Pasta final (ex.: Downloads\Mec Encoder).
    pub dest: PathBuf,
}

/// Programas que o download usa.
#[derive(Clone, Debug)]
pub struct Tools {
    pub ytdlp: PathBuf,
    /// Sem o Deno o YouTube não baixa; os outros sites funcionam.
    pub deno: Option<PathBuf>,
    pub ffmpeg: PathBuf,
    pub ffprobe: PathBuf,
    /// Placa (NVENC) ou CPU, para o acabamento para web.
    pub encoder: Encoder,
    /// Cache do yt-dlp (acelera o YouTube).
    pub cache: Option<PathBuf>,
    /// Sessões das contas (Instagram, YouTube...) no formato cookies.txt.
    pub cookies: Option<PathBuf>,
}

/// O que o site informa antes de baixar.
#[derive(Clone, Debug, Default, PartialEq)]
#[cfg_attr(feature = "serde", derive(Serialize), serde(rename_all = "camelCase"))]
pub struct Meta {
    pub title: String,
    /// "Youtube", "TikTok", "Twitter"... (o nome do extrator).
    pub site: String,
    pub width: u32,
    pub height: u32,
    pub fps: f64,
    pub duration: f64,
    pub vcodec: String,
    pub acodec: String,
    pub thumbnail: String,
}

/// Andamento: `stage` é "download", "merge" (juntando vídeo e áudio), "audio" (convertendo o áudio) ou "web".
#[derive(Clone, Debug, PartialEq)]
#[cfg_attr(feature = "serde", derive(Serialize), serde(rename_all = "camelCase"))]
pub struct Step {
    pub stage: String,
    /// 0..1 dentro da etapa.
    pub p: f64,
    pub done: u64,
    pub total: u64,
    /// bytes/s no download; vezes o tempo real no acabamento.
    pub speed: f64,
    pub eta: Option<f64>,
}

#[derive(Clone, Debug, PartialEq)]
pub enum Event { Meta(Meta), Step(Step) }

/// Resultado.
#[derive(Clone, Debug, Default, PartialEq)]
#[cfg_attr(feature = "serde", derive(Serialize), serde(rename_all = "camelCase"))]
pub struct Done {
    pub files: Vec<PathBuf>,
    pub size: u64,
    /// Acabamento para web: "" (não precisou ou desligado), "remux" (só reorganizou) ou "encode" (converteu).
    pub web: String,
    pub meta: Meta,
}

/// Uma linha do yt-dlp que interessa.
#[derive(Clone, Debug, PartialEq)]
pub enum Line {
    Title(String),
    Info { site: String, width: u32, height: u32, fps: f64, duration: f64, vcodec: String, acodec: String },
    Thumb(String),
    /// Partes que vão ser baixadas (formato, bytes) — vídeo e áudio separados no YouTube.
    Parts(Vec<(String, u64)>),
    Progress { done: u64, total: u64, speed: f64, eta: Option<f64>, format: String },
    /// Pós-processo do yt-dlp começou: "Merger", "ExtractAudio"...
    Post(String),
    File(PathBuf),
    Error(String),
}

const P: &str = "MEC";

fn num(s: &str) -> Option<f64> { s.trim().parse::<f64>().ok().filter(|x| x.is_finite()) }

/// Argumentos do yt-dlp. Tudo que sai vai para `work`; depois o arquivo é movido para a pasta final.
pub fn ytdlp_args(job: &Job, t: &Tools, work: &Path) -> Vec<String> {
    let mut a: Vec<String> = ["--ignore-config", "--no-playlist", "--newline", "--no-colors", "--no-mtime", "--windows-filenames",
        "--no-simulate", "--progress", "--encoding", "utf-8", "--progress-delta", "0.25", "--retries", "5", "--fragment-retries", "5"]
        .iter().map(|s| s.to_string()).collect();
    a.extend(["--ffmpeg-location".into(), t.ffmpeg.to_string_lossy().into_owned()]);
    if let Some(d) = &t.deno { a.extend(["--js-runtimes".into(), format!("deno:{}", d.display())]); }
    if let Some(c) = &t.cookies { a.extend(["--cookies".into(), c.to_string_lossy().into_owned()]); }
    match &t.cache { Some(c) => a.extend(["--cache-dir".into(), c.to_string_lossy().into_owned()]), None => a.push("--no-cache-dir".into()) }
    a.extend(["-P".into(), work.to_string_lossy().into_owned(), "-o".into(), "%(title).150B.%(ext)s".into()]);
    match job.kind {
        Kind::Video => {
            a.extend(["-f".into(), "bv*+ba/b".into()]);
            // Maior resolução e fps primeiro; empatou, prefere o que já é H.264 + AAC (evita converter).
            if job.web { a.extend(["-S".into(), "res,fps,vcodec:h264,acodec:aac".into()]); }
            a.extend(["--merge-output-format".into(), "mp4/mkv".into()]);
        }
        Kind::Audio => {
            let fmt = match job.audio.as_str() { "m4a" | "mp3" | "flac" | "wav" => job.audio.as_str(), _ => "wav" };
            a.extend(["-f".into(), "ba/b".into(), "-x".into(), "--audio-format".into(), fmt.into()]);
            match fmt { "mp3" => a.extend(["--audio-quality".into(), "320K".into()]), "m4a" => a.extend(["--audio-quality".into(), "256K".into()]), _ => {} }
        }
    }
    for p in [
        format!("before_dl:{P}T %(title)s"),
        format!("before_dl:{P}I %(extractor_key)s|%(width)s|%(height)s|%(fps)s|%(duration)s|%(vcodec)s|%(acodec)s"),
        format!("before_dl:{P}U %(thumbnail)s"),
        format!("before_dl:{P}S %(requested_formats.0.format_id)s={}|%(requested_formats.1.format_id)s={}",
                "%(requested_formats.0.filesize,requested_formats.0.filesize_approx)s", "%(requested_formats.1.filesize,requested_formats.1.filesize_approx)s"),
        format!("after_move:{P}F %(filepath)s"),
    ] { a.extend(["--print".into(), p]); }
    a.extend(["--progress-template".into(),
        format!("download:{P}P %(progress.downloaded_bytes)s|%(progress.total_bytes)s|%(progress.total_bytes_estimate)s|%(progress.speed)s|%(progress.eta)s|%(info.format_id)s")]);
    a.extend(["--progress-template".into(), format!("postprocess:{P}Q %(progress.postprocessor)s|%(progress.status)s")]);
    a.push("--".into());
    a.push(job.url.trim().to_string());
    a
}

/// Lê uma linha do yt-dlp (saída ou erro).
pub fn parse_line(s: &str) -> Option<Line> {
    let s = s.trim_end_matches(['\r', '\n']);
    if let Some(r) = s.strip_prefix("ERROR: ") { return Some(Line::Error(r.trim().to_string())); }
    let rest = s.strip_prefix(P)?;
    let (tag, v) = (rest.get(..1)?, rest.get(2..).unwrap_or(""));
    let na = |x: &str| if x == "NA" { String::new() } else { x.to_string() };
    Some(match tag {
        "T" => Line::Title(na(v)),
        "U" => Line::Thumb(na(v)),
        "F" => Line::File(PathBuf::from(v)),
        "I" => {
            let f: Vec<&str> = v.split('|').collect();
            let g = |i: usize| f.get(i).copied().unwrap_or("NA");
            Line::Info { site: na(g(0)), width: num(g(1)).unwrap_or(0.0) as u32, height: num(g(2)).unwrap_or(0.0) as u32,
                         fps: num(g(3)).unwrap_or(0.0), duration: num(g(4)).unwrap_or(0.0), vcodec: na(g(5)), acodec: na(g(6)) }
        }
        "S" => Line::Parts(v.split('|').filter_map(|p| {
            let (id, size) = p.split_once('=')?;
            (id != "NA" && !id.is_empty()).then(|| (id.to_string(), num(size).unwrap_or(0.0).max(0.0) as u64))
        }).collect()),
        "P" => {
            let f: Vec<&str> = v.split('|').collect();
            let g = |i: usize| f.get(i).copied().unwrap_or("NA");
            let total = num(g(1)).or_else(|| num(g(2))).unwrap_or(0.0).max(0.0) as u64;
            Line::Progress { done: num(g(0)).unwrap_or(0.0).max(0.0) as u64, total, speed: num(g(3)).unwrap_or(0.0),
                             eta: num(g(4)), format: na(g(5)) }
        }
        "Q" => {
            let (name, status) = v.split_once('|').unwrap_or((v, ""));
            if status != "started" { return None; }
            Line::Post(name.to_string())
        }
        _ => return None,
    })
}

/// Traduz o erro do yt-dlp num código que a interface explica. "dl-broken" = o site mudou:
/// vale atualizar o yt-dlp e tentar de novo.
pub fn classify(err: &str) -> &'static str {
    let e = err.to_lowercase();
    let has = |xs: &[&str]| xs.iter().any(|x| e.contains(x));
    if has(&["no space left", "not enough space on the disk"]) { return "disk-full"; }
    if has(&["drm protect", "this video is drm", " drm"]) { return "dl-drm"; }
    if has(&["private video", "this video is private", "this account is private", "private account", "is private"]) { return "dl-private"; }
    if has(&["sign in to confirm your age", "age-restricted", "age restricted", "inappropriate for some users", "confirm your age"]) { return "dl-age"; }
    if has(&["sign in to confirm you", "login required", "requires login", "log in to", "logged-in", "--cookies", "cookies-from-browser",
             "rate-limit reached or login required", "you need to log in", "not logged in", "authentication", "account cookies"]) { return "dl-login"; }
    if has(&["this live event will begin", "premieres in", "live event", "is currently live", "will begin in"]) { return "dl-live"; }
    if has(&["not available in your country", "geo restrict", "geo-restrict", "geoblocked", "not available from your location"]) { return "dl-geo"; }
    if has(&["unsupported url"]) { return "dl-unsupported"; }
    if has(&["is not a valid url", "invalid url", "no such file or directory"]) { return "dl-badlink"; }
    if has(&["video unavailable", "has been removed", "no longer available", "does not exist", "http error 404", "content isn't available",
             "content is not available", "no video could be found", "there's no video", "no video formats found", "this post is unavailable",
             "has been deleted", "post not found", "no media found"]) { return "dl-unavailable"; }
    if has(&["getaddrinfo failed", "name or service not known", "temporary failure in name resolution", "failed to resolve",
             "network is unreachable", "timed out", "connection reset", "connection refused", "connection aborted", "no route to host",
             "unable to connect", "proxyerror", "tunnel connection failed", "ssl:"]) { return "dl-network"; }
    if has(&["unable to extract", "nsig extraction failed", "signature extraction failed", "please report this issue",
             "unable to download api page", "http error 403", "requested format is not available", "unable to download json",
             "n challenge solving failed", "challenge"]) { return "dl-broken"; }
    "unknown"
}

/// Um cookie de uma sessão (lido da janela de login).
#[derive(Clone, Debug, PartialEq)]
pub struct Cookie {
    pub name: String,
    pub value: String,
    /// Domínio (sem o ponto do começo); vazio = só o endereço da página.
    pub domain: String,
    pub path: String,
    pub secure: bool,
    pub http_only: bool,
    /// Segundos desde 1970; None = cookie de sessão.
    pub expires: Option<i64>,
}

/// Cookies no formato que o yt-dlp lê (Netscape cookies.txt). `host` vale para cookie sem domínio;
/// cookie de sessão ganha validade de um ano (senão o yt-dlp descarta). Repetidos ficam uma vez só.
pub fn netscape(cookies: &[Cookie], host: &str, now: i64) -> String {
    let mut seen = std::collections::HashSet::new();
    let mut out = String::new();
    for c in cookies {
        if c.name.is_empty() || c.value.contains(['\t', '\n', '\r']) || c.name.contains(['\t', '\n', '\r']) { continue; }
        let d = c.domain.trim().trim_start_matches('.');
        let (dom, sub) = if d.is_empty() { (host.to_string(), "FALSE") } else { (format!(".{d}"), "TRUE") };
        let path = if c.path.is_empty() { "/" } else { c.path.as_str() };
        if !seen.insert((dom.clone(), c.name.clone(), path.to_string())) { continue; }
        let exp = c.expires.filter(|e| *e > 0).unwrap_or(now + 365 * 86_400);
        let pre = if c.http_only { "#HttpOnly_" } else { "" };
        out.push_str(&format!("{pre}{dom}\t{sub}\t{path}\t{}\t{exp}\t{}\t{}\n", if c.secure { "TRUE" } else { "FALSE" }, c.name, c.value));
    }
    out
}

/// Junta os arquivos de sessão de cada conta num só (o yt-dlp aceita um arquivo).
pub fn merge_cookie_files(files: &[PathBuf]) -> String {
    let mut out = String::from("# Netscape HTTP Cookie File\n");
    for f in files { if let Ok(t) = std::fs::read_to_string(f) { for l in t.lines().filter(|l| !l.trim().is_empty() && (!l.starts_with('#') || l.starts_with("#HttpOnly_"))) { out.push_str(l); out.push('\n'); } } }
    out
}

/// Já está pronto para web (H.264 8-bit 4:2:0 + AAC, sem giro pendente)?
pub fn web_video_ok(info: &MediaInfo) -> bool {
    info.video.as_ref().map_or(true, |v| v.codec == "h264" && matches!(v.pix_fmt.as_str(), "yuv420p" | "yuvj420p") && v.rotation == 0 && v.hdr.is_empty())
}
pub fn web_audio_ok(info: &MediaInfo) -> bool { info.audio.first().map_or(true, |a| a.codec == "aac") }

/// Comando do acabamento para web. Devolve se converte ("encode") ou só reorganiza ("remux").
pub fn web_args(info: &MediaInfo, input: &Path, output: &Path, enc: &Encoder) -> (&'static str, Vec<String>) {
    let mut a: Vec<String> = ["-nostdin", "-hide_banner", "-v", "error", "-y", "-i"].iter().map(|s| s.to_string()).collect();
    a.push(input.to_string_lossy().into_owned());
    let (vok, aok) = (web_video_ok(info), web_audio_ok(info));
    if info.video.is_some() { a.extend(["-map".into(), "0:v:0".into()]); }
    if !info.audio.is_empty() { a.extend(["-map".into(), "0:a:0".into()]); }
    if let Some(v) = info.video.as_ref() {
        if vok {
            a.extend(["-c:v".into(), "copy".into()]);
        } else {
            let mut vf: Vec<String> = Vec::new();
            if !v.hdr.is_empty() { vf.extend(hdr_chain(v)); }
            // H.264 4:2:0 precisa de largura e altura pares
            let (w, h) = (v.width, v.height);
            if w % 2 == 1 || h % 2 == 1 { vf.push("scale=trunc(iw/2)*2:trunc(ih/2)*2".into()); }
            vf.push("format=yuv420p".into());
            a.extend(["-vf".into(), vf.join(",")]);
            match enc {
                Encoder::Nvenc => a.extend(["-c:v", "h264_nvenc", "-preset", "p5", "-tune", "hq", "-rc", "vbr", "-cq", "20", "-b:v", "0", "-profile:v", "high"].map(String::from)),
                Encoder::Cpu { .. } => a.extend(["-c:v", "libx264", "-preset", "veryfast", "-crf", "19", "-profile:v", "high"].map(String::from)),
            }
            if !v.hdr.is_empty() || v.primaries.is_empty() {
                a.extend(["-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709"].map(String::from));
            }
        }
    }
    if !info.audio.is_empty() {
        if aok { a.extend(["-c:a".into(), "copy".into()]); }
        else {
            let k = info.audio[0].bitrate_kbps;
            let kbps = if k == 0 { 192 } else { k.clamp(128, 320) };
            a.extend(["-c:a".into(), "aac".into(), "-b:a".into(), format!("{kbps}k")]);
            // AAC aceita até 48 kHz no WhatsApp; Opus do YouTube já é 48 kHz
            if info.audio[0].sample_rate > 48000 { a.extend(["-ar".into(), "48000".into()]); }
        }
    }
    a.extend(["-map_metadata", "-1", "-movflags", "+faststart", "-progress", "pipe:1", "-nostats"].map(String::from));
    a.push(output.to_string_lossy().into_owned());
    (if vok && aok { "remux" } else { "encode" }, a)
}

/// Caminho livre na pasta: "Nome.mp4", "Nome (2).mp4"...
pub fn free_path(dir: &Path, stem: &str, ext: &str) -> PathBuf {
    let stem = { let s = stem.trim().trim_end_matches('.'); if s.is_empty() { "video" } else { s } };
    let mk = |n: u32| dir.join(if n < 2 { format!("{stem}.{ext}") } else { format!("{stem} ({n}).{ext}") });
    (1..10_000).map(mk).find(|p| !p.exists()).unwrap_or_else(|| mk(10_000))
}

/// Move (ou copia, se for outro disco).
fn move_file(from: &Path, to: &Path) -> Result<(), String> {
    if std::fs::rename(from, to).is_ok() { return Ok(()); }
    std::fs::copy(from, to).map_err(|e| e.to_string())?;
    let _ = std::fs::remove_file(from);
    Ok(())
}

/// Mata o processo e os filhos dele (o yt-dlp chama o ffmpeg para juntar vídeo e áudio).
pub fn kill_tree(child: &mut std::process::Child) {
    #[cfg(windows)]
    {
        let _ = tools::command(Path::new("taskkill")).args(["/PID", &child.id().to_string(), "/T", "/F"])
            .stdout(Stdio::null()).stderr(Stdio::null()).status();
    }
    let _ = child.kill();
}

/// Versão do yt-dlp instalado ("2026.10.26").
pub fn version(ytdlp: &Path) -> Option<String> {
    let o = tools::command(ytdlp).arg("--version").stdin(Stdio::null()).output().ok()?;
    let v = String::from_utf8_lossy(&o.stdout).trim().to_string();
    (o.status.success() && !v.is_empty()).then_some(v)
}

/// Atualiza o yt-dlp (ele mesmo troca o .exe). Devolve a versão depois.
pub fn self_update(ytdlp: &Path) -> Result<String, String> {
    let o = tools::command(ytdlp).args(["-U", "--no-colors"]).stdin(Stdio::null()).output().map_err(|e| e.to_string())?;
    if !o.status.success() { return Err(String::from_utf8_lossy(&o.stderr).trim().to_string()); }
    version(ytdlp).ok_or_else(|| "yt-dlp not working after update".into())
}

/// Baixa um link. Bloqueia até terminar; `h.cancel` + `h.children` param no meio.
/// `work` é uma pasta só deste download (apagada no fim, com o que sobrar).
pub fn run(job: &Job, t: &Tools, work: &Path, h: &Hooks, on: &(dyn Fn(Event) + Sync)) -> Result<Done, String> {
    let _ = std::fs::remove_dir_all(work);
    std::fs::create_dir_all(work).map_err(|e| e.to_string())?;
    std::fs::create_dir_all(&job.dest).map_err(|e| format!("{e} ({})", job.dest.display()))?;
    let res = run_inner(job, t, work, h, on);
    let _ = std::fs::remove_dir_all(work);
    res
}

fn run_inner(job: &Job, t: &Tools, work: &Path, h: &Hooks, on: &(dyn Fn(Event) + Sync)) -> Result<Done, String> {
    let args = ytdlp_args(job, t, work);
    (h.log)(&format!("download | {} | yt-dlp {}", job.url, args.join(" ")));
    let mut child = tools::command(&t.ytdlp).args(&args)
        .env("PYTHONIOENCODING", "utf-8").env("PYTHONUTF8", "1")
        .stdin(Stdio::null()).stdout(Stdio::piped()).stderr(Stdio::piped())
        .spawn().map_err(|e| format!("yt-dlp: {e}"))?;
    let stdout = child.stdout.take().ok_or("no stdout")?;
    let stderr = child.stderr.take().ok_or("no stderr")?;
    h.children.lock().unwrap().insert(h.id, child);
    if h.cancel.load(Ordering::SeqCst) { if let Some(c) = h.children.lock().unwrap().get_mut(&h.id) { kill_tree(c); } }

    let st = Mutex::new(State::default());
    let errors = Mutex::new(Vec::<String>::new());
    let tail = Mutex::new(Vec::<String>::new());
    let handle = |line: &str| {
        let Some(l) = parse_line(line) else {
            let mut t = tail.lock().unwrap();
            if !line.trim().is_empty() { t.push(line.trim().to_string()); if t.len() > 6 { t.remove(0); } }
            return;
        };
        let mut s = st.lock().unwrap();
        match l {
            Line::Error(e) => errors.lock().unwrap().push(e),
            Line::Title(x) => { s.meta.title = x; }
            Line::Thumb(x) => { s.meta.thumbnail = x; }
            Line::Info { site, width, height, fps, duration, vcodec, acodec } => {
                s.meta.site = site; s.meta.width = width; s.meta.height = height; s.meta.fps = fps; s.meta.duration = duration;
                s.meta.vcodec = vcodec; s.meta.acodec = acodec;
                on(Event::Meta(s.meta.clone()));
            }
            Line::Parts(p) => { s.parts = p; }
            Line::Progress { done, total, speed, eta, format } => {
                if let Some(step) = s.progress(done, total, speed, eta, &format) { on(Event::Step(step)); }
            }
            Line::Post(name) => {
                let stage = if name.contains("Merger") { "merge" } else if name.contains("ExtractAudio") { "audio" } else { return };
                on(Event::Step(Step { stage: stage.into(), p: 0.0, done: 0, total: 0, speed: 0.0, eta: None }));
            }
            Line::File(f) => s.files.push(f),
        }
    };
    std::thread::scope(|sc| {
        let hd = &handle;
        sc.spawn(move || { for l in BufReader::new(stderr).lines().map_while(Result::ok) { hd(&l); } });
        let mut r = BufReader::new(stdout);
        let mut buf = Vec::new();
        // lê em bytes: um título com caractere inválido não pode derrubar a leitura
        while r.read_until(b'\n', &mut buf).map_or(false, |n| n > 0) {
            hd(&String::from_utf8_lossy(&buf));
            buf.clear();
        }
    });
    let status = h.children.lock().unwrap().remove(&h.id).map(|mut c| c.wait());
    if h.cancel.load(Ordering::SeqCst) { return Err("cancelled".into()); }
    let s = st.into_inner().unwrap();
    let errs = errors.into_inner().unwrap();
    let ok = matches!(status, Some(Ok(x)) if x.success());
    let mut files: Vec<PathBuf> = s.files.iter().filter(|f| f.is_file()).cloned().collect();
    // o caminho que o yt-dlp imprimiu não bateu (acento ou símbolo no título, em outra codificação):
    // a pasta de trabalho é só deste download, então o que sobrou nela é o resultado
    if ok && files.is_empty() { files = leftovers(work); }
    if !ok || files.is_empty() {
        let detail = if !errs.is_empty() { errs.join(" / ") } else { tail.into_inner().unwrap().join(" / ") };
        let detail = if detail.is_empty() { "yt-dlp failed".to_string() } else { detail };
        (h.log)(&format!("download | {} | error: {detail}", job.url));
        let code = classify(&detail);
        return Err(if code == "unknown" { detail } else { format!("{code}|{detail}") });
    }

    // acabamento e mudança para a pasta final
    let mut out = Done { meta: s.meta.clone(), ..Default::default() };
    for f in files {
        let stem = f.file_stem().map(|x| x.to_string_lossy().into_owned()).unwrap_or_default();
        let ext = f.extension().map(|x| x.to_string_lossy().to_lowercase()).unwrap_or_default();
        let finished = if job.kind == Kind::Video && job.web {
            let info = probe(&t.ffprobe, &f).map_err(|e| format!("output check failed: {e}"))?;
            if info.video.is_none() && info.audio.is_empty() { return Err("output check failed: empty file".into()); }
            let dest = free_path(&job.dest, &stem, "mp4");
            let tmp = work.join(format!("web-{}.mp4", out.files.len()));
            let (mode, args) = web_args(&info, &f, &tmp, &t.encoder);
            // já é .mp4 H.264 + AAC: só reorganiza (índice no começo), leva um segundo
            let label = if mode == "encode" { "web" } else { "remux" };
            on(Event::Step(Step { stage: label.into(), p: 0.0, done: 0, total: 0, speed: 0.0, eta: None }));
            let progress = |tk: &Tick| on(Event::Step(Step { stage: label.into(), p: tk.p, done: 0, total: 0, speed: tk.speed, eta: tk.eta }));
            let hh = Hooks { id: h.id, children: h.children, cancel: h.cancel, progress: &progress, log: h.log, started: h.started };
            (h.log)(&format!("download | {} | {mode} | ffmpeg {}", job.url, args.join(" ")));
            let plan = Plan { args, output: tmp.clone(), ..Default::default() };
            run_ffmpeg(&t.ffmpeg, &plan, info.duration, label, &hh)?;
            if mode == "encode" || out.web.is_empty() { out.web = mode.into(); }
            move_file(&tmp, &dest)?;
            dest
        } else {
            let dest = free_path(&job.dest, &stem, &ext);
            move_file(&f, &dest)?;
            dest
        };
        out.size += std::fs::metadata(&finished).map(|m| m.len()).unwrap_or(0);
        out.files.push(finished);
    }
    (h.log)(&format!("download | {} | ok | {}", job.url, out.files.iter().map(|f| f.display().to_string()).collect::<Vec<_>>().join(", ")));
    Ok(out)
}

/// Arquivos prontos numa pasta de trabalho (sem pedaços .part, .ytdl, .temp ou do acabamento).
pub fn leftovers(work: &Path) -> Vec<PathBuf> {
    let mut v: Vec<(u64, PathBuf)> = std::fs::read_dir(work).into_iter().flatten().flatten()
        .map(|e| e.path())
        .filter(|p| p.is_file())
        .filter(|p| {
            let name = p.file_name().map(|n| n.to_string_lossy().to_lowercase()).unwrap_or_default();
            !(name.ends_with(".part") || name.ends_with(".ytdl") || name.contains(".temp.") || name.contains(".part-frag")
              || name.starts_with("web-") || name.ends_with(".json") || name.ends_with(".jpg") || name.ends_with(".webp"))
        })
        .map(|p| (std::fs::metadata(&p).map(|m| m.len()).unwrap_or(0), p))
        .collect();
    v.sort_by(|a, b| b.0.cmp(&a.0));
    v.into_iter().map(|x| x.1).collect()
}

/// Junta o andamento das partes (vídeo e áudio vêm separados no YouTube) numa porcentagem só.
#[derive(Default)]
struct State {
    meta: Meta,
    parts: Vec<(String, u64)>,
    files: Vec<PathBuf>,
    /// formato baixando agora e os que já terminaram
    current: String,
    finished: HashMap<String, u64>,
}

impl State {
    fn progress(&mut self, done: u64, total: u64, speed: f64, eta: Option<f64>, format: &str) -> Option<Step> {
        if !self.current.is_empty() && self.current != format {
            let prev = std::mem::take(&mut self.current);
            let size = self.parts.iter().find(|p| p.0 == prev).map_or(0, |p| p.1);
            self.finished.insert(prev, size);
        }
        self.current = format.to_string();
        let known: u64 = self.parts.iter().map(|p| p.1).sum();
        let n = self.parts.len().max(1);
        let fin_bytes: u64 = self.finished.values().sum();
        let (p, all_done, all_total) = if self.parts.len() > 1 && known > 0 {
            let all = known.max(fin_bytes + total);
            (((fin_bytes + done) as f64 / all as f64).min(1.0), fin_bytes + done, all)
        } else {
            let frac = if total > 0 { done as f64 / total as f64 } else { 0.0 };
            (((self.finished.len() as f64 + frac) / n as f64).min(1.0), done, total)
        };
        Some(Step { stage: "download".into(), p, done: all_done, total: all_total, speed, eta })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn job(kind: Kind, web: bool) -> Job { Job { url: "https://youtu.be/abc".into(), kind, web, audio: "wav".into(), dest: "/d".into() } }
    fn tools_() -> Tools {
        Tools { ytdlp: "/t/yt-dlp".into(), deno: Some("/t/deno".into()), ffmpeg: "/f/ffmpeg".into(), ffprobe: "/f/ffprobe".into(),
                encoder: Encoder::Nvenc, cache: None, cookies: None }
    }

    #[test]
    fn args_video_and_audio() {
        let a = ytdlp_args(&job(Kind::Video, true), &tools_(), Path::new("/w")).join(" ");
        assert!(a.contains("-f bv*+ba/b -S res,fps,vcodec:h264,acodec:aac --merge-output-format mp4/mkv"), "{a}");
        assert!(a.contains("--js-runtimes deno:/t/deno"), "{a}");
        assert!(a.contains("--no-playlist") && a.contains("--ignore-config") && a.contains("--encoding utf-8"), "{a}");
        assert!(a.ends_with("-- https://youtu.be/abc"), "{a}");
        let b = ytdlp_args(&job(Kind::Video, false), &tools_(), Path::new("/w")).join(" ");
        assert!(!b.contains("vcodec:h264"), "{b}");
        let mut j = job(Kind::Audio, true); j.audio = "mp3".into();
        let c = ytdlp_args(&j, &tools_(), Path::new("/w")).join(" ");
        assert!(c.contains("-f ba/b -x --audio-format mp3 --audio-quality 320K"), "{c}");
        j.audio = "wav".into();
        assert!(ytdlp_args(&j, &tools_(), Path::new("/w")).join(" ").contains("--audio-format wav"));
        // link que começa com "-" não vira opção
        j.url = "--exec rm".into();
        let d = ytdlp_args(&j, &tools_(), Path::new("/w"));
        assert_eq!(&d[d.len() - 2..], &["--".to_string(), "--exec rm".to_string()]);
    }

    #[test]
    fn lines() {
        assert_eq!(parse_line("MECT Honesty Drop | with Porsche"), Some(Line::Title("Honesty Drop | with Porsche".into())));
        assert_eq!(parse_line("MECI TikTok|1080|1920|60.0|42.5|h264|aac"), Some(Line::Info { site: "TikTok".into(), width: 1080, height: 1920, fps: 60.0, duration: 42.5, vcodec: "h264".into(), acodec: "aac".into() }));
        assert_eq!(parse_line("MECI Youtube|NA|NA|NA|NA|NA|opus"), Some(Line::Info { site: "Youtube".into(), width: 0, height: 0, fps: 0.0, duration: 0.0, vcodec: String::new(), acodec: "opus".into() }));
        assert_eq!(parse_line("MECS 313=104857600|251=NA"), Some(Line::Parts(vec![("313".into(), 104857600), ("251".into(), 0)])));
        assert_eq!(parse_line("MECS NA=NA|NA=NA"), Some(Line::Parts(vec![])));
        assert_eq!(parse_line("MECP 1024|NA|4096.5|2048.0|3|313\r\n"), Some(Line::Progress { done: 1024, total: 4096, speed: 2048.0, eta: Some(3.0), format: "313".into() }));
        assert_eq!(parse_line("MECQ Merger|started"), Some(Line::Post("Merger".into())));
        assert_eq!(parse_line("MECQ Merger|finished"), None);
        assert_eq!(parse_line("MECF C:\\Users\\Hugo\\x.mp4"), Some(Line::File("C:\\Users\\Hugo\\x.mp4".into())));
        assert_eq!(parse_line("ERROR: [youtube] abc: Private video"), Some(Line::Error("[youtube] abc: Private video".into())));
        assert_eq!(parse_line("[download] Destination: x"), None);
    }

    #[test]
    fn progress_of_two_parts() {
        let mut s = State { parts: vec![("v".into(), 900), ("a".into(), 100)], ..Default::default() };
        assert!((s.progress(450, 900, 1.0, None, "v").unwrap().p - 0.45).abs() < 1e-9);
        assert!((s.progress(50, 100, 1.0, None, "a").unwrap().p - 0.95).abs() < 1e-9);
        // tamanhos desconhecidos: metade para cada parte
        let mut u = State { parts: vec![("v".into(), 0), ("a".into(), 0)], ..Default::default() };
        assert!((u.progress(5, 10, 1.0, None, "v").unwrap().p - 0.25).abs() < 1e-9);
        assert!((u.progress(10, 10, 1.0, None, "a").unwrap().p - 1.0).abs() < 1e-9);
        // um arquivo só
        let mut o = State::default();
        assert!((o.progress(3, 4, 1.0, None, "18").unwrap().p - 0.75).abs() < 1e-9);
    }

    #[test]
    fn errors_classified() {
        assert_eq!(classify("[youtube] x: Private video. Sign in if you've been granted access"), "dl-private");
        assert_eq!(classify("[youtube] x: Sign in to confirm you’re not a bot. Use --cookies-from-browser"), "dl-login");
        assert_eq!(classify("[Instagram] x: Requested content is not available, rate-limit reached or login required"), "dl-login");
        assert_eq!(classify("[youtube] x: Sign in to confirm your age"), "dl-age");
        assert_eq!(classify("Unsupported URL: https://example.com/"), "dl-unsupported");
        assert_eq!(classify("[youtube] x: Video unavailable. This video has been removed by the uploader"), "dl-unavailable");
        assert_eq!(classify("[youtube] x: This live event will begin in 3 hours"), "dl-live");
        assert_eq!(classify("Unable to download webpage: <urlopen error [Errno 11001] getaddrinfo failed>"), "dl-network");
        assert_eq!(classify("[youtube] x: nsig extraction failed: Some formats may be missing"), "dl-broken");
        assert_eq!(classify("[TikTok] x: Unable to extract universal data for rehydration; please report this issue"), "dl-broken");
        assert_eq!(classify("[youtube] x: Unable to download API page: ('Unable to connect to proxy', OSError('Tunnel connection failed: 403 Forbidden')); please report this issue"), "dl-network");
        assert_eq!(classify("something new"), "unknown");
    }

    #[test]
    fn cookies_file() {
        let c = |name: &str, domain: &str, http_only: bool, expires: Option<i64>| Cookie { name: name.into(), value: "v1".into(), domain: domain.into(), path: "/".into(), secure: true, http_only, expires };
        let t = netscape(&[c("sessionid", ".instagram.com", true, Some(2_000_000_000)), c("csrftoken", "instagram.com", false, None),
                           c("sessionid", "instagram.com", true, Some(1)), c("host", "", false, None)], "www.instagram.com", 1_700_000_000);
        let lines: Vec<&str> = t.lines().collect();
        assert_eq!(lines.len(), 3, "{t}");
        assert_eq!(lines[0], "#HttpOnly_.instagram.com\tTRUE\t/\tTRUE\t2000000000\tsessionid\tv1");
        assert_eq!(lines[1], ".instagram.com\tTRUE\t/\tTRUE\t1731536000\tcsrftoken\tv1");
        assert_eq!(lines[2], "www.instagram.com\tFALSE\t/\tTRUE\t1731536000\thost\tv1");
        let d = std::env::temp_dir().join(format!("mec-ck-{}", std::process::id()));
        std::fs::create_dir_all(&d).unwrap();
        std::fs::write(d.join("a.txt"), "# Netscape HTTP Cookie File\n.a.com\tTRUE\t/\tTRUE\t1\tx\ty\n").unwrap();
        std::fs::write(d.join("b.txt"), "#HttpOnly_.b.com\tTRUE\t/\tTRUE\t1\tx\ty\n").unwrap();
        let m = merge_cookie_files(&[d.join("a.txt"), d.join("b.txt"), d.join("nao-existe.txt")]);
        assert_eq!(m, "# Netscape HTTP Cookie File\n.a.com\tTRUE\t/\tTRUE\t1\tx\ty\n#HttpOnly_.b.com\tTRUE\t/\tTRUE\t1\tx\ty\n");
        let _ = std::fs::remove_dir_all(&d);
    }

    #[test]
    fn leftover_files() {
        let d = std::env::temp_dir().join(format!("mec-left-{}", std::process::id()));
        std::fs::create_dir_all(&d).unwrap();
        std::fs::write(d.join("piter · Editor.mp4"), vec![0u8; 50]).unwrap();
        std::fs::write(d.join("x.f137.mp4.part"), b"x").unwrap();
        std::fs::write(d.join("x.temp.mp4"), b"x").unwrap();
        assert_eq!(leftovers(&d), vec![d.join("piter · Editor.mp4")]);
        let _ = std::fs::remove_dir_all(&d);
    }

    #[test]
    fn names() {
        let d = std::env::temp_dir().join(format!("mec-free-{}", std::process::id()));
        std::fs::create_dir_all(&d).unwrap();
        assert_eq!(free_path(&d, "Clip", "mp4"), d.join("Clip.mp4"));
        std::fs::write(d.join("Clip.mp4"), b"x").unwrap();
        assert_eq!(free_path(&d, "Clip", "mp4"), d.join("Clip (2).mp4"));
        assert_eq!(free_path(&d, " . ", "mp4"), d.join("video.mp4"));
        let _ = std::fs::remove_dir_all(&d);
    }
}
