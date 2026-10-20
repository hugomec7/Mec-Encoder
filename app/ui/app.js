// Mec Encoder — lógica da interface
// Roda de dois jeitos: dentro do app (Tauri, motor de verdade) ou no navegador (modo demonstração).
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const root = document.documentElement;
  const qs = new URLSearchParams(location.search);
  const TA = window.__TAURI__;
  const REAL = !!TA;
  const inv = (cmd, args) => TA.core.invoke(cmd, args);
  const on = (ev, cb) => TA.event.listen(ev, (e) => cb(e.payload));

  const COLORS = { blue: 'var(--blue)', orange: 'var(--orange)', green: 'var(--green)', purple: 'var(--purple)',
    teal: 'var(--teal)', yellow: 'var(--yellow)', pink: 'var(--pink)', indigo: 'var(--indigo)', red: 'var(--red)' };
  const PALETTE = Object.keys(COLORS);
  const ICONS = {
    clock: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="8" cy="8" r="6"/><path d="M8 4.8V8l2.2 1.4"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="6.5" y="2.5" width="11" height="19" rx="3"/><path d="M10.5 18.5h3"/></svg>',
    hdr: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor"/></svg>',
    proxy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="4"/><rect x="7.5" y="10.5" width="6" height="6" rx="1.5" fill="currentColor"/></svg>',
    camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5A2.5 2.5 0 0 1 5.5 6H7l1.5-2h7L17 6h1.5A2.5 2.5 0 0 1 21 8.5v9a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z"/><circle cx="12" cy="13" r="3.5"/></svg>',
    meta: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 15.5c0-4 2-8 4.3-8 3.4 0 4.6 9 7.6 9 1.8 0 2.6-1.6 2.6-3.6 0-3.3-1.7-5.4-3.6-5.4-2.6 0-4.3 4.2-5.6 6.4-1.2 2-2.1 2.6-3.2 2.6C4.8 16.5 4 16.2 4 15.5z"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    warn: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M7.1 2.5a1 1 0 0 1 1.8 0l5.4 9.6a1 1 0 0 1-.9 1.5H2.6a1 1 0 0 1-.9-1.5z"/><path d="M8 5.6v3.6M8 11.2v.1" stroke="#000" stroke-opacity=".55" stroke-width="1.6" stroke-linecap="round"/></svg>',
    check: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 8.5l3 3 6-7"/></svg>',
    x: '<svg viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M2.5 2.5l5 5M7.5 2.5l-5 5"/></svg>',
    rot: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M13.5 8A5.5 5.5 0 1 1 8 2.5c1.8 0 3.3.8 4.3 2.1"/><path d="M12.8 1.8v3h-3"/></svg>',
    chev: '<svg class="chev" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 4.5L6 7l2.5-2.5"/></svg>',
    folder: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"><path d="M2 4.8C2 4 2.6 3.5 3.3 3.5h3l1.4 1.4h5c.7 0 1.3.6 1.3 1.3v5.5c0 .7-.6 1.3-1.3 1.3H3.3c-.7 0-1.3-.6-1.3-1.3z"/></svg>',
    reveal: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4.8C2 4 2.6 3.5 3.3 3.5h3l1.4 1.4h5c.7 0 1.3.6 1.3 1.3v5.5c0 .7-.6 1.3-1.3 1.3H3.3c-.7 0-1.3-.6-1.3-1.3z"/><path d="M6.5 9.5h3.5M8.5 8l1.5 1.5L8.5 11"/></svg>',
    playc: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M5 3.4v9.2c0 .45.5.7.85.45l6.9-4.6a.55.55 0 0 0 0-.9L5.85 2.95C5.5 2.7 5 2.95 5 3.4z"/></svg>',
    top: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 3h9M8 13V6M5 9l3-3 3 3"/></svg>',
    trash: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.2c0 .5.4.8.9.8h4c.5 0 .9-.3.9-.8l.6-8.2"/></svg>',
    layers: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2l6 3.3L8 8.6 2 5.3z"/><path d="M2 8.6l6 3.3 6-3.3"/></svg>',
    star: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"><path d="M8 2.3l1.7 3.6 3.9.4-2.9 2.6.8 3.9L8 10.8l-3.5 2 .8-3.9-2.9-2.6 3.9-.4z"/></svg>',
    edit: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M10.5 3l2.5 2.5L6 12.5l-3 .5.5-3z"/></svg>',
    copy: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"><rect x="5" y="5" width="8.5" height="8.5" rx="2"/><path d="M11 5V4a1.5 1.5 0 0 0-1.5-1.5h-5A1.5 1.5 0 0 0 3 4v5.5A1.5 1.5 0 0 0 4.5 11H5"/></svg>',
    file: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"><path d="M4 2.5h5l3 3v8H4z"/><path d="M9 2.5v3h3"/></svg>',
    down: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2.5v8M4.5 7L8 10.5 11.5 7M3 13.5h10"/></svg>',
    up: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 10.5v-8M4.5 6L8 2.5 11.5 6M3 13.5h10"/></svg>',
    reset: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 8A5.5 5.5 0 1 0 4.2 4"/><path d="M3.8 1.5V4.3h2.8"/></svg>',
    info: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><circle cx="8" cy="8" r="6"/><path d="M8 7.2v4M8 4.9v.1"/></svg>',
    gear: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="8" cy="8" r="2.2"/><path d="M8 1.8v1.6M8 12.6v1.6M1.8 8h1.6M12.6 8h1.6M3.6 3.6l1.1 1.1M11.3 11.3l1.1 1.1M3.6 12.4l1.1-1.1M11.3 4.7l1.1-1.1" stroke-linecap="round"/></svg>',
    theme: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="8" cy="8" r="5.5"/><path d="M8 2.5a5.5 5.5 0 0 1 0 11z" fill="currentColor"/></svg>',
    play: '<path d="M4.5 2.6v10.8c0 .5.6.8 1 .5l8-5.4a.6.6 0 0 0 0-1l-8-5.4c-.4-.3-1 0-1 .5z"/>',
    pause: '<rect x="3.5" y="2.5" width="3.2" height="11" rx="1"/><rect x="9.3" y="2.5" width="3.2" height="11" rx="1"/>',
  };

  const demo = (!REAL && window.MEC_DEMO) || { presets: [], queue: [], settings: {} };
  const S = {
    presets: demo.presets,
    queue: demo.queue.map((q) => Object.assign(q, { cfg: clone(demo.presets.find((p) => p.id === q.preset)) })),
    set: Object.assign({ lang: 'en', theme: 'oled', lastDark: 'oled', defaultPreset: demo.presets[0] && demo.presets[0].id,
      clearWhenDone: true, notify: true, sound: true, foldPresets: false, parallel: 2 }, demo.settings),
    sel: REAL ? null : 2, picked: new Set(REAL ? [] : [2]), anchor: null, editPreset: null, cmp: false, job: null, playing: false, t: REAL ? 0 : .31,
    open: { video: true }, engine: { status: REAL ? 'checking' : 'nvenc', gpu: REAL ? null : 'NVIDIA GeForce RTX' },
    version: '0.1.0', update: null,
  };
  const presetOf = (id) => S.presets.find((p) => p.id === id);
  const itemOf = (id) => S.queue.find((q) => q.id === id);
  const selItem = () => itemOf(S.sel);
  // seleção múltipla: S.sel é o vídeo da prévia; S.picked tem todos os selecionados (inclui S.sel)
  const isPicked = (id) => S.picked.has(id);
  const pickedItems = () => S.queue.filter((q) => S.picked.has(q.id));
  function selectOnly(id) { S.sel = id; S.picked = new Set(id == null ? [] : [id]); S.anchor = id; }
  let L = window.MEC_I18N.en;

  /* ---------- salvar (no app: %APPDATA%; no navegador: só tema/idioma) ---------- */
  const store = { get(k) { try { return localStorage.getItem(k); } catch { return null; } },
                  set(k, v) { try { localStorage.setItem(k, v); } catch {} } };
  let tSettings, tPresets;
  function saveSettings() {
    if (!REAL) { ['lang', 'theme', 'lastDark'].forEach((k) => store.set('mec.' + k, S.set[k])); store.set('mec.foldPresets', S.set.foldPresets ? '1' : '0'); return; }
    clearTimeout(tSettings); tSettings = setTimeout(() => inv('save_settings', { settings: S.set }).catch(() => {}), 300);
  }
  function savePresets() {
    if (!REAL) return;
    clearTimeout(tPresets); tPresets = setTimeout(() => inv('save_presets', { presets: S.presets }).catch((e) => toast(String(e))), 400);
  }
  if (!REAL) {
    ['lang', 'theme', 'lastDark'].forEach((k) => { const v = qs.get(k) || store.get('mec.' + k); if (v) S.set[k] = v; });
    if (store.get('mec.foldPresets') === '1') S.set.foldPresets = true;
  }
  root.dataset.variant = '2';

  /* ---------- tema: sistema, claro, escuro, OLED ---------- */
  const mq = matchMedia('(prefers-color-scheme: dark)');
  function applyTheme(anim) {
    if (anim) { root.classList.add('theming'); setTimeout(() => root.classList.remove('theming'), 600); }
    root.dataset.theme = S.set.theme === 'system' ? (mq.matches ? S.set.lastDark : 'light') : S.set.theme;
    requestAnimationFrame(drawWave);
  }
  mq.addEventListener('change', () => S.set.theme === 'system' && applyTheme(true));
  function setTheme(t) {
    S.set.theme = t; if (t === 'dark' || t === 'oled') S.set.lastDark = t;
    saveSettings(); applyTheme(true);
  }
  $('#bAppMenu').dataset.menu = '1';
  const REPO_URL = 'https://github.com/hugomec7/Mec-Encoder';
  function themeMenu(at) {
    openMenu(at, [['system', L.system], ['light', L.light], ['dark', L.dark], ['oled', L.oled]]
      .map(([v, t]) => ({ label: t, value: v, sel: S.set.theme === v, icon: ICONS.theme })), (v) => setTheme(v));
  }
  $('#bAppMenu').onclick = (e) => {
    const btn = e.currentTarget;
    openMenu(btn, [
      { label: L.settings + '…', value: 'settings', icon: ICONS.gear },
      { label: L.theme, value: 'theme', icon: ICONS.theme },
      { label: L.checkUpdates, value: 'update', icon: ICONS.down },
      { sep: true },
      { label: `${L.version} ${S.version}`, value: 'about', icon: ICONS.info },
    ], (v) => {
      if (v === 'settings') openSheet(true);
      else if (v === 'theme') setTimeout(() => themeMenu(btn), 0);
      else if (v === 'update') checkUpdate(true);
      else if (v === 'about') { if (REAL) inv('open_url', { url: REPO_URL }).catch(() => {}); else window.open(REPO_URL, '_blank'); }
    });
  };
  /* ---------- idioma ---------- */
  function applyLang() {
    L = window.MEC_I18N[S.set.lang] || window.MEC_I18N.en;
    root.lang = S.set.lang === 'pt' ? 'pt-BR' : 'en';
    const txt = { lQueue: L.queue, bClearDone: L.clearDone, lDropTitle: L.dropTitle, lDropSub: L.dropSub,
      lCompare: L.compare, lPresets: L.presets, bManage: L.manage, lModified: L.modified,
      bSavePreset: L.saveToPreset, lEst: L.estSize, bDiscard: L.discard, lSettings: L.settings, bDone: L.done, lDropAll: L.dropAll, lPvEmpty: L.pvEmpty };
    Object.entries(txt).forEach(([id, t]) => { const el = document.getElementById(id); if (el) el.textContent = t; });
    $('#bMin').title = L.minimize; $('#bMax').title = L.maximize; $('#bClose').title = L.close;
    $('#bSetAll').title = L.setAll; $('#bFoldPresets').title = L.presetsFold; $('#bAdd').title = L.addVideos;
    renderRenderBtn(); renderUpdateBtn();
  }

  /* ---------- mídia ---------- */
  const secs = (tc) => { const [h, m, s, f] = tc.split(':').map(Number); return h * 3600 + m * 60 + s + f / 60; };
  const num = (n, d = 1) => Number(n || 0).toLocaleString(S.set.lang === 'pt' ? 'pt-BR' : 'en-US', { maximumFractionDigits: d });
  const fmtMB = (mb) => mb >= 1000 ? num(mb / 1000, 2) + ' GB' : Math.round(mb) + ' MB';
  const fmtK = (k) => num(k / 1000) + ' Mb/s';
  const fpsTxt = (v) => S.set.lang === 'pt' ? String(v).replace('.', ',') : String(v).replace(',', '.');
  const pad = (n) => String(n).padStart(2, '0');
  function tc(seconds, fps = 60) {
    const s = Math.max(0, seconds); const ss = Math.floor(s); const f = Math.floor((s - ss) * Math.round(fps || 60));
    return [Math.floor(ss / 3600), Math.floor(ss / 60) % 60, ss % 60, f].map(pad).join(':');
  }
  const CODECS = { hevc: 'HEVC', h264: 'H.264', prores: 'ProRes', av1: 'AV1', vp9: 'VP9', mpeg2video: 'MPEG-2', dnxhd: 'DNxHD', mjpeg: 'MJPEG' };
  // MediaInfo do Rust → formato usado pela interface
  function mapSrc(info) {
    const v = info.video || {};
    return {
      w: v.width, h: v.height, codec: CODECS[v.codec] || String(v.codec || '?').toUpperCase(), bits: v.bitDepth || 8,
      fps: (v.fps || v.fpsNominal || 0).toFixed(2).replace(/\.?0+$/, ''), fpsNum: v.fps || v.fpsNominal || 60, vfr: !!v.vfr,
      dur: tc(info.duration, v.fpsNominal || v.fps), durS: info.duration, kbps: v.bitrateKbps || info.bitrateKbps || 0,
      audio: (info.audio || []).length, hdr: v.hdr || false, rot: v.rotation || 0, mb: (info.sizeBytes || 0) / 1e6,
    };
  }
  const durOf = (q) => q.src.durS || secs(q.src.dur);
  function outDims(src, cfg) {
    let { w, h } = src;
    if ((cfg.rotate || 0) % 180 === 90) [w, h] = [h, w];
    if (cfg.scale === '50') { w /= 2; h /= 2; } else if (cfg.scale === '25') { w /= 4; h /= 4; }
    else if (cfg.scale === '1080') { const s = Math.min(w, h); if (s > 1080) { const k = 1080 / s; w *= k; h *= k; } }
    else if (cfg.scale === 'custom') {
      const cw = +cfg.customW || 0, ch = +cfg.customH || 0;
      if (cw && ch) { w = cw; h = ch; } else if (cw) { h = cw * h / w; w = cw; } else if (ch) { w = ch * w / h; h = ch; }
    }
    return { w: Math.max(2, Math.round(w / 2) * 2), h: Math.max(2, Math.round(h / 2) * 2) };
  }
  function videoKbps(src, cfg) {
    if (cfg.bitrate.mode === 'manual') return cfg.bitrate.kbps;
    if (cfg.bitrate.mode === 'source') return src.kbps || 20000;
    const o = outDims(src, cfg); return Math.round(o.w * o.h * 60 * 0.07 / 1000 / 100) * 100;
  }
  const estMB = (q) => (videoKbps(q.src, q.cfg) + (q.cfg.audio.codec === 'copy' ? 256 : q.cfg.audio.kbps)) * durOf(q) / 8 / 1000;
  const warnings = (q) => (q.src.hdr && !q.cfg.hdrToSdr ? [L.hdrMismatch(q.src.hdr)] : []);
  const codecName = (c) => (c === 'h265' ? 'H.265' : 'H.264');
  const scaleTxt = (s) => (s === 'source' ? L.source : s === '1080' ? '1080p' : s === 'custom' ? L.custom : s + '%');
  const pending = () => S.queue.filter((q) => q.status !== 'done');

  /* ---------- cena de exemplo (só no modo demonstração) ---------- */
  function scene(hue, vertical) {
    const W = vertical ? 90 : 160, H = vertical ? 160 : 90, g = 'g' + hue + (vertical ? 'v' : 'h');
    const bl = []; let x = -4; let i = 0;
    while (x < W) { const bw = W * (.07 + ((i * 37) % 9) / 100); const bh = H * (.10 + ((i * 53) % 19) / 100);
      bl.push(`<rect x="${x}" y="${H * .74 - bh}" width="${bw}" height="${bh + 2}" rx="1"/>`); x += bw + 1.5; i++; }
    return `<svg class="scene" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">
      <defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="hsl(${hue + 200},55%,30%)"/><stop offset=".55" stop-color="hsl(${hue},75%,62%)"/><stop offset="1" stop-color="hsl(${hue + 20},80%,72%)"/></linearGradient>
        <radialGradient id="${g}s"><stop offset="0" stop-color="#fff8e6"/><stop offset=".35" stop-color="hsl(${hue + 25},95%,75%)" stop-opacity=".9"/><stop offset="1" stop-color="hsl(${hue + 25},95%,70%)" stop-opacity="0"/></radialGradient></defs>
      <rect width="${W}" height="${H}" fill="url(#${g})"/>
      <circle cx="${W * .62}" cy="${H * .56}" r="${W * .32}" fill="url(#${g}s)"/>
      <g fill="hsl(${hue + 210},35%,14%)" opacity=".92">${bl.join('')}</g>
      <rect y="${H * .74}" width="${W}" height="${H * .26}" fill="hsl(${hue + 210},25%,10%)"/>
      <rect y="${H * .74}" width="${W}" height=".6" fill="hsl(${hue + 20},90%,75%)" opacity=".5"/>
    </svg>`;
  }
  const thumbHtml = (q) => q.thumb ? `<img src="${q.thumb}" alt="">` : REAL ? '<i class="thumb-ph"></i>' : scene(q.hue, q.src.h > q.src.w);

  /* ---------- scroll suave com efeito elástico nas pontas ---------- */
  function smooth(el) {
    const inner = el.firstElementChild; let target = el.scrollTop; let cur = target; let raf = 0; let last = 0; let idle;
    const max = () => Math.max(0, el.scrollHeight - el.clientHeight);
    const rubber = (o) => Math.sign(o) * 70 * (1 - Math.exp(-Math.abs(o) / 110));
    const step = (now) => {
      const dt = Math.min(48, now - (last || now)); last = now;
      const k = 1 - Math.pow(1 - 0.16, dt / 16.7);
      cur += (target - cur) * k;
      const m = max(); el.scrollTop = clamp(cur, 0, m);
      const ov = cur < 0 ? cur : cur > m ? cur - m : 0;
      inner.style.transform = Math.abs(ov) > .3 ? `translateY(${-rubber(ov)}px)` : '';
      if (Math.abs(target - cur) > .3) raf = requestAnimationFrame(step); else { cur = target; inner.style.transform = ''; raf = 0; last = 0; }
    };
    el.addEventListener('wheel', (e) => {
      if (e.ctrlKey || (e.deltaX && Math.abs(e.deltaX) > Math.abs(e.deltaY))) return;
      e.preventDefault();
      const d = e.deltaMode === 1 ? e.deltaY * 36 : e.deltaMode === 2 ? e.deltaY * el.clientHeight : e.deltaY;
      if (!raf) cur = target = el.scrollTop;
      target = clamp(target + d, -120, max() + 120);
      clearTimeout(idle); idle = setTimeout(() => { target = clamp(target, 0, max()); if (!raf) raf = requestAnimationFrame(step); }, 110);
      if (!raf) raf = requestAnimationFrame(step);
    }, { passive: false });
    el.addEventListener('scroll', () => { if (!raf) cur = target = el.scrollTop; });
    el.smoothTo = (y) => { target = clamp(y, 0, max()); if (!raf) { cur = el.scrollTop; raf = requestAnimationFrame(step); } };
  }
  $$('.smooth').forEach(smooth);

  /* ---------- menu suspenso / de contexto ---------- */
  const menu = $('#menu'); let menuPick = null;
  function openMenu(at, items, onPick) {
    menu.innerHTML = items.map((it, i) => it.sep ? '<hr>' : `<button data-i="${i}" class="${it.sel ? 'sel' : ''} ${it.danger ? 'danger' : ''}">${it.color ? `<i style="--c:${it.color}"></i>` : it.icon ? it.icon : ''}<span>${esc(it.label)}</span>${it.sel ? ICONS.check : ''}</button>`).join('');
    const r = at instanceof Element ? at.getBoundingClientRect() : { left: at.x, right: at.x, top: at.y, bottom: at.y };
    const h = items.reduce((a, it) => a + (it.sep ? 9 : 32), 12);
    const up = r.bottom + 6 + h > innerHeight;
    menu.style.left = clamp(r.left, 8, innerWidth - 310) + 'px';
    menu.style.top = (up ? Math.max(8, r.top - 6 - h) : r.bottom + (at instanceof Element ? 6 : 2)) + 'px';
    menu.style.transformOrigin = up ? 'bottom left' : 'top left';
    menuPick = (i) => onPick(items[i].value);
    menu.classList.remove('show'); void menu.offsetWidth; menu.classList.add('show');
  }
  const closeMenu = () => menu.classList.remove('show');
  menu.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { closeMenu(); menuPick && menuPick(+b.dataset.i); } });
  document.addEventListener('pointerdown', (e) => { if (!e.target.closest('#menu') && !e.target.closest('[data-menu]')) closeMenu(); });
  document.addEventListener('contextmenu', (e) => { if (!e.target.closest('input')) e.preventDefault(); });
  const presetItems = (cur) => S.presets.map((p) => ({ label: p.name, value: p.id, color: COLORS[p.color] || COLORS.blue, sel: p.id === cur }));

  /* ---------- fila ---------- */
  const qList = $('#qList');
  const runTxt = (q) => Math.round((q.p || 0) * 100) + '%' + (q.speed > 0 ? ` · ${num(q.speed, 1)}×` : '');
  // tempo: 75 → "1:15", 3725 → "1:02:05"
  const fmtDur = (t) => { t = Math.max(0, Math.round(t)); const h = Math.floor(t / 3600); const m = Math.floor(t / 60) % 60; const x = String(t % 60).padStart(2, '0');
    return h ? `${h}:${String(m).padStart(2, '0')}:${x}` : `${m}:${x}`; };
  const elapsedOf = (q) => (q.t0 ? (Date.now() - q.t0) / 1000 : 0);
  // quanto falta neste vídeo: velocidade do FFmpeg ou, sem ela, pelo andamento
  const etaOf = (q) => (q.eta != null ? q.eta : q.p > 0.02 ? elapsedOf(q) * (1 - q.p) / q.p : null);
  const timeLine = (q) => `<span class="timing">${ICONS.clock}${fmtDur(elapsedOf(q))}${etaOf(q) != null ? ` · ${L.left(fmtDur(etaOf(q)))}` : ''}</span>`;
  // quanto falta na fila: o que está rodando + o resto, pelo ritmo medido (segundos de render por segundo de vídeo)
  function queueEta() {
    const J = S.job; if (!J) return null;
    const meas = S.queue.filter((q) => q.jobId === J.id && (q.status === 'done' || (q.status === 'running' && q.p > 0.05)));
    const work = meas.reduce((a, q) => a + (q.status === 'done' ? q.took : elapsedOf(q)), 0);
    const media = meas.reduce((a, q) => a + durOf(q) * (q.status === 'done' ? 1 : q.p), 0);
    if (!media) return null;
    const rate = work / media;
    const running = S.queue.filter((q) => q.status === 'running');
    const waiting = J.mode === 'queue' ? S.queue.filter((q) => q.status === 'ready') : (J.list || []).map(itemOf).filter((q) => q && q.status === 'ready');
    const n = Math.max(1, Math.min(J.parallel || 1, running.length + waiting.length));
    return (running.reduce((a, q) => a + (etaOf(q) || 0), 0) + waiting.reduce((a, q) => a + durOf(q) * rate, 0)) / n;
  }
  function renderFoot() {
    const J = S.job; const el = $('#tTotal');
    if (J) { const e = queueEta(); el.innerHTML = L.jobTime(fmtDur((Date.now() - J.t0) / 1000), e != null ? fmtDur(e) : null); return; }
    const pend = pending();
    el.innerHTML = pend.length ? L.toRender(pend.length, fmtMB(pend.reduce((a, q) => a + estMB(q), 0)))
      : S.lastRun ? L.lastRun(fmtDur(S.lastRun.took), S.lastRun.n) : '';
  }
  // atualiza os relógios uma vez por segundo sem redesenhar a fila
  setInterval(() => {
    if (!S.job) return;
    S.queue.forEach((q) => { if (q.status !== 'running') return; const t = $(`.item[data-id="${q.id}"] .timing`); if (t) t.outerHTML = timeLine(q); });
    renderFoot();
  }, 1000);
  function itemHtml(q, enterIds) {
    const p = presetOf(q.preset) || S.presets[0]; const c = COLORS[p.color] || COLORS.blue; const w = warnings(q);
    const st = q.status === 'done' ? `<span class="state done">${ICONS.check}${L.ready}${q.took ? ` · ${fmtDur(q.took)}` : ''}</span>`
      : q.status === 'running' ? `<span class="state tnum">${runTxt(q)}</span>`
      : q.status === 'err' ? `<span class="state err" title="${esc(q.error || '')}">${L.error}</span>`
      : q.queued ? `<span class="state">${L.busy}</span>`
      : `<span class="state tnum">${fmtMB(estMB(q))}</span>`;
    const dir = q.dir ? `<span class="dir">${ICONS.folder}${esc(q.dir.replace(/\//g, ' › '))}</span>` : '';
    const acts = (q.status === 'ready' || q.status === 'err' ? `<button class="a a-render" data-act="render" title="${L.renderThis}">${ICONS.playc}</button>` : '')
      + `<button class="a" data-act="reveal" title="${q.status === 'done' ? L.showOutput : L.showInFolder}">${ICONS.reveal}</button>`
      + (q.status !== 'running' ? `<button class="a" data-act="remove" title="${L.remove}">${ICONS.x}</button>` : '');
    return `<div class="item ${isPicked(q.id) ? 'sel' : ''} ${q.id === S.sel && S.picked.size > 1 ? 'primary' : ''} ${q.status === 'running' ? 'running' : ''} ${q.status === 'done' ? 'is-done' : ''} ${enterIds.includes(q.id) ? 'enter' : ''}" data-id="${q.id}" style="--d:${Math.min(8, Math.max(0, enterIds.indexOf(q.id))) * 60}ms">
        <div class="thumb">${thumbHtml(q)}${q.src.hdr ? '<span class="hdr">HDR</span>' : ''}</div>
        <div class="meta">
          <div class="name" title="${esc(q.path || q.file)}">${esc(q.file)}</div>
          <div class="spec">${q.status === 'running' ? timeLine(q) : `${dir}${q.src.w}×${q.src.h} · ${q.src.codec} · ${fpsTxt(q.src.fps)} fps${q.src.vfr ? ' VFR' : ''}`}</div>
          <div class="row2"><span class="badge" style="--c:${c}"><i></i>${esc(p.name)}${same(q.cfg, p) ? '' : '*'}</span>
            ${w.length ? `<span class="warn" title="${esc(w.join('\n'))}">${ICONS.warn}</span>` : ''}${st}</div>
        </div>
        <div class="acts">${acts}</div>
        <div class="prog" style="--p:${q.p || 0}"><i></i></div>
      </div>`;
  }
  function renderQueue(enterIds = []) {
    $('#queueCard').classList.toggle('empty', !S.queue.length);
    qList.innerHTML = S.queue.map((q) => itemHtml(q, enterIds)).join('');
    $('#qCount').textContent = S.queue.length ? L.videos(S.queue.length) : '';
    $('#bClearDone').style.visibility = S.queue.some((q) => q.status === 'done') ? '' : 'hidden';
    const pend = pending();
    renderFoot();
    $('#tEta').textContent = S.engine.status === 'nvenc' ? 'NVENC' : S.engine.status === 'cpu' ? 'CPU' : '';
    $('#bRender').disabled = !S.queue.some((q) => q.status === 'ready' || q.status === 'err') && !S.job;
  }
  function patchItem(q) {
    const el = $(`.item[data-id="${q.id}"]`);
    if (el) { const t = document.createElement('div'); t.innerHTML = itemHtml(q, []); el.replaceWith(t.firstElementChild); }
  }

  function removeItem(id) {
    const q = itemOf(id); if (!q || q.status === 'running') return;
    const el = $(`.item[data-id="${id}"]`);
    if (el) { el.style.transition = 'opacity .25s, transform .35s var(--ease)'; el.style.opacity = 0; el.style.transform = 'translateX(-14px) scale(.96)'; }
    if (REAL) inv('forget', { id }).catch(() => {});
    setTimeout(() => {
      const before = rects();
      S.queue = S.queue.filter((x) => x.id !== id); S.picked.delete(id);
      if (S.sel === id) S.sel = S.picked.size ? [...S.picked][0] : null;
      renderAll(); flip(before);
    }, 230);
  }
  function itemAction(act, id) {
    const q = itemOf(id); if (!q) return;
    if (act === 'render') { if (q.status === 'err') { q.status = 'ready'; q.error = null; } renderOne(id); }
    else if (act === 'reveal') reveal(q);
    else if (act === 'remove') removeItem(id);
    else if (act === 'top') { const before = rects(); S.queue = [q, ...S.queue.filter((x) => x !== q)]; renderQueue(); flip(before); }
  }
  function reveal(q) {
    if (REAL) inv('reveal', { path: q.status === 'done' && q.out ? q.out : q.path }).catch((e) => toast(String(e)));
    else toast(L.revealToast);
  }

  qList.addEventListener('click', (e) => {
    if (drag.justDropped) { drag.justDropped = false; return; }
    const it = e.target.closest('.item');
    if (!it) { if (S.sel !== null || S.picked.size) { selectOnly(null); renderAll(true); } return; }
    const id = +it.dataset.id; const a = e.target.closest('[data-act]');
    if (a) { itemAction(a.dataset.act, id); return; }
    if (e.ctrlKey || e.metaKey) {
      // Ctrl: liga/desliga este vídeo na seleção
      if (isPicked(id) && S.picked.size > 1) { S.picked.delete(id); if (S.sel === id) S.sel = [...S.picked][0]; }
      else { S.picked.add(id); S.sel = id; S.t = 0.15; }
      S.anchor = id; renderAll(true); return;
    }
    if (e.shiftKey && S.anchor != null && itemOf(S.anchor)) {
      // Shift: seleciona o intervalo
      const ids = S.queue.map((q) => q.id); const i0 = ids.indexOf(S.anchor); const i1 = ids.indexOf(id);
      S.picked = new Set(ids.slice(Math.min(i0, i1), Math.max(i0, i1) + 1)); S.sel = id; S.t = 0.15; renderAll(true); return;
    }
    if (S.sel !== id || S.picked.size > 1) { selectOnly(id); S.t = 0.15; renderAll(true); }
  });
  qList.addEventListener('contextmenu', (e) => {
    const it = e.target.closest('.item'); if (!it) return;
    const q = itemOf(+it.dataset.id);
    if (isPicked(q.id) && S.picked.size > 1) {
      const list = pickedItems(); const n = list.length;
      openMenu({ x: e.clientX, y: e.clientY }, [
        { label: L.renderN(n), value: 'render', icon: ICONS.playc },
        { label: L.presetForN(n), value: 'preset', icon: ICONS.layers || ICONS.playc },
        { sep: true },
        { label: L.removeN(n), value: 'remove', icon: ICONS.trash, danger: true },
      ], (act) => {
        if (act === 'render') list.forEach((x) => { if (x.status === 'err') { x.status = 'ready'; x.error = null; } renderOne(x.id, true); });
        if (act === 'remove') list.forEach((x) => removeItem(x.id));
        if (act === 'preset') openMenu({ x: e.clientX, y: e.clientY }, presetItems(null), (pid) => assignPicked(pid));
      });
      return;
    }
    openMenu({ x: e.clientX, y: e.clientY }, [
      ...(q.status === 'ready' || q.status === 'err' ? [{ label: L.renderThis, value: 'render', icon: ICONS.playc }] : []),
      { label: q.status === 'done' ? L.showOutput : L.showInFolder, value: 'reveal', icon: ICONS.reveal },
      { label: L.moveTop, value: 'top', icon: ICONS.top },
      { sep: true },
      ...(q.status !== 'running' ? [{ label: L.remove, value: 'remove', icon: ICONS.trash, danger: true }] : []),
    ], (act) => itemAction(act, q.id));
  });

  /* FLIP: anima os itens da posição antiga até a nova */
  function rects() { const m = {}; $$('.item', qList).forEach((el) => { m[el.dataset.id] = el.getBoundingClientRect().top; }); return m; }
  function flip(before) {
    $$('.item', qList).forEach((el) => {
      const old = before[el.dataset.id]; if (old === undefined) return;
      const dy = old - el.getBoundingClientRect().top; if (Math.abs(dy) < 1) return;
      el.style.transition = 'none'; el.style.transform = `translateY(${dy}px)`;
      requestAnimationFrame(() => { el.style.transition = 'transform .5s var(--spring)'; el.style.transform = '';
        el.addEventListener('transitionend', () => { el.style.transition = ''; }, { once: true }); });
    });
  }

  /* reordenar arrastando */
  const drag = { justDropped: false };
  qList.addEventListener('pointerdown', (e) => {
    const it = e.target.closest('.item'); if (!it || e.button !== 0 || e.target.closest('button')) return;
    Object.assign(drag, { el: it, id: +it.dataset.id, y0: e.clientY, on: false });
  });
  addEventListener('pointermove', (e) => {
    if (!drag.el) return;
    const dy = e.clientY - drag.y0;
    if (!drag.on) {
      if (Math.abs(dy) < 5) return;
      drag.on = true; drag.items = $$('.item', qList); drag.from = drag.items.indexOf(drag.el);
      drag.boxes = drag.items.map((el) => el.getBoundingClientRect());
      drag.step = drag.boxes.length > 1 ? drag.boxes[1].top - drag.boxes[0].top : drag.boxes[0].height;
      drag.el.classList.add('lifting'); qList.classList.add('sorting'); closeMenu();
    }
    const b = drag.boxes[drag.from]; const mid = b.top + dy + b.height / 2;
    let to = drag.from;
    drag.boxes.forEach((r, i) => { const m = r.top + r.height / 2; if (i < drag.from && mid < m) to = Math.min(to, i); if (i > drag.from && mid > m) to = Math.max(to, i); });
    drag.to = to;
    drag.items.forEach((el, i) => {
      if (el === drag.el) return;
      const shift = drag.from < to && i > drag.from && i <= to ? -drag.step : drag.from > to && i >= to && i < drag.from ? drag.step : 0;
      el.style.transform = shift ? `translateY(${shift}px)` : '';
    });
    drag.el.style.transform = `translateY(${dy}px) scale(1.02)`;
  });
  addEventListener('pointerup', () => {
    if (!drag.el) return;
    if (drag.on) {
      const before = rects();
      const moved = S.queue.splice(drag.from, 1)[0]; S.queue.splice(drag.to ?? drag.from, 0, moved);
      qList.classList.remove('sorting'); drag.el.classList.remove('lifting');
      renderQueue(); flip(before); drag.justDropped = true; setTimeout(() => { drag.justDropped = false; }, 0);
    }
    drag.el = null; drag.on = false;
  });

  $('#bClearDone').onclick = () => clearDone(true);
  function clearDone(withToast) {
    const done = S.queue.filter((q) => q.status === 'done'); if (!done.length) return;
    done.forEach((q) => { const el = $(`.item[data-id="${q.id}"]`); if (el) { el.style.transition = 'opacity .25s, transform .35s var(--ease)'; el.style.opacity = 0; el.style.transform = 'scale(.96)'; } });
    if (REAL) done.forEach((q) => inv('forget', { id: q.id }).catch(() => {}));
    setTimeout(() => { const before = rects(); S.queue = S.queue.filter((q) => q.status !== 'done'); S.picked = new Set([...S.picked].filter((id) => itemOf(id))); if (!selItem()) S.sel = S.picked.size ? [...S.picked][0] : null; renderAll(); flip(before); if (withToast) toast(L.cleared); }, 230);
  }

  /* adicionar vídeos */
  function addMenu(at) {
    openMenu(at, [{ label: L.addVideos, value: 'files', icon: ICONS.file }, { label: L.addFolder, value: 'folder', icon: ICONS.folder }],
      (v) => (REAL ? inv('pick', { folder: v === 'folder' }).catch((e) => toast(String(e))) : addFolder()));
  }
  // Demo: simula arrastar uma pasta. No app, o Rust percorre a pasta e as subpastas atrás de vídeos.
  function addFolder() {
    const pid = S.set.defaultPreset; const base = Math.max(0, ...S.queue.map((q) => q.id)) + 1;
    const mk = (i, dir, file, rot, hdr) => ({ id: base + i, dir, file, preset: pid, cfg: clone(presetOf(pid)), status: 'ready', hue: ((base + i) * 47) % 360,
      src: { w: 2160, h: 3840, codec: 'HEVC', bits: 10, fps: '59,93', vfr: true, dur: '00:01:08:20', kbps: 48200, audio: 2, hdr, rot, mb: 410 } });
    const add = [mk(0, 'Day 3', 'IMG_4901.MOV', 0, false), mk(1, 'Day 3', 'IMG_4902.MOV', 0, false), mk(2, 'Day 3/Cam B', 'IMG_4911.MOV', 90, 'HLG')];
    S.queue.push(...add); selectOnly(add[0].id); renderAll(true, add.map((a) => a.id));
    setTimeout(() => $('#queue').smoothTo(1e6), 60);
    toast(L.folderAdded('Day 3', add.length));
  }
  $('#drop').addEventListener('click', (e) => { if (true) addMenu(e.currentTarget.querySelector('svg') || e.currentTarget); });
  $('#bAdd').dataset.menu = '1';
  $('#bAdd').onclick = (e) => addMenu(e.currentTarget);
  $('#bSetAll').onclick = (e) => openMenu(e.currentTarget, presetItems(null), (v) => assignAll(v));

  function assign(q, pid) { q.preset = pid; q.cfg = clone(presetOf(pid)); }
  function assignPicked(pid) {
    const list = pickedItems().filter((q) => q.status !== 'running'); list.forEach((q) => assign(q, pid)); renderAll();
    list.forEach((q) => { const b = $(`.item[data-id="${q.id}"] .badge`); if (b) b.classList.add('bump'); });
    toast(L.assigned(presetOf(pid).name, list.length));
  }
  function assignAll(pid) {
    const list = pending(); list.forEach((q) => assign(q, pid)); renderAll();
    $$('.item:not(.is-done) .badge').forEach((b) => b.classList.add('bump'));
    toast(L.assigned(presetOf(pid).name, list.length));
  }

  /* ---------- presets ---------- */
  function describe(p) {
    const parts = [codecName(p.codec) + ' ' + (p.codec === 'h264' ? 8 : p.bits) + '-bit', p.scale === 'source' ? L.sourceRes : scaleTxt(p.scale),
      p.bitrate.mode === 'manual' ? fmtK(p.bitrate.kbps) + ' ' + p.bitrate.rc.toUpperCase() : p.bitrate.mode === 'source' ? L.bitrateSrc : L.bitrateAuto,
      p.fps.conform ? fpsTxt(p.fps.value) + ' fps CFR' : null, p.hdrToSdr ? 'HDR → 709' : null,
      p.audio.codec === 'copy' ? L.audioCopied : `AAC ${p.audio.channels === 'stereo' ? L.stereoL : L.monoL}`].filter(Boolean);
    return `<b>${esc(p.name)}:</b> ${parts.join(' · ')}`;
  }
  /* lista de presets: soltos + pastas (recolhíveis), só cor, sem ícone */
  function folderList() {
    const f = (S.set.folders || []).slice();
    S.presets.forEach((p) => { if (p.folder && !f.includes(p.folder)) f.push(p.folder); });
    return f;
  }
  const pill = (p, selId) => `<button class="preset ${selId === p.id ? 'sel' : ''}" data-id="${p.id}" style="--c:${COLORS[p.color] || COLORS.blue}"><i class="pdot"></i>${esc(p.name)}</button>`;
  function renderPresets() {
    const t = target(); const selId = t.preset && t.preset.id; const closed = S.set.folderClosed || {};
    const loose = S.presets.filter((p) => !p.folder);
    let html = `<div class="p-row" data-folder="">${loose.map((p) => pill(p, selId)).join('')}<button class="preset add" data-menu="1"><span class="ic">${ICONS.plus}</span>${L.newPreset}</button></div>`;
    folderList().forEach((f) => {
      const list = S.presets.filter((p) => p.folder === f);
      html += `<div class="pfolder ${closed[f] ? 'closed' : ''}" data-folder="${esc(f)}">
        <button class="pf-head" data-folder="${esc(f)}">${ICONS.chev}${ICONS.folder}<span class="pf-name">${esc(f)}</span><small>${list.length}</small></button>
        <div class="pf-body"><div class="pf-in"><div class="p-row" data-folder="${esc(f)}">${list.map((p) => pill(p, selId)).join('') || `<span class="pf-empty">${L.folderEmpty}</span>`}</div></div></div></div>`;
    });
    $('#presets').innerHTML = html;
    $('#presetDesc').innerHTML = t.preset ? describe(t.preset) : '';
    $('#presetsFold').classList.toggle('closed', !!S.set.foldPresets);
    $('#bFoldPresets').classList.toggle('closed', !!S.set.foldPresets);
  }
  $('#bFoldPresets').onclick = () => { S.set.foldPresets = !S.set.foldPresets; saveSettings(); renderPresets(); };

  function uid() { return 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function addPresets(list, select) {
    list.forEach((p, i) => { p.id = presetOf(p.id) ? uid() : (p.id || uid()); if (!COLORS[p.color]) p.color = PALETTE[(S.presets.length + i) % PALETTE.length]; S.presets.push(p); });
    savePresets();
    if (select && list[0]) editPreset(list[0].id); else renderAll();
  }
  function editPreset(pid, focusName) {
    selectOnly(null); S.editPreset = pid; S.draft = null; renderAll(true);
    if (focusName) setTimeout(() => renamePreset(pid), 80);
  }
  // Renomear direto na pílula do preset
  function renamePreset(pid) {
    const p = presetOf(pid); const b = $(`.preset[data-id="${CSS.escape(pid)}"]`); if (!p || !b) return;
    const input = document.createElement('input'); input.className = 'preset-input'; input.value = p.name; input.spellcheck = false;
    input.style.setProperty('--c', COLORS[p.color] || COLORS.blue);
    b.replaceWith(input); input.focus(); input.select();
    let done = false;
    const finish = (ok) => {
      if (done) return; done = true;
      const v = input.value.trim();
      if (ok && v && v !== p.name) { p.name = v; if (S.draft && S.draft.id === pid) S.draft.name = v; S.queue.forEach((q) => { if (q.preset === pid) q.cfg.name = v; }); savePresets(); }
      renderAll();
    };
    input.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') finish(true); if (e.key === 'Escape') finish(false); });
    input.addEventListener('blur', () => finish(true));
    input.addEventListener('click', (e) => e.stopPropagation());
    input.addEventListener('pointerdown', (e) => e.stopPropagation());
  }
  function newPreset(folder) {
    const base = clone(target().preset || S.presets[0]);
    Object.assign(base, { id: uid(), name: L.newPresetName, color: PALETTE[S.presets.length % PALETTE.length], folder: folder || '' });
    addPresets([base], false); editPreset(base.id, true);
  }
  function deletePreset(pid) {
    if (S.presets.length <= 1) { toast(L.cantDeleteLast); return; }
    const p = presetOf(pid); S.presets = S.presets.filter((x) => x.id !== pid);
    const fallback = S.presets[0].id;
    S.queue.forEach((q) => { if (q.preset === pid) q.preset = fallback; });
    if (S.set.defaultPreset === pid) { S.set.defaultPreset = fallback; saveSettings(); }
    if (S.editPreset === pid) { S.editPreset = null; S.draft = null; }
    savePresets(); renderAll(); toast(L.presetDeleted(p.name));
  }
  function importEnc() { if (!REAL) { toast(L.soon); return; } inv('import_enc').then((l) => { if (l.length) { addPresets(l, true); toast(L.presetsImported(l.length)); } }).catch((e) => toast(String(e))); }
  function importJson() { if (!REAL) { toast(L.soon); return; } inv('import_presets').then((l) => { if (l.length) { addPresets(l, true); toast(L.presetsImported(l.length)); } }).catch((e) => toast(String(e))); }
  function exportPresets() { if (!REAL) { toast(L.soon); return; } inv('export_presets', { presets: S.presets }).then((ok) => ok && toast(L.presetsExported)).catch((e) => toast(String(e))); }
  function openPresetsFolder() { if (!REAL) { toast(L.revealToast); return; } inv('open_data_dir').catch((e) => toast(String(e))); }
  async function restoreDefaults() {
    const defs = REAL ? await inv('default_presets') : clone(demo.presets);
    const have = new Set(S.presets.map((p) => p.id));
    defs.filter((p) => !have.has(p.id)).forEach((p) => S.presets.push(p));
    savePresets(); renderAll(); toast(L.presetsImported(defs.length));
  }

  /* pastas */
  function newFolder() {
    const f = folderList(); let n = L.newFolder; let i = 2;
    while (f.includes(n)) n = `${L.newFolder} ${i++}`;
    S.set.folders = [...f, n]; saveSettings(); renderPresets();
    if (S.set.foldPresets) { S.set.foldPresets = false; renderPresets(); }
    setTimeout(() => renameFolder(n), 60);
  }
  function renameFolder(f) {
    const head = $(`.pf-head[data-folder="${CSS.escape(f)}"]`); if (!head) return;
    const span = head.querySelector('.pf-name');
    const input = document.createElement('input'); input.className = 'pf-input'; input.value = f; input.spellcheck = false;
    span.replaceWith(input); input.focus(); input.select();
    let done = false;
    const finish = (ok) => {
      if (done) return; done = true;
      const v = input.value.trim();
      if (ok && v && v !== f && !folderList().includes(v)) {
        S.set.folders = folderList().map((x) => (x === f ? v : x));
        S.presets.forEach((p) => { if (p.folder === f) p.folder = v; });
        if (S.set.folderClosed && S.set.folderClosed[f]) { S.set.folderClosed[v] = true; delete S.set.folderClosed[f]; }
        saveSettings(); savePresets();
      }
      renderPresets();
    };
    input.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') finish(true); if (e.key === 'Escape') finish(false); });
    input.addEventListener('blur', () => finish(true));
    input.addEventListener('click', (e) => e.stopPropagation());
  }
  function deleteFolder(f) {
    S.presets.forEach((p) => { if (p.folder === f) p.folder = ''; });
    S.set.folders = folderList().filter((x) => x !== f);
    saveSettings(); savePresets(); renderPresets();
  }
  function moveToFolder(pid, f) {
    const p = presetOf(pid); if (!p) return;
    p.folder = f; S.presets = [...S.presets.filter((x) => x !== p), p];
    if (S.draft && S.draft.id === pid) S.draft.folder = f;
    savePresets(); renderPresets();
  }
  function folderMenu(at, pid) {
    const cur = presetOf(pid).folder || '';
    openMenu(at, [{ label: L.noFolder, value: '', sel: !cur, icon: ICONS.x },
      ...folderList().map((f) => ({ label: f, value: f, sel: cur === f, icon: ICONS.folder })),
      { sep: true }, { label: L.newFolderMenu, value: '\u0000new', icon: ICONS.plus }],
      (v) => { if (v === '\u0000new') { const f = folderList(); let n = L.newFolder; let i = 2; while (f.includes(n)) n = `${L.newFolder} ${i++}`; S.set.folders = [...f, n]; saveSettings(); moveToFolder(pid, n); setTimeout(() => renameFolder(n), 60); } else moveToFolder(pid, v); });
  }
  function colorMenu(at, pid) {
    const p = (S.draft && S.draft.id === pid) ? S.draft : presetOf(pid);
    openMenu(at, PALETTE.map((k) => ({ label: L.colors[k], value: k, color: COLORS[k], sel: p.color === k })), (k) => {
      if (S.draft && S.draft.id === pid) { S.draft.color = k; renderInspector(); }
      else { presetOf(pid).color = k; savePresets(); renderAll(); }
    });
  }

  $('#bManage').dataset.menu = '1';
  $('#bManage').onclick = (e) => openMenu(e.currentTarget, [
    { label: L.newPresetMenu, value: 'new', icon: ICONS.plus },
    { label: L.newFolderMenu, value: 'folder', icon: ICONS.folder },
    { sep: true },
    { label: L.importEnc, value: 'enc', icon: ICONS.down },
    { label: L.importJson, value: 'json', icon: ICONS.down },
    { label: L.exportPresets, value: 'export', icon: ICONS.up },
    { label: L.openPresetsFolder, value: 'open', icon: ICONS.reveal },
    { sep: true },
    { label: L.restoreDefaults, value: 'defaults', icon: ICONS.reset },
  ], (v) => ({ new: () => newPreset(), folder: newFolder, enc: importEnc, json: importJson, export: exportPresets, open: openPresetsFolder, defaults: restoreDefaults }[v]()));

  const pressPreset = { justDropped: false };
  $('#presets').addEventListener('click', (e) => {
    if (pressPreset.justDropped) { pressPreset.justDropped = false; return; }
    const fh = e.target.closest('.pf-head');
    if (fh) { const f = fh.dataset.folder; S.set.folderClosed = Object.assign({}, S.set.folderClosed, { [f]: !(S.set.folderClosed || {})[f] }); saveSettings(); renderPresets(); return; }
    const b = e.target.closest('.preset'); if (!b) return;
    if (b.classList.contains('add')) {
      openMenu(b, [{ label: L.newPresetMenu, value: 'new', icon: ICONS.plus }, { label: L.newFolderMenu, value: 'folder', icon: ICONS.folder }, { label: L.importEnc, value: 'enc', icon: ICONS.down }],
        (v) => (v === 'new' ? newPreset() : v === 'folder' ? newFolder() : importEnc()));
      return;
    }
    const q = selItem();
    if (!q) { if (S.editPreset !== b.dataset.id) { S.editPreset = b.dataset.id; S.draft = null; } renderPresets(); renderInspector(true); return; }
    if (S.picked.size > 1) { assignPicked(b.dataset.id); return; }
    assign(q, b.dataset.id); renderAll(true);
    const badge = $(`.item[data-id="${q.id}"] .badge`); if (badge) badge.classList.add('bump');
  });
  $('#presets').addEventListener('dblclick', (e) => { const fh = e.target.closest('.pf-head'); if (fh) renameFolder(fh.dataset.folder); });
  $('#presets').addEventListener('contextmenu', (e) => {
    const fh = e.target.closest('.pf-head');
    if (fh) {
      const f = fh.dataset.folder;
      openMenu({ x: e.clientX, y: e.clientY }, [
        { label: L.newPresetHere, value: 'new', icon: ICONS.plus },
        { label: L.rename, value: 'rename', icon: ICONS.edit },
        { sep: true },
        { label: L.deleteFolder, value: 'del', icon: ICONS.trash, danger: true },
      ], (v) => (v === 'new' ? newPreset(f) : v === 'rename' ? renameFolder(f) : deleteFolder(f)));
      return;
    }
    const b = e.target.closest('.preset:not(.add)'); if (!b) return; const pid = b.dataset.id;
    const at = { x: e.clientX, y: e.clientY };
    openMenu(at, [
      { label: L.useForAll, value: 'all', icon: ICONS.layers },
      { label: L.setDefault, value: 'def', icon: ICONS.star },
      { label: L.editPreset, value: 'edit', icon: ICONS.edit },
      { label: L.rename, value: 'rename', icon: ICONS.edit },
      { label: L.changeColor, value: 'color', icon: `<i style="--c:${COLORS[presetOf(pid).color]}" class="menu-dot"></i>` },
      { label: L.moveToFolder, value: 'folder', icon: ICONS.folder },
      { label: L.duplicate, value: 'dup', icon: ICONS.copy },
      { sep: true },
      { label: L.deletePreset, value: 'del', icon: ICONS.trash, danger: true },
    ], (v) => {
      if (v === 'all') assignAll(pid);
      if (v === 'def') { S.set.defaultPreset = pid; saveSettings(); renderQueue(); toast(L.defaultSet(presetOf(pid).name)); }
      if (v === 'edit') editPreset(pid);
      if (v === 'rename') renamePreset(pid);
      if (v === 'color') setTimeout(() => colorMenu(at, pid), 0);
      if (v === 'folder') setTimeout(() => folderMenu(at, pid), 0);
      if (v === 'dup') { const c = clone(presetOf(pid)); c.id = uid(); c.name += ' 2'; addPresets([c], true); }
      if (v === 'del') deletePreset(pid);
    });
  });

  /* arrastar um preset: até um vídeo, até "todos", até outro preset (reordenar) ou até uma pasta */
  const ghost = $('#ghost');
  $('#presets').addEventListener('pointerdown', (e) => {
    const b = e.target.closest('.preset:not(.add)'); if (!b || e.button !== 0) return;
    Object.assign(pressPreset, { b, pid: b.dataset.id, x0: e.clientX, y0: e.clientY, on: false });
  });
  function presetDropTarget(e) {
    const under = document.elementFromPoint(e.clientX, e.clientY);
    if (!under) return {};
    const before = under.closest('.preset:not(.add)');
    if (before && before.dataset.id !== pressPreset.pid) {
      const r = before.getBoundingClientRect();
      return { pill: before, after: e.clientX > r.left + r.width / 2 };
    }
    const fh = under.closest('.pf-head') || under.closest('.pfolder');
    if (fh) return { folder: fh.dataset.folder };
    const row = under.closest('.p-row');
    if (row) return { row, folder: row.dataset.folder };
    return { item: under.closest('.item:not(.is-done)'), all: under.closest('#allDrop') };
  }
  addEventListener('pointermove', (e) => {
    const P = pressPreset; if (!P.b) return;
    if (!P.on) {
      if (Math.hypot(e.clientX - P.x0, e.clientY - P.y0) < 6) return;
      P.on = true; const p = presetOf(P.pid);
      ghost.innerHTML = `<i style="--c:${COLORS[p.color]}"></i>${esc(p.name)}`; ghost.classList.add('show');
      root.classList.add('dragging-preset'); P.b.classList.add('dragging'); closeMenu();
    }
    ghost.style.transform = `translate(${e.clientX + 12}px,${e.clientY + 10}px)`;
    const t = presetDropTarget(e);
    $$('.drop-hover,.drop-before,.drop-after').forEach((el) => el.classList.remove('drop-hover', 'drop-before', 'drop-after'));
    if (t.pill) t.pill.classList.add(t.after ? 'drop-after' : 'drop-before');
    else if (t.folder !== undefined) { const el = t.folder ? $(`.pfolder[data-folder="${CSS.escape(t.folder)}"]`) : t.row; if (el) el.classList.add('drop-hover'); }
    else { if (t.item) t.item.classList.add('drop-hover'); if (t.all) t.all.classList.add('drop-hover'); }
  });
  addEventListener('pointerup', (e) => {
    const P = pressPreset; if (!P.b) return;
    if (P.on) {
      const t = presetDropTarget(e);
      ghost.classList.remove('show'); root.classList.remove('dragging-preset'); P.b.classList.remove('dragging');
      $$('.drop-hover,.drop-before,.drop-after').forEach((el) => el.classList.remove('drop-hover', 'drop-before', 'drop-after'));
      const p = presetOf(P.pid);
      if (t.pill) {
        const target = presetOf(t.pill.dataset.id);
        const list = S.presets.filter((x) => x !== p);
        let idx = list.indexOf(target) + (t.after ? 1 : 0);
        p.folder = target.folder || ''; list.splice(idx, 0, p); S.presets = list;
        if (S.draft && S.draft.id === p.id) S.draft.folder = p.folder;
        savePresets(); renderPresets();
      } else if (t.folder !== undefined) moveToFolder(p.id, t.folder || '');
      else if (t.all) assignAll(P.pid);
      else if (t.item && isPicked(+t.item.dataset.id) && S.picked.size > 1) assignPicked(P.pid);
      else if (t.item) { const q = itemOf(+t.item.dataset.id); assign(q, P.pid); renderAll(); const bd = $(`.item[data-id="${q.id}"] .badge`); if (bd) bd.classList.add('bump'); toast(L.assigned(p.name, 1)); }
      P.justDropped = true; setTimeout(() => { P.justDropped = false; }, 0);
    }
    P.b = null; P.on = false;
  });

  /* ---------- prévia ---------- */
  const chip = (txt, c, ico) => `<span class="chip ${c ? 'hl' : ''}" ${c ? `style="--c:${c}"` : ''}>${ico || ''}${txt}</span>`;
  /* prévia: mostra o Resultado; "Comparar" põe o Original ao lado */
  const pvSt = { in: { timer: 0, key: '', seq: 0 }, out: { timer: 0, key: '', seq: 0 } };
  function requestPreview(q, out) {
    if (!REAL) return;
    const side = out ? 'out' : 'in'; const st = pvSt[side]; const fr = $(out ? '#frame' : '#frameIn');
    const t = durOf(q) * S.t; const key = JSON.stringify([q.id, out, Math.round(t * 30), out ? q.cfg : 0]);
    if (key === st.key) return; st.key = key;
    clearTimeout(st.timer);
    st.timer = setTimeout(() => {
      const seq = ++st.seq; fr.classList.add('loading');
      inv('preview', { id: q.id, cfg: q.cfg, t, output: out, max: 960 }).then((img) => {
        if (seq !== st.seq) return;
        const el = fr.querySelector('img'); if (el) el.src = img;
        fr.classList.remove('loading');
      }).catch(() => { if (seq === st.seq) fr.classList.remove('loading'); });
    }, 70);
  }
  const requestFrames = (q) => { requestPreview(q, true); if (S.cmp) requestPreview(q, false); };
  // encaixa cada quadro no espaço disponível (um ou dois lado a lado)
  function fitFrames() {
    const st = $('.stage'); const r = st.getBoundingClientRect(); const pad = 14; const gap = 12;
    const fs = S.cmp ? [$('#frameIn'), $('#frame')] : [$('#frame')];
    const cw = (r.width - pad * 2 - gap * (fs.length - 1)) / fs.length; const ch = r.height - pad * 2 - (S.cmp ? 24 : 0);
    fs.forEach((f) => {
      const a = Number(f.dataset.ar) || 9 / 16; let w = cw; let h = w / a;
      if (h > ch) { h = ch; w = h * a; }
      f.style.width = Math.max(0, w) + 'px'; f.style.height = Math.max(0, h) + 'px';
    });
  }
  function paintFrame(fr, q, out) {
    const o = outDims(q.src, q.cfg); const ar = out ? o : { w: q.src.w, h: q.src.h };
    fr.dataset.ar = ar.w / ar.h;
    const keepImg = REAL && fr.querySelector('img') && fr.dataset.id === String(q.id);
    fr.className = 'frame' + (out ? ' out' : '');
    fr.dataset.id = q.id; fr.dataset.label = out ? L.result : L.original;
    if (REAL) {
      if (!keepImg) fr.innerHTML = `<img class="pv-img" ${q.thumb ? `src="${q.thumb}"` : ''} alt=""><i class="pv-spin"></i>`;
    } else {
      const washed = q.src.hdr && (!out || !q.cfg.hdrToSdr);
      fr.innerHTML = scene(q.hue, ar.h > ar.w)
        + `<div class="grade" style="${washed ? 'opacity:1;background:rgba(170,170,185,.16);mix-blend-mode:screen' : 'opacity:0'}"></div>`;
      fr.querySelector('svg.scene').style.filter = washed ? 'saturate(.6) contrast(.82) brightness(1.04)' : 'none';
    }
  }
  function renderPreview(anim) {
    const q = selItem(); const fr = $('#frame'); const fi = $('#frameIn');
    $('#previewCard').classList.toggle('no-video', !q);
    $('.stage').classList.toggle('compare', !!S.cmp);
    $('#bCompare').classList.toggle('on', !!S.cmp);
    if (!q) { fr.innerHTML = ''; fi.innerHTML = ''; $('#pvMeta').innerHTML = ''; $('#tcEnd').textContent = '00:00:00:00'; pvSt.in.key = pvSt.out.key = ''; drawWave(); return; }
    const o = outDims(q.src, q.cfg); const c = [];
    // informação de como o vídeo VAI FICAR
    const cfr = q.cfg.fps.conform;
    c.push(chip(`${o.w}×${o.h}`), chip(`${codecName(q.cfg.codec)} ${q.cfg.codec === 'h264' ? 8 : q.cfg.bits}-bit`),
      cfr ? chip(`${fpsTxt(q.cfg.fps.value)} fps CFR`, COLORS.green) : chip(`${fpsTxt(q.src.fps)} fps ${q.src.vfr ? 'VFR' : ''}`.trim()));
    if (q.src.hdr) c.push(q.cfg.hdrToSdr ? chip('Rec. 709', COLORS.green) : chip(L.hdrKept, COLORS.orange));
    if (q.cfg.rotate) c.push(chip(`${q.cfg.rotate}°`, COLORS.teal, ICONS.rot));
    c.push(chip(`≈ ${fmtMB(estMB(q))}`));
    $('#pvMeta').innerHTML = c.join('<span class="dot">·</span>');
    if (anim) { const m = $('#pvMeta'); m.classList.remove('swap'); void m.offsetWidth; m.classList.add('swap'); }
    paintFrame(fr, q, true);
    if (S.cmp) paintFrame(fi, q, false);
    fitFrames();
    if (REAL) requestFrames(q);
    if (anim) { [fr, fi].forEach((f) => { f.classList.remove('flip'); void f.offsetWidth; f.classList.add('flip'); }); }
    $('#tcEnd').textContent = q.src.dur; setT(S.t, true);
    if (REAL && q.wave === undefined) {
      q.wave = null;
      inv('waveform', { id: q.id, bars: 600 }).then((w) => { q.wave = w; if (selItem() === q) drawWave(); }).catch(() => { q.wave = []; });
    }
    drawWave();
  }
  $('#bCompare').onclick = () => { S.cmp = !S.cmp; if (!S.cmp) pvSt.in.key = ''; renderPreview(true); };
  new ResizeObserver(() => fitFrames()).observe($('.stage'));

  /* segmentado com pílula que desliza */
  function seg(el, onChange) {
    const pill = el.querySelector('.pill');
    const place = (b, instant) => {
      if (!pill || !b) return;
      if (instant) pill.style.transition = 'none';
      pill.style.width = b.offsetWidth + 'px';
      pill.style.transform = `translateX(${b.offsetLeft - 2}px)`;
      if (instant) { void pill.offsetWidth; pill.style.transition = ''; }
    };
    el.onclick = (e) => {
      const b = e.target.closest('button'); if (!b || b.classList.contains('active') || b.disabled) return;
      el.querySelectorAll('button').forEach((x) => x.classList.toggle('active', x === b));
      place(b); onChange && onChange(b.dataset.v);
    };
    requestAnimationFrame(() => place(el.querySelector('button.active'), true));
  }

  /* forma de onda (no app vem do áudio de verdade) */
  function drawWave() {
    const cv = $('#wave'); const r = cv.getBoundingClientRect(); if (!r.width) return; const dpr = devicePixelRatio || 1;
    cv.width = r.width * dpr; cv.height = r.height * dpr;
    const g = cv.getContext('2d'); g.scale(dpr, dpr);
    g.fillStyle = getComputedStyle(root).getPropertyValue('--wave').trim();
    const q = selItem();
    if (REAL) {
      const w = q && q.wave; if (!w || !w.length) return;
      const n = Math.floor((r.width - 4) / 3);
      for (let i = 0; i < n; i++) {
        const v = w[Math.floor(i / n * w.length)] / 255; const a = Math.max(1.5, v * (r.height - 10));
        g.beginPath(); g.roundRect(2 + i * 3, (r.height - a) / 2, 2, a, 1); g.fill();
      }
      return;
    }
    if (!q) return;
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let x = 2; x < r.width - 2; x += 3) {
      const env = .35 + .65 * Math.abs(Math.sin(x / 41) * Math.cos(x / 97));
      const a = Math.max(1.5, env * (rnd() * .7 + .3) * (r.height - 10));
      g.beginPath(); g.roundRect(x, (r.height - a) / 2, 2, a, 1); g.fill();
    }
  }
  const tl = $('#timeline');
  function setT(t, quiet) {
    S.t = clamp(t, 0, 1); tl.style.setProperty('--t', S.t * 100 + '%');
    const q = selItem(); if (!q) { $('#tcNow').textContent = '00:00:00:00'; return; }
    $('#tcNow').textContent = tc(durOf(q) * S.t, q.src.fpsNum || 60);
    if (!quiet && REAL) requestFrames(q);
  }
  tl.addEventListener('pointerdown', (e) => {
    if (!selItem()) return;
    const r = tl.getBoundingClientRect(); const mv = (ev) => setT((ev.clientX - r.left) / r.width);
    mv(e); tl.setPointerCapture(e.pointerId); tl.onpointermove = mv; tl.onpointerup = () => { tl.onpointermove = null; };
  });
  const ctl = $$('.controls .ctl');
  const stepBy = (s) => { const q = selItem(); if (q) setT(S.t + s / durOf(q)); };
  ctl[0].onclick = () => { const q = selItem(); if (q) stepBy(-1 / (q.src.fpsNum || 60)); };
  ctl[1].onclick = () => stepBy(-5);
  ctl[3].onclick = () => stepBy(5);
  ctl[4].onclick = () => { const q = selItem(); if (q) stepBy(1 / (q.src.fpsNum || 60)); };
  let playRaf;
  if (REAL) $('#bPlay').remove(); // sem reprodução: a prévia mostra quadros
  else $('#bPlay').onclick = () => {
    if (!selItem()) return;
    S.playing = !S.playing; $('#playIco').innerHTML = S.playing ? ICONS.pause : ICONS.play;
    cancelAnimationFrame(playRaf);
    if (S.playing) { let last = performance.now(); const dur = durOf(selItem());
      const step = (now) => { setT(S.t + (now - last) / 1000 / dur); last = now; if (S.t < 1 && S.playing) playRaf = requestAnimationFrame(step); };
      playRaf = requestAnimationFrame(step); }
  };

  /* ---------- inspetor: ajusta o vídeo selecionado ou, sem vídeo, o próprio preset ---------- */
  function target() {
    const q = selItem();
    if (q) return { q, cfg: q.cfg, src: q.src, preset: presetOf(q.preset), isPreset: false };
    const p = presetOf(S.editPreset) || presetOf(S.set.defaultPreset) || S.presets[0];
    if (!p) return { q: null, cfg: null, src: null, preset: null, isPreset: true };
    if (!S.draft || S.draft.id !== p.id) S.draft = clone(p);
    return { q: null, cfg: S.draft, src: null, preset: p, isPreset: true, dirty: !same(S.draft, p) };
  }
  const sw = (key, on, red) => `<button class="switch ${on ? 'on' : ''} ${red ? 'red' : ''}" data-k="${key}"></button>`;
  const segH = (key, val, opts) => `<div class="seg" data-k="${key}"><div class="pill"></div>${opts.map(([v, t, dis]) => `<button data-v="${v}" class="${String(v) === String(val) ? 'active' : ''}" ${dis ? 'disabled' : ''}>${t}</button>`).join('')}</div>`;
  // menu suspenso: botão compacto que abre a lista de opções
  const DD = {}; const FPS_OPTS = [['23.976', '23,976'], ['29.97', '29,97'], ['59.94', '59,94'], ['60', '60']];
  const dd = (key, val, opts) => {
    DD[key] = { val, opts }; const cur = opts.find((o) => String(o[0]) === String(val)) || opts[0];
    return `<button class="field pick dd" data-menu="1" data-dd="${key}">${cur[1]}${ICONS.chev}</button>`;
  };
  const row = (lbl, ctl, sub, cls = '') => `<div class="row ${cls}"><span class="lbl">${lbl}${sub ? `<small>${sub}</small>` : ''}</span>${ctl}</div>`;
  const sec = (id, title, summary, body, extra = '') => `<div class="sec ${S.open[id] ? 'open' : ''}" data-sec="${id}">
      <button class="sec-head"><span class="sec-t">${title}</span>${extra}<span class="sec-sum">${summary}</span>${ICONS.chev}</button>
      <div class="sec-body"><div class="sec-inner">${body}</div></div></div>`;
  const trackBtn = (i, n) => `<button class="field pick" data-menu="1" data-track="${i}">${L.track(n)}${ICONS.chev}</button>`;

  function renderInspector(anim) {
    const T = target(); const el = $('#inspIn');
    if (!T.cfg) { el.innerHTML = ''; return; }
    const c = T.cfg; const src = T.src;
    const mod = T.isPreset ? T.dirty : T.preset && !same(c, T.preset);
    // Editando um preset: o nome e a cor ficam só nos presets lá em cima (sem repetir aqui).
    $('#inspFor').innerHTML = T.isPreset ? ''
      : S.picked.size > 1 ? L.settingsForN(S.picked.size) : L.settingsFor;
    $('#inspFor').classList.toggle('editing', T.isPreset);
    $('.insp-title').classList.toggle('hide', !!T.isPreset && !mod);
    $('#modified').classList.toggle('show', !!mod); $('#bSavePreset').classList.toggle('show', !!mod);
    $('#bSavePreset').textContent = T.isPreset ? L.saveChanges : L.saveToPreset;
    $('#bDiscard').classList.toggle('show', !!(mod && T.isPreset));
    const a = c.audio; const o = c.output; const h264 = c.codec === 'h264';
    const dims = src ? outDims(src, c) : null;
    const resHint = !src && c.scale === '1080' ? `<div class="hint">${L.scale1080Hint}</div>` : '';
    const rotTxt = c.rotate ? ` · ↻ ${c.rotate}°` : '';
    el.innerHTML = (T.isPreset ? '' : S.picked.size > 1 ? `<div class="hint top-hint multi-hint">${L.multiHint(S.picked.size)}</div>` : '')
      + sec('video', L.video, `${codecName(c.codec)} · ${h264 ? 8 : c.bits}-bit · ${scaleTxt(c.scale)}${rotTxt} · ${c.fps.conform ? fpsTxt(c.fps.value) + ' CFR' : c.bitrate.mode === 'manual' ? fmtK(c.bitrate.kbps) : c.bitrate.mode === 'source' ? L.source : L.auto}${c.hdrToSdr ? ' · 709' : ''}`,
        `<div class="group">
          ${row(`${L.resolution}<small class="res-out">${resLabel(c, src)}</small>`, dd('scale', c.scale, [['source', L.source], ['1080', '1080p'], ['50', '50%'], ['25', '25%'], ['custom', L.custom]]))}
          <div class="collapse ${c.scale === 'custom' ? '' : 'closed'}" style="max-height:60px">
            ${row(L.size, `<div class="field"><input class="tnum" data-k="customW" value="${c.customW || ''}" placeholder="auto"><span>W</span></div><span class="times">×</span><div class="field"><input class="tnum" data-k="customH" value="${c.customH || ''}" placeholder="auto"><span>H</span></div>`)}
          </div>
          ${row(L.bitrate, dd('bitrate.mode', c.bitrate.mode, [['auto', L.auto], ['source', L.source], ['manual', L.manual]]))}
          <div class="collapse ${c.bitrate.mode === 'manual' ? '' : 'closed'}" style="max-height:60px">
            ${row(L.value, `<div class="field"><input class="tnum" data-k="bitrate.kbps" value="${num(c.bitrate.kbps, 0)}"><span>kb/s</span></div>${dd('bitrate.rc', c.bitrate.rc, [['cbr', 'CBR'], ['vbr', 'VBR']])}`)}
          </div>
          ${row(L.codec, dd('codec', c.codec, [['h264', 'H.264'], ['h265', 'H.265']]))}
          ${row(L.bitDepth, dd('bits', h264 ? 8 : c.bits, [[8, '8-bit'], [10, '10-bit', h264]]))}
          ${row(L.fps, c.fps.conform ? dd('fps.value', c.fps.value, FPS_OPTS) : `<span class="field pick dis">${L.source}${ICONS.chev}</span>`)}
          ${row(L.fpsMode, segH('fpsMode', c.fps.conform ? 'cfr' : 'vfr', [['vfr', 'VFR'], ['cfr', 'CFR']]))}
          ${row(L.rotate, dd('rotate', c.rotate || 0, [[0, L.rotNone], [90, L.rotCw], [180, '180°'], [270, L.rotCcw]]))}
          ${row(L.maxQuality, sw('maxQuality', c.maxQuality))}
          ${row(L.hdr + (src && src.hdr ? ` <span class="pill-tag" style="--c:${COLORS.yellow}">${L.detected(src.hdr)}</span>` : ''), sw('hdrToSdr', c.hdrToSdr), L.hdrSub)}
        </div>${resHint}${h264 && c.bits === 10 ? `<div class="hint">${L.h264no10}</div>` : ''}${c.bitrate.mode === 'source' && src ? `<div class="hint">${L.sameBitrate(fmtK(src.kbps))}</div>` : ''}${src && src.hdr && !c.hdrToSdr ? `<div class="hint warn-t">${L.hdrWarn}</div>` : ''}`)
      + sec('audio', L.audio, a.codec === 'copy' ? L.copy : `AAC · ${a.channels === 'stereo' ? L.stereo : L.mono}`,
        `<div class="group">
          ${row(L.codec, dd('audio.codec', a.codec, [['aac', 'AAC'], ['copy', L.copy]]))}
          ${a.codec === 'aac' ? row(L.channels, dd('audio.channels', a.channels, [['stereo', L.stereo], ['mono', L.mono]])) : ''}
          ${a.codec === 'aac' ? row(L.tracks, `<div class="val">${a.channels === 'stereo' ? trackBtn(0, a.tracks[0]) + trackBtn(1, a.tracks[1]) : trackBtn(0, a.tracks[0])}</div>`, a.channels === 'stereo' ? L.tracksStereo : L.tracksMono) : ''}
          ${a.codec === 'aac' ? row(L.quality, `<span class="val tnum">${a.kbps} kb/s · 48 kHz</span>`) : ''}
        </div>`)
      + sec('adv', L.advanced, [c.avSync ? L.avSync : null, c.metadata ? L.metadata : null].filter(Boolean).join(' · ') || '—',
        `<div class="group">
          ${row(L.avSync, sw('avSync', c.avSync), L.avSyncSub)}
          ${row(L.metadata, sw('metadata', c.metadata), L.metadataSub)}
        </div>`);
    renderOutput(T);
    $$('.seg', el).forEach((s) => seg(s, (v) => set(s.dataset.k, v)));
    $$('[data-dd]', el).forEach((b) => { b.onclick = () => {
      const k = b.dataset.dd; const d = DD[k];
      openMenu(b, d.opts.filter((o) => !o[2]).map(([v, t]) => ({ label: t, value: v, sel: String(v) === String(d.val) })), (v) => { if (String(v) !== String(d.val)) set(k, v); });
    }; });
    $('#estBox').style.visibility = T.q ? '' : 'hidden';
    if (T.q) $('#est').textContent = '≈ ' + fmtMB(estMB(T.q));
    $('#bApplyAll').textContent = T.isPreset ? L.setForAllBtn : L.applyAll;
    $('#bApplyAll').disabled = !pending().length;
    const ni = $('#presetNameInput');
    if (ni) ni.oninput = () => { const v = ni.value.trim(); if (v) { T.cfg.name = v; const d = !same(T.cfg, T.preset); $('#modified').classList.toggle('show', d); $('#bSavePreset').classList.toggle('show', d); $('#bDiscard').classList.toggle('show', d); } };
    const cb = $('#bPresetColor'); if (cb) cb.onclick = (e) => colorMenu(e.currentTarget, T.preset.id);
    if (anim) { el.classList.remove('swap'); void el.offsetWidth; el.classList.add('swap'); }
  }
  /* Saída: fica embaixo da fila, perto do botão de renderizar */
  function renderOutput(T) {
    const c = T.cfg; const o = c.output; const box = $('#outPanel');
    const sum = [o.suffix.on ? o.suffix.text : null, o.subfolder.on ? o.subfolder.text + '\\' : null].filter(Boolean).map(esc).join(' · ') || L.sameFolder;
    box.innerHTML = `<div class="out-head"><span>${L.output}</span><small title="${esc(outName(T.q ? T.q.file : 'IMG_0001.MOV', c))}">${sum}</small></div>
      <div class="group">
        ${row(L.suffix, `<div class="field ${o.suffix.on ? '' : 'off'}"><input data-k="output.suffix.text" value="${esc(o.suffix.text)}" class="txt" spellcheck="false"></div>${sw('output.suffix.on', o.suffix.on)}`)}
        ${row(L.subfolder, `<div class="field ${o.subfolder.on ? '' : 'off'}"><input data-k="output.subfolder.text" value="${esc(o.subfolder.text)}" class="txt" spellcheck="false"></div>${sw('output.subfolder.on', o.subfolder.on)}`)}
        ${row(L.deleteSrc, sw('output.deleteSource', o.deleteSource, true), '', o.deleteSource ? 'danger' : '')}
      </div>`;
  }
  // texto da resolução final ao lado de "Resolução"
  function resLabel(c, src) {
    if (src) { const d = outDims(src, c); return `${d.w} × ${d.h}`; }
    if (c.scale === 'custom') return c.customW || c.customH ? `${c.customW || 'auto'} × ${c.customH || 'auto'}` : L.source;
    return { source: L.sameAsSource, '1080': L.shortSide1080, '50': L.halfOfSource, '25': L.quarterOfSource }[c.scale] || '';
  }
  function outName(file, cfg) {
    const c = cfg.output; const base = file.replace(/\.[^.]+$/, '');
    const suf = c.suffix.on ? c.suffix.text.replace('{codec}', codecName(cfg.codec).replace('.', '')).replace('{preset}', cfg.name || '') : '';
    return (c.subfolder.on ? c.subfolder.text + '\\' : '') + base + suf + '.' + (cfg.container || 'mp4');
  }
  // copia os campos alterados do vídeo principal para os outros selecionados
  function spread(from, keys) {
    if (S.picked.size < 2) return;
    const get = (o, k) => k.split('.').reduce((a, x) => a[x], o);
    pickedItems().forEach((q) => {
      if (q === from || q.status === 'running') return;
      keys.forEach((k) => { const ks = k.split('.'); let o = q.cfg; ks.slice(0, -1).forEach((x) => { o = o[x]; }); o[ks[ks.length - 1]] = clone(get(from.cfg, k)); });
    });
  }
  function set(key, v) {
    const T = target();
    const ks = key.split('.'); let o = T.cfg; ks.slice(0, -1).forEach((k) => { o = o[k]; });
    const last = ks[ks.length - 1];
    o[last] = typeof o[last] === 'boolean' ? !o[last] : typeof o[last] === 'number' ? Number(String(v).replace(/\D/g, '')) || 0 : v;
    if (key === 'customW' || key === 'customH') o[last] = Math.min(16384, Number(String(v).replace(/\D/g, '')) || 0);
    if (key === 'audio.channels') T.cfg.audio.tracks = v === 'mono' ? [1, 1] : [1, 2];
    if (key === 'codec' && v === 'h264') T.cfg.bits = 8;
    if (key === 'fpsMode') { delete T.cfg.fpsMode; T.cfg.fps.conform = v === 'cfr'; }
    if (!T.isPreset) spread(T.q, key === 'fpsMode' ? ['fps.conform'] : [key, ...(key === 'audio.channels' ? ['audio.tracks'] : []), ...(key === 'codec' ? ['bits'] : [])]);
    renderQueue(); renderPresets(); renderInspector(); renderPreview();
  }
  $('#inspIn').addEventListener('click', (e) => {
    const s = e.target.closest('.switch');
    if (s) { s.classList.toggle('on'); setTimeout(() => set(s.dataset.k), 180); return; }
    const h = e.target.closest('.sec-head');
    if (h) { const box = h.parentElement; const id = box.dataset.sec; S.open[id] = !S.open[id]; box.classList.toggle('open', S.open[id]); return; }
    const t = e.target.closest('[data-track]');
    if (t) { const T = target(); const i = +t.dataset.track; const n = T.src ? T.src.audio : 2;
      openMenu(t, [1, 2, 3, 4, 5, 6, 7, 8].slice(0, Math.max(2, n)).map((k) => ({ label: L.track(k), value: k, sel: T.cfg.audio.tracks[i] === k })),
        (k) => { T.cfg.audio.tracks[i] = k; if (!T.isPreset) spread(T.q, ['audio.tracks']); renderAll(); }); }
  });
  $('#inspIn').addEventListener('change', (e) => { const i = e.target.closest('input[data-k]'); if (i) set(i.dataset.k, i.value); });
  $('#outPanel').addEventListener('click', (e) => { const s = e.target.closest('.switch'); if (s) { s.classList.toggle('on'); setTimeout(() => set(s.dataset.k), 180); } });
  $('#outPanel').addEventListener('change', (e) => { const i = e.target.closest('input[data-k]'); if (i) set(i.dataset.k, i.value); });
  // Salvar: do vídeo para o preset, ou o rascunho do preset (só grava quando clica)
  $('#bSavePreset').onclick = () => {
    const T = target(); const p = T.preset; if (!p) return;
    // os vídeos que ainda usam o preset sem mudanças acompanham
    const followers = S.queue.filter((q) => q.status !== 'done' && q.status !== 'running' && q.preset === p.id && same(q.cfg, p));
    if (T.isPreset) Object.assign(p, clone(S.draft));
    else Object.assign(p, clone(T.q.cfg), { id: p.id, name: p.name, icon: p.icon, color: p.color, folder: p.folder });
    followers.forEach((q) => { q.cfg = clone(p); });
    if (T.isPreset) S.draft = clone(p);
    savePresets(); renderAll(); toast(L.presetSaved(p.name), true);
  };
  $('#bDiscard').onclick = () => { S.draft = null; renderAll(); };
  $('#bApplyAll').onclick = () => {
    const T = target();
    if (T.isPreset) { assignAll(T.preset.id); return; }
    pending().forEach((x) => { if (x.status !== 'running') { x.preset = T.q.preset; x.cfg = clone(T.q.cfg); } }); renderAll(); toast(L.appliedAll);
  };

  /* ---------- configurações ---------- */
  function engineTxt() {
    const e = S.engine;
    if (e.status === 'nvenc') return e.gpu ? `${esc(e.gpu)} · NVENC` : L.engineNvenc;
    return { cpu: L.engineCpu, missing: L.engineMissing }[e.status] || L.engineChecking;
  }
  function renderSheet() {
    const dp = presetOf(S.set.defaultPreset) || S.presets[0];
    $('#sheetBody').innerHTML = `
      <div class="group">
        ${row(L.language, segH('lang', S.set.lang, [['en', 'English'], ['pt', 'Português']]))}
        ${row(L.appearance, segH('theme', S.set.theme, [['system', L.system], ['light', L.light], ['dark', L.dark], ['oled', L.oled]]))}
      </div>
      <div class="sec-label">${L.general}</div>
      <div class="group">
        ${row(L.newVideosUse, `<button class="field pick" data-menu="1" id="bSheetDef"><i class="dotc" style="--c:${dp ? COLORS[dp.color] : 'var(--text-3)'}"></i>${dp ? esc(dp.name) : ''}${ICONS.chev}</button>`)}
        ${row(L.clearWhenDone, sw('clearWhenDone', S.set.clearWhenDone))}
        ${row(L.sound, sw('sound', S.set.sound))}
        ${row(L.notify, sw('notify', S.set.notify))}
        ${row(L.gpu, `<span class="val">${engineTxt()}</span>`)}
      </div>
      <div class="sec-label">${L.performance}</div>
      <div class="group">
        ${row(L.parallel, segH('parallel', clamp(+S.set.parallel || 1, 1, 3), [[1, '1'], [2, '2'], [3, '3']]), L.parallelSub)}
        ${row(L.renderLog, `<button class="field pick" id="bOpenLog">${L.open}</button>`, L.renderLogSub)}
      </div>
      <div class="group">
        ${row(`${L.version} ${esc(S.version)}`, S.update
          ? `<button class="btn small" id="bSheetUpdate">${L.updateNow} · ${esc(S.update.version)}</button>`
          : `<button class="field pick" id="bCheckUpdate">${L.checkUpdates}</button>`)}
      </div>
      <div class="hint">${L.dataSaved}</div>
      <div class="about">Mec Encoder ${esc(S.version)} · <span>@hugoeditor_</span></div>`;
    $$('#sheetBody .seg').forEach((s) => seg(s, (v) => {
      if (s.dataset.k === 'theme') { setTheme(v); return; }
      if (s.dataset.k === 'parallel') { S.set.parallel = +v; saveSettings(); return; }
      S.set.lang = v; saveSettings(); applyLang(); renderAll(); renderSheet();
    }));
    $('#bSheetDef').onclick = (e) => openMenu(e.currentTarget, presetItems(S.set.defaultPreset), (v) => { S.set.defaultPreset = v; saveSettings(); renderSheet(); renderQueue(); });
    $('#bOpenLog').onclick = () => (REAL ? inv('open_log').catch((e) => toast(String(e))) : toast('render.log'));
    const cu = $('#bCheckUpdate'); if (cu) cu.onclick = () => checkUpdate(true);
    const su = $('#bSheetUpdate'); if (su) su.onclick = installUpdate;
  }
  const renderSheetIfOpen = () => root.classList.contains('sheet-open') && renderSheet();
  $('#sheetBody').addEventListener('click', (e) => {
    const s = e.target.closest('.switch'); if (!s) return;
    s.classList.toggle('on'); S.set[s.dataset.k] = s.classList.contains('on'); saveSettings();
    if (s.dataset.k === 'sound' && S.set.sound) playDone();
  });
  const openSheet = (on) => { if (on) renderSheet(); root.classList.toggle('sheet-open', on); };
    $('#bDone').onclick = () => openSheet(false);
  $('#sheetBg').onclick = () => openSheet(false);
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { openSheet(false); closeMenu(); if (S.picked.size > 1 && !e.target.closest('input')) { selectOnly(S.sel); renderAll(); } }
    if (e.target.closest('input')) return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') { e.preventDefault(); if (REAL) inv('pick', { folder: e.shiftKey }); }
    if (e.key === ' ' && selItem() && $('#bPlay')) { e.preventDefault(); $('#bPlay').click(); }
    if (e.key === 'ArrowLeft' && selItem()) ctl[e.shiftKey ? 1 : 0].click();
    if (e.key === 'ArrowRight' && selItem()) ctl[e.shiftKey ? 3 : 4].click();
    if (e.key === 'Delete' && S.picked.size) pickedItems().forEach((q) => removeItem(q.id));
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a' && S.queue.length) {
      e.preventDefault(); S.picked = new Set(S.queue.map((q) => q.id)); if (S.sel == null) S.sel = S.queue[0].id; renderAll(true);
    }
  });

  /* ---------- atualização ---------- */
  function renderUpdateBtn() {
    const b = $('#bUpdate'); if (!b) return;
    b.hidden = !S.update;
    if (S.update) b.querySelector('span').textContent = S.updating != null ? L.updating(S.updating) : L.updateAvail(S.update.version);
  }
  async function checkUpdate(manual) {
    if (!REAL) { if (manual) toast(L.upToDate); return; }
    try { S.update = await inv('check_update'); } catch { S.update = null; }
    renderUpdateBtn(); renderSheetIfOpen();
    if (manual && !S.update) toast(L.upToDate);
  }
  function installUpdate() {
    if (!S.update || S.updating != null) return;
    S.updating = 0; renderUpdateBtn();
    inv('install_update').catch((e) => { S.updating = null; renderUpdateBtn(); toast(String(e)); });
  }
  $('#bUpdate').onclick = (e) => openMenu(e.currentTarget, [
    { label: L.updateNow, value: 'now', icon: ICONS.down }, { label: L.later, value: 'later', icon: ICONS.x }],
    (v) => v === 'now' && installUpdate());
  $('#bUpdate').dataset.menu = '1';

  /* ---------- render ----------
     "Renderizar fila": avisa uma vez, quando a fila inteira termina.
     Render de um vídeo só: avisa quando aquele vídeo termina. */
  const sfx = $('#sfxDone');
  function playDone() { try { sfx.currentTime = 0; const p = sfx.play(); if (p) p.catch(() => {}); } catch {} }
  function notify(msg, isError) {
    toast(msg, !isError);
    if (S.set.sound && !isError) playDone();
    if (REAL && S.set.notify && !document.hasFocus()) inv('notify', { title: 'Mec Encoder', body: msg }).catch(() => {});
  }
  function renderRenderBtn() {
    const b = $('#bRender');
    b.classList.toggle('stop', !!S.job);
    $('#renderTxt').textContent = S.job ? L.stop : L.render;
    if (!S.job) $('#renderFill').style.setProperty('--p', 0);
  }
  function startJob(job) { S.job = Object.assign(job, { t0: Date.now(), id: Date.now(), parallel: REAL ? clamp(+S.set.parallel || 1, 1, 3) : 1, done: 0 }); renderRenderBtn(); renderQueue(); if (REAL) runLoop(); else { clearInterval(timer); timer = setInterval(tick, 120); } }
  function stopJob() {
    if (S.job && S.job.done) S.lastRun = { took: (Date.now() - S.job.t0) / 1000, n: S.job.done };
    if (REAL) { S.stopping = true; inv('stop').catch(() => {}); }
    clearInterval(timer); timer = null;
    S.queue.forEach((q) => { if (q.status === 'running') { q.status = 'ready'; q.p = 0; } q.queued = false; });
    S.job = null; renderRenderBtn(); renderQueue();
  }
  function renderOne(id, quiet) {
    const q = itemOf(id); if (!q || q.status !== 'ready') return;
    if (!S.job) { startJob({ mode: 'single', list: [id] }); return; }
    if (S.job.mode === 'single') { if (!S.job.list.includes(id)) { S.job.list.push(id); q.queued = true; renderQueue(); } }
    else { const before = rects(); const at = S.queue.findIndex((x) => x.status === 'running') + 1; S.queue = S.queue.filter((x) => x !== q); S.queue.splice(at, 0, q); renderQueue(); flip(before); }
    if (!quiet) toast(L.willRenderNext(q.file));
  }
  function nextItem(J) {
    if (J.mode === 'queue') return S.queue.find((q) => q.status === 'ready');
    while (J.list.length) { const c = itemOf(J.list.shift()); if (c && c.status === 'ready') return c; }
    return null;
  }
  function updateFill() {
    const J = S.job; if (!J || J.mode !== 'queue') return;
    const left = S.queue.filter((q) => q.status === 'ready').length
      + S.queue.filter((q) => q.status === 'running').reduce((a, q) => a + 1 - (q.p || 0), 0);
    $('#renderFill').style.setProperty('--p', clamp(1 - left / (J.total || 1), 0, 1));
  }
  // App: renderiza na ordem atual da fila (que pode mudar enquanto renderiza),
  // com até S.set.parallel vídeos ao mesmo tempo.
  async function runLoop() {
    const J = S.job; S.stopping = false; let failed = 0;
    const worker = async () => {
      while (S.job === J) {
        const q = nextItem(J);
        if (!q) break;
        q.status = 'running'; q.queued = false; q.p = 0; q.speed = 0; q.eta = null; q.error = null; q.t0 = Date.now(); q.jobId = J.id; q.took = 0; renderQueue(); updateFill();
        try {
          const r = await inv('render', { id: q.id, cfg: q.cfg });
          q.status = 'done'; q.p = 1; q.out = r.output; q.outMb = r.size / 1e6; q.took = elapsedOf(q); J.done++;
          if (r.deleted) toast(L.deletedOrig);
          if (J.mode === 'single') notify(L.rendered(q.file) + ' · ' + fmtDur(q.took));
        } catch (e) {
          if (S.stopping || S.job !== J) { q.status = 'ready'; q.p = 0; break; }
          q.status = 'err'; q.error = String(e === 'source-missing' ? L.sourceMissing : e); failed++;
          notify(L.renderFailed(q.file) + (q.error ? ': ' + q.error.split('\n').pop() : ''), true);
        }
        renderQueue(); renderInspector(); updateFill();
      }
    };
    const n = clamp(+S.set.parallel || 1, 1, 3);
    const workers = [worker()];
    // os outros entram um pouco depois, para não abrirem todos juntos
    for (let i = 1; i < n; i++) { await new Promise((r) => setTimeout(r, 400)); if (S.job !== J) break; workers.push(worker()); }
    await Promise.all(workers);
    if (S.job === J) finishJob(failed);
  }
  // Demo: simulação
  let timer = null;
  function tick() {
    const J = S.job; if (!J) return;
    let cur = S.queue.find((q) => q.status === 'running');
    if (!cur) { cur = nextItem(J); if (!cur) { finishJob(0); return; } cur.status = 'running'; cur.queued = false; cur.p = 0; cur.t0 = Date.now(); cur.jobId = J.id; renderQueue(); }
    cur.p = Math.min(1, cur.p + .035);
    if (cur.p >= 1) { cur.status = 'done'; cur.took = elapsedOf(cur); J.done++; renderQueue(); renderInspector(); if (J.mode === 'single') notify(L.rendered(cur.file)); }
    else { const it = $(`.item[data-id="${cur.id}"]`); if (it) { it.querySelector('.prog').style.setProperty('--p', cur.p); it.querySelector('.state').textContent = Math.round(cur.p * 100) + '%'; } }
    updateFill();
  }
  function finishJob(failed) {
    const J = S.job; clearInterval(timer); timer = null; S.job = null; renderRenderBtn();
    if (J && J.done) S.lastRun = { took: (Date.now() - J.t0) / 1000, n: J.done };
    if (J && J.mode === 'queue') {
      notify(J.done ? L.queueTook(fmtDur(S.lastRun.took), J.done) : L.queueDone);
      if (S.set.clearWhenDone && !failed) setTimeout(() => clearDone(false), 1600);
    }
    renderQueue();
  }
  $('#bRender').onclick = () => {
    if (S.job) { stopJob(); return; }
    S.queue.forEach((q) => { if (q.status === 'err') { q.status = 'ready'; q.error = null; } });
    const n = S.queue.filter((q) => q.status === 'ready').length; if (!n) return;
    startJob({ mode: 'queue', total: n });
  };

  /* ---------- toast ---------- */
  let tt; function toast(t, ok) {
    $('#toastTxt').textContent = t; const el = $('#toast'); el.classList.toggle('ok', !!ok);
    el.classList.remove('show'); void el.offsetWidth; el.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => el.classList.remove('show'), 3000);
  }

  function renderAll(anim, enterIds) { renderQueue(enterIds); renderPresets(); renderPreview(anim); renderInspector(anim); }

  /* ---------- janela ---------- */
  let closeArmed = 0;
  if (REAL) {
    const w = TA.window.getCurrentWindow();
    $('#bMin').onclick = () => w.minimize();
    $('#bMax').onclick = () => w.toggleMaximize();
    $('#bClose').onclick = () => {
      if (S.job && Date.now() - closeArmed > 3000) { closeArmed = Date.now(); toast(L.quitWhileRendering); return; }
      if (S.job) inv('stop').catch(() => {});
      w.close();
    };
  }

  /* ---------- início ---------- */
  async function bootReal() {
    try {
      const st = await inv('get_state');
      S.presets = st.presets || [];
      if (st.settings && typeof st.settings === 'object') Object.assign(S.set, st.settings);
      else if ((navigator.language || '').toLowerCase().startsWith('pt')) S.set.lang = 'pt'; // primeira vez: idioma do Windows
      if (!presetOf(S.set.defaultPreset) && S.presets[0]) S.set.defaultPreset = S.presets[0].id;
      S.engine = Object.assign(S.engine, st.engine); S.version = st.version;
      if (!st.engine.ffmpeg) S.engine.status = 'missing';
    } catch (e) { console.error(e); }
    applyTheme(); applyLang(); renderAll();
    requestAnimationFrame(() => inv('ready').catch(() => {}));
    if (S.engine.status === 'missing') toast(L.ffmpegMissing);

    let batch = []; let batchTimer = 0; let firstNew = null;
    on('scan-start', (p) => { if (p.count > 2) toast(L.scanning(p.count)); });
    on('item-added', (p) => {
      const pid = presetOf(S.set.defaultPreset) ? S.set.defaultPreset : S.presets[0].id;
      const q = { id: p.id, path: p.path, file: p.file, dir: p.dir, src: mapSrc(p.info), preset: pid, cfg: clone(presetOf(pid)), status: 'ready', thumb: null };
      S.queue.push(q); batch.push(q.id); if (firstNew == null) firstNew = q.id;
      clearTimeout(batchTimer);
      batchTimer = setTimeout(() => {
        const ids = batch; batch = [];
        if (S.sel == null && firstNew != null) { selectOnly(firstNew); S.t = 0.15; }
        firstNew = null; renderAll(true, ids);
        setTimeout(() => $('#queue').smoothTo(1e6), 60);
      }, 60);
    });
    on('item-thumb', (p) => { const q = itemOf(p.id); if (!q) return; q.thumb = p.thumb; patchItem(q);
      if (S.sel === q.id) $$('.stage .frame img').forEach((img) => { if (!img.getAttribute('src')) img.src = p.thumb; }); });
    on('scan-done', (p) => {
      if (p.error === 'ffmpeg-missing') { toast(L.ffmpegMissing); return; }
      const errs = (p.errors || []).length;
      if (!p.added) toast(errs ? L.unreadable(errs) : L.noVideosFound);
      else if (p.root) toast(L.folderAdded(p.root, p.added) + (errs ? ' · ' + L.unreadable(errs) : ''), true);
      else toast(L.added(p.added) + (errs ? ' · ' + L.unreadable(errs) : ''), true);
    });
    on('render-progress', (p) => {
      const q = itemOf(p.id); if (!q || q.status !== 'running') return;
      q.p = p.p; q.speed = p.speed; q.mode = p.mode; q.eta = p.eta; const it = $(`.item[data-id="${q.id}"]`);
      if (it) { it.querySelector('.prog').style.setProperty('--p', q.p); const st = it.querySelector('.state'); if (st) { st.textContent = runTxt(q); st.title = p.mode === 'cpu' ? L.cpuDecode : ''; } }
      updateFill();
    });
    on('drag', (p) => $('#queueCard').classList.toggle('drag-over', !!p.over));
    on('engine', (p) => {
      Object.assign(S.engine, p); renderQueue(); renderSheetIfOpen();
      if (p.status === 'cpu') toast(L.cpuWarn);
    });
    on('update-progress', (p) => { if (p.total) { S.updating = Math.round(p.done / p.total * 100); renderUpdateBtn(); } });
    setTimeout(() => checkUpdate(false), 4000);
  }

  if (REAL) bootReal();
  else {
    applyTheme(); applyLang();
    if (qs.get('sel')) selectOnly(qs.get('sel') === 'none' ? null : +qs.get('sel'));
    if (qs.get('multi')) qs.get('multi').split(',').forEach((id) => S.picked.add(+id));
    if (qs.get('empty')) { S.queue = []; selectOnly(null); }
    if (qs.get('open')) qs.get('open').split(',').forEach((k) => { S.open[k] = true; });
    if (qs.get('fold')) S.set.foldPresets = true;
    if (qs.get('update')) S.update = { version: '0.2.0' };
    renderAll(); setT(S.t, true);
    requestAnimationFrame(drawWave);
    if (qs.get('cmp')) { S.cmp = true; renderPreview(); }
    if (qs.get('sheet')) openSheet(true);
    if (qs.get('folder')) setTimeout(addFolder, 300);
    if (qs.get('run')) setTimeout(() => $('#bRender').click(), 50);
    renderUpdateBtn();
  }
  addEventListener('resize', drawWave);
})();
