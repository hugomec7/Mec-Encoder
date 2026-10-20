# Presets do Shutter Encoder (análise)

Notas de referência usadas para recriar os presets no Mec Encoder.

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
