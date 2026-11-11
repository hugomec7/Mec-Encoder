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
                      dest: Option<PathBuf>, height: Option<u32>, subs: Option<Vec<String>>, thumb: Option<bool>) -> Result<download::Done, String> {
    let yt = ytdlp_path(&app);
    if !yt.is_file() { return Err("dl-setup".into()); }
    let deno = Some(deno_path(&app)).filter(|d| d.is_file());
    let e = state.engine.clone();
    // sessões das contas entradas: um arquivo só para este download (o yt-dlp regrava o arquivo no fim)
    let cookies = account_files(&app);
    let cookies = (!cookies.is_empty()).then(|| {
        let f = accounts_dir(&app).join(format!("job-{id}.txt"));
        std::fs::write(&f, download::merge_cookie_files(&cookies)).ok().map(|_| f)
    }).flatten();
    let tools = Tools { ytdlp: yt.clone(), deno, ffmpeg: e.ffmpeg()?, ffprobe: e.ffprobe()?, encoder: e.encoder.lock().unwrap().clone(),
                        cache: Some(tools_dir(&app).join("cache")), cookies };
    let dest = dest.filter(|d| !d.as_os_str().is_empty()).unwrap_or_else(|| default_dir(&app));
    let kind = match kind.as_str() { "audio" => Kind::Audio, "thumb" => Kind::Thumb, _ => Kind::Video };
    let job = Job { url, kind, web, audio, dest, height: height.unwrap_or(0), subs: subs.unwrap_or_default(), thumb: thumb.unwrap_or(false) };
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
        if let Some(f) = &tools.cookies { let _ = std::fs::remove_file(f); }
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

// ======================================================================
// Contas: entrar no site numa janela própria (anônima) e guardar a sessão só neste PC
// ======================================================================

struct Site { id: &'static str, name: &'static str, login: &'static str, urls: &'static [&'static str], session: &'static [&'static str] }

const SITES: &[Site] = &[
    Site { id: "instagram", name: "Instagram", login: "https://www.instagram.com/accounts/login/", urls: &["https://www.instagram.com/"], session: &["sessionid"] },
    Site { id: "youtube", name: "YouTube", login: "https://accounts.google.com/ServiceLogin?service=youtube&continue=https%3A%2F%2Fwww.youtube.com%2F",
           urls: &["https://www.youtube.com/", "https://accounts.google.com/", "https://www.google.com/"], session: &["LOGIN_INFO", "__Secure-3PSID", "SID"] },
    Site { id: "x", name: "X", login: "https://x.com/i/flow/login", urls: &["https://x.com/", "https://twitter.com/"], session: &["auth_token"] },
    Site { id: "facebook", name: "Facebook", login: "https://www.facebook.com/login/", urls: &["https://www.facebook.com/"], session: &["c_user"] },
    Site { id: "tiktok", name: "TikTok", login: "https://www.tiktok.com/login", urls: &["https://www.tiktok.com/"], session: &["sessionid"] },
];

fn accounts_dir(app: &AppHandle) -> PathBuf { tools_dir(app).join("accounts") }
fn account_file(app: &AppHandle, id: &str) -> PathBuf { accounts_dir(app).join(format!("{id}.txt")) }
fn account_files(app: &AppHandle) -> Vec<PathBuf> { SITES.iter().map(|s| account_file(app, s.id)).filter(|f| f.is_file()).collect() }

/// Contas e se a sessão está guardada.
#[tauri::command]
pub fn dl_accounts(app: AppHandle) -> Value {
    json!(SITES.iter().map(|s| json!({ "id": s.id, "name": s.name, "on": account_file(&app, s.id).is_file() })).collect::<Vec<_>>())
}

/// Sair: apaga a sessão guardada (a janela de login é anônima, então nada fica no navegador do app).
#[tauri::command]
pub fn dl_logout(app: AppHandle, site: String) {
    let _ = std::fs::remove_file(account_file(&app, &site));
}

fn read_cookies(w: &tauri::WebviewWindow, url: &str) -> Vec<download::Cookie> {
    let Ok(u) = url.parse::<tauri::Url>() else { return vec![] };
    w.cookies_for_url(u).unwrap_or_default().into_iter().map(|c| download::Cookie {
        name: c.name().to_string(), value: c.value().to_string(), domain: c.domain().unwrap_or("").to_string(),
        path: c.path().unwrap_or("/").to_string(), secure: c.secure().unwrap_or(false), http_only: c.http_only().unwrap_or(false),
        expires: c.expires_datetime().map(|t| t.unix_timestamp()),
    }).collect()
}

/// Abre a página de login do site. Quando a sessão aparece, guarda e fecha a janela sozinha.
/// Avisa pelo evento "dl-login" { site, ok } (ok = false: fechou sem entrar ou passou o tempo).
#[tauri::command]
pub async fn dl_login(app: AppHandle, site: String, title: String) -> Result<(), String> {
    let s = SITES.iter().find(|s| s.id == site).ok_or("unknown site")?;
    let label = format!("login-{}", s.id);
    if let Some(w) = app.get_webview_window(&label) { let _ = w.set_focus(); return Ok(()); }
    let url = s.login.parse::<tauri::Url>().map_err(|e| e.to_string())?;
    let b = tauri::WebviewWindowBuilder::new(&app, &label, tauri::WebviewUrl::External(url))
        .title(title).inner_size(480.0, 760.0).center().incognito(true).focused(true);
    let b = match app.get_webview_window("main") { Some(main) => b.parent(&main).map_err(|e| e.to_string())?, None => b };
    let w = b.build().map_err(|e| e.to_string())?;
    let app2 = app.clone();
    let (id, urls, session) = (s.id, s.urls, s.session);
    // lê os cookies numa thread própria (no Windows, ler no evento ou em comando síncrono trava)
    std::thread::spawn(move || {
        let started = std::time::Instant::now();
        let ok = loop {
            std::thread::sleep(Duration::from_millis(1500));
            if app2.get_webview_window(&w.label().to_string()).is_none() { break false; }
            if started.elapsed() > Duration::from_secs(20 * 60) { let _ = w.close(); break false; }
            let first = read_cookies(&w, urls[0]);
            if !first.iter().any(|c| session.contains(&c.name.as_str()) && !c.value.is_empty()) { continue; }
            // entrou: espera a página terminar de gravar o resto e guarda todos os domínios do site
            std::thread::sleep(Duration::from_millis(1500));
            let now = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map_or(0, |d| d.as_secs() as i64);
            let mut text = String::from("# Netscape HTTP Cookie File\n");
            for u in urls {
                let host = u.trim_start_matches("https://").trim_end_matches('/');
                text.push_str(&download::netscape(&read_cookies(&w, u), host, now));
            }
            let _ = std::fs::create_dir_all(accounts_dir(&app2));
            let saved = std::fs::write(account_file(&app2, id), text).is_ok();
            let _ = w.close();
            break saved;
        };
        log(&app2, &format!("downloader login | {id} | {}", if ok { "ok" } else { "closed" }));
        let _ = app2.emit("dl-login", json!({ "site": id, "ok": ok }));
    });
    Ok(())
}

/// Lê o que o link tem (para "Escolher qualidade…"): título, duração, formatos, legendas e miniatura.
/// Só os campos que a janela usa (o JSON inteiro do YouTube passa de 1 MB).
#[tauri::command]
pub async fn dl_info(app: AppHandle, state: State<'_, AppState>, url: String) -> Result<Value, String> {
    let yt = ytdlp_path(&app);
    if !yt.is_file() { return Err("dl-setup".into()); }
    let e = state.engine.clone();
    let deno = Some(deno_path(&app)).filter(|d| d.is_file());
    let files = account_files(&app);
    let ck = (!files.is_empty()).then(|| {
        let f = accounts_dir(&app).join(format!("info-{}.txt", std::process::id()));
        std::fs::write(&f, download::merge_cookie_files(&files)).ok().map(|_| f)
    }).flatten();
    let tools = Tools { ytdlp: yt, deno, ffmpeg: e.ffmpeg()?, ffprobe: e.ffprobe()?, encoder: e.encoder.lock().unwrap().clone(),
                        cache: Some(tools_dir(&app).join("cache")), cookies: ck.clone() };
    let res = tauri::async_runtime::spawn_blocking(move || download::info(&url, &tools)).await.map_err(|e| e.to_string())?;
    if let Some(f) = ck { let _ = std::fs::remove_file(f); }
    let text = res?;
    let v: Value = serde_json::from_str(&text).map_err(|e| e.to_string())?;
    let pick = |o: &Value, keys: &[&str]| -> Value {
        let mut m = serde_json::Map::new();
        for k in keys { if let Some(x) = o.get(*k) { if !x.is_null() { m.insert((*k).to_string(), x.clone()); } } }
        Value::Object(m)
    };
    let formats: Vec<Value> = v.get("formats").and_then(|f| f.as_array()).map(|a| a.iter().map(|f|
        pick(f, &["format_id", "ext", "vcodec", "acodec", "width", "height", "fps", "tbr", "vbr", "abr", "filesize", "filesize_approx", "protocol", "dynamic_range"])).collect()).unwrap_or_default();
    let langs = |key: &str| -> Value {
        json!(v.get(key).and_then(|s| s.as_object()).map(|m| m.iter().map(|(lang, list)| json!({
            "lang": lang, "name": list.get(0).and_then(|x| x.get("name")).cloned().unwrap_or(Value::Null) })).collect::<Vec<_>>()).unwrap_or_default())
    };
    let mut out = pick(&v, &["title", "duration", "extractor_key", "thumbnail", "width", "height", "webpage_url", "is_live", "_type"]);
    if let Value::Object(m) = &mut out {
        m.insert("formats".into(), json!(formats));
        m.insert("subs".into(), langs("subtitles"));
        m.insert("autoSubs".into(), langs("automatic_captions"));
    }
    Ok(out)
}

/// Abre o arquivo baixado no player padrão do Windows.
#[tauri::command]
pub fn dl_play(path: PathBuf) -> Result<(), String> {
    if !path.is_file() { return Err("source-missing".into()); }
    std::process::Command::new(if cfg!(windows) { "explorer.exe" } else { "xdg-open" }).arg(&path).spawn().map(|_| ()).map_err(|e| e.to_string())
}

/// Nome de arquivo sem os caracteres que o Windows não aceita.
fn clean_name(name: &str) -> String {
    let s: String = name.chars().map(|c| if r#"<>:"/\|?*"#.contains(c) || c.is_control() { ' ' } else { c }).collect();
    s.trim().trim_end_matches(['.', ' ']).chars().take(180).collect()
}

/// Renomeia o arquivo baixado (a extensão fica). Devolve o caminho novo; "exists" se já houver outro com esse nome.
#[tauri::command]
pub fn dl_rename(path: PathBuf, name: String) -> Result<PathBuf, String> {
    if !path.is_file() { return Err("source-missing".into()); }
    let name = clean_name(&name);
    if name.is_empty() { return Err("empty name".into()); }
    let ext = path.extension().map(|e| format!(".{}", e.to_string_lossy())).unwrap_or_default();
    let new = path.with_file_name(format!("{name}{ext}"));
    if new == path { return Ok(path); }
    // só a caixa mudou (ex.: "video" → "Video"): no Windows é o mesmo arquivo
    let same = new.to_string_lossy().to_lowercase() == path.to_string_lossy().to_lowercase();
    if new.exists() && !same { return Err("exists".into()); }
    std::fs::rename(&path, &new).map_err(|e| match mec_core::command::explain(&e.to_string()) { "unknown" => e.to_string(), c => c.to_string() })?;
    Ok(new)
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
    fn names() {
        assert_eq!(super::clean_name("  Natura vs Boticário: quem? *ganha*.  "), "Natura vs Boticário  quem   ganha");
        assert_eq!(super::clean_name("a/b\\c"), "a b c");
    }

    #[test]
    fn hashes() {
        let sums = "aaaa  yt-dlp\nb1946ac92492d2347c6235b4d2611184b1946ac92492d2347c6235b4d2611184  yt-dlp.exe\n";
        assert_eq!(find_hash(sums, Some("yt-dlp.exe")).as_deref(), Some("b1946ac92492d2347c6235b4d2611184b1946ac92492d2347c6235b4d2611184"));
        let ps = "Algorithm Hash Path\n--------- ---- ----\nSHA256    B1946AC92492D2347C6235B4D2611184B1946AC92492D2347C6235B4D2611184 D:\\a\\deno.zip\n";
        assert_eq!(find_hash(ps, None).as_deref(), Some("b1946ac92492d2347c6235b4d2611184b1946ac92492d2347c6235b4d2611184"));
    }
}
