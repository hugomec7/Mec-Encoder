//! Testes de ponta a ponta com FFmpeg de verdade (encoder de CPU no lugar do NVENC).
//! São pulados quando o ffmpeg/ffprobe não está no PATH.

use std::path::{Path, PathBuf};
use std::process::Command;

use mec_core::{build, output_path, preview_args, probe::probe, tools, Encoder, Preset};

fn tool(name: &str) -> Option<PathBuf> { tools::find(name, &[]) }

fn dir(name: &str) -> PathBuf {
    let d = std::env::temp_dir().join(format!("mec-e2e-{name}-{}", std::process::id()));
    std::fs::create_dir_all(&d).unwrap();
    d
}

/// Vídeo parecido com o do iPhone: gravado deitado com rotação -90, frame rate variável,
/// HLG/Rec.2020 10-bit e duas faixas de áudio mono (dois microfones).
fn make_iphone_like(ff: &Path, d: &Path, hdr: bool) -> PathBuf {
    let base = d.join(if hdr { "base_hdr.mov" } else { "base.mov" });
    let mut c = Command::new(ff);
    c.args(["-v", "error", "-y", "-f", "lavfi", "-i", "testsrc2=s=640x360:r=60",
            "-f", "lavfi", "-i", "sine=f=440:r=48000", "-f", "lavfi", "-i", "sine=f=880:r=48000", "-t", "3",
            "-map", "0", "-map", "1", "-map", "2",
            "-vf", if hdr { "select='not(eq(mod(n\\,7)\\,0))',format=yuv420p10le,setparams=color_trc=arib-std-b67:color_primaries=bt2020:colorspace=bt2020nc" }
                   else { "select='not(eq(mod(n\\,7)\\,0))',format=yuv420p10le" }, "-fps_mode", "vfr",
            "-c:v", "libx265", "-preset", "ultrafast", "-x265-params", "log-level=error", "-tag:v", "hvc1",
            "-c:a", "aac", "-ac", "1"]);
    if hdr { c.args(["-color_trc", "arib-std-b67", "-color_primaries", "bt2020", "-colorspace", "bt2020nc"]); }
    c.arg(&base);
    assert!(c.status().unwrap().success());
    let out = d.join(if hdr { "IMG_HDR.MOV" } else { "IMG_0001.MOV" });
    assert!(Command::new(ff).args(["-v", "error", "-y", "-display_rotation", "-90", "-i"]).arg(&base)
        .args(["-map", "0", "-c", "copy"]).arg(&out).status().unwrap().success());
    out
}

fn run(ff: &Path, args: &[String]) {
    let o = Command::new(ff).args(args).output().unwrap();
    assert!(o.status.success(), "ffmpeg falhou:\n{}\n{}", args.join(" "), String::from_utf8_lossy(&o.stderr));
}

#[test]
fn iphone_to_cfr_and_proxy() {
    let (Some(ff), Some(fp)) = (tool("ffmpeg"), tool("ffprobe")) else { eprintln!("sem ffmpeg, pulando"); return };
    let d = dir("sdr");
    let src = make_iphone_like(&ff, &d, false);
    let info = probe(&fp, &src).unwrap();
    let v = info.video.as_ref().unwrap();
    assert_eq!((v.width, v.height, v.rotation), (360, 640, 90));
    assert!(v.vfr, "fonte deveria ser VFR: {} vs {}", v.fps, v.fps_nominal);
    assert_eq!(info.audio.len(), 2);

    let cpu = Encoder::Cpu { preset: "ultrafast".into() };
    // Bruto do iPhone → 59,94 constante, estéreo com as duas faixas.
    let mut p = Preset::defaults().into_iter().find(|p| p.id == "iphone-4k60").unwrap();
    p.audio.codec = "aac".into(); p.audio.tracks = vec![1, 2]; // dois microfones → estéreo
    let out = output_path(&src, &p);
    let plan = build(&info, &p, &cpu, &out);
    run(&ff, &plan.args);
    let o = probe(&fp, &out).unwrap();
    let ov = o.video.as_ref().unwrap();
    assert_eq!((ov.width, ov.height, ov.rotation), (360, 640, 0), "deve sair em pé e sem metadado de rotação");
    // RAW: FPS Original em CFR → o fps nominal do arquivo (60), constante
    assert!(!ov.vfr && (ov.fps_nominal - 60.0).abs() < 0.01, "fps {} / {}", ov.fps, ov.fps_nominal);
    assert_eq!(o.audio.len(), 1);
    assert_eq!(o.audio[0].channels, 2);
    mec_core::command::verify(&info, &o).unwrap();

    // Proxy 25% numa subpasta.
    let px = Preset::defaults().into_iter().find(|p| p.id == "proxy").unwrap();
    let out = output_path(&src, &px);
    assert!(out.to_string_lossy().contains("proxy"));
    std::fs::create_dir_all(out.parent().unwrap()).unwrap();
    run(&ff, &build(&info, &px, &cpu, &out).args);
    let o = probe(&fp, &out).unwrap();
    let ov = o.video.unwrap();
    assert_eq!((ov.width, ov.height, ov.rotation), (90, 160, 0));

    // Prévia: um JPEG do resultado.
    let jpg = Command::new(&ff).args(preview_args(&info, &px, 1.0, true, 480)).output().unwrap();
    assert!(jpg.status.success() && jpg.stdout.starts_with(&[0xFF, 0xD8]), "{}", String::from_utf8_lossy(&jpg.stderr));
    let _ = std::fs::remove_dir_all(&d);
}

#[test]
fn hlg_to_rec709() {
    let (Some(ff), Some(fp)) = (tool("ffmpeg"), tool("ffprobe")) else { eprintln!("sem ffmpeg, pulando"); return };
    let d = dir("hdr");
    let src = make_iphone_like(&ff, &d, true);
    let info = probe(&fp, &src).unwrap();
    assert_eq!(info.video.as_ref().unwrap().hdr, "HLG");
    // RAW tem HDR automático: converte porque o vídeo é HLG
    let p = Preset::defaults().into_iter().find(|p| p.id == "iphone-4k60").unwrap();
    assert!(p.hdr_to_sdr);
    let out = d.join("hdr_out.mp4");
    run(&ff, &build(&info, &p, &Encoder::Cpu { preset: "ultrafast".into() }, &out).args);
    let o = probe(&fp, &out).unwrap();
    let ov = o.video.unwrap();
    assert_eq!(ov.transfer, "bt709");
    assert_eq!(ov.primaries, "bt709");
    assert_eq!(ov.hdr, "");
    assert_eq!(ov.bit_depth, 10);
    assert_eq!((ov.width, ov.height), (360, 640));
    let _ = std::fs::remove_dir_all(&d);
}

/// Parecido com a Sony FX30: H.264 4:2:2 10-bit, 59,94 constante, gravado em pé (rotação 270).
#[test]
fn fx30_422_10bit_rotated() {
    let (Some(ff), Some(fp)) = (tool("ffmpeg"), tool("ffprobe")) else { eprintln!("sem ffmpeg, pulando"); return };
    let d = dir("fx30");
    let base = d.join("base.mp4");
    let ok = Command::new(&ff).args(["-v", "error", "-y", "-f", "lavfi", "-i", "testsrc2=s=640x360:r=60000/1001", "-t", "2",
        "-pix_fmt", "yuv422p10le", "-c:v", "libx264", "-profile:v", "high422", "-preset", "ultrafast"]).arg(&base).status().unwrap().success();
    if !ok { eprintln!("libx264 sem 4:2:2 10-bit, pulando"); return; }
    let src = d.join("C0001.MP4");
    assert!(Command::new(&ff).args(["-v", "error", "-y", "-display_rotation", "90", "-i"]).arg(&base)
        .args(["-c", "copy"]).arg(&src).status().unwrap().success());
    let info = probe(&fp, &src).unwrap();
    let v = info.video.as_ref().unwrap();
    assert_eq!((v.width, v.height, v.rotation, v.pix_fmt.as_str()), (360, 640, 270, "yuv422p10le"));
    assert!(!mec_core::command::nvdec_supported(v, false));
    let mut p = Preset::defaults().into_iter().find(|p| p.id == "iphone-4k60").unwrap();
    p.codec = "h265".into(); p.bits = 10;
    let out = d.join("fx30_out.mp4");
    run(&ff, &build(&info, &p, &Encoder::Cpu { preset: "ultrafast".into() }, &out).args);
    let o = probe(&fp, &out).unwrap();
    let ov = o.video.unwrap();
    assert_eq!((ov.width, ov.height, ov.rotation), (360, 640, 0));
    assert_eq!(ov.pix_fmt, "yuv420p10le");
    let _ = std::fs::remove_dir_all(&d);
}

/// "Igual ao XAVC": FX30 com tudo em Original sai H.264 4:2:2 10-bit, em pé, .mp4 com PCM "twos" e o timecode da câmera.
#[test]
fn fx30_like_xavc() {
    let (Some(ff), Some(fp)) = (tool("ffmpeg"), tool("ffprobe")) else { eprintln!("sem ffmpeg, pulando"); return };
    let d = dir("xavc");
    let base = d.join("base.mov");
    let ok = Command::new(&ff).args(["-v", "error", "-y", "-f", "lavfi", "-i", "testsrc2=s=640x360:r=60000/1001:d=2",
        "-f", "lavfi", "-i", "sine=f=440:sample_rate=48000:d=2", "-af", "pan=stereo|c0=c0|c1=c0",
        "-pix_fmt", "yuv422p10le", "-c:v", "libx264", "-profile:v", "high422", "-preset", "ultrafast", "-c:a", "pcm_s16be",
        "-timecode", "07:51:07:46"]).arg(&base).status().unwrap().success();
    if !ok { eprintln!("libx264 sem 4:2:2 10-bit, pulando"); return; }
    let src = d.join("C0579.MP4");
    assert!(Command::new(&ff).args(["-v", "error", "-y", "-display_rotation", "90", "-i"]).arg(&base)
        .args(["-map", "0", "-c", "copy", "-f", "mov", "-brand", "mp42"]).arg(&src).status().unwrap().success());
    let info = probe(&fp, &src).unwrap();
    assert_eq!(info.timecode, "07:51:07:46");
    let mut p = Preset::defaults().into_iter().find(|p| p.id == "iphone-4k60").unwrap();
    p.codec = "source".into(); p.bits = 0; p.chroma = "source".into(); p.container = "source".into(); p.fps.value = "source".into();
    p.audio.codec = "copy".into(); p.output.suffix = mec_core::preset::Toggle { on: true, text: "_x".into() };
    let out = output_path(&src, &mec_core::command::resolve(&info, &p));
    assert!(out.to_string_lossy().ends_with("C0579_x.mp4"), "{}", out.display());
    run(&ff, &build(&info, &p, &Encoder::Cpu { preset: "ultrafast".into() }, &out).args);
    let o = probe(&fp, &out).unwrap();
    let ov = o.video.as_ref().unwrap();
    assert_eq!((ov.codec.as_str(), ov.pix_fmt.as_str(), ov.width, ov.height, ov.rotation), ("h264", "yuv422p10le", 360, 640, 0));
    assert_eq!(o.audio[0].codec, "pcm_s16be");
    assert_eq!(o.timecode, "07:51:07:46");
    let tag = Command::new(&fp).args(["-v", "error", "-select_streams", "a:0", "-show_entries", "stream=codec_tag_string", "-of", "csv=p=0"]).arg(&out).output().unwrap();
    assert_eq!(String::from_utf8_lossy(&tag.stdout).trim(), "twos");
    let _ = std::fs::remove_dir_all(&d);
}


/// Converter só áudio: MP3 → WAV 24-bit, vídeo → MP3 (extrai o áudio), WAV → FLAC.
#[test]
fn audio_only() {
    let (Some(ff), Some(fp)) = (tool("ffmpeg"), tool("ffprobe")) else { eprintln!("sem ffmpeg, pulando"); return };
    let d = dir("audio");
    let mp3 = d.join("musica.mp3");
    if !Command::new(&ff).args(["-v", "error", "-y", "-f", "lavfi", "-i", "sine=f=440:sample_rate=44100:d=3", "-ac", "2", "-c:a", "libmp3lame", "-b:a", "192k"]).arg(&mp3).status().unwrap().success() {
        eprintln!("sem libmp3lame, pulando"); return;
    }
    let info = probe(&fp, &mp3).unwrap();
    assert!(info.video.is_none() && info.audio.len() == 1);
    let presets = Preset::audio_defaults();
    let get = |id: &str| presets.iter().find(|p| p.id == id).unwrap().clone();
    // MP3 → WAV 24-bit, mesma taxa (44,1 kHz)
    let wav = get("audio-wav");
    let out = output_path(&mp3, &wav);
    assert!(out.to_string_lossy().ends_with("musica.wav"));
    run(&ff, &mec_core::command::build_audio(&info, &wav, &out).args);
    let o = probe(&fp, &out).unwrap();
    assert_eq!((o.audio[0].codec.as_str(), o.audio[0].sample_rate, o.audio[0].channels), ("pcm_s24le", 44100, 2));
    mec_core::command::verify(&info, &o).unwrap();
    // WAV → FLAC (mantém 24-bit)
    let wi = probe(&fp, &out).unwrap();
    let flac = get("audio-flac");
    let fo = output_path(&out, &flac);
    run(&ff, &mec_core::command::build_audio(&wi, &flac, &fo).args);
    let o = probe(&fp, &fo).unwrap();
    assert_eq!(o.audio[0].codec, "flac");
    assert_eq!(o.audio[0].bits, 24);
    // Vídeo do iPhone → MP3 320
    let src = make_iphone_like(&ff, &d, false);
    let vinfo = probe(&fp, &src).unwrap();
    let m = get("audio-mp3");
    let mo = output_path(&src, &m);
    assert!(mo.to_string_lossy().ends_with("IMG_0001.mp3"));
    run(&ff, &mec_core::command::build_audio(&vinfo, &m, &mo).args);
    let o = probe(&fp, &mo).unwrap();
    assert!(o.video.is_none());
    assert_eq!(o.audio[0].codec, "mp3");
    mec_core::command::verify(&vinfo, &o).unwrap();
    let _ = std::fs::remove_dir_all(&d);
}


/// Converter imagens: PNG transparente → JPG (fundo branco) com metade do tamanho, → WebP, e JPG → PNG.
#[test]
fn images() {
    let (Some(ff), Some(fp)) = (tool("ffmpeg"), tool("ffprobe")) else { eprintln!("sem ffmpeg, pulando"); return };
    let d = dir("img");
    let png = d.join("logo.png");
    assert!(Command::new(&ff).args(["-v", "error", "-y", "-f", "lavfi", "-i",
        "testsrc2=s=800x600,format=rgba,geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='if(lt(X,400),0,255)'", "-frames:v", "1"]).arg(&png).status().unwrap().success());
    let info = probe(&fp, &png).unwrap();
    assert!(info.is_image);
    let presets = Preset::image_defaults();
    let get = |id: &str| presets.iter().find(|p| p.id == id).unwrap().clone();
    // PNG → JPG 50%
    let mut jpg = get("image-jpg"); jpg.scale = "50".into();
    let out = output_path(&png, &jpg);
    assert!(out.to_string_lossy().ends_with("logo.jpg"));
    run(&ff, &mec_core::command::build_image(&info, &jpg, &out).args);
    let o = probe(&fp, &out).unwrap();
    let v = o.video.as_ref().unwrap();
    assert_eq!((v.codec.as_str(), v.width, v.height), ("mjpeg", 400, 300));
    mec_core::command::verify(&info, &o).unwrap();
    // o lado que era transparente ficou branco
    let px = Command::new(&ff).args(["-v", "error", "-i"]).arg(&out).args(["-vf", "crop=2:2:10:150,format=gray", "-f", "rawvideo", "-"]).output().unwrap().stdout;
    assert!(px[0] > 240, "fundo deveria ser branco: {}", px[0]);
    // PNG → WebP
    let webp = get("image-webp");
    let wo = output_path(&png, &webp);
    if Command::new(&ff).args(["-hide_banner", "-encoders"]).output().map_or(false, |o| String::from_utf8_lossy(&o.stdout).contains("libwebp")) {
        run(&ff, &mec_core::command::build_image(&info, &webp, &wo).args);
        assert_eq!(probe(&fp, &wo).unwrap().video.unwrap().codec, "webp");
    }
    // JPG → PNG (girando 90)
    let ji = probe(&fp, &out).unwrap();
    let mut pp = get("image-png"); pp.rotate = 90;
    let po = output_path(&out, &pp);
    run(&ff, &mec_core::command::build_image(&ji, &pp, &po).args);
    let o = probe(&fp, &po).unwrap();
    let v = o.video.unwrap();
    assert_eq!((v.codec.as_str(), v.width, v.height), ("png", 300, 400));
    let _ = std::fs::remove_dir_all(&d);
}

/// Proporção: vídeo em pé (girado) → 1:1 cortando e 16:9 com barras; imagem → 4:5.
#[test]
fn aspect_ratio_e2e() {
    let (Some(ff), Some(fp)) = (tool("ffmpeg"), tool("ffprobe")) else { eprintln!("sem ffmpeg, pulando"); return };
    let d = dir("aspect");
    let src = make_iphone_like(&ff, &d, false); // 360x640 em pé
    let info = probe(&fp, &src).unwrap();
    let cpu = Encoder::Cpu { preset: "ultrafast".into() };
    let mut p = Preset::defaults().into_iter().find(|p| p.id == "iphone-4k60").unwrap();
    p.aspect = "1:1".into();
    let out = d.join("sq.mp4");
    run(&ff, &build(&info, &p, &cpu, &out).args);
    let v = probe(&fp, &out).unwrap().video.unwrap();
    assert_eq!((v.width, v.height, v.rotation), (360, 360, 0));
    p.aspect = "16:9".into(); p.aspect_mode = "pad".into();
    let out = d.join("wide.mp4");
    run(&ff, &build(&info, &p, &cpu, &out).args);
    let v = probe(&fp, &out).unwrap().video.unwrap();
    assert_eq!((v.width, v.height), (1138, 640));
    // canto esquerdo é barra preta
    let px = Command::new(&ff).args(["-v", "error", "-i"]).arg(&out).args(["-frames:v", "1", "-vf", "crop=2:2:10:300,format=gray", "-f", "rawvideo", "-"]).output().unwrap().stdout;
    assert!(px[0] < 30, "barra deveria ser preta: {}", px[0]);
    // imagem 800x600 → 4:5 cortando = 480x600
    let png = d.join("foto.png");
    assert!(Command::new(&ff).args(["-v", "error", "-y", "-f", "lavfi", "-i", "testsrc2=s=800x600", "-frames:v", "1"]).arg(&png).status().unwrap().success());
    let ii = probe(&fp, &png).unwrap();
    let mut ip = Preset::image_defaults().into_iter().find(|p| p.id == "image-png").unwrap();
    ip.aspect = "4:5".into();
    let io = output_path(&png, &ip);
    run(&ff, &mec_core::command::build_image(&ii, &ip, &io).args);
    let v = probe(&fp, &io).unwrap().video.unwrap();
    assert_eq!((v.width, v.height), (480, 600));
    let _ = std::fs::remove_dir_all(&d);
}

#[test]
fn trim_e2e() {
    let (Some(ff), Some(fp)) = (tool("ffmpeg"), tool("ffprobe")) else { eprintln!("sem ffmpeg, pulando"); return };
    let d = dir("trim");
    let src = make_iphone_like(&ff, &d, false);
    let info = probe(&fp, &src).unwrap();
    let p = mec_core::command::resolve(&info, &Preset::defaults().into_iter().find(|p| p.id == "iphone-4k60").unwrap());
    let out = d.join("trecho.mp4");
    let mut plan = build(&info, &p, &Encoder::Cpu { preset: "ultrafast".into() }, &out);
    let (a, b) = mec_core::command::trim_range(&info, 0.5, 2.0).unwrap();
    mec_core::command::apply_trim(&mut plan, &info, a, b);
    run(&ff, &plan.args);
    let o = probe(&fp, &out).unwrap();
    assert!((o.duration - 1.5).abs() < 0.1, "duração do trecho: {}", o.duration);
    assert!(!o.audio.is_empty());
}

#[test]
fn render_api() {
    use mec_core::render::{render, Engine, Hooks};
    use std::sync::{atomic::AtomicBool, Mutex};
    let (Some(ff), Some(fp)) = (tool("ffmpeg"), tool("ffprobe")) else { eprintln!("sem ffmpeg, pulando"); return };
    let d = dir("render");
    let src = make_iphone_like(&ff, &d, false);
    let info = probe(&fp, &src).unwrap();
    let e = Engine { ffmpeg: ff, ffprobe: fp, encoder: Encoder::Cpu { preset: "ultrafast".into() }, gpu: None };
    let children = Mutex::new(std::collections::HashMap::new());
    let cancel = AtomicBool::new(false);
    let ticks = Mutex::new(0usize);
    let started = Mutex::new(None);
    let h = Hooks { id: 1, children: &children, cancel: &cancel, progress: &|_| { *ticks.lock().unwrap() += 1; }, log: &|_| {},
                    started: &|p| { *started.lock().unwrap() = Some(p.to_path_buf()); } };
    let mut p = Preset::defaults().into_iter().find(|p| p.id == "iphone-4k60").unwrap();
    p.output.folder = mec_core::preset::Toggle { on: true, text: d.join("saida").to_string_lossy().into_owned() };
    let nm = mec_core::Naming { dir: "Cartao/A".into(), n: 1, date: "2026-10-27".into(), time: "10-00".into(), part: 0 };
    let done = render(&e, &info, &p, &nm, Some((0.5, 2.5)), &h).unwrap();
    assert_eq!(done.output.parent().unwrap(), d.join("saida").join("Cartao").join("A"));
    assert_eq!(started.lock().unwrap().as_deref(), Some(done.output.as_path()));
    assert!(done.size > 0);
    assert_eq!(done.mode, "cpu-encode");
    assert!(!done.delete_source, "preset sem Apagar o original");
    // com "Apagar o original" ligado, um corte também apaga (a interface manda para a Lixeira)
    let mut pd = p.clone(); pd.output.delete_source = true;
    let dd = render(&e, &info, &pd, &nm, Some((0.5, 2.5)), &h).unwrap();
    assert!(dd.delete_source, "corte com Apagar o original ligado");
    let o = probe(&tool("ffprobe").unwrap(), &done.output).unwrap();
    assert!((o.duration - 2.0).abs() < 0.1, "{}", o.duration);
    // arquivo que não existe: erro com código
    let mut gone = info.clone(); gone.path = d.join("nao-existe.mov");
    assert_eq!(render(&e, &gone, &p, &nm, None, &h).unwrap_err(), "source-missing");
}

/// Prévia (e miniatura) de imagem: um JPEG com o preset de imagem e com o padrão de vídeo.
#[test]
fn image_preview() {
    let (Some(ff), Some(fp)) = (tool("ffmpeg"), tool("ffprobe")) else { eprintln!("sem ffmpeg, pulando"); return };
    let d = dir("imgprev");
    for (name, src) in [("a.png", "testsrc2=s=800x600,format=rgba"), ("b.jpg", "testsrc2=s=1080x1920")] {
        let f = d.join(name);
        assert!(Command::new(&ff).args(["-v", "error", "-y", "-f", "lavfi", "-i", src, "-frames:v", "1"]).arg(&f).status().unwrap().success());
        let info = probe(&fp, &f).unwrap();
        for p in [Preset::default(), Preset::image_defaults()[0].clone()] {
            for out in [false, true] {
                let args = mec_core::command::preview_args(&info, &p, 0.0, out, 480);
                let o = Command::new(&ff).args(&args).output().unwrap();
                assert!(o.status.success() && o.stdout.len() > 1000, "{name} {} out={out}: {}\n{}", p.id, String::from_utf8_lossy(&o.stderr), args.join(" "));
            }
        }
    }
}

/// Vários trechos: separados (_01, _02) e juntos num arquivo só.
#[test]
fn cuts_split_and_join() {
    use mec_core::render::{render_cuts, Engine, Hooks};
    use std::sync::{atomic::AtomicBool, Mutex};
    let (Some(ff), Some(fp)) = (tool("ffmpeg"), tool("ffprobe")) else { eprintln!("sem ffmpeg, pulando"); return };
    let d = dir("cuts");
    let src = make_iphone_like(&ff, &d, false);
    let info = probe(&fp, &src).unwrap();
    let e = Engine { ffmpeg: ff, ffprobe: fp.clone(), encoder: Encoder::Cpu { preset: "ultrafast".into() }, gpu: None };
    let children = Mutex::new(std::collections::HashMap::new());
    let cancel = AtomicBool::new(false);
    let last = Mutex::new(0.0f64);
    let h = Hooks { id: 1, children: &children, cancel: &cancel, progress: &|t| { let mut l = last.lock().unwrap(); assert!(t.p <= 1.0); *l = t.p; }, log: &|_| {}, started: &|_| {} };
    let p = Preset::defaults().into_iter().find(|p| p.id == "iphone-4k60").unwrap();
    let nm = mec_core::Naming::default();
    let cuts = [(2.0, 2.8), (0.2, 1.0)];
    // separados, em ordem de tempo
    let s = render_cuts(&e, &info, &p, &nm, &cuts, false, &h).unwrap();
    assert_eq!(s.parts.len(), 2);
    let names: Vec<String> = s.parts.iter().map(|p| p.file_name().unwrap().to_string_lossy().into_owned()).collect();
    assert!(names[0].contains("_01.") && names[1].contains("_02."), "{names:?}");
    for part in &s.parts { let o = probe(&fp, part).unwrap(); assert!((o.duration - 0.8).abs() < 0.1, "{}", o.duration); }
    assert!(!s.delete_source);
    let mut pd = p.clone(); pd.output.delete_source = true;
    let sd = render_cuts(&e, &info, &pd, &nm, &cuts, false, &h).unwrap();
    assert!(sd.delete_source, "vários cortes com Apagar o original ligado");
    for part in &sd.parts { let _ = std::fs::remove_file(part); }
    // juntos: um arquivo com a soma, sem sobras escondidas
    let j = render_cuts(&e, &info, &p, &nm, &cuts, true, &h).unwrap();
    assert_eq!(j.parts.len(), 1);
    let o = probe(&fp, &j.output).unwrap();
    assert!((o.duration - 1.6).abs() < 0.15, "duração juntada: {}", o.duration);
    assert!(!o.audio.is_empty() && o.video.is_some());
    let left: Vec<_> = std::fs::read_dir(&d).unwrap().flatten().map(|x| x.file_name().to_string_lossy().into_owned()).filter(|n| n.starts_with('.')).collect();
    assert!(left.is_empty(), "sobrou: {left:?}");
}

/// Um corte só com áudio copiado: o áudio é regravado e começa junto do vídeo, sem ~1 s escondido
/// antes do corte (o MPC tocava esse pedaço e travava o vídeo no começo).
#[test]
fn single_cut_audio_starts_with_video() {
    use mec_core::render::{render_cuts, Engine, Hooks};
    use std::sync::{atomic::AtomicBool, Mutex};
    let (Some(ff), Some(fp)) = (tool("ffmpeg"), tool("ffprobe")) else { eprintln!("sem ffmpeg, pulando"); return };
    let d = dir("cut1");
    let src = make_iphone_like(&ff, &d, false);
    let info = probe(&fp, &src).unwrap();
    let e = Engine { ffmpeg: ff, ffprobe: fp.clone(), encoder: Encoder::Cpu { preset: "ultrafast".into() }, gpu: None };
    let children = Mutex::new(std::collections::HashMap::new());
    let cancel = AtomicBool::new(false);
    let h = Hooks { id: 1, children: &children, cancel: &cancel, progress: &|_| {}, log: &|_| {}, started: &|_| {} };
    let p = Preset::defaults().into_iter().find(|p| p.id == "iphone-4k60").unwrap();
    assert_eq!(p.audio.codec, "copy");
    let out = render_cuts(&e, &info, &p, &mec_core::Naming::default(), &[(1.3, 2.6)], false, &h).unwrap().output;
    let o = Command::new(&fp).args(["-v", "error", "-select_streams", "a:0", "-show_entries", "packet=pts_time", "-of", "csv=p=0"]).arg(&out).output().unwrap();
    let first: f64 = String::from_utf8_lossy(&o.stdout).lines().next().unwrap().trim_end_matches(',').parse().unwrap();
    // o AAC tem 1 pacote de atraso de codificador (~21 ms); antes vinha quase 1 s
    assert!(first > -0.05, "áudio começa {first:.3}s antes do vídeo");
    let oi = probe(&fp, &out).unwrap();
    assert!((oi.duration - 1.3).abs() < 0.1, "{}", oi.duration);
}

/// Juntar trechos de um arquivo com PCM e timecode (tipo FX30) num .mp4: áudio continua PCM, timecode do 1º trecho.
#[test]
fn cuts_join_pcm_timecode() {
    use mec_core::render::{render_cuts, Engine, Hooks};
    use std::sync::{atomic::AtomicBool, Mutex};
    let (Some(ff), Some(fp)) = (tool("ffmpeg"), tool("ffprobe")) else { eprintln!("sem ffmpeg, pulando"); return };
    let d = dir("cutspcm");
    let src = d.join("C0001.MP4");
    assert!(Command::new(&ff).args(["-v", "error", "-y", "-f", "lavfi", "-i", "testsrc2=s=640x360:r=60000/1001:d=3",
        "-f", "lavfi", "-i", "sine=f=440:sample_rate=48000:d=3", "-c:v", "libx264", "-preset", "ultrafast", "-c:a", "pcm_s16be",
        "-timecode", "07:51:07:46", "-f", "mov", "-brand", "mp42"]).arg(&src).status().unwrap().success());
    let info = probe(&fp, &src).unwrap();
    let e = Engine { ffmpeg: ff, ffprobe: fp.clone(), encoder: Encoder::Cpu { preset: "ultrafast".into() }, gpu: None };
    let children = Mutex::new(std::collections::HashMap::new());
    let cancel = AtomicBool::new(false);
    let h = Hooks { id: 1, children: &children, cancel: &cancel, progress: &|_| {}, log: &|_| {}, started: &|_| {} };
    let mut p = Preset::defaults().into_iter().find(|p| p.id == "iphone-4k60").unwrap();
    p.container = "source".into(); p.audio.codec = "copy".into(); p.metadata = true;
    let j = render_cuts(&e, &info, &p, &mec_core::Naming::default(), &[(1.0, 1.5), (2.0, 2.5)], true, &h).unwrap();
    let o = probe(&fp, &j.output).unwrap();
    assert!(j.output.to_string_lossy().ends_with(".mp4"));
    assert!((o.duration - 1.0).abs() < 0.12, "{}", o.duration);
    assert_eq!(o.audio[0].codec, "pcm_s16be");
    assert!(o.timecode.starts_with("07:51:08:"), "{}", o.timecode);
}

/// Exportar do Cortador ("só corte"): tudo Original. H.264 + AAC 1080×1920 30 fps sai H.264 + AAC 1080×1920 30 fps,
/// com a duração do trecho e "_corte" no nome, ao lado do original.
#[test]
fn trim_only_keeps_format() {
    use mec_core::preset::{Audio, Bitrate, Fps, Output, Toggle};
    use mec_core::render::{render_cuts, Engine, Hooks};
    use std::sync::{atomic::AtomicBool, Mutex};
    let (Some(ff), Some(fp)) = (tool("ffmpeg"), tool("ffprobe")) else { eprintln!("sem ffmpeg, pulando"); return };
    let d = dir("trimonly");
    let src = d.join("Baixado do X.mp4");
    run(&ff, &["-v", "error", "-y", "-f", "lavfi", "-i", "testsrc2=s=540x960:r=30", "-f", "lavfi", "-i", "sine=f=440:r=44100", "-t", "4",
        "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p", "-b:v", "2000k", "-c:a", "aac", "-b:a", "128k"].iter().map(|s| s.to_string())
        .chain([src.to_string_lossy().into_owned()]).collect::<Vec<_>>());
    let info = probe(&fp, &src).unwrap();
    let e = Engine { ffmpeg: ff, ffprobe: fp.clone(), encoder: Encoder::Cpu { preset: "ultrafast".into() }, gpu: None };
    let children = Mutex::new(std::collections::HashMap::new());
    let cancel = AtomicBool::new(false);
    let h = Hooks { id: 1, children: &children, cancel: &cancel, progress: &|_| {}, log: &|_| {}, started: &|_| {} };
    let p = Preset {
        codec: "source".into(), bits: 0, chroma: "source".into(), container: "source".into(), scale: "source".into(), aspect: "source".into(),
        bitrate: Bitrate { mode: "source".into(), kbps: 20_000, rc: "cbr".into(), level: String::new() }, max_quality: true,
        fps: Fps { conform: false, value: "source".into() }, hdr_to_sdr: false,
        audio: Audio { codec: "copy".into(), channels: "source".into(), ..Audio::default() },
        output: Output { suffix: Toggle { on: true, text: "_corte".into() }, subfolder: Toggle::default(), delete_source: false, folder: Toggle::default(), keep_tree: false },
        ..Preset::default()
    };
    let r = render_cuts(&e, &info, &p, &mec_core::Naming::default(), &[(1.0, 2.5)], false, &h).unwrap();
    assert_eq!(r.output, d.join("Baixado do X_corte.mp4"));
    let o = probe(&fp, &r.output).unwrap();
    let v = o.video.as_ref().unwrap();
    assert_eq!((v.codec.as_str(), v.width, v.height), ("h264", 540, 960));
    assert!((v.fps - 30.0).abs() < 0.1, "{}", v.fps);
    assert_eq!(o.audio[0].codec, "aac");
    assert!((o.duration - 1.5).abs() < 0.1, "{}", o.duration);
    // vários cortes separados: _corte_01, _corte_02
    let r2 = render_cuts(&e, &info, &p, &mec_core::Naming::default(), &[(0.2, 0.8), (2.0, 3.0)], false, &h).unwrap();
    let names: Vec<String> = r2.parts.iter().map(|x| x.file_name().unwrap().to_string_lossy().into_owned()).collect();
    assert_eq!(names, vec!["Baixado do X_corte_01.mp4", "Baixado do X_corte_02.mp4"]);
    let _ = std::fs::remove_dir_all(&d);
}

/// Vídeo → GIF: largura e FPS escolhidos, em loop; um trecho; dois trechos colados num GIF só;
/// vídeo deitado de 60 fps com "Original" sai a 30 fps.
#[test]
fn video_to_gif() {
    use mec_core::render::{render, render_cuts, Engine, Hooks};
    use std::sync::{atomic::AtomicBool, Mutex};
    let (Some(ff), Some(fp)) = (tool("ffmpeg"), tool("ffprobe")) else { eprintln!("sem ffmpeg, pulando"); return };
    let d = dir("gif");
    let src = d.join("Clip.mp4");
    run(&ff, &["-v", "error", "-y", "-f", "lavfi", "-i", "testsrc2=s=1280x720:r=60", "-f", "lavfi", "-i", "sine=f=440:r=48000", "-t", "4",
        "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p", "-c:a", "aac"].iter().map(|s| s.to_string())
        .chain([src.to_string_lossy().into_owned()]).collect::<Vec<_>>());
    let info = probe(&fp, &src).unwrap();
    let e = Engine { ffmpeg: ff, ffprobe: fp.clone(), encoder: Encoder::Cpu { preset: "ultrafast".into() }, gpu: None };
    let children = Mutex::new(std::collections::HashMap::new());
    let cancel = AtomicBool::new(false);
    let h = Hooks { id: 1, children: &children, cancel: &cancel, progress: &|_| {}, log: &|_| {}, started: &|_| {} };
    let p = Preset::gif_defaults().remove(0);
    let gdur = |f: &Path| -> f64 { String::from_utf8_lossy(&Command::new(&fp).args(["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0"]).arg(f).output().unwrap().stdout).trim().parse().unwrap_or(0.0) };
    let r = render(&e, &info, &p, &mec_core::Naming::default(), None, &h).unwrap();
    assert_eq!(r.output, d.join("Clip.gif"));
    let o = probe(&fp, &r.output).unwrap();
    let v = o.video.as_ref().unwrap();
    assert_eq!((v.codec.as_str(), v.width, v.height), ("gif", 480, 270));
    // o GIF guarda o tempo em centésimos: 15 fps vira 7,7,6… (média 16,7)
    assert!((v.fps - 15.0).abs() < 2.0, "{}", v.fps);
    assert!(o.audio.is_empty());
    assert!((gdur(&r.output) - 4.0).abs() < 0.3, "{}", gdur(&r.output));
    // um trecho
    let r1 = render_cuts(&e, &info, &p, &mec_core::Naming::default(), &[(1.0, 2.5)], false, &h).unwrap();
    assert!((gdur(&r1.output) - 1.5).abs() < 0.2, "{}", gdur(&r1.output));
    // dois trechos colados, FPS Original (60 → 30), tamanho original
    let mut p2 = p.clone(); p2.gif.fps = "source".into(); p2.gif.width = 0; p2.gif.quality = "small".into();
    let r2 = render_cuts(&e, &info, &p2, &mec_core::Naming::default(), &[(0.2, 0.8), (2.0, 3.0)], true, &h).unwrap();
    assert_eq!(r2.parts.len(), 1);
    let o2 = probe(&fp, &r2.output).unwrap();
    let v2 = o2.video.as_ref().unwrap();
    assert_eq!((v2.width, v2.height), (1280, 720));
    assert!((v2.fps - 30.0).abs() < 4.0, "{}", v2.fps);
    assert!((gdur(&r2.output) - 1.6).abs() < 0.2, "{}", gdur(&r2.output));
    let _ = std::fs::remove_dir_all(&d);
}

/// Corte que começa logo antes de um quadro-chave em HEVC com GOP aberto (padrão do x265): o -ss do
/// FFmpeg antes do -i pulava para o quadro-chave e o corte saía 1-3 quadros atrasado. O primeiro quadro
/// do arquivo cortado tem de ser o quadro pedido (comparado com o vídeo lido do começo).
#[test]
fn cut_before_keyframe_open_gop() {
    use mec_core::preset::{Audio, Bitrate, Fps, Output, Toggle};
    use mec_core::render::{render_cuts, Engine, Hooks};
    use std::sync::{atomic::AtomicBool, Mutex};
    let (Some(ff), Some(fp)) = (tool("ffmpeg"), tool("ffprobe")) else { eprintln!("sem ffmpeg, pulando"); return };
    let d = dir("opengop");
    let src = d.join("open.mov");
    // testsrc mostra o número do quadro: dá para ver qual quadro saiu
    run(&ff, &["-v", "error", "-y", "-f", "lavfi", "-i", "testsrc=s=320x240:r=30", "-t", "4", "-c:v", "libx265", "-preset", "ultrafast",
        "-x265-params", "keyint=30:min-keyint=30:log-level=error", "-tag:v", "hvc1"].iter().map(|s| s.to_string())
        .chain([src.to_string_lossy().into_owned()]).collect::<Vec<_>>());
    let info = probe(&fp, &src).unwrap();
    let e = Engine { ffmpeg: ff.clone(), ffprobe: fp.clone(), encoder: Encoder::Cpu { preset: "ultrafast".into() }, gpu: None };
    let children = Mutex::new(std::collections::HashMap::new());
    let cancel = AtomicBool::new(false);
    let h = Hooks { id: 1, children: &children, cancel: &cancel, progress: &|_| {}, log: &|_| {}, started: &|_| {} };
    let p = Preset {
        codec: "source".into(), bits: 0, chroma: "source".into(), container: "source".into(), scale: "source".into(), aspect: "source".into(),
        bitrate: Bitrate { mode: "source".into(), kbps: 20_000, rc: "cbr".into(), level: String::new() }, max_quality: true,
        fps: Fps { conform: false, value: "source".into() }, hdr_to_sdr: false,
        audio: Audio { codec: "copy".into(), channels: "source".into(), ..Audio::default() },
        output: Output { suffix: Toggle { on: true, text: "_corte".into() }, subfolder: Toggle::default(), delete_source: false, folder: Toggle::default(), keep_tree: false },
        ..Preset::default()
    };
    let gray = |path: &Path, sel: Option<u32>| -> Vec<u8> {
        let vf = match sel { Some(n) => format!("select=eq(n\\,{n}),format=gray"), None => "format=gray".into() };
        Command::new(&ff).args(["-v", "error", "-i"]).arg(path).args(["-vf", &vf, "-frames:v", "1", "-f", "rawvideo", "-"]).output().unwrap().stdout
    };
    let diff = |a: &[u8], b: &[u8]| -> f64 { if a.len() != b.len() || a.is_empty() { return 255.0 } a.iter().zip(b).map(|(x, y)| (*x as f64 - *y as f64).abs()).sum::<f64>() / a.len() as f64 };
    for n in [27u32, 28, 29, 31, 45] {
        let a = n as f64 / 30.0;
        let r = render_cuts(&e, &info, &p, &mec_core::Naming::default(), &[(a, a + 0.5)], false, &h).unwrap();
        let first = gray(&r.output, None);
        let want = gray(&src, Some(n));
        let near: Vec<f64> = [n.saturating_sub(1), n + 1, n + 2, n + 3].iter().map(|m| diff(&first, &gray(&src, Some(*m)))).collect();
        let d0 = diff(&first, &want);
        assert!(d0 < near.iter().cloned().fold(f64::MAX, f64::min), "corte no quadro {n}: o primeiro quadro não é o {n} (diferença {d0:.2}, vizinhos {near:?})");
        let _ = std::fs::remove_file(&r.output);
    }
    let _ = std::fs::remove_dir_all(&d);
}
