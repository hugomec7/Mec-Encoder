// Sem janela de console no Windows (versão final)
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod store;
mod update;

use std::collections::HashMap;
use std::path::PathBuf;
use std::process::{Child, Stdio};
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::{Arc, Mutex};
use std::time::Duration;

use mec_core::{command, enc, probe, render, scan, tools, Encoder, MediaInfo, Preset};
use serde::Serialize;
use serde_json::{json, Value};
use tauri::{AppHandle, DragDropEvent, Emitter, Manager, State, WindowEvent};
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_notification::NotificationExt;

// ======================================================================
// Estado
// ======================================================================

pub struct Engine {
    ffmpeg: Option<PathBuf>,
    ffprobe: Option<PathBuf>,
    encoder: Mutex<Encoder>,
    /// "checking", "nvenc" ou "cpu"
    status: Mutex<String>,
    gpu: Mutex<Option<String>>,
}

impl Engine {
    fn ffmpeg(&self) -> Result<PathBuf, String> { self.ffmpeg.clone().ok_or_else(|| "ffmpeg-missing".to_string()) }
    fn ffprobe(&self) -> Result<PathBuf, String> { self.ffprobe.clone().ok_or_else(|| "ffmpeg-missing".to_string()) }
}

pub struct AppState {
    engine: Arc<Engine>,
    items: Mutex<HashMap<u64, Arc<MediaInfo>>>,
    next_id: AtomicU64,
    /// ffmpeg rodando, por vídeo (pode ter mais de um ao mesmo tempo).
    children: Arc<Mutex<HashMap<u64, Child>>>,
    cancel: Arc<AtomicBool>,
    latest: Mutex<Option<update::Latest>>,
    /// Arquivos sendo gravados agora (por vídeo). Se o app fechar no meio, são apagados.
    partial: Mutex<HashMap<u64, PathBuf>>,
    /// Pastas vigiadas (vêm das configurações).
    watch: Mutex<Vec<WatchDir>>,
    /// O que as pastas vigiadas já viram (não converte de novo) e os arquivos que o app gravou.
    seen: Mutex<Seen>,
    /// Arquivo novo esperando o tamanho parar de mudar: (tamanho, data, vezes igual).
    pending: Mutex<HashMap<PathBuf, (u64, u64, u8)>>,
}

#[derive(Clone, Debug, serde::Deserialize, Serialize)]
#[serde(rename_all = "camelCase", default)]
struct WatchDir { path: PathBuf, preset: String, on: bool }
impl Default for WatchDir { fn default() -> Self { Self { path: PathBuf::new(), preset: String::new(), on: true } } }

#[derive(Default, serde::Deserialize, Serialize)]
#[serde(default)]
struct Seen {
    /// pastas que já foram "fotografadas" (os arquivos que existiam quando a pasta foi adicionada não são convertidos)
    folders: Vec<PathBuf>,
    files: std::collections::HashSet<PathBuf>,
}

fn save_seen(app: &AppHandle, seen: &mut Seen) {
    seen.files.retain(|f| f.exists());
    let _ = std::fs::write(store::dir(app).join("watch-seen.json"), serde_json::to_string(&*seen).unwrap_or_default());
}

fn file_sig(p: &std::path::Path) -> Option<(u64, u64)> {
    let m = std::fs::metadata(p).ok()?;
    let t = m.modified().ok()?.duration_since(std::time::UNIX_EPOCH).ok()?.as_secs();
    Some((m.len(), t))
}

/// Pastas vigiadas: arquivo novo (que não estava lá antes) entra na fila quando o tamanho para de mudar
/// (terminou de copiar). Só a pasta de cima, sem subpastas, para não pegar o que o próprio app grava em "proxy\".
fn watch_tick(app: &AppHandle) {
    let state = app.state::<AppState>();
    let dirs: Vec<WatchDir> = state.watch.lock().unwrap().iter().filter(|w| w.on && w.path.is_dir()).cloned().collect();
    for w in dirs {
        let Ok(rd) = std::fs::read_dir(&w.path) else { continue };
        let mut ready = Vec::new();
        for entry in rd.flatten() {
            let p = entry.path();
            let name = p.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default();
            if !p.is_file() || !scan::is_media(&p) || name.starts_with('.') || name.starts_with('~') { continue; }
            if state.seen.lock().unwrap().files.contains(&p) { continue; }
            let Some(sig) = file_sig(&p) else { continue };
            let mut pend = state.pending.lock().unwrap();
            let e = pend.entry(p.clone()).or_insert((sig.0, sig.1, 0));
            if (e.0, e.1) == sig && sig.0 > 0 { e.2 += 1; } else { *e = (sig.0, sig.1, 0); }
            // igual em 2 voltas seguidas (≈4 s) e dá para abrir: terminou de copiar
            if e.2 >= 2 && std::fs::File::open(&p).is_ok() { pend.remove(&p); ready.push(p); }
        }
        if !ready.is_empty() {
            {
                let mut seen = state.seen.lock().unwrap();
                for p in &ready { seen.files.insert(p.clone()); }
                save_seen(app, &mut seen);
            }
            let tag = format!("watch-{}", std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map_or(0, |d| d.as_millis()));
            log(app, &format!("watch | {} | {} file(s)", w.path.display(), ready.len()));
            add_paths(app.clone(), ready, Some(json!({ "tag": tag, "preset": w.preset, "auto": true, "watch": w.path })));
        }
    }
    jobs_tick(app);
}

/// Pasta de tarefas (automação): um .json com a lista de arquivos e o preset entra na fila e renderiza sozinho.
/// O andamento vai para <nome>.status.json; o pedido vai para running\ e, no fim, para done\.
fn jobs_dir(app: &AppHandle) -> PathBuf { store::dir(app).join("jobs") }

const JOBS_README: &str = "Mec Encoder - pasta de tarefas (automação)\r\n\r\n\
Com o Mec Encoder aberto, coloque aqui um arquivo .json e ele entra na fila e renderiza sozinho:\r\n\r\n\
{\r\n  \"files\": [\"D:\\\\Brutos\\\\IMG_4821.MOV\", \"D:\\\\Brutos\\\\Cartao B\"],\r\n  \"preset\": \"RAW\"\r\n}\r\n\r\n\
Opcional: \"outputFolder\": \"D:\\\\Renders\", \"keepTree\": true, \"suffix\": \"_{data}\" (ou false), \"subfolder\": \"proxy\" (ou false),\r\n\
\"trim\": [12.5, 40], \"deleteSource\": false.\r\n\r\n\
O andamento fica em <nome>.status.json (state: queued, running, done ou failed; items com status, progress, output e error).\r\n\
O pedido vai para running\\ enquanto renderiza e para done\\ no fim. Pedido com erro vai para failed\\.\r\n\r\n\
Linha de comando (sem abrir o app): bin\\mec.exe convert <arquivos ou pastas> --preset RAW   (mec.exe help)\r\n";

fn write_status(app: &AppHandle, name: &str, status: &Value) {
    let path = jobs_dir(app).join(format!("{name}.status.json"));
    let tmp = path.with_extension("tmp");
    if std::fs::write(&tmp, serde_json::to_string_pretty(status).unwrap_or_default()).is_ok() { let _ = std::fs::rename(&tmp, &path); }
}

fn jobs_tick(app: &AppHandle) {
    let dir = jobs_dir(app);
    let Ok(rd) = std::fs::read_dir(&dir) else { return };
    for entry in rd.flatten() {
        let p = entry.path();
        let fname = p.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default();
        if !p.is_file() || !fname.to_ascii_lowercase().ends_with(".json") || fname.ends_with(".status.json") { continue; }
        let name = fname[..fname.len() - 5].to_string();
        // espera o arquivo ficar quieto (quem escreveu terminou)
        let Some(sig) = file_sig(&p) else { continue };
        {
            let state = app.state::<AppState>();
            let mut pend = state.pending.lock().unwrap();
            let e = pend.entry(p.clone()).or_insert((sig.0, sig.1, 0));
            if (e.0, e.1) == sig { e.2 += 1; } else { *e = (sig.0, sig.1, 0); }
            if e.2 < 1 { continue; }
            pend.remove(&p);
        }
        let text = std::fs::read_to_string(&p).unwrap_or_default();
        let job: Value = match serde_json::from_str(text.trim_start_matches('\u{feff}')) {
            Ok(v @ Value::Object(_)) => v,
            other => {
                let msg = match other { Err(e) => e.to_string(), _ => "the job must be a JSON object".into() };
                let _ = std::fs::create_dir_all(dir.join("failed"));
                let _ = std::fs::rename(&p, dir.join("failed").join(&fname));
                write_status(app, &name, &json!({ "job": name, "state": "failed", "error": "bad-json", "message": msg, "items": [] }));
                continue;
            }
        };
        let files: Vec<PathBuf> = match job.get("files") {
            Some(Value::Array(a)) => a.iter().filter_map(|x| x.as_str()).map(PathBuf::from).collect(),
            Some(Value::String(s)) => vec![PathBuf::from(s)],
            _ => vec![],
        };
        let missing: Vec<&PathBuf> = files.iter().filter(|f| !f.exists()).collect();
        let _ = std::fs::create_dir_all(dir.join("running"));
        let _ = std::fs::rename(&p, dir.join("running").join(&fname));
        write_status(app, &name, &json!({ "job": name, "state": "queued", "items": missing.iter().map(|f| json!({ "file": f, "status": "error", "error": "source-missing" })).collect::<Vec<_>>() }));
        log(app, &format!("job | {name} | {} file(s)", files.len()));
        let origin = json!({ "tag": format!("job-{name}"), "job": name, "auto": true, "preset": job.get("preset").cloned().unwrap_or(Value::Null),
                             "options": job, "missing": missing });
        let existing: Vec<PathBuf> = files.iter().filter(|f| f.exists()).cloned().collect();
        add_paths(app.clone(), existing, Some(origin));
    }
}

/// A interface manda o andamento de uma tarefa; no fim o pedido vai para done\ (ou failed\).
#[tauri::command]
fn job_status(app: AppHandle, name: String, status: Value, finished: bool) {
    if name.is_empty() || name.contains(['/', '\\']) { return; }
    write_status(&app, &name, &status);
    if finished {
        let dir = jobs_dir(&app);
        let ok = status.get("state").and_then(|s| s.as_str()) == Some("done");
        let to = dir.join(if ok { "done" } else { "failed" });
        let _ = std::fs::create_dir_all(&to);
        let _ = std::fs::rename(dir.join("running").join(format!("{name}.json")), to.join(format!("{name}.json")));
    }
}

/// As pastas vigiadas mudaram nas configurações. Pasta nova: o que já está lá fica como visto (só converte o que chegar).
#[tauri::command]
fn set_watch(app: AppHandle, state: State<'_, AppState>, list: Vec<WatchDir>) {
    {
        let mut seen = state.seen.lock().unwrap();
        let mut changed = false;
        for w in &list {
            if seen.folders.contains(&w.path) { continue; }
            if let Ok(rd) = std::fs::read_dir(&w.path) {
                for e in rd.flatten() { let p = e.path(); if p.is_file() { seen.files.insert(p); } }
            }
            seen.folders.push(w.path.clone());
            changed = true;
        }
        if changed { save_seen(&app, &mut seen); }
    }
    *state.watch.lock().unwrap() = list;
}

/// Abre a pasta de tarefas no Explorador.
#[tauri::command]
fn open_jobs_dir(app: AppHandle) -> Result<String, String> {
    let d = jobs_dir(&app);
    let _ = std::fs::create_dir_all(&d);
    #[cfg(windows)]
    { std::process::Command::new("explorer.exe").arg(&d).spawn().map_err(|e| e.to_string())?; }
    Ok(d.to_string_lossy().into_owned())
}

/// Caminhos para a tela de Automação: pasta de tarefas e o mec.exe.
#[tauri::command]
fn automation_info(app: AppHandle) -> Value {
    let cli = tool_dirs(&app).into_iter().map(|d| d.join(if cfg!(windows) { "mec.exe" } else { "mec" })).find(|p| p.is_file());
    json!({ "jobsDir": jobs_dir(&app), "cli": cli })
}

/// Anota (ou tira) o arquivo que está sendo gravado, em rendering.json, para apagar o que ficar pela metade.
fn track(app: &AppHandle, id: u64, out: Option<PathBuf>) {
    let state = app.state::<AppState>();
    let mut m = state.partial.lock().unwrap();
    match out {
        Some(p) => { state.seen.lock().unwrap().files.insert(p.clone()); m.insert(id, p); }
        None => { m.remove(&id); }
    }
    let list: Vec<&PathBuf> = m.values().collect();
    let _ = std::fs::write(store::dir(app).join("rendering.json"), serde_json::to_string(&list).unwrap_or_default());
}

/// Apaga o que ficou pela metade da última vez (app fechado, travado ou PC desligado no meio do render).
fn clean_partial(app: &AppHandle) {
    let path = store::dir(app).join("rendering.json");
    if let Some(list) = std::fs::read_to_string(&path).ok().and_then(|t| serde_json::from_str::<Vec<PathBuf>>(&t).ok()) {
        for f in list { if f.is_file() { let _ = std::fs::remove_file(&f); } }
    }
    let _ = std::fs::remove_file(path);
}

fn tool_dirs(app: &AppHandle) -> Vec<PathBuf> {
    let mut dirs = Vec::new();
    if let Ok(exe) = std::env::current_exe() {
        if let Some(d) = exe.parent() { dirs.push(d.join("bin")); dirs.push(d.to_path_buf()); }
    }
    if let Ok(r) = app.path().resource_dir() { dirs.push(r.join("bin")); dirs.push(r); }
    dirs
}

// ======================================================================
// Utilidades
// ======================================================================

fn b64(data: &[u8]) -> String {
    const T: &[u8; 64] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut s = String::with_capacity(data.len().div_ceil(3) * 4);
    for c in data.chunks(3) {
        let n = (c[0] as u32) << 16 | (*c.get(1).unwrap_or(&0) as u32) << 8 | *c.get(2).unwrap_or(&0) as u32;
        s.push(T[(n >> 18) as usize & 63] as char);
        s.push(T[(n >> 12) as usize & 63] as char);
        s.push(if c.len() > 1 { T[(n >> 6) as usize & 63] as char } else { '=' });
        s.push(if c.len() > 2 { T[n as usize & 63] as char } else { '=' });
    }
    s
}

fn jpeg(ffmpeg: &PathBuf, args: Vec<String>) -> Result<String, String> {
    let out = tools::command(ffmpeg).args(args).stdin(Stdio::null()).output().map_err(|e| e.to_string())?;
    if !out.status.success() || out.stdout.len() < 4 {
        return Err(String::from_utf8_lossy(&out.stderr).lines().last().unwrap_or("preview failed").to_string());
    }
    Ok(format!("data:image/jpeg;base64,{}", b64(&out.stdout)))
}

fn item(state: &AppState, id: u64) -> Result<Arc<MediaInfo>, String> {
    state.items.lock().unwrap().get(&id).cloned().ok_or_else(|| "unknown item".to_string())
}

// ======================================================================
// Arquivos e pastas
// ======================================================================

/// Lê os arquivos/pastas (subpastas incluídas), avisa a interface vídeo a vídeo e depois gera as miniaturas.
/// `origin`: de onde veio (pasta vigiada ou tarefa), repassado para a interface com o preset e se renderiza sozinho.
fn add_paths(app: AppHandle, paths: Vec<PathBuf>, origin: Option<Value>) {
    std::thread::spawn(move || {
        let state = app.state::<AppState>();
        let Ok(ffprobe) = state.engine.ffprobe() else { let _ = app.emit("scan-done", json!({ "added": 0, "error": "ffmpeg-missing", "origin": origin })); return };
        let found = scan::expand(&paths);
        let root = paths.iter().find(|p| p.is_dir()).and_then(|p| p.file_name()).map(|n| n.to_string_lossy().into_owned());
        let _ = app.emit("scan-start", json!({ "count": found.len() }));
        let mut added = Vec::new();
        let mut errors = Vec::new();
        for f in found {
            let file = f.path.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default();
            match probe::probe(&ffprobe, &f.path) {
                Ok(info) => {
                    let id = state.next_id.fetch_add(1, Ordering::SeqCst);
                    let info = Arc::new(info);
                    state.items.lock().unwrap().insert(id, info.clone());
                    let _ = app.emit("item-added", json!({ "id": id, "path": f.path, "file": file, "dir": f.dir, "info": &*info, "origin": origin }));
                    added.push((id, info));
                }
                Err(e) => errors.push(json!({ "file": file, "path": f.path, "error": e })),
            }
        }
        let _ = app.emit("scan-done", json!({ "added": added.len(), "errors": errors, "root": root, "origin": origin }));
        if let Ok(ffmpeg) = state.engine.ffmpeg() {
            for (id, info) in added {
                let t = (info.duration / 3.0).min(1.0);
                if let Ok(thumb) = jpeg(&ffmpeg, command::preview_args(&info, &Preset::default(), t, false, 160)) {
                    let _ = app.emit("item-thumb", json!({ "id": id, "thumb": thumb }));
                }
            }
        }
    });
}

#[tauri::command]
async fn pick(app: AppHandle, folder: bool) -> Result<usize, String> {
    let app2 = app.clone();
    let paths: Vec<PathBuf> = tauri::async_runtime::spawn_blocking(move || {
        let d = app2.dialog().file();
        if folder {
            d.blocking_pick_folder().and_then(|p| p.into_path().ok()).map(|p| vec![p]).unwrap_or_default()
        } else {
            let all: Vec<&str> = scan::VIDEO_EXT.iter().chain(scan::AUDIO_EXT.iter()).chain(scan::IMAGE_EXT.iter()).copied().collect();
            d.add_filter("Video / Audio / Image", &all)
                .blocking_pick_files()
                .map(|v| v.into_iter().filter_map(|p| p.into_path().ok()).collect())
                .unwrap_or_default()
        }
    })
    .await
    .map_err(|e| e.to_string())?;
    let n = paths.len();
    if n > 0 { add_paths(app, paths, None); }
    Ok(n)
}

#[tauri::command]
fn add(app: AppHandle, paths: Vec<PathBuf>) { add_paths(app, paths, None); }

/// Escolher a pasta de saída fixa.
#[tauri::command]
async fn pick_dir(app: AppHandle, start: Option<PathBuf>) -> Result<Option<PathBuf>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let mut d = app.dialog().file();
        if let Some(s) = start.filter(|s| s.is_dir()) { d = d.set_directory(s); }
        d.blocking_pick_folder().and_then(|p| p.into_path().ok())
    }).await.map_err(|e| e.to_string())
}

/// Fila salva (queue.json): o app grava sozinho a cada mudança.
#[tauri::command]
fn save_queue(app: AppHandle, queue: Value) -> Result<(), String> { store::save_queue(&app, &queue) }

/// Fila da última vez: lê cada arquivo de novo. Devolve, na mesma ordem, o id novo e os dados do arquivo,
/// ou null se o arquivo sumiu. As miniaturas chegam depois (item-thumb).
#[tauri::command]
async fn restore_queue(app: AppHandle, paths: Vec<PathBuf>) -> Result<Vec<Value>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let state = app.state::<AppState>();
        let ffprobe = state.engine.ffprobe()?;
        let mut out = Vec::new();
        let mut thumbs = Vec::new();
        for p in paths {
            match probe::probe(&ffprobe, &p) {
                Ok(info) if p.is_file() => {
                    let id = state.next_id.fetch_add(1, Ordering::SeqCst);
                    let info = Arc::new(info);
                    state.items.lock().unwrap().insert(id, info.clone());
                    out.push(json!({ "id": id, "info": &*info }));
                    thumbs.push((id, info));
                }
                _ => out.push(Value::Null),
            }
        }
        if let Ok(ffmpeg) = state.engine.ffmpeg() {
            let app2 = app.clone();
            std::thread::spawn(move || {
                std::thread::sleep(Duration::from_millis(300));
                for (id, info) in thumbs {
                    let t = (info.duration / 3.0).min(1.0);
                    if let Ok(thumb) = jpeg(&ffmpeg, command::preview_args(&info, &Preset::default(), t, false, 160)) {
                        let _ = app2.emit("item-thumb", json!({ "id": id, "thumb": thumb }));
                    }
                }
            });
        }
        Ok(out)
    }).await.map_err(|e| e.to_string())?
}

#[tauri::command]
fn forget(state: State<'_, AppState>, id: u64) { state.items.lock().unwrap().remove(&id); }

/// Mais uma cópia do mesmo arquivo na fila (para renderizar com outro preset). Devolve o id novo.
#[tauri::command]
fn duplicate(state: State<'_, AppState>, id: u64) -> Result<u64, String> {
    let info = item(&state, id)?;
    let new_id = state.next_id.fetch_add(1, Ordering::SeqCst);
    state.items.lock().unwrap().insert(new_id, info);
    Ok(new_id)
}

// ======================================================================
// Prévia
// ======================================================================

#[tauri::command]
async fn preview(state: State<'_, AppState>, id: u64, cfg: Preset, t: f64, output: bool, max: u32) -> Result<String, String> {
    let info = item(&state, id)?;
    let ffmpeg = state.engine.ffmpeg()?;
    tauri::async_runtime::spawn_blocking(move || {
        let t = t.clamp(0.0, (info.duration - 0.05).max(0.0));
        jpeg(&ffmpeg, command::preview_args(&info, &cfg, t, output, max.clamp(120, 1600)))
    })
    .await
    .map_err(|e| e.to_string())?
}

/// Forma de onda da primeira faixa de áudio: `bars` valores de 0 a 255.
#[tauri::command]
async fn waveform(state: State<'_, AppState>, id: u64, bars: usize) -> Result<Vec<u8>, String> {
    let info = item(&state, id)?;
    let ffmpeg = state.engine.ffmpeg()?;
    if info.audio.is_empty() { return Ok(vec![]); }
    tauri::async_runtime::spawn_blocking(move || {
        let out = tools::command(&ffmpeg)
            .args(["-nostdin", "-v", "error", "-i"]).arg(&info.path)
            .args(["-map", "0:a:0", "-ac", "1", "-ar", "400", "-f", "s16le", "-"])
            .stdin(Stdio::null()).output().map_err(|e| e.to_string())?;
        let samples: Vec<i16> = out.stdout.chunks_exact(2).map(|c| i16::from_le_bytes([c[0], c[1]])).collect();
        let bars = bars.clamp(16, 2000);
        if samples.is_empty() { return Ok(vec![]); }
        let per = (samples.len() as f64 / bars as f64).max(1.0);
        let mut peaks: Vec<f64> = (0..bars).map(|i| {
            let a = (i as f64 * per) as usize;
            let b = (((i + 1) as f64 * per) as usize).min(samples.len()).max(a + 1).min(samples.len());
            samples.get(a..b).map_or(0.0, |s| s.iter().map(|x| (*x as f64).abs()).fold(0.0, f64::max))
        }).collect();
        let max = peaks.iter().cloned().fold(1.0, f64::max);
        for p in peaks.iter_mut() { *p = (*p / max).sqrt(); }
        Ok(peaks.into_iter().map(|p| (p * 255.0).round() as u8).collect())
    })
    .await
    .map_err(|e| e.to_string())?
}

// ======================================================================
// Render
// ======================================================================

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct RenderResult {
    output: PathBuf,
    size: u64,
    deleted: bool,
    warnings: Vec<String>,
}

type Children = Arc<Mutex<HashMap<u64, Child>>>;

fn kill_all(children: &Children) { render::kill_all(children); }

/// Registro simples de cada render (comando, modo, velocidade, erro), em render.log na pasta de dados.
fn log(app: &AppHandle, text: &str) {
    use std::io::Write;
    let path = store::dir(app).join("render.log");
    if std::fs::metadata(&path).map_or(false, |m| m.len() > 2_000_000) {
        let _ = std::fs::rename(&path, path.with_extension("old.log"));
    }
    let now = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map_or(0, |d| d.as_secs());
    if let Ok(mut f) = std::fs::OpenOptions::new().create(true).append(true).open(&path) {
        let _ = writeln!(f, "[{now}] {text}");
    }
}

/// Renderiza com o motor (mec_core::render) e, se o preset pedir, manda o original para a Lixeira.
fn do_render(app: &AppHandle, engine: &Engine, info: &MediaInfo, cfg: &Preset, nm: &command::Naming, trim: Option<(f64, f64)>, id: u64,
             children: &Children, cancel: &Arc<AtomicBool>) -> Result<RenderResult, String> {
    let e = render::Engine {
        ffmpeg: engine.ffmpeg()?, ffprobe: engine.ffprobe()?,
        encoder: engine.encoder.lock().unwrap().clone(), gpu: engine.gpu.lock().unwrap().clone(),
    };
    let progress = |t: &render::Tick| {
        let _ = app.emit("render-progress", json!({ "id": id, "p": t.p, "fps": t.fps, "speed": t.speed, "eta": t.eta, "mode": t.mode }));
    };
    let logf = |s: &str| log(app, s);
    let started = |p: &std::path::Path| track(app, id, Some(p.to_path_buf()));
    let h = render::Hooks { id, children: &**children, cancel: &**cancel, progress: &progress, log: &logf, started: &started };
    let d = render::render(&e, info, cfg, nm, trim, &h)?;
    let mut warnings = d.warnings;
    let mut deleted = false;
    if d.delete_source {
        // Vai para a Lixeira, não some de vez.
        match trash::delete(&info.path) { Ok(()) => deleted = true, Err(_) => warnings.push("delete-failed".into()) }
    }
    Ok(RenderResult { output: d.output, size: d.size, deleted, warnings })
}

/// Renderiza um vídeo e só volta quando termina. A fila (ordem, um vídeo só, parar) é controlada pela interface.
#[tauri::command]
async fn render(app: AppHandle, state: State<'_, AppState>, id: u64, cfg: Preset, naming: Option<command::Naming>, trim: Option<Vec<f64>>) -> Result<RenderResult, String> {
    let info = item(&state, id)?;
    let engine = state.engine.clone();
    let children = state.children.clone();
    let cancel = state.cancel.clone();
    // Só zera o "parar" quando nada está rodando (com vários vídeos ao mesmo tempo).
    if children.lock().unwrap().is_empty() { cancel.store(false, Ordering::SeqCst); }
    let nm = naming.unwrap_or_default();
    let trim = trim.filter(|t| t.len() == 2).map(|t| (t[0], t[1]));
    let res = tauri::async_runtime::spawn_blocking(move || {
        let r = do_render(&app, &engine, &info, &cfg, &nm, trim, id, &children, &cancel);
        track(&app, id, None);
        if let Err(e) = &r { if e != "cancelled" { log(&app, &format!("{} | error: {}", info.path.display(), command::explain(e))); } }
        r
    })
    .await
    .map_err(|e| e.to_string())?;
    // "código|detalhes": a interface mostra uma frase clara e guarda o texto técnico para "Copiar detalhes".
    res.map_err(|e| match command::explain(&e) { "unknown" => e, c if c == e => e, c => format!("{c}|{e}") })
}

#[tauri::command]
fn stop(state: State<'_, AppState>) {
    state.cancel.store(true, Ordering::SeqCst);
    kill_all(&state.children);
}

// ======================================================================
// Presets, configurações, sistema
// ======================================================================

#[tauri::command]
fn get_state(app: AppHandle, state: State<'_, AppState>) -> Value {
    let e = &state.engine;
    let loaded = store::load_presets(&app);
    json!({
        "presets": loaded.presets,
        "firstRun": loaded.first_run,
        "presetsRecovered": loaded.recovered,
        "audioDefaults": Preset::audio_defaults(),
        "imageDefaults": Preset::image_defaults(),
        "cameraPreset": Preset::camera_422(),
        "settings": store::load_settings(&app),
        "queue": store::load_queue(&app),
        "engine": {
            "ffmpeg": e.ffmpeg.is_some(),
            "status": *e.status.lock().unwrap(),
            "gpu": *e.gpu.lock().unwrap(),
        },
        "version": app.package_info().version.to_string(),
        "portable": update::is_portable(),
        "dataDir": store::dir(&app),
    })
}

#[tauri::command]
fn save_presets(app: AppHandle, presets: Vec<Preset>) -> Result<(), String> { store::save_presets(&app, &presets) }

#[tauri::command]
fn save_settings(app: AppHandle, settings: Value) -> Result<(), String> { store::save_settings(&app, &settings) }

#[tauri::command]
fn default_presets() -> Vec<Preset> { Preset::defaults() }

#[tauri::command]
async fn import_enc(app: AppHandle) -> Result<Vec<Preset>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let files = app.dialog().file().add_filter("Shutter Encoder preset", &["enc"]).blocking_pick_files().unwrap_or_default();
        let mut out = Vec::new();
        for f in files.into_iter().filter_map(|p| p.into_path().ok()) {
            if let Ok(text) = std::fs::read_to_string(&f) {
                let name = f.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default();
                out.push(enc::import(&text, &name));
            }
        }
        Ok(out)
    }).await.map_err(|e| e.to_string())?
}

#[tauri::command]
async fn export_presets(app: AppHandle, presets: Vec<Preset>) -> Result<bool, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let Some(path) = app.dialog().file().add_filter("Mec Encoder presets", &["json"]).set_file_name("Mec Encoder presets.json")
            .blocking_save_file().and_then(|p| p.into_path().ok()) else { return Ok(false) };
        let text = serde_json::to_string_pretty(&presets).map_err(|e| e.to_string())?;
        std::fs::write(path, text).map_err(|e| e.to_string())?;
        Ok(true)
    }).await.map_err(|e| e.to_string())?
}

#[tauri::command]
async fn import_presets(app: AppHandle) -> Result<Vec<Preset>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let Some(path) = app.dialog().file().add_filter("Mec Encoder presets", &["json"]).blocking_pick_file()
            .and_then(|p| p.into_path().ok()) else { return Ok(vec![]) };
        let text = std::fs::read_to_string(path).map_err(|e| e.to_string())?;
        if let Ok(list) = serde_json::from_str::<Vec<Preset>>(&text) { return Ok(list); }
        serde_json::from_str::<Preset>(&text).map(|p| vec![p]).map_err(|e| e.to_string())
    }).await.map_err(|e| e.to_string())?
}

/// Abre o Explorador de Arquivos com o arquivo selecionado.
#[tauri::command]
fn reveal(path: PathBuf) -> Result<(), String> {
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        let target = if path.exists() { path } else { path.parent().map(PathBuf::from).unwrap_or(path) };
        std::process::Command::new("explorer.exe").raw_arg(format!("/select,\"{}\"", target.display())).spawn().map_err(|e| e.to_string())?;
    }
    #[cfg(not(windows))]
    { let _ = path; }
    Ok(())
}

/// Abre o registro de renders (render.log) no Bloco de Notas.
#[tauri::command]
fn open_log(app: AppHandle) -> Result<(), String> {
    let path = store::dir(&app).join("render.log");
    if !path.exists() { log(&app, "log created"); }
    std::process::Command::new("notepad.exe").arg(path).spawn().map(|_| ()).map_err(|e| e.to_string())
}

/// Abre a pasta onde ficam presets.json e settings.json.
#[tauri::command]
fn open_data_dir(app: AppHandle) -> Result<(), String> {
    let dir = store::dir(&app);
    std::process::Command::new("explorer.exe").arg(dir).spawn().map(|_| ()).map_err(|e| e.to_string())
}

/// Abre a página do app no navegador (só endereços do GitHub do projeto).
#[tauri::command]
fn open_url(url: String) -> Result<(), String> {
    if !url.starts_with("https://github.com/hugomec7/Mec-Encoder") { return Err("blocked".into()); }
    std::process::Command::new("explorer.exe").arg(url).spawn().map(|_| ()).map_err(|e| e.to_string())
}

/// Ao terminar a fila: "sleep" (suspender) ou "shutdown" (desligar). A interface já mostrou 60 s para cancelar.
#[tauri::command]
fn power(action: String) -> Result<(), String> {
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const NO_WINDOW: u32 = 0x0800_0000;
        let mut c = match action.as_str() {
            // sem /f: se algum programa tiver arquivo sem salvar, o Windows pergunta antes
            "shutdown" => { let mut c = std::process::Command::new("shutdown.exe"); c.args(["/s", "/t", "0"]); c }
            "sleep" => {
                let mut c = std::process::Command::new("powershell.exe");
                c.args(["-NoProfile", "-NonInteractive", "-WindowStyle", "Hidden", "-Command",
                        "Add-Type -AssemblyName System.Windows.Forms; [void][System.Windows.Forms.Application]::SetSuspendState('Suspend', $false, $false)"]);
                c
            }
            _ => return Err("unknown action".into()),
        };
        c.creation_flags(NO_WINDOW).spawn().map(|_| ()).map_err(|e| e.to_string())
    }
    #[cfg(not(windows))]
    { let _ = action; Err("not supported".into()) }
}

#[tauri::command]
fn notify(app: AppHandle, title: String, body: String) {
    let _ = app.notification().builder().title(title).body(body).show();
}

#[tauri::command]
fn ready(app: AppHandle) {
    if let Some(w) = app.get_webview_window("main") { let _ = w.show(); let _ = w.set_focus(); }
}

// ======================================================================
// Atualização
// ======================================================================

#[tauri::command]
async fn check_update(app: AppHandle, state: State<'_, AppState>) -> Result<Option<update::Latest>, String> {
    let current = app.package_info().version.to_string();
    let res = tauri::async_runtime::spawn_blocking(move || update::check(&current)).await.map_err(|e| e.to_string())?;
    // Sem internet ou sem release publicada: não é erro para o usuário.
    let latest = res.unwrap_or(None);
    *state.latest.lock().unwrap() = latest.clone();
    Ok(latest)
}

#[tauri::command]
async fn install_update(app: AppHandle, state: State<'_, AppState>) -> Result<(), String> {
    let latest = state.latest.lock().unwrap().clone().ok_or("no update")?;
    let app2 = app.clone();
    tauri::async_runtime::spawn_blocking(move || update::install(&app2, &latest)).await.map_err(|e| e.to_string())??;
    kill_all(&state.children);
    app.exit(0);
    Ok(())
}

// ======================================================================

fn main() {
    update::cleanup_old();
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(w) = app.get_webview_window("main") { let _ = w.unminimize(); let _ = w.show(); let _ = w.set_focus(); }
        }))
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {
            let handle = app.handle().clone();
            let dirs = tool_dirs(&handle);
            let engine = Arc::new(Engine {
                ffmpeg: tools::find("ffmpeg", &dirs),
                ffprobe: tools::find("ffprobe", &dirs),
                encoder: Mutex::new(Encoder::Nvenc),
                status: Mutex::new("checking".into()),
                gpu: Mutex::new(None),
            });
            app.manage(AppState {
                engine: engine.clone(),
                items: Mutex::new(HashMap::new()),
                next_id: AtomicU64::new(1),
                children: Arc::new(Mutex::new(HashMap::new())),
                cancel: Arc::new(AtomicBool::new(false)),
                latest: Mutex::new(None),
                partial: Mutex::new(HashMap::new()),
                watch: Mutex::new(Vec::new()),
                seen: Mutex::new(std::fs::read_to_string(store::dir(&handle).join("watch-seen.json")).ok()
                    .and_then(|t| serde_json::from_str(&t).ok()).unwrap_or_default()),
                pending: Mutex::new(HashMap::new()),
            });
            clean_partial(&handle);
            // pasta de tarefas com um LEIA-ME, e a vigia (pastas vigiadas + tarefas) a cada 2 s
            let jd = jobs_dir(&handle);
            let _ = std::fs::create_dir_all(&jd);
            let _ = std::fs::write(jd.join("README.txt"), JOBS_README);
            let h4 = handle.clone();
            std::thread::spawn(move || loop {
                std::thread::sleep(Duration::from_secs(2));
                watch_tick(&h4);
            });
            // Testa o NVENC sem travar a abertura. Sem placa NVIDIA, usa a CPU (mais lento) e avisa.
            let h2 = handle.clone();
            std::thread::spawn(move || {
                let ok = engine.ffmpeg.as_ref().map_or(false, |f| tools::nvenc_available(f));
                if !ok { *engine.encoder.lock().unwrap() = Encoder::Cpu { preset: "medium".into() }; }
                *engine.status.lock().unwrap() = if engine.ffmpeg.is_none() { "missing" } else if ok { "nvenc" } else { "cpu" }.into();
                *engine.gpu.lock().unwrap() = tools::gpu_name();
                let _ = h2.emit("engine", json!({ "status": *engine.status.lock().unwrap(), "gpu": *engine.gpu.lock().unwrap() }));
            });
            // Garantia: mostra a janela mesmo se a página não avisar que carregou.
            let h3 = handle.clone();
            std::thread::spawn(move || {
                std::thread::sleep(Duration::from_millis(2500));
                if let Some(w) = h3.get_webview_window("main") { if !w.is_visible().unwrap_or(true) { let _ = w.show(); } }
            });
            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::DragDrop(e) = event {
                let app = window.app_handle().clone();
                match e {
                    DragDropEvent::Enter { .. } | DragDropEvent::Over { .. } => { let _ = app.emit("drag", json!({ "over": true })); }
                    DragDropEvent::Leave => { let _ = app.emit("drag", json!({ "over": false })); }
                    DragDropEvent::Drop { paths, .. } => {
                        let _ = app.emit("drag", json!({ "over": false }));
                        add_paths(app, paths.clone(), None);
                    }
                    _ => {}
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            pick, add, pick_dir, save_queue, restore_queue, power, set_watch, job_status, open_jobs_dir, automation_info, forget, duplicate, preview, waveform, render, stop, get_state, save_presets, save_settings,
            default_presets, import_enc, export_presets, import_presets, reveal, open_data_dir, open_log, open_url, notify, ready, check_update, install_update
        ])
        .build(tauri::generate_context!())
        .expect("error while building Mec Encoder")
        .run(|app, event| {
            if let tauri::RunEvent::Exit = event {
                if let Some(state) = app.try_state::<AppState>() {
                    state.cancel.store(true, Ordering::SeqCst);
                    kill_all(&state.children);
                    // espera o ffmpeg soltar o arquivo e apaga o que ficou pela metade
                    for c in state.children.lock().unwrap().values_mut() { let _ = c.wait(); }
                    for f in state.partial.lock().unwrap().values() { let _ = std::fs::remove_file(f); }
                    let _ = std::fs::remove_file(store::dir(app).join("rendering.json"));
                }
            }
        });
}
