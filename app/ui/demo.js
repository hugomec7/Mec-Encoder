// Modo demonstração: dados de exemplo para ver a interface no navegador,
// sem o Tauri e sem o FFmpeg. No app de verdade isso vem do backend em Rust.
(() => {
  if (window.__TAURI__) return;

  const base = {
    kind: 'video', codec: 'h265', bits: 8, chroma: '420', container: 'mp4', scale: 'source', rotate: 0, customW: 0, customH: 0, folder: '',
    bitrate: { mode: 'manual', kbps: 50000, rc: 'cbr' }, maxQuality: true,
    fps: { conform: true, value: '59.94' }, hdrToSdr: false,
    audio: { codec: 'aac', channels: 'stereo', tracks: [1, 2], kbps: 256 },
    output: { suffix: { on: true, text: '_{codec}' }, subfolder: { on: false, text: 'proxy' }, deleteSource: true },
    avSync: true, metadata: true,
  };
  const P = (o) => JSON.parse(JSON.stringify(Object.assign({}, base, o)));

  // Os mesmos padrões do app (core/src/preset.rs)
  const presets = [
    P({ id: 'iphone-4k60', name: 'RAW', color: 'blue', bits: 0, chroma: '420', container: 'source', hdrToSdr: true,
        bitrate: { mode: 'source', kbps: 50000, rc: 'cbr', level: '' }, fps: { conform: true, value: 'source' },
        audio: { codec: 'copy', channels: 'stereo', tracks: [1, 2], kbps: 256, rate: 48000 },
        output: { suffix: { on: true, text: '_{codec}' }, subfolder: { on: false, text: 'proxy' }, deleteSource: false } }),
    P({ id: 'backup', name: 'Backup', color: 'yellow', bits: 10, chroma: '420', container: 'source', hdrToSdr: true,
        bitrate: { mode: 'auto', kbps: 0, rc: 'vbr', level: 'balanced' }, fps: { conform: true, value: 'source' },
        audio: { codec: 'copy', channels: 'stereo', tracks: [1, 2], kbps: 256, rate: 48000 },
        output: { suffix: { on: true, text: '_backup' }, subfolder: { on: true, text: 'backup' }, deleteSource: false } }),
    P({ id: 'proxy', name: 'Proxy', color: 'green', scale: '25', bitrate: { mode: 'auto', kbps: 0, rc: 'vbr', level: 'light' }, maxQuality: false, hdrToSdr: true,
        fps: { conform: false, value: 'source' }, audio: { codec: 'copy', channels: 'stereo', tracks: [1, 2], kbps: 256, rate: 48000 },
        output: { suffix: { on: true, text: '_proxy' }, subfolder: { on: true, text: 'proxy' }, deleteSource: false } }),
    P({ id: 'meta-15', name: 'Meta Glass', color: 'pink', hdrToSdr: true, bits: 0, container: 'source', bitrate: { mode: 'source', kbps: 15000, rc: 'cbr', level: '' },
        fps: { conform: true, value: '29.97' }, audio: { codec: 'copy', channels: 'mono', tracks: [1, 1], kbps: 256, rate: 48000 },
        output: { suffix: { on: true, text: '_{codec}' }, subfolder: { on: false, text: 'proxy' }, deleteSource: false } }),
  ];
  const A = (id, name, color, codec, kbps, bits) => P({ kind: 'audio', id, name, color, container: '', folder: codec === 'wav' || codec === 'flac' ? 'Audio/Lossless' : 'Audio',
    audio: { codec, channels: 'source', tracks: [1, 2], kbps, rate: 0, bits },
    output: { suffix: { on: false, text: '' }, subfolder: { on: false, text: 'audio' }, deleteSource: false } });
  const audioDefaults = [A('audio-wav', 'WAV', 'teal', 'wav', 0, 24), A('audio-mp3', 'MP3 320', 'purple', 'mp3', 320, 0),
    A('audio-m4a', 'AAC 256', 'indigo', 'aac', 256, 0), A('audio-flac', 'FLAC', 'teal', 'flac', 0, 0)];
  presets.push(...audioDefaults.map((p) => JSON.parse(JSON.stringify(p))));

  // arquivos de exemplo (o que o ffprobe devolveria)
  const iphone = { w: 2160, h: 3840, codec: 'HEVC', bits: 10, fps: '59,93', fpsNom: 60, vfr: true, aud: [{ kbps: 107, rate: 48000 }], dur: '00:02:15:31', kbps: 49800, audio: 2 };
  const queue = [
    { id: 1, file: 'IMG_4821.MOV', src: Object.assign({}, iphone, { hdr: false, rot: 0, mb: 842 }), preset: 'iphone-4k60', status: 'ready', hue: 205 },
    { id: 2, file: 'IMG_4822.MOV', src: Object.assign({}, iphone, { hdr: 'HLG', rot: 0, mb: 1210 }), preset: 'iphone-4k60', status: 'ready', hue: 28 },
    { id: 3, file: 'C0579.MP4', dir: 'Hug Challenge x Ella', src: { w: 2160, h: 3840, codec: 'H.264', codecId: 'h264', pix: 'yuv422p10le', bits: 10, fps: '59,94', fpsNom: 59.94, vfr: false, dur: '00:00:41:32', kbps: 200000, audio: 1, pcm: true, tc: '07:51:07:46', hdr: false, rot: 270, mb: 1141 },
      preset: 'iphone-4k60', status: 'ready', hue: 270 },
    { id: 4, file: 'IMG_4823.MOV', src: Object.assign({}, iphone, { hdr: false, rot: 90, mb: 655 }), preset: 'proxy', status: 'ready', hue: 150 },
    { id: 6, file: 'Entrevista.mp3', dir: 'Audios', src: { audioOnly: true, codec: 'MP3', aud: [{ kbps: 192, rate: 44100, ch: 2, codec: 'mp3', bits: 0 }], dur: '00:03:12:00', durS: 192, audio: 1, mb: 4.6, hdr: false, rot: 0 },
      preset: 'audio-wav', status: 'ready', hue: 180 },
    { id: 5, file: 'IMG_4801.MOV', src: Object.assign({}, iphone, { hdr: false, rot: 0, mb: 1034 }), preset: 'iphone-4k60', status: 'done', hue: 330 },
  ];

  const settings = { folders: ['Audio', 'Audio/Lossless', 'Images'], lang: 'en', theme: 'oled', lastDark: 'oled', defaultPreset: 'iphone-4k60', clearWhenDone: true, notify: true };
  window.MEC_DEMO = { presets, queue, settings, audioDefaults };
})();
