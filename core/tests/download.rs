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
    let job = Job { url: url.clone(), kind: Kind::Video, web: true, audio: "wav".into(), dest: dest.clone(), ..Default::default() };
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

    // GIF: o "GIF" do X é um .mp4 sem som; sai um .gif na largura pedida, em loop
    let gmp4 = d.join("gif.mp4");
    assert!(Command::new(&ff).args(["-v", "error", "-y", "-f", "lavfi", "-i", "testsrc2=s=480x270:r=30", "-t", "1.5", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-an"])
        .arg(&gmp4).status().unwrap().success());
    let ev = Mutex::new(Vec::new());
    let gif = mec_core::preset::Gif { width: 320, fps: "15".into(), quality: "high".into(), repeat: true };
    let rg = get(&t, &Job { url: srv.file("gif", &gmp4), kind: Kind::Gif, gif, ..job.clone() }, &d.join("w6"), &ev).unwrap();
    assert_eq!(rg.files.len(), 1);
    assert_eq!(rg.web, "gif");
    assert_eq!(rg.files[0].extension().unwrap(), "gif");
    let ig = probe(&t.ffprobe, &rg.files[0]).unwrap();
    let vg = ig.video.as_ref().unwrap();
    assert_eq!((vg.codec.as_str(), vg.width, vg.height), ("gif", 320, 180));
    assert!(ev.into_inner().unwrap().iter().any(|e| matches!(e, Event::Step(s) if s.stage == "gif")));

    // nome escolhido (Lista de links) numa subpasta que ainda não existe; o mesmo nome de novo não sobrescreve
    let sub = d.join("dest-lista").join("Memes").join("Tony Stark");
    let ev = Mutex::new(Vec::new());
    let rn = get(&t, &Job { url: srv.file("nome", &gmp4), name: "tony_stark_cliente: chato?".into(), dest: sub.clone(), ..job.clone() }, &d.join("w7"), &ev).unwrap();
    assert_eq!(rn.files[0].parent().unwrap(), sub.as_path());
    assert_eq!(rn.files[0].file_name().unwrap().to_string_lossy(), "tony_stark_cliente chato.mp4");
    let rn2 = get(&t, &Job { url: srv.file("nome2", &gmp4), name: "tony_stark_cliente: chato?".into(), dest: sub.clone(), ..job.clone() }, &d.join("w7b"), &ev).unwrap();
    assert_eq!(rn2.files[0].file_name().unwrap().to_string_lossy(), "tony_stark_cliente chato (2).mp4");
    // modelo: etiquetas sem valor (link direto não tem perfil) somem com o separador; o id é o do arquivo
    let rt = get(&t, &Job { url: srv.file("modelo", &gmp4), name_tpl: "meme_{usuario}_{titulo}".into(), ..job.clone() }, &d.join("w8"), &ev).unwrap();
    let nt = rt.files[0].file_stem().unwrap().to_string_lossy().into_owned();
    assert!(nt.starts_with("meme_") && !nt.contains("__") && nt.len() > 5, "{nt}");

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

/// Página com vídeo, legenda e miniatura (como os sites mostram): até 360p, legenda em .srt e JPG ao lado;
/// e "só a miniatura".
#[test]
fn subs_thumb_and_height() {
    let Some((t, ff)) = setup() else { eprintln!("sem yt-dlp/ffmpeg, pulando"); return };
    let d = dir("extras");
    let src = make_webm(&ff, &d);
    let vtt = d.join("legenda.vtt");
    std::fs::write(&vtt, "WEBVTT\n\n00:00:00.000 --> 00:00:01.500\nOlá, mundo\n").unwrap();
    let jpg = d.join("capa.jpg");
    assert!(Command::new(&ff).args(["-v", "error", "-y", "-f", "lavfi", "-i", "color=c=red:s=320x180", "-frames:v", "1"]).arg(&jpg).status().unwrap().success());
    let srv = play::Server::start(ff.clone(), |_, _| {}).unwrap();
    let (vu, su, ju) = (srv.file("clip.webm", &src), srv.file("legenda.vtt", &vtt), srv.file("capa.jpg", &jpg));
    let html = d.join("page.html");
    std::fs::write(&html, format!("<!doctype html><html><head><title>Teste de página</title><meta property=\"og:title\" content=\"Teste de página\">\
        <meta property=\"og:image\" content=\"{ju}\"></head><body><video controls src=\"{vu}\"><track kind=\"subtitles\" srclang=\"pt\" src=\"{su}\"></video></body></html>")).unwrap();
    let page = srv.file("page.html", &html);
    let dest = d.join("out");
    let ev = Mutex::new(Vec::new());
    let job = Job { url: page.clone(), kind: Kind::Video, web: true, audio: "wav".into(), dest: dest.clone(), height: 360, subs: vec!["pt".into()], thumb: true, ..Default::default() };
    let r = get(&t, &job, &d.join("w1"), &ev).unwrap();
    eprintln!("arquivos: {:?} extras: {:?}", r.files, r.extras);
    assert_eq!(r.files.len(), 1);
    let stem = r.files[0].file_stem().unwrap().to_string_lossy().into_owned();
    assert!(r.extras.iter().any(|x| x.file_name().unwrap().to_string_lossy() == format!("{stem}.pt.srt")), "{:?}", r.extras);
    assert!(r.extras.iter().any(|x| x.file_name().unwrap().to_string_lossy() == format!("{stem}.jpg")), "{:?}", r.extras);
    let srt = std::fs::read_to_string(r.extras.iter().find(|x| x.extension().unwrap() == "srt").unwrap()).unwrap();
    assert!(srt.contains("Olá, mundo") && srt.contains("-->"), "{srt}");

    // só um trecho: 0,5 s a 1,5 s
    let ev = Mutex::new(Vec::new());
    let rs = get(&t, &Job { url: vu.clone(), section: Some((0.5, 1.5)), subs: vec![], thumb: false, height: 0, ..job.clone() }, &d.join("w3"), &ev).unwrap();
    let is = mec_core::probe::probe(&t.ffprobe, &rs.files[0]).unwrap();
    eprintln!("trecho: {:?} {:.2}s", rs.files, is.duration);
    assert!((is.duration - 1.0).abs() < 0.2, "{}", is.duration);
    assert!(rs.files[0].to_string_lossy().contains("(0s-2s)") || rs.files[0].to_string_lossy().contains("(1s-2s)") || rs.files[0].to_string_lossy().contains("s-"), "{:?}", rs.files);

    // só a miniatura
    let ev = Mutex::new(Vec::new());
    let rt = get(&t, &Job { kind: Kind::Thumb, subs: vec![], thumb: false, ..job.clone() }, &d.join("w2"), &ev).unwrap();
    eprintln!("miniatura: {:?}", rt.files);
    assert_eq!(rt.files.len(), 1);
    assert_eq!(rt.files[0].extension().unwrap(), "jpg");
    let _ = std::fs::remove_dir_all(&d);
}
