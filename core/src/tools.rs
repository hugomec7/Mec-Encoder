//! Acha o ffmpeg/ffprobe e cria processos sem abrir janela de console no Windows.

use std::path::{Path, PathBuf};
use std::process::Command;

#[cfg(windows)]
const EXE: &str = ".exe";
#[cfg(not(windows))]
const EXE: &str = "";

/// `Command` que não pisca uma janela preta no Windows.
pub fn command(program: &Path) -> Command {
    #[allow(unused_mut)]
    let mut c = Command::new(program);
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x0800_0000;
        c.creation_flags(CREATE_NO_WINDOW);
    }
    c
}

/// Procura `name` (ffmpeg/ffprobe) nas pastas dadas, depois no PATH.
pub fn find(name: &str, dirs: &[PathBuf]) -> Option<PathBuf> {
    let file = format!("{name}{EXE}");
    for d in dirs {
        let p = d.join(&file);
        if p.is_file() { return Some(p); }
    }
    std::env::var_os("PATH").and_then(|paths| {
        std::env::split_paths(&paths).map(|d| d.join(&file)).find(|p| p.is_file())
    })
}

/// Testa se o NVENC funciona de verdade nesta máquina (placa NVIDIA + driver).
pub fn nvenc_available(ffmpeg: &Path) -> bool {
    command(ffmpeg)
        .args(["-hide_banner", "-v", "error", "-f", "lavfi", "-i", "color=c=black:s=256x256:r=30:d=0.2",
               "-c:v", "hevc_nvenc", "-f", "null", "-"])
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
}

/// Nome da placa de vídeo NVIDIA, se o nvidia-smi existir.
pub fn gpu_name() -> Option<String> {
    let smi = find("nvidia-smi", &[]).or_else(|| {
        let p = PathBuf::from(r"C:\Windows\System32\nvidia-smi.exe");
        p.is_file().then_some(p)
    })?;
    let out = command(&smi).args(["--query-gpu=name", "--format=csv,noheader"]).output().ok()?;
    let s = String::from_utf8_lossy(&out.stdout).lines().next()?.trim().to_string();
    (!s.is_empty()).then_some(s)
}
