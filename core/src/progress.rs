//! Progresso do FFmpeg (`-progress pipe:1`): linhas `chave=valor`, um bloco a cada ~0,5 s.

#[derive(Clone, Debug, Default, PartialEq)]
pub struct Progress {
    /// Segundos já codificados.
    pub time: f64,
    pub fps: f64,
    /// Velocidade em relação ao tempo real (2.0 = duas vezes mais rápido).
    pub speed: f64,
    pub frame: u64,
    pub ended: bool,
}

impl Progress {
    /// Lê uma linha. Devolve `true` quando o bloco terminou (linha `progress=`).
    pub fn feed(&mut self, line: &str) -> bool {
        let Some((k, v)) = line.trim().split_once('=') else { return false };
        let v = v.trim();
        match k {
            "out_time_us" | "out_time_ms" => if let Ok(us) = v.parse::<i64>() { if us >= 0 { self.time = us as f64 / 1_000_000.0; } },
            "fps" => self.fps = v.parse().unwrap_or(self.fps),
            "frame" => self.frame = v.parse().unwrap_or(self.frame),
            "speed" => self.speed = v.trim_end_matches('x').parse().unwrap_or(self.speed),
            "progress" => { self.ended = v == "end"; return true; }
            _ => {}
        }
        false
    }

    /// Fração concluída (0..1) dada a duração do vídeo.
    pub fn fraction(&self, duration: f64) -> f64 {
        if self.ended { return 1.0; }
        if duration <= 0.0 { return 0.0; }
        (self.time / duration).clamp(0.0, 0.999)
    }

    /// Segundos que faltam, estimados pela velocidade.
    pub fn eta(&self, duration: f64) -> Option<f64> {
        (self.speed > 0.01).then(|| ((duration - self.time).max(0.0)) / self.speed)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn parses_block() {
        let mut p = Progress::default();
        let block = "frame=600\nfps=118.5\nout_time_us=10010000\nspeed=1.97x\nprogress=continue\n";
        let mut done = false;
        for l in block.lines() { done |= p.feed(l); }
        assert!(done);
        assert_eq!(p.frame, 600);
        assert!((p.time - 10.01).abs() < 1e-9);
        assert!((p.speed - 1.97).abs() < 1e-9);
        assert!((p.fraction(20.02) - 0.5).abs() < 1e-9);
        p.feed("out_time_us=N/A");
        assert!((p.time - 10.01).abs() < 1e-9);
        p.feed("progress=end");
        assert_eq!(p.fraction(20.0), 1.0);
    }
}
