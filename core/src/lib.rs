//! Mec Encoder — motor sem interface.
//!
//! - [`probe`]: lê o arquivo com ffprobe (resolução, rotação, fps, HDR, faixas de áudio).
//! - [`command`]: monta o comando do FFmpeg a partir do preset.
//! - [`progress`]: lê o progresso que o FFmpeg escreve em `-progress pipe:1`.
//! - [`scan`]: transforma arquivos e pastas arrastados em uma lista de vídeos.
//! - [`enc`]: importa presets `.enc` do Shutter Encoder.
//! - [`tools`]: acha o ffmpeg/ffprobe e roda sem abrir janela de console.
//!
//! Só usa a biblioteca padrão; `serde` entra pela feature `serde` (usada pelo app).

pub mod command;
pub mod enc;
pub mod preset;
pub mod probe;
pub mod progress;
pub mod scan;
pub mod tools;

pub use command::{build, output_path, output_path_for, preview_args, Encoder, Naming, Plan};
pub use preset::Preset;
pub use probe::{MediaInfo, VideoInfo};
