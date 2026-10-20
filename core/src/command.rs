//! Monta o comando do FFmpeg a partir do preset e das informações do arquivo.
//!
//! Ordem dos filtros de vídeo: rotação → (escala, se for diminuir e houver HDR) → HDR → Rec. 709 →
//! escala → frame rate constante → formato de pixel.

use std::path::{Path, PathBuf};

use crate::preset::Preset;
use crate::probe::{MediaInfo, VideoInfo};

#[derive(Clone, Debug, PartialEq)]
pub enum Encoder {
    /// NVIDIA NVENC (hevc_nvenc / h264_nvenc), decodificando pela GPU.
    Nvenc,
    /// libx265 / libx264 (sem placa NVIDIA; também usado nos testes).
    Cpu { preset: String },
}

#[derive(Clone, Debug, Default)]
pub struct Plan {
    pub args: Vec<String>,
    pub output: PathBuf,
    pub width: u32,
    pub height: u32,
    pub warnings: Vec<String>,
}

fn even(x: f64) -> u32 { ((x / 2.0).round() as u32).max(1) * 2 }

/// Resolução final (já em pé). "1080" usa o lado menor, então vertical continua vertical.
pub fn out_dims(v: &VideoInfo, p: &Preset) -> (u32, u32) {
    // Giro extra escolhido pelo usuário (90/270 troca largura e altura).
    let (vw, vh) = if p.rotate % 180 == 90 { (v.height, v.width) } else { (v.width, v.height) };
    let (w, h) = (vw as f64, vh as f64);
    match p.scale.as_str() {
        "custom" => match (p.custom_w, p.custom_h) {
            (0, 0) => (vw, vh),
            (cw, 0) => (even(cw as f64), even(cw as f64 * h / w)),
            (0, ch) => (even(ch as f64 * w / h), even(ch as f64)),
            (cw, ch) => (even(cw as f64), even(ch as f64)),
        },
        "50" => (even(w / 2.0), even(h / 2.0)),
        "25" => (even(w / 4.0), even(h / 4.0)),
        "1080" | "720" | "2160" => {
            let target: f64 = p.scale.parse().unwrap_or(1080.0);
            let short = w.min(h);
            if short <= target { (vw, vh) } else { let k = target / short; (even(w * k), even(h * k)) }
        }
        _ => (vw, vh),
    }
}

fn fmt_num(x: f64) -> String {
    let s = format!("{x:.3}");
    s.trim_end_matches('0').trim_end_matches('.').to_string()
}

/// Pico de brilho para o tone mapping, igual ao HandBrake (libhb/colorspace.c).
pub fn hdr_peak(v: &VideoInfo) -> f64 {
    let mut peak = v.max_cll / 100.0;
    if peak < 1.0 { peak = v.mastering_max / 100.0; }
    if peak < 1.0 { peak = if v.hdr == "PQ" { 100.0 } else { 10.0 }; }
    peak
}

fn hdr_chain(v: &VideoInfo) -> Vec<String> {
    let tin = if v.hdr == "PQ" { "smpte2084" } else { "arib-std-b67" };
    vec![
        format!("zscale=tin={tin}:pin=bt2020:min=bt2020nc:rin=tv:t=linear:npl=100"),
        "format=gbrpf32le".into(),
        format!("tonemap=tonemap=hable:desat=0:peak={}", fmt_num(hdr_peak(v))),
        "zscale=p=bt709:t=bt709:m=bt709:r=tv".into(),
        // FFmpeg 7.1+ leva as propriedades de cor pelo filtro: marca o resultado como Rec. 709 aqui mesmo.
        "setparams=color_primaries=bt709:color_trc=bt709:colorspace=bt709:range=tv".into(),
    ]
}

fn effective_bits(p: &Preset) -> u8 { if p.codec == "h264" { 8 } else if p.bits >= 10 { 10 } else { 8 } }

fn pix_fmt(p: &Preset, enc: &Encoder) -> &'static str {
    match (effective_bits(p), enc) { (10, Encoder::Nvenc) => "p010le", (10, _) => "yuv420p10le", _ => "yuv420p" }
}

/// Filtros de vídeo. `preview_fit`: limita o lado maior (prévia) e pula o frame rate.
pub fn video_filters(info: &MediaInfo, p: &Preset, enc: &Encoder, preview: Option<(bool, u32)>) -> Vec<String> {
    let Some(v) = info.video.as_ref() else { return vec![] };
    let mut f = Vec::new();
    // Rotação do arquivo + giro extra do usuário (só no resultado).
    let user = if preview.map_or(true, |(out, _)| out) { p.rotate % 360 } else { 0 };
    match (v.rotation + user) % 360 {
        90 => f.push("transpose=clock".to_string()),
        180 => f.push("hflip,vflip".to_string()),
        270 => f.push("transpose=cclock".to_string()),
        _ => {}
    }
    if let Some((out, max)) = preview {
        // Prévia: diminui logo no começo (o tone mapping fica leve) e não mexe no frame rate.
        f.push(format!("scale=w={max}:h={max}:force_original_aspect_ratio=decrease:flags=bilinear"));
        if out && p.hdr_to_sdr && !v.hdr.is_empty() { f.extend(hdr_chain(v)); }
        f.push("format=yuvj420p".into());
        return f;
    }
    {
        let (w, h) = out_dims(v, p);
        let (rw, rh) = if p.rotate % 180 == 90 { (v.height, v.width) } else { (v.width, v.height) };
        let scale = ((w, h) != (rw, rh)).then(|| format!("scale={w}:{h}:flags=bicubic"));
        let hdr = p.hdr_to_sdr && !v.hdr.is_empty();
        let shrinking = (w as u64 * h as u64) < (rw as u64 * rh as u64);
        if hdr && shrinking { if let Some(s) = &scale { f.push(s.clone()); } }
        if hdr { f.extend(hdr_chain(v)); }
        if !(hdr && shrinking) { if let Some(s) = scale { f.push(s); } }
        if preview.is_none() && p.fps.conform {
            let (n, d) = p.fps_rational();
            f.push(format!("fps={n}/{d}"));
        }
    }
    f.push(format!("format={}", pix_fmt(p, enc)));
    f
}

fn video_codec_args(info: &MediaInfo, p: &Preset, enc: &Encoder, warnings: &mut Vec<String>) -> Vec<String> {
    let v = info.video.as_ref();
    let mut a: Vec<String> = Vec::new();
    let h265 = p.codec != "h264";
    if !h265 && p.bits >= 10 { warnings.push("h264-10bit".into()); }
    let ten = effective_bits(p) == 10;
    let proxy = p.scale != "source";
    let kbps = match p.bitrate.mode.as_str() {
        "manual" if p.bitrate.kbps > 0 => Some(p.bitrate.kbps),
        "source" => Some(v.map_or(0, |v| v.bitrate_kbps)).filter(|k| *k > 0).or(Some(20_000)),
        _ => None,
    };
    let rate = |a: &mut Vec<String>, cbr: bool, k: u32| {
        a.extend(["-b:v".into(), format!("{k}k")]);
        let max = if cbr { k } else { k * 3 / 2 };
        a.extend(["-maxrate".into(), format!("{max}k"), "-bufsize".into(), format!("{}k", k * 2)]);
    };
    match enc {
        Encoder::Nvenc => {
            a.extend(["-c:v".into(), if h265 { "hevc_nvenc" } else { "h264_nvenc" }.into()]);
            a.extend(["-preset".into(), if p.max_quality { "p7" } else { "p5" }.into(), "-tune".into(), "hq".into()]);
            a.extend(["-profile:v".into(), if !h265 { "high" } else if ten { "main10" } else { "main" }.into()]);
            match kbps {
                Some(k) => {
                    let cbr = p.bitrate.rc == "cbr";
                    a.extend(["-rc".into(), if cbr { "cbr" } else { "vbr" }.into()]);
                    rate(&mut a, cbr, k);
                }
                None => a.extend(["-rc".into(), "vbr".into(), "-cq".into(), if proxy { "26" } else { "19" }.into(), "-b:v".into(), "0".into()]),
            }
        }
        Encoder::Cpu { preset } => {
            a.extend(["-c:v".into(), if h265 { "libx265" } else { "libx264" }.into(), "-preset".into(), preset.clone()]);
            a.extend(["-profile:v".into(), if !h265 { "high" } else if ten { "main10" } else { "main" }.into()]);
            if h265 { a.extend(["-x265-params".into(), "log-level=error".into()]); }
            match kbps {
                Some(k) => rate(&mut a, p.bitrate.rc == "cbr", k),
                None => a.extend(["-crf".into(), if proxy { "26" } else { "20" }.into()]),
            }
        }
    }
    if h265 { a.extend(["-tag:v".into(), "hvc1".into()]); }
    a
}

/// Mapeamento de áudio: devolve (filter_complex de áudio, argumentos de saída).
fn audio_args(info: &MediaInfo, p: &Preset) -> (Option<String>, Vec<String>) {
    let n = info.audio.len() as u32;
    if n == 0 { return (None, vec!["-an".into()]); }
    if p.audio.codec == "copy" {
        let mut a = Vec::new();
        for t in &info.audio { a.extend(["-map".to_string(), format!("0:{}", t.index)]); }
        a.extend(["-c:a".to_string(), "copy".to_string()]);
        return (None, a);
    }
    // Faixa escolhida (1, 2...) → índice real do stream no arquivo.
    let track = |i: usize| -> u32 { p.audio.tracks.get(i).copied().unwrap_or(1).clamp(1, n) - 1 };
    let ch = |t: u32| info.audio.get(t as usize).map_or(2, |a| a.channels);
    let sid = |t: u32| info.audio.get(t as usize).map_or(t + 1, |a| a.index);
    let sync = if p.av_sync { ",aresample=async=1:first_pts=0" } else { "" };
    let graph = if p.audio.channels == "mono" {
        let a = track(0);
        format!("[0:{}]aformat=channel_layouts=mono{sync}[aout]", sid(a))
    } else {
        let (l, r) = (track(0), track(1));
        if l == r {
            let up = if ch(l) >= 2 { "aformat=channel_layouts=stereo" } else { "pan=stereo|c0=c0|c1=c0" };
            format!("[0:{}]{up}{sync}[aout]", sid(l))
        } else {
            let mono = |t: u32| if ch(t) >= 2 { "pan=mono|c0=0.5*c0+0.5*c1" } else { "anull" };
            format!("[0:{}]{}[l];[0:{}]{}[r];[l][r]amerge=inputs=2,pan=stereo|c0=c0|c1=c1{sync}[aout]", sid(l), mono(l), sid(r), mono(r))
        }
    };
    let kbps = if p.audio.kbps > 0 { p.audio.kbps } else { 256 };
    (Some(graph), vec!["-map".into(), "[aout]".into(), "-c:a".into(), "aac".into(), "-b:a".into(), format!("{kbps}k"), "-ar".into(), "48000".into()])
}

fn codec_tag(p: &Preset) -> &'static str { if p.codec == "h264" { "H264" } else { "H265" } }

fn clean(s: &str) -> String {
    s.chars().map(|c| if r#"<>:"/\|?*"#.contains(c) || c.is_control() { '_' } else { c }).collect::<String>().trim().to_string()
}

/// Caminho de saída. Nunca sobrescreve: se já existir, acrescenta " (2)", " (3)"...
pub fn output_path(src: &Path, p: &Preset) -> PathBuf {
    let mut dir = src.parent().map(Path::to_path_buf).unwrap_or_default();
    if p.output.subfolder.on && !clean(&p.output.subfolder.text).is_empty() { dir = dir.join(clean(&p.output.subfolder.text)); }
    let stem = src.file_stem().map(|s| s.to_string_lossy().into_owned()).unwrap_or_else(|| "video".into());
    let suffix = if p.output.suffix.on {
        clean(&p.output.suffix.text.replace("{codec}", codec_tag(p)).replace("{preset}", &p.name))
    } else { String::new() };
    let ext = if p.container == "mov" { "mov" } else { "mp4" };
    let mut out = dir.join(format!("{stem}{suffix}.{ext}"));
    let mut i = 2;
    while out.exists() || out == src {
        out = dir.join(format!("{stem}{suffix} ({i}).{ext}"));
        i += 1;
    }
    out
}

/// Onde o vídeo é decodificado e filtrado.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Decode {
    /// Tudo na placa: NVDEC decodifica, a escala e a conversão de 10→8-bit rodam na GPU (scale_cuda).
    /// Só baixa para a CPU o que a GPU não faz (girar, HDR → Rec. 709).
    Gpu,
    /// NVDEC decodifica e o FFmpeg traz os quadros para a CPU sozinho (modo antigo).
    Hw,
    /// Decodifica pela CPU.
    Cpu,
}

impl Decode {
    pub fn name(self) -> &'static str { match self { Decode::Gpu => "gpu", Decode::Hw => "nvdec", Decode::Cpu => "cpu" } }
}

fn input_args(info: &MediaInfo, enc: &Encoder, dec: Decode) -> Vec<String> {
    let mut a: Vec<String> = vec!["-nostdin".into(), "-hide_banner".into(), "-v".into(), "error".into()];
    if *enc == Encoder::Nvenc {
        match dec {
            Decode::Gpu => a.extend(["-hwaccel", "cuda", "-hwaccel_output_format", "cuda", "-extra_hw_frames", "8"].map(String::from)),
            Decode::Hw => a.extend(["-hwaccel".into(), "cuda".into()]),
            Decode::Cpu => {}
        }
    }
    // Rotação: zera a matriz de exibição e gira com transpose (ver video_filters).
    // Assim o arquivo novo sai em pé e sem metadado que faria o player girar de novo.
    if info.video.as_ref().map_or(false, |v| v.rotation != 0) { a.extend(["-display_rotation".into(), "0".into()]); }
    a.extend(["-i".into(), info.path.to_string_lossy().into_owned()]);
    a
}

/// Filtros do modo [`Decode::Gpu`]: escala e formato na placa; girar e HDR baixam para a CPU.
/// Sem girar e sem HDR, o quadro nunca sai da GPU (NVDEC → scale_cuda → NVENC).
pub fn gpu_filters(info: &MediaInfo, p: &Preset) -> Vec<String> {
    let Some(v) = info.video.as_ref() else { return vec![] };
    let mut f = Vec::new();
    let rot = (v.rotation + p.rotate % 360) % 360;
    let hdr = p.hdr_to_sdr && !v.hdr.is_empty();
    let (w, h) = out_dims(v, p);
    // Tamanho antes de girar (o quadro decodificado ainda está deitado).
    let (pw, ph) = if rot % 180 == 90 { (h, w) } else { (w, h) };
    let (cw, ch) = if v.coded_width > 0 { (v.coded_width, v.coded_height) } else if v.rotation % 180 == 90 { (v.height, v.width) } else { (v.width, v.height) };
    let src10 = v.bit_depth >= 10;
    let out10 = effective_bits(p) == 10;
    // HDR: mantém 10-bit até o tone mapping; senão, já converte para o formato final na GPU.
    let gpu_fmt = if hdr { if src10 { "p010" } else { "nv12" } } else if out10 { "p010" } else { "nv12" };
    let src_fmt = if src10 { "p010" } else { "nv12" };
    if (pw, ph) != (cw, ch) || gpu_fmt != src_fmt {
        f.push(format!("scale_cuda=w={pw}:h={ph}:format={gpu_fmt}"));
    }
    if rot != 0 || hdr {
        f.push(format!("hwdownload,format={gpu_fmt}"));
        match rot { 90 => f.push("transpose=clock".into()), 180 => f.push("hflip,vflip".into()), 270 => f.push("transpose=cclock".into()), _ => {} }
        if hdr { f.extend(hdr_chain(v)); }
    }
    if p.fps.conform { let (n, d) = p.fps_rational(); f.push(format!("fps={n}/{d}")); }
    if rot != 0 || hdr { f.push(format!("format={}", if out10 { "p010le" } else { "nv12" })); }
    f
}

/// Comando completo de conversão (com NVENC, tenta primeiro tudo na GPU).
pub fn build(info: &MediaInfo, p: &Preset, enc: &Encoder, output: &Path) -> Plan {
    build_mode(info, p, enc, output, if *enc == Encoder::Nvenc { Decode::Gpu } else { Decode::Cpu })
}

/// Igual a [`build`], escolhendo se a GPU também decodifica (`hwdecode`, modo antigo).
pub fn build_opts(info: &MediaInfo, p: &Preset, enc: &Encoder, output: &Path, hwdecode: bool) -> Plan {
    build_mode(info, p, enc, output, if hwdecode { Decode::Hw } else { Decode::Cpu })
}

/// Comando completo escolhendo onde decodificar e filtrar.
pub fn build_mode(info: &MediaInfo, p: &Preset, enc: &Encoder, output: &Path, dec: Decode) -> Plan {
    let dec = if *enc == Encoder::Nvenc { dec } else { Decode::Cpu };
    let mut warnings = Vec::new();
    let mut args = input_args(info, enc, dec);
    let (afc, aout) = audio_args(info, p);
    if let Some(g) = afc { args.extend(["-filter_complex".into(), g]); }
    args.extend(["-map".into(), "0:v:0".into()]);
    let vf = if dec == Decode::Gpu { gpu_filters(info, p) } else { video_filters(info, p, enc, None) };
    if !vf.is_empty() { args.extend(["-vf".into(), vf.join(",")]); }
    args.extend(video_codec_args(info, p, enc, &mut warnings));
    if p.fps.conform { args.extend(["-fps_mode".into(), "cfr".into()]); }
    if p.hdr_to_sdr && info.is_hdr() {
        args.extend(["-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709", "-color_range", "tv"].map(String::from));
    }
    args.extend(aout);
    if p.metadata {
        args.extend(["-map_metadata".into(), "0".into(), "-movflags".into(), "use_metadata_tags+faststart".into()]);
    } else {
        args.extend(["-map_metadata".into(), "-1".into(), "-movflags".into(), "+faststart".into()]);
    }
    args.extend(["-max_muxing_queue_size", "4096", "-progress", "pipe:1", "-nostats", "-y"].map(String::from));
    args.push(output.to_string_lossy().into_owned());
    let (width, height) = info.video.as_ref().map_or((0, 0), |v| out_dims(v, p));
    Plan { args, output: output.to_path_buf(), width, height, warnings }
}

/// Um quadro JPEG da prévia, no tempo `t` (segundos). `output = true` mostra o resultado do preset.
pub fn preview_args(info: &MediaInfo, p: &Preset, t: f64, output: bool, max: u32) -> Vec<String> {
    let mut a: Vec<String> = vec!["-nostdin".into(), "-hide_banner".into(), "-v".into(), "error".into(), "-ss".into(), fmt_num(t.max(0.0))];
    if info.video.as_ref().map_or(false, |v| v.rotation != 0) { a.extend(["-display_rotation".into(), "0".into()]); }
    a.extend(["-i".into(), info.path.to_string_lossy().into_owned(), "-frames:v".into(), "1".into(), "-an".into()]);
    let vf = video_filters(info, p, &Encoder::Cpu { preset: "ultrafast".into() }, Some((output, max)));
    a.extend(["-vf".into(), vf.join(",")]);
    a.extend(["-f", "image2pipe", "-c:v", "mjpeg", "-q:v", "3", "pipe:1"].map(String::from));
    a
}

/// Confere o arquivo convertido antes de apagar o original.
pub fn verify(src: &MediaInfo, out: &MediaInfo) -> Result<(), String> {
    if out.video.is_none() { return Err("output has no video".into()); }
    let tol = (src.duration * 0.02).max(1.0);
    if (src.duration - out.duration).abs() > tol {
        return Err(format!("duration mismatch: {:.2}s vs {:.2}s", src.duration, out.duration));
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn gpu_pipeline() {
        // iPhone vertical (rotação 90), SDR 8-bit, só CFR: decodifica na GPU, baixa e gira na CPU.
        let mut i = iphone(90, "");
        i.video.as_mut().unwrap().bit_depth = 8;
        let s = build(&i, &preset("iphone-4k60"), &Encoder::Nvenc, Path::new("o.mp4")).args.join(" ");
        assert!(s.contains("-hwaccel cuda -hwaccel_output_format cuda"), "{s}");
        assert!(s.contains("-vf hwdownload,format=nv12,transpose=clock,fps=60000/1001,format=nv12 "), "{s}");
        // Proxy 25% sem girar: tudo na GPU, sem hwdownload.
        let mut flat = iphone(0, "");
        flat.video.as_mut().unwrap().bit_depth = 8;
        let mut px = preset("proxy"); px.fps.conform = false;
        let s = build(&flat, &px, &Encoder::Nvenc, Path::new("o.mp4")).args.join(" ");
        assert!(s.contains("-vf scale_cuda=w=960:h=540:format=nv12 "), "{s}");
        assert!(!s.contains("hwdownload"), "{s}");
        // Proxy vertical: escala antes de girar (960x540 deitado → 540x960 em pé).
        let s = build(&i, &px, &Encoder::Nvenc, Path::new("o.mp4")).args.join(" ");
        assert!(s.contains("scale_cuda=w=960:h=540:format=nv12,hwdownload,format=nv12,transpose=clock"), "{s}");
        // HDR 10-bit → 8-bit Rec. 709: mantém p010 até o tone mapping.
        let mut hp = preset("iphone-4k60"); hp.hdr_to_sdr = true;
        let s = build(&iphone(90, "HLG"), &hp, &Encoder::Nvenc, Path::new("o.mp4")).args.join(" ");
        assert!(s.contains("-vf hwdownload,format=p010,transpose=clock,zscale="), "{s}");
        assert!(s.contains("fps=60000/1001,format=nv12 "), "{s}");
        // CPU não usa nada disso.
        let s = build(&i, &preset("iphone-4k60"), &Encoder::Cpu { preset: "ultrafast".into() }, Path::new("o.mp4")).args.join(" ");
        assert!(!s.contains("hwaccel") && !s.contains("scale_cuda"), "{s}");
    }
    use crate::probe::AudioInfo;

    fn iphone(rotation: u32, hdr: &str) -> MediaInfo {
        let (cw, ch) = (3840, 2160);
        let (w, h) = if rotation % 180 == 90 { (ch, cw) } else { (cw, ch) };
        MediaInfo {
            path: PathBuf::from("/v/IMG_0001.MOV"), duration: 10.0, bitrate_kbps: 50_000,
            video: Some(VideoInfo { coded_width: cw, coded_height: ch, width: w, height: h, rotation, hdr: hdr.into(),
                bit_depth: 10, fps: 59.93, fps_nominal: 60.0, vfr: true, bitrate_kbps: 49_000, ..Default::default() }),
            audio: vec![AudioInfo { index: 1, codec: "aac".into(), channels: 1, sample_rate: 48000 },
                        AudioInfo { index: 2, codec: "aac".into(), channels: 1, sample_rate: 48000 }],
            ..Default::default()
        }
    }
    /// Presets de teste (independentes dos padrões do app).
    fn preset(id: &str) -> Preset {
        let base = Preset {
            bitrate: crate::preset::Bitrate { mode: "manual".into(), kbps: 50_000, rc: "cbr".into() }, max_quality: true,
            fps: crate::preset::Fps { conform: true, value: "59.94".into() }, ..Preset::default()
        };
        match id {
            "iphone-4k60" => Preset { output: crate::preset::Output { delete_source: true, ..Default::default() }, ..base },
            "iphone-4k60-hdr" => Preset { hdr_to_sdr: true, ..base },
            "iphone-1080p60" => Preset { scale: "1080".into(), ..base },
            "proxy" => Preset { scale: "25".into(), fps: crate::preset::Fps { conform: false, value: "59.94".into() },
                output: crate::preset::Output { suffix: crate::preset::Toggle { on: true, text: "_proxy".into() },
                    subfolder: crate::preset::Toggle { on: true, text: "proxy".into() }, delete_source: false }, ..base },
            _ => base,
        }
    }

    #[test]
    fn scale_1080_keeps_orientation() {
        let p = preset("iphone-1080p60");
        assert_eq!(out_dims(iphone(90, "").video.as_ref().unwrap(), &p), (1080, 1920));
        assert_eq!(out_dims(iphone(0, "").video.as_ref().unwrap(), &p), (1920, 1080));
        let proxy = preset("proxy");
        assert_eq!(out_dims(iphone(90, "").video.as_ref().unwrap(), &proxy), (540, 960));
    }

    #[test]
    fn iphone_4k60_command() {
        let i = iphone(90, "");
        let plan = build_opts(&i, &preset("iphone-4k60"), &Encoder::Nvenc, Path::new("/v/out.mp4"), true);
        let s = plan.args.join(" ");
        assert!(s.contains("-display_rotation 0 -i /v/IMG_0001.MOV"), "{s}");
        assert!(s.contains("-vf transpose=clock,fps=60000/1001,format=yuv420p"), "{s}");
        assert!(s.contains("-c:v hevc_nvenc -preset p7 -tune hq -profile:v main -rc cbr -b:v 50000k -maxrate 50000k -bufsize 100000k"), "{s}");
        assert!(s.contains("[0:1]anull[l];[0:2]anull[r];[l][r]amerge=inputs=2,pan=stereo|c0=c0|c1=c1,aresample=async=1:first_pts=0[aout]"), "{s}");
        assert!(s.contains("-map_metadata 0"), "{s}");
        assert_eq!((plan.width, plan.height), (2160, 3840));
    }

    #[test]
    fn hdr_like_handbrake() {
        let i = iphone(90, "HLG");
        let p = preset("iphone-4k60-hdr");
        let vf = video_filters(&i, &p, &Encoder::Nvenc, None).join(",");
        assert_eq!(vf, "transpose=clock,zscale=tin=arib-std-b67:pin=bt2020:min=bt2020nc:rin=tv:t=linear:npl=100,format=gbrpf32le,tonemap=tonemap=hable:desat=0:peak=10,zscale=p=bt709:t=bt709:m=bt709:r=tv,setparams=color_primaries=bt709:color_trc=bt709:colorspace=bt709:range=tv,fps=60000/1001,format=yuv420p");
        let s = build_opts(&i, &p, &Encoder::Nvenc, Path::new("o.mp4"), true).args.join(" ");
        assert!(s.contains("-color_primaries bt709 -color_trc bt709 -colorspace bt709"));
        // Proxy de HDR: diminui antes do tone mapping (mais leve).
        let mut px = preset("proxy"); px.hdr_to_sdr = true;
        let vf = video_filters(&i, &px, &Encoder::Nvenc, None).join(",");
        assert!(vf.starts_with("transpose=clock,scale=540:960:flags=bicubic,zscale"), "{vf}");
    }

    #[test]
    fn ten_bit_and_h264() {
        let i = iphone(0, "");
        let mut p = preset("iphone-4k60"); p.bits = 10;
        let s = build_opts(&i, &p, &Encoder::Nvenc, Path::new("o.mp4"), true).args.join(" ");
        assert!(s.contains("format=p010le") && s.contains("-profile:v main10"), "{s}");
        p.codec = "h264".into();
        let plan = build_opts(&i, &p, &Encoder::Nvenc, Path::new("o.mp4"), true);
        assert!(plan.args.join(" ").contains("format=yuv420p"));
        assert_eq!(plan.warnings, vec!["h264-10bit".to_string()]);
    }

    #[test]
    fn audio_mapping() {
        let mut i = iphone(0, "");
        let mut p = preset("iphone-4k60");
        p.audio.channels = "mono".into(); p.audio.tracks = vec![1, 1]; p.av_sync = false;
        assert_eq!(audio_args(&i, &p).0.unwrap(), "[0:1]aformat=channel_layouts=mono[aout]");
        p.audio.channels = "stereo".into(); p.audio.tracks = vec![1, 1];
        assert_eq!(audio_args(&i, &p).0.unwrap(), "[0:1]pan=stereo|c0=c0|c1=c0[aout]");
        i.audio.truncate(1); i.audio[0].channels = 2; p.audio.tracks = vec![1, 2];
        assert_eq!(audio_args(&i, &p).0.unwrap(), "[0:1]aformat=channel_layouts=stereo[aout]", "faixa 2 não existe: usa a 1");
        p.audio.codec = "copy".into();
        assert_eq!(audio_args(&i, &p).1, vec!["-map", "0:1", "-c:a", "copy"]);
        i.audio.clear();
        assert_eq!(audio_args(&i, &p).1, vec!["-an"]);
    }

    #[test]
    fn output_names() {
        let p = preset("proxy");
        let o = output_path(Path::new("/nao/existe/IMG_1.MOV"), &p);
        assert_eq!(o, PathBuf::from("/nao/existe/proxy/IMG_1_proxy.mp4"));
        let o = output_path(Path::new("/nao/existe/IMG_1.MOV"), &preset("iphone-4k60"));
        assert_eq!(o, PathBuf::from("/nao/existe/IMG_1_H265.mp4"));
    }

    #[test]
    fn user_rotation() {
        let i = iphone(0, ""); // gravado deitado, sem metadado
        let mut p = preset("iphone-1080p60"); p.rotate = 90;
        assert_eq!(out_dims(i.video.as_ref().unwrap(), &p), (1080, 1920));
        let vf = video_filters(&i, &p, &Encoder::Nvenc, None).join(",");
        assert!(vf.starts_with("transpose=clock,scale=1080:1920"), "{vf}");
        // iPhone já girado 90 + 90 do usuário = 180
        let vf = video_filters(&iphone(90, ""), &p, &Encoder::Nvenc, None).join(",");
        assert!(vf.starts_with("hflip,vflip"), "{vf}");
        // a prévia do original não usa o giro do usuário
        let vf = video_filters(&i, &p, &Encoder::Nvenc, Some((false, 480))).join(",");
        assert!(!vf.contains("transpose"), "{vf}");
    }

    #[test]
    fn custom_resolution() {
        let v = iphone(90, "").video.unwrap();
        let mut p = preset("iphone-4k60"); p.scale = "custom".into();
        p.custom_w = 720; assert_eq!(out_dims(&v, &p), (720, 1280));
        p.custom_w = 0; p.custom_h = 1000; assert_eq!(out_dims(&v, &p), (562, 1000));
        p.custom_w = 1080; p.custom_h = 1350; assert_eq!(out_dims(&v, &p), (1080, 1350));
    }

    #[test]
    fn defaults_are_the_four() {
        let names: Vec<_> = Preset::defaults().into_iter().map(|p| p.name).collect();
        assert_eq!(names, vec!["RAW", "RAW HDR", "Proxy", "Meta HDR"]);
    }

    #[test]
    fn peak() {
        let mut v = iphone(0, "HLG").video.unwrap();
        assert_eq!(hdr_peak(&v), 10.0);
        v.max_cll = 1000.0; assert_eq!(hdr_peak(&v), 10.0);
        v.max_cll = 0.0; v.hdr = "PQ".into(); assert_eq!(hdr_peak(&v), 100.0);
        v.mastering_max = 4000.0; assert_eq!(hdr_peak(&v), 40.0);
    }
}
