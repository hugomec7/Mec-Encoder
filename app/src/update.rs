//! Atualização dentro do app.
//!
//! Cada versão publicada no GitHub tem um `latest.json` com o instalador (.msi), o .exe portátil
//! e o SHA-256 de cada um. O app compara a versão, baixa o arquivo certo, confere o hash e:
//! - instalado (.msi): roda `msiexec` em modo passivo e reabre o app;
//! - portátil: troca o próprio .exe (renomeia o atual para .old) e reabre.
//! As configurações ficam em %APPDATA%, então nada se perde.

use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::time::Duration;

use serde::{Deserialize, Serialize};
use serde_json::json;
use sha2::{Digest, Sha256};
use tauri::{AppHandle, Emitter};

pub const LATEST_URL: &str = "https://github.com/hugomec7/Mec-Encoder/releases/latest/download/latest.json";

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct Asset {
    pub url: String,
    pub sha256: String,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct Latest {
    pub version: String,
    #[serde(default)]
    pub notes: String,
    #[serde(default)]
    pub notes_pt: String,
    pub msi: Asset,
    pub portable: Asset,
}

fn parse(v: &str) -> Vec<u64> {
    v.trim().trim_start_matches('v').split(['.', '-', '+']).take(3).map(|p| p.parse().unwrap_or(0)).collect()
}

pub fn newer(remote: &str, local: &str) -> bool { parse(remote) > parse(local) }

/// Portátil = existe `portable.ini` ao lado do .exe.
pub fn is_portable() -> bool {
    std::env::current_exe().ok().and_then(|e| e.parent().map(|d| d.join("portable.ini").is_file())).unwrap_or(false)
}

/// Remove o .exe antigo que sobrou de uma atualização portátil.
pub fn cleanup_old() {
    if let Ok(exe) = std::env::current_exe() {
        let _ = std::fs::remove_file(exe.with_extension("old"));
    }
}

pub fn check(current: &str) -> Result<Option<Latest>, String> {
    let resp = ureq::get(LATEST_URL).timeout(Duration::from_secs(12)).call().map_err(|e| e.to_string())?;
    let latest: Latest = serde_json::from_reader(resp.into_reader()).map_err(|e| e.to_string())?;
    Ok(newer(&latest.version, current).then_some(latest))
}

fn download(app: &AppHandle, asset: &Asset, dest: &Path) -> Result<(), String> {
    let resp = ureq::get(&asset.url).timeout(Duration::from_secs(600)).call().map_err(|e| e.to_string())?;
    let total: u64 = resp.header("Content-Length").and_then(|s| s.parse().ok()).unwrap_or(0);
    let mut reader = resp.into_reader();
    let mut file = std::fs::File::create(dest).map_err(|e| e.to_string())?;
    let mut hasher = Sha256::new();
    let mut buf = vec![0u8; 256 * 1024];
    let mut done: u64 = 0;
    let mut last = std::time::Instant::now();
    loop {
        let n = reader.read(&mut buf).map_err(|e| e.to_string())?;
        if n == 0 { break; }
        file.write_all(&buf[..n]).map_err(|e| e.to_string())?;
        hasher.update(&buf[..n]);
        done += n as u64;
        if last.elapsed() > Duration::from_millis(150) {
            last = std::time::Instant::now();
            let _ = app.emit("update-progress", json!({ "done": done, "total": total }));
        }
    }
    file.flush().map_err(|e| e.to_string())?;
    let got = format!("{:x}", hasher.finalize());
    if !asset.sha256.is_empty() && !got.eq_ignore_ascii_case(&asset.sha256) {
        let _ = std::fs::remove_file(dest);
        return Err("checksum mismatch".into());
    }
    let _ = app.emit("update-progress", json!({ "done": done, "total": done }));
    Ok(())
}

fn detached(program: &str, args: &[String]) -> Result<(), String> {
    let mut c = std::process::Command::new(program);
    c.args(args);
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const DETACHED_PROCESS: u32 = 0x0000_0008;
        const CREATE_NO_WINDOW: u32 = 0x0800_0000;
        c.creation_flags(DETACHED_PROCESS | CREATE_NO_WINDOW);
    }
    c.spawn().map(|_| ()).map_err(|e| e.to_string())
}

/// Baixa e instala. Se der certo, o app precisa fechar logo em seguida.
pub fn install(app: &AppHandle, latest: &Latest) -> Result<(), String> {
    let exe = std::env::current_exe().map_err(|e| e.to_string())?;
    let tmp: PathBuf = std::env::temp_dir().join("MecEncoderUpdate");
    std::fs::create_dir_all(&tmp).map_err(|e| e.to_string())?;
    if is_portable() {
        let new_exe = tmp.join("MecEncoder_new.exe");
        download(app, &latest.portable, &new_exe)?;
        let old = exe.with_extension("old");
        let _ = std::fs::remove_file(&old);
        std::fs::rename(&exe, &old).map_err(|e| e.to_string())?;
        if let Err(e) = std::fs::copy(&new_exe, &exe) {
            let _ = std::fs::rename(&old, &exe);
            return Err(e.to_string());
        }
        detached(&exe.to_string_lossy(), &[])
    } else {
        let msi = tmp.join(format!("MecEncoder_{}_x64.msi", latest.version));
        download(app, &latest.msi, &msi)?;
        // Espera o app fechar, instala por cima (as configurações ficam) e abre a versão nova.
        let script = tmp.join("update.cmd");
        let body = format!(
            "@echo off\r\nping -n 3 127.0.0.1 >nul\r\nmsiexec /i \"{}\" /passive /norestart\r\nstart \"\" \"{}\"\r\n",
            msi.display(), exe.display()
        );
        std::fs::write(&script, body).map_err(|e| e.to_string())?;
        detached("cmd.exe", &["/C".into(), script.to_string_lossy().into_owned()])
    }
}
