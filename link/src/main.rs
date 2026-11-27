//! mec-link.exe: o navegador abre este programa quando você clica na extensão do Mec Encoder (native messaging).
//! Recebe { page, link, kind } pela entrada padrão, escolhe o link e entrega ao app com
//! `mec-encoder.exe --mec-link {"urls":[...],"kind":"video"}`. Com o app aberto, o plugin single-instance
//! leva o pedido para a janela aberta (sem trazer a janela para a frente); com ele fechado, o app abre minimizado.
//!
//! Qual link vai:
//!   1. `link` (botão direito num link ou vídeo): esse.
//!   2. Um link copiado (Ctrl+C / "Copiar link") que ainda não foi enviado: esse. É o caso da timeline do X.
//!   3. A página aberta, se ela for de um vídeo (não a página inicial do site).
//!   Senão responde "no-link" e a extensão mostra o "!".
#![cfg_attr(windows, windows_subsystem = "windows")]

use serde_json::{json, Value};
use std::io::{Read, Write};
use std::path::PathBuf;

fn main() {
    let res = match read_msg() {
        Some(msg) => handle(&msg),
        None => json!({ "ok": false, "error": "bad-message" }),
    };
    reply(&res);
}

fn handle(msg: &Value) -> Value {
    let s = |k: &str| msg.get(k).and_then(|v| v.as_str()).unwrap_or("").trim().to_string();
    let kind = match s("kind").as_str() { "audio" => "audio", "gif" => "gif", _ => "video" };
    if s("action") == "ping" { return json!({ "ok": true, "version": env!("CARGO_PKG_VERSION") }); }

    let (urls, from) = pick(&s("link"), &s("page"));
    if urls.is_empty() { return json!({ "ok": false, "error": "no-link" }); }
    match launch(&json!({ "urls": urls, "kind": kind }).to_string()) {
        Ok(()) => json!({ "ok": true, "urls": urls, "from": from }),
        Err(e) => json!({ "ok": false, "error": e }),
    }
}

/// Escolhe o(s) link(s): botão direito > link copiado ainda não enviado > página de vídeo.
fn pick(link: &str, page: &str) -> (Vec<String>, &'static str) {
    if is_web(link) { return (vec![link.to_string()], "link"); }
    let clip = links(&clipboard_text().unwrap_or_default());
    if !clip.is_empty() {
        let last_file = data_dir().join("browser").join("last-clip.txt");
        let key = clip.join("\n");
        if std::fs::read_to_string(&last_file).map_or(true, |t| t != key) {
            let _ = std::fs::create_dir_all(last_file.parent().unwrap());
            let _ = std::fs::write(&last_file, &key);
            return (clip, "clipboard");
        }
    }
    if page_has_video(page) { return (vec![page.to_string()], "page"); }
    (Vec::new(), "")
}

fn is_web(u: &str) -> bool {
    let l = u.to_ascii_lowercase();
    (l.starts_with("https://") || l.starts_with("http://")) && u.len() > 10 && u.len() < 4096 && !u.contains(char::is_whitespace)
}

/// Links http(s) do texto copiado (no máximo 20, sem repetir).
fn links(text: &str) -> Vec<String> {
    let mut out: Vec<String> = Vec::new();
    for w in text.split_whitespace() {
        let w = w.trim_matches(|c: char| matches!(c, '"' | '\'' | '<' | '>' | '(' | ')' | ',' | ';'));
        if is_web(w) && !out.iter().any(|x| x == w) { out.push(w.to_string()); }
        if out.len() >= 20 { break; }
    }
    out
}

/// A página aberta serve? Não serve a página inicial de um site nem as listas do X/YouTube (timeline, busca...).
fn page_has_video(page: &str) -> bool {
    if !is_web(page) { return false; }
    let rest = page.splitn(2, "://").nth(1).unwrap_or("");
    let (host, path) = rest.split_once('/').unwrap_or((rest, ""));
    let host = host.to_ascii_lowercase();
    let host = host.trim_start_matches("www.").trim_start_matches("mobile.").trim_start_matches("m.");
    let path = path.split(['?', '#']).next().unwrap_or("");
    let parts: Vec<&str> = path.split('/').filter(|p| !p.is_empty()).collect();
    let first = parts.first().map(|p| p.to_ascii_lowercase()).unwrap_or_default();
    if parts.is_empty() && !page.contains("?v=") { return false; }
    match host {
        "x.com" | "twitter.com" => !matches!(first.as_str(), "home" | "explore" | "notifications" | "messages" | "search" | "i" | "settings" | "compose")
            && parts.len() >= 3,                                    // usuario/status/123
        "youtube.com" => matches!(first.as_str(), "watch" | "shorts" | "live" | "embed") || page.contains("?v="),
        "instagram.com" => matches!(first.as_str(), "p" | "reel" | "reels" | "tv"),
        "tiktok.com" => parts.len() >= 3,                           // @usuario/video/123
        _ => true,
    }
}

// ----------------------------------------------------------------------
// Abrir o app

fn data_dir() -> PathBuf {
    std::env::var_os("APPDATA").map(PathBuf::from).unwrap_or_default().join("com.hugomec.mecencoder")
}

/// O app grava o caminho dele em browser\app.txt toda vez que abre. Sem isso, procura ao lado desta pasta bin.
fn app_exe() -> Option<PathBuf> {
    if let Ok(t) = std::fs::read_to_string(data_dir().join("browser").join("app.txt")) {
        let p = PathBuf::from(t.trim());
        if p.is_file() { return Some(p); }
    }
    let here = std::env::current_exe().ok()?;
    let root = here.parent()?.parent()?;
    ["mec-encoder.exe", "Mec Encoder.exe"].iter().map(|n| root.join(n)).find(|p| p.is_file())
}

#[cfg(windows)]
fn launch(payload: &str) -> Result<(), String> {
    use std::os::windows::process::CommandExt;
    use std::process::{Command, Stdio};
    const DETACHED_PROCESS: u32 = 0x0000_0008;
    const CREATE_BREAKAWAY_FROM_JOB: u32 = 0x0100_0000;
    let exe = app_exe().ok_or("app-missing")?;
    // O Windows passa ao filho tudo o que é herdável, inclusive o canal com o navegador (entrada e saída deste
    // programa). Se o app herdasse, o navegador ficaria esperando o app fechar para ler a resposta.
    {
        use std::ffi::c_void;
        #[link(name = "kernel32")]
        extern "system" {
            fn GetStdHandle(n: u32) -> *mut c_void;
            fn SetHandleInformation(h: *mut c_void, mask: u32, flags: u32) -> i32;
        }
        const HANDLE_FLAG_INHERIT: u32 = 1;
        for n in [-10i32 as u32, -11i32 as u32, -12i32 as u32] {   // entrada, saída e erro padrão
            unsafe { let h = GetStdHandle(n); if !h.is_null() { SetHandleInformation(h, HANDLE_FLAG_INHERIT, 0); } }
        }
    }
    let run = |flags: u32| Command::new(&exe).args(["--mec-link", payload])
        .current_dir(exe.parent().unwrap_or(&exe))
        // sem herdar o canal do navegador: senão ele fica esperando o app fechar
        .stdin(Stdio::null()).stdout(Stdio::null()).stderr(Stdio::null())
        .creation_flags(flags).spawn();
    // O Firefox põe este programa num "job" que fecha os filhos junto (MDN, Native messaging): o app sai dele.
    run(DETACHED_PROCESS | CREATE_BREAKAWAY_FROM_JOB)
        .or_else(|_| run(DETACHED_PROCESS))
        .map(|_| ())
        .map_err(|e| format!("launch: {e}"))
}

#[cfg(not(windows))]
fn launch(_payload: &str) -> Result<(), String> { Err("not supported".into()) }

// ----------------------------------------------------------------------
// Native messaging: cada mensagem é um JSON com o tamanho (4 bytes, ordem nativa) na frente.

fn read_msg() -> Option<Value> {
    let mut stdin = std::io::stdin().lock();
    let mut len = [0u8; 4];
    stdin.read_exact(&mut len).ok()?;
    let n = u32::from_ne_bytes(len) as usize;
    if n == 0 || n > 1 << 20 { return None; }
    let mut buf = vec![0u8; n];
    stdin.read_exact(&mut buf).ok()?;
    serde_json::from_slice(&buf).ok()
}

fn reply(v: &Value) {
    let s = v.to_string();
    let mut out = std::io::stdout().lock();
    let _ = out.write_all(&(s.len() as u32).to_ne_bytes());
    let _ = out.write_all(s.as_bytes());
    let _ = out.flush();
}

// ----------------------------------------------------------------------
// Área de transferência (mesmo jeito do Baixar do app)

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
        let mut open = false;
        for _ in 0..5 {
            if OpenClipboard(std::ptr::null_mut()) != 0 { open = true; break; }
            std::thread::sleep(std::time::Duration::from_millis(15));
        }
        if !open { return None; }
        let mut out = None;
        let h = GetClipboardData(CF_UNICODETEXT);
        if !h.is_null() {
            let p = GlobalLock(h) as *const u16;
            if !p.is_null() {
                let max = (GlobalSize(h) / 2).min(20_000);
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn pagina_de_video() {
        assert!(!page_has_video("https://x.com/home"));
        assert!(!page_has_video("https://x.com/fulano"));
        assert!(page_has_video("https://x.com/fulano/status/1234567890"));
        assert!(!page_has_video("https://www.youtube.com/"));
        assert!(page_has_video("https://www.youtube.com/watch?v=dQw4w9WgXcQ"));
        assert!(page_has_video("https://www.youtube.com/shorts/abc"));
        assert!(page_has_video("https://www.instagram.com/reel/abc/"));
        assert!(!page_has_video("https://www.instagram.com/"));
        assert!(page_has_video("https://www.tiktok.com/@fulano/video/123"));
        assert!(page_has_video("https://vimeo.com/123456"));
        assert!(!page_has_video("https://vimeo.com/"));
        assert!(!page_has_video("about:newtab"));
    }

    #[test]
    fn links_do_texto() {
        assert_eq!(links("veja https://x.com/a/status/1 e \"https://youtu.be/xyz\""), vec!["https://x.com/a/status/1", "https://youtu.be/xyz"]);
        assert!(links("só texto, sem link").is_empty());
        assert_eq!(links("https://a.com/x https://a.com/x").len(), 1);
    }
}
