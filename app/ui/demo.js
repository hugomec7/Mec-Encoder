// Modo demonstração: dados de exemplo para ver a interface no navegador,
// sem o Tauri e sem o FFmpeg. No app de verdade isso vem do backend em Rust.
(() => {
  if (window.__TAURI__) return;

  const base = {
    codec: 'h265', bits: 8, container: 'mp4', scale: 'source', rotate: 0, customW: 0, customH: 0, folder: '',
    bitrate: { mode: 'manual', kbps: 50000, rc: 'cbr' }, maxQuality: true,
    fps: { conform: true, value: '59.94' }, hdrToSdr: false,
    audio: { codec: 'aac', channels: 'stereo', tracks: [1, 2], kbps: 256 },
    output: { suffix: { on: true, text: '_{codec}' }, subfolder: { on: false, text: 'proxy' }, deleteSource: true },
    avSync: true, metadata: true,
  };
  const P = (o) => JSON.parse(JSON.stringify(Object.assign({}, base, o)));

  // Importados dos .enc do Shutter Encoder (C:\Users\hugo\Shutter Encoder\Functions)
  const presets = [
    P({ id: 'iphone-4k60', name: 'RAW', color: 'blue', bitrate: { mode: 'source', kbps: 50000, rc: 'cbr' }, deleteSource: false,
        audio: { codec: 'copy', channels: 'stereo', tracks: [1, 2], kbps: 256 },
        output: { suffix: { on: true, text: '_{codec}' }, subfolder: { on: false, text: 'proxy' }, deleteSource: false } }),
    P({ id: 'iphone-4k60-hdr', name: 'RAW HDR', color: 'orange', bits: 10, hdrToSdr: true, bitrate: { mode: 'source', kbps: 50000, rc: 'cbr' },
        audio: { codec: 'copy', channels: 'stereo', tracks: [1, 2], kbps: 256 } }),
    P({ id: 'proxy', name: 'Proxy', color: 'green', scale: '25', bitrate: { mode: 'auto', kbps: 0, rc: 'vbr' }, maxQuality: false,
        fps: { conform: false, value: '59.94' }, audio: { codec: 'copy', channels: 'stereo', tracks: [1, 2], kbps: 256 },
        output: { suffix: { on: true, text: '_proxy' }, subfolder: { on: true, text: 'proxy' }, deleteSource: false } }),
    P({ id: 'meta-15', name: 'Meta HDR', color: 'pink', hdrToSdr: true, bitrate: { mode: 'source', kbps: 15000, rc: 'cbr' },
        fps: { conform: true, value: '29.97' }, audio: { codec: 'copy', channels: 'mono', tracks: [1, 1], kbps: 256 } }),
  ];

  // arquivos de exemplo (o que o ffprobe devolveria)
  const iphone = { w: 2160, h: 3840, codec: 'HEVC', bits: 10, fps: '59,93', fpsNom: 60, vfr: true, aud: [{ kbps: 107, rate: 48000 }], dur: '00:02:15:31', kbps: 49800, audio: 2 };
  const queue = [
    { id: 1, file: 'IMG_4821.MOV', src: Object.assign({}, iphone, { hdr: false, rot: 0, mb: 842 }), preset: 'iphone-4k60', status: 'ready', hue: 205 },
    { id: 2, file: 'IMG_4822.MOV', src: Object.assign({}, iphone, { hdr: 'HLG', rot: 0, mb: 1210 }), preset: 'iphone-4k60', status: 'ready', hue: 28 },
    { id: 3, file: 'C0579.MP4', dir: 'Hug Challenge x Ella', src: { w: 2160, h: 3840, codec: 'H.264', codecId: 'h264', pix: 'yuv422p10le', bits: 10, fps: '59,94', fpsNom: 59.94, vfr: false, dur: '00:00:41:32', kbps: 200000, audio: 1, pcm: true, tc: '07:51:07:46', hdr: false, rot: 270, mb: 1141 },
      preset: 'iphone-4k60', status: 'ready', hue: 270 },
    { id: 4, file: 'IMG_4823.MOV', src: Object.assign({}, iphone, { hdr: false, rot: 90, mb: 655 }), preset: 'proxy', status: 'ready', hue: 150 },
    { id: 5, file: 'IMG_4801.MOV', src: Object.assign({}, iphone, { hdr: false, rot: 0, mb: 1034 }), preset: 'iphone-4k60', status: 'done', hue: 330 },
  ];

  const settings = { lang: 'en', theme: 'oled', lastDark: 'oled', defaultPreset: 'iphone-4k60', clearWhenDone: true, notify: true };
  window.MEC_DEMO = { presets, queue, settings };
})();
