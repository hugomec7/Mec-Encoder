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

/// Como os presets foram carregados.
pub struct Loaded {
    pub presets: Vec<Preset>,
    /// Primeira vez (não havia presets): recebeu os padrões.
    pub first_run: bool,
    /// O arquivo existia mas não pôde ser lido por inteiro: uma cópia foi guardada (nome do arquivo).
    pub recovered: Option<String>,
}

/// Lê os presets do usuário sem nunca trocar por padrões em silêncio:
/// cada preset é lido sozinho (um com problema não derruba os outros), e se algo não puder ser lido,
/// o arquivo inteiro é copiado para presets.broken-<data>.json antes de qualquer gravação.
pub fn load_presets(app: &AppHandle) -> Loaded {
    let d = dir(app);
    let path = d.join("presets.json");
    let exists = path.exists() || path.with_extension("bak").exists();
    if !exists { return Loaded { presets: Preset::defaults(), first_run: true, recovered: None }; }
    let raw = read_json(&path);
    let items: Vec<Value> = match &raw { Some(Value::Array(a)) => a.clone(), _ => vec![] };
    let presets: Vec<Preset> = items.iter().filter_map(|v| serde_json::from_value::<Preset>(v.clone()).ok()).collect();
    let mut recovered = None;
    if raw.is_none() || presets.len() != items.len() {
        let ts = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map_or(0, |t| t.as_secs());
        let name = format!("presets.broken-{ts}.json");
        let _ = std::fs::copy(if path.exists() { path.clone() } else { path.with_extension("bak") }, d.join(&name));
        recovered = Some(name);
    }
    let presets = if presets.is_empty() { Preset::defaults() } else { presets };
    Loaded { presets, first_run: false, recovered }
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
