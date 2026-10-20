//! Presets e configurações do usuário em %APPDATA%\com.hugomec.mecencoder.
//! Ficam fora da pasta do programa: atualizar ou reinstalar não apaga nada.

use std::path::PathBuf;

use mec_core::Preset;
use serde_json::Value;
use tauri::{AppHandle, Manager};

pub fn dir(app: &AppHandle) -> PathBuf {
    let d = app.path().app_config_dir().unwrap_or_else(|_| std::env::temp_dir().join("MecEncoder"));
    let _ = std::fs::create_dir_all(&d);
    d
}

/// Grava num arquivo temporário e troca no final, para nunca deixar um JSON pela metade.
fn write_atomic(path: &PathBuf, text: &str) -> Result<(), String> {
    let tmp = path.with_extension("tmp");
    std::fs::write(&tmp, text).map_err(|e| e.to_string())?;
    if path.exists() {
        let bak = path.with_extension("bak");
        let _ = std::fs::copy(path, bak);
    }
    std::fs::rename(&tmp, path).map_err(|e| e.to_string())
}

fn read_json(path: &PathBuf) -> Option<Value> {
    let text = std::fs::read_to_string(path).ok()
        .or_else(|| std::fs::read_to_string(path.with_extension("bak")).ok())?;
    serde_json::from_str(&text).ok()
}

pub fn load_presets(app: &AppHandle) -> Vec<Preset> {
    read_json(&dir(app).join("presets.json"))
        .and_then(|v| serde_json::from_value::<Vec<Preset>>(v).ok())
        .filter(|v| !v.is_empty())
        .unwrap_or_else(Preset::defaults)
}

pub fn save_presets(app: &AppHandle, presets: &[Preset]) -> Result<(), String> {
    let text = serde_json::to_string_pretty(presets).map_err(|e| e.to_string())?;
    write_atomic(&dir(app).join("presets.json"), &text)
}

pub fn load_settings(app: &AppHandle) -> Value {
    read_json(&dir(app).join("settings.json")).unwrap_or(Value::Null)
}

pub fn save_settings(app: &AppHandle, settings: &Value) -> Result<(), String> {
    let text = serde_json::to_string_pretty(settings).map_err(|e| e.to_string())?;
    write_atomic(&dir(app).join("settings.json"), &text)
}
