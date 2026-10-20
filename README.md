# Mec Encoder

**English** · [Português](README.pt-BR.md)

A fast, minimal video converter for Windows, made for short-form video editors.
Built with **Rust** (Tauri 2) and **FFmpeg**, encoding with **NVIDIA NVENC**.

- Converts iPhone footage to a **constant frame rate** (e.g. 59.94 fps), keeping bitrate and quality.
- Creates **proxies** at 25% with automatic suffix and subfolder.
- Converts **iPhone HDR (HLG) to Rec. 709** with real tone mapping (the same Hable filter chain HandBrake uses).
- **Drop files or whole folders**: every video inside, subfolders included, goes to the queue.
- **Queue where each video keeps its own preset**, shown next to its name.
- **Output preview** before rendering: rotation, scale and color.
- **8-bit or 10-bit**, A/V sync, metadata copy, delete original after a verified render.
- **Presets** you can create, share and import from Shutter Encoder (`.enc`).
- English and Portuguese, dark and light themes.

> Work in progress. See the [roadmap](ROADMAP.md) and the [changelog](CHANGELOG.md).

## Try the interface

Open `app/ui/index.html` in a browser. Without the app it runs in demo mode with sample videos.
Add `?v=2` to the address to see the more minimal v2 layout, and `?lang=pt` for Portuguese.

## Credits

Inspired by [Shutter Encoder](https://github.com/paulpacifico/shutter-encoder) by Paul Pacifico. Mec Encoder is a new app and contains none of its code.
Inter typeface (SIL Open Font License). Made by [@hugoeditor_](https://x.com/hugoeditor_).
