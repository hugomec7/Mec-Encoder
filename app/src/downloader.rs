//! Aba Baixar: instala e atualiza o yt-dlp e o Deno, baixa links e lê o Ctrl+C.
//!
//! O yt-dlp e o Deno ficam em %LOCALAPPDATA%\com.hugomec.mecencoder\downloader (não vão no instalador:
//! o Deno sozinho tem uns 100 MB). Cada download roda numa pasta de trabalho própria e o resultado
//! vai para a pasta escolhida, sem sobrescrever nada.

use std::collections::HashMap;
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::time::Duration;

use mec_core::download::{self, Event, Job, Kind, Tools};
use mec_core::render::Hooks;
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use tauri::{AppHandle, Emitter, Manager, State};

use crate::{log, AppState};

#[cfg(windows)]
const EXE: &str = ".exe";
#[cfg(not(windows))]
const EXE: &str = "";

/// Downloads rodando: processo (yt-dlp ou ffmpeg) e o "parar" de cada um.
#[derive(Default)]
pub struct Downloads {
    pub children: Mutex<HashMap<u64, std::process::Child>>,
    cancel: Mutex<HashMap<u64, Arc<AtomicBool>>>,
    /// Só uma instalação/atualização por vez.
    setup: Mutex<()>,
}

impl Downloads {
    /// Ao fechar o app: para tudo.
    pub fn stop_all(&self) {
        for c in self.cancel.lock().unwrap().values() { c.store(true, Ordering::SeqCst); }
        for c in self.children.lock().unwrap().values_mut() { download::kill_tree(c); }
    }
}

fn tools_dir(app: &AppHandle) -> PathBuf {
    app.path().app_local_data_dir().unwrap_or_else(|_| std::env::temp_dir().join("MecEncoder")).join("downloader")
}
fn ytdlp_path(app: &AppHandle) -> PathBuf { tools_dir(app).join(format!("yt-dlp{EXE}")) }
fn deno_path(app: &AppHandle) -> PathBuf { tools_dir(app).join(format!("deno{EXE}")) }

/// Pasta padrão: Downloads\Mec Encoder.
fn default_dir(app: &AppHandle) -> PathBuf {
    app.path().download_dir().unwrap_or_else(|_| std::env::temp_dir()).join("Mec Encoder")
}

/// O que está instalado. `ytdlp` é a versão (vazio = não instalado).
#[tauri::command]
pub async fn dl_status(app: AppHandle) -> Value {
    let (yt, deno) = (ytdlp_path(&app), deno_path(&app));
    let ver = tauri::async_runtime::spawn_blocking(move || if yt.is_file() { download::version(&yt) } else { None }).await.ok().flatten();
    json!({ "ytdlp": ver.unwrap_or_default(), "deno": deno.is_file(), "defaultDir": default_dir(&app) })
}

/// Primeiro hash SHA-256 (64 letras hexadecimais) de um texto; com `name`, só da linha que cita o arquivo.
fn find_hash(text: &str, name: Option<&str>) -> Option<String> {
    let hex = |w: &str| w.len() == 64 && w.chars().all(|c| c.is_ascii_hexdigit());
    text.lines().filter(|l| name.map_or(true, |n| l.trim_end().ends_with(n)))
        .flat_map(|l| l.split_whitespace()).find(|w| hex(w)).map(|w| w.to_lowercase())
}

fn get_text(url: &str) -> Result<String, String> {
    let r = ureq::get(url).timeout(Duration::from_secs(30)).call().map_err(|e| e.to_string())?;
    r.into_string().map_err(|e| e.to_string())
}

/// Baixa `url` para `dest` com andamento ("dl-setup") e confere o SHA-256, se veio um.
fn fetch(app: &AppHandle, item: &str, url: &str, dest: &Path, sha: Option<&str>) -> Result<(), String> {
    let resp = ureq::get(url).timeout(Duration::from_secs(900)).call().map_err(|e| e.to_string())?;
    let total: u64 = resp.header("Content-Length").and_then(|s| s.parse().ok()).unwrap_or(0);
    let mut reader = resp.into_reader();
    let part = dest.with_extension("part");
    let mut file = std::fs::File::create(&part).map_err(|e| e.to_string())?;
    let mut hasher = Sha256::new();
    let mut buf = vec![0u8; 256 * 1024];
    let (mut done, mut last) = (0u64, std::time::Instant::now());
    loop {
        let n = reader.read(&mut buf).map_err(|e| e.to_string())?;
        if n == 0 { break; }
        file.write_all(&buf[..n]).map_err(|e| e.to_string())?;
        hasher.update(&buf[..n]);
        done += n as u64;
        if last.elapsed() > Duration::from_millis(150) {
            last = std::time::Instant::now();
            let _ = app.emit("dl-setup", json!({ "item": item, "done": done, "total": total }));
        }
    }
    file.flush().map_err(|e| e.to_string())?;
    drop(file);
    let got = format!("{:x}", hasher.finalize());
    if let Some(want) = sha { if !got.eq_ignore_ascii_case(want) { let _ = std::fs::remove_file(&part); return Err("checksum mismatch".into()); } }
    let _ = app.emit("dl-setup", json!({ "item": item, "done": done, "total": done }));
    let _ = std::fs::remove_file(dest);
    std::fs::rename(&part, dest).map_err(|e| e.to_string())
}

fn install(app: &AppHandle) -> Result<String, String> {
    let dir = tools_dir(app);
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let yt = ytdlp_path(app);
    if download::version(&yt).is_none() {
        let sum = get_text(download::YTDLP_SUMS).ok().and_then(|t| find_hash(&t, Some("yt-dlp.exe")));
        fetch(app, "ytdlp", download::YTDLP_URL, &yt, sum.as_deref())?;
    }
    let deno = deno_path(app);
    if !deno.is_file() {
        let zip_path = dir.join("deno.zip");
        let sum = get_text(download::DENO_SUM).ok().and_then(|t| find_hash(&t, None));
        fetch(app, "deno", download::DENO_URL, &zip_path, sum.as_deref())?;
        let res = (|| -> Result<(), String> {
            let mut z = zip::ZipArchive::new(std::fs::File::open(&zip_path).map_err(|e| e.to_string())?).map_err(|e| e.to_string())?;
            let mut entry = z.by_name(&format!("deno{EXE}")).map_err(|e| e.to_string())?;
            let tmp = deno.with_extension("tmp");
            let mut out = std::fs::File::create(&tmp).map_err(|e| e.to_string())?;
            std::io::copy(&mut entry, &mut out).map_err(|e| e.to_string())?;
            drop(out);
            std::fs::rename(&tmp, &deno).map_err(|e| e.to_string())
        })();
        let _ = std::fs::remove_file(&zip_path);
        res?;
    }
    download::version(&yt).ok_or_else(|| "yt-dlp not working".into())
}

/// Baixa o yt-dlp e o Deno (primeira vez na aba Baixar). Devolve a versão do yt-dlp.
#[tauri::command]
pub async fn dl_install(app: AppHandle, state: State<'_, AppState>) -> Result<String, String> {
    let dls = state.downloads.clone();
    tauri::async_runtime::spawn_blocking(move || {
        let _g = dls.setup.lock().unwrap();
        let r = install(&app);
        if let Err(e) = &r { log(&app, &format!("downloader setup | error: {e}")); }
        r
    }).await.map_err(|e| e.to_string())?
}

/// Atualiza o yt-dlp (a interface chama no máximo uma vez por dia). Sem internet não é erro para o usuário.
#[tauri::command]
pub async fn dl_update(app: AppHandle, state: State<'_, AppState>) -> Result<String, String> {
    let dls = state.downloads.clone();
    tauri::async_runtime::spawn_blocking(move || {
        let _g = dls.setup.lock().unwrap();
        // sem nada rodando: o yt-dlp troca o próprio .exe
        if !dls.children.lock().unwrap().is_empty() { return Err("busy".into()); }
        let yt = ytdlp_path(&app);
        let r = download::self_update(&yt);
        log(&app, &format!("downloader update | {r:?}"));
        r
    }).await.map_err(|e| e.to_string())?
}

/// Baixa um link e só volta quando termina. A fila (até 3 ao mesmo tempo) é da interface.
/// Andamento: evento "dl-event" com { id, meta } ou { id, step }.
#[tauri::command]
pub async fn dl_start(app: AppHandle, state: State<'_, AppState>, id: u64, url: String, kind: String, web: bool, audio: String,
                      dest: Option<PathBuf>) -> Result<download::Done, String> {
    let yt = ytdlp_path(&app);
    if !yt.is_file() { return Err("dl-setup".into()); }
    let deno = Some(deno_path(&app)).filter(|d| d.is_file());
    let e = state.engine.clone();
    let tools = Tools { ytdlp: yt.clone(), deno, ffmpeg: e.ffmpeg()?, ffprobe: e.ffprobe()?, encoder: e.encoder.lock().unwrap().clone(),
                        cache: Some(tools_dir(&app).join("cache")) };
    let dest = dest.filter(|d| !d.as_os_str().is_empty()).unwrap_or_else(|| default_dir(&app));
    let job = Job { url, kind: if kind == "audio" { Kind::Audio } else { Kind::Video }, web, audio, dest };
    let work = tools_dir(&app).join("work").join(id.to_string());
    let dls = state.downloads.clone();
    let cancel = Arc::new(AtomicBool::new(false));
    dls.cancel.lock().unwrap().insert(id, cancel.clone());
    let res = tauri::async_runtime::spawn_blocking(move || {
        let emit = |ev: Event| {
            let _ = match ev {
                Event::Meta(m) => app.emit("dl-event", json!({ "id": id, "meta": m })),
                Event::Step(s) => app.emit("dl-event", json!({ "id": id, "step": s })),
            };
        };
        let logf = |s: &str| log(&app, s);
        let h = Hooks { id, children: &dls.children, cancel: &cancel, progress: &|_| {}, log: &logf, started: &|_| {} };
        let mut r = download::run(&job, &tools, &work, &h, &emit);
        // o site mudou: atualiza o yt-dlp e tenta mais uma vez
        if matches!(&r, Err(e) if e.starts_with("dl-broken")) && !cancel.load(Ordering::SeqCst) {
            emit(Event::Step(download::Step { stage: "update".into(), p: 0.0, done: 0, total: 0, speed: 0.0, eta: None }));
            let updated = { let _g = dls.setup.lock().unwrap(); download::self_update(&tools.ytdlp) };
            log(&app, &format!("downloader update (retry) | {updated:?}"));
            if updated.is_ok() { r = download::run(&job, &tools, &work, &h, &emit); }
        }
        dls.cancel.lock().unwrap().remove(&id);
        r
    }).await.map_err(|e| e.to_string())?;
    res.map_err(|e| if e.starts_with("dl-") || e == "cancelled" { e } else {
        match mec_core::command::explain(&e) { "unknown" => e, c if c == e => e, c => format!("{c}|{e}") }
    })
}

#[tauri::command]
pub fn dl_cancel(state: State<'_, AppState>, id: u64) {
    let dls = &state.downloads;
    if let Some(c) = dls.cancel.lock().unwrap().get(&id) { c.store(true, Ordering::SeqCst); }
    if let Some(c) = dls.children.lock().unwrap().get_mut(&id) { download::kill_tree(c); }
}

/// Abre uma pasta no Explorador (cria se não existir).
#[tauri::command]
pub fn dl_open_dir(app: AppHandle, path: Option<PathBuf>) -> Result<(), String> {
    let dir = path.filter(|p| !p.as_os_str().is_empty()).unwrap_or_else(|| default_dir(&app));
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    std::process::Command::new(if cfg!(windows) { "explorer.exe" } else { "xdg-open" }).arg(dir).spawn().map(|_| ()).map_err(|e| e.to_string())
}

/// Texto do Ctrl+C (até 20 mil letras). Vazio se não for texto.
#[tauri::command]
pub fn dl_clipboard() -> String {
    let mut s = clipboard_text().unwrap_or_default();
    if s.len() > 20_000 { s = s.chars().take(20_000).collect(); }
    s
}

#[cfg(windows)]
fn clipboard_text() -> Option<String> {
    use std::ffi::c_void;
    #[link(name = "user32")]
    extern "system" {
        fn IsClipboardFormatAvailable(format: u32) -> i32;
        fn OpenClipboard(owner: *mut c_void) -> i32;
        fn CloseClipboard() -> i32;
        fn GetClipboardData(format: u32) -> *mut c_void;
    }
    #[link(name = "kernel32")]
    extern "system" {
        fn GlobalLock(mem: *mut c_void) -> *mut c_void;
        fn GlobalUnlock(mem: *mut c_void) -> i32;
        fn GlobalSize(mem: *mut c_void) -> usize;
    }
    const CF_UNICODETEXT: u32 = 13;
    unsafe {
        if IsClipboardFormatAvailable(CF_UNICODETEXT) == 0 { return None; }
        // outro programa pode estar com a área de transferência aberta por um instante
        let mut open = false;
        for _ in 0..5 {
            if OpenClipboard(std::ptr::null_mut()) != 0 { open = true; break; }
            std::thread::sleep(Duration::from_millis(15));
        }
        if !open { return None; }
        let mut out = None;
        let h = GetClipboardData(CF_UNICODETEXT);
        if !h.is_null() {
            let p = GlobalLock(h) as *const u16;
            if !p.is_null() {
                let max = GlobalSize(h) / 2;
                let mut n = 0;
                while n < max && *p.add(n) != 0 { n += 1; }
                out = Some(String::from_utf16_lossy(std::slice::from_raw_parts(p, n)));
                GlobalUnlock(h);
            }
        }
        CloseClipboard();
        out
    }
}

#[cfg(not(windows))]
fn clipboard_text() -> Option<String> { None }

/// Pastas de trabalho que sobraram (app fechado no meio de um download).
pub fn clean_work(app: &AppHandle) { let _ = std::fs::remove_dir_all(tools_dir(app).join("work")); }

#[cfg(test)]
mod tests {
    use super::find_hash;
    #[test]
    fn hashes() {
        let sums = "aaaa  yt-dlp\nb1946ac92492d2347c6235b4d2611184b1946ac92492d2347c6235b4d2611184  yt-dlp.exe\n";
        assert_eq!(find_hash(sums, Some("yt-dlp.exe")).as_deref(), Some("b1946ac92492d2347c6235b4d2611184b1946ac92492d2347c6235b4d2611184"));
        let ps = "Algorithm Hash Path\n--------- ---- ----\nSHA256    B1946AC92492D2347C6235B4D2611184B1946AC92492D2347C6235B4D2611184 D:\\a\\deno.zip\n";
        assert_eq!(find_hash(ps, None).as_deref(), Some("b1946ac92492d2347c6235b4d2611184b1946ac92492d2347c6235b4d2611184"));
    }
}
