//! mec — Mec Encoder pela linha de comando.
//!
//! Usa os mesmos presets do app (%APPDATA%\com.hugomec.mecencoder\presets.json) e o mesmo motor
//! (NVENC, tentativas GPU → CPU, conferência do arquivo). Feito para scripts e automações.

use std::io::{IsTerminal, Write};
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, AtomicUsize, Ordering};
use std::sync::Mutex;

use mec_core::render::{self, Engine, Hooks, Tick};
use mec_core::{command, probe, scan, Encoder, MediaInfo, Naming, Preset};
use serde_json::{json, Value};

const HELP: &str = "\
mec — Mec Encoder pela linha de comando

USO
  mec presets [--json]                  Lista os presets (os mesmos do app)
  mec probe <arquivo> [--json]          Mostra os dados do arquivo
  mec engine [--json]                   Mostra o FFmpeg e a placa de vídeo encontrados
  mec convert <arquivos/pastas...> --preset <nome> [opções]
  mec version

OPÇÕES DO CONVERT
  -p, --preset <nome|id>     Preset (obrigatório). Ex.: --preset RAW
  -o, --out <pasta>          Salvar nesta pasta (em vez da pasta do original)
      --keep-tree            Com --out: repete as subpastas da pasta de origem
      --flat                 Com --out: tudo direto na pasta, sem subpastas
      --suffix <texto>       Sufixo do nome (aceita {codec} {preset} {data} {hora} {res} {fps} {bits} {n})
      --no-suffix            Sem sufixo
      --subfolder <nome>     Subpasta (aceita etiquetas)   --no-subfolder  Sem subpasta
      --trim <início>-<fim>  Só um trecho, em segundos ou HH:MM:SS(.ms). Ex.: --trim 12.5-40
      --delete-source        Manda o original para a Lixeira depois de conferir
      --keep-source          Nunca apaga o original (mesmo se o preset pedir)
  -j, --parallel <n>         Vídeos ao mesmo tempo (1 a 3, padrão 1)
      --cpu                  Não usa a placa de vídeo
      --dry-run              Só mostra o que faria (saída de cada arquivo), sem converter
      --json                 Uma linha JSON por evento (start, progress, done, error, summary)

SAÍDA
  Código 0 = tudo certo, 1 = algum arquivo falhou, 2 = comando errado ou nada para fazer.

EXEMPLOS
  mec convert \"D:\\Brutos\\iPhone\" --preset RAW
  mec convert IMG_4821.MOV --preset Proxy --out D:\\Proxies --json
  mec convert C0579.MP4 -p \"BACKUP FX30\" --trim 00:00:10-00:00:42
";

fn main() { std::process::exit(run(std::env::args().skip(1).collect())); }

fn run(args: Vec<String>) -> i32 {
    let Some(cmd) = args.first() else { print!("{HELP}"); return 0 };
    let rest = &args[1..];
    match cmd.as_str() {
        "help" | "-h" | "--help" | "/?" => { print!("{HELP}"); 0 }
        "version" | "-V" | "--version" => { println!("mec {}", env!("CARGO_PKG_VERSION")); 0 }
        "presets" => cmd_presets(rest),
        "probe" => cmd_probe(rest),
        "engine" => cmd_engine(rest),
        "convert" => match Opts::parse(rest) { Ok(o) => cmd_convert(o), Err(e) => { eprintln!("mec: {e}\n(mec help mostra as opções)"); 2 } },
        other => { eprintln!("mec: comando desconhecido \"{other}\"\n(mec help mostra os comandos)"); 2 }
    }
}

// ======================================================================
// Onde ficam as coisas
// ======================================================================

/// Pasta de dados do app (presets.json, settings.json).
fn data_dir() -> PathBuf {
    if let Some(d) = std::env::var_os("MEC_DATA_DIR") { return PathBuf::from(d); }
    #[cfg(windows)]
    { if let Some(a) = std::env::var_os("APPDATA") { return PathBuf::from(a).join("com.hugomec.mecencoder"); } }
    let base = std::env::var_os("XDG_CONFIG_HOME").map(PathBuf::from)
        .or_else(|| std::env::var_os("HOME").map(|h| PathBuf::from(h).join(".config")))
        .unwrap_or_else(std::env::temp_dir);
    base.join("com.hugomec.mecencoder")
}

/// Pastas onde procurar o ffmpeg: ao lado do mec.exe (bin\ do app) e a pasta acima.
fn tool_dirs() -> Vec<PathBuf> {
    let mut v = Vec::new();
    if let Ok(exe) = std::env::current_exe() {
        if let Some(d) = exe.parent() { v.push(d.to_path_buf()); v.push(d.join("bin")); if let Some(p) = d.parent() { v.push(p.join("bin")); } }
    }
    v
}

/// Presets do usuário; sem arquivo, os padrões.
fn load_presets() -> Vec<Preset> {
    let path = data_dir().join("presets.json");
    let text = std::fs::read_to_string(&path).or_else(|_| std::fs::read_to_string(path.with_extension("bak")));
    let list: Vec<Preset> = text.ok().and_then(|t| serde_json::from_str::<Vec<Value>>(&t).ok())
        .map(|v| v.into_iter().filter_map(|x| serde_json::from_value(x).ok()).collect()).unwrap_or_default();
    if list.is_empty() { Preset::defaults() } else { list }
}

fn find_preset(list: &[Preset], key: &str) -> Option<Preset> {
    let k = key.trim().to_lowercase();
    list.iter().find(|p| p.id.to_lowercase() == k).or_else(|| list.iter().find(|p| p.name.trim().to_lowercase() == k)).cloned()
}

// ======================================================================
// presets / probe / engine
// ======================================================================

fn has(args: &[String], flag: &str) -> bool { args.iter().any(|a| a == flag) }

fn kind_of(p: &Preset) -> &str { if p.is_audio() { "audio" } else if p.is_image() { "image" } else { "video" } }

fn cmd_presets(args: &[String]) -> i32 {
    let list = load_presets();
    if has(args, "--json") {
        println!("{}", serde_json::to_string_pretty(&list).unwrap_or_default());
        return 0;
    }
    println!("Presets ({}):", data_dir().join("presets.json").display());
    for p in &list {
        let folder = if p.folder.is_empty() { String::new() } else { format!("  [{}]", p.folder) };
        println!("  {:<24} {:<6} id={}{}", p.name, kind_of(p), p.id, folder);
    }
    0
}

fn engine() -> Result<Engine, String> {
    Engine::detect(&tool_dirs()).ok_or_else(|| "FFmpeg não encontrado (ffmpeg.exe e ffprobe.exe ficam na pasta bin do Mec Encoder)".into())
}

fn cmd_engine(args: &[String]) -> i32 {
    let e = match engine() { Ok(e) => e, Err(err) => { eprintln!("mec: {err}"); return 2 } };
    let nvenc = e.encoder == Encoder::Nvenc;
    if has(args, "--json") {
        println!("{}", json!({ "ffmpeg": e.ffmpeg, "ffprobe": e.ffprobe, "nvenc": nvenc, "gpu": e.gpu, "dataDir": data_dir(), "version": env!("CARGO_PKG_VERSION") }));
    } else {
        println!("FFmpeg:  {}", e.ffmpeg.display());
        println!("Placa:   {}", e.gpu.as_deref().unwrap_or("-"));
        println!("Encoder: {}", if nvenc { "NVENC" } else { "CPU" });
        println!("Dados:   {}", data_dir().display());
    }
    0
}

fn cmd_probe(args: &[String]) -> i32 {
    let Some(file) = args.iter().find(|a| !a.starts_with("--")) else { eprintln!("mec probe <arquivo>"); return 2 };
    let e = match engine() { Ok(e) => e, Err(err) => { eprintln!("mec: {err}"); return 2 } };
    match probe::probe(&e.ffprobe, Path::new(file)) {
        Ok(info) => {
            if has(args, "--json") { println!("{}", serde_json::to_string_pretty(&info).unwrap_or_default()); }
            else { println!("{}", describe(&info)); }
            0
        }
        Err(err) => { eprintln!("mec: {err}"); 1 }
    }
}

fn describe(i: &MediaInfo) -> String {
    let mut s = format!("{}\n  duração {:.2}s · {:.1} MB", i.path.display(), i.duration, i.size_bytes as f64 / 1e6);
    if let Some(v) = &i.video {
        s += &format!("\n  vídeo  {}x{} · {} · {}-bit · {} · {:.3} fps{}{}{}", v.width, v.height, v.codec, v.bit_depth, v.pix_fmt, v.fps,
                      if v.vfr { " VFR" } else { "" }, if v.hdr.is_empty() { String::new() } else { format!(" · HDR {}", v.hdr) },
                      if v.rotation != 0 { format!(" · girar {}°", v.rotation) } else { String::new() });
    }
    for a in &i.audio { s += &format!("\n  áudio  {} · {} canal(is) · {} Hz", a.codec, a.channels, a.sample_rate); }
    if !i.timecode.is_empty() { s += &format!("\n  timecode {}", i.timecode); }
    s
}

// ======================================================================
// convert
// ======================================================================

#[derive(Default, Debug)]
struct Opts {
    inputs: Vec<String>,
    preset: Option<String>,
    out: Option<String>,
    keep_tree: Option<bool>,
    suffix: Option<Option<String>>,
    subfolder: Option<Option<String>>,
    trim: Option<(f64, f64)>,
    delete_source: Option<bool>,
    parallel: usize,
    cpu: bool,
    dry_run: bool,
    json: bool,
}

/// "12.5", "1:02.5" ou "00:01:02.5" → segundos.
fn parse_time(s: &str) -> Option<f64> {
    let parts: Vec<&str> = s.trim().split(':').collect();
    if parts.len() > 3 { return None; }
    let mut t = 0.0;
    for p in &parts { t = t * 60.0 + p.replace(',', ".").parse::<f64>().ok()?; }
    Some(t)
}

impl Opts {
    fn parse(args: &[String]) -> Result<Opts, String> {
        let mut o = Opts { parallel: 1, ..Default::default() };
        let mut it = args.iter();
        while let Some(a) = it.next() {
            let mut val = |name: &str| it.next().cloned().ok_or_else(|| format!("{name} precisa de um valor"));
            match a.as_str() {
                "-p" | "--preset" => o.preset = Some(val(a)?),
                "-o" | "--out" => o.out = Some(val(a)?),
                "--keep-tree" => o.keep_tree = Some(true),
                "--flat" => o.keep_tree = Some(false),
                "--suffix" => o.suffix = Some(Some(val(a)?)),
                "--no-suffix" => o.suffix = Some(None),
                "--subfolder" => o.subfolder = Some(Some(val(a)?)),
                "--no-subfolder" => o.subfolder = Some(None),
                "--trim" => {
                    let v = val(a)?;
                    let (x, y) = v.split_once('-').ok_or("--trim usa início-fim, ex.: 12.5-40")?;
                    let (x, y) = (parse_time(x).ok_or("início do --trim inválido")?, parse_time(y).ok_or("fim do --trim inválido")?);
                    if y <= x { return Err("no --trim o fim precisa ser depois do início".into()); }
                    o.trim = Some((x, y));
                }
                "--delete-source" => o.delete_source = Some(true),
                "--keep-source" => o.delete_source = Some(false),
                "-j" | "--parallel" => o.parallel = val(a)?.parse::<usize>().map_err(|_| "--parallel precisa de um número")?.clamp(1, 3),
                "--cpu" => o.cpu = true,
                "--dry-run" => o.dry_run = true,
                "--json" => o.json = true,
                s if s.starts_with('-') && s.len() > 1 => return Err(format!("opção desconhecida {s}")),
                _ => o.inputs.push(a.clone()),
            }
        }
        if o.preset.is_none() { return Err("falta --preset (mec presets lista os nomes)".into()); }
        if o.inputs.is_empty() { return Err("falta o arquivo ou a pasta".into()); }
        Ok(o)
    }

    fn apply(&self, p: &mut Preset) {
        if let Some(out) = &self.out { p.output.folder.on = true; p.output.folder.text = out.clone(); }
        if let Some(k) = self.keep_tree { p.output.keep_tree = k; }
        match &self.suffix { Some(Some(t)) => { p.output.suffix.on = true; p.output.suffix.text = t.clone(); } Some(None) => p.output.suffix.on = false, None => {} }
        match &self.subfolder { Some(Some(t)) => { p.output.subfolder.on = true; p.output.subfolder.text = t.clone(); } Some(None) => p.output.subfolder.on = false, None => {} }
        if let Some(d) = self.delete_source { p.output.delete_source = d; }
    }
}

/// Data e hora local para {data} e {hora}.
fn now_tags() -> (String, String) {
    #[cfg(windows)]
    {
        #[repr(C)]
        #[derive(Default)]
        struct St { y: u16, m: u16, dow: u16, d: u16, h: u16, mi: u16, s: u16, ms: u16 }
        #[link(name = "kernel32")]
        extern "system" { fn GetLocalTime(t: *mut St); }
        let mut t = St::default();
        unsafe { GetLocalTime(&mut t) };
        let _ = (t.dow, t.s, t.ms);
        return (format!("{:04}-{:02}-{:02}", t.y, t.m, t.d), format!("{:02}-{:02}", t.h, t.mi));
    }
    #[allow(unreachable_code)]
    {
        // fora do Windows: UTC
        let secs = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map_or(0, |d| d.as_secs()) as i64;
        let (days, rem) = (secs.div_euclid(86400), secs.rem_euclid(86400));
        let z = days + 719468; let era = z.div_euclid(146097); let doe = z - era * 146097;
        let yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365; let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
        let mp = (5 * doy + 2) / 153; let d = doy - (153 * mp + 2) / 5 + 1; let m = if mp < 10 { mp + 3 } else { mp - 9 };
        let y = yoe + era * 400 + if m <= 2 { 1 } else { 0 };
        (format!("{y:04}-{m:02}-{d:02}"), format!("{:02}-{:02}", rem / 3600, rem / 60 % 60))
    }
}

fn fmt_dur(t: f64) -> String {
    let t = t.max(0.0).round() as u64;
    if t >= 3600 { format!("{}:{:02}:{:02}", t / 3600, t / 60 % 60, t % 60) } else { format!("{}:{:02}", t / 60, t % 60) }
}

/// Uma linha por evento (--json) ou texto para gente.
struct Out { json: bool, live: bool, lock: Mutex<()> }
impl Out {
    fn event(&self, v: Value, text: &str) {
        let _g = self.lock.lock().unwrap();
        let mut o = std::io::stdout().lock();
        if self.json { let _ = writeln!(o, "{v}"); } else if !text.is_empty() {
            if self.live { let _ = write!(o, "\r\x1b[2K"); }
            let _ = writeln!(o, "{text}");
        }
        let _ = o.flush();
    }
    fn live(&self, text: &str) {
        if self.json || !self.live { return; }
        let _g = self.lock.lock().unwrap();
        let mut o = std::io::stdout().lock();
        let _ = write!(o, "\r\x1b[2K{text}");
        let _ = o.flush();
    }
}

fn cmd_convert(o: Opts) -> i32 {
    let presets = load_presets();
    let key = o.preset.clone().unwrap_or_default();
    let Some(mut preset) = find_preset(&presets, &key) else {
        eprintln!("mec: preset \"{key}\" não encontrado. Presets: {}", presets.iter().map(|p| p.name.as_str()).collect::<Vec<_>>().join(", "));
        return 2;
    };
    o.apply(&mut preset);
    let mut e = match engine() { Ok(e) => e, Err(err) => { eprintln!("mec: {err}"); return 2 } };
    if o.cpu { e.encoder = Encoder::Cpu { preset: "medium".into() }; }

    let paths: Vec<PathBuf> = o.inputs.iter().map(PathBuf::from).collect();
    let missing: Vec<&PathBuf> = paths.iter().filter(|p| !p.exists()).collect();
    let found = scan::expand(&paths);
    let out = Out { json: o.json, live: !o.json && o.parallel == 1 && std::io::stdout().is_terminal(), lock: Mutex::new(()) };
    for m in &missing {
        out.event(json!({ "event": "error", "file": m, "code": "source-missing", "message": "arquivo ou pasta não existe" }), &format!("✗ não existe: {}", m.display()));
    }
    if found.is_empty() {
        out.event(json!({ "event": "summary", "ok": 0, "failed": missing.len(), "files": 0 }), "Nada para converter (nenhum vídeo, áudio ou imagem encontrado).");
        return 2;
    }
    let (date, time) = now_tags();
    let total = found.len();
    if !o.json {
        let enc = if e.encoder == Encoder::Nvenc { format!("NVENC · {}", e.gpu.as_deref().unwrap_or("NVIDIA")) } else { "CPU".into() };
        println!("Mec Encoder · {} arquivo(s) · preset {} · {}", total, preset.name, enc);
    }

    let next = AtomicUsize::new(0);
    let ok = AtomicUsize::new(0);
    let failed = AtomicUsize::new(missing.len());
    let cancel = AtomicBool::new(false);
    let children = Mutex::new(std::collections::HashMap::new());
    let log_path = data_dir().join("render.log");
    let log = |s: &str| {
        if let Ok(mut f) = std::fs::OpenOptions::new().create(true).append(true).open(&log_path) {
            let now = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map_or(0, |d| d.as_secs());
            let _ = writeln!(f, "[{now}] cli | {s}");
        }
    };

    std::thread::scope(|sc| {
        for _ in 0..o.parallel.min(total) {
            sc.spawn(|| loop {
                let i = next.fetch_add(1, Ordering::SeqCst);
                let Some(f) = found.get(i) else { break };
                let file = f.path.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default();
                let nm = Naming { dir: f.dir.clone(), n: (i + 1) as u32, date: date.clone(), time: time.clone() };
                let info = match probe::probe(&e.ffprobe, &f.path) {
                    Ok(info) => info,
                    Err(err) => {
                        failed.fetch_add(1, Ordering::SeqCst);
                        out.event(json!({ "event": "error", "file": f.path, "code": "corrupt", "message": err }), &format!("✗ {file}: não deu para ler ({err})"));
                        continue;
                    }
                };
                if o.dry_run {
                    let r = command::resolve(&info, &preset);
                    let dest = command::output_path_for(&f.path, Some(&info), &r, &nm);
                    ok.fetch_add(1, Ordering::SeqCst);
                    out.event(json!({ "event": "plan", "file": f.path, "output": dest, "duration": info.duration }), &format!("{file} → {}", dest.display()));
                    continue;
                }
                out.event(json!({ "event": "start", "file": f.path, "index": i + 1, "total": total, "preset": preset.name }), &format!("[{}/{}] {file}", i + 1, total));
                let progress = |t: &Tick| {
                    out.event(json!({ "event": "progress", "file": f.path, "p": (t.p * 1000.0).round() / 1000.0, "speed": t.speed, "eta": t.eta, "mode": t.mode }), "");
                    out.live(&format!("  {:>3}%  {:.1}x  {}  {}", (t.p * 100.0).round(), t.speed, t.eta.map(|x| format!("faltam {}", fmt_dur(x))).unwrap_or_default(), t.mode));
                };
                let started = |_: &Path| {};
                let h = Hooks { id: i as u64, children: &children, cancel: &cancel, progress: &progress, log: &log, started: &started };
                match render::render(&e, &info, &preset, &nm, o.trim, &h) {
                    Ok(d) => {
                        let mut deleted = false;
                        if d.delete_source { deleted = trash::delete(&f.path).is_ok(); }
                        ok.fetch_add(1, Ordering::SeqCst);
                        out.event(json!({ "event": "done", "file": f.path, "output": d.output, "size": d.size, "seconds": (d.seconds * 10.0).round() / 10.0, "mode": d.mode, "deleted": deleted, "warnings": d.warnings }),
                                  &format!("  ✓ {} · {:.1} MB · {} ({}){}", d.output.display(), d.size as f64 / 1e6, fmt_dur(d.seconds), d.mode, if deleted { " · original na Lixeira" } else { "" }));
                    }
                    Err(err) => {
                        failed.fetch_add(1, Ordering::SeqCst);
                        let code = command::explain(&err);
                        out.event(json!({ "event": "error", "file": f.path, "code": code, "message": err }), &format!("  ✗ {file}: {code} · {}", err.lines().last().unwrap_or("")));
                    }
                }
            });
        }
    });
    let (k, f) = (ok.load(Ordering::SeqCst), failed.load(Ordering::SeqCst));
    out.event(json!({ "event": "summary", "ok": k, "failed": f, "files": total }), &format!("Pronto: {k} ok, {f} com erro."));
    if f > 0 { 1 } else { 0 }
}

#[cfg(test)]
mod tests {
    use super::*;
    fn args(s: &str) -> Vec<String> { s.split_whitespace().map(String::from).collect() }

    #[test]
    fn parses_options() {
        let o = Opts::parse(&args("a.mov pasta -p RAW --out D:/R --flat --suffix _{data} --trim 1:02.5-1:10 -j 5 --json")).unwrap();
        assert_eq!(o.inputs, vec!["a.mov", "pasta"]);
        assert_eq!(o.preset.as_deref(), Some("RAW"));
        assert_eq!(o.trim, Some((62.5, 70.0)));
        assert_eq!(o.parallel, 3);
        assert_eq!(o.keep_tree, Some(false));
        let mut p = Preset::default();
        o.apply(&mut p);
        assert!(p.output.folder.on && p.output.folder.text == "D:/R" && !p.output.keep_tree);
        assert_eq!(p.output.suffix.text, "_{data}");
        assert!(Opts::parse(&args("a.mov")).is_err());
        assert!(Opts::parse(&args("a.mov -p RAW --trim 9-3")).is_err());
        assert!(Opts::parse(&args("a.mov -p RAW --bogus")).is_err());
    }

    #[test]
    fn finds_presets_by_name_or_id() {
        let list = Preset::defaults();
        assert_eq!(find_preset(&list, "raw").unwrap().id, "iphone-4k60");
        assert_eq!(find_preset(&list, "iphone-4k60").unwrap().name, "RAW");
        assert!(find_preset(&list, "nada").is_none());
    }

    #[test]
    fn times() {
        assert_eq!(parse_time("12,5"), Some(12.5));
        assert_eq!(parse_time("00:01:00"), Some(60.0));
        assert_eq!(parse_time("x"), None);
        let (d, t) = now_tags();
        assert_eq!((d.len(), t.len()), (10, 5));
    }
}
