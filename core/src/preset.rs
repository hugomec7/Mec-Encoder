//! Preset: o mesmo formato que a interface usa (camelCase no JSON).

#[cfg(feature = "serde")]
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq)]
#[cfg_attr(feature = "serde", derive(Serialize, Deserialize), serde(rename_all = "camelCase", default))]
pub struct Bitrate {
    /// "auto" (qualidade constante), "source" (igual ao original) ou "manual".
    pub mode: String,
    pub kbps: u32,
    /// "cbr" ou "vbr".
    pub rc: String,
}

#[derive(Clone, Debug, PartialEq)]
#[cfg_attr(feature = "serde", derive(Serialize, Deserialize), serde(rename_all = "camelCase", default))]
pub struct Fps {
    pub conform: bool,
    /// "23.976", "29.97", "59.94", "60"...
    pub value: String,
}

#[derive(Clone, Debug, PartialEq)]
#[cfg_attr(feature = "serde", derive(Serialize, Deserialize), serde(rename_all = "camelCase", default))]
pub struct Audio {
    /// "aac" ou "copy".
    pub codec: String,
    /// "stereo" ou "mono".
    pub channels: String,
    /// Faixas de origem, começando em 1. Estéreo: [esquerdo, direito]. Mono: [faixa].
    pub tracks: Vec<u32>,
    pub kbps: u32,
}

#[derive(Clone, Debug, PartialEq)]
#[cfg_attr(feature = "serde", derive(Serialize, Deserialize), serde(rename_all = "camelCase", default))]
pub struct Toggle {
    pub on: bool,
    pub text: String,
}

#[derive(Clone, Debug, PartialEq)]
#[cfg_attr(feature = "serde", derive(Serialize, Deserialize), serde(rename_all = "camelCase", default))]
pub struct Output {
    pub suffix: Toggle,
    pub subfolder: Toggle,
    pub delete_source: bool,
}

#[derive(Clone, Debug, PartialEq)]
#[cfg_attr(feature = "serde", derive(Serialize, Deserialize), serde(rename_all = "camelCase", default))]
pub struct Preset {
    pub id: String,
    pub name: String,
    pub icon: String,
    pub color: String,
    /// "h264" ou "h265".
    pub codec: String,
    /// 8 ou 10.
    pub bits: u8,
    /// "mp4" ou "mov".
    pub container: String,
    /// "source", "1080" (lado menor = 1080), "50" ou "25" (%).
    pub scale: String,
    /// Giro extra no sentido horário: 0, 90, 180 ou 270.
    pub rotate: u32,
    /// Resolução personalizada (scale = "custom"). 0 = calcula pela proporção.
    pub custom_w: u32,
    pub custom_h: u32,
    /// Pasta onde o preset aparece na lista ("" = sem pasta).
    pub folder: String,
    pub bitrate: Bitrate,
    pub max_quality: bool,
    pub fps: Fps,
    pub hdr_to_sdr: bool,
    pub audio: Audio,
    pub output: Output,
    pub av_sync: bool,
    pub metadata: bool,
}

impl Default for Bitrate {
    fn default() -> Self { Self { mode: "auto".into(), kbps: 0, rc: "vbr".into() } }
}
impl Default for Fps {
    fn default() -> Self { Self { conform: false, value: "59.94".into() } }
}
impl Default for Audio {
    fn default() -> Self { Self { codec: "aac".into(), channels: "stereo".into(), tracks: vec![1, 2], kbps: 256 } }
}
impl Default for Toggle {
    fn default() -> Self { Self { on: false, text: String::new() } }
}
impl Default for Output {
    fn default() -> Self {
        Self { suffix: Toggle { on: true, text: "_{codec}".into() }, subfolder: Toggle { on: false, text: "proxy".into() }, delete_source: false }
    }
}
impl Default for Preset {
    fn default() -> Self {
        Self {
            id: "preset".into(), name: "Preset".into(), icon: "phone".into(), color: "blue".into(),
            codec: "h265".into(), bits: 8, container: "mp4".into(), scale: "source".into(), rotate: 0, custom_w: 0, custom_h: 0, folder: String::new(),
            bitrate: Bitrate::default(), max_quality: false, fps: Fps::default(), hdr_to_sdr: false,
            audio: Audio::default(), output: Output::default(), av_sync: true, metadata: true,
        }
    }
}

impl Preset {

    /// Presets que vêm com o app.
    pub fn defaults() -> Vec<Preset> {
        let raw = Preset {
            id: "iphone-4k60".into(), name: "RAW".into(), icon: String::new(), color: "blue".into(),
            bitrate: Bitrate { mode: "source".into(), kbps: 50_000, rc: "cbr".into() }, max_quality: true,
            fps: Fps { conform: true, value: "59.94".into() },
            audio: Audio { codec: "copy".into(), ..Audio::default() },
            ..Preset::default()
        };
        vec![
            raw.clone(),
            Preset { id: "iphone-4k60-hdr".into(), name: "RAW HDR".into(), color: "orange".into(), bits: 10, hdr_to_sdr: true,
                output: Output { delete_source: true, ..Output::default() }, ..raw.clone() },
            Preset { id: "proxy".into(), name: "Proxy".into(), color: "green".into(), scale: "25".into(),
                bitrate: Bitrate { mode: "auto".into(), kbps: 0, rc: "vbr".into() }, max_quality: false,
                fps: Fps { conform: false, value: "59.94".into() },
                output: Output { suffix: Toggle { on: true, text: "_proxy".into() }, subfolder: Toggle { on: true, text: "proxy".into() }, delete_source: false },
                ..raw.clone() },
            Preset { id: "meta-15".into(), name: "Meta HDR".into(), color: "pink".into(), hdr_to_sdr: true,
                bitrate: Bitrate { mode: "source".into(), kbps: 15_000, rc: "cbr".into() }, fps: Fps { conform: true, value: "29.97".into() },
                audio: Audio { codec: "copy".into(), channels: "mono".into(), tracks: vec![1, 1], kbps: 256 },
                output: Output { delete_source: true, ..Output::default() }, ..raw },
        ]
    }

    /// Frame rate como fração exata ("59.94" -> 60000/1001).
    pub fn fps_rational(&self) -> (u32, u32) { fps_rational(&self.fps.value) }
}

pub fn fps_rational(v: &str) -> (u32, u32) {
    let v = v.trim().replace(',', ".");
    match v.as_str() {
        "23.976" | "23.98" => (24000, 1001),
        "29.97" => (30000, 1001),
        "47.952" => (48000, 1001),
        "59.94" => (60000, 1001),
        "119.88" => (120000, 1001),
        _ => match v.parse::<f64>() {
            Ok(f) if f > 0.0 && (f - f.round()).abs() < 1e-6 => (f.round() as u32, 1),
            Ok(f) if f > 0.0 => ((f * 1000.0).round() as u32, 1000),
            _ => (60000, 1001),
        },
    }
}
