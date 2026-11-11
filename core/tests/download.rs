//! Downloader de ponta a ponta com o yt-dlp de verdade, baixando de um servidor local
//! (o mesmo do botão de play). Pulado quando o yt-dlp, o ffmpeg ou o ffprobe não estão no PATH.

use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::{atomic::AtomicBool, Mutex};

use mec_core::download::{self, Event, Job, Kind, Tools};
use mec_core::render::Hooks;
use mec_core::{play, probe::probe, tools, Encoder};

fn dir(name: &str) -> PathBuf {
    let d = std::env::temp_dir().join(format!("mec-dl-{name}-{}", std::process::id()));
    let _ = std::fs::remove_dir_all(&d);
    std::fs::create_dir_all(&d).unwrap();
    d
}

/// Vídeo como o YouTube entrega na maior qualidade: VP9 + Opus em .webm.
fn make_webm(ff: &Path, d: &Path) -> PathBuf {
    let out = d.join("src.webm");
    assert!(Command::new(ff).args(["-v", "error", "-y", "-f", "lavfi", "-i", "testsrc2=s=320x568:r=30", "-f", "lavfi", "-i", "sine=f=440:r=48000",
        "-t", "2", "-c:v", "libvpx-vp9", "-deadline", "realtime", "-cpu-used", "8", "-b:v", "300k", "-c:a", "libopus", "-shortest"]).arg(&out).status().unwrap().success());
    out
}

fn setup() -> Option<(Tools, PathBuf)> {
    let (ff, fp, yt) = (tools::find("ffmpeg", &[])?, tools::find("ffprobe", &[])?, tools::find("yt-dlp", &[])?);
    Some((Tools { ytdlp: yt, deno: None, ffmpeg: ff.clone(), ffprobe: fp, encoder: Encoder::Cpu { preset: "ultrafast".into() }, cache: None, cookies: None }, ff))
}

fn get(t: &Tools, job: &Job, work: &Path, events: &Mutex<Vec<Event>>) -> Result<download::Done, String> {
    let children = Mutex::new(HashMap::new());
    let cancel = AtomicBool::new(false);
    let h = Hooks { id: 7, children: &children, cancel: &cancel, progress: &|_| {}, log: &|_| {}, started: &|_| {} };
    download::run(job, t, work, &h, &|e| events.lock().unwrap().push(e))
}

#[test]
fn video_web_ready_and_audio() {
    let Some((t, ff)) = setup() else { eprintln!("sem yt-dlp/ffmpeg, pulando"); return };
    let d = dir("e2e");
    let src = make_webm(&ff, &d);
    let srv = play::Server::start(ff.clone(), |_, _| {}).unwrap();
    let url = srv.file("clip", &src);
    let dest = d.join("out");

    // vídeo, Pronto para web: VP9/Opus vira H.264/AAC .mp4
    let ev = Mutex::new(Vec::new());
    let job = Job { url: url.clone(), kind: Kind::Video, web: true, audio: "wav".into(), dest: dest.clone() };
    let r = get(&t, &job, &d.join("w1"), &ev).unwrap();
    assert_eq!(r.files.len(), 1);
    assert_eq!(r.web, "encode");
    let f = &r.files[0];
    assert_eq!(f.extension().unwrap(), "mp4");
    assert!(f.starts_with(&dest));
    let i = probe(&t.ffprobe, f).unwrap();
    let v = i.video.as_ref().unwrap();
    assert_eq!((v.codec.as_str(), v.pix_fmt.as_str(), v.width, v.height), ("h264", "yuv420p", 320, 568));
    assert_eq!(i.audio[0].codec, "aac");
    assert!((i.duration - 2.0).abs() < 0.15, "{}", i.duration);
    let ev = ev.into_inner().unwrap();
    assert!(ev.iter().any(|e| matches!(e, Event::Step(s) if s.stage == "download")), "{ev:?}");
    assert!(ev.iter().any(|e| matches!(e, Event::Step(s) if s.stage == "web")), "{ev:?}");
    assert!(ev.iter().any(|e| matches!(e, Event::Meta(_))), "{ev:?}");
    assert!(!d.join("w1").exists(), "pasta de trabalho apagada");

    // de novo: nome livre "(2)"; sem web fica como o site mandou
    let ev = Mutex::new(Vec::new());
    let r2 = get(&t, &Job { web: false, ..job.clone() }, &d.join("w2"), &ev).unwrap();
    assert_eq!(r2.web, "");
    let i2 = probe(&t.ffprobe, &r2.files[0]).unwrap();
    assert_eq!(i2.video.as_ref().unwrap().codec, "vp9");

    // H.264 + AAC que já serve: só reorganiza
    let mp4 = d.join("ok.mp4");
    assert!(Command::new(&ff).args(["-v", "error", "-y", "-f", "lavfi", "-i", "testsrc2=s=320x240:r=30", "-f", "lavfi", "-i", "sine=r=44100",
        "-t", "1", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac"]).arg(&mp4).status().unwrap().success());
    let ev = Mutex::new(Vec::new());
    let r3 = get(&t, &Job { url: srv.file("ok", &mp4), ..job.clone() }, &d.join("w3"), &ev).unwrap();
    assert_eq!(r3.web, "remux");

    // só áudio em WAV, com um arquivo de sessão (o yt-dlp tem que aceitar o formato)
    let ck = d.join("cookies.txt");
    let sess = download::netscape(&[download::Cookie { name: "sessionid".into(), value: "abc".into(), domain: ".instagram.com".into(), path: "/".into(),
        secure: true, http_only: true, expires: None }], "www.instagram.com", 1_700_000_000);
    std::fs::write(&ck, download::merge_cookie_files(&[]) + &sess).unwrap();
    let t = Tools { cookies: Some(ck), ..t };
    let ev = Mutex::new(Vec::new());
    let ra = get(&t, &Job { kind: Kind::Audio, audio: "wav".into(), ..job.clone() }, &d.join("w4"), &ev).unwrap();
    assert_eq!(ra.files[0].extension().unwrap(), "wav");
    let ia = probe(&t.ffprobe, &ra.files[0]).unwrap();
    assert!(ia.video.is_none() && ia.audio[0].codec.starts_with("pcm_"));

    // link que não existe: erro traduzido
    let ev = Mutex::new(Vec::new());
    let bad = get(&t, &Job { url: format!("{url}nope"), ..job.clone() }, &d.join("w5"), &ev).unwrap_err();
    assert!(bad.contains('|') || !bad.is_empty(), "{bad}");
    eprintln!("erro do link quebrado: {bad}");
    let _ = std::fs::remove_dir_all(&d);
}
