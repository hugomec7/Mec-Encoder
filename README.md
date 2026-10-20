# Mec Encoder

Conversor de vídeo para Windows, rápido e minimalista, para editores de vídeos curtos.
Feito em **Rust** (Tauri 2) com **FFmpeg** e encode por **NVIDIA NVENC**.

- Converte o bruto do iPhone para **59,94 fps constante** (pronto para o After Effects), mantendo bitrate e qualidade.
- Gera **proxy** em 25% com sufixo e subpasta automáticos.
- Converte **HDR do iPhone (HLG) para Rec. 709** com tone mapping de verdade.
- **Fila** em que cada vídeo tem o próprio preset, visível ao lado do nome.
- **Prévia do resultado** antes de renderizar: rotação, escala e cor.
- **Presets** próprios para criar, compartilhar e importar do Shutter Encoder.

> Em desenvolvimento. Veja o [plano](PLANO.md) e as [novidades](CHANGELOG.md).

## Ver a interface

Abra `app/ui/index.html` no navegador. Sem o app instalado, ela roda em modo demonstração com vídeos de exemplo.

## Créditos

Inspirado no [Shutter Encoder](https://github.com/paulpacifico/shutter-encoder), de Paul Pacifico. O Mec Encoder é um app novo e não usa código dele.
Fonte Inter (SIL Open Font License). Por [@hugoeditor_](https://x.com/hugoeditor_).
