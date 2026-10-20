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
            codec: "h265".into(), bits: 8, container: "mp4".into(), scale: "source".into(),
            bitrate: Bitrate::default(), max_quality: false, fps: Fps::default(), hdr_to_sdr: false,
            audio: Audio::default(), output: Output::default(), av_sync: true, metadata: true,
        }
    }
}

impl Preset {
    fn manual(kbps: u32, rc: &str) -> Bitrate { Bitrate { mode: "manual".into(), kbps, rc: rc.into() } }

    /// Presets que vêm com o app (os do Hugo, recriados a partir dos .enc do Shutter Encoder).
    pub fn defaults() -> Vec<Preset> {
        let iphone = Preset {
            id: "iphone-4k60".into(), name: "iPhone 4K60".into(), icon: "phone".into(), color: "blue".into(),
            bitrate: Self::manual(50_000, "cbr"), max_quality: true, fps: Fps { conform: true, value: "59.94".into() },
            output: Output { delete_source: true, ..Output::default() },
            ..Preset::default()
        };
        let proxy = Preset {
            id: "proxy".into(), name: "Proxy".into(), icon: "proxy".into(), color: "green".into(), scale: "25".into(),
            metadata: false,
            output: Output { suffix: Toggle { on: true, text: "_proxy".into() }, subfolder: Toggle { on: true, text: "proxy".into() }, delete_source: false },
            ..Preset::default()
        };
        vec![
            iphone.clone(),
            Preset { id: "iphone-4k60-hdr".into(), name: "iPhone 4K60 HDR".into(), icon: "hdr".into(), color: "orange".into(), hdr_to_sdr: true, ..iphone.clone() },
            proxy.clone(),
            Preset { id: "proxy-fx30".into(), name: "Proxy FX30".into(), icon: "camera".into(), color: "purple".into(),
                audio: Audio { codec: "copy".into(), ..Audio::default() }, ..proxy },
            Preset { id: "iphone-1080p60".into(), name: "iPhone 1080p60".into(), color: "teal".into(), scale: "1080".into(),
                bitrate: Self::manual(15_000, "cbr"), ..iphone.clone() },
            Preset { id: "iphone-1080p60-hdr".into(), name: "iPhone 1080p60 HDR".into(), icon: "hdr".into(), color: "yellow".into(),
                scale: "1080".into(), hdr_to_sdr: true, bitrate: Self::manual(15_000, "cbr"), ..iphone.clone() },
            Preset { id: "meta-15".into(), name: "Meta 15 Mb/s HDR".into(), icon: "meta".into(), color: "pink".into(), hdr_to_sdr: true,
                bitrate: Self::manual(15_000, "cbr"), fps: Fps { conform: true, value: "29.97".into() },
                audio: Audio { channels: "mono".into(), tracks: vec![1, 1], ..Audio::default() },
                output: Output::default(), ..iphone },
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
