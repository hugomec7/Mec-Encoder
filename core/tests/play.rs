//! Botão de play: conversão ao vivo e servidor local com FFmpeg de verdade (x264 no lugar do NVENC).
//! Pulados quando o ffmpeg/ffprobe não está no PATH.

use std::io::{Read, Write};
use std::net::TcpStream;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::sync::{Arc, Mutex};
use std::time::Duration;

use mec_core::play::{self, Event, LiveEnc, LiveOpts};
use mec_core::{probe::probe, tools, Preset};

fn tool(name: &str) -> Option<PathBuf> { tools::find(name, &[]) }

fn make(ff: &Path, name: &str) -> PathBuf {
    let d = std::env::temp_dir().join(format!("mec-play-{}", std::process::id()));
    std::fs::create_dir_all(&d).unwrap();
    let out = d.join(name);
    let ok = Command::new(ff).args(["-v", "error", "-y", "-f", "lavfi", "-i", "testsrc2=s=640x360:r=30", "-f", "lavfi", "-i", "sine=f=440:r=48000",
        "-t", "4", "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p", "-c:a", "aac"]).arg(&out).status().unwrap().success();
    assert!(ok);
    out
}

/// Roda os argumentos (saída em pipe:1) e grava o que sair num arquivo.
fn run_to_file(ff: &Path, args: &[String], out: &Path) {
    let o = Command::new(ff).args(args).stdin(Stdio::null()).output().unwrap();
    assert!(o.status.success(), "{}\n{}", args.join(" "), String::from_utf8_lossy(&o.stderr));
    std::fs::write(out, &o.stdout).unwrap();
}

fn count(fp: &Path, f: &Path, what: &str) -> f64 {
    let args: Vec<&str> = match what {
        "frames" => vec!["-v", "error", "-count_frames", "-select_streams", "v:0", "-show_entries", "stream=nb_read_frames", "-of", "csv=p=0"],
        _ => vec!["-v", "error", "-select_streams", "a:0", "-show_entries", "packet=duration_time", "-of", "csv=p=0"],
    };
    let o = Command::new(fp).args(args).arg(f).output().unwrap();
    let t = String::from_utf8_lossy(&o.stdout);
    t.lines().filter_map(|l| l.trim().trim_end_matches(',').parse::<f64>().ok()).sum()
}

fn get(port: u16, path: &str, range: Option<&str>) -> (String, Vec<u8>) {
    let mut s = TcpStream::connect(("127.0.0.1", port)).unwrap();
    s.set_read_timeout(Some(Duration::from_secs(20))).unwrap();
    let r = range.map(|r| format!("Range: {r}\r\n")).unwrap_or_default();
    write!(s, "GET {path} HTTP/1.1\r\nHost: 127.0.0.1\r\n{r}\r\n").unwrap();
    let mut all = Vec::new();
    s.read_to_end(&mut all).unwrap();
    let i = all.windows(4).position(|w| w == b"\r\n\r\n").unwrap();
    (String::from_utf8_lossy(&all[..i]).into_owned(), all[i + 4..].to_vec())
}

#[test]
fn live_cuts_are_frame_exact() {
    let (Some(ff), Some(fp)) = (tool("ffmpeg"), tool("ffprobe")) else { eprintln!("sem ffmpeg, pulando"); return };
    let src = make(&ff, "cuts.mp4");
    let info = probe(&fp, &src).unwrap();
    assert_eq!(play::pick_encoder(&ff, false), LiveEnc::X264, "sem placa: CPU");
    let p = Preset::default();
    // dois trechos de 0,5 s a 30 fps: 15 + 15 quadros, 1 s de áudio
    let o = LiveOpts { parts: vec![(0.5, 1.0), (2.0, 2.5)], output: true, height: 360, fps: (30, 1), enc: LiveEnc::X264, hw: true };
    let out = src.with_file_name("cuts_live.mp4");
    run_to_file(&ff, &play::live_args(&info, &p, &o), &out);
    assert_eq!(count(&fp, &out, "frames"), 30.0);
    let a = count(&fp, &out, "audio");
    assert!((a - 1.0).abs() < 0.03, "áudio {a}");
    // do segundo 3 até o fim: 1 s
    let o = LiveOpts { parts: vec![(3.0, 4.0)], ..o };
    let out = src.with_file_name("tail_live.mp4");
    run_to_file(&ff, &play::live_args(&info, &p, &o), &out);
    assert_eq!(count(&fp, &out, "frames"), 30.0);
    // 59,94 a partir de 30: o quadro da prévia cai no quadro da linha do tempo
    let o = LiveOpts { parts: vec![(1.0, 2.0)], fps: (60000, 1001), ..o };
    let out = src.with_file_name("ntsc_live.mp4");
    run_to_file(&ff, &play::live_args(&info, &p, &o), &out);
    assert_eq!(count(&fp, &out, "frames"), 60.0);
}

#[test]
fn server_file_and_live() {
    let (Some(ff), Some(fp)) = (tool("ffmpeg"), tool("ffprobe")) else { eprintln!("sem ffmpeg, pulando"); return };
    let src = make(&ff, "serve.mp4");
    let info = probe(&fp, &src).unwrap();
    let events: Arc<Mutex<Vec<Event>>> = Arc::default();
    let ev2 = events.clone();
    let srv = play::Server::start(ff.clone(), move |k, e| { assert_eq!(k, "live"); ev2.lock().unwrap().push(e); }).unwrap();

    // arquivo com Range
    let url = srv.file("f1", &src);
    let path = url.split_once(&format!(":{}", srv.port())).unwrap().1.to_string();
    let bytes = std::fs::read(&src).unwrap();
    let (h, body) = get(srv.port(), &path, Some("bytes=10-19"));
    assert!(h.starts_with("HTTP/1.1 206"), "{h}");
    assert!(h.contains(&format!("Content-Range: bytes 10-19/{}", bytes.len())), "{h}");
    assert!(h.contains("Access-Control-Allow-Origin: *"), "{h}");
    assert_eq!(body, bytes[10..20]);
    let (h, body) = get(srv.port(), &path, None);
    assert!(h.starts_with("HTTP/1.1 200"), "{h}");
    assert_eq!(body.len(), bytes.len());
    // senha errada
    let bad = path.replacen('/', "/x", 1);
    assert!(get(srv.port(), &bad, None).0.starts_with("HTTP/1.1 404"));

    // ao vivo: MP4 fragmentado que começa com ftyp/moov
    let o = LiveOpts { parts: vec![(1.0, 4.0)], output: true, height: 360, fps: (30, 1), enc: LiveEnc::X264, hw: true };
    let url = srv.live("live", play::live_args(&info, &Preset::default(), &o));
    let path = url.split_once(&format!(":{}", srv.port())).unwrap().1.to_string();
    let (h, body) = get(srv.port(), &path, Some("bytes=0-"));
    assert!(h.starts_with("HTTP/1.1 200") && h.contains("video/mp4"), "{h}");
    assert_eq!(&body[4..8], b"ftyp");
    assert!(body.windows(4).any(|w| w == b"moof"), "fragmentado");
    let out = src.with_file_name("served_live.mp4");
    std::fs::write(&out, &body).unwrap();
    assert_eq!(count(&fp, &out, "frames"), 90.0);
    std::thread::sleep(Duration::from_millis(200));
    let ev = events.lock().unwrap().clone();
    assert!(ev.iter().any(|e| matches!(e, Event::Speed { .. })), "{ev:?}");
    assert_eq!(ev.last(), Some(&Event::Ended));
    // ao vivo não aceita pedir do meio
    assert!(get(srv.port(), &path, Some("bytes=500-")).0.starts_with("HTTP/1.1 416"));
}

#[test]
fn proxy_file() {
    let (Some(ff), Some(fp)) = (tool("ffmpeg"), tool("ffprobe")) else { eprintln!("sem ffmpeg, pulando"); return };
    let src = make(&ff, "proxy.mp4");
    let info = probe(&fp, &src).unwrap();
    let o = LiveOpts { parts: vec![], output: true, height: 360, fps: (30, 1), enc: LiveEnc::X264, hw: true };
    let out = src.with_file_name("proxy_prev.mp4");
    let st = Command::new(&ff).args(play::proxy_args(&info, &Preset::default(), &o, &out)).stdout(Stdio::null()).status().unwrap();
    assert!(st.success());
    assert_eq!(count(&fp, &out, "frames"), 120.0);
    let pi = probe(&fp, &out).unwrap();
    assert!((pi.duration - 4.0).abs() < 0.05, "{}", pi.duration);
}
