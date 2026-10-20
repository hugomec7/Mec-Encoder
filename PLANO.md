# Plano do Mec Encoder

Conversor de vídeo para Windows, feito em Rust (Tauri 2) em cima do FFmpeg, com encode só por **NVIDIA NVENC**.
Só o que um editor de vídeos curtos usa no dia a dia: converter o bruto do iPhone, gerar proxy e corrigir HDR.

## Etapas

| # | Etapa | O que sai | Status |
|---|---|---|---|
| 1 | **Interface** | Protótipo navegável (modo demo), temas escuro e claro | ✅ em revisão |
| 2 | **Motor** | Rust: ffprobe (lê o arquivo), monta o comando do FFmpeg a partir do preset, roda NVENC com progresso | ⏳ |
| 3 | **Fila** | Cada vídeo com o próprio preset, renderiza em sequência, cancelar, notificação do Windows ao terminar | ⏳ |
| 4 | **Prévia** | Quadro do *resultado* gerado pelo mesmo comando do encode (rotação, escala e cor reais) + player com áudio | ⏳ |
| 5 | **HDR → Rec. 709** | Tone mapping para HLG do iPhone, comparado lado a lado com o HandBrake | ⏳ |
| 6 | **Presets** | Criar, editar, duplicar, excluir, importar `.enc` do Shutter Encoder, exportar/compartilhar `.mecpreset` | ⏳ |
| 7 | **Build** | Instalador + portátil no GitHub Actions, FFmpeg embutido | ⏳ |

Cada etapa visual passa por prints antes da build.

## Decisões técnicas

- **FFmpeg embutido** (build GPL do gyan.dev/BtbN, com NVENC, zscale e libplacebo). O app chama o executável, não linka a biblioteca.
- **Só NVENC** (`hevc_nvenc` / `h264_nvenc`). Na abertura o app testa a placa; sem NVIDIA, avisa em vez de falhar no meio da fila.
- **Rotação sempre explícita.** O app lê a rotação do arquivo (display matrix) e aplica ele mesmo, em vez de depender da rotação automática do FFmpeg.
  No Shutter Encoder, quando o filtro de GPU está ligado, o `scale` vira `scale_cuda` e a rotação automática não é aplicada: é por isso que às vezes o vídeo sai deitado.
- **Frame rate constante:** `-fps_mode cfr -r 60000/1001` (equivale ao "Conform by Drop > 59,94").
- **Qualidade máxima** = NVENC `-preset p7` (o mesmo que o Shutter Encoder usa).
- **Apagar o original** só depois que o encode termina sem erro e o arquivo novo é conferido com ffprobe (duração e streams).

## O que os presets do Shutter Encoder fazem

Lido dos arquivos em `C:\Users\hugo\Shutter Encoder\Functions`:

| Preset | Codec | Escala | Bitrate | FPS | Cor | Áudio | Saída |
|---|---|---|---|---|---|---|---|
| iPhone 4K60 | H.265 NVENC .mp4 | Original | 50 Mb/s CBR, máx. qualidade | 59,94 CFR | — | AAC 256k | sufixo `_{codec}` |
| iPhone 4K60 (HDR) | igual | Original | 50 Mb/s CBR | 59,94 CFR | Rec. 2020 → 709 + saturação +20 | AAC 256k | `_{codec}` |
| iPhone 1080p60 | igual | Original | 15 Mb/s CBR | 59,94 CFR | — | AAC 256k | `_{codec}` |
| iPhone 1080p60 (HDR) | igual | Original | 15 Mb/s CBR | 59,94 CFR | Rec. 2020 → 709 | AAC 256k | `_{codec}` |
| PROXY | H.265 (CPU) | 50% | auto | — | — | AAC 256k | `_proxy`, subpasta `proxy` |
| PROXY FX30 | H.265 NVENC | 25% | auto VBR | — | — | copiar, estéreo, faixas 1+2 | `_proxy` |
| Meta 15Mbs HDR | H.265 NVENC | Original | 15 Mb/s CBR | 29,97 CFR | 2020 → 709, saturação 0, vibrance +10 | AAC 256k, mono | `_{codec}` |

### Por que a conversão HDR do Shutter Encoder fica com cor diferente

1. O iPhone grava HDR em **HLG**. Com a entrada em "Rec. 2020", o Shutter Encoder usa o filtro `colorspace=iall=bt2020:all=bt709`, que troca a matriz e as cores primárias mas **não converte a curva HLG**. A imagem sai com gama errado.
2. A opção "HDR" dele força a curva **PQ** (`smpte2084`), que também não é a do iPhone.
3. No preset 4K60 (HDR) a colorimetria está ligada com o slider de **saturação em +20**, o que soma uns 13% de saturação por cima.

O HandBrake lê a curva certa do arquivo e faz tone mapping de verdade. O Mec Encoder vai fazer o mesmo: linearizar a partir de HLG, tone mapping e só então ir para Rec. 709.
