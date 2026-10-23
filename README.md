# Mec Encoder

**English** · [Português](README.pt-BR.md)

A fast, minimal video converter for Windows, made for short-form video editors.
Built with **Rust** (Tauri 2) and **FFmpeg**, encoding with **NVIDIA NVENC**.

![Mec Encoder converting an iPhone video](docs/screenshots/main.png)

![Rendering a queue of 13 videos with NVENC](docs/screenshots/rendering.png)

<p>
  <img src="docs/screenshots/empty-queue.png" width="49%" alt="Empty queue, editing a preset">
  <img src="docs/screenshots/settings.png" width="49%" alt="Settings">
</p>


- Converts iPhone footage to a **constant frame rate** (e.g. 59.94 fps), keeping bitrate and quality.
- Creates **proxies** at 25% with automatic suffix and subfolder.
- Converts **iPhone HDR (HLG) to Rec. 709** with real tone mapping (the same Hable filter chain HandBrake uses), automatically when the video is HDR.
- **Keeps camera files as they are** when you want: codec, chroma (4:2:2), bit depth, frame rate, .mp4/.mov, PCM audio and timecode on Source.
- **Converts audio** (WAV, MP3, AAC, FLAC) and extracts audio from videos.
- **Drop files or whole folders**: every video inside, subfolders included, goes to the queue.
- **Queue where each video keeps its own preset**, shown next to its name.
- **Output preview** before rendering: rotation, scale and color, with **Compare** to see the original side by side.
- **8-bit or 10-bit**, A/V sync, metadata copy, delete original after a verified render.
- **Presets** you can create, share and import from Shutter Encoder (`.enc`).
- **Render one video or the whole queue**, reorder by dragging, drag a preset onto a video, show in folder.
- English and Portuguese; light, dark and OLED themes.

> Test builds. See the [roadmap](ROADMAP.md) and the [changelog](CHANGELOG.md).

## Download

Get the latest version on the [Releases](https://github.com/hugomec7/Mec-Encoder/releases) page (Windows 10/11, 64-bit):

- `MecEncoder_x.y.z_x64.msi` — installer
- `MecEncoder_x.y.z_x64_portable.zip` — portable, unzip and open `Mec Encoder.exe`

FFmpeg comes bundled. NVENC needs an NVIDIA GPU; without one, Mec Encoder uses the CPU.
When a new version is out, an **Update** button appears at the top of the app. Presets and settings are kept (they live in `%APPDATA%\com.hugomec.mecencoder`).

## Try the interface

Open `app/ui/index.html` in a browser. Without the app it runs in demo mode with sample videos.
Add `?lang=pt` to the address for Portuguese.

## Credits

Inspired by [Shutter Encoder](https://github.com/paulpacifico/shutter-encoder) by Paul Pacifico. Mec Encoder is a new app and contains none of its code.
Bundles [FFmpeg](https://ffmpeg.org) (GPL build by BtbN). Inter typeface (SIL Open Font License). Made by [@hugoeditor_](https://x.com/hugoeditor_).
