# Roadmap · Plano

## Steps · Etapas

| # | Step | Etapa | Status |
|---|---|---|---|
| 1 | Interface (v1 and v2, dark and light, EN/PT) | Interface (v1 e v2, escuro e claro, EN/PT) | ✅ in review · em revisão |
| 2 | Engine: ffprobe, FFmpeg command from the preset, NVENC with progress | Motor: ffprobe, comando do FFmpeg a partir do preset, NVENC com progresso | ⏳ |
| 3 | Queue: per-video preset, folder scan, cancel, Windows notification | Fila: preset por vídeo, leitura de pastas, cancelar, notificação do Windows | ⏳ |
| 4 | Preview: output frame from the real command + player with audio | Prévia: quadro do resultado pelo comando real + player com áudio | ⏳ |
| 5 | HDR → Rec. 709 | HDR → Rec. 709 | ⏳ |
| 6 | Presets: create, edit, import `.enc`, export/share | Presets: criar, editar, importar `.enc`, exportar/compartilhar | ⏳ |
| 7 | Build: installer + portable on GitHub Actions, bundled FFmpeg | Build: instalador + portátil no GitHub Actions, FFmpeg embutido | ⏳ |

## Technical decisions

- **Bundled FFmpeg** (GPL build with NVENC and zimg). The app runs the executable; it does not link the library.
- **NVENC only** (`hevc_nvenc` / `h264_nvenc`). The app checks the GPU at startup and warns if there's no NVIDIA card.
- **Bit depth**: 8-bit `yuv420p`, 10-bit `p010le` with `-profile:v main10` on H.265.
- **Rotation is always applied explicitly.** The app reads the display matrix and applies the rotation itself instead of relying on FFmpeg's autorotate.
  Shutter Encoder replaces `scale` with `scale_cuda` when GPU filtering is on, and the autorotate step gets lost, which is why some files come out sideways.
- **Constant frame rate**: `-fps_mode cfr -r 60000/1001` (same as Shutter Encoder's "Conform by Drop").
- **Max quality** = NVENC `-preset p7`.
- **A/V sync**: `aresample=async=1:first_pts=0` on audio, so audio stays aligned after the frame rate change.
- **Copy metadata**: `-map_metadata 0 -movflags use_metadata_tags` (date, location, camera).
- **Delete original** only after the render ends without errors and the new file is checked with ffprobe (duration and streams).
- **Show in folder**: `explorer /select,<file>` through the Tauri opener plugin.
- **Finish sound** `sounds/done.mp3`; Windows notification (tauri-plugin-notification) when the window is in the background.
- **Folders**: dropped folders are scanned recursively for video files (`.mov .mp4 .m4v .mxf .mts .avi .mkv`); hidden and system files are skipped.

### HDR → Rec. 709 (same as HandBrake)

HandBrake's "Color space: BT.709" filter (`libhb/colorspace.c`) builds this chain when the source is HLG or PQ:

```
zscale=transfer=linear:npl=100,
format=gbrpf32le,
tonemap=tonemap=hable:desat=0:peak=<P>,
zscale=primaries=bt709:transfer=bt709:matrix=bt709:range=tv,
format=<source pixel format>
```

`P` = MaxCLL ÷ 100, or mastering max luminance ÷ 100; if neither exists (or it's below 1), **10 for HLG** and 100 for PQ.
Mec Encoder uses the same chain, so the colors match HandBrake.

Shutter Encoder differs in two ways: with the input set to "Rec. 2020" it uses `colorspace=iall=bt2020:all=bt709`, which doesn't convert the HLG curve, and its "HDR" option assumes PQ (`smpte2084`), not the HLG the iPhone records.
