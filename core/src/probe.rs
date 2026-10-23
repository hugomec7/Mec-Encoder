//! Leitura do arquivo com ffprobe (`-print_format flat`, sem precisar de parser JSON).

use std::collections::HashMap;
use std::path::{Path, PathBuf};

#[cfg(feature = "serde")]
use serde::Serialize;

#[derive(Clone, Debug, Default, PartialEq)]
#[cfg_attr(feature = "serde", derive(Serialize), serde(rename_all = "camelCase"))]
pub struct VideoInfo {
    pub index: u32,
    pub codec: String,
    pub profile: String,
    /// Dimensões gravadas no arquivo (antes da rotação).
    pub coded_width: u32,
    pub coded_height: u32,
    /// Dimensões como o vídeo aparece (depois da rotação).
    pub width: u32,
    pub height: u32,
    /// Quanto girar no sentido horário para ficar em pé: 0, 90, 180 ou 270.
    pub rotation: u32,
    pub pix_fmt: String,
    pub bit_depth: u8,
    /// Frame rate médio real.
    pub fps: f64,
    /// Frame rate nominal do arquivo.
    pub fps_nominal: f64,
    /// Frame rate variável (o médio não bate com o nominal).
    pub vfr: bool,
    pub transfer: String,
    pub primaries: String,
    pub matrix: String,
    /// "HLG", "PQ" ou vazio.
    pub hdr: String,
    pub bitrate_kbps: u32,
    pub max_cll: f64,
    pub mastering_max: f64,
}

#[derive(Clone, Debug, Default, PartialEq)]
#[cfg_attr(feature = "serde", derive(Serialize), serde(rename_all = "camelCase"))]
pub struct AudioInfo {
    pub index: u32,
    pub codec: String,
    pub channels: u32,
    pub sample_rate: u32,
}

#[derive(Clone, Debug, Default, PartialEq)]
#[cfg_attr(feature = "serde", derive(Serialize), serde(rename_all = "camelCase"))]
pub struct MediaInfo {
    pub path: PathBuf,
    pub size_bytes: u64,
    pub duration: f64,
    pub bitrate_kbps: u32,
    pub video: Option<VideoInfo>,
    pub audio: Vec<AudioInfo>,
    /// Timecode do primeiro quadro (ex.: "07:51:07:46"), vazio se o arquivo não tiver.
    /// Na Sony FX30 vem da trilha de metadados (rtmd).
    pub timecode: String,
}

impl MediaInfo {
    pub fn is_hdr(&self) -> bool { self.video.as_ref().map_or(false, |v| !v.hdr.is_empty()) }
}

/// Argumentos para o ffprobe.
pub fn probe_args(path: &Path) -> Vec<String> {
    vec![
        "-v".into(), "error".into(), "-print_format".into(), "flat".into(),
        "-show_format".into(), "-show_streams".into(), path.to_string_lossy().into_owned(),
    ]
}

/// Roda o ffprobe e interpreta a saída.
pub fn probe(ffprobe: &Path, path: &Path) -> Result<MediaInfo, String> {
    let out = crate::tools::command(ffprobe).args(probe_args(path)).output().map_err(|e| format!("ffprobe: {e}"))?;
    if !out.status.success() {
        let err = String::from_utf8_lossy(&out.stderr);
        return Err(err.lines().last().unwrap_or("ffprobe failed").trim().to_string());
    }
    let mut info = parse_flat(&String::from_utf8_lossy(&out.stdout));
    info.path = path.to_path_buf();
    if let Ok(m) = std::fs::metadata(path) { info.size_bytes = m.len(); }
    if info.video.is_none() { return Err("no video stream".into()); }
    Ok(info)
}

fn rate(s: &str) -> f64 {
    let s = s.trim();
    if let Some((a, b)) = s.split_once('/') {
        let (a, b) = (a.trim().parse::<f64>().unwrap_or(0.0), b.trim().parse::<f64>().unwrap_or(0.0));
        if b > 0.0 { a / b } else { 0.0 }
    } else { s.parse().unwrap_or(0.0) }
}

fn bit_depth(pix: &str, raw: &str) -> u8 {
    if let Ok(b) = raw.trim().parse::<u8>() { if b >= 8 { return b; } }
    if pix.contains("12") { 12 } else if pix.contains("10") || pix.starts_with("p010") { 10 } else { 8 }
}

/// Interpreta a saída `-print_format flat` do ffprobe.
pub fn parse_flat(text: &str) -> MediaInfo {
    // streams.stream.N.campo=valor  /  format.campo=valor
    let mut streams: HashMap<u32, HashMap<String, String>> = HashMap::new();
    let mut format: HashMap<String, String> = HashMap::new();
    for line in text.lines() {
        let Some((k, v)) = line.split_once('=') else { continue };
        let v = v.trim().trim_matches('"').to_string();
        if let Some(rest) = k.strip_prefix("streams.stream.") {
            if let Some((n, key)) = rest.split_once('.') {
                if let Ok(n) = n.parse::<u32>() { streams.entry(n).or_default().insert(key.to_string(), v); }
            }
        } else if let Some(key) = k.strip_prefix("format.") {
            format.insert(key.to_string(), v);
        }
    }
    let mut info = MediaInfo {
        duration: format.get("duration").and_then(|d| d.parse().ok()).unwrap_or(0.0),
        bitrate_kbps: format.get("bit_rate").and_then(|b| b.parse::<u64>().ok()).map_or(0, |b| (b / 1000) as u32),
        ..Default::default()
    };
    let mut ids: Vec<u32> = streams.keys().copied().collect();
    ids.sort();
    for n in ids {
        let s = &streams[&n];
        let g = |k: &str| s.get(k).map(String::as_str).unwrap_or("");
        if info.timecode.is_empty() && !g("tags.timecode").is_empty() { info.timecode = g("tags.timecode").to_string(); }
        let attached = g("disposition.attached_pic") == "1";
        match g("codec_type") {
            "video" if info.video.is_none() && !attached => {
                let (cw, ch) = (g("width").parse().unwrap_or(0), g("height").parse().unwrap_or(0));
                // Rotação: side data (ffmpeg novo) ou tag "rotate" (antigo). O valor do side data é anti-horário.
                let mut rot: f64 = 0.0;
                for (k, v) in s.iter() {
                    if k.starts_with("side_data_list.") && k.ends_with(".rotation") { rot = -v.parse::<f64>().unwrap_or(0.0); }
                }
                if rot == 0.0 { rot = g("tags.rotate").parse().unwrap_or(0.0); }
                let rotation = (((rot / 90.0).round() as i64 * 90).rem_euclid(360)) as u32;
                let (w, h) = if rotation % 180 == 90 { (ch, cw) } else { (cw, ch) };
                let side = |suffix: &str| -> f64 {
                    s.iter().find(|(k, _)| k.starts_with("side_data_list.") && k.ends_with(suffix)).map_or(0.0, |(_, v)| rate(v))
                };
                let max_cll = side(".max_content");
                let mastering_max = side(".max_luminance");
                let fps = rate(g("avg_frame_rate"));
                let fps_nominal = rate(g("r_frame_rate"));
                let transfer = g("color_transfer").to_string();
                let hdr = match transfer.as_str() { "arib-std-b67" => "HLG", "smpte2084" => "PQ", _ => "" }.to_string();
                info.video = Some(VideoInfo {
                    index: g("index").parse().unwrap_or(n),
                    codec: g("codec_name").to_string(),
                    profile: g("profile").to_string(),
                    coded_width: cw, coded_height: ch, width: w, height: h, rotation,
                    pix_fmt: g("pix_fmt").to_string(),
                    bit_depth: bit_depth(g("pix_fmt"), g("bits_per_raw_sample")),
                    fps, fps_nominal,
                    vfr: fps > 0.0 && fps_nominal > 0.0 && (fps - fps_nominal).abs() / fps_nominal > 0.0005,
                    transfer, primaries: g("color_primaries").to_string(), matrix: g("color_space").to_string(), hdr,
                    bitrate_kbps: g("bit_rate").parse::<u64>().map_or(0, |b| (b / 1000) as u32),
                    max_cll, mastering_max,
                });
            }
            // Faixas que o FFmpeg não decodifica (ex.: áudio espacial APAC do iPhone) ficam de fora.
            "audio" if !matches!(g("codec_name"), "" | "none" | "apac" | "unknown") => info.audio.push(AudioInfo {
                index: g("index").parse().unwrap_or(n),
                codec: g("codec_name").to_string(),
                channels: g("channels").parse().unwrap_or(2),
                sample_rate: g("sample_rate").parse().unwrap_or(48000),
            }),
            _ => {}
        }
    }
    if info.timecode.is_empty() { if let Some(t) = format.get("tags.timecode") { info.timecode = t.clone(); } }
    if let Some(v) = info.video.as_mut() {
        if v.bitrate_kbps == 0 { v.bitrate_kbps = info.bitrate_kbps.saturating_sub(info.audio.len() as u32 * 256); }
    }
    info
}

#[cfg(test)]
mod tests {
    use super::*;

    const IPHONE: &str = r#"streams.stream.0.index=0
streams.stream.0.codec_name="hevc"
streams.stream.0.profile="Main 10"
streams.stream.0.codec_type="video"
streams.stream.0.width=3840
streams.stream.0.height=2160
streams.stream.0.pix_fmt="yuv420p10le"
streams.stream.0.color_space="bt2020nc"
streams.stream.0.color_transfer="arib-std-b67"
streams.stream.0.color_primaries="bt2020"
streams.stream.0.r_frame_rate="60/1"
streams.stream.0.avg_frame_rate="7380000/123161"
streams.stream.0.bit_rate="49812345"
streams.stream.0.side_data_list.side_data.0.side_data_type="Display Matrix"
streams.stream.0.side_data_list.side_data.0.rotation=-90
streams.stream.1.index=1
streams.stream.1.codec_name="aac"
streams.stream.1.codec_type="audio"
streams.stream.1.sample_rate="48000"
streams.stream.1.channels=2
streams.stream.2.index=2
streams.stream.2.codec_type="data"
streams.stream.3.index=3
streams.stream.3.codec_name="apac"
streams.stream.3.codec_type="audio"
format.duration="135.516000"
format.bit_rate="50100000"
"#;

    #[test]
    fn iphone_portrait_hlg() {
        let i = parse_flat(IPHONE);
        let v = i.video.unwrap();
        assert_eq!((v.width, v.height, v.rotation), (2160, 3840, 90));
        assert_eq!(v.hdr, "HLG");
        assert_eq!(v.bit_depth, 10);
        assert!(v.vfr, "59.92 médio contra 60 nominal é VFR");
        assert_eq!(v.bitrate_kbps, 49812);
        assert_eq!(i.audio.len(), 1);
        assert!((i.duration - 135.516).abs() < 1e-6);
    }

    #[test]
    fn cfr_landscape_sdr() {
        let t = "streams.stream.0.codec_type=\"video\"\nstreams.stream.0.width=3840\nstreams.stream.0.height=2160\nstreams.stream.0.pix_fmt=\"yuv420p\"\nstreams.stream.0.r_frame_rate=\"60000/1001\"\nstreams.stream.0.avg_frame_rate=\"60000/1001\"\nformat.duration=\"10\"\n";
        let v = parse_flat(t).video.unwrap();
        assert_eq!((v.width, v.height, v.rotation, v.bit_depth), (3840, 2160, 0, 8));
        assert!(!v.vfr);
        assert_eq!(v.hdr, "");
    }

    #[test]
    fn rotation_values() {
        for (raw, want) in [("-90", 90), ("90", 270), ("180", 180), ("-180", 180), ("0", 0)] {
            let t = format!("streams.stream.0.codec_type=\"video\"\nstreams.stream.0.width=100\nstreams.stream.0.height=50\nstreams.stream.0.side_data_list.side_data.0.rotation={raw}\n");
            assert_eq!(parse_flat(&t).video.unwrap().rotation, want, "rotation {raw}");
        }
    }
}
