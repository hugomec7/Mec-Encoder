# Mec Encoder

[English](README.md) · **Português**

Conversor de vídeo para Windows, rápido e minimalista, feito para editores de vídeos curtos.
Feito em **Rust** (Tauri 2) com **FFmpeg** e encode por **NVIDIA NVENC**.

- Converte vídeos do iPhone para **frame rate constante** (ex.: 59,94 fps), mantendo bitrate e qualidade.
- Gera **proxy** em 25% com sufixo e subpasta automáticos.
- Converte **HDR do iPhone (HLG) para Rec. 709** com tone mapping de verdade (a mesma sequência de filtros Hable do HandBrake).
- **Arraste arquivos ou pastas inteiras**: todos os vídeos de dentro, inclusive das subpastas, entram na fila.
- **Fila em que cada vídeo tem o próprio preset**, visível ao lado do nome.
- **Prévia do resultado** antes de renderizar: rotação, escala e cor.
- **8-bit ou 10-bit**, sincronia A/V, cópia dos metadados, apagar o original só depois do render conferido.
- **Presets** para criar, compartilhar e importar do Shutter Encoder (`.enc`).
- Inglês e português, temas escuro e claro.

> Em desenvolvimento. Veja o [plano](ROADMAP.md) e as [novidades](CHANGELOG.md).

## Ver a interface

Abra `app/ui/index.html` no navegador. Sem o app instalado, ela roda em modo demonstração com vídeos de exemplo.
Coloque `?v=2` no endereço para ver o layout v2, mais minimalista, e `?lang=pt` para português.

## Créditos

Inspirado no [Shutter Encoder](https://github.com/paulpacifico/shutter-encoder), de Paul Pacifico. O Mec Encoder é um app novo e não usa código dele.
Fonte Inter (SIL Open Font License). Por [@hugoeditor_](https://x.com/hugoeditor_).
