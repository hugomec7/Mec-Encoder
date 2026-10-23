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
