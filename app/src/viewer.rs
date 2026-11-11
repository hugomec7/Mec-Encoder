//! Motor de quadros do player (mecview.exe, ao lado do ffmpeg.exe).
//!
//! Fica aberto com os vídeos do Cortador: cada clique na linha do tempo pede um quadro e ele pula direto
//! até lá (lendo na placa de vídeo quando dá), sem abrir um FFmpeg novo a cada vez como a prévia por imagem.
//! O quadro volta em RGBA (resposta binária, sem base64). Se o motor faltar ou cair, o app volta para a
//! prévia por imagem.

use mec_core::{command, MediaInfo, Preset};
use std::collections::HashMap;
use std::io::{BufRead, BufReader, Read, Write};
use std::path::{Path, PathBuf};
use std::process::{Child, ChildStdin, ChildStdout, Stdio};
use std::sync::Mutex;
use std::time::Instant;

struct Proc {
    child: Child,
    stdin: ChildStdin,
    out: BufReader<ChildStdout>,
    /// vídeos abertos: id → caminho
    open: HashMap<u64, PathBuf>,
}

#[derive(Default)]
pub struct Viewer {
    proc: Mutex<Option<Proc>>,
}

pub struct Frame {
    pub width: u32,
    pub height: u32,
    /// tempo do quadro entregue (segundos)
    pub pick: f64,
    pub seeked: bool,
    pub decoded: u32,
    pub ms_decode: f32,
    pub ms_copy: f32,
    pub ms_filter: f32,
    pub ms_engine: f32,
    pub ms_total: f32,
    pub hw: bool,
    /// saiu da memória de quadros (sem ler o arquivo)
    pub cached: bool,
    pub rgba: Vec<u8>,
}

impl Frame {
    /// Cabeçalho de 48 bytes (little endian) + RGBA: w, h, pick (f64), pulou, quadros lidos,
    /// ms ler, ms copiar, ms filtro, ms motor, ms total, bits (1 = placa, 2 = da memória).
    pub fn into_bytes(self) -> Vec<u8> {
        let mut b = Vec::with_capacity(48 + self.rgba.len());
        b.extend(self.width.to_le_bytes());
        b.extend(self.height.to_le_bytes());
        b.extend(self.pick.to_le_bytes());
        b.extend((self.seeked as u32).to_le_bytes());
        b.extend(self.decoded.to_le_bytes());
        for v in [self.ms_decode, self.ms_copy, self.ms_filter, self.ms_engine, self.ms_total] { b.extend(v.to_le_bytes()); }
        b.extend((self.hw as u32 | (self.cached as u32) << 1).to_le_bytes());
        b.extend(self.rgba);
        b
    }
}

/// mecview(.exe) na pasta do ffmpeg.
pub fn exe_next_to(ffmpeg: &Path) -> Option<PathBuf> {
    let name = if cfg!(windows) { "mecview.exe" } else { "mecview" };
    let p = ffmpeg.parent()?.join(name);
    p.is_file().then_some(p)
}

impl Viewer {
    fn spawn(exe: &Path) -> Result<Proc, String> {
        let mut child = mec_core::tools::command(exe)
            .stdin(Stdio::piped()).stdout(Stdio::piped()).stderr(Stdio::null())
            .spawn().map_err(|e| format!("viewer start: {e}"))?;
        let stdin = child.stdin.take().ok_or("viewer stdin")?;
        let out = BufReader::with_capacity(1 << 20, child.stdout.take().ok_or("viewer stdout")?);
        Ok(Proc { child, stdin, out, open: HashMap::new() })
    }

    /// Quadro do vídeo `id` no tempo `t`, passado pelo filtro da prévia (resultado ou original) com o lado maior `max`.
    pub fn frame(&self, exe: &Path, id: u64, info: &MediaInfo, cfg: &Preset, t: f64, output: bool, max: u32, hw: bool) -> Result<Frame, String> {
        let started = Instant::now();
        let vf = command::view_filters(info, cfg, output, max);
        let t = t.clamp(0.0, (info.duration - 0.001).max(0.0));
        let mut guard = self.proc.lock().unwrap();
        // uma tentativa de novo se o motor tiver caído
        for attempt in 0..2 {
            if guard.is_none() { *guard = Some(Self::spawn(exe)?); }
            let p = guard.as_mut().unwrap();
            match Self::ask(p, id, info, &vf, t, hw) {
                Ok(mut f) => { f.ms_total = started.elapsed().as_secs_f32() * 1000.0; return Ok(f); }
                Err(e) if e.starts_with("io:") && attempt == 0 => { let mut dead = guard.take().unwrap(); let _ = dead.child.kill(); let _ = dead.child.wait(); }
                Err(e) => return Err(e),
            }
        }
        Err("viewer failed".into())
    }

    fn ask(p: &mut Proc, id: u64, info: &MediaInfo, vf: &str, t: f64, hw: bool) -> Result<Frame, String> {
        let io = |e: std::io::Error| format!("io: {e}");
        if p.open.get(&id) != Some(&info.path) {
            writeln!(p.stdin, "open {id} {} {}", hw as u8, info.path.to_string_lossy()).map_err(io)?;
            p.stdin.flush().map_err(io)?;
            let line = Self::line(&mut p.out)?;
            if !line.starts_with("ok") { return Err(format!("viewer {line}")); }
            p.open.insert(id, info.path.clone());
        }
        writeln!(p.stdin, "frame {id} {t:.6} {vf}").map_err(io)?;
        p.stdin.flush().map_err(io)?;
        let line = Self::line(&mut p.out)?;
        let f: Vec<&str> = line.split_whitespace().collect();
        if f.first() != Some(&"img") || f.len() < 12 { return Err(format!("viewer {line}")); }
        let num = |i: usize| f[i].parse::<f64>().unwrap_or(0.0);
        let (w, h, n) = (num(1) as u32, num(2) as u32, num(3) as usize);
        let mut rgba = vec![0u8; n];
        p.out.read_exact(&mut rgba).map_err(io)?;
        Ok(Frame {
            width: w, height: h, pick: num(4), seeked: num(5) > 0.0, decoded: num(6) as u32,
            ms_decode: num(7) as f32, ms_copy: num(8) as f32, ms_filter: num(9) as f32, ms_engine: num(10) as f32,
            ms_total: 0.0, hw: num(11) > 0.0, cached: f.get(12).map_or(false, |x| *x == "1"), rgba,
        })
    }

    fn line(out: &mut BufReader<ChildStdout>) -> Result<String, String> {
        let mut s = String::new();
        let n = out.read_line(&mut s).map_err(|e| format!("io: {e}"))?;
        if n == 0 { return Err("io: viewer closed".into()); }
        Ok(s.trim_end().to_string())
    }

    /// Fecha o motor (sair do app).
    pub fn stop(&self) {
        if let Some(mut p) = self.proc.lock().unwrap().take() {
            let _ = writeln!(p.stdin, "quit");
            let _ = p.stdin.flush();
            std::thread::sleep(std::time::Duration::from_millis(50));
            let _ = p.child.kill();
            let _ = p.child.wait();
        }
    }
}
