//! Renderiza um arquivo do começo ao fim: escolhe o caminho (GPU, NVDEC, CPU), roda o FFmpeg,
//! tenta o próximo caminho se um falhar e confere o arquivo novo. Usado pelo app e pela linha de comando (mec.exe).

use std::collections::HashMap;
use std::io::{BufRead, BufReader, Read};
use std::path::{Path, PathBuf};
use std::process::{Child, Stdio};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;
use std::time::{Duration, Instant};

use crate::command::{self, Decode, Naming, Plan};
use crate::progress::Progress;
use crate::{probe, tools, Encoder, MediaInfo, Preset};

/// FFmpeg encontrado e o que a máquina tem.
#[derive(Clone, Debug)]
pub struct Engine {
    pub ffmpeg: PathBuf,
    pub ffprobe: PathBuf,
    /// NVENC, ou CPU quando não há placa NVIDIA.
    pub encoder: Encoder,
    /// Nome da placa (ex.: "NVIDIA GeForce RTX 3070").
    pub gpu: Option<String>,
}

impl Engine {
    /// Procura o ffmpeg/ffprobe nas pastas dadas (e no PATH) e testa o NVENC.
    pub fn detect(dirs: &[PathBuf]) -> Option<Engine> {
        let ffmpeg = tools::find("ffmpeg", dirs)?;
        let ffprobe = tools::find("ffprobe", dirs)?;
        let encoder = if tools::nvenc_available(&ffmpeg) { Encoder::Nvenc } else { Encoder::Cpu { preset: "medium".into() } };
        Some(Engine { ffmpeg, ffprobe, encoder, gpu: tools::gpu_name() })
    }
}

/// Andamento de um render.
#[derive(Clone, Debug, Default, PartialEq)]
pub struct Tick {
    /// 0..1
    pub p: f64,
    pub fps: f64,
    pub speed: f64,
    /// Segundos que faltam.
    pub eta: Option<f64>,
    /// "gpu", "nvdec", "cpu", "cpu-encode", "audio" ou "image".
    pub mode: String,
}

/// Como o render conversa com quem chamou.
pub struct Hooks<'a> {
    /// Identifica o processo do FFmpeg em `children` (para parar).
    pub id: u64,
    /// FFmpeg rodando agora; parar = matar o processo daqui.
    pub children: &'a Mutex<HashMap<u64, Child>>,
    pub cancel: &'a AtomicBool,
    pub progress: &'a (dyn Fn(&Tick) + Sync),
    pub log: &'a (dyn Fn(&str) + Sync),
    /// Chamado com o caminho de saída antes de começar a gravar (para apagar se ficar pela metade).
    pub started: &'a (dyn Fn(&Path) + Sync),
}

/// Resultado de um render que deu certo.
#[derive(Clone, Debug, PartialEq)]
pub struct Done {
    pub output: PathBuf,
    pub size: u64,
    pub warnings: Vec<String>,
    /// Caminho usado ("gpu", "nvdec", "cpu", "cpu-encode", "audio", "image").
    pub mode: String,
    pub seconds: f64,
    /// O preset pede para mandar o original para a Lixeira (nunca quando é só um trecho).
    pub delete_source: bool,
    /// Todos os arquivos gravados (mais de um quando os trechos saem separados).
    pub parts: Vec<PathBuf>,
}

fn last_lines(s: &str, n: usize) -> String {
    let lines: Vec<&str> = s.lines().filter(|l| !l.trim().is_empty()).collect();
    lines[lines.len().saturating_sub(n)..].join("\n")
}

/// Mata todos os FFmpeg desta lista.
pub fn kill_all(children: &Mutex<HashMap<u64, Child>>) {
    for c in children.lock().unwrap().values_mut() { let _ = c.kill(); }
}

/// Roda um comando do FFmpeg e devolve a velocidade média.
pub fn run_ffmpeg(ffmpeg: &Path, plan: &Plan, duration: f64, mode: &str, h: &Hooks) -> Result<f64, String> {
    let mut child = tools::command(ffmpeg).args(&plan.args)
        .stdin(Stdio::null()).stdout(Stdio::piped()).stderr(Stdio::piped())
        .spawn().map_err(|e| e.to_string())?;
    let stdout = child.stdout.take().ok_or("no stdout")?;
    let mut stderr = child.stderr.take().ok_or("no stderr")?;
    let err_thread = std::thread::spawn(move || { let mut s = String::new(); let _ = stderr.read_to_string(&mut s); s });
    h.children.lock().unwrap().insert(h.id, child);
    if h.cancel.load(Ordering::SeqCst) { kill_all(h.children); }

    let mut prog = Progress::default();
    let mut last = Instant::now() - Duration::from_secs(1);
    for line in BufReader::new(stdout).lines().map_while(Result::ok) {
        if prog.feed(&line) && last.elapsed() > Duration::from_millis(200) {
            last = Instant::now();
            (h.progress)(&Tick { p: prog.fraction(duration), fps: prog.fps, speed: prog.speed, eta: prog.eta(duration), mode: mode.into() });
        }
    }
    let status = h.children.lock().unwrap().remove(&h.id).map(|mut c| c.wait());
    let err = err_thread.join().unwrap_or_default();
    if h.cancel.load(Ordering::SeqCst) { return Err("cancelled".into()); }
    match status {
        Some(Ok(s)) if s.success() => Ok(prog.speed),
        _ => Err(if err.trim().is_empty() { "ffmpeg failed".into() } else { last_lines(&err, 4) }),
    }
}

/// Confere o arquivo e o preset e troca as opções "Original" pelos valores deste arquivo.
fn prepare(info: &MediaInfo, cfg: &Preset, cutting: bool) -> Result<Preset, String> {
    if !info.path.exists() { return Err("source-missing".into()); }
    let mut cfg = command::resolve(info, cfg);
    // Com cortes, "Apagar o original" vale do mesmo jeito: ele só vai para a Lixeira (dá para recuperar)
    // depois que todos os cortes saíram e foram conferidos.
    let _ = cutting;
    if info.is_image && !cfg.is_image() { return Err("need-image-preset".into()); }
    if cfg.is_image() && !info.is_image { return Err("not-image".into()); }
    if cfg.is_audio() && info.audio.is_empty() { return Err("no-audio".into()); }
    if cfg.is_gif() && info.video.is_none() { return Err("no-video".into()); }
    Ok(cfg)
}

/// Onde o arquivo novo vai ficar (preset já resolvido).
fn out_path(info: &MediaInfo, cfg: &Preset, nm: &Naming) -> PathBuf {
    if cfg.is_audio() && cfg.audio.codec == "copy" {
        // cópia de áudio: a extensão segue o codec de verdade
        let ext = command::audio_ext(&info.path, cfg, info.audio.first().map_or("", |a| a.codec.as_str()));
        command::output_path_for(&info.path, Some(info), cfg, nm).with_extension(ext)
    } else { command::output_path_for(&info.path, Some(info), cfg, nm) }
}

/// Renderiza `info` com o preset. `trim` = (início, fim) em segundos.
pub fn render(e: &Engine, info: &MediaInfo, cfg: &Preset, nm: &Naming, trim: Option<(f64, f64)>, h: &Hooks) -> Result<Done, String> {
    let info = &command::cropped(info, cfg);
    // Cortar trecho: só o pedaço entre início e fim (imagens não têm trecho).
    let trim = if info.is_image { None } else { trim.and_then(|(a, b)| command::trim_range(info, a, b)) };
    let cfg = prepare(info, cfg, trim.is_some())?;
    let out = out_path(info, &cfg, nm);
    render_to(e, info, &cfg, &out, trim, false, h)
}

/// Vários trechos do mesmo arquivo. `join`: um arquivo só com os trechos em ordem;
/// senão um arquivo por trecho (_01, _02...). O `Done` traz o primeiro arquivo e, em `parts`, todos.
pub fn render_cuts(e: &Engine, info: &MediaInfo, cfg: &Preset, nm: &Naming, cuts: &[(f64, f64)], join: bool, h: &Hooks) -> Result<Done, String> {
    let info = &command::cropped(info, cfg);
    let mut cuts: Vec<(f64, f64)> = cuts.iter().filter_map(|&(a, b)| command::trim_range(info, a, b)).collect();
    cuts.sort_by(|x, y| x.0.total_cmp(&y.0));
    if cuts.len() <= 1 { return render(e, info, cfg, nm, cuts.first().copied(), h); }
    let total: f64 = cuts.iter().map(|(a, b)| b - a).sum();
    let cfg = prepare(info, cfg, true)?;
    // GIF com os trechos colados: um comando só (cada trecho entra como uma entrada e o GIF sai com uma paleta só)
    if cfg.is_gif() && join {
        let out = out_path(info, &cfg, nm);
        return render_gif(e, info, &cfg, &out, &cuts, h);
    }
    let started = Instant::now();
    let mut done_secs = 0.0;
    let mut parts = Vec::new();
    let mut warnings = Vec::new();
    let mut size = 0;
    let mut mode = String::new();
    let final_out = if join { Some(out_path(info, &cfg, nm)) } else { None };
    for (i, &(a, b)) in cuts.iter().enumerate() {
        // andamento de todos os trechos numa barra só
        let offset = done_secs;
        let scaled = |t: &Tick| (h.progress)(&Tick { p: ((offset + t.p * (b - a)) / total).min(1.0), eta: t.eta.map(|x| x + (total - offset - (b - a)) / t.speed.max(0.1)), ..t.clone() });
        let hh = Hooks { id: h.id, children: h.children, cancel: h.cancel, progress: &scaled, log: h.log, started: h.started };
        let out = match &final_out {
            // juntar: cada trecho vira um arquivo escondido ao lado do final, depois são colados sem reconverter
            Some(f) => f.with_file_name(format!(".{}.part{:02}.{}", f.file_stem().map(|s| s.to_string_lossy().into_owned()).unwrap_or_default(), i + 1,
                                               if cfg.is_audio() { f.extension().map(|s| s.to_string_lossy().into_owned()).unwrap_or_default() } else { "mov".into() })),
            None => out_path(info, &cfg, &Naming { part: (i + 1) as u32, ..nm.clone() }),
        };
        match render_to(e, info, &cfg, &out, Some((a, b)), join && !cfg.is_audio(), &hh) {
            Ok(d) => { size += d.size; mode = d.mode; warnings.extend(d.warnings); parts.push(d.output); }
            Err(err) => {
                if final_out.is_some() { for p in &parts { let _ = std::fs::remove_file(p); } }
                return Err(err);
            }
        }
        done_secs += b - a;
    }
    let Some(out) = final_out else {
        return Ok(Done { output: parts[0].clone(), size, warnings, mode, seconds: started.elapsed().as_secs_f64(), delete_source: cfg.output.delete_source, parts });
    };
    // colar os trechos (mesmo codec e formato, então é cópia direta)
    (h.started)(&out);
    let dir = out.parent().map(Path::to_path_buf).unwrap_or_default();
    let list = dir.join(format!(".{}.parts.txt", out.file_stem().map(|s| s.to_string_lossy().into_owned()).unwrap_or_default()));
    let text: String = parts.iter().map(|p| format!("file '{}'\n", p.file_name().map(|n| n.to_string_lossy().replace('\'', "'\\''")).unwrap_or_default())).collect();
    let cleanup = || { for p in &parts { let _ = std::fs::remove_file(p); } let _ = std::fs::remove_file(&list); };
    if let Err(err) = std::fs::write(&list, text) { cleanup(); return Err(err.to_string()); }
    let fps = info.video.as_ref().map_or(30.0, |v| if v.fps_nominal > 0.0 { v.fps_nominal } else { v.fps });
    let tc = (cfg.metadata && !info.timecode.is_empty()).then(|| command::shift_timecode(&info.timecode, cuts[0].0, fps));
    let plan = Plan { args: command::concat_args(&list, &out, info, &cfg, tc.as_deref()), warnings: vec![], output: out.clone(), width: 0, height: 0 };
    (h.log)(&format!("{} | join {} parts | ffmpeg {}", info.path.display(), parts.len(), plan.args.join(" ")));
    let res = run_ffmpeg(&e.ffmpeg, &plan, total, "join", h);
    cleanup();
    if let Err(err) = res { let _ = std::fs::remove_file(&out); return Err(err); }
    let mut expect = info.clone();
    expect.duration = total;
    let check = probe::probe(&e.ffprobe, &out).map_err(|err| format!("output check failed: {err}"))
        .and_then(|o| command::verify(&expect, &o).map_err(|err| format!("output check failed: {err}")));
    if let Err(err) = check { let _ = std::fs::remove_file(&out); return Err(err); }
    let size = std::fs::metadata(&out).map(|m| m.len()).unwrap_or(0);
    Ok(Done { output: out.clone(), size, warnings, mode, seconds: started.elapsed().as_secs_f64(), delete_source: cfg.output.delete_source, parts: vec![out] })
}

/// Renderiza para um caminho já escolhido (preset já resolvido).
/// `pcm`: grava o áudio em PCM (trechos que depois são colados: sem o atraso do AAC entre um e outro).
fn render_to(e: &Engine, info: &MediaInfo, cfg: &Preset, out: &Path, trim: Option<(f64, f64)>, pcm: bool, h: &Hooks) -> Result<Done, String> {
    if cfg.is_gif() { return render_gif(e, info, cfg, out, &trim.map(|t| vec![t]).unwrap_or_default(), h); }
    let name = info.path.display().to_string();
    let log = |s: String| (h.log)(&format!("{name} | {s}"));
    let dur = trim.map_or(info.duration, |(a, b)| b - a);
    let cut = |plan: &mut Plan| {
        if let Some((a, b)) = trim { command::apply_trim(plan, info, a, b); }
        if pcm { command::audio_to_pcm(plan); }
    };
    // o arquivo novo é conferido contra a duração do trecho
    let mut expect = info.clone();
    expect.duration = dur;
    let out = out.to_path_buf();
    if let Some(dir) = out.parent() { std::fs::create_dir_all(dir).map_err(|err| format!("{} ({})", err, dir.display()))?; }
    (h.started)(&out);
    let started = Instant::now();

    let done = |mode: &str, warnings: Vec<String>| -> Result<Done, String> {
        let out_info = probe::probe(&e.ffprobe, &out).map_err(|err| format!("output check failed: {err}"))?;
        command::verify(&expect, &out_info).map_err(|err| format!("output check failed: {err}"))?;
        let size = std::fs::metadata(&out).map(|m| m.len()).unwrap_or(0);
        Ok(Done { output: out.clone(), size, warnings, mode: mode.into(), seconds: started.elapsed().as_secs_f64(), delete_source: cfg.output.delete_source, parts: vec![out.clone()] })
    };
    let fail = |mode: &str, err: String| -> String {
        let _ = std::fs::remove_file(&out);
        if err == "cancelled" { log("cancelled".into()); } else { log(format!("failed ({mode}): {}", err.replace('\n', " / "))); }
        err
    };

    // Imagem: um quadro, sem placa de vídeo. Áudio: um comando, sem placa de vídeo.
    if cfg.is_image() || cfg.is_audio() {
        let mode = if cfg.is_image() { "image" } else { "audio" };
        let mut plan = if cfg.is_image() { command::build_image(info, cfg, &out) } else { command::build_audio(info, cfg, &out) };
        cut(&mut plan);
        log(format!("{mode} | ffmpeg {}", plan.args.join(" ")));
        run_ffmpeg(&e.ffmpeg, &plan, if cfg.is_image() { 0.0 } else { dur }, mode, h).map_err(|err| fail(mode, err))?;
        log(format!("ok ({mode}) | {:.1}s", started.elapsed().as_secs_f64()));
        return done(mode, vec![]).map_err(|err| fail(mode, err));
    }

    // RTX 50 (Blackwell) lê e grava 4:2:2 e H.264 10-bit; as RTX 20/30/40 não.
    let blackwell = e.gpu.as_deref().map_or(false, command::gpu_reads_422);
    let gpu_reads = info.video.as_ref().map_or(false, |v| command::nvdec_supported(v, blackwell));
    // Bitrate alto (ex.: 200 Mb/s): o preset do x264 pesa pouco na qualidade e muito na velocidade.
    let cpu_enc = Encoder::Cpu { preset: if cfg.max_quality { "fast" } else { "veryfast" }.into() };
    // Tentativas em ordem; se uma falhar (codec que a placa não lê, filtro que falta), vai para a próxima.
    // Com NVENC: 1) tudo na GPU; 2) só decodifica na GPU; 3) decodifica na CPU.
    let attempts: Vec<(Encoder, Decode)> = if e.encoder != Encoder::Nvenc {
        vec![(e.encoder.clone(), Decode::Cpu)]
    } else if command::needs_ext_encoder(cfg) {
        // 4:2:2 / H.264 10-bit ("igual ao XAVC"): pela placa só na RTX 50; senão o x264/x265 grava.
        if blackwell {
            let mut v = Vec::new();
            if gpu_reads { v.push((Encoder::Nvenc, Decode::Hw)); }
            v.push((Encoder::Nvenc, Decode::Cpu));
            v.push((cpu_enc.clone(), Decode::Cpu));
            v
        } else { vec![(cpu_enc.clone(), Decode::Cpu)] }
    } else if gpu_reads {
        vec![(Encoder::Nvenc, Decode::Gpu), (Encoder::Nvenc, Decode::Hw), (Encoder::Nvenc, Decode::Cpu)]
    } else {
        vec![(Encoder::Nvenc, Decode::Cpu)]
    };
    let mut last_err = String::from("ffmpeg failed");
    for (i, (enc, mode)) in attempts.iter().enumerate() {
        let mname = if *enc == Encoder::Nvenc { mode.name() } else { "cpu-encode" };
        let mut plan = command::build_mode(info, cfg, enc, &out, *mode);
        cut(&mut plan);
        log(format!("try {} ({mname}) | ffmpeg {}", i + 1, plan.args.join(" ")));
        match run_ffmpeg(&e.ffmpeg, &plan, dur, mname, h) {
            Ok(speed) => {
                log(format!("ok ({mname}) | {:.1}s | {speed:.2}x", started.elapsed().as_secs_f64()));
                return done(mname, plan.warnings.clone()).map_err(|err| fail(mname, err));
            }
            Err(err) if err == "cancelled" => return Err(fail(mname, err)),
            Err(err) => { last_err = fail(mname, err); }
        }
    }
    Err(last_err)
}

/// Vídeo → GIF (CPU; a paleta é feita com as cores do próprio vídeo). `cuts` vazio = o vídeo inteiro.
fn render_gif(e: &Engine, info: &MediaInfo, cfg: &Preset, out: &Path, cuts: &[(f64, f64)], h: &Hooks) -> Result<Done, String> {
    let name = info.path.display().to_string();
    let log = |s: String| (h.log)(&format!("{name} | {s}"));
    let dur = if cuts.is_empty() { info.duration } else { cuts.iter().map(|(a, b)| b - a).sum() };
    if let Some(dir) = out.parent() { std::fs::create_dir_all(dir).map_err(|err| format!("{} ({})", err, dir.display()))?; }
    (h.started)(out);
    let started = Instant::now();
    let plan = command::build_gif(info, cfg, out, cuts);
    log(format!("gif | ffmpeg {}", plan.args.join(" ")));
    let fail = |err: String| -> String {
        let _ = std::fs::remove_file(out);
        if err == "cancelled" { log("cancelled".into()); } else { log(format!("failed (gif): {}", err.replace('\n', " / "))); }
        err
    };
    run_ffmpeg(&e.ffmpeg, &plan, dur, "gif", h).map_err(fail)?;
    // o .gif é lido como imagem (sem duração): confere só que saiu um quadro com o tamanho certo
    let check = probe::probe(&e.ffprobe, out).map_err(|err| format!("output check failed: {err}"))
        .and_then(|o| match o.video.as_ref() {
            Some(v) if plan.width == 0 || (v.width, v.height) == (plan.width, plan.height) => Ok(()),
            Some(v) => Err(format!("output check failed: {}x{} vs {}x{}", v.width, v.height, plan.width, plan.height)),
            None => Err("output check failed: output has no video".to_string()),
        });
    if let Err(err) = check { return Err(fail(err)); }
    log(format!("ok (gif) | {:.1}s", started.elapsed().as_secs_f64()));
    let size = std::fs::metadata(out).map(|m| m.len()).unwrap_or(0);
    Ok(Done { output: out.to_path_buf(), size, warnings: vec![], mode: "gif".into(), seconds: started.elapsed().as_secs_f64(), delete_source: cfg.output.delete_source, parts: vec![out.to_path_buf()] })
}
