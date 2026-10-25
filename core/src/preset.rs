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
    /// Nível do Auto: "high", "balanced" ou "light" ("" = como antes: alta, ou leve no proxy).
    pub level: String,
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
    /// Vídeo: "aac" ou "copy". Preset de áudio: "wav", "mp3", "aac", "flac" ou "copy".
    pub codec: String,
    /// "stereo" ou "mono".
    pub channels: String,
    /// Faixas de origem, começando em 1. Estéreo: [esquerdo, direito]. Mono: [faixa].
    pub tracks: Vec<u32>,
    /// Qualidade do AAC em kb/s; 0 = a mesma do áudio original.
    pub kbps: u32,
    /// Taxa de amostragem do AAC: 44100 ou 48000; 0 = a mesma do áudio original.
    pub rate: u32,
    /// WAV/FLAC: 16 ou 24 bits; 0 = o mesmo do original.
    pub bits: u32,
}

#[derive(Clone, Debug, PartialEq)]
#[cfg_attr(feature = "serde", derive(Serialize, Deserialize), serde(rename_all = "camelCase", default))]
pub struct Image {
    /// "jpg", "png" ou "webp".
    pub format: String,
    /// 1–100 (JPG e WebP).
    pub quality: u32,
    /// WebP sem perda.
    pub lossless: bool,
}
impl Default for Image {
    fn default() -> Self { Self { format: "jpg".into(), quality: 90, lossless: false } }
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
    /// "video", "audio" (converte só o áudio: WAV, MP3, AAC, FLAC) ou "image" (JPG, PNG, WebP).
    pub kind: String,
    pub id: String,
    pub name: String,
    pub icon: String,
    pub color: String,
    /// "h264", "h265" ou "source" (o mesmo do arquivo).
    pub codec: String,
    /// 8, 10 ou 0 (o mesmo do arquivo).
    pub bits: u8,
    /// Croma: "420", "422" ou "source".
    pub chroma: String,
    /// "mp4", "mov" ou "source" (a mesma extensão do arquivo).
    pub container: String,
    /// "source", "1080" (lado menor = 1080), "50" ou "25" (%).
    pub scale: String,
    /// Proporção do resultado: "source" ou "9:16", "16:9", "1:1", "4:5", "4:3", "3:4"...
    pub aspect: String,
    /// Como chegar na proporção: "crop" (corta as bordas, preenche tudo) ou "pad" (barras pretas, nada é cortado).
    pub aspect_mode: String,
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
    pub image: Image,
    pub output: Output,
    pub av_sync: bool,
    pub metadata: bool,
}

impl Default for Bitrate {
    fn default() -> Self { Self { mode: "auto".into(), kbps: 0, rc: "vbr".into(), level: String::new() } }
}
impl Default for Fps {
    fn default() -> Self { Self { conform: false, value: "59.94".into() } }
}
impl Default for Audio {
    fn default() -> Self { Self { codec: "aac".into(), channels: "stereo".into(), tracks: vec![1, 2], kbps: 256, rate: 48000, bits: 0 } }
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
            kind: "video".into(), id: "preset".into(), name: "Preset".into(), icon: "phone".into(), color: "blue".into(),
            codec: "h265".into(), bits: 8, chroma: "420".into(), container: "mp4".into(), scale: "source".into(), aspect: "source".into(), aspect_mode: "crop".into(), rotate: 0, custom_w: 0, custom_h: 0, folder: String::new(),
            bitrate: Bitrate::default(), max_quality: false, fps: Fps::default(), hdr_to_sdr: false,
            audio: Audio::default(), image: Image::default(), output: Output::default(), av_sync: true, metadata: true,
        }
    }
}

impl Preset {

    /// Presets que vêm com o app (só para quem abre pela primeira vez; os do usuário nunca são trocados).
    /// Tudo aqui roda pela placa em qualquer RTX 20/30/40/50: H.265, 4:2:0, profundidade Original.
    pub fn defaults() -> Vec<Preset> {
        let raw = Preset {
            id: "iphone-4k60".into(), name: "RAW".into(), icon: String::new(), color: "blue".into(),
            codec: "h265".into(), bits: 0, chroma: "420".into(), container: "source".into(),
            bitrate: Bitrate { mode: "source".into(), kbps: 50_000, rc: "cbr".into(), level: String::new() }, max_quality: true,
            fps: Fps { conform: true, value: "source".into() },
            // HDR automático: converte para Rec. 709 só quando o vídeo é HDR
            hdr_to_sdr: true,
            audio: Audio { codec: "copy".into(), ..Audio::default() },
            output: Output { delete_source: false, ..Output::default() },
            ..Preset::default()
        };
        let mut v = vec![
            raw.clone(),
            Preset { id: "backup".into(), name: "Backup".into(), color: "yellow".into(), bits: 10,
                bitrate: Bitrate { mode: "auto".into(), kbps: 0, rc: "vbr".into(), level: "balanced".into() },
                output: Output { suffix: Toggle { on: true, text: "_backup".into() }, subfolder: Toggle { on: true, text: "backup".into() }, delete_source: false },
                ..raw.clone() },
            Preset { id: "proxy".into(), name: "Proxy".into(), color: "green".into(), scale: "25".into(), bits: 8, container: "mp4".into(),
                bitrate: Bitrate { mode: "auto".into(), kbps: 0, rc: "vbr".into(), level: "light".into() }, max_quality: false,
                fps: Fps { conform: false, value: "source".into() },
                output: Output { suffix: Toggle { on: true, text: "_proxy".into() }, subfolder: Toggle { on: true, text: "proxy".into() }, delete_source: false },
                ..raw.clone() },
            Preset { id: "meta-15".into(), name: "Meta Glass".into(), color: "pink".into(),
                bitrate: Bitrate { mode: "source".into(), kbps: 15_000, rc: "cbr".into(), level: String::new() }, fps: Fps { conform: true, value: "29.97".into() },
                audio: Audio { codec: "copy".into(), channels: "mono".into(), tracks: vec![1, 1], ..Audio::default() },
                ..raw },
        ];
        v.extend(Self::audio_defaults());
        v.extend(Self::image_defaults());
        v
    }

    /// Presets de imagem (pasta "Images"; também entram uma vez para quem já usa o app).
    pub fn image_defaults() -> Vec<Preset> {
        let i = |id: &str, name: &str, color: &str, format: &str, quality: u32, lossless: bool| Preset {
            kind: "image".into(), id: id.into(), name: name.into(), color: color.into(), container: String::new(), folder: "Images".into(),
            image: Image { format: format.into(), quality, lossless },
            output: Output { suffix: Toggle { on: false, text: String::new() }, subfolder: Toggle { on: false, text: "images".into() }, delete_source: false },
            ..Preset::default()
        };
        vec![
            i("image-jpg", "JPG 90", "orange", "jpg", 90, false),
            i("image-png", "PNG", "green", "png", 100, false),
            i("image-webp", "WebP 85", "blue", "webp", 85, false),
        ]
    }

    /// Presets de áudio (também entram para quem já usa o app, uma vez, se não tiver nenhum).
    pub fn audio_defaults() -> Vec<Preset> {
        let a = |id: &str, name: &str, color: &str, codec: &str, kbps: u32, bits: u32| Preset {
            kind: "audio".into(), id: id.into(), name: name.into(), color: color.into(), container: String::new(), folder: "Audio".into(),
            audio: Audio { codec: codec.into(), channels: "source".into(), tracks: vec![1, 2], kbps, rate: 0, bits },
            output: Output { suffix: Toggle { on: false, text: String::new() }, subfolder: Toggle { on: false, text: "audio".into() }, delete_source: false },
            ..Preset::default()
        };
        vec![
            a("audio-wav", "WAV", "teal", "wav", 0, 24),
            a("audio-mp3", "MP3 320", "purple", "mp3", 320, 0),
            a("audio-m4a", "AAC 256", "indigo", "aac", 256, 0),
            a("audio-flac", "FLAC", "teal", "flac", 0, 0),
        ]
    }

    /// RTX 50 (Blackwell): preset extra que mantém 4:2:2 (nessas placas vai pela GPU).
    pub fn camera_422() -> Preset {
        let mut p = Self::defaults().remove(0);
        p.id = "camera-422".into(); p.name = "Igual à câmera".into(); p.color = "orange".into();
        p.codec = "source".into(); p.chroma = "source".into();
        p
    }

    pub fn is_audio(&self) -> bool { self.kind == "audio" }
    pub fn is_image(&self) -> bool { self.kind == "image" }

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
