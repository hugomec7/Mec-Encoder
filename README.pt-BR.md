# Mec Encoder

[English](README.md) · **Português**

Conversor de vídeo para Windows, rápido e minimalista, feito para editores de vídeos curtos.
Feito em **Rust** (Tauri 2) com **FFmpeg** e encode por **NVIDIA NVENC**.

![Mec Encoder convertendo um vídeo do iPhone](docs/screenshots/main.png)

![Renderizando uma fila de 13 vídeos com NVENC](docs/screenshots/rendering.png)

<p>
  <img src="docs/screenshots/empty-queue.png" width="49%" alt="Fila vazia, editando um preset">
  <img src="docs/screenshots/settings.png" width="49%" alt="Configurações">
</p>


- Converte vídeos do iPhone para **frame rate constante** (ex.: 59,94 fps), mantendo bitrate e qualidade.
- Gera **proxy** em 25% com sufixo e subpasta automáticos.
- Converte **HDR do iPhone (HLG) para Rec. 709** com tone mapping de verdade (a mesma sequência de filtros Hable do HandBrake), automaticamente quando o vídeo é HDR.
- **Mantém o arquivo da câmera como está** quando você quer: codec, croma (4:2:2), profundidade, frame rate, .mp4/.mov, áudio PCM e timecode em Original.
- **Converte áudio** (WAV, MP3, AAC, FLAC) e extrai o áudio de vídeos.
- **Converte imagens** (JPG, PNG, WebP), com redimensionar e girar.
- **Arraste arquivos ou pastas inteiras**: todos os vídeos de dentro, inclusive das subpastas, entram na fila.
- **Fila em que cada vídeo tem o próprio preset**, visível ao lado do nome.
- **Prévia do resultado** antes de renderizar: rotação, escala e cor, com **Comparar** para ver o original lado a lado.
- **8-bit ou 10-bit**, sincronia A/V, cópia dos metadados, apagar o original só depois do render conferido.
- **Presets** para criar, compartilhar e importar do Shutter Encoder (`.enc`).
- **Renderize um vídeo só ou a fila inteira**, reordene arrastando, arraste um preset até o vídeo, mostrar na pasta.
- Inglês e português; temas claro, escuro e OLED.

> Builds de teste. Veja o [plano](ROADMAP.md) e as [novidades](CHANGELOG.md).

## Baixar

Baixe a versão mais recente na página [Releases](https://github.com/hugomec7/Mec-Encoder/releases) (Windows 10/11, 64-bit):

- `MecEncoder_x.y.z_x64.msi` — instalador
- `MecEncoder_x.y.z_x64_portable.zip` — portátil, é só descompactar e abrir o `Mec Encoder.exe`

O FFmpeg já vem junto. O NVENC precisa de placa NVIDIA; sem ela, o Mec Encoder usa a CPU.
Quando sair uma versão nova, aparece um botão **Atualizar** no topo do app. Presets e configurações continuam (ficam em `%APPDATA%\com.hugomec.mecencoder`).

## Ver a interface

Abra `app/ui/index.html` no navegador. Sem o app instalado, ela roda em modo demonstração com vídeos de exemplo.
Coloque `?lang=pt` no endereço para ver em português.

## Créditos

Inspirado no [Shutter Encoder](https://github.com/paulpacifico/shutter-encoder), de Paul Pacifico. O Mec Encoder é um app novo e não usa código dele.
Inclui o [FFmpeg](https://ffmpeg.org) (build GPL do BtbN). Fonte Inter (SIL Open Font License). Por [@hugoeditor_](https://x.com/hugoeditor_).
