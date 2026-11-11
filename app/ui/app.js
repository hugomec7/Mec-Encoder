// Mec Encoder — lógica da interface
// Roda de dois jeitos: dentro do app (Tauri, motor de verdade) ou no navegador (modo demonstração).
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  // Arrastar com o mouse: só enquanto o botão está apertado. Termina ao soltar, se o Windows cancelar
  // o clique (ex.: arrastar de imagem) ou se um movimento chegar sem botão apertado.
  function dragPtr(el, e, move, end) {
    let done = false;
    try { el.setPointerCapture(e.pointerId); } catch {}
    const stop = () => {
      if (done) return; done = true;
      ['pointermove', 'pointerup', 'pointercancel', 'lostpointercapture'].forEach((t) => el.removeEventListener(t, t === 'pointermove' ? mv : stop));
      try { el.releasePointerCapture(e.pointerId); } catch {}
      if (end) end();
    };
    const mv = (ev) => { if (ev.pointerId !== e.pointerId) return; if (ev.buttons === 0) { stop(); return; } move(ev); };
    el.addEventListener('pointermove', mv);
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((t) => el.addEventListener(t, stop));
    return stop;
  }
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const root = document.documentElement;
  const qs = new URLSearchParams(location.search);
  /* idiomas: nome no próprio idioma e o formato de números (vírgula ou ponto) */
  const LANGS = [['en', 'English', 'en-US'], ['pt', 'Português', 'pt-BR'], ['es', 'Español', 'es-ES'], ['fr', 'Français', 'fr-FR'], ['de', 'Deutsch', 'de-DE'],
    ['it', 'Italiano', 'it-IT'], ['ru', 'Русский', 'ru-RU'], ['ja', '日本語', 'ja-JP'], ['ko', '한국어', 'ko-KR'], ['zh', '简体中文', 'zh-CN']];
  // primeira vez: o idioma do Windows, se o app tiver
  function sysLang() { const n = (navigator.language || 'en').toLowerCase().slice(0, 2); return LANGS.some((l) => l[0] === n) ? n : 'en'; }
  const locale = () => (LANGS.find((l) => l[0] === S.set.lang) || LANGS[0])[2];
  const decComma = () => (1.5).toLocaleString(locale()).includes(',');
  const TA = window.__TAURI__;
  const REAL = !!TA;
  const inv = (cmd, args) => TA.core.invoke(cmd, args);
  const on = (ev, cb) => TA.event.listen(ev, (e) => cb(e.payload));

  const COLORS = { blue: 'var(--blue)', orange: 'var(--orange)', green: 'var(--green)', purple: 'var(--purple)',
    teal: 'var(--teal)', yellow: 'var(--yellow)', pink: 'var(--pink)', indigo: 'var(--indigo)', red: 'var(--red)' };
  const PALETTE = Object.keys(COLORS);
  const ICONS = {
    image: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2.2" y="3" width="11.6" height="10" rx="2"/><circle cx="6" cy="6.6" r="1.1"/><path d="M13.6 10.6l-3.2-3.1L4 13"/></svg>',
    again: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 8a5 5 0 1 1-1.6-3.7"/><path d="M13 2.8v2.8h-2.8"/></svg>',
    dup: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><rect x="5.2" y="5.2" width="8" height="8" rx="1.8"/><path d="M10.8 5.2V4a1.6 1.6 0 0 0-1.6-1.6H4A1.6 1.6 0 0 0 2.4 4v5.2A1.6 1.6 0 0 0 4 10.8h1.2"/></svg>',
    note: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 12.2V3.4l7-1.4v8.6"/><circle cx="4.3" cy="12.2" r="1.8" fill="currentColor"/><circle cx="11.3" cy="10.6" r="1.8" fill="currentColor"/></svg>',
    info: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><circle cx="8" cy="8" r="6.3"/><path d="M8 7.3v3.9"/><circle cx="8" cy="5" r=".4" fill="currentColor"/></svg>',
    clock: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="8" cy="8" r="6"/><path d="M8 4.8V8l2.2 1.4"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="6.5" y="2.5" width="11" height="19" rx="3"/><path d="M10.5 18.5h3"/></svg>',
    hdr: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor"/></svg>',
    proxy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="4"/><rect x="7.5" y="10.5" width="6" height="6" rx="1.5" fill="currentColor"/></svg>',
    camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5A2.5 2.5 0 0 1 5.5 6H7l1.5-2h7L17 6h1.5A2.5 2.5 0 0 1 21 8.5v9a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z"/><circle cx="12" cy="13" r="3.5"/></svg>',
    meta: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 15.5c0-4 2-8 4.3-8 3.4 0 4.6 9 7.6 9 1.8 0 2.6-1.6 2.6-3.6 0-3.3-1.7-5.4-3.6-5.4-2.6 0-4.3 4.2-5.6 6.4-1.2 2-2.1 2.6-3.2 2.6C4.8 16.5 4 16.2 4 15.5z"/></svg>',
    cut: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="4.2" cy="11.8" r="2"/><circle cx="11.8" cy="11.8" r="2"/><path d="M5.6 10.4L12 2.5M10.4 10.4L4 2.5"/></svg>',
    power: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M8 2v5.5"/><path d="M4.6 4.3a5 5 0 1 0 6.8 0"/></svg>',
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
    play: '<path d="M5 3.3v9.4c0 .4.4.6.7.4l7.1-4.7a.5.5 0 0 0 0-.8L5.7 2.9c-.3-.2-.7 0-.7.4z"/>',
    pause: '<rect x="4" y="3" width="2.4" height="10" rx=".8"/><rect x="9.6" y="3" width="2.4" height="10" rx=".8"/>',
  };

  const demo = (!REAL && window.MEC_DEMO) || { presets: [], queue: [], settings: {} };
  const S = {
    presets: demo.presets,
    queue: demo.queue.map((q) => Object.assign(q, { cfg: clone(demo.presets.find((p) => p.id === q.preset)) })),
    set: Object.assign({ lang: sysLang(), theme: 'studio', lastDark: 'studio', defaultPreset: demo.presets[0] && demo.presets[0].id,
      clearWhenDone: true, notify: true, sound: true, foldPresets: false, parallel: 2 }, demo.settings),
    audioDefaults: REAL ? [] : (demo.audioDefaults || []), sel: REAL ? null : 2, picked: new Set(REAL ? [] : [2]), anchor: null, editPreset: null, cmp: false, job: null, playing: false, t: REAL ? 0 : .31,
    open: { video: true }, engine: { status: REAL ? 'checking' : 'nvenc', gpu: REAL ? null : 'NVIDIA GeForce RTX' },
    version: '0.1.0', update: null,
  };
  const presetOf = (id) => S.presets.find((p) => p.id === id);
  // presets antigos (ou da demonstração) sem os campos novos da Saída
  function normPreset(p) {
    if (p && p.output) { if (!p.output.folder) p.output.folder = { on: false, text: '' }; if (p.output.keepTree === undefined) p.output.keepTree = true; }
    return p;
  }
  S.presets.forEach(normPreset); S.queue.forEach((q) => normPreset(q.cfg));
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
    S.set.theme = t; if (t === 'dark' || t === 'oled' || t === 'studio') S.set.lastDark = t;
    saveSettings(); applyTheme(true);
  }
  $('#bAppMenu').dataset.menu = '1';
  const REPO_URL = 'https://github.com/hugomec7/Mec-Encoder';
  function themeMenu(at) {
    openMenu(at, [['system', L.system], ['light', L.light], ['dark', L.dark], ['oled', L.oled], ['studio', L.studio]]
      .map(([v, t]) => ({ label: t, value: v, sel: S.set.theme === v, icon: ICONS.theme })), (v) => setTheme(v));
  }
  $('#bAppMenu').onclick = (e) => {
    const btn = e.currentTarget;
    openMenu(btn, [
      { label: L.settings + '…', value: 'settings', icon: ICONS.gear },
      { label: L.theme, value: 'theme', icon: ICONS.theme },
      { label: L.checkUpdates, value: 'update', icon: ICONS.down },
      { label: L.news, value: 'news', icon: ICONS.star },
      { sep: true },
      { label: `${L.version} ${S.version}`, value: 'about', icon: ICONS.info },
    ], (v) => {
      if (v === 'settings') openSheet(true);
      else if (v === 'theme') setTimeout(() => themeMenu(btn), 0);
      else if (v === 'update') checkUpdate(true);
      else if (v === 'news') openNews(true);
      else if (v === 'about') { if (REAL) inv('open_url', { url: REPO_URL }).catch(() => {}); else window.open(REPO_URL, '_blank'); }
    });
  };
  /* ---------- idioma ---------- */
  function applyLang() {
    // o que faltar no idioma escolhido vem do inglês
    const en = window.MEC_I18N.en; const tr = window.MEC_I18N[S.set.lang] || {};
    L = Object.assign({}, en, tr);
    ['act', 'errs', 'colors', 'tagDesc', 'afterOn', 'dlErrs'].forEach((k) => { L[k] = Object.assign({}, en[k], tr[k]); });
    root.lang = locale();
    const txt = { lQueue: L.queue, bClearDone: L.clearDone, lDropTitle: L.dropTitle, lDropSub: L.dropSub,
      lCompare: L.compare, lPresets: L.presets, bManage: L.manage, lModified: L.modified,
      bSavePreset: L.saveToPreset, lEst: L.estSize, bDiscard: L.discard, lSettings: L.settings, bDone: L.done, lDropAll: L.dropAll, lPvEmpty: L.pvEmpty };
    Object.entries(txt).forEach(([id, t]) => { const el = document.getElementById(id); if (el) el.textContent = t; });
    $('#bMin').title = L.minimize; $('#bMax').title = L.maximize; $('#bClose').title = L.close;
    $('#bSetAll').title = L.setAll; $('#bFoldPresets').title = L.presetsFold; $('#bAdd').title = L.addVideos;
    $('#bIn').title = kf(L.markIn); $('#bOut').title = kf(L.markOut); $('#bCut').title = kf(L.newCut);
    $('#lIn').textContent = L.inLbl; $('#lOut').textContent = L.outLbl; $('#lNewCut').textContent = L.newCutLbl; $('#lOpenCut').textContent = L.openCutLbl;
    $('#bOpenCut').title = kf(L.openCutter); $('#lCutter').textContent = L.cutter; $('#lCuts').textContent = L.cutsTitle;
    $('#bCutCancel').textContent = L.cancel; $('#bCutDone').textContent = L.conclude; $('#bClearCuts').textContent = L.clearCuts;
    if (S.plReady) { renderPlayUi(); applyVol(); }
    $('#lCutSplit').textContent = L.cutSplitBtn; $('#lCutJoin').textContent = L.cutJoinBtn; $('#cutKeys').innerHTML = kf(L.cutKeysTxt); $('#tlHint').textContent = kf(L.tlHint);
    renderRenderBtn(); renderUpdateBtn(); if ($('#bAfter')) renderAfter();
    $('#tConv').textContent = L.tabConvert; $('#tDl').textContent = L.tabDownload;
    if (S.view === 'dl') { dlRenderSide(); dlRender(); }
  }

  /* ---------- mídia ---------- */
  const secs = (tc) => { const [h, m, s, f] = tc.split(':').map(Number); return h * 3600 + m * 60 + s + f / 60; };
  const num = (n, d = 1) => Number(n || 0).toLocaleString(locale(), { maximumFractionDigits: d });
  const fmtMB = (mb) => mb >= 1000 ? num(mb / 1000, 2) + ' GB' : mb >= 10 ? Math.round(mb) + ' MB' : mb >= 1 ? num(mb, 1) + ' MB' : Math.max(1, Math.round(mb * 1000)) + ' KB';
  const fmtK = (k) => num(k / 1000) + ' Mb/s';
  const fpsTxt = (v) => decComma() ? String(v).replace('.', ',') : String(v).replace(',', '.');
  // "Original" no FPS: padrão mais próximo do arquivo (igual ao motor): iPhone 59,93 VFR → 60; FX30 → 59,94
  const STD_FPS = [23.976, 24, 25, 29.97, 30, 48, 50, 59.94, 60, 119.88, 120];
  function srcFps(src) {
    const pick = (f) => { if (!(f > 0)) return null; const s = STD_FPS.reduce((a, b) => (Math.abs(b - f) < Math.abs(a - f) ? b : a)); return Math.abs(s - f) / s < 0.01 ? String(s) : null; };
    const avg = parseFloat(String(src.fps).replace(',', '.'));
    return pick(src.fpsNom) || pick(avg) || String(avg || 59.94);
  }
  // valor que vai sair (resolve as opções "Original"); null = depende do arquivo
  const fpsOut = (c, src) => (c.fps.value === 'source' ? (src ? srcFps(src) : null) : c.fps.value);
  const bitsOut = (c, src) => (c.bits ? c.bits : src ? (src.bits >= 10 ? 10 : 8) : null);
  // codec / croma / formato "Original" (igual ao motor)
  const srcIs264 = (src) => (src.codecId ? src.codecId === 'h264' : /264|AVC|XAVC S(?!\w)/i.test(src.codec));
  const codecOut = (c, src) => (c.codec === 'source' ? (src ? (srcIs264(src) ? 'h264' : 'h265') : null) : c.codec);
  const chromaOut = (c, src) => { const v = c.chroma || '420'; return v === 'source' ? (src ? (/422|p210|nv16/.test(src.pix || '') || src.chroma === '422' ? '422' : '420') : null) : v; };
  const extOut = (c, file) => { const v = c.container || 'mp4'; return v === 'source' ? (/\.mov$/i.test(file || '') ? 'mov' : 'mp4') : v; };
  // AAC "Original" (igual ao motor): kb/s das faixas escolhidas (64–320) e a taxa do arquivo
  function aacOut(a, src) {
    const aud = (src && src.aud) || []; const n = Math.max(1, aud.length);
    const t = (i) => aud[Math.min(Math.max((a.tracks[i] || 1), 1), n) - 1];
    let kbps = a.kbps;
    if (!kbps) {
      if (!aud.length) kbps = null;
      else { const sum = ((t(0) || {}).kbps || 0) + (a.channels === 'stereo' && a.tracks[0] !== a.tracks[1] ? ((t(1) || {}).kbps || 0) : 0); kbps = sum ? Math.min(320, Math.max(64, sum)) : 256; }
    }
    const r0 = (t(0) || {}).rate;
    const rate = a.rate === 0 ? (aud.length ? ([32000, 44100, 48000, 88200, 96000].includes(r0) ? r0 : 48000) : null) : a.rate === 44100 ? 44100 : 48000;
    return { kbps, rate };
  }
  const khz = (r) => fpsTxt(String(r / 1000)) + ' kHz';
  const isBlackwell = () => /RTX\s*(PRO\s*)?5\d{3}|BLACKWELL/i.test(S.engine.gpu || '');
  // vai pelo x264/x265 (CPU) porque a NVENC desta placa não grava 4:2:2 nem H.264 10-bit?
  const cpuEncode = (c, src) => S.engine.status === 'nvenc' && !isBlackwell() && (chromaOut(c, src) === '422' || (codecOut(c, src) === 'h264' && bitsOut(c, src) === 10));
  const bitsTxt = (c, src) => { const b = bitsOut(c, src); return b ? b + '-bit' : L.sourceBits; };
  const fpsCfrTxt = (c, src) => { const f = fpsOut(c, src); return (f ? fpsTxt(f) : L.source) + ' CFR'; };
  const pad = (n) => String(n).padStart(2, '0');
  function tc(seconds, fps = 60) {
    const s = Math.max(0, seconds); const ss = Math.floor(s); const f = Math.floor((s - ss) * Math.round(fps || 60));
    return [Math.floor(ss / 3600), Math.floor(ss / 60) % 60, ss % 60, f].map(pad).join(':');
  }
  const CODECS = { png: 'PNG', mjpeg: 'JPG', webp: 'WebP', bmp: 'BMP', tiff: 'TIFF', gif: 'GIF', hevc: 'HEVC', h264: 'H.264', prores: 'ProRes', av1: 'AV1', vp9: 'VP9', mpeg2video: 'MPEG-2', dnxhd: 'DNxHD', mjpeg: 'MJPEG' };
  // MediaInfo do Rust → formato usado pela interface
  function mapSrc(info) {
    const v = info.video || {};
    return {
      w: v.width, h: v.height, codec: CODECS[v.codec] || String(v.codec || '?').toUpperCase(), bits: v.bitDepth || 8,
      fps: (v.fps || v.fpsNominal || 0).toFixed(2).replace(/\.?0+$/, ''), fpsNum: v.fps || v.fpsNominal || 60, fpsNom: v.fpsNominal || 0, vfr: !!v.vfr,
      dur: tc(info.duration, v.fpsNominal || v.fps), durS: info.duration, kbps: v.bitrateKbps || info.bitrateKbps || 0,
      audio: (info.audio || []).length, hdr: v.hdr || false, rot: v.rotation || 0, mb: (info.sizeBytes || 0) / 1e6,
      codecId: v.codec || '', pix: v.pixFmt || '', ext: String(info.path || '').split('.').pop().toLowerCase(), tc: info.timecode || '',
      pcm: (info.audio || []).some((a) => String(a.codec).startsWith('pcm_')),
      aud: (info.audio || []).map((a) => ({ kbps: a.bitrateKbps || 0, rate: a.sampleRate || 48000, ch: a.channels || 2, codec: a.codec || '', bits: a.bits || 0 })),
      audioOnly: !info.video, isImage: !!info.isImage,
    };
  }
  // forma de onda mais detalhada em arquivos longos (para o zoom)
  const waveBars = (q) => clamp(Math.round((q.src.durS || 60) * 60), 600, 8000);
  const fullDur = (q) => q.src.durS || secs(q.src.dur);
  // duração que vai sair: o trecho marcado ou o arquivo inteiro
  // trechos marcados [[início, fim], ...] em segundos (vazio = arquivo inteiro)
  const cutsOf = (q) => (q && q.cuts && q.cuts.length ? q.cuts : null);
  const cutsDur = (q) => (cutsOf(q) || []).reduce((s, c) => s + c[1] - c[0], 0);
  const durOf = (q) => (cutsOf(q) ? cutsDur(q) : fullDur(q));
  // proporção escolhida: "9:16" → 0,5625; null = Original
  const ratioOf = (c) => { const m = /^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/.exec(c.aspect || ''); return m ? +m[1] / +m[2] : null; };
  const ev = (x) => Math.max(2, Math.round(x / 2) * 2);
  function outDims(src, cfg) {
    let { w, h } = src;
    if ((cfg.rotate || 0) % 180 === 90) [w, h] = [h, w];
    // proporção: cortar (preenche) ou barras (nada é cortado), igual ao motor
    const r = ratioOf(cfg);
    if (r) { const pad = cfg.aspectMode === 'pad'; if ((w / h > r) !== pad) { w = pad ? ev(h * r) : Math.min(w, ev(h * r)); h = ev(h); } else { h = pad ? ev(w / r) : Math.min(h, ev(w / r)); w = ev(w); } }
    if (cfg.scale === '50') { w /= 2; h /= 2; } else if (cfg.scale === '25') { w /= 4; h /= 4; }
    else if (cfg.scale === '1080') { const s = Math.min(w, h); if (s > 1080) { const k = 1080 / s; w *= k; h *= k; } }
    else if (cfg.scale === 'custom') {
      const cw = +cfg.customW || 0, ch = +cfg.customH || 0;
      if (cw && ch && !r) { w = cw; h = ch; } else if (cw) { h = cw * h / w; w = cw; } else if (ch) { w = ch * w / h; h = ch; }
    }
    return { w: Math.max(2, Math.round(w / 2) * 2), h: Math.max(2, Math.round(h / 2) * 2) };
  }
  const autoLevel = (c) => c.bitrate.level || (c.scale === 'source' ? 'high' : 'light');
  function videoKbps(src, cfg) {
    if (cfg.bitrate.mode === 'manual') return cfg.bitrate.kbps;
    if (cfg.bitrate.mode === 'source') return src.kbps || 20000;
    // Auto: o nível muda bastante o tamanho (Alta ≈ 100%, Equilibrada ≈ 60%, Leve ≈ 35%)
    const k = { high: 1, balanced: 0.6, light: 0.35 }[autoLevel(cfg)] || 1;
    const o = outDims(src, cfg); return Math.round(o.w * o.h * 60 * 0.07 * k / 1000 / 100) * 100;
  }
  const isAudioP = (c) => c && c.kind === 'audio';
  const isImageP = (c) => c && c.kind === 'image';
  const IEXT = { jpg: 'jpg', png: 'png', webp: 'webp' };
  const IFMT = { jpg: 'JPG', png: 'PNG', webp: 'WebP' };
  // o que um preset de imagem vai gerar: "JPG · 90% · 400 × 300"
  function imageOutTxt(c, src) {
    const im = c.image || { format: 'jpg', quality: 90 };
    const q = im.format === 'png' ? null : im.format === 'webp' && im.lossless ? L.lossless : (im.quality || 90) + '%';
    const d = src && src.w ? outDims(src, c) : null;
    return [IFMT[im.format] || 'JPG', q, d ? `${d.w} × ${d.h}` : null].filter(Boolean).join(' · ');
  }
  const ACODEC = { wav: 'WAV', mp3: 'MP3', aac: 'AAC', flac: 'FLAC', copy: null };
  const AEXT = { wav: 'wav', mp3: 'mp3', aac: 'm4a', flac: 'flac' };
  const srcAud = (src) => (src && src.aud && src.aud[0]) || null;
  // o que um preset de áudio vai gerar: "MP3 · 320 kb/s · 44,1 kHz"
  function audioOutTxt(c, src) {
    const a = c.audio; const s0 = srcAud(src);
    if (a.codec === 'copy') return L.copy;
    const rate = a.rate || (s0 ? (a.codec === 'mp3' && s0.rate > 48000 ? 48000 : s0.rate) : null);
    const q = a.codec === 'mp3' || a.codec === 'aac' ? (a.kbps ? a.kbps + ' kb/s' : s0 && s0.kbps ? Math.min(320, Math.max(64, s0.kbps)) + ' kb/s' : L.source)
      : (a.bits ? a.bits + '-bit' : s0 ? ((s0.bits >= 24 ? 24 : 16) + '-bit') : L.source);
    return [ACODEC[a.codec], q, rate ? khz(rate) : null].filter(Boolean).join(' · ');
  }
  function audioKbps(q) {
    const a = q.cfg.audio; const s0 = srcAud(q.src) || { rate: 48000, ch: 2, bits: 16, kbps: 256 };
    const rate = a.rate || s0.rate || 48000; const ch = a.channels === 'mono' ? 1 : a.channels === 'stereo' ? 2 : (s0.ch || 2);
    const bits = a.bits || (s0.bits >= 24 ? 24 : 16);
    if (a.codec === 'wav') return rate * bits * ch / 1000;
    if (a.codec === 'flac') return rate * bits * ch / 1000 * 0.6;
    if (a.codec === 'copy') return s0.kbps || 256;
    return a.kbps || Math.min(320, Math.max(64, s0.kbps || 256));
  }
  const imageMB = (q) => { const d = outDims(q.src, q.cfg); const im = q.cfg.image || {}; const px = d.w * d.h;
    return px * (im.format === 'png' ? 1.6 : (im.format === 'webp' ? 0.6 : 1) * (im.lossless ? 1.2 : 0.08 + (im.quality || 90) / 100 * 0.35)) / 1e6; };
  const estMB = (q) => (isImageP(q.cfg) ? imageMB(q) : (isAudioP(q.cfg) ? audioKbps(q) : videoKbps(q.src, q.cfg) + (q.cfg.audio.codec === 'copy' ? 256 : q.cfg.audio.kbps || 256)) * durOf(q) / 8 / 1000);
  const warnings = (q) => (q.src.hdr && !q.cfg.hdrToSdr ? [L.hdrMismatch(q.src.hdr)] : []);
  const codecName = (c) => (c === 'h265' ? 'H.265' : c === 'h264' ? 'H.264' : L.source);
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
  const thumbHtml = (q) => q.src.isImage && !q.thumb && !REAL ? `<i class="thumb-audio">${ICONS.image}</i>` : q.src.audioOnly ? `<i class="thumb-audio">${ICONS.note}</i>` : q.thumb ? `<img src="${q.thumb}" alt="">` : REAL ? '<i class="thumb-ph"></i>' : scene(q.hue, q.src.h > q.src.w);

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

  /* ---------- dica do ⓘ (fixa na janela, nunca cortada pelo painel) ---------- */
  const tip = document.createElement('div'); tip.id = 'tip'; tip.setAttribute('role', 'tooltip'); document.body.append(tip);
  const showTip = (el) => {
    tip.textContent = el.dataset.tip; tip.classList.add('show');
    const r = el.getBoundingClientRect(); const w = tip.offsetWidth; const h = tip.offsetHeight;
    tip.style.left = clamp(r.left + r.width / 2 - w / 2, 8, innerWidth - w - 8) + 'px';
    tip.style.top = (r.top - h - 8 < 8 ? r.bottom + 8 : r.top - h - 8) + 'px';
  };
  const hideTip = () => tip.classList.remove('show');
  document.addEventListener('pointerover', (e) => { const i = e.target.closest('[data-tip]'); if (i) showTip(i); else hideTip(); });
  document.addEventListener('focusin', (e) => { const i = e.target.closest('[data-tip]'); if (i) showTip(i); });
  document.addEventListener('focusout', hideTip);

  /* ---------- menu suspenso / de contexto ---------- */
  const menu = $('#menu'); let menuPick = null;
  let menuOwner = null;
  function openMenu(at, items, onPick) {
    // clicar de novo na mesma caixa fecha o menu
    if (at instanceof Element && menuOwner === at && menu.classList.contains('show')) { closeMenu(); return; }
    menuOwner = at instanceof Element ? at : null;
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
  const closeMenu = () => { menu.classList.remove('show'); menuOwner = null; };
  menu.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { closeMenu(); menuPick && menuPick(+b.dataset.i); } });
  document.addEventListener('pointerdown', (e) => { if (!e.target.closest('#menu') && !e.target.closest('[data-menu]')) closeMenu(); });
  document.addEventListener('contextmenu', (e) => { if (!e.target.closest('input')) e.preventDefault(); });
  const defaultAudioId = () => (presetOf(S.set.defaultAudioPreset) && isAudioP(presetOf(S.set.defaultAudioPreset)) ? S.set.defaultAudioPreset : (S.presets.find(isAudioP) || S.presets[0]).id);
  const defaultImageId = () => (isImageP(presetOf(S.set.defaultImagePreset)) ? S.set.defaultImagePreset : (S.presets.find(isImageP) || S.presets[0]).id);
  const presetItems = (cur) => S.presets.map((p) => ({ label: p.name, value: p.id, color: COLORS[p.color] || COLORS.blue, sel: p.id === cur }));

  /* ---------- fila ---------- */
  const qList = $('#qList');
  const audioSrcTxt = (src) => { const a = srcAud(src) || {}; return [String(a.codec || '').replace(/^pcm_.*/, 'PCM').toUpperCase(), a.rate ? khz(a.rate) : null, a.ch ? L.nch(a.ch) : null].filter(Boolean).join(' · '); };
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
      : q.status === 'err' ? `<span class="state err">${L.error}</span>`
      : q.queued ? `<span class="state">${L.busy}</span>`
      : `<span class="state tnum">${fmtMB(estMB(q))}</span>`;
    const dir = q.dir ? `<span class="dir">${ICONS.folder}${esc(q.dir.replace(/\//g, ' › '))}</span>` : '';
    const acts = (q.status === 'ready' || q.status === 'err' ? `<button class="a a-render" data-act="render" title="${q.status === 'err' ? L.retry : L.renderThis}">${q.status === 'err' ? ICONS.again : ICONS.playc}</button>` : '')
      + (q.status === 'err' ? `<button class="a" data-act="copyerr" title="${L.copyDetails}">${ICONS.copy}</button>` : '')
      + (q.status === 'done' ? `<button class="a" data-act="again" title="${L.renderAgain}">${ICONS.again}</button>` : '')
      + (cutterOk(q) && q.status !== 'done' ? `<button class="a" data-act="cut" title="${kf(L.openCutter)}">${ICONS.cut}</button>` : '')
      + `<button class="a" data-act="reveal" title="${q.status === 'done' ? L.showOutput : L.showInFolder}">${ICONS.reveal}</button>`
      + (q.status !== 'running' ? `<button class="a" data-act="remove" title="${L.remove}">${ICONS.x}</button>` : '');
    return `<div class="item ${isPicked(q.id) ? 'sel' : ''} ${q.id === S.sel && S.picked.size > 1 ? 'primary' : ''} ${q.status === 'running' ? 'running' : ''} ${q.status === 'done' ? 'is-done' : ''} ${enterIds.includes(q.id) ? 'enter' : ''}" data-id="${q.id}" style="--d:${Math.min(8, Math.max(0, enterIds.indexOf(q.id))) * 60}ms">
        <div class="thumb">${thumbHtml(q)}${q.src.hdr ? '<span class="hdr">HDR</span>' : ''}</div>
        <div class="meta">
          <div class="name" title="${esc(q.path || q.file)}">${esc(q.file)}</div>
          ${q.status === 'err' ? `<div class="spec err-line" title="${esc(q.error || '')}">${esc(errText(q))}</div>` : `<div class="spec">${q.status === 'running' ? timeLine(q) : q.src.audioOnly ? `${dir}${audioSrcTxt(q.src)}` : q.src.isImage ? `${dir}${q.src.codec} · ${q.src.w}×${q.src.h}` : `${dir}${q.src.w}×${q.src.h} · ${q.src.codec} · ${fpsTxt(q.src.fps)} fps${q.src.vfr ? ' VFR' : ''}`}</div>`}
          <div class="row2"><span class="badge" style="--c:${c}"><i></i>${esc(p.name)}${same(q.cfg, p) ? '' : '*'}</span>${cutsOf(q) ? `<span class="trim-tag" title="${esc(cutTitle(q))}">${ICONS.cut}${q.cuts.length > 1 ? `${q.cuts.length} · ` : ''}${fmtDur(cutsDur(q))}${q.cuts.length > 1 && q.cutJoin ? ` · ${L.cutJoinShort}` : ''}</span>` : ''}
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
    $('#bClearDone').style.visibility = S.queue.length ? '' : 'hidden';
    const pend = pending();
    renderFoot();
    $('#tEta').textContent = S.engine.status === 'nvenc' ? 'NVENC' : S.engine.status === 'cpu' ? 'CPU' : '';
    $('#bRender').disabled = !S.queue.some((q) => q.status === 'ready' || q.status === 'err') && !S.job;
    saveQueue();
  }
  /* Fila salva: grava sozinha (queue.json) e volta ao abrir o app. O que estava renderizando volta como "pronto". */
  let tQueue = 0; let lastQueue = '';
  function saveQueue(now) {
    if (!REAL || !S.restored) return Promise.resolve();
    const data = S.queue.filter((q) => q.path).map((q) => ({ path: q.path, file: q.file, dir: q.dir || '', preset: q.preset, cfg: q.cfg,
      status: q.status === 'done' || q.status === 'err' ? q.status : 'ready', out: q.out || null, outMb: q.outMb || 0, took: q.took || 0,
      error: q.status === 'err' ? q.error || null : null, errCode: q.status === 'err' ? q.errCode || null : null, cuts: cutsOf(q), cutJoin: !!q.cutJoin }));
    const txt = JSON.stringify(data);
    clearTimeout(tQueue);
    if (txt === lastQueue) return Promise.resolve();
    const go = () => { lastQueue = txt; return inv('save_queue', { queue: data }).catch(() => {}); };
    if (now) return go();
    tQueue = setTimeout(go, 700); return Promise.resolve();
  }
  async function restoreQueue(saved) {
    if (!Array.isArray(saved) || !saved.length) { S.restored = true; return; }
    let res = [];
    try { res = await inv('restore_queue', { paths: saved.map((x) => x.path) }); } catch (e) { console.error(e); }
    let missing = 0; const ids = [];
    saved.forEach((x, i) => {
      const r = res[i];
      if (!r) { if (x.status !== 'done') missing++; return; }
      const src = mapSrc(r.info);
      const pid = presetOf(x.preset) ? x.preset : src.isImage ? defaultImageId() : src.audioOnly ? defaultAudioId() : presetOf(S.set.defaultPreset) ? S.set.defaultPreset : S.presets[0].id;
      const cfg = x.cfg && x.cfg.output ? normPreset(x.cfg) : clone(presetOf(pid));
      S.queue.push({ id: r.id, path: x.path, file: x.file, dir: x.dir || '', src, preset: pid, cfg, status: x.status === 'done' || x.status === 'err' ? x.status : 'ready',
        out: x.out || null, outMb: x.outMb || 0, took: x.took || 0, error: x.error || null, errCode: x.errCode || null, cuts: Array.isArray(x.cuts) ? x.cuts : Array.isArray(x.trim) ? [x.trim] : null, cutJoin: !!x.cutJoin, thumb: null, p: x.status === 'done' ? 1 : 0 });
      ids.push(r.id);
    });
    S.restored = true;
    if (ids.length && S.sel == null) { selectOnly(ids[0]); S.t = 0.15; }
    renderAll(true, ids);
    if (ids.length || missing) setTimeout(() => toast([ids.length ? L.queueRestored(ids.length) : null, missing ? L.queueMissing(missing) : null].filter(Boolean).join(' · '), !missing), 900);
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
    if (q.job && q.status !== 'done' && q.status !== 'err') { q.status = 'removed'; jobUpdate(q); }
    setTimeout(() => {
      const before = rects();
      S.queue = S.queue.filter((x) => x.id !== id); S.picked.delete(id);
      if (S.sel === id) S.sel = S.picked.size ? [...S.picked][0] : null;
      renderAll(); flip(before);
    }, 230);
  }
  // Renderizar de novo (ex.: testar outra configuração). O arquivo anterior fica; o novo ganha " (2)".
  function renderAgain(q) {
    Object.assign(q, { status: 'ready', p: 0, took: 0, speed: 0, eta: null, out: null, error: null, errCode: null, t0: 0 });
    renderQueue(); renderOne(q.id);
  }
  // Duplicar na fila: o mesmo arquivo, para renderizar com outro preset e comparar
  async function duplicateItem(q) {
    let id = Math.max(0, ...S.queue.map((x) => x.id)) + 1;
    if (REAL) { try { id = await inv('duplicate', { id: q.id }); } catch (e) { toast(String(e)); return; } }
    const c = Object.assign(clone({ ...q, thumb: null, wave: undefined }), { id, status: 'ready', p: 0, took: 0, out: null, error: null, errCode: null, queued: false, thumb: q.thumb, wave: q.wave });
    const before = rects();
    S.queue.splice(S.queue.indexOf(q) + 1, 0, c); selectOnly(id); renderAll(true, [id]); flip(before);
  }
  function itemAction(act, id) {
    const q = itemOf(id); if (!q) return;
    if (act === 'render') { if (q.status === 'err') { q.status = 'ready'; q.error = null; q.errCode = null; } renderOne(id); }
    else if (act === 'again') renderAgain(q);
    else if (act === 'cut') { selectOnly(id); renderAll(); openCutter(true); }
    else if (act === 'copyerr') copyErr(q);
    else if (act === 'dup') duplicateItem(q);
    else if (act === 'reveal') reveal(q);
    else if (act === 'remove') removeItem(id);
    else if (act === 'top') { const before = rects(); S.queue = [q, ...S.queue.filter((x) => x !== q)]; renderQueue(); flip(before); }
  }
  // Erros: o motor manda "código|detalhes"; a fila mostra uma frase clara e guarda os detalhes para copiar.
  function parseErr(e) {
    const s = String(e); const m = /^([a-z0-9-]+)\|([\s\S]*)$/.exec(s);
    return { code: m ? m[1] : L.errs[s] ? s : null, details: m ? m[2] : s };
  }
  const errText = (q) => (q.errCode && L.errs[q.errCode]) || String(q.error || '').split('\n').filter(Boolean).pop() || L.error;
  function copyErr(q) {
    const txt = [`Mec Encoder ${S.version}`, q.path || q.file, `Preset: ${(q.cfg && q.cfg.name) || ''}`, `GPU: ${S.engine.gpu || '-'} (${S.engine.status})`,
      `Error: ${q.errCode || 'unknown'}`, errText(q), '', q.error || ''].join('\n');
    const ok = () => toast(L.copied, true);
    const old = () => { const t = document.createElement('textarea'); t.value = txt; document.body.append(t); t.select(); try { document.execCommand('copy'); ok(); } catch {} t.remove(); };
    try { navigator.clipboard.writeText(txt).then(ok, old); } catch { old(); }
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
        if (act === 'render') list.forEach((x) => { if (x.status === 'err') { x.status = 'ready'; x.error = null; x.errCode = null; } renderOne(x.id, true); });
        if (act === 'remove') list.forEach((x) => removeItem(x.id));
        if (act === 'preset') openMenu({ x: e.clientX, y: e.clientY }, presetItems(null), (pid) => assignPicked(pid));
      });
      return;
    }
    openMenu({ x: e.clientX, y: e.clientY }, [
      ...(q.status === 'ready' || q.status === 'err' ? [{ label: q.status === 'err' ? L.retry : L.renderThis, value: 'render', icon: q.status === 'err' ? ICONS.again : ICONS.playc }] : []),
      ...(q.status === 'done' ? [{ label: L.renderAgain, value: 'again', icon: ICONS.again }] : []),
      ...(cutterOk(q) ? [{ label: kf(L.openCutter), value: 'cut', icon: ICONS.cut }] : []),
      ...(q.status === 'err' ? [{ label: L.copyDetails, value: 'copyerr', icon: ICONS.copy }] : []),
      { label: L.duplicate, value: 'dup', icon: ICONS.dup },
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

  $('#bClearDone').dataset.menu = '1';
  $('#bClearDone').onclick = (e) => {
    const done = S.queue.some((q) => q.status === 'done');
    openMenu(e.currentTarget, [
      ...(done ? [{ label: L.clearDoneItems, value: 'done', icon: ICONS.check }] : []),
      { label: L.clearAll, value: 'all', icon: ICONS.trash, danger: true },
    ], (v) => (v === 'done' ? clearDone(true) : clearAll()));
  };
  function clearAll() {
    const list = S.queue.filter((q) => q.status !== 'running'); if (!list.length) return;
    list.forEach((q) => { const el = $(`.item[data-id="${q.id}"]`); if (el) { el.style.transition = 'opacity .25s, transform .35s var(--ease)'; el.style.opacity = 0; el.style.transform = 'scale(.96)'; } });
    if (REAL) list.forEach((q) => inv('forget', { id: q.id }).catch(() => {}));
    setTimeout(() => {
      const before = rects(); S.queue = S.queue.filter((q) => q.status === 'running');
      S.picked = new Set([...S.picked].filter((id) => itemOf(id))); if (!selItem()) S.sel = S.picked.size ? [...S.picked][0] : null;
      renderAll(); flip(before); toast(L.clearedAll);
    }, 230);
  }
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

  function assign(q, pid) {
    if (q.src.audioOnly && !isAudioP(presetOf(pid))) { toast(L.needAudioPreset); return false; }
    if (q.src.isImage !== isImageP(presetOf(pid))) { toast(q.src.isImage ? L.needImagePreset : L.imagePresetOnlyImages); return false; }
    q.preset = pid; q.cfg = clone(presetOf(pid)); return true;
  }
  function assignPicked(pid) {
    const fits = (q) => (isAudioP(presetOf(pid)) || !q.src.audioOnly) && !!q.src.isImage === isImageP(presetOf(pid));
    const list = pickedItems().filter((q) => q.status !== 'running' && fits(q)); list.forEach((q) => assign(q, pid)); renderAll();
    list.forEach((q) => { const b = $(`.item[data-id="${q.id}"] .badge`); if (b) b.classList.add('bump'); });
    toast(L.assigned(presetOf(pid).name, list.length));
  }
  function assignAll(pid) {
    const list = pending().filter((q) => (isAudioP(presetOf(pid)) || !q.src.audioOnly) && !!q.src.isImage === isImageP(presetOf(pid))); list.forEach((q) => assign(q, pid)); renderAll();
    $$('.item:not(.is-done) .badge').forEach((b) => b.classList.add('bump'));
    toast(L.assigned(presetOf(pid).name, list.length));
  }

  /* ---------- presets ---------- */
  function describe(p) {
    if (isImageP(p)) return `<b>${esc(p.name)}:</b> ${imageOutTxt(p, null)} · ${L.imageOnlyDesc}`;
    if (isAudioP(p)) return `<b>${esc(p.name)}:</b> ${audioOutTxt(p, null)} · ${L.audioOnlyDesc}`;
    const parts = [codecName(p.codec) + ' ' + bitsTxt(p, null) + ((p.chroma || '420') === '420' ? '' : ' ' + (p.chroma === '422' ? '4:2:2' : L.sourceChroma)), p.scale === 'source' ? L.sourceRes : scaleTxt(p.scale),
      p.bitrate.mode === 'manual' ? fmtK(p.bitrate.kbps) + ' ' + p.bitrate.rc.toUpperCase() : p.bitrate.mode === 'source' ? L.bitrateSrc : L.bitrateAuto,
      p.fps.conform ? fpsCfrTxt(p, null) : null, p.hdrToSdr ? 'HDR → 709' : null,
      p.audio.codec === 'copy' ? L.audioCopied : `AAC ${p.audio.channels === 'stereo' ? L.stereoL : L.monoL}`].filter(Boolean);
    return `<b>${esc(p.name)}:</b> ${parts.join(' · ')}`;
  }
  /* lista de presets como no HandBrake: tudo em pastas recolhíveis. "Presets" é a pasta principal (presets soltos). */
  const parentOf = () => '';
  const leaf = (f) => f;
  function folderList() {
    const f = (S.set.folders || []).filter((x) => x && !x.includes('/'));
    S.presets.forEach((p) => { if (p.folder && !f.includes(p.folder)) f.push(p.folder); });
    return f;
  }
  const inside = (p, f) => p.folder === f;
  const pill = (p, selId) => `<button class="preset ${selId === p.id ? 'sel' : ''} ${isAudioP(p) || isImageP(p) ? 'is-audio' : ''}" data-id="${p.id}" style="--c:${COLORS[p.color] || COLORS.blue}"><i class="pdot"></i>${isAudioP(p) ? ICONS.note : isImageP(p) ? ICONS.image : ''}${esc(p.name)}</button>`;
  function folderHtml(f, selId, closed) {
    const list = S.presets.filter((p) => p.folder === f);
    return `<div class="pfolder ${closed[f] ? 'closed' : ''}" data-folder="${esc(f)}">
        <button class="pf-head" data-folder="${esc(f)}">${ICONS.chev}${ICONS.folder}<span class="pf-name">${esc(f)}</span><small>${list.length}</small></button>
        <div class="pf-body"><div class="pf-in"><div class="p-row" data-folder="${esc(f)}">${list.map((p) => pill(p, selId)).join('') || `<span class="pf-empty">${L.folderEmpty}</span>`}</div></div></div></div>`;
  }
  function renderPresets() {
    const t = target(); const selId = t.preset && t.preset.id; const closed = S.set.folderClosed || {};
    const loose = S.presets.filter((p) => !p.folder);
    $('#presets').innerHTML = `<div class="p-row" data-folder="">${loose.map((p) => pill(p, selId)).join('')}<button class="preset add" data-menu="1"><span class="ic">${ICONS.plus}</span>${L.newPreset}</button></div>`;
    $('#presetFolders').innerHTML = folderList().map((f) => folderHtml(f, selId, closed)).join('');
    $('#pfMainCount').textContent = loose.length;
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
  function newAudioPreset() {
    const base = clone(S.presets.find(isAudioP) || S.audioDefaults[0] || {});
    if (!base.audio) return;
    Object.assign(base, { kind: 'audio', id: uid(), name: L.newPresetName, color: PALETTE[S.presets.length % PALETTE.length], folder: '' });
    addPresets([base], false); editPreset(base.id, true);
  }
  function newImagePreset() {
    const base = clone(S.presets.find(isImageP) || (S.imageDefaults || [])[0] || {});
    if (!base.image) return;
    Object.assign(base, { kind: 'image', id: uid(), name: L.newPresetName, color: PALETTE[S.presets.length % PALETTE.length], folder: base.folder || '' });
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

  /* pastas e subpastas */
  function uniqueFolder(parent) {
    const f = folderList(); const base = parent ? parent + '/' : ''; let n = L.newFolder; let i = 2;
    while (f.includes(base + n)) n = `${L.newFolder} ${i++}`;
    return base + n;
  }
  function newFolder(parent) {
    const n = uniqueFolder(typeof parent === 'string' ? parent : '');
    S.set.folders = [...folderList(), n];
    if (parentOf(n)) S.set.folderClosed = Object.assign({}, S.set.folderClosed, { [parentOf(n)]: false });
    if (S.set.foldPresets) S.set.foldPresets = false;
    saveSettings(); renderPresets();
    setTimeout(() => renameFolder(n), 60);
  }
  function renameFolder(f) {
    const head = $(`.pf-head[data-folder="${CSS.escape(f)}"]`); if (!head) return;
    const span = head.querySelector('.pf-name');
    const input = document.createElement('input'); input.className = 'pf-input'; input.value = leaf(f); input.spellcheck = false;
    span.replaceWith(input); input.focus(); input.select();
    let done = false;
    const finish = (ok) => {
      if (done) return; done = true;
      const name = input.value.trim().replace(/\//g, '-');
      const v = (parentOf(f) ? parentOf(f) + '/' : '') + name;
      if (ok && name && v !== f && !folderList().includes(v)) {
        const move = (x) => (x === f ? v : x.startsWith(f + '/') ? v + x.slice(f.length) : x);
        S.set.folders = folderList().map(move);
        S.presets.forEach((p) => { if (p.folder) p.folder = move(p.folder); });
        if (S.draft && S.draft.folder) S.draft.folder = move(S.draft.folder);
        const c = {}; Object.entries(S.set.folderClosed || {}).forEach(([k, val]) => { c[move(k)] = val; }); S.set.folderClosed = c;
        saveSettings(); savePresets();
      }
      renderPresets();
    };
    input.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') finish(true); if (e.key === 'Escape') finish(false); });
    input.addEventListener('blur', () => finish(true));
    input.addEventListener('click', (e) => e.stopPropagation());
  }
  // Excluir pasta: os presets e subpastas de dentro sobem um nível (nada é apagado)
  function deleteFolder(f) {
    const up = parentOf(f); const move = (x) => (x === f ? up : x.startsWith(f + '/') ? (up ? up + '/' : '') + x.slice(f.length + 1) : x);
    S.presets.forEach((p) => { if (p.folder && inside(p, f)) p.folder = move(p.folder); });
    S.set.folders = folderList().filter((x) => x !== f).map(move).filter(Boolean);
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
      ...folderList().slice().sort().map((f) => ({ label: f.replace(/\//g, ' › '), value: f, sel: cur === f, icon: ICONS.folder })),
      { sep: true }, { label: L.newFolderMenu, value: '\u0000new', icon: ICONS.plus }],
      (v) => { if (v === '\u0000new') { const n = uniqueFolder(''); S.set.folders = [...folderList(), n]; saveSettings(); moveToFolder(pid, n); setTimeout(() => renameFolder(n), 60); } else moveToFolder(pid, v); });
  }
  function colorMenu(at, pid) {
    const p = (S.draft && S.draft.id === pid) ? S.draft : presetOf(pid);
    openMenu(at, PALETTE.map((k) => ({ label: L.colors[k], value: k, color: COLORS[k], sel: p.color === k })), (k) => {
      // a cor vale na hora (não espera "Salvar"), como o nome
      if (S.draft && S.draft.id === pid) S.draft.color = k;
      presetOf(pid).color = k; savePresets(); renderAll();
    });
  }

  function setAllFolders(closed) { const c = {}; folderList().forEach((f) => { c[f] = closed; }); S.set.folderClosed = c; S.set.foldPresets = closed; saveSettings(); renderPresets(); }
  $('#bManage').dataset.menu = '1';
  $('#bManage').onclick = (e) => openMenu(e.currentTarget, [
    { label: L.newPresetMenu, value: 'new', icon: ICONS.plus },
    { label: L.newFolderMenu, value: 'folder', icon: ICONS.folder },
    { label: L.collapseAll, value: 'collapse', icon: ICONS.chev },
    { label: L.expandAll, value: 'expand', icon: ICONS.chev },
    { sep: true },
    { label: L.importEnc, value: 'enc', icon: ICONS.down },
    { label: L.importJson, value: 'json', icon: ICONS.down },
    { label: L.exportPresets, value: 'export', icon: ICONS.up },
    { label: L.openPresetsFolder, value: 'open', icon: ICONS.reveal },
    { sep: true },
    { label: L.restoreDefaults, value: 'defaults', icon: ICONS.reset },
  ], (v) => ({ collapse: () => setAllFolders(true), expand: () => setAllFolders(false), new: () => newPreset(), folder: () => newFolder(''), enc: importEnc, json: importJson, export: exportPresets, open: openPresetsFolder, defaults: restoreDefaults }[v]()));

  const pressPreset = { justDropped: false };
  $('#inspector').addEventListener('click', (e) => {
    if (pressPreset.justDropped) { pressPreset.justDropped = false; return; }
    const fh = e.target.closest('.pf-head');
    if (fh) { const f = fh.dataset.folder; S.set.folderClosed = Object.assign({}, S.set.folderClosed, { [f]: !(S.set.folderClosed || {})[f] }); saveSettings(); renderPresets(); return; }
    const b = e.target.closest('.preset'); if (!b) return;
    if (b.classList.contains('add')) {
      openMenu(b, [{ label: L.newPresetMenu, value: 'new', icon: ICONS.plus }, { label: L.newAudioPreset, value: 'audio', icon: ICONS.note }, { label: L.newImagePreset, value: 'image', icon: ICONS.image }, { label: L.newFolderMenu, value: 'folder', icon: ICONS.folder }, { label: L.importEnc, value: 'enc', icon: ICONS.down }],
        (v) => (v === 'new' ? newPreset() : v === 'audio' ? newAudioPreset() : v === 'image' ? newImagePreset() : v === 'folder' ? newFolder('') : importEnc()));
      return;
    }
    const q = selItem();
    if (!q) { if (S.editPreset !== b.dataset.id) { S.editPreset = b.dataset.id; S.draft = null; } renderPresets(); renderInspector(true); return; }
    if (S.picked.size > 1) { assignPicked(b.dataset.id); return; }
    assign(q, b.dataset.id); renderAll(true);
    const badge = $(`.item[data-id="${q.id}"] .badge`); if (badge) badge.classList.add('bump');
  });
  $('#inspector').addEventListener('dblclick', (e) => { const fh = e.target.closest('.pf-head'); if (fh) renameFolder(fh.dataset.folder); });
  $('#inspector').addEventListener('contextmenu', (e) => {
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
  $('#inspector').addEventListener('pointerdown', (e) => {
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
  /* reprodução (o player fica mais abaixo): o vídeo tocando fica por cima do quadro da prévia */
  const PL = { on: false, q: null, plan: null, cur: null, map: null, mode: '', i: 0, rate: 1, seq: 0, hw: true, dt: 0, last: 0, prep: null };
  const vid = document.createElement('video');
  Object.assign(vid, { className: 'pv-vid', preload: 'auto', playsInline: true, crossOrigin: 'anonymous', disablePictureInPicture: true });
  // quem espera o quadro exato da agulha (ao pausar, o vídeo some quando ele chega)
  const pvWait = [];
  const flushStill = () => { while (pvWait.length) pvWait.shift()(); };
  const stillReady = (cb) => { pvWait.push(cb); if (!pvSt.out.busy) flushStill(); };
  /* Zoom na prévia: rodinha em cima do vídeo aproxima no ponto do mouse; arrastar anda; duplo clique volta.
     No "Comparar" os dois lados andam juntos. Com zoom a prévia vem em resolução maior. */
  S.pz = { z: 1, x: 0, y: 0 };
  const pzMax = () => (S.pz.z > 2.5 ? 3840 : S.pz.z > 1.2 ? 1920 : 960);
  function applyPz() {
    const { z, x, y } = S.pz; const tf = z > 1.001 ? `scale(${z}) translate(${-x * 100}%, ${-y * 100}%)` : '';
    $$('.stage .frame').forEach((f) => {
      f.classList.toggle('pz', z > 1.001);
      f.querySelectorAll('img.pv-img, video.pv-vid, svg.scene, .grade').forEach((el) => { el.style.transformOrigin = '0 0'; el.style.transform = tf; });
    });
    const st = $('.stage'); if (z > 1.001) st.dataset.zoom = `${z < 10 ? z.toFixed(1).replace('.', decComma() ? ',' : '.') : Math.round(z)}×`; else delete st.dataset.zoom;
  }
  function setPz(z, mx, my) {
    const o = S.pz; z = clamp(z, 1, 8);
    // o ponto da imagem embaixo do mouse continua embaixo do mouse
    const px = o.x + mx / o.z; const py = o.y + my / o.z;
    S.pz = { z, x: clamp(px - mx / z, 0, 1 - 1 / z), y: clamp(py - my / z, 0, 1 - 1 / z) };
    applyPz();
    const q = selItem(); if (q && REAL) requestFrames(q);
  }
  $('.stage').addEventListener('wheel', (e) => {
    const f = e.target.closest('.frame'); const q = selItem(); if (!f || !q || q.src.audioOnly) return;
    e.preventDefault();
    const r = f.getBoundingClientRect();
    setPz(S.pz.z * Math.exp(-e.deltaY * 0.0018), clamp((e.clientX - r.left) / r.width, 0, 1), clamp((e.clientY - r.top) / r.height, 0, 1));
  }, { passive: false });
  $('.stage').addEventListener('pointerdown', (e) => {
    // arrastar com o botão esquerdo ou com o do meio (rodinha) anda pela imagem
    const f = e.target.closest('.frame'); if (!f || S.pz.z <= 1.001 || (e.button !== 0 && e.button !== 1)) return;
    e.preventDefault();
    const r = f.getBoundingClientRect(); const x0 = e.clientX; const y0 = e.clientY; const o0 = { ...S.pz };
    f.classList.add('grabbing');
    dragPtr(f, e, (ev) => {
      const z = S.pz.z;
      S.pz = { z, x: clamp(o0.x - (ev.clientX - x0) / r.width / z, 0, 1 - 1 / z), y: clamp(o0.y - (ev.clientY - y0) / r.height / z, 0, 1 - 1 / z) };
      applyPz();
    }, () => f.classList.remove('grabbing'));
  });
  [$('.stage'), $('#timeline')].forEach((el) => {
    el.addEventListener('mousedown', (e) => { if (e.button === 1) e.preventDefault(); });
    // sem o "arrastar e soltar" do navegador nas imagens (ele prendia o arrastar da prévia)
    el.addEventListener('dragstart', (e) => e.preventDefault());
  });
  $('.stage').addEventListener('dblclick', (e) => { if (e.target.closest('.frame') && S.pz.z > 1.001) { S.pz = { z: 1, x: 0, y: 0 }; applyPz(); const q = selItem(); if (q && REAL) requestFrames(q); } });
  function requestPreview(q, out) {
    if (!REAL) return;
    const side = out ? 'out' : 'in'; const st = pvSt[side]; const fr = $(out ? '#frame' : '#frameIn');
    const t = fullDur(q) * S.t; const max = pzMax(); const key = JSON.stringify([q.id, out, Math.round(t * 30), out ? q.cfg : 0, max]);
    if (key === st.key) return; st.key = key;
    clearTimeout(st.timer); st.busy = true;
    st.timer = setTimeout(() => {
      const seq = ++st.seq; fr.classList.add('loading');
      const done = () => { if (seq !== st.seq) return; fr.classList.remove('loading'); st.busy = false; if (out) flushStill(); };
      inv('preview', { id: q.id, cfg: q.cfg, t, output: out, max }).then((img) => {
        if (seq !== st.seq) return;
        const el = fr.querySelector('img');
        // troca quando a imagem nova já está decodificada (sem piscar ao pausar)
        if (el) { const im = new Image(); im.onload = im.onerror = () => { if (seq === st.seq) { el.src = img; done(); } }; im.src = img; } else done();
      }).catch(done);
    }, 70);
  }
  // tocando: o vídeo já mostra a imagem; a prévia de quadros volta ao pausar
  const requestFrames = (q) => { if (q.src.audioOnly || PL.on) return; requestPreview(q, true); if (S.cmp) requestPreview(q, false); };
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
      if (!keepImg) fr.innerHTML = `<img class="pv-img" draggable="false" ${q.thumb ? `src="${q.thumb}"` : ''} alt=""><i class="pv-spin"></i>`;
    } else {
      const washed = q.src.hdr && (!out || !q.cfg.hdrToSdr);
      fr.innerHTML = scene(q.hue, ar.h > ar.w)
        + `<div class="grade" style="${washed ? 'opacity:1;background:rgba(170,170,185,.16);mix-blend-mode:screen' : 'opacity:0'}"></div>`;
      fr.querySelector('svg.scene').style.filter = washed ? 'saturate(.6) contrast(.82) brightness(1.04)' : 'none';
      // Demo: barras pretas mostram a imagem inteira no meio
      if (out && ratioOf(q.cfg) && q.cfg.aspectMode === 'pad') {
        let { w, h } = q.src; if ((q.cfg.rotate || 0) % 180 === 90) [w, h] = [h, w];
        const k = Math.min(ar.w / w, ar.h / h); const sv = fr.querySelector('svg.scene');
        Object.assign(sv.style, { width: (w * k / ar.w * 100) + '%', height: (h * k / ar.h * 100) + '%', left: ((1 - w * k / ar.w) * 50) + '%', top: ((1 - h * k / ar.h) * 50) + '%' });
        fr.style.background = '#000'; sv.outerHTML = sv.outerHTML.replace('<svg', '<svg preserveAspectRatio="none"');
      } else fr.style.background = '';
    }
  }
  function renderPreview(anim) {
    const q = selItem(); const fr = $('#frame'); const fi = $('#frameIn');
    if (PL.on && PL.q !== q) playStop(null, true);
    $('#previewCard').classList.toggle('no-video', !q);
    $('.stage').classList.toggle('compare', !!S.cmp);
    $('#bCompare').classList.toggle('on', !!S.cmp);
    if ((q && q.id) !== S.zoomFor) { S.zoomFor = q && q.id; S.zoom = 1; S.v0 = 0; S.pz = { z: 1, x: 0, y: 0 }; tl.classList.remove('zoomed'); renderScroll(); }
    renderTrim();
    if (!q) { fr.innerHTML = ''; fi.innerHTML = ''; $('#pvMeta').innerHTML = ''; $('#tcEnd').textContent = '00:00:00:00'; pvSt.in.key = pvSt.out.key = ''; drawWave(); return; }
    $('#previewCard').classList.toggle('audio-item', !!q.src.audioOnly);
    $('#previewCard').classList.toggle('image-item', !!q.src.isImage);
    if (q.src.audioOnly || isAudioP(q.cfg)) {
      // Áudio: a linha mostra o que vai sair; arquivo só de áudio mostra um cartão no lugar da imagem
      $('#pvMeta').innerHTML = [chip(audioOutTxt(q.cfg, q.src), COLORS.teal, ICONS.note), trimChip(q), chip(`≈ ${fmtMB(estMB(q))}`)].filter(Boolean).join('<span class="dot">·</span>');
      if (q.src.audioOnly) {
        S.cmp = false; $('.stage').classList.remove('compare');
        fr.className = 'frame audio-card'; fr.dataset.id = q.id; fr.dataset.ar = 16 / 10; fr.dataset.label = '';
        fr.innerHTML = `<div class="ac-in">${ICONS.note}<b>${esc(q.file)}</b><span>${esc(audioSrcTxt(q.src))} · ${esc(q.src.dur)}</span></div>`;
        fi.innerHTML = ''; fitFrames();
        $('#tcEnd').textContent = tcF(q, fullDur(q)); setT(S.t, true);
        if (REAL && q.wave === undefined) { q.wave = null; inv('waveform', { id: q.id, bars: waveBars(q) }).then((w) => { q.wave = w; if (selItem() === q) drawWave(); }).catch(() => { q.wave = []; }); }
        drawWave(); return;
      }
    }
    const o = outDims(q.src, q.cfg); const c = [];
    // informação de como o vídeo VAI FICAR
    const cfr = q.cfg.fps.conform;
    c.push(chip(`${o.w}×${o.h}`), chip(`${codecName(codecOut(q.cfg, q.src))} ${bitsTxt(q.cfg, q.src)}${chromaOut(q.cfg, q.src) === '422' ? ' 4:2:2' : ' 4:2:0'}`, cpuEncode(q.cfg, q.src) ? COLORS.orange : null),
      cfr ? chip(`${fpsTxt(fpsOut(q.cfg, q.src))} fps CFR`, COLORS.green) : chip(`${fpsTxt(q.src.fps)} fps ${q.src.vfr ? 'VFR' : ''}`.trim()));
    if (q.src.hdr) c.push(q.cfg.hdrToSdr ? chip('Rec. 709', COLORS.green) : chip(L.hdrKept, COLORS.orange));
    if (q.cfg.rotate) c.push(chip(`${q.cfg.rotate}°`, COLORS.teal, ICONS.rot));
    if (cutsOf(q)) c.push(trimChip(q));
    c.push(chip(`≈ ${fmtMB(estMB(q))}`));
    if (isImageP(q.cfg)) $('#pvMeta').innerHTML = [chip(imageOutTxt(q.cfg, q.src), COLORS.orange, ICONS.image), chip(`≈ ${fmtMB(estMB(q))}`)].join('<span class="dot">·</span>');
    else if (!isAudioP(q.cfg)) $('#pvMeta').innerHTML = c.join('<span class="dot">·</span>');
    if (anim) { const m = $('#pvMeta'); m.classList.remove('swap'); void m.offsetWidth; m.classList.add('swap'); }
    paintFrame(fr, q, true);
    if (S.cmp) paintFrame(fi, q, false);
    fitFrames(); applyPz();
    if (REAL) requestFrames(q);
    if (anim) { [fr, fi].forEach((f) => { f.classList.remove('flip'); void f.offsetWidth; f.classList.add('flip'); }); }
    $('#tcEnd').textContent = tcF(q, fullDur(q)); setT(S.t, true);
    if (REAL && q.wave === undefined) {
      q.wave = null;
      inv('waveform', { id: q.id, bars: waveBars(q) }).then((w) => { q.wave = w; if (selItem() === q) drawWave(); }).catch(() => { q.wave = []; });
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
  /* Zoom da linha do tempo: a vista mostra [S.v0, S.v0 + 1/S.zoom] do arquivo (frações).
     Rodinha = zoom no ponto do mouse; Shift+rodinha, botão do meio ou a barra de baixo = andar para os lados;
     arrastar as pontas da barra = zoom (como no Premiere); = e - zoom na agulha; \ volta a mostrar tudo. */
  const tl = $('#timeline'); const zs = $('#zscroll');
  S.zoom = 1; S.v0 = 0; S.zoomFor = null;
  const vis = (f) => (f - S.v0) * S.zoom;
  const unvis = (x) => S.v0 + x / S.zoom;
  // quadros por segundo da agulha: os do arquivo que vai sair (CFR), senão os do original; áudio: 1/100 s
  const frOf = (q) => (q.src.audioOnly ? 100 : (q.cfg && q.cfg.fps && q.cfg.fps.conform && parseFloat(String(fpsOut(q.cfg, q.src)).replace(',', '.'))) || q.src.fpsNum || 60);
  const framesOf = (q) => Math.max(1, fullDur(q) * frOf(q));
  // timecode contado em quadros (como o Premiere, sem drop-frame): o quadro N mostra sempre o mesmo número
  const tcF = (q, t) => { const fr = frOf(q); const nom = Math.round(fr); const k = Math.round(t * fr); const ss = Math.floor(k / nom);
    return [Math.floor(ss / 3600), Math.floor(ss / 60) % 60, ss % 60, k % nom].map(pad).join(':'); };
  // tempo (s) → início do quadro onde ele cai
  const snapT = (q, t) => { const fr = frOf(q); return clamp(Math.round(t * fr), 0, Math.max(0, Math.ceil(fullDur(q) * fr) - 1)) / fr; };
  // até ~16 px por quadro
  const maxZoom = (q) => Math.max(1, framesOf(q) * 16 / Math.max(200, tl.clientWidth));
  function setZoom(z, ax, af) {
    const q = selItem(); if (!q || q.src.isImage) return;
    S.zoom = clamp(z, 1, maxZoom(q));
    S.v0 = clamp(af - ax / S.zoom, 0, 1 - 1 / S.zoom);
    renderTimeline();
  }
  // zoom com a agulha no meio (teclas = e -)
  const zoomAtHead = (k) => { const x = clamp(vis(S.t), 0, 1); setZoom(S.zoom * k, S.zoom * k <= 1 ? 0 : x, S.t); };
  function renderTimeline() {
    placeHead();
    tl.classList.toggle('zoomed', S.zoom > 1.001);
    drawWave(); renderTrim(); renderScroll();
  }
  /* régua de timecode em cima da linha do tempo: marcas em intervalos "redondos" que mudam com o zoom */
  const ruler = $('#ruler');
  function drawRuler() {
    const cv = ruler.querySelector('canvas'); const r = cv.getBoundingClientRect(); if (!r.width) return; const dpr = devicePixelRatio || 1;
    cv.width = r.width * dpr; cv.height = r.height * dpr;
    const g = cv.getContext('2d'); g.scale(dpr, dpr);
    const q = selItem(); if (!q || q.src.isImage) return;
    const css = getComputedStyle(root); const d = fullDur(q); const fr = frOf(q);
    const span = d / S.zoom; const t0 = S.v0 * d;
    // intervalo entre os números: o menor que deixa ~110 px entre eles (quadros, depois segundos, minutos)
    const steps = [1, 2, 5, 10].map((k) => k / fr).filter((s) => s < 1).concat([0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600]);
    const pxs = r.width / span; const step = steps.find((s) => s * pxs >= 110) || 3600;
    const sub = step >= 1 ? (step % 5 === 0 || step === 1 ? 5 : 4) : (Math.round(step * fr) % 5 === 0 ? 5 : Math.max(1, Math.round(step * fr)));
    const font = `10px ${css.getPropertyValue('--mono').trim() || 'monospace'}`;
    g.font = font; g.textBaseline = 'top';
    const col = css.getPropertyValue('--text-3').trim(); const col2 = css.getPropertyValue('--text-2').trim();
    const k0 = Math.floor(t0 / step) - 1; const k1 = Math.ceil((t0 + span) / step) + 1;
    for (let k = k0; k <= k1; k++) {
      const tt = k * step; if (tt < -1e-9 || tt > d + 1e-9) continue;
      const x = vis(tt / d) * r.width;
      g.fillStyle = col; g.globalAlpha = 0.9; g.fillRect(Math.round(x), r.height - 7, 1, 7);
      for (let j = 1; j < sub; j++) { const xs = vis((tt + step * j / sub) / d) * r.width; if (xs > r.width) break; g.globalAlpha = 0.5; g.fillRect(Math.round(xs), r.height - 3, 1, 3); }
      g.globalAlpha = 1; g.fillStyle = col2;
      // quadro exato: o timecode do número é o do quadro onde a marca cai
      const label = tcF(q, Math.round(tt * fr) / fr);
      const lb = step >= 60 && label.endsWith(':00') ? label.slice(0, 8) : label;
      if (x >= -1 && x + 4 + g.measureText(lb).width <= r.width + 1) g.fillText(lb, Math.round(x) + 4, 2);
    }
    // trechos em amarelo embaixo da régua
    (cutsOf(q) || []).forEach(([a, b]) => {
      const xa = vis(a / d) * r.width; const xb = vis(b / d) * r.width; if (xb < 0 || xa > r.width) return;
      g.fillStyle = css.getPropertyValue('--yellow').trim(); g.globalAlpha = 0.85; g.fillRect(xa, r.height - 2, Math.max(1, xb - xa), 2);
    });
    g.globalAlpha = 1;
  }
  // agulha: com zoom ela ocupa a largura do quadro, para ver em qual quadro está
  function placeHead() {
    const q = selItem(); const w = q ? S.zoom / framesOf(q) : 0;
    tl.style.setProperty('--t', vis(S.t) * 100 + '%');
    ruler.style.setProperty('--t', vis(S.t) * 100 + '%');
    tl.style.setProperty('--fw', w * tl.clientWidth >= 4 ? w * 100 + '%' : '0px');
  }
  const tlWheel = (e) => {
    const q = selItem(); if (!q || q.src.isImage) return;
    e.preventDefault();
    const r = tl.getBoundingClientRect(); const x = clamp((e.clientX - r.left) / r.width, 0, 1);
    const pan = e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY);
    if (pan) { if (S.zoom > 1) { S.v0 = clamp(S.v0 + (e.deltaX || e.deltaY) / r.width / S.zoom, 0, 1 - 1 / S.zoom); renderTimeline(); } return; }
    setZoom(S.zoom * Math.exp(-e.deltaY * 0.0018), x, unvis(x));
  };
  tl.addEventListener('wheel', tlWheel, { passive: false });
  ruler.addEventListener('wheel', tlWheel, { passive: false });
  // barra de rolagem embaixo da linha do tempo, com os trechos em miniatura:
  // arrastar o meio anda; arrastar uma ponta muda o zoom
  function renderScroll() {
    const q = selItem(); const d = q ? fullDur(q) : 1;
    zs.classList.toggle('zoomed', S.zoom > 1.001);
    const th = zs.querySelector('.zthumb'); th.style.left = S.v0 * 100 + '%'; th.style.width = 100 / S.zoom + '%';
    zs.querySelector('.mini').innerHTML = (cutsOf(q) || []).map(([a, b]) => `<i style="left:${a / d * 100}%;width:${(b - a) / d * 100}%"></i>`).join('');
    zs.title = S.zoom > 1.001 ? `${L.zoomLbl} ×${S.zoom < 10 ? S.zoom.toFixed(1) : Math.round(S.zoom)}` : '';
  }
  zs.addEventListener('pointerdown', (e) => {
    const q = selItem(); if (!q || e.button !== 0) return; e.preventDefault();
    const r = zs.getBoundingClientRect(); const fx = (ev) => clamp((ev.clientX - r.left) / r.width, 0, 1);
    const h = e.target.closest('.h');
    if (h) {
      // ponta esquerda/direita: muda o tamanho da vista (= zoom), a outra ponta fica parada
      const left = h.classList.contains('l'); const a0 = S.v0; const b0 = S.v0 + 1 / S.zoom; const minW = 1 / maxZoom(q);
      dragPtr(zs, e, (ev) => {
        const x = fx(ev); let a = a0; let b = b0;
        if (left) a = clamp(x, 0, b0 - minW); else b = clamp(x, a0 + minW, 1);
        S.zoom = clamp(1 / (b - a), 1, maxZoom(q)); S.v0 = clamp(a, 0, 1 - 1 / S.zoom); renderTimeline();
      });
      return;
    }
    const inThumb = e.target.closest('.zthumb'); const grab = inThumb ? fx(e) - S.v0 : 0.5 / S.zoom;
    const mv = (ev) => { S.v0 = clamp(fx(ev) - grab, 0, 1 - 1 / S.zoom); renderTimeline(); };
    mv(e); dragPtr(zs, e, mv);
  });
  // agulha saiu da vista (setas, quadro a quadro): a vista acompanha
  function follow() {
    if (S.zoom <= 1.001) return false;
    const w = 1 / S.zoom; const m = w * 0.04;
    if (S.t < S.v0 + m || S.t > S.v0 + w - m) { S.v0 = clamp(S.t < S.v0 + m ? S.t - w * 0.25 : S.t - w * 0.75, 0, 1 - w); return true; }
    return false;
  }
  function drawWave() {
    drawRuler();
    const cv = $('#wave'); const r = cv.getBoundingClientRect(); if (!r.width) return; const dpr = devicePixelRatio || 1;
    cv.width = r.width * dpr; cv.height = r.height * dpr;
    const g = cv.getContext('2d'); g.scale(dpr, dpr);
    const css = getComputedStyle(root);
    g.fillStyle = css.getPropertyValue('--wave').trim();
    const q = selItem(); if (!q) return;
    const n = Math.floor((r.width - 4) / 3);
    if (REAL) {
      const w = q.wave;
      if (w && w.length) for (let i = 0; i < n; i++) {
        const f = unvis((i + 0.5) / n); if (f < 0 || f > 1) continue;
        const v = w[Math.min(w.length - 1, Math.floor(f * w.length))] / 255; const a = Math.max(1.5, v * (r.height - 10));
        g.beginPath(); g.roundRect(2 + i * 3, (r.height - a) / 2, 2, a, 1); g.fill();
      }
    } else {
      // demonstração: forma de onda fixa no arquivo (não muda com o zoom)
      const hash = (k) => { const x = Math.sin(k * 12.9898) * 43758.5453; return x - Math.floor(x); };
      for (let i = 0; i < n; i++) {
        const f = unvis((i + 0.5) / n); const X = f * 900;
        const env = .35 + .65 * Math.abs(Math.sin(X / 41) * Math.cos(X / 97));
        const a = Math.max(1.5, env * (hash(Math.floor(f * 3000)) * .7 + .3) * (r.height - 10));
        g.beginPath(); g.roundRect(2 + i * 3, (r.height - a) / 2, 2, a, 1); g.fill();
      }
    }
    // bem de perto: um quadro sim, um não, levemente mais claro (dá para contar); traço mais alto em cada segundo
    const fps = frOf(q); const frames = framesOf(q); const px = r.width * S.zoom / frames;
    if (px >= 5) {
      const f0 = Math.floor(S.v0 * frames); const f1 = Math.ceil((S.v0 + 1 / S.zoom) * frames);
      g.fillStyle = css.getPropertyValue('--text').trim();
      for (let k = f0; k <= f1; k++) {
        const x0 = vis(k / frames) * r.width; const x1 = vis((k + 1) / frames) * r.width;
        if (k % 2 === 0) { g.globalAlpha = 0.07; g.fillRect(x0, 0, x1 - x0, r.height); }
        g.globalAlpha = k % Math.round(fps) === 0 ? 0.8 : 0.3; g.fillRect(Math.round(x0), 0, 1, k % Math.round(fps) === 0 ? 10 : 5);
      }
      g.globalAlpha = 1;
    }
  }
  // agulha sempre no começo de um quadro
  function setT(t, quiet) {
    const q = selItem();
    S.t = clamp(t, 0, 1);
    if (q && !q.src.isImage) S.t = snapT(q, S.t * fullDur(q)) / fullDur(q);
    if (follow()) { drawWave(); renderTrim(); renderScroll(); }
    placeHead();
    if (!q) { $('#tcNow').textContent = '00:00:00:00'; return; }
    $('#tcNow').textContent = tcF(q, fullDur(q) * S.t);
    markCutRow();
    if (!quiet && REAL) requestFrames(q);
  }
  tl.addEventListener('pointerdown', (e) => {
    const q = selItem(); if (!q) return;
    const r = tl.getBoundingClientRect(); const d = fullDur(q); const fr = frOf(q);
    const at = (ev) => clamp(unvis((ev.clientX - r.left) / r.width), 0, 1) * d;
    // botão do meio: arrasta a vista (não mexe na agulha)
    if (e.button === 1) {
      e.preventDefault(); if (S.zoom <= 1.001) return;
      const x0 = e.clientX; const v0 = S.v0;
      dragPtr(tl, e, (ev) => { S.v0 = clamp(v0 - (ev.clientX - x0) / r.width / S.zoom, 0, 1 - 1 / S.zoom); renderTimeline(); });
      return;
    }
    if (e.button !== 0) return;
    const edge = e.target.closest('.edge');
    if (edge && cutsOf(q) && S.cutter) {
      if (PL.on) playStop(null, true);
      // borda de um trecho: clicar leva a agulha até ela (início = 1º quadro, fim = último quadro);
      // arrastar ajusta quadro a quadro, sem passar do vizinho
      const k = edge.dataset.edge; const i = +edge.dataset.i; const x0 = e.clientX; let moved = false;
      q.cutSel = i;
      const goEdge = () => { const c = q.cuts[i]; setT((k === 'a' ? c[0] : c[1] - 1 / fr) / d); };
      dragPtr(tl, e, (ev) => {
        if (!moved && Math.abs(ev.clientX - x0) < 3) return; moved = true;
        const t = snapT(q, at(ev)); const c = q.cuts[i];
        const lo = i > 0 ? q.cuts[i - 1][1] : 0; const hi = i < q.cuts.length - 1 ? q.cuts[i + 1][0] : d;
        if (k === 'a') c[0] = clamp(t, lo, c[1] - 1 / fr); else c[1] = clamp(t + 1 / fr, c[0] + 1 / fr, hi);
        renderTrim(); goEdge();
      }, () => { if (moved) setCuts(q, q.cuts); else { renderTrim(); goEdge(); } });
      return;
    }
    scrub(e, q, tl);
  });
  /* arrastar a agulha (na linha do tempo ou na régua). Perto do início ou do fim de um trecho ela gruda
     nele (ímã; Alt arrasta sem ímã). Tocando: para enquanto arrasta e continua de onde soltar. */
  function scrub(e, q, el) {
    const r = el.getBoundingClientRect(); const d = fullDur(q); const fr = frOf(q);
    const resume = PL.on && PL.plan && PL.plan.kind !== 'cut' ? PL.plan.kind : null; if (PL.on) playStop(null, true);
    const mv = (ev) => {
      let t = clamp(unvis((ev.clientX - r.left) / r.width), 0, 1) * d; let hit = null;
      if (!ev.altKey) (q.cuts || []).forEach(([a, b]) => [a, b - 1 / fr].forEach((s) => {
        const dx = Math.abs(r.left + vis(s / d) * r.width - ev.clientX);
        if (dx <= 8 && (!hit || dx < hit.dx)) hit = { s, dx };
      }));
      if (hit) t = hit.s;
      tl.classList.toggle('snapped', !!hit);
      setT(t / d);
    };
    mv(e);
    // soltar em cima de um trecho escolhe ele (I e O passam a mexer nele)
    dragPtr(el, e, mv, () => {
      tl.classList.remove('snapped');
      const i = cutAt(q); if (i >= 0 && i !== q.cutSel) { q.cutSel = i; renderTrim(); }
      if (resume) playStart({ kind: resume === 'cuts' ? 'auto' : 'all' });
    });
  }
  ruler.addEventListener('pointerdown', (e) => { const q = selItem(); if (!q || q.src.isImage || e.button !== 0) return; e.preventDefault(); scrub(e, q, ruler); });
  /* Trechos: [início, fim) em segundos, sempre em quadros inteiros. I = início no quadro da agulha;
     O = fim incluindo o quadro da agulha; Ctrl+K = trecho novo na agulha (dentro de um trecho, divide em dois).
     Vários trechos saem separados (_01, _02...) ou juntos num arquivo. */
  const cutAt = (q, t = fullDur(q) * S.t) => (q.cuts || []).findIndex(([a, b]) => t >= a - 0.0005 && t < b - 0.0005);
  function setCuts(q, list) {
    const d = fullDur(q); const fr = frOf(q); const sel = (list || [])[q.cutSel];
    const g = (t) => Math.round(t * fr) / fr;
    let cs = (list || []).map(([a, b]) => [clamp(g(a), 0, d), clamp(g(b), 0, d)]).filter(([a, b]) => b - a >= 0.5 / fr).sort((x, y) => x[0] - y[0]);
    // trechos um por cima do outro viram um só (encostados continuam separados)
    cs = cs.reduce((m, c) => { const l = m[m.length - 1]; if (l && c[0] < l[1] - 0.0005) l[1] = Math.max(l[1], c[1]); else m.push(c); return m; }, []);
    if (cs.length === 1 && cs[0][0] < 0.5 / fr && cs[0][1] > d - 0.5 / fr) cs = [];
    q.cuts = cs.length ? cs : null;
    q.cutSel = sel ? Math.max(0, cs.findIndex((c) => c[0] <= sel[0] + 0.0005 && c[1] >= sel[1] - 0.0005)) : Math.min(q.cutSel || 0, Math.max(0, cs.length - 1));
    renderQueue(); renderPreview(); renderInspector(); renderScroll(); renderCutter();
  }
  function markTrim(k) {
    const q = selItem(); if (!q || q.src.isImage || q.status === 'running') return;
    const d = fullDur(q); const fr = frOf(q); const t = snapT(q, d * S.t); const cs = (q.cuts || []).map((c) => c.slice());
    let i = cs.length ? clamp(q.cutSel || 0, 0, cs.length - 1) : -1;
    if (i < 0) { cs.push([0, d]); i = 0; }
    const lo = i > 0 ? cs[i - 1][1] : 0; const hi = i < cs.length - 1 ? cs[i + 1][0] : d;
    if (k === 'a') { cs[i][0] = clamp(t, lo, hi - 1 / fr); if (cs[i][1] <= cs[i][0]) cs[i][1] = hi; }
    // O: o quadro da agulha entra no trecho
    else { cs[i][1] = clamp(t + 1 / fr, lo + 1 / fr, hi); if (cs[i][1] <= cs[i][0]) cs[i][0] = lo; }
    q.cutSel = i; setCuts(q, cs);
  }
  function newCut() {
    const q = selItem(); if (!q || q.src.isImage || q.status === 'running') return;
    const d = fullDur(q); const fr = frOf(q); const t = snapT(q, d * S.t); const cs = (q.cuts || []).map((c) => c.slice());
    const i = cutAt(q, t);
    if (i >= 0 && t - cs[i][0] >= 1 / fr - 0.0005) { cs.splice(i + 1, 0, [t, cs[i][1]]); cs[i][1] = t; q.cutSel = i + 1; }
    else if (i < 0) { const next = cs.find((c) => c[0] > t); cs.push([t, next ? next[0] : d]); cs.sort((x, y) => x[0] - y[0]); q.cutSel = cs.findIndex((c) => c[0] === t); }
    else return;
    setCuts(q, cs);
  }
  function renderTrim() {
    const q = selItem(); const cs = cutsOf(q); const d = q ? fullDur(q) : 1; const box = $('#trimBox');
    tl.classList.toggle('trimmed', !!cs);
    $('#tlHint').hidden = !(S.cutter && q && !cs);
    if (!cs) { box.innerHTML = ''; $('#bIn').classList.remove('set'); $('#bOut').classList.remove('set'); renderCutList(); if (S.plReady) renderPlayUi(); return; }
    const pc = (t) => (vis(t / d) * 100).toFixed(3) + '%'; const pw = (t) => (t / d * S.zoom * 100).toFixed(3) + '%'; const sel = clamp(q.cutSel || 0, 0, cs.length - 1);
    // fora dos trechos escurece; cada trecho em amarelo com as bordas de arrastar
    const gaps = []; let prev = 0;
    cs.forEach(([a, b]) => { if (a > prev) gaps.push([prev, a]); prev = b; }); if (prev < d) gaps.push([prev, d]);
    box.innerHTML = gaps.map(([a, b]) => `<i class="cut" style="left:${pc(a)};width:${pw(b - a)}"></i>`).join('')
      + cs.map(([a, b], i) => `<div class="seg ${i === sel && cs.length > 1 ? 'sel' : ''}" style="left:${pc(a)};width:${pw(b - a)}">${cs.length > 1 ? `<small>${i + 1}</small>` : ''}</div>
        <b class="edge l" data-edge="a" data-i="${i}" style="left:${pc(a)}" title="${esc(L.edgeIn)}"></b><b class="edge r" data-edge="b" data-i="${i}" style="left:${pc(b)}" title="${esc(L.edgeOut)}"></b>`).join('');
    $('#bIn').classList.toggle('set', cs[sel][0] > 0.0005); $('#bOut').classList.toggle('set', cs[sel][1] < d - 0.0005);
    renderCutList(); if (S.plReady) renderPlayUi();
  }
  $('#bIn').onclick = () => markTrim('a'); $('#bOut').onclick = () => markTrim('b'); $('#bCut').onclick = newCut;
  // fim mostrado = último quadro que entra
  const cutTc = (q, t) => tcF(q, t);
  const cutTitle = (q) => (cutsOf(q) || []).map(([a, b], i) => `${i + 1}: ${cutTc(q, a)} → ${cutTc(q, b - 1 / frOf(q))}`).join('\n');
  // menu dos trechos na tela principal: abrir o Cortador ou tirar todos
  $('#pvMeta').addEventListener('click', (e) => { if (e.target.closest('[data-trimclear]')) openCutter(true); });
  const trimChip = (q) => {
    const cs = cutsOf(q); if (!cs) return '';
    const txt = cs.length === 1 ? `${L.trimLbl} ${fmtDur(cs[0][0])}–${fmtDur(cs[0][1])} · ${fmtDur(cs[0][1] - cs[0][0])}`
      : `${L.cutsN(cs.length)} · ${fmtDur(cutsDur(q))} · ${q.cutJoin ? L.cutJoinShort : L.cutSplitShort}`;
    return `<button class="chip hl trim-chip" style="--c:${COLORS.yellow}" data-trimclear title="${esc(kf(L.openCutter))}">${ICONS.cut}${txt}</button>`;
  };

  /* ---------- Cortador: página própria, com prévia e linha do tempo grandes e a lista de trechos ----------
     A prévia e a linha do tempo da tela principal são levadas para cá (as mesmas peças) e voltam ao fechar. */
  S.cutter = null;
  const cutterOk = (q) => q && !q.src.isImage && q.status !== 'running';
  function openCutter(on) {
    const q = selItem();
    if (PL.on) playStop(null, true);
    if (on) {
      if (!cutterOk(q)) { if (q && q.src.isImage) toast(L.cutImage); return; }
      S.cutter = { id: q.id, before: { cuts: q.cuts ? q.cuts.map((c) => c.slice()) : null, cutJoin: !!q.cutJoin, cutSel: q.cutSel || 0 } };
      S.cmp = false; closeMenu(); if (q.cuts) setCuts(q, q.cuts);
      $('#cutStageSlot').append($('.stage')); $('#cutTransportSlot').append($('.transport'));
      root.classList.add('cutter-open'); $('#cutter').hidden = false;
    } else {
      if (!S.cutter) return;
      $('#pvMeta').before($('.stage')); $('#pvMeta').after($('.transport'));
      root.classList.remove('cutter-open'); $('#cutter').hidden = true; S.cutter = null;
    }
    requestAnimationFrame(() => { fitFrames(); renderAll(); renderTimeline(); renderCutter(); });
  }
  function cancelCutter() {
    const q = itemOf(S.cutter && S.cutter.id);
    if (q) Object.assign(q, { cuts: S.cutter.before.cuts, cutJoin: S.cutter.before.cutJoin, cutSel: S.cutter.before.cutSel });
    openCutter(false);
  }
  $('#bCutDone').onclick = () => openCutter(false);
  $('#bCutCancel').onclick = cancelCutter;
  $('#bOpenCut').onclick = () => openCutter(true);
  function renderCutter() {
    if (!S.cutter) return;
    const q = itemOf(S.cutter.id); if (!q) { openCutter(false); return; }
    $('#cutFile').textContent = q.file;
    $('#cutInfo').textContent = q.src.audioOnly ? `${audioSrcTxt(q.src)} · ${fmtDur(fullDur(q))}` : `${q.src.w}×${q.src.h} · ${fpsTxt(+frOf(q).toFixed(2))} fps · ${fmtDur(fullDur(q))}`;
    const cs = cutsOf(q) || [];
    $('#cutMode').hidden = cs.length < 2;
    $('#bClearCuts').hidden = !cs.length;
    $$('#cutMode button').forEach((b) => b.classList.toggle('active', (b.dataset.v === 'join') === !!q.cutJoin));
    $('#cutTotal').textContent = cs.length ? `${L.cutsN(cs.length).replace(/^1 .*/, L.oneCut)} · ${fmtDur(cutsDur(q))}` : L.wholeFile;
    // nomes dos arquivos que vão sair
    const names = outNames(q);
    $('#cutOut').innerHTML = `<small>${esc(names.length > 1 ? L.cutFilesN(names.length) : L.cutFile1)}</small>` + names.slice(0, 6).map((n) => `<div>${esc(n)}</div>`).join('') + (names.length > 6 ? `<div>…</div>` : '');
    renderCutList();
  }
  // lista de trechos com início e fim em timecode (dá para digitar)
  function renderCutList() {
    const el = $('#cutList'); if (!S.cutter || !el) return;
    const q = itemOf(S.cutter.id); if (!q) return; const cs = cutsOf(q) || []; const fr = frOf(q);
    // não redesenha enquanto um timecode está sendo digitado (botões da lista não contam)
    if (document.activeElement && document.activeElement.closest('#cutList .tcin')) { markCutRow(); return; }
    el.innerHTML = cs.length ? cs.map(([a, b], i) => `<div class="cut-row ${i === (q.cutSel || 0) ? 'sel' : ''}" data-i="${i}">
        <button class="n" data-play="${i}" title="${esc(L.playCutTip(i + 1))}"><b>${i + 1}</b><svg class="pi" viewBox="0 0 16 16" fill="currentColor">${ICONS.play}</svg><svg class="pa" viewBox="0 0 16 16" fill="currentColor">${ICONS.pause}</svg></button>
        <input class="tcin" data-i="${i}" data-k="a" value="${cutTc(q, a)}" spellcheck="false" title="${esc(L.cutStart)}">
        <span class="to">→</span>
        <input class="tcin" data-i="${i}" data-k="b" value="${cutTc(q, b - 1 / fr)}" spellcheck="false" title="${esc(L.cutEnd)}">
        <span class="dur">${fmtDur(b - a)}</span>
        <button class="x" data-del="${i}" title="${esc(L.cutDel)}">${ICONS.x}</button><i class="pbar"></i></div>`).join('')
      : `<div class="cut-empty">${kf(L.cutEmpty)}</div>`;
    markCutRow();
  }
  // a linha do trecho em que a agulha está fica marcada
  function markCutRow() {
    if (!S.cutter) return; const q = itemOf(S.cutter.id); if (!q) return; const i = cutAt(q);
    $$('#cutList .cut-row').forEach((r) => r.classList.toggle('here', +r.dataset.i === i));
    renderPlayRows();
  }
  const parseTc = (q, s) => {
    const p = String(s).trim().split(/[:;.,]/).map(Number); if (!p.length || p.some((x) => !Number.isFinite(x))) return null;
    while (p.length < 4) p.unshift(0);
    const [h, m, sec, f] = p.slice(-4); return ((h * 3600 + m * 60 + sec) * Math.round(frOf(q)) + f) / frOf(q);
  };
  $('#cutList').addEventListener('click', (e) => {
    const q = itemOf(S.cutter && S.cutter.id); if (!q) return;
    const del = e.target.closest('[data-del]');
    if (del) { del.blur(); const i = +del.dataset.del; if (PL.on) playStop(null, true); setCuts(q, q.cuts.filter((_, k) => k !== i)); return; }
    // número do trecho: toca só ele (do primeiro ao último quadro); tocando ele, pausa
    const pb = e.target.closest('[data-play]');
    if (pb) { pb.blur(); const i = +pb.dataset.play; if (PL.on && PL.plan.kind === 'cut' && PL.plan.cut === i) playStop(); else { q.cutSel = i; renderTrim(); playStart({ kind: 'cut', cut: i }); } return; }
    const row = e.target.closest('.cut-row'); if (!row || e.target.closest('input')) return;
    if (PL.on) playStop(null, true);
    q.cutSel = +row.dataset.i; setT(q.cuts[q.cutSel][0] / fullDur(q)); renderTrim();
  });
  $('#cutList').addEventListener('focusin', (e) => {
    const inp = e.target.closest('.tcin'); const q = itemOf(S.cutter && S.cutter.id); if (!inp || !q) return;
    q.cutSel = +inp.dataset.i; const c = q.cuts[q.cutSel];
    setT((inp.dataset.k === 'a' ? c[0] : c[1] - 1 / frOf(q)) / fullDur(q)); inp.select();
    $$('#cutList .cut-row').forEach((r) => r.classList.toggle('sel', +r.dataset.i === q.cutSel));
  });
  $('#cutList').addEventListener('change', (e) => {
    const inp = e.target.closest('.tcin'); const q = itemOf(S.cutter && S.cutter.id); if (!inp || !q) return;
    const t = parseTc(q, inp.value); const i = +inp.dataset.i; const fr = frOf(q);
    if (t == null) { inp.blur(); renderCutList(); return; }
    const cs = q.cuts.map((c) => c.slice()); const s = snapT(q, t);
    if (inp.dataset.k === 'a') cs[i][0] = Math.min(s, cs[i][1] - 1 / fr); else cs[i][1] = Math.max(s + 1 / fr, cs[i][0] + 1 / fr);
    inp.blur(); setCuts(q, cs); setT((inp.dataset.k === 'a' ? cs[i][0] : cs[i][1] - 1 / fr) / fullDur(q));
  });
  $('#cutList').addEventListener('keydown', (e) => { if (!e.target.closest('.tcin')) return; if (e.key === 'Enter') e.target.blur(); if (e.key === 'Escape') { e.stopPropagation(); e.target.blur(); renderCutList(); } });
  $('#cutMode').addEventListener('click', (e) => {
    const b = e.target.closest('button'); const q = itemOf(S.cutter && S.cutter.id); if (!b || !q) return;
    q.cutJoin = b.dataset.v === 'join'; renderQueue(); renderPreview(); renderInspector(); renderCutter();
  });
  $('#bClearCuts').onclick = () => { const q = itemOf(S.cutter && S.cutter.id); if (q) setCuts(q, []); };
  const ctl = $$('.controls .ctl:not(.trim-btn)');
  const stepBy = (s) => { const q = selItem(); if (!q) return; if (PL.on) playStop(null, true); setT(S.t + s / fullDur(q)); };
  ctl[0].onclick = () => { const q = selItem(); if (q) stepBy(-1 / frOf(q)); };
  // ⏮ ⏭: agulha no corte anterior/próximo (início e último quadro de cada trecho; sem trechos, começo e fim)
  function jumpEdit(dir) {
    const q = selItem(); if (!q || !playable(q)) return; const d = fullDur(q); const fr = frOf(q); const t = snapT(q, d * S.t);
    const pts = (cutsOf(q) || [[0, d]]).flatMap(([a, b]) => [a, b - 1 / fr]).map((x) => snapT(q, x));
    const go = dir > 0 ? pts.find((x) => x > t + 1e-4) : pts.filter((x) => x < t - 1e-4).pop();
    if (go == null) return;
    const playing = PL.on; if (playing) playStop(null, true);
    setT(go / d); if (playing) playStart({ kind: 'auto' });
  }
  ctl[1].onclick = () => jumpEdit(-1);
  ctl[3].onclick = () => jumpEdit(1);
  ctl[4].onclick = () => { const q = selItem(); if (q) stepBy(1 / frOf(q)); };
  /* ---------- Play ----------
     Escada automática, sem o usuário escolher nada:
     1) toca o arquivo direto quando o player do app consegue (a maioria dos vídeos de celular);
     2) senão, conversão ao vivo: o FFmpeg converte a partir da agulha (na placa ou na CPU) e o vídeo já vai saindo.
        No Auto começa em 720p e baixa sozinha (540p, 360p) se o PC não acompanhar;
     3) se nem em 360p acompanhar, gera uma vez a "prévia leve" guardada (depois toca na hora).
     Pausou: a agulha prende no quadro e volta a imagem exata do original.
     Planos: 'all' = da agulha até o fim; 'cuts' = só os trechos, um atrás do outro (como o arquivo juntado);
     'cut' = um trecho, do primeiro ao último quadro. */
  const stage = $('.stage');
  const LIVE_H = [1080, 720, 540, 360];
  const playQ = () => String(S.set.playQ || 'auto');
  const liveH = (q) => (playQ() === 'auto' ? (q.liveH || 720) : +playQ());
  const playable = (q) => !!q && !q.src.isImage;
  const RATES = [0.25, 0.5, 1, 1.5, 2, 4];
  const rateTxt = (r) => `${fpsTxt(String(r))}×`;
  function planFor(q, o) {
    const d = fullDur(q); const fr = frOf(q); const cs = cutsOf(q) || [];
    if (o.kind === 'cut' && cs[o.cut]) return { kind: 'cut', cut: o.cut, parts: [cs[o.cut].slice()] };
    let t0 = o.from != null ? o.from : snapT(q, d * S.t);
    // com trechos o play mostra o resultado: da agulha em diante, pulando o que foi cortado
    // (agulha entre trechos: começa no próximo; depois do último: volta ao primeiro)
    // botão "Pular cortes" desligado: o play normal toca o original
    if ((o.kind === 'auto' && S.set.skipCuts !== false || o.kind === 'cuts') && cs.length) {
      let parts = partsFrom(cs, t0); if (!parts.length || parts.length === 1 && parts[0][1] - parts[0][0] < 1.5 / fr) parts = cs.map((c) => c.slice());
      return { kind: 'cuts', parts, all: cs.map((c) => c.slice()) };
    }
    if (t0 >= d - 1.5 / fr) t0 = 0; // na última imagem: começa do começo
    return { kind: 'all', parts: [[t0, d]] };
  }
  // o que falta tocar a partir de t (para recomeçar a conversão ao vivo no meio)
  function partsFrom(parts, t) {
    const k = parts.findIndex(([, b]) => t < b - 1e-6); if (k < 0) return [];
    return [[Math.max(parts[k][0], t), parts[k][1]], ...parts.slice(k + 1).map((c) => c.slice())];
  }
  const liveMap = (parts) => { let o = 0; return parts.map(([a, b]) => { const m = { a, b, o }; o += b - a; return m; }); };
  // tempo do original que está na tela
  function srcOf(ct) {
    if (PL.mode === 'demo') return PL.dt;
    if (PL.mode !== 'live' || !PL.map) return ct;
    const m = PL.map; let k = 0; while (k < m.length - 1 && ct >= m[k + 1].o - 1e-6) k++;
    return Math.min(m[k].b, m[k].a + Math.max(0, ct - m[k].o));
  }
  const curSrc = () => srcOf(vid.currentTime);

  async function playStart(o) {
    const q = selItem(); if (!playable(q)) return;
    if (PL.on) playStop(null, true);
    const plan = planFor(q, o || { kind: 'auto' });
    const seq = ++PL.seq;
    Object.assign(PL, { on: true, q, plan, i: 0, hw: true, slow: 0, stalls: [], started: false, prep: null, mode: '' });
    if (S.cmp) { S.cmpHold = true; S.cmp = false; renderPreview(); }
    clearTimeout(PL.badgeT); $('#playBadge').classList.remove('fade'); $('#playBadge').hidden = true;
    stage.classList.add('playing'); stage.classList.toggle('buffering', REAL);
    renderPlayUi(); renderPlayInfo(plan.parts[0][0]);
    if (!REAL) { PL.mode = 'demo'; PL.cur = plan.parts; PL.dt = plan.parts[0][0]; PL.last = performance.now(); plLoop(seq); return; }
    $('#frame').append(vid);
    audioGraph();
    await plLoad(seq, plan.parts);
  }
  // escolhe o degrau: direto, ao vivo ou a prévia leve guardada
  async function plMode(q) {
    const p = q.play = q.play || {};
    if (p.useProxy) {
      const key = JSON.stringify([q.cfg.rotate, q.cfg.aspect, q.cfg.aspectMode, q.cfg.hdrToSdr, frOf(q)]);
      if (!p.proxy || p.proxyKey !== key) await makeProxy(q, key);
      return 'proxy';
    }
    // giro extra muda a imagem: só a conversão mostra igual ao resultado
    if (!p.noDirect && !((q.cfg.rotate || 0) % 360)) {
      if (p.url === undefined) { try { const f = await inv('play_file', { id: q.id }); p.url = f.url; p.hint = f.hint; } catch { p.url = null; } }
      if (p.url && p.hint && vid.canPlayType(p.hint)) return 'direct';
    }
    return 'live';
  }
  async function makeProxy(q, key) {
    PL.prep = 0; renderPlayUi(); stage.classList.remove('buffering');
    const h = playQ() === 'auto' ? 540 : +playQ();
    const url = await inv('play_proxy', { id: q.id, cfg: q.cfg, output: true, height: h, fps: String(frOf(q)), limitMb: Math.round((+S.set.previewGB || 5) * 1000) });
    Object.assign(q.play, { proxy: url, proxyKey: key });
    PL.prep = null; renderPlayUi();
  }
  async function plLoad(seq, parts) {
    const q = PL.q; let mode = '';
    try {
      mode = await plMode(q); if (seq !== PL.seq) return;
      Object.assign(PL, { cur: parts, mode, i: 0, started: false });
      stage.classList.add('buffering');
      if (mode === 'live') {
        PL.h = liveH(q);
        const r = await inv('play_live', { id: q.id, cfg: q.cfg, parts, output: true, height: PL.h, fps: String(frOf(q)), hw: PL.hw });
        if (seq !== PL.seq) { inv('play_stop').catch(() => {}); return; }
        PL.map = liveMap(parts); PL.enc = r.enc;
        vid.src = r.url;
      } else {
        const url = mode === 'proxy' ? q.play.proxy : q.play.url;
        if (vid.getAttribute('src') !== url) vid.src = url;
        vid.currentTime = parts[0][0];
      }
      // tocando direto: o recorte da proporção é feito na tela (a conversão já vem recortada)
      vid.className = 'pv-vid' + (mode === 'direct' && ratioOf(q.cfg) && q.cfg.aspectMode !== 'pad' ? ' cover' : '');
      applyPz();
      vid.playbackRate = PL.rate;
      await vid.play();
      if (seq !== PL.seq) return;
      plLoop(seq);
    } catch (e) {
      if (seq !== PL.seq || (e && e.name === 'AbortError')) return;
      plFail(mode, String(e && e.message || e));
    }
  }
  // não tocou: direto → conversão; conversão com a placa lendo → só a CPU lendo; senão avisa
  function plFail(mode, msg) {
    if (!PL.on) return;
    const q = PL.q; const t = PL.started ? curSrc() : PL.cur ? PL.cur[0][0] : 0;
    if (mode === 'direct') { q.play.noDirect = true; plRestartAt(t); return; }
    if (mode === 'live' && PL.hw) { PL.hw = false; plRestartAt(t); return; }
    console.warn('play', msg); toast(L.playFail); playStop(null);
  }
  function plRestartAt(t) {
    const seq = ++PL.seq; vid.pause();
    if (PL.mode === 'live') inv('play_stop').catch(() => {});
    const parts = partsFrom(PL.plan.parts, t); if (!parts.length) { playStop(null); return; }
    plLoad(seq, parts);
  }
  // o PC não acompanha a conversão: baixa a qualidade (720 → 540 → 360); depois disso, prévia leve guardada
  function plSlower() {
    const q = PL.q; const next = LIVE_H.find((x) => x < (PL.h || 720) && x >= 360);
    PL.slow = 0; PL.stalls = [];
    if (next) q.liveH = next; else q.play.useProxy = true;
    plRestartAt(curSrc());
  }
  function plFinish() {
    const p = PL.plan; const fr = frOf(PL.q);
    if (S.set.loop) { playStart(p.kind === 'all' ? { kind: 'all', from: 0 } : p.kind === 'cuts' ? { kind: 'cuts', from: p.all[0][0] } : p); return; }
    playStop(p.parts[p.parts.length - 1][1] - 1 / fr);
  }
  // pausa. `final`: tempo onde a agulha fica (sem: onde está); `quiet`: quem chamou já vai mexer na agulha
  function playStop(final, quiet) {
    if (!PL.on) return;
    const q = PL.q;
    const t = final != null ? final : PL.mode === 'demo' ? PL.dt : PL.mode ? curSrc() : fullDur(q) * S.t;
    // terminou o trecho: o tempo mostra a duração inteira
    if (final != null) renderPlayInfo(final);
    PL.on = false; PL.seq++; PL.prep = null;
    vid.pause();
    if (REAL && PL.mode === 'live') inv('play_stop').catch(() => {});
    if (q && selItem() === q) setT(t / fullDur(q), quiet);
    const hide = () => {
      if (PL.on) return;
      stage.classList.remove('playing', 'buffering');
      if (S.cmpHold) { S.cmpHold = false; S.cmp = true; renderPreview(); }
    };
    if (quiet || !REAL) hide(); else { stillReady(hide); setTimeout(hide, 1500); }
    // o tempo do trecho fica na tela um instante
    const bd = $('#playBadge'); if (!bd.hidden) { bd.classList.add('fade'); clearTimeout(PL.badgeT); PL.badgeT = setTimeout(() => { if (!PL.on) { bd.hidden = true; bd.classList.remove('fade'); } }, 1600); }
    renderPlayUi(); meterDecay();
  }
  function plStep(now, mt) {
    const q = PL.q; const d = fullDur(q); const fr = frOf(q); const parts = PL.cur;
    let t;
    if (PL.mode === 'demo') { PL.dt += Math.min(0.1, (now - PL.last) / 1000) * PL.rate; PL.last = now; t = PL.dt; }
    else t = srcOf(mt != null ? mt : vid.currentTime);
    // direto/guardada: no último quadro do trecho, pula para o próximo trecho ou termina
    if (PL.mode !== 'live' && parts[PL.i]) {
      const b = parts[PL.i][1];
      if (t >= b - 1.25 / fr) {
        if (PL.i < parts.length - 1) { PL.i++; t = parts[PL.i][0]; if (PL.mode === 'demo') PL.dt = t; else vid.currentTime = t; }
        else { plFinish(); return false; }
      }
    }
    setT(t / d, true); renderPlayInfo(t);
    return true;
  }
  function plLoop(seq) {
    const go = (now, md) => {
      if (seq !== PL.seq || !PL.on) return;
      if (plStep(now, md && md.mediaTime) === false) return;
      meterTick(); plLoop(seq);
    };
    // a cada quadro que aparece (requestVideoFrameCallback dá o tempo exato do quadro)
    if (PL.mode !== 'demo' && vid.requestVideoFrameCallback && !PL.q.src.audioOnly) vid.requestVideoFrameCallback(go);
    else requestAnimationFrame((now) => go(now));
  }
  vid.addEventListener('playing', () => { if (!PL.on) return; stage.classList.remove('buffering'); if (!PL.started) PL.t0 = performance.now(); PL.started = true; });
  vid.addEventListener('waiting', () => { if (PL.on && PL.started) { stage.classList.add('buffering'); PL.waitAt = performance.now(); } });
  vid.addEventListener('ended', () => { if (PL.on && PL.mode !== 'demo') plFinish(); });
  vid.addEventListener('error', () => { if (PL.on && PL.mode) plFail(PL.mode, vid.error ? `media error ${vid.error.code}` : 'error'); });
  // travou esperando a conversão (mais de 0,4 s, duas vezes em 10 s): o PC não está acompanhando
  vid.addEventListener('playing', () => {
    if (!PL.on || PL.mode !== 'live' || !PL.waitAt || playQ() !== 'auto') return;
    const now = performance.now(); if (now - PL.waitAt > 400) PL.stalls = (PL.stalls || []).filter((x) => now - x < 10000).concat(now);
    PL.waitAt = 0; if (PL.stalls.length >= 2) plSlower();
  });
  if (REAL) {
    on('play-live', (e) => {
      if (!PL.on || PL.mode !== 'live') return;
      if (e.error) { plFail('live', e.error); return; }
      // velocidade média da conversão abaixo do tempo real depois de 3 s convertendo: não vai acompanhar
      if (e.ended || playQ() !== 'auto' || !PL.started || !(e.time > 3)) return;
      PL.slow = e.speed > 0 && e.speed < PL.rate * 0.9 ? (PL.slow || 0) + 1 : 0;
      if (PL.slow >= 3) plSlower();
    });
    on('play-proxy', (e) => { if (PL.on && PL.q && PL.q.id === e.id && PL.prep != null) { PL.prep = e.p; renderPlayUi(); } });
  }
  function setRate(r) { PL.rate = r; vid.playbackRate = r; renderPlayUi(); }

  /* som: volume e medidor (o áudio passa pelo Web Audio; precisa do CORS do servidor local) */
  let actx = null; let gainN = null; let anL = null; let anR = null;
  function audioGraph() {
    if (actx) { if (actx.state === 'suspended') actx.resume(); return; }
    try {
      actx = new AudioContext();
      const src = actx.createMediaElementSource(vid); gainN = actx.createGain();
      src.connect(gainN); gainN.connect(actx.destination);
      const sp = actx.createChannelSplitter(2); src.connect(sp);
      anL = actx.createAnalyser(); anR = actx.createAnalyser(); anL.fftSize = anR.fftSize = 1024;
      sp.connect(anL, 0); sp.connect(anR, 1);
    } catch { actx = null; gainN = null; }
    applyVol();
  }
  function applyVol() {
    const v = S.set.muted ? 0 : (S.set.vol != null ? +S.set.vol : 1);
    if (gainN) { gainN.gain.value = v; vid.volume = 1; } else vid.volume = clamp(v, 0, 1);
    const b = $('#bVol'); b.classList.toggle('muted', v === 0); b.classList.toggle('low', v > 0 && v < 0.5);
    b.title = L.volTip(Math.round(v * 100));
    const r = $('#volR'); r.value = Math.round(v * 100); r.style.setProperty('--v', `${Math.round(v * 100)}%`); r.title = `${Math.round(v * 100)}%`;
  }
  const mbuf = new Float32Array(1024); const lv = [0, 0]; let decayRaf = 0;
  function meterTick() {
    const m = $('#meter'); const q = PL.q; const mono = q && q.src.aud && q.src.aud[0] && q.src.aud[0].ch === 1 && PL.mode === 'direct';
    [anL, anR].forEach((an, i) => {
      let pk = 0;
      if (PL.on && REAL && an) { (mono ? anL : an).getFloatTimeDomainData(mbuf); for (let j = 0; j < mbuf.length; j++) pk = Math.max(pk, Math.abs(mbuf[j])); }
      else if (PL.on && !REAL) { const x = PL.dt * 7 + i * 1.7; pk = 0.18 + 0.5 * Math.abs(Math.sin(x) * Math.cos(x * 0.37 + i)); }
      if (S.set.muted && REAL) pk *= 1; // o medidor mostra o sinal mesmo sem som
      // -48 dB = vazio; cai devagar
      const h = pk > 0 ? clamp((20 * Math.log10(pk) + 48) / 48, 0, 1) : 0;
      lv[i] = Math.max(h, lv[i] - 0.035);
      m.children[i].style.setProperty('--l', (lv[i] * 100).toFixed(1) + '%');
      m.children[i].classList.toggle('clip', pk >= 0.99);
    });
  }
  function meterDecay() {
    cancelAnimationFrame(decayRaf);
    const step = () => { meterTick(); if (!PL.on && (lv[0] > 0 || lv[1] > 0)) decayRaf = requestAnimationFrame(step); };
    decayRaf = requestAnimationFrame(step);
  }

  /* botões e informações */
  function renderPlayUi() {
    const q = selItem(); const b = $('#bPlay'); const prep = PL.on && PL.prep != null;
    $('#playIco').innerHTML = PL.on ? ICONS.pause : ICONS.play;
    b.classList.toggle('prep', prep); b.style.setProperty('--p', `${Math.round((PL.prep || 0) * 100)}%`);
    b.title = `${PL.on ? L.pause : L.play} (${keyLabel(keyOf('play'))})`;
    const skip = !!cutsOf(q) && S.set.skipCuts !== false;
    b.title = `${PL.on ? L.pause : skip ? L.playResult : L.play} (${keyLabel(keyOf('play'))})`;
    const sb = $('#bSkip'); sb.hidden = !cutsOf(q) || !playable(q); sb.classList.toggle('on', skip);
    sb.title = `${skip ? L.skipTipOn : L.skipTipOff} (${keyLabel(keyOf('skipCuts'))})`;
    $('#lSkip').textContent = skip ? L.skipLbl : L.skipLblOff;
    // botões de quadro: a dica diz o que fazem (antes só mostrava a seta)
    ctl[0].title = `${L.act.prevFrame} (${keyLabel(keyOf('prevFrame'))})`; ctl[4].title = `${L.act.nextFrame} (${keyLabel(keyOf('nextFrame'))})`;
    $('#bPrevEdit').title = `${L.act.prevEdit} (${keyLabel(keyOf('prevEdit'))})`; $('#bNextEdit').title = `${L.act.nextEdit} (${keyLabel(keyOf('nextEdit'))})`;
    $('#bLoop').classList.toggle('on', !!S.set.loop); $('#bLoop').title = `${L.loopTip} (${keyLabel(keyOf('loop'))})`;
    const rb = $('#bRate'); rb.textContent = rateTxt(PL.rate); rb.classList.toggle('on', PL.rate !== 1); rb.title = L.speedTip;
    const box = $('#prepBox'); box.hidden = !prep;
    if (prep) box.innerHTML = `<b>${esc(L.preparing(Math.round(PL.prep * 100)))}</b><span>${esc(L.preparingSub)}</span><i style="--p:${(PL.prep * 100).toFixed(1)}%"></i>`;
    renderPlayRows();
  }
  // linhas da lista de trechos: a que está tocando mostra o andamento
  function renderPlayRows() {
    const p = PL.on && PL.plan && PL.q === itemOf(S.cutter && S.cutter.id) ? PL.plan : null;
    const k = p ? (p.kind === 'cut' ? p.cut : p.kind === 'cuts' ? cutAt(PL.q) : -1) : -1;
    $$('#cutList .cut-row').forEach((r) => { const on = +r.dataset.i === k; r.classList.toggle('playing', on); if (!on) r.style.removeProperty('--pp'); });
  }
  // em cima da prévia: "Trecho 2 · 00:00:03:12 / 00:00:07:00" (quanto já tocou do trecho e quanto ele dura)
  function renderPlayInfo(t) {
    const bd = $('#playBadge'); const p = PL.on && PL.plan; const q = PL.q;
    if (!p || p.kind === 'all') { if (!bd.classList.contains('fade')) bd.hidden = true; return; }
    // no resultado conta em cima de todos os trechos (onde o play está no arquivo que vai sair)
    const P = p.all || p.parts; const fr = frOf(q); let el = 0; let k = P.length - 1;
    for (let i = 0; i < P.length; i++) { const [a, b] = P[i]; if (t < b - 1e-6) { el += Math.max(0, t - a); k = i; break; } el += b - a; }
    const tot = P.reduce((s, [a, b]) => s + b - a, 0);
    // contando o quadro que está na tela: no último quadro dá a duração inteira
    el = Math.min(tot, el + 1 / fr);
    bd.hidden = false; bd.classList.remove('fade');
    bd.innerHTML = `<i>${ICONS.cut}${p.kind === 'cut' ? esc(L.playingCut(p.cut + 1)) : `${esc(L.playingCuts)} <small>${L.cutK(k + 1, P.length)}</small>`}</i><b>${tcF(q, el)}</b><span>/ ${tcF(q, tot)}</span>`;
    const ci = p.kind === 'cut' ? p.cut : k; const c = (q.cuts || [])[ci]; const row = $(`#cutList .cut-row[data-i="${ci}"]`);
    if (row && c) row.style.setProperty('--pp', `${(clamp((t - c[0] + 1 / fr) / (c[1] - c[0]), 0, 1) * 100).toFixed(2)}%`);
  }
  $('#bPlay').onclick = () => { if (PL.on) playStop(); else playStart({ kind: 'auto' }); };
  $('#bLoop').onclick = () => { S.set.loop = !S.set.loop; saveSettings(); renderPlayUi(); };
  // play com os cortes (pula o que foi cortado) ou sem (o original); tocando, continua do mesmo ponto no outro modo
  function toggleSkip() {
    S.set.skipCuts = S.set.skipCuts === false; saveSettings();
    if (PL.on && PL.plan && PL.plan.kind !== 'cut') { const t = PL.mode === 'demo' ? PL.dt : curSrc(); playStart({ kind: 'auto', from: snapT(PL.q, t) }); }
    renderPlayUi();
  }
  $('#bSkip').onclick = toggleSkip;
  $('#bRate').onclick = (e) => openMenu(e.currentTarget, RATES.map((r) => ({ label: rateTxt(r), value: r, sel: r === PL.rate })), (v) => setRate(+v));
  $('#bVol').onclick = () => { S.set.muted = !S.set.muted; saveSettings(); applyVol(); };
  $('#volR').addEventListener('input', (e) => { S.set.vol = +e.target.value / 100; S.set.muted = false; applyVol(); });
  $('#volR').addEventListener('change', saveSettings);
  $('#bVol').addEventListener('wheel', (e) => {
    e.preventDefault(); S.set.muted = false;
    S.set.vol = Math.round(clamp((S.set.vol != null ? +S.set.vol : 1) - Math.sign(e.deltaY) * 0.05, 0, 1) * 100) / 100;
    saveSettings(); applyVol();
  }, { passive: false });
  S.plReady = true;

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

  // Proporção + como encaixar (cortar ou barras)
  const ASPECTS = [['source', null], ['9:16', '9:16'], ['16:9', '16:9'], ['1:1', '1:1'], ['4:5', '4:5'], ['4:3', '4:3'], ['3:4', '3:4'], ['21:9', '21:9']];
  const aspectRows = (c) => `${row(`<span class="lbl-i">${L.aspect}<span class="info" tabindex="0" aria-label="${esc(L.aspectTip)}" data-tip="${esc(L.aspectTip)}">${ICONS.info}</span></span>`, dd('aspect', c.aspect || 'source', ASPECTS.map(([v, t]) => [v, t || L.source])))}
          <div class="collapse ${ratioOf(c) ? '' : 'closed'}" style="max-height:60px">${row(L.aspectMode, segH('aspectMode', c.aspectMode || 'crop', [['crop', L.crop], ['pad', L.bars]]))}</div>`;
  // Preset de imagem: formato, qualidade, tamanho e giro
  function imageInspector(c, src) {
    const im = c.image || { format: 'jpg', quality: 90, lossless: false };
    const lossy = im.format === 'jpg' || (im.format === 'webp' && !im.lossless);
    return sec('image', L.imageSec, imageOutTxt(c, src), `<div class="group">
      ${row(L.format + `<small class="res-out">.${IEXT[im.format] || 'jpg'}</small>`, dd('image.format', im.format, [['jpg', 'JPG'], ['png', 'PNG'], ['webp', 'WebP']]))}
      ${lossy ? row(L.quality, dd('image.quality', im.quality || 90, [[100, '100%'], [95, '95%'], [90, '90%'], [85, '85%'], [80, '80%'], [70, '70%'], [60, '60%']])) : ''}
      ${im.format === 'webp' ? row(L.lossless, sw('image.lossless', !!im.lossless)) : ''}
      ${row(`${L.resolution}${src && src.w ? `<small class="res-out">${resLabel(c, src)}</small>` : ''}`, dd('scale', c.scale, [['source', L.source], ['50', '50%'], ['25', '25%'], ['custom', L.custom]]))}
      ${aspectRows(c)}
      <div class="collapse ${c.scale === 'custom' ? '' : 'closed'}" style="max-height:60px">
        ${row(L.size, `<div class="field"><input class="tnum" data-k="customW" value="${c.customW || ''}" placeholder="auto"><span>W</span></div><span class="times">×</span><div class="field"><input class="tnum" data-k="customH" value="${c.customH || ''}" placeholder="auto"><span>H</span></div>`)}
      </div>
      ${row(L.rotate, dd('rotate', c.rotate || 0, [[0, L.rotNone], [90, L.rotCw], [180, '180°'], [270, L.rotCcw]]))}
    </div>${im.format === 'jpg' ? `<div class="hint">${L.jpgNoAlpha}</div>` : ''}`);
  }
  // Preset de áudio: só formato, qualidade, taxa e canais
  function audioInspector(c, src) {
    const a = c.audio; const s0 = srcAud(src); const lossy = a.codec === 'mp3' || a.codec === 'aac'; const pcm = a.codec === 'wav' || a.codec === 'flac';
    return sec('audio', L.audio, audioOutTxt(c, src), `<div class="group">
      ${row(L.format + (a.codec !== 'copy' ? `<small class="res-out">.${AEXT[a.codec]}</small>` : ''), dd('audio.codec', a.codec, [['wav', 'WAV'], ['mp3', 'MP3'], ['aac', 'AAC (.m4a)'], ['flac', 'FLAC'], ['copy', L.copy]]))}
      ${lossy ? row(L.quality + (!a.kbps && s0 && s0.kbps ? `<small class="res-out">${Math.min(320, Math.max(64, s0.kbps))} kb/s</small>` : ''), dd('audio.kbps', a.kbps, [[0, L.source], [128, '128 kb/s'], [192, '192 kb/s'], [256, '256 kb/s'], [320, '320 kb/s']])) : ''}
      ${pcm ? row(L.audioBits + (!a.bits && s0 ? `<small class="res-out">${s0.bits >= 24 ? 24 : 16}-bit</small>` : ''), dd('audio.bits', a.bits || 0, [[0, L.source], [16, '16-bit'], [24, '24-bit']])) : ''}
      ${a.codec !== 'copy' ? row(L.sampleRate + (!a.rate && s0 ? `<small class="res-out">${khz(a.codec === 'mp3' && s0.rate > 48000 ? 48000 : s0.rate)}</small>` : ''), dd('audio.rate', a.rate || 0, [[0, L.source], [44100, '44,1 kHz'], [48000, '48 kHz']])) : ''}
      ${a.codec !== 'copy' ? row(L.channels, dd('audio.channels', a.channels || 'source', [['source', L.source], ['stereo', L.stereo], ['mono', L.mono]])) : ''}
    </div>${src && !src.audioOnly ? `<div class="hint">${L.extractHint}</div>` : ''}`);
  }
  function renderInspector(anim) {
    const T = target(); const el = $('#inspIn');
    if (!T.cfg) { el.innerHTML = ''; return; }
    const c = T.cfg; const src = T.src;
    const mod = T.isPreset ? T.dirty : T.preset && !same(c, T.preset);
    // Editando um preset: o nome e a cor ficam só nos presets lá em cima (sem repetir aqui).
    $('#inspFor').innerHTML = T.isPreset ? ''
      : S.picked.size > 1 ? L.settingsForN(S.picked.size) : T.q && (T.q.src.audioOnly || T.q.src.isImage) ? L.thisFile : L.settingsFor;
    $('#inspFor').classList.toggle('editing', T.isPreset);
    $('.insp-title').classList.toggle('hide', !!T.isPreset && !mod);
    $('#modified').classList.toggle('show', !!mod); $('#bSavePreset').classList.toggle('show', !!mod);
    $('#bSavePreset').textContent = T.isPreset ? L.saveChanges : L.saveToPreset;
    $('#bDiscard').classList.toggle('show', !!(mod && T.isPreset));
    const a = c.audio; const o = c.output; const aq = aacOut(a, src); const h264 = c.codec === 'h264';
    const dims = src ? outDims(src, c) : null;
    const resHint = !src && c.scale === '1080' ? `<div class="hint">${L.scale1080Hint}</div>` : '';
    const rotTxt = c.rotate ? ` · ↻ ${c.rotate}°` : '';
    const top = (T.isPreset ? '' : S.picked.size > 1 ? `<div class="hint top-hint multi-hint">${L.multiHint(S.picked.size)}</div>` : '');
    if (isImageP(c)) el.innerHTML = top + imageInspector(c, src);
    else if (isAudioP(c)) el.innerHTML = top + audioInspector(c, src) + sec('adv', L.advanced, c.metadata ? L.metadata : '—', `<div class="group">${row(L.metadata, sw('metadata', c.metadata), L.metadataSub)}</div>`);
    else el.innerHTML = top
      + sec('video', L.video, `${codecName(codecOut(c, src) || c.codec)} · ${bitsTxt(c, src)}${chromaOut(c, src) === '422' ? ' 4:2:2' : ''} · ${scaleTxt(c.scale)}${ratioOf(c) ? ' · ' + c.aspect : ''}${rotTxt} · ${c.fps.conform ? fpsCfrTxt(c, src) : c.bitrate.mode === 'manual' ? fmtK(c.bitrate.kbps) : c.bitrate.mode === 'source' ? L.source : { high: L.autoHigh, balanced: L.autoBalanced, light: L.autoLight }[autoLevel(c)]}${c.hdrToSdr ? ' · 709' : ''}`,
        `<div class="group">
          ${row(`${L.resolution}<small class="res-out">${resLabel(c, src)}</small>`, dd('scale', c.scale, [['source', L.source], ['1080', '1080p'], ['50', '50%'], ['25', '25%'], ['custom', L.custom]]))}
          ${aspectRows(c)}
          <div class="collapse ${c.scale === 'custom' ? '' : 'closed'}" style="max-height:60px">
            ${row(L.size, `<div class="field"><input class="tnum" data-k="customW" value="${c.customW || ''}" placeholder="auto"><span>W</span></div><span class="times">×</span><div class="field"><input class="tnum" data-k="customH" value="${c.customH || ''}" placeholder="auto"><span>H</span></div>`)}
          </div>
          ${row(`<span class="lbl-i">${L.bitrate}<span class="info" tabindex="0" aria-label="${esc(L.bitrateTip)}" data-tip="${esc(L.bitrateTip)}">${ICONS.info}</span></span>`, dd('bitrateSel', c.bitrate.mode === 'auto' ? 'auto:' + autoLevel(c) : c.bitrate.mode, [['source', L.source], ['auto:high', L.autoHigh], ['auto:balanced', L.autoBalanced], ['auto:light', L.autoLight], ['manual', L.manual]]))}
          <div class="collapse ${c.bitrate.mode === 'manual' ? '' : 'closed'}" style="max-height:60px">
            ${row(L.value, `<div class="field"><input class="tnum" data-k="bitrate.kbps" value="${num(c.bitrate.kbps, 0)}"><span>kb/s</span></div>${dd('bitrate.rc', c.bitrate.rc, [['cbr', 'CBR'], ['vbr', 'VBR']])}`)}
          </div>
          ${row(L.codec + (c.codec === 'source' && src ? `<small class="res-out">${codecName(codecOut(c, src))}</small>` : ''), dd('codec', c.codec, [['source', L.source], ['h264', 'H.264'], ['h265', 'H.265']]))}
          ${row(L.bitDepth + (!c.bits && src ? `<small class="res-out">${bitsOut(c, src)}-bit</small>` : ''), dd('bits', c.bits, [[0, L.source], [8, '8-bit'], [10, '10-bit']]))}
          ${row(L.chroma + ((c.chroma || '420') === 'source' && src ? `<small class="res-out">${chromaOut(c, src) === '422' ? '4:2:2' : '4:2:0'}</small>` : ''), dd('chroma', c.chroma || '420', [['source', L.source], ['420', '4:2:0'], ['422', '4:2:2']]))}
          ${row(L.fps + (c.fps.value === 'source' && c.fps.conform && src ? `<small class="res-out">${fpsTxt(srcFps(src))} fps</small>` : ''), dd('fps.value', c.fps.conform ? c.fps.value : 'source', [['source', L.source], ...FPS_OPTS]))}
          ${row(L.fpsMode, segH('fpsMode', c.fps.conform ? 'cfr' : 'vfr', [['vfr', 'VFR'], ['cfr', 'CFR']]))}
          ${row(L.rotate, dd('rotate', c.rotate || 0, [[0, L.rotNone], [90, L.rotCw], [180, '180°'], [270, L.rotCcw]]))}
          ${row(L.maxQuality, sw('maxQuality', c.maxQuality))}
          ${row(`<span class="lbl-i">${L.hdr}<span class="info" tabindex="0" aria-label="${esc(L.hdrSub)}" data-tip="${esc(L.hdrSub)}">${ICONS.info}</span></span>` + (src && src.hdr ? `<span class="pill-tag" style="--c:${COLORS.yellow}">${L.detected(src.hdr)}</span>` : ''), dd('hdrToSdr', !!c.hdrToSdr, [[true, L.hdrAuto], [false, L.off]]))}
        </div>${resHint}${codecOut(c, src) === 'h264' && src && Math.max(outDims(src, c).w, outDims(src, c).h) > 4096 ? `<div class="hint warn-t">${L.h264Max}</div>` : ''}${cpuEncode(c, src) ? `<div class="hint warn-t">${chromaOut(c, src) === '422' ? L.cpuWarn422 : L.cpuWarnH264}</div>` : ''}${src && src.hdr && !c.hdrToSdr ? `<div class="hint warn-t">${L.hdrWarn}</div>` : ''}`)
      + sec('audio', L.audio, a.codec === 'copy' ? L.copy : `AAC · ${a.channels === 'stereo' ? L.stereo : L.mono}`,
        `<div class="group">
          ${row(L.codec, dd('audio.codec', a.codec, [['aac', 'AAC'], ['copy', L.copy]]))}
          ${a.codec === 'aac' ? row(L.channels, dd('audio.channels', a.channels, [['stereo', L.stereo], ['mono', L.mono]])) : ''}
          ${a.codec === 'aac' ? row(L.tracks, `<div class="val">${a.channels === 'stereo' ? trackBtn(0, a.tracks[0]) + trackBtn(1, a.tracks[1]) : trackBtn(0, a.tracks[0])}</div>`, a.channels === 'stereo' ? L.tracksStereo : L.tracksMono) : ''}
          ${a.codec === 'aac' ? row(L.quality + (!a.kbps && aq.kbps ? `<small class="res-out">${aq.kbps} kb/s</small>` : ''), dd('audio.kbps', a.kbps ?? 256, [[0, L.source], [128, '128 kb/s'], [192, '192 kb/s'], [256, '256 kb/s'], [320, '320 kb/s']])) : ''}
          ${a.codec === 'aac' ? row(L.sampleRate + (a.rate === 0 && aq.rate ? `<small class="res-out">${khz(aq.rate)}</small>` : ''), dd('audio.rate', a.rate === 0 ? 0 : a.rate === 44100 ? 44100 : 48000, [[0, L.source], [44100, '44,1 kHz'], [48000, '48 kHz']])) : ''}
        </div>`)
      + sec('adv', L.advanced, [c.avSync ? L.avSync : null, c.metadata ? L.metadata : null].filter(Boolean).join(' · ') || '—',
        `<div class="group">
          ${row(L.avSync, sw('avSync', c.avSync), L.avSyncSub)}
          ${row(L.metadata, sw('metadata', c.metadata), L.metadataSub)}
        </div>`);
    renderOutput(T);
    $$('.seg', el).forEach((s) => seg(s, (v) => set(s.dataset.k, v)));
    wireDD(el);
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
  function wireDD(root) {
    $$('[data-dd]', root).forEach((b) => { b.onclick = () => {
      const k = b.dataset.dd; const d = DD[k];
      openMenu(b, d.opts.filter((o) => !o[2]).map(([v, t]) => ({ label: t, value: v, sel: String(v) === String(d.val) })), (v) => { if (String(v) !== String(d.val)) set(k, v); });
    }; });
  }
  function renderOutput(T) {
    const c = T.cfg; const o = c.output; const box = $('#outPanel'); const fo = o.folder || { on: false, text: '' };
    const fixed = fo.on && fo.text;
    const file = T.q ? T.q.file : 'IMG_0001.MOV';
    box.innerHTML = `<div class="out-head"><span>${L.output}</span><small class="out-name" title="${esc(outPath(file, c, T.q))}">${esc(outName(file, c, T.q))}</small></div>
      <div class="group">
        ${row(L.saveIn, dd('output.dest', fixed ? 'folder' : 'same', [['same', L.sameAsOriginal], ...(fo.text ? [['folder', esc(lastPart(fo.text))]] : []), ['pick', L.chooseFolder]]))}
        ${fixed ? row(`<span class="lbl-i">${L.keepTree}<span class="info" tabindex="0" aria-label="${esc(L.keepTreeTip)}" data-tip="${esc(L.keepTreeTip)}">${ICONS.info}</span></span>`, sw('output.keepTree', o.keepTree !== false)) : ''}
        ${row(L.suffix, `<div class="field tagged ${o.suffix.on ? '' : 'off'}"><input data-k="output.suffix.text" value="${esc(o.suffix.text)}" class="txt" spellcheck="false"><button class="tag-btn" data-menu="1" data-tags="output.suffix.text" title="${esc(L.tagsTitle)}" aria-label="${esc(L.tagsTitle)}">{ }</button></div>${sw('output.suffix.on', o.suffix.on)}`)}
        ${row(L.subfolder, `<div class="field ${o.subfolder.on ? '' : 'off'}"><input data-k="output.subfolder.text" value="${esc(o.subfolder.text)}" class="txt" spellcheck="false"></div>${sw('output.subfolder.on', o.subfolder.on)}`)}
        ${isAudioP(c) || isImageP(c) ? '' : row(L.format + (c.container === 'source' && T.q ? `<small class="res-out">.${extOut(c, T.q.file)}</small>` : ''), dd('container', c.container || 'mp4', [['source', L.source], ['mp4', 'MP4'], ['mov', 'MOV']]))}
        ${row(L.deleteSrc, sw('output.deleteSource', o.deleteSource, true), '', o.deleteSource ? 'danger' : '')}
      </div>`;
    wireDD(box);
  }
  const lastPart = (p) => String(p).split(/[\\/]/).filter(Boolean).pop() || String(p);
  // Pasta de saída: mesma do original, a escolhida, ou escolher outra
  async function setDest(v) {
    const T = target(); const o = T.cfg.output; const fo = o.folder || { on: false, text: '' };
    if (v === 'pick') {
      let dir = null;
      if (REAL) { try { dir = await inv('pick_dir', { start: fo.text || null }); } catch (e) { toast(String(e)); } } else dir = 'D:\\Renders';
      if (!dir) return;
      o.folder = { on: true, text: dir };
    } else o.folder = { on: v === 'folder', text: fo.text };
    if (o.keepTree === undefined) o.keepTree = true;
    if (!T.isPreset) spread(T.q, ['output.folder', 'output.keepTree']);
    renderQueue(); renderPresets(); renderInspector(); renderPreview();
  }
  // Etiquetas no nome: {codec} {preset} {data} {hora} {res} {fps} {bits} {n} (iguais às do motor)
  function nowTags() { const d = new Date(); return { date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, time: `${pad(d.getHours())}-${pad(d.getMinutes())}` }; }
  function tagMap(cfg, q) {
    const src = q && q.src; const t = nowTags();
    const vid = !!(src && !src.audioOnly && !isAudioP(cfg));
    const d = vid && src.w ? outDims(src, cfg) : null;
    const codec = isImageP(cfg) ? ({ png: 'PNG', webp: 'WEBP' }[(cfg.image || {}).format] || 'JPG') : isAudioP(cfg) ? (ACODEC[cfg.audio.codec] || 'AUDIO') : (codecOut(cfg, src) === 'h264' ? 'H264' : 'H265');
    const fps = vid && !isImageP(cfg) ? (cfg.fps.conform && cfg.fps.value !== 'source' ? cfg.fps.value : srcFps(src)) : '';
    const bits = isAudioP(cfg) ? (['wav', 'flac'].includes(cfg.audio.codec) ? Math.max(16, cfg.audio.bits || 0) + 'bit' : '') : isImageP(cfg) ? '' : (bitsOut(cfg, src) || 8) + 'bit';
    const i = q ? S.queue.indexOf(q) : -1;
    return { codec, preset: cfg.name || '', data: t.date, date: t.date, hora: t.time, time: t.time, res: d ? `${d.w}x${d.h}` : '', fps, bits, n: pad(i >= 0 ? i + 1 : 1) };
  }
  const cleanName = (s) => String(s).replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').trim();
  const applyTags = (text, cfg, q) => { const m = tagMap(cfg, q); return String(text).replace(/\{(\w+)\}/g, (x, k) => (k in m ? m[k] : x)); };
  function tagMenu(btn) {
    const k = btn.dataset.tags; const input = btn.parentElement.querySelector('input'); const T = target(); const m = tagMap(T.cfg, T.q);
    openMenu(btn, Object.keys(L.tagDesc).map((t) => ({ label: `{${t}}  ${L.tagDesc[t]}${m[t] ? ' · ' + m[t] : ''}`, value: t })), (t) => {
      const v = input.value; const a = input.selectionStart ?? v.length; const b = input.selectionEnd ?? a;
      const nv = v.slice(0, a) + `{${t}}` + v.slice(b);
      const ks = k.split('.'); ks.pop(); const tog = ks.reduce((o, x) => o[x], T.cfg);
      if (tog && tog.on === false) { tog.on = true; if (!T.isPreset) spread(T.q, [ks.join('.') + '.on']); }
      set(k, nv);
    });
  }
  // texto da resolução final ao lado de "Resolução"
  // texto da resolução final ao lado de "Resolução"
  function resLabel(c, src) {
    if (src) { const d = outDims(src, c); return `${d.w} × ${d.h}`; }
    if (c.scale === 'custom') return c.customW || c.customH ? `${c.customW || 'auto'} × ${c.customH || 'auto'}` : L.source;
    return { source: L.sameAsSource, '1080': L.shortSide1080, '50': L.halfOfSource, '25': L.quarterOfSource }[c.scale] || '';
  }
  function outName(file, cfg, q) {
    const c = cfg.output; const base = file.replace(/\.[^.]+$/, '');
    const suf = c.suffix.on ? cleanName(applyTags(c.suffix.text, cfg, q || null)) : '';
    // trechos separados: um arquivo por trecho (_01, _02...)
    const n = q && cutsOf(q) && !q.cutJoin ? q.cuts.length : 0;
    return base + suf + (n > 1 ? `_01…_${pad(n)}` : '') + '.' + (isImageP(cfg) ? (IEXT[(cfg.image || {}).format] || 'jpg') : isAudioP(cfg) ? (AEXT[cfg.audio.codec] || String(file).split('.').pop()) : extOut(cfg, file));
  }
  // todos os arquivos que vão sair deste vídeo (um por trecho, se separados)
  function outNames(q) {
    const one = outName(q.file, q.cfg, null); const n = cutsOf(q) && !q.cutJoin ? q.cuts.length : 0;
    if (n < 2) return [one];
    const dot = one.lastIndexOf('.');
    return Array.from({ length: n }, (_, i) => `${one.slice(0, dot)}_${pad(i + 1)}${one.slice(dot)}`);
  }
  // caminho completo (para a dica): pasta escolhida + subpastas de origem + subpasta + nome
  function outPath(file, cfg, q) {
    const c = cfg.output; const fo = c.folder || {};
    const parts = [];
    if (fo.on && fo.text) { parts.push(fo.text.replace(/[\\/]+$/, '')); if (c.keepTree !== false && q && q.dir) parts.push(...q.dir.split('/').map(cleanName).filter(Boolean)); }
    else parts.push(q && q.path ? q.path.replace(/[\\/][^\\/]*$/, '') : L.sameAsOriginal);
    if (c.subfolder.on && cleanName(applyTags(c.subfolder.text, cfg, q))) parts.push(cleanName(applyTags(c.subfolder.text, cfg, q)));
    parts.push(outName(file, cfg, q));
    return parts.join('\\');
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
    if (key === 'output.dest') { setDest(v); return; }
    const T = target();
    const ks = key.split('.'); let o = T.cfg; ks.slice(0, -1).forEach((k) => { o = o[k]; });
    const last = ks[ks.length - 1];
    o[last] = typeof o[last] === 'boolean' ? !o[last] : typeof o[last] === 'number' ? Number(String(v).replace(/\D/g, '')) || 0 : v;
    if (key === 'customW' || key === 'customH') o[last] = Math.min(16384, Number(String(v).replace(/\D/g, '')) || 0);
    if (key === 'audio.channels') T.cfg.audio.tracks = v === 'mono' ? [1, 1] : [1, 2];
    if (key === 'bitrateSel') { delete T.cfg.bitrateSel; const [m, lv] = String(v).split(':'); T.cfg.bitrate.mode = m; if (lv) T.cfg.bitrate.level = lv; }
    if (key === 'fpsMode') { delete T.cfg.fpsMode; T.cfg.fps.conform = v === 'cfr'; }
    if (key === 'fps.value' && v !== 'source') T.cfg.fps.conform = true;
    if (!T.isPreset) spread(T.q, key === 'bitrateSel' ? ['bitrate.mode', 'bitrate.level'] : key === 'fpsMode' ? ['fps.conform'] : [key, ...(key === 'audio.channels' ? ['audio.tracks'] : []), ...(key === 'fps.value' ? ['fps.conform'] : [])]);
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
  // { } das etiquetas: abre no pointerdown para o campo não perder o foco (nem o que foi digitado)
  $('#outPanel').addEventListener('pointerdown', (e) => { const tb = e.target.closest('[data-tags]'); if (tb) { e.preventDefault(); tagMenu(tb); } });
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
    // página dos atalhos (aberta pelo botão "Editar" em Configurações)
    const keysPage = S.sheetPage === 'keys';
    $('#lSettings').textContent = keysPage ? L.shortcuts : L.settings;
    $('#bSheetBack').hidden = !keysPage;
    if (keysPage) { renderKeysPage(); return; }
    const dp = presetOf(S.set.defaultPreset) || S.presets[0];
    $('#sheetBody').innerHTML = `
      <div class="group">
        ${row(L.language, `<button class="field pick" data-menu="1" id="bLang">${esc((LANGS.find((l) => l[0] === S.set.lang) || LANGS[0])[1])}${ICONS.chev}</button>`)}
        ${row(L.appearance, segH('theme', S.set.theme, [['system', L.system], ['light', L.light], ['dark', L.dark], ['oled', L.oled], ['studio', L.studio]]))}
      </div>
      <div class="sec-label">${L.general}</div>
      <div class="group">
        ${row(L.newVideosUse, `<button class="field pick" data-menu="1" id="bSheetDef"><i class="dotc" style="--c:${dp ? COLORS[dp.color] : 'var(--text-3)'}"></i>${dp ? esc(dp.name) : ''}${ICONS.chev}</button>`)}
        ${S.presets.some(isImageP) ? row(L.newImageUse, `<button class="field pick" data-menu="1" id="bSheetDefI"><i class="dotc" style="--c:${COLORS[(presetOf(defaultImageId()) || {}).color] || 'var(--text-3)'}"></i>${esc((presetOf(defaultImageId()) || {}).name || '')}${ICONS.chev}</button>`) : ''}
        ${S.presets.some(isAudioP) ? row(L.newAudioUse, `<button class="field pick" data-menu="1" id="bSheetDefA"><i class="dotc" style="--c:${COLORS[(presetOf(defaultAudioId()) || {}).color] || 'var(--text-3)'}"></i>${esc((presetOf(defaultAudioId()) || {}).name || '')}${ICONS.chev}</button>`) : ''}
        ${row(L.clearWhenDone, sw('clearWhenDone', S.set.clearWhenDone))}
        ${row(L.sound, sw('sound', S.set.sound))}
        ${row(L.notify, sw('notify', S.set.notify))}
      </div>
      <div class="sec-label">${L.performance}</div>
      <div class="group">
        ${row(L.gpu, `<span class="val">${engineTxt()}</span>`)}
        ${row(L.parallel, segH('parallel', clamp(+S.set.parallel || 1, 1, 3), [[1, '1'], [2, '2'], [3, '3']]), L.parallelSub)}
        ${row(L.renderLog, `<button class="field pick" id="bOpenLog">${L.open}</button>`, L.renderLogSub)}
      </div>
      <div class="sec-label">${L.playback}</div>
      <div class="group">
        ${row(L.playQ, segH('playQ', playQ(), [['auto', 'Auto'], ['360', '360p'], ['540', '540p'], ['720', '720p'], ['1080', '1080p']]), L.playQSub)}
        ${row(L.previewsSaved, `<span class="val tnum" id="prevSize">…</span><button class="field pick" id="bClearPrev">${L.clearPreviews}</button>`, L.previewsSub)}
        ${row(L.previewsAge, segH('previewDays', String(prevDays()), [['1', L.days(1)], ['7', L.days(7)], ['30', L.days(30)], ['0', L.never]]), L.previewsAgeSub)}
        ${row(L.previewsLimit, segH('previewGB', String(+S.set.previewGB || 5), [['2', '2 GB'], ['5', '5 GB'], ['10', '10 GB'], ['20', '20 GB']]))}
      </div>
      <div class="sec-label">${L.watchTitle}</div>
      <div class="group watch-list">
        ${(S.set.watch || []).map((w, i) => { const p = presetOf(w.preset) || findPreset(w.preset); return `<div class="row watch-row ${w.on === false ? 'off' : ''}">
          <span class="lbl" title="${esc(w.path)}">${ICONS.folder}<span class="wname">${esc(lastPart(w.path))}</span><small>${esc(w.path)}</small></span>
          <button class="field pick" data-menu="1" data-wpreset="${i}"><i class="dotc" style="--c:${p ? COLORS[p.color] || COLORS.blue : 'var(--text-3)'}"></i>${p ? esc(p.name) : '?'}${ICONS.chev}</button>
          ${`<button class="switch ${w.on === false ? '' : 'on'}" data-wtoggle="${i}"></button>`}
          <button class="a w-del" data-wdel="${i}" title="${esc(L.remove)}">${ICONS.x}</button></div>`; }).join('')}
        <div class="row"><button class="link add-watch" id="bAddWatch">${ICONS.plus}${L.watchAdd}</button></div>
      </div>
      <div class="hint">${L.watchHint}</div>
      <div class="sec-label">${L.automation}</div>
      <div class="group">
        ${row(L.jobsFolder, `<button class="field pick" id="bJobs">${L.open}</button>`, L.jobsSub)}
        ${row(L.cliTitle, `<button class="field pick" id="bCli">${L.copyPath}</button>`, `<code>mec convert &lt;${esc(L.cliFiles)}&gt; -p RAW</code>`)}
      </div>
      <div class="sec-label">${L.shortcuts}</div>
      <div class="group">
        ${row(L.shortcutsEdit, `<button class="field pick" id="bKeysPage">${L.edit}<span class="chev-r">›</span></button>`, kf(L.keysSummary))}
      </div>
      <div class="sec-label">${L.updates}</div>
      <div class="group">
        ${row(L.autoUpdate, `<button class="switch ${autoUpd() ? 'on' : ''}" id="swAutoUpd"></button>`, L.autoUpdateSub)}
        ${row(`${L.version} ${esc(S.version)}`, S.update
          ? `<button class="btn small" id="bSheetUpdate">${L.updateNow} · ${esc(S.update.version)}</button>`
          : `<button class="field pick" id="bCheckUpdate">${L.checkUpdates}</button>`)}
      </div>
      <div class="hint">${L.dataSaved}</div>
      <div class="about">Mec Encoder ${esc(S.version)} · <span>@hugoeditor_</span></div>`;
    $$('#sheetBody .seg').forEach((s) => seg(s, (v) => {
      if (s.dataset.k === 'theme') { setTheme(v); return; }
      if (s.dataset.k === 'parallel') { S.set.parallel = +v; saveSettings(); return; }
      if (s.dataset.k === 'playQ') { S.set.playQ = v; S.queue.forEach((q) => { delete q.liveH; }); saveSettings(); return; }
      if (s.dataset.k === 'previewGB') { S.set.previewGB = +v; saveSettings(); return; }
      if (s.dataset.k === 'previewDays') { S.set.previewDays = +v; saveSettings(); prunePreviews(); return; }
    }));
    $('#bLang').onclick = (e) => openMenu(e.currentTarget, LANGS.map(([v, n]) => ({ label: n, value: v, sel: S.set.lang === v })),
      (v) => { S.set.lang = v; saveSettings(); applyLang(); renderAll(); renderSheet(); });
    $('#bSheetDef').onclick = (e) => openMenu(e.currentTarget, presetItems(S.set.defaultPreset).filter((i) => !isAudioP(presetOf(i.value)) && !isImageP(presetOf(i.value))), (v) => { S.set.defaultPreset = v; saveSettings(); renderSheet(); renderQueue(); });
    const di = $('#bSheetDefI'); if (di) di.onclick = (e) => openMenu(e.currentTarget, presetItems(defaultImageId()).filter((i) => isImageP(presetOf(i.value))), (v) => { S.set.defaultImagePreset = v; saveSettings(); renderSheet(); });
    const da = $('#bSheetDefA'); if (da) da.onclick = (e) => openMenu(e.currentTarget, presetItems(defaultAudioId()).filter((i) => isAudioP(presetOf(i.value))), (v) => { S.set.defaultAudioPreset = v; saveSettings(); renderSheet(); });
    $('#bOpenLog').onclick = () => (REAL ? inv('open_log').catch((e) => toast(String(e))) : toast('render.log'));
    const cu = $('#bCheckUpdate'); if (cu) cu.onclick = () => checkUpdate(true);
    $('#swAutoUpd').onclick = () => { S.set.autoUpdate = !autoUpd(); saveSettings(); renderSheet(); renderUpdCard(); if (autoUpd()) checkUpdate(false); };
    const su = $('#bSheetUpdate'); if (su) su.onclick = installUpdate;
    $('#bAddWatch').onclick = addWatch;
    const showPrev = (n) => { const el = $('#prevSize'); if (el) el.textContent = n > 0 ? fmtMB(n / 1e6) : L.none; };
    if (REAL) inv('previews_size').then(showPrev).catch(() => showPrev(0)); else showPrev(1.8e9);
    $('#bClearPrev').onclick = () => {
      if (REAL) inv('previews_clear').then(() => { S.queue.forEach((q) => { if (q.play) { delete q.play.proxy; } }); showPrev(0); toast(L.previewsCleared, true); }).catch((e) => toast(String(e)));
      else { showPrev(0); toast(L.previewsCleared, true); }
    };
    $('#bKeysPage').onclick = () => { S.sheetPage = 'keys'; renderSheet(); $('#sheetScroll').scrollTop = 0; };
    $('#bJobs').onclick = () => (REAL ? inv('open_jobs_dir').catch((e) => toast(String(e))) : toast('%APPDATA%\\com.hugomec.mecencoder\\jobs'));
    $('#bCli').onclick = async () => {
      let path = 'C:\\Program Files\\Mec Encoder\\bin\\mec.exe';
      if (REAL) { try { const a = await inv('automation_info'); if (!a.cli) { toast(L.cliMissing); return; } path = a.cli; } catch (e) { toast(String(e)); return; } }
      const t = `"${path}"`;
      try { await navigator.clipboard.writeText(t); toast(L.copiedPath, true); } catch { toast(t); }
    };
    $$('[data-wpreset]').forEach((b) => { b.onclick = (e) => { const w = S.set.watch[+b.dataset.wpreset];
      openMenu(e.currentTarget, presetItems(w.preset), (v) => { w.preset = v; saveSettings(); sendWatch(); renderSheet(); }); }; });
    $$('[data-wdel]').forEach((b) => { b.onclick = () => { S.set.watch.splice(+b.dataset.wdel, 1); saveSettings(); sendWatch(); renderSheet(); }; });
  }
  function renderKeysPage() {
    $('#sheetBody').innerHTML = `
      <div class="keys-top"><span>${L.shortcutsHint}</span><button class="link keys-reset" id="bKeysReset">${L.resetKeys}</button></div>
      ${[['download', L.kgDownload], ['play', L.kgPlay], ['cutter', L.kgCutter], ['timeline', L.kgTimeline]].map(([g, t]) => `<div class="group keys-group"><div class="keys-title">${t}</div>${KEYS.filter((x) => x[2] === g).map(([a]) =>
        row(L.act[a], `<button class="keycap ${S.keyCapture === a ? 'capturing' : ''} ${keyOf(a) ? '' : 'empty'}" data-key="${a}">${S.keyCapture === a ? L.pressKey : esc(keyLabel(keyOf(a)))}</button>`)).join('')}</div>`).join('')}
`;
    $$('#sheetBody [data-key]').forEach((b) => { b.onclick = () => { S.keyCapture = S.keyCapture === b.dataset.key ? null : b.dataset.key; renderSheet(); }; });
    $('#bKeysReset').onclick = () => { S.set.keys = {}; S.keyCapture = null; saveSettings(); renderSheet(); applyLang(); };
  }
  const renderSheetIfOpen = () => root.classList.contains('sheet-open') && renderSheet();
  $('#sheetBody').addEventListener('click', (e) => {
    const s = e.target.closest('.switch'); if (!s) return;
    if (s.dataset.wtoggle != null) { const w = S.set.watch[+s.dataset.wtoggle]; w.on = w.on === false; saveSettings(); sendWatch(); renderSheet(); return; }
    s.classList.toggle('on'); S.set[s.dataset.k] = s.classList.contains('on'); saveSettings();
    if (s.dataset.k === 'sound' && S.set.sound) playDone();
  });
  const openSheet = (on) => { S.keyCapture = null; if (on) { S.sheetPage = qs.get('sheet') === 'keys' && !S.sheetSeen ? 'keys' : null; S.sheetSeen = true; renderSheet(); } root.classList.toggle('sheet-open', on); };
  $('#bSheetBack').onclick = () => { S.sheetPage = null; S.keyCapture = null; renderSheet(); $('#sheetScroll').scrollTop = 0; };
    $('#bDone').onclick = () => openSheet(false);
  $('#sheetBg').onclick = () => openSheet(false);
  /* ---------- atalhos (configuráveis em Configurações › Atalhos) ---------- */
  const KEYS = [
    ['openCutter', 'C', 'cutter'], ['markIn', 'I', 'cutter'], ['markOut', 'O', 'cutter'], ['newCut', 'S', 'cutter'],
    ['clearCuts', 'Ctrl+Shift+X', 'cutter'], ['cutDone', 'Enter', 'cutter'],
    ['prevFrame', 'ArrowLeft', 'timeline'], ['nextFrame', 'ArrowRight', 'timeline'], ['prevEdit', 'ArrowUp', 'timeline'], ['nextEdit', 'ArrowDown', 'timeline'], ['back5', 'Shift+ArrowLeft', 'timeline'], ['fwd5', 'Shift+ArrowRight', 'timeline'],
    ['zoomIn', '=', 'timeline'], ['zoomOut', '-', 'timeline'], ['zoomFit', '\\', 'timeline'],
    ['goIn', 'Shift+I', 'timeline'], ['goOut', 'Shift+O', 'timeline'], ['goStart', 'Home', 'timeline'], ['goEnd', 'End', 'timeline'],
    ['play', 'Space', 'play'], ['skipCuts', 'Shift+Space', 'play'], ['shuttleBack', 'J', 'play'], ['shuttleStop', 'K', 'play'], ['shuttleFwd', 'L', 'play'],
    ['loop', 'Ctrl+L', 'play'],
    ['dlVideo', 'Ctrl+V', 'download'], ['dlAudio', 'Ctrl+Shift+V', 'download'],
  ];
  const keyOf = (a) => { const k = S.set.keys && S.set.keys[a]; return k != null ? k : (KEYS.find((x) => x[0] === a) || [])[1] || ''; };
  // tecla do evento → "Ctrl+Shift+X", "S", "ArrowLeft", "=" (símbolos já vêm com o Shift aplicado)
  function keyName(e) {
    if (['Control', 'Shift', 'Alt', 'Meta', 'AltGraph'].includes(e.key)) return null;
    const k = e.key.length === 1 ? e.key.toUpperCase() : e.key;
    const letter = /^[A-Z0-9 ]$/.test(k) || k.length > 1;
    return [(e.ctrlKey || e.metaKey) && 'Ctrl', e.altKey && 'Alt', e.shiftKey && letter && 'Shift', k === ' ' ? 'Space' : k].filter(Boolean).join('+');
  }
  const KEY_TXT = { ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓', Space: L.space || 'Space', Escape: 'Esc' };
  const keyLabel = (k) => (k ? k.split('+').map((p) => (p === 'Space' ? L.space : KEY_TXT[p]) || p).join('+') : L.noKey);
  const KF = { in: 'markIn', out: 'markOut', cut: 'newCut', open: 'openCutter', clear: 'clearCuts', prev: 'prevFrame', next: 'nextFrame', done: 'cutDone', play: 'play', praw: 'skipCuts', pedit: 'prevEdit', nedit: 'nextEdit' };
  // troca {in} {out} {cut}... pelas teclas configuradas
  const kf = (str) => String(str).replace(/\{(\w+)\}/g, (m, k) => (KF[k] ? esc(keyLabel(keyOf(KF[k]))) : m));
  function runKey(a, e) {
    const q = selItem(); const cut = !!S.cutter;
    if (a === 'dlVideo' || a === 'dlAudio') { if (S.view !== 'dl') return false; dlQuick(a === 'dlVideo' ? 'video' : 'audio'); return true; }
    // na aba Baixar, as teclas do conversor não mexem no vídeo escondido
    if (S.view === 'dl') return false;
    switch (a) {
      case 'openCutter': if (!cut && q) { openCutter(true); return true; } return false;
      case 'markIn': if (cut) { markTrim('a'); return true; } return false;
      case 'markOut': if (cut) { markTrim('b'); return true; } return false;
      case 'newCut': if (cut) { newCut(); return true; } return false;
      case 'clearCuts': if (cut && q) { setCuts(q, []); return true; } return false;
      case 'cutDone': if (cut) { openCutter(false); return true; } return false;
      case 'play': if (playable(q)) { if (PL.on) playStop(); else playStart({ kind: 'auto' }); return true; } return false;
      // o original, sem pular o que foi cortado
      case 'skipCuts': if (playable(q) && cutsOf(q)) { toggleSkip(); toast(S.set.skipCuts !== false ? L.skipOn : L.skipOff); return true; } return false;
      case 'prevEdit': if (playable(q)) { jumpEdit(-1); return true; } return false;
      case 'nextEdit': if (playable(q)) { jumpEdit(1); return true; } return false;
      // J K L como no Premiere: L toca (de novo: 2×, 4×), K pausa, J volta 1 s (ou desacelera)
      case 'shuttleFwd': if (playable(q)) { if (!PL.on) { setRate(1); playStart({ kind: 'auto' }); } else setRate(PL.rate < 1 ? 1 : Math.min(4, PL.rate * 2)); return true; } return false;
      case 'shuttleStop': if (PL.on) { playStop(); return true; } return false;
      case 'shuttleBack': if (playable(q)) {
        if (PL.on && PL.rate > 1) { setRate(PL.rate / 2); return true; }
        const t = Math.max(0, (PL.on ? curSrc() : fullDur(q) * S.t) - 1);
        if (PL.on) playStart({ kind: PL.plan && PL.plan.kind === 'all' ? 'all' : 'auto', from: snapT(q, t) }); else setT(t / fullDur(q));
        return true; } return false;
      case 'loop': S.set.loop = !S.set.loop; saveSettings(); renderPlayUi(); toast(S.set.loop ? L.loopOn : L.loopOff); return true;
      case 'goIn': case 'goOut': { const cs = cutsOf(q); if (!cs) return false; if (PL.on) playStop(null, true);
        const c = cs[clamp(q.cutSel || 0, 0, cs.length - 1)]; setT((a === 'goIn' ? c[0] : c[1] - 1 / frOf(q)) / fullDur(q)); return true; }
      case 'goStart': if (playable(q)) { if (PL.on) playStop(null, true); setT(0); return true; } return false;
      case 'goEnd': if (playable(q)) { if (PL.on) playStop(null, true); setT(1); return true; } return false;
      case 'prevFrame': if (q) { ctl[0].click(); return true; } return false;
      case 'nextFrame': if (q) { ctl[4].click(); return true; } return false;
      case 'back5': if (q) { stepBy(-5); return true; } return false;
      case 'fwd5': if (q) { stepBy(5); return true; } return false;
      case 'zoomIn': if (q) { zoomAtHead(2); return true; } return false;
      case 'zoomOut': if (q) { zoomAtHead(0.5); return true; } return false;
      case 'zoomFit': if (q) { setZoom(1, 0, 0); return true; } return false;
    }
    return false;
  }
  // escolhendo a tecla de um atalho nas Configurações
  function captureKey(e) {
    const a = S.keyCapture; e.preventDefault(); e.stopPropagation();
    if (e.key === 'Escape') { S.keyCapture = null; renderSheet(); return; }
    const k = (e.key === 'Backspace' || e.key === 'Delete') ? '' : keyName(e); if (k == null) return;
    const keys = Object.assign({}, S.set.keys);
    const other = k && KEYS.find(([x]) => x !== a && keyOf(x) === k);
    if (other) { keys[other[0]] = ''; toast(L.keyMoved(keyLabel(k), L.act[other[0]])); }
    keys[a] = k; S.set.keys = keys; S.keyCapture = null; saveSettings(); renderSheet(); applyLang();
  }
  addEventListener('keydown', (e) => {
    if (S.keyCapture) { captureKey(e); return; }
    if (S.cutter && !e.target.closest('input') && e.key === 'Escape' && !$('#menu').classList.contains('show')) { e.preventDefault(); openCutter(false); return; }
    if (e.key === 'Escape') { if (S.powerEnd) { S.powerEnd(); return; } openNews(false); openSheet(false); closeMenu(); if (S.picked.size > 1 && !e.target.closest('input')) { selectOnly(S.sel); renderAll(); } }
    if (e.target.closest('input, textarea')) return;
    if (root.classList.contains('sheet-open')) return;
    // Ctrl+1 Converter · Ctrl+2 Baixar
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && (e.key === '1' || e.key === '2') && !S.cutter) { e.preventDefault(); setView(e.key === '2' ? 'dl' : 'conv'); return; }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o' && !e.altKey && !KEYS.some(([x]) => keyOf(x) === keyName(e))) { e.preventDefault(); if (REAL) inv('pick', { folder: e.shiftKey }); return; }
    const k = keyName(e);
    if (k) {
      const hit = KEYS.find(([a]) => keyOf(a) === k) || (k === '+' && !KEYS.some(([a]) => keyOf(a) === '+') ? ['zoomIn'] : null);
      if (hit && runKey(hit[0], e)) { e.preventDefault(); return; }
    }
    if (S.view === 'dl') return;
    if (e.key === 'Delete' && S.picked.size && !S.cutter) pickedItems().forEach((q) => removeItem(q.id));
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a' && S.queue.length && !S.cutter) {
      e.preventDefault(); S.picked = new Set(S.queue.map((q) => q.id)); if (S.sel == null) S.sel = S.queue[0].id; renderAll(true);
    }
  });

  /* ---------- aba Baixar ----------
     Dois botões rápidos pegam o link do Ctrl+C e baixam na maior qualidade, sem perguntar nada.
     Até 3 downloads ao mesmo tempo; a lista fica guardada neste PC (só os que terminaram). */
  const DL = { list: [], running: 0, tools: null, setup: null, clip: [], seq: 0, entered: false, updating: false };
  const DL_MAX = 3;
  const dlSet = () => { S.set.dl = Object.assign({ web: true, audio: 'wav', dir: '', multi: 'video' }, S.set.dl || {}); return S.set.dl; };
  const DL_ICONS = {
    folder: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M2 4.8A1.8 1.8 0 0 1 3.8 3h2.6l1.5 1.5h4.3A1.8 1.8 0 0 1 14 6.3v5A1.8 1.8 0 0 1 12.2 13H3.8A1.8 1.8 0 0 1 2 11.2z"/></svg>',
    queue: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2l6 3.3-6 3.3-6-3.3z"/><path d="M2 8.7l6 3.3 6-3.3"/></svg>',
    note: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 12V3.5l7-1.5V10.5"/><circle cx="4.2" cy="12" r="1.8"/><circle cx="11.2" cy="10.5" r="1.8"/></svg>',
    film: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><rect x="2.5" y="3" width="11" height="10" rx="2"/><path d="M6.8 6.2v3.6L9.8 8z" fill="currentColor"/></svg>',
    clip: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><rect x="3.5" y="2.5" width="9" height="11.5" rx="2"/><path d="M6 2.5h4v2H6z"/></svg>',
    ok: '<svg class="dk-ok" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 8.5l3 3 6-7"/></svg>',
  };
  // links de um texto: com https://, com www. ou "dominio.com/caminho" numa linha
  function dlLinks(text) {
    const out = [];
    String(text || '').split(/\s+/).forEach((w) => {
      let u = w.trim().replace(/^[<("'[]+|[>)"'\],.;]+$/g, '');
      if (!u) return;
      if (/^www\./i.test(u)) u = 'https://' + u;
      else if (!/^https?:\/\//i.test(u)) { if (/^[\w-]+(\.[\w-]+)+\/\S+/.test(u)) u = 'https://' + u; else return; }
      try { const x = new URL(u); if (!/^https?:$/.test(x.protocol) || !x.hostname.includes('.')) return; } catch { return; }
      if (!out.includes(u)) out.push(u);
    });
    return out;
  }
  const dlShort = (u) => u.replace(/^https?:\/\/(www\.)?/i, '');
  const SITE = { youtube: 'YouTube', tiktok: 'TikTok', twitter: 'X', instagram: 'Instagram', facebook: 'Facebook', reddit: 'Reddit', vimeo: 'Vimeo', twitch: 'Twitch', kwai: 'Kwai', pinterest: 'Pinterest', dailymotion: 'Dailymotion', soundcloud: 'SoundCloud', threads: 'Threads', bluesky: 'Bluesky', generic: '' };
  function dlSite(it) {
    const k = String((it.meta && it.meta.site) || '').toLowerCase();
    const hit = Object.keys(SITE).find((s) => k.startsWith(s));
    if (hit && SITE[hit]) return SITE[hit];
    try { return new URL(it.url).hostname.replace(/^(www|m|mobile|vm|vt)\./, ''); } catch { return ''; }
  }
  const dlBytes = (b) => fmtMB(b / 1e6);
  const dlDur = (s) => { s = Math.round(s || 0); const h = Math.floor(s / 3600); const m = Math.floor(s / 60) % 60; const x = String(s % 60).padStart(2, '0'); return h ? `${h}:${String(m).padStart(2, '0')}:${x}` : `${m}:${x}`; };
  const dlEta = (s) => (s == null || !isFinite(s) ? '' : dlDur(s));
  const CODEC = { h264: 'H.264', avc1: 'H.264', vp9: 'VP9', vp09: 'VP9', av01: 'AV1', av1: 'AV1', hevc: 'HEVC', h265: 'HEVC', hvc1: 'HEVC', hev1: 'HEVC' };
  const dlCodec = (c) => { const k = String(c || '').toLowerCase().split('.')[0]; return CODEC[k] || (k && k !== 'none' ? k.toUpperCase() : ''); };

  function dlSave() {
    const keep = DL.list.filter((it) => ['done', 'err', 'cancel'].includes(it.status)).slice(0, 60)
      .map(({ id, url, kind, status, meta, files, size, web, err, errCode, t }) => ({ id, url, kind, status, meta, files, size, web, err, errCode, t }));
    store.set('mec.downloads', JSON.stringify(keep));
  }
  function dlLoad() {
    try { DL.list = JSON.parse(store.get('mec.downloads') || '[]').filter((it) => it && it.url); } catch { DL.list = []; }
    DL.seq = DL.list.reduce((m, it) => Math.max(m, it.id || 0), Date.now());
  }

  function setView(v, quiet) {
    v = v === 'dl' ? 'dl' : 'conv';
    if (v === 'dl' && S.cutter) openCutter(false);
    if (v === 'dl' && PL.on) playStop(null, true);
    S.view = v; root.dataset.view = v; closeMenu();
    $$('#tabs button').forEach((b) => b.classList.toggle('on', b.dataset.view === v));
    if (!quiet && S.set.view !== v) { S.set.view = v; saveSettings(); }
    if (v === 'dl') dlEnter();
    else requestAnimationFrame(() => { fitFrames(); drawWave(); });
  }
  $$('#tabs button').forEach((b) => { b.onclick = () => setView(b.dataset.view); });

  // primeira vez na aba: confere o yt-dlp e o Deno; se faltar, baixa os dois sozinho
  async function dlEnter() {
    dlRenderSide(); dlRender(); dlClipRead();
    if (DL.entered) return; DL.entered = true;
    if (!REAL) { DL.tools = { ytdlp: '2026.11.03', deno: true }; dlRenderSide(); return; }
    try { DL.tools = await inv('dl_status'); } catch { DL.tools = { ytdlp: '', deno: false }; }
    if (!DL.tools.ytdlp || !DL.tools.deno) dlInstall(); else { dlRenderSide(); dlAutoUpdate(); dlPump(); }
  }
  async function dlInstall() {
    DL.setup = { item: 'ytdlp', done: 0, total: 0, err: null }; dlRender();
    try {
      const v = await inv('dl_install'); DL.tools = { ytdlp: v, deno: true }; DL.setup = null;
      S.set.dlUpdated = Date.now(); saveSettings();
    } catch (e) { DL.setup = { err: String(e) }; }
    dlRender(); dlRenderSide(); dlPump();
  }
  // o site muda, o yt-dlp acompanha: atualiza no máximo uma vez por dia, sem nada baixando
  async function dlAutoUpdate() {
    if (!REAL || DL.updating || !DL.tools || !DL.tools.ytdlp || DL.running) return;
    if (Date.now() - (S.set.dlUpdated || 0) < 20 * 3600e3) return;
    DL.updating = true;
    try { const v = await inv('dl_update'); if (v) DL.tools.ytdlp = v; S.set.dlUpdated = Date.now(); saveSettings(); } catch {}
    DL.updating = false; dlRenderSide(); dlPump();
  }
  setInterval(() => { if (S.view === 'dl') dlAutoUpdate(); }, 3600e3);

  /* Ctrl+C: lido ao entrar na aba, ao voltar para o app e a cada 1,5 s com a aba aberta */
  async function dlClipRead() {
    let t = '';
    if (REAL) { try { t = await inv('dl_clipboard'); } catch { try { t = await navigator.clipboard.readText(); } catch {} } }
    else t = qs.get('clip') != null ? qs.get('clip') : 'https://www.tiktok.com/@frankiebruno/video/7431804219857';
    const links = dlLinks(t);
    if (links.join() !== DL.clip.join()) { DL.clip = links; dlRenderClip(); }
  }
  setInterval(() => { if (S.view === 'dl' && document.hasFocus()) dlClipRead(); }, 1500);
  window.addEventListener('focus', () => { if (S.view === 'dl') dlClipRead(); });
  function dlRenderClip() {
    const c = DL.clip;
    $('#dlClip').innerHTML = c.length
      ? `${DL_ICONS.clip}<span>${esc(L.dlClip)}</span><code title="${esc(c.join('\n'))}">${esc(c.length > 1 ? L.dlClipN(c.length) : dlShort(c[0]))}</code>`
      : `${DL_ICONS.clip}<span>${esc(L.dlClipNone)}</span>`;
  }

  async function dlQuick(kind) {
    await dlClipRead();
    if (!DL.clip.length) { toast(L.dlNoLink); return; }
    dlAdd(DL.clip, kind);
  }
  function dlAdd(urls, kind) {
    const now = Date.now();
    urls.slice().reverse().forEach((url) => {
      DL.list.unshift({ id: ++DL.seq, url, kind, status: 'wait', meta: null, step: null, t: now, web: '' });
    });
    dlRender(); dlPump();
  }
  function dlPump() {
    if (!DL.tools || !DL.tools.ytdlp || DL.setup || DL.updating) return;
    const waiting = DL.list.filter((it) => it.status === 'wait').reverse();
    while (DL.running < DL_MAX && waiting.length) dlRun(waiting.shift());
  }
  async function dlRun(it) {
    const set = dlSet();
    it.status = 'run'; it.step = { stage: 'download', p: 0, done: 0, total: 0, speed: 0, eta: null }; it.err = null; it.errCode = null;
    it.webOn = set.web; it.audioFmt = set.audio;
    DL.running++; dlPatch(it);
    if (!REAL) { dlDemoRun(it); return; }
    try {
      const d = await inv('dl_start', { id: it.id, url: it.url, kind: it.kind, web: !!set.web, audio: set.audio, dest: set.dir || null });
      Object.assign(it, { status: 'done', files: d.files, size: d.size, web: d.web, meta: Object.assign({}, it.meta, d.meta.title ? d.meta : {}) });
      notify(L.dlDone((it.meta && it.meta.title) || dlShort(it.url)));
    } catch (e) {
      const s = String(e);
      if (s === 'cancelled') it.status = 'cancel';
      else { const i = s.indexOf('|'); it.status = 'err'; it.errCode = i > 0 ? s.slice(0, i) : s.startsWith('dl-') ? s : 'unknown'; it.err = i > 0 ? s.slice(i + 1) : s; }
      if (it.errCode === 'dl-setup') { DL.entered = false; dlEnter(); }
    }
    DL.running--; it.step = null;
    dlPatch(it); dlSave(); dlRenderHead(); dlPump(); dlAutoUpdate();
  }
  function dlCancel(it) {
    if (it.status === 'wait') { it.status = 'cancel'; dlPatch(it); dlSave(); return; }
    if (REAL) inv('dl_cancel', { id: it.id }).catch(() => {}); else if (it.timer) { clearInterval(it.timer); it.status = 'cancel'; DL.running--; dlPatch(it); dlPump(); }
  }
  function dlRetry(it) { it.status = 'wait'; it.err = null; it.errCode = null; dlPatch(it); dlPump(); }
  function dlRemove(it) { DL.list = DL.list.filter((x) => x !== it); dlSave(); dlRender(); }

  function dlErrText(it) {
    const c = it.errCode;
    return (L.dlErrs && L.dlErrs[c]) || (L.errs && L.errs[c]) || L.dlErrs.unknown;
  }
  function dlThumb(it) {
    if (it.kind === 'audio') return `<span class="dk-au">${DL_ICONS.note}</span>`;
    const m = it.meta || {};
    const o = m.width && m.height ? (m.height > m.width * 1.1 ? 'v' : m.width > m.height * 1.1 ? 'h' : 's') : 'v';
    const ph = `<span class="dk-ph">${it.status === 'err' ? ICONS.x : DL_ICONS.film}</span>`;
    return { o, html: m.thumbnail ? `<img src="${esc(m.thumbnail)}" referrerpolicy="no-referrer" alt="" loading="lazy" data-ph="1">` : ph };
  }
  function dlMetaLine(it) {
    const m = it.meta || {}; const site = dlSite(it); const p = [];
    if (it.kind === 'audio') { p.push(String(it.audioFmt || dlSet().audio).toUpperCase()); }
    else {
      if (m.width && m.height) p.push(`${m.width}×${m.height}`);
      if (m.fps) p.push(`${num(m.fps, 2)} fps`);
    }
    if (m.duration) p.push(dlDur(m.duration));
    if (it.status === 'run' && it.kind !== 'audio' && m.vcodec) { const c = dlCodec(m.vcodec); if (c) p.push(c); }
    return `${site ? `<b>${esc(site)}</b>` : ''}${site && p.length ? ' · ' : ''}${esc(p.join(' · '))}`;
  }
  function dlStatus(it) {
    const st = it.step || {}; const pct = (x) => `${Math.round(clamp(x || 0, 0, 1) * 100)}%`;
    const xBtn = `<button class="dk-ib x" data-act="cancel" title="${esc(L.cancel)}">${ICONS.x}</button>`;
    if (it.status === 'wait') return `<div class="dk-done"><span class="dk-muted">${esc(L.dlWait)}</span><span class="dk-acts">${xBtn}</span></div>`;
    if (it.status === 'run') {
      const stage = st.stage || 'download';
      if (stage === 'download') {
        const sub = [st.total ? L.dlOf(dlBytes(st.done), dlBytes(st.total)) : st.done ? dlBytes(st.done) : '', st.speed ? dlBytes(st.speed) + '/s' : '', dlEta(st.eta)].filter(Boolean).join(' · ');
        return `<div class="dk-st-top"><span>${esc(L.dlDownloading)}</span><span class="dk-pct">${pct(st.p)}</span>${xBtn}</div>
          <div class="dk-bar"><i style="--p:${clamp(st.p || 0, 0, 1)}"></i></div><div class="dk-st-sub">${esc(sub || ' ')}</div>`;
      }
      if (stage === 'web' || stage === 'remux') {
        const m = it.meta || {}; const from = dlCodec(m.vcodec);
        const eng = S.engine.status === 'nvenc' ? 'NVENC' : 'CPU';
        const sub = stage === 'remux' ? 'H.264 · AAC' : [from && from !== 'H.264' ? `${from} → H.264` : 'H.264 · AAC', eng, st.speed ? num(st.speed, 1) + '×' : ''].filter(Boolean).join(' · ');
        return `<div class="dk-st-top"><span>${esc(L.dlWebing)}</span><span class="dk-pct">${pct(st.p)}</span>${xBtn}</div>
          <div class="dk-bar dk-web"><i style="--p:${clamp(st.p || 0, 0, 1)}"></i></div><div class="dk-st-sub">${esc(sub)}</div>`;
      }
      const label = stage === 'merge' ? L.dlMerging : stage === 'audio' ? L.dlConverting(String(it.audioFmt || dlSet().audio).toUpperCase()) : stage === 'update' ? L.dlUpdating : L.dlDownloading;
      return `<div class="dk-st-top"><span>${esc(label)}</span>${xBtn}</div><div class="dk-bar dk-web"><i style="--p:1"></i></div><div class="dk-st-sub"> </div>`;
    }
    const rm = `<button class="dk-ib x hov" data-act="remove" title="${esc(L.dlRemove)}">${ICONS.x}</button>`;
    if (it.status === 'done') {
      const toQ = it.kind === 'video' || it.kind === 'audio' ? `<button class="dk-ib" data-act="queue" title="${esc(L.dlToQueue)}">${DL_ICONS.queue}</button>` : '';
      return `<div class="dk-done">${DL_ICONS.ok}${esc(L.dlReady)}<span class="dk-sz">${it.size ? dlBytes(it.size) : ''}</span><span class="dk-acts">${toQ}<button class="dk-ib" data-act="show" title="${esc(L.showInFolder)}">${DL_ICONS.folder}</button>${rm}</span></div>`;
    }
    const acts = `<div class="dk-err-acts"><button class="link" data-act="retry">${esc(L.dlRetry)}</button><button class="link" data-act="remove">${esc(L.dlRemove)}</button></div>`;
    if (it.status === 'cancel') return `<span class="dk-muted">${esc(L.dlCancelled)}</span>${acts}`;
    return `<span class="dk-err" title="${esc(it.err || '')}">${esc(dlErrText(it))}</span>${acts}`;
  }
  function dlRowHtml(it) {
    const th = dlThumb(it); const m = it.meta || {};
    const thumb = typeof th === 'string' ? `<div class="dk-th">${th}</div>` : `<div class="dk-th ${th.o}">${th.html}</div>`;
    return `<div class="dk-row" data-dl="${it.id}">${thumb}
      <div class="dk-info"><div class="dk-ttl" title="${esc(it.url)}">${esc(m.title || dlShort(it.url))}</div><div class="dk-meta">${dlMetaLine(it)}</div></div>
      <div class="dk-st">${dlStatus(it)}</div></div>`;
  }
  function dlFixImgs(scope) {
    $$('img[data-ph]', scope).forEach((img) => { img.onerror = () => { const s = document.createElement('span'); s.className = 'dk-ph'; s.innerHTML = DL_ICONS.film; img.replaceWith(s); }; });
  }
  function dlRenderHead() {
    const n = DL.list.length;
    $('#dlCount').textContent = n ? n : '';
    $('#bDlClear').hidden = !DL.list.some((it) => ['done', 'err', 'cancel'].includes(it.status));
  }
  function dlRender() {
    dlRenderHead();
    const rows = $('#dlRows');
    let html = '';
    if (DL.setup) {
      const s = DL.setup;
      if (s.err) html += `<div class="dk-setup"><b>${esc(L.dlSetupFail)}</b><div class="dk-err-row"><span class="dk-err" title="${esc(s.err)}">${esc(String(s.err).slice(0, 120))}</span><button class="link" id="bDlSetupRetry">${esc(L.dlRetry)}</button></div></div>`;
      else {
        const p = s.total ? s.done / s.total : 0;
        const what = s.item === 'deno' ? 'Deno' : 'yt-dlp';
        html += `<div class="dk-setup"><b>${esc(L.dlSetup)}</b><span>${esc(L.dlSetupSub)}</span>
          <div class="dk-st-top"><span>${esc(what)}</span><span class="dk-pct">${s.total ? Math.round(p * 100) + '%' : s.done ? dlBytes(s.done) : ''}</span></div>
          <div class="dk-bar"><i style="--p:${p}"></i></div></div>`;
      }
    }
    if (!DL.list.length && !DL.setup) {
      rows.classList.add('is-empty');
      rows.innerHTML = `<div class="dk-empty"><div>${DL_ICONS.folder}<b>${esc(L.dlEmptyT)}</b><span>${dlKf(L.dlEmptyS)}</span></div></div>`;
      return;
    }
    rows.classList.remove('is-empty');
    rows.innerHTML = html + DL.list.map(dlRowHtml).join('');
    dlFixImgs(rows);
    const r = $('#bDlSetupRetry'); if (r) r.onclick = dlInstall;
  }
  function dlPatch(it) {
    const row = $(`.dk-row[data-dl="${it.id}"]`);
    if (!row) { dlRender(); return; }
    const tmp = document.createElement('div'); tmp.innerHTML = dlRowHtml(it); const fresh = tmp.firstElementChild;
    // troca só o que mudou (a miniatura não pisca)
    const oldImg = row.querySelector('.dk-th img'); const newImg = fresh.querySelector('.dk-th img');
    if (!(oldImg && newImg && oldImg.getAttribute('src') === newImg.getAttribute('src'))) { row.querySelector('.dk-th').replaceWith(fresh.querySelector('.dk-th')); dlFixImgs(row); }
    row.querySelector('.dk-info').replaceWith(fresh.querySelector('.dk-info'));
    const st = row.querySelector('.dk-st'); const nst = fresh.querySelector('.dk-st');
    const bar = st.querySelector('.dk-bar i'); const nbar = nst.querySelector('.dk-bar i');
    // mesma etapa: só move a barra e troca os números (a barra anima)
    if (bar && nbar && st.querySelector('.dk-st-top span').textContent === nst.querySelector('.dk-st-top span').textContent && !!bar.closest('.dk-web') === !!nbar.closest('.dk-web')) {
      bar.style.cssText = nbar.style.cssText;
      st.querySelector('.dk-pct') && (st.querySelector('.dk-pct').textContent = (nst.querySelector('.dk-pct') || {}).textContent || '');
      const a = st.querySelector('.dk-st-sub'); const b = nst.querySelector('.dk-st-sub'); if (a && b) a.textContent = b.textContent;
    } else st.replaceWith(nst);
    dlRenderHead();
  }
  $('#dlRows').addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const it = DL.list.find((x) => x.id === +b.closest('.dk-row').dataset.dl); if (!it) return;
    const a = b.dataset.act;
    if (a === 'cancel') dlCancel(it);
    else if (a === 'retry') dlRetry(it);
    else if (a === 'remove') dlRemove(it);
    else if (a === 'show') { if (REAL) inv('reveal', { path: (it.files || [])[0] }).catch(() => {}); else toast(L.revealToast); }
    else if (a === 'queue') {
      if (REAL) inv('add', { paths: it.files || [] }).catch((er) => toast(String(er)));
      toast(L.dlSent((it.files || [1]).length), true); setView('conv');
    }
  });
  $('#dlRows').addEventListener('dblclick', (e) => {
    const r = e.target.closest('.dk-row'); if (!r || e.target.closest('button')) return;
    const it = DL.list.find((x) => x.id === +r.dataset.dl);
    if (it && it.status === 'done' && REAL) inv('reveal', { path: (it.files || [])[0] }).catch(() => {});
  });
  $('#bDlClear').onclick = () => { DL.list = DL.list.filter((it) => !['done', 'err', 'cancel'].includes(it.status)); dlSave(); dlRender(); };
  $('#bDlOpen').onclick = () => { if (REAL) inv('dl_open_dir', { path: dlSet().dir || null }).catch((e) => toast(String(e))); else toast(L.revealToast); };
  $('#bDlVideo').onclick = () => dlQuick('video');
  $('#bDlAudio').onclick = () => dlQuick('audio');
  const dlTyped = () => dlLinks($('#dlLinks').value);
  function dlRenderMultiBtn() { const n = dlTyped().length; const b = $('#bDlMulti'); b.textContent = n ? L.dlGoN(n) : L.dlGo; b.disabled = !n; }
  $('#dlLinks').addEventListener('input', dlRenderMultiBtn);
  $('#dlLinks').addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); $('#bDlMulti').click(); } });
  $('#bDlMulti').onclick = () => { const links = dlTyped(); if (!links.length) return; dlAdd(links, dlSet().multi === 'audio' ? 'audio' : 'video'); $('#dlLinks').value = ''; dlRenderMultiBtn(); };

  // teclas configuradas viram keycaps nos botões
  const dlKeycaps = (a) => { const k = keyOf(a); return k ? k.split('+').map((p) => `<kbd>${esc(keyLabel(p))}</kbd>`).join('') : ''; };
  const dlKf = (str) => esc(String(str)).replace(/\{(dlv|dla)\}/g, (m, k) => dlKeycaps(k === 'dlv' ? 'dlVideo' : 'dlAudio'));
  function dlPathShort(p) { const parts = String(p || '').split(/[\\/]/).filter(Boolean); return parts.length > 2 ? parts.slice(-2).join('\\') : String(p || ''); }
  function dlRenderSide() {
    const set = dlSet();
    $('#lDlCap').textContent = L.dlCap; $('#lDlVideo').textContent = L.dlVideo; $('#lDlAudio').textContent = L.dlAudio;
    $('#kDlVideo').innerHTML = dlKeycaps('dlVideo'); $('#kDlAudio').innerHTML = dlKeycaps('dlAudio');
    $('#lDlMulti').textContent = L.dlMulti; $('#dlLinks').placeholder = L.dlPaste;
    $('#dlMultiSeg').innerHTML = segH('dlMulti', set.multi, [['video', L.dlVideoShort], ['audio', L.dlAudioShort]]);
    seg($('#dlMultiSeg .seg'), (v) => { set.multi = v; saveSettings(); });
    dlRenderMultiBtn();
    const dir = set.dir || (DL.tools && DL.tools.defaultDir) || (REAL ? '' : 'C:\\Users\\Hugo\\Downloads\\Mec Encoder');
    $('#dlSet').innerHTML = `
      <div class="row"><div class="lbl">${esc(L.dlWeb)}<small>${esc(L.dlWebSub)}</small></div><span class="switch ${set.web ? 'on' : ''}" id="dlWeb"></span></div>
      <div class="row"><div class="lbl">${esc(L.dlAudioFmt)}</div>${segH('dlAudioFmt', set.audio, [['wav', 'WAV'], ['m4a', 'M4A'], ['mp3', 'MP3'], ['flac', 'FLAC']])}</div>
      <div class="row"><div class="lbl">${esc(L.dlSaveIn)}</div><div class="dk-path"><code title="${esc(dir)}">${esc(dlPathShort(dir))}</code><button id="bDlDir">${esc(L.dlChange)}</button></div></div>`;
    $('#dlWeb').onclick = () => { set.web = !set.web; saveSettings(); $('#dlWeb').classList.toggle('on', set.web); };
    seg($('#dlSet .seg'), (v) => { set.audio = v; saveSettings(); });
    $('#bDlDir').onclick = async () => {
      let d = null;
      if (REAL) { try { d = await inv('pick_dir', { start: dir || null }); } catch (e) { toast(String(e)); } } else d = 'D:\\Referencias';
      if (d) { set.dir = d; saveSettings(); dlRenderSide(); }
    };
    $('#lDlTitle').textContent = L.dlTitle; $('#bDlClear').textContent = L.dlClear; $('#lDlOpen').textContent = L.dlOpen;
    const t = DL.tools;
    $('#dlFoot').innerHTML = t && t.ytdlp ? `<i></i>${esc(L.dlVer(t.ytdlp, dlWhen(S.set.dlUpdated)))}` : t ? `<i class="off"></i>${esc(L.dlNotReady)}` : '';
    dlRenderClip();
  }
  function dlWhen(ms) {
    if (!ms) return '';
    const d0 = new Date(); d0.setHours(0, 0, 0, 0); const d1 = new Date(ms); d1.setHours(0, 0, 0, 0);
    const days = Math.round((d0 - d1) / 864e5);
    return days <= 0 ? L.dlToday : days === 1 ? L.dlYesterday : L.dlDaysAgo(days);
  }

  /* modo demonstração: andamento de mentira para ver a tela */
  function dlDemoRun(it) {
    const samples = [
      { title: 'Honesty Drop with Porsche', site: 'TikTok', width: 1080, height: 1920, fps: 60, duration: 42, vcodec: 'h264', acodec: 'aac' },
      { title: 'How I edit street interviews in Premiere Pro', site: 'Youtube', width: 3840, height: 2160, fps: 30, duration: 728, vcodec: 'vp09.00.51.08', acodec: 'opus' },
    ];
    it.meta = Object.assign({ thumbnail: '' }, samples[it.id % 2]);
    let p = 0; const total = 29.6e6;
    it.timer = setInterval(() => {
      p += 0.07;
      if (p < 1) it.step = { stage: 'download', p, done: total * p, total, speed: 8.2e6, eta: (1 - p) * 4 };
      else if (p < 1.6 && it.kind === 'video' && it.meta.vcodec !== 'h264') it.step = { stage: 'web', p: (p - 1) / 0.6, speed: 6.1, eta: null };
      else { clearInterval(it.timer); Object.assign(it, { status: 'done', size: total * 0.48, files: ['C:\\x.mp4'] }); it.step = null; DL.running--; dlSave(); dlPump(); }
      dlPatch(it);
    }, 250);
  }
  function dlDemo() {
    const thumb = (hue, v) => 'data:image/svg+xml,' + encodeURIComponent(scene(hue, v).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" '));
    DL.list = [
      { id: 5, url: 'https://www.tiktok.com/@frankiebruno/video/7431804219857', kind: 'video', status: 'run', meta: { title: 'Honesty Drop with Porsche', site: 'TikTok', width: 1080, height: 1920, fps: 60, duration: 42, vcodec: 'h264', thumbnail: thumb(20, true) },
        step: { stage: 'download', p: 0.62, done: 18.4e6, total: 29.6e6, speed: 8.2e6, eta: 2 } },
      { id: 4, url: 'https://www.youtube.com/watch?v=Qx81kLm2aZc', kind: 'video', status: 'run', meta: { title: 'How I edit street interviews in Premiere Pro', site: 'Youtube', width: 3840, height: 2160, fps: 30, duration: 728, vcodec: 'vp09.00.51.08', thumbnail: thumb(210, false) },
        step: { stage: 'web', p: 0.38, speed: 6.1 } },
      { id: 3, url: 'https://x.com/streetq/status/1856043291711', kind: 'video', status: 'done', size: 14.2e6, files: ['C:\\x.mp4'], meta: { title: 'Asked strangers for a hug in Times Square', site: 'Twitter', width: 720, height: 1280, fps: 30, duration: 58, thumbnail: thumb(330, true) } },
      { id: 2, url: 'https://www.youtube.com/watch?v=mD1v3', kind: 'audio', audioFmt: 'wav', status: 'done', size: 55.3e6, files: ['C:\\x.wav'], meta: { title: 'Midnight Drive · lo-fi beat, no copyright', site: 'Youtube', duration: 192 } },
      { id: 1, url: 'https://www.instagram.com/reel/DB7xQwPtL4e', kind: 'video', status: 'err', errCode: 'dl-login', err: '[Instagram] DB7xQwPtL4e: Requested content is not available, rate-limit reached or login required', meta: { site: 'Instagram' } },
    ];
    DL.running = 0; DL.seq = 10;
  }

  /* ---------- atualização ---------- */
  function renderUpdateBtn() {
    const b = $('#bUpdate'); if (!b) return;
    b.hidden = !S.update;
    if (S.update) b.querySelector('span').textContent = S.updating != null ? L.updating(S.updating) : L.updateAvail(S.update.version);
  }
  /* procura sozinha (ligado por padrão): ao abrir, a cada 3 horas e ao voltar para o app depois de 30 min;
     achou uma versão nova, mostra o aviso no canto com "Atualizar agora" */
  const autoUpd = () => S.set.autoUpdate !== false;
  let lastCheck = 0; let updTimer = 0;
  async function checkUpdate(manual) {
    if (!REAL) { if (manual) toast(L.upToDate); return; }
    lastCheck = Date.now();
    let ok = true;
    try { S.update = await inv('check_update'); } catch { S.update = null; ok = false; }
    renderUpdateBtn(); renderSheetIfOpen(); renderUpdCard();
    if (manual && !S.update) toast(L.upToDate);
    // sem internet agora: tenta de novo daqui a 10 min
    if (!manual && !ok) { clearTimeout(updTimer); updTimer = setTimeout(() => autoUpd() && checkUpdate(false), 10 * 60e3); }
  }
  setInterval(() => { if (REAL && autoUpd()) checkUpdate(false); }, 3 * 3600e3);
  // prévias guardadas sem uso há mais de N dias (padrão 7) são apagadas ao abrir e a cada 6 horas
  function prevDays() { return S.set.previewDays == null ? 7 : +S.set.previewDays; }
  function prunePreviews() { if (REAL && prevDays() > 0) inv('previews_prune', { days: prevDays() }).catch(() => {}); }
  setInterval(prunePreviews, 6 * 3600e3);
  window.addEventListener('focus', () => { if (REAL && autoUpd() && Date.now() - lastCheck > 30 * 60e3) checkUpdate(false); });
  // aviso no canto: some com "Depois" até sair outra versão
  function renderUpdCard() {
    const c = $('#updCard'); const u = S.update;
    const show = !!u && autoUpd() && (S.updating != null || S.set.updSkip !== u.version);
    c.hidden = !show; if (!show) return;
    c.innerHTML = S.updating != null
      ? `<b>${esc(L.updating(S.updating))}</b><i style="--p:${S.updating}%"></i>`
      : `<span class="ico">${ICONS.down}</span><div><b>${esc(L.updCardTitle(u.version))}</b><small>${esc(L.updCardSub)}</small></div>
         <button class="btn small" id="bUpdNow">${L.updateNow}</button><button class="link" id="bUpdLater">${L.later}</button>`;
    const n = $('#bUpdNow'); if (n) n.onclick = installUpdate;
    const l = $('#bUpdLater'); if (l) l.onclick = () => { S.set.updSkip = u.version; saveSettings(); renderUpdCard(); };
  }
  function installUpdate() {
    if (!S.update || S.updating != null) return;
    S.updating = 0; renderUpdateBtn(); renderUpdCard();
    inv('install_update').catch((e) => { S.updating = null; renderUpdateBtn(); renderUpdCard(); toast(String(e)); });
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
        q.status = 'running'; q.queued = false; q.p = 0; q.speed = 0; q.eta = null; q.error = null; q.errCode = null; q.t0 = Date.now(); q.jobId = J.id; q.took = 0; renderQueue(); updateFill();
        try {
          const twin = q.path && S.queue.some((x) => x !== q && x.path === q.path && x.status !== 'done');
          if (twin && q.cfg.output.deleteSource) toast(L.keptForCopy);
          const naming = Object.assign({ dir: q.dir || '', n: S.queue.indexOf(q) + 1 }, nowTags());
          jobUpdate(q);
          const r = await inv('render', { id: q.id, naming, cuts: cutsOf(q) || [], join: !!q.cutJoin, cfg: twin ? Object.assign(clone(q.cfg), { output: Object.assign(clone(q.cfg.output), { deleteSource: false }) }) : q.cfg });
          q.status = 'done'; q.p = 1; q.out = r.output; q.parts = r.parts && r.parts.length > 1 ? r.parts : null; q.outMb = r.size / 1e6; q.took = elapsedOf(q); J.done++; jobUpdate(q);
          if (r.deleted) toast(L.deletedOrig);
          if (J.mode === 'single') notify(L.rendered(q.file) + ' · ' + fmtDur(q.took));
        } catch (e) {
          if (S.stopping || S.job !== J) { q.status = 'ready'; q.p = 0; break; }
          const pe = parseErr(e); q.status = 'err'; q.errCode = pe.code; q.error = pe.details; failed++; jobUpdate(q);
          notify(L.renderFailed(q.file) + ': ' + errText(q), true);
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
    if (J && J.done && S.after !== 'none') {
      const act = S.after; S.after = 'none'; renderAfter();
      if (failed) setTimeout(() => toast(L.powerSkipped), 2000); else powerCountdown(act);
    }
    renderQueue();
  }
  $('#bRender').onclick = () => {
    if (S.job) { stopJob(); return; }
    S.queue.forEach((q) => { if (q.status === 'err') { q.status = 'ready'; q.error = null; q.errCode = null; } });
    const n = S.queue.filter((q) => q.status === 'ready').length; if (!n) return;
    startJob({ mode: 'queue', total: n });
  };

  /* ---------- automação: pastas vigiadas e pasta de tarefas (.json) ----------
     A fila mostra tudo; cada tarefa ganha um <nome>.status.json com o andamento (para scripts e o Claude). */
  S.batches = {}; S.jobs = {};
  const findPreset = (k) => { const s = String(k || '').trim().toLowerCase(); return S.presets.find((p) => p.id.toLowerCase() === s) || S.presets.find((p) => p.name.trim().toLowerCase() === s) || null; };
  function applyJobOptions(q, o) {
    const out = q.cfg.output;
    if (typeof o.outputFolder === 'string' && o.outputFolder) out.folder = { on: true, text: o.outputFolder };
    if (typeof o.keepTree === 'boolean') out.keepTree = o.keepTree;
    if (o.suffix === false || o.suffix === null) out.suffix.on = false; else if (typeof o.suffix === 'string') out.suffix = { on: true, text: o.suffix };
    if (o.subfolder === false || o.subfolder === null) out.subfolder.on = false; else if (typeof o.subfolder === 'string') out.subfolder = { on: true, text: o.subfolder };
    if (typeof o.deleteSource === 'boolean') out.deleteSource = o.deleteSource;
    // "trim": [início, fim] ou [[início, fim], ...]; "join": true junta os trechos num arquivo
    if (Array.isArray(o.trim) && o.trim.length && !q.src.isImage) {
      const list = Array.isArray(o.trim[0]) ? o.trim : [o.trim]; const d = fullDur(q);
      const cs = list.filter((c) => Array.isArray(c) && c.length === 2).map((c) => [clamp(+c[0] || 0, 0, d), clamp(+c[1] || d, 0, d)]).filter(([a, b]) => b - a >= 0.1).sort((x, y) => x[0] - y[0]);
      if (cs.length) q.cuts = cs; q.cutJoin = !!o.join;
    }
  }
  // fim da leitura de uma pasta vigiada ou tarefa: renderiza sozinho
  function originDone(p) {
    const o = p.origin; const ids = S.batches[o.tag] || []; delete S.batches[o.tag];
    if (o.job) {
      const bad = o.preset && !findPreset(o.preset);
      S.jobs[o.job] = { name: o.job, ids, t0: Date.now(), missing: (o.missing || []).map((f) => ({ file: f, status: 'error', error: 'source-missing' })),
        unreadable: (p.errors || []).map((x) => ({ file: x.path || x.file, status: 'error', error: 'corrupt', message: x.error })), bad };
      if (bad) { ids.forEach((id) => { const q = itemOf(id); if (q) { q.status = 'err'; q.errCode = 'preset-not-found'; q.error = `preset "${o.preset}"`; } }); }
      jobWrite(o.job);
      toast(L.jobAdded(o.job, ids.length), !bad);
    } else if (o.watch && ids.length) toast(L.watchAdded(lastPart(o.watch), ids.length), true);
    if (o.auto) ids.forEach((id) => { const q = itemOf(id); if (q && q.status === 'ready') renderOne(id, true); });
    renderAll(true, ids);
  }
  function jobState(j) {
    const qs = j.ids.map(itemOf).filter(Boolean);
    const items = qs.map((q) => ({ id: q.id, file: q.path, status: q.status === 'ready' ? 'queued' : q.status === 'err' ? 'error' : q.status,
      progress: Math.round((q.p || 0) * 1000) / 1000, output: q.out || null, sizeMB: q.outMb ? Math.round(q.outMb * 10) / 10 : null,
      seconds: q.took ? Math.round(q.took * 10) / 10 : null, error: q.status === 'err' ? q.errCode || 'unknown' : null, message: q.status === 'err' ? q.error || null : null, cuts: cutsOf(q), join: !!q.cutJoin, outputs: q.parts || (q.out ? [q.out] : null) }))
      .concat(j.ids.filter((id) => !itemOf(id)).map((id) => ({ id, status: 'removed' })), j.missing, j.unreadable);
    const open = items.some((i) => i.status === 'queued' || i.status === 'running');
    const failed = items.some((i) => i.status === 'error' || i.status === 'removed');
    const state = open ? (items.some((i) => i.status === 'running') ? 'running' : 'queued') : failed || !items.length ? 'failed' : 'done';
    return { job: j.name, state, preset: (qs[0] && qs[0].cfg && qs[0].cfg.name) || null, started: new Date(j.t0).toISOString(), updated: new Date().toISOString(), items };
  }
  function jobWrite(name) {
    const j = S.jobs[name]; if (!j || !REAL) return;
    const st = jobState(j); const finished = st.state === 'done' || st.state === 'failed';
    inv('job_status', { name, status: st, finished }).catch(() => {});
    if (finished) delete S.jobs[name];
  }
  const jobUpdate = (q) => { if (q && q.job && S.jobs[q.job]) setTimeout(() => jobWrite(q.job), 0); };
  // andamento das tarefas a cada 3 s enquanto renderiza
  setInterval(() => { Object.values(S.jobs).forEach((j) => { if (j.ids.some((id) => (itemOf(id) || {}).status === 'running')) jobWrite(j.name); }); }, 3000);
  const sendWatch = () => { if (REAL) inv('set_watch', { list: (S.set.watch || []).map((w) => ({ path: w.path, preset: w.preset, on: w.on !== false })) }).catch(() => {}); };
  async function addWatch() {
    let dir = null;
    if (REAL) { try { dir = await inv('pick_dir', { start: null }); } catch (e) { toast(String(e)); } } else dir = 'D:\\Entrada iPhone';
    if (!dir) return;
    S.set.watch = (S.set.watch || []).filter((w) => w.path !== dir).concat([{ path: dir, preset: (presetOf(S.set.defaultPreset) || S.presets[0]).id, on: true }]);
    saveSettings(); sendWatch(); renderSheet();
  }

  /* ---------- novidades (notas da versão, iguais às do GitHub) ---------- */
  const md = (t) => esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  function openNews(on) {
    if (on) {
      const lang = S.set.lang;
      $('#lNews').textContent = L.news; $('#bNewsDone').textContent = L.done;
      $('#newsBody').innerHTML = (window.MEC_NEWS || []).map((v) => `<section class="news-v ${v.version === S.version ? '' : 'old'}"><h3>${esc(v.version)}${v.version === S.version ? `<small>${L.thisVersion}</small>` : ''}</h3>
        <ul>${(v[lang] && v[lang].length ? v[lang] : v.en).map((li) => `<li>${md(li)}</li>`).join('')}</ul></section>`).join('');
      $('#newsBody').scrollTop = 0;
    }
    root.classList.toggle('news-open', !!on);
  }
  $('#bNewsDone').onclick = () => openNews(false);
  $('#newsBg').onclick = () => openNews(false);

  /* ---------- ao terminar: nada, suspender ou desligar ---------- */
  S.after = 'none';
  function renderAfter() {
    const b = $('#bAfter'); const on = S.after !== 'none';
    b.classList.toggle('on', on); b.title = on ? L.afterTitle + ': ' + (S.after === 'sleep' ? L.afterSleep : L.afterShutdown) : L.afterTitle;
    b.innerHTML = ICONS.power + (on ? `<span>${L.afterOn[S.after]}</span>` : '');
  }
  $('#bAfter').onclick = (e) => openMenu(e.currentTarget, [['none', L.afterNone], ['sleep', L.afterSleep], ['shutdown', L.afterShutdown]]
    .map(([v, t]) => ({ label: t, value: v, sel: S.after === v, icon: v === 'none' ? ICONS.x : ICONS.power })), (v) => { S.after = v; renderAfter(); });
  // 60 segundos para cancelar; depois suspende ou desliga (a fila já está salva)
  function powerCountdown(act) {
    let n = 60; const ring = $('.power-ring');
    $('#powerTitle').textContent = L.powerTitle(act); $('#powerSub').textContent = L.powerSub;
    $('#bPowerCancel').textContent = L.cancel; $('#bPowerNow').textContent = L.powerNow(act);
    const draw = () => { $('#powerN').textContent = n; ring.style.setProperty('--k', n / 60); };
    let timer = 0;
    const end = () => { clearInterval(timer); S.powerEnd = null; root.classList.remove('power-open'); };
    const go = async () => {
      end(); await saveQueue(true);
      if (REAL) inv('power', { action: act }).catch((e) => toast(String(e))); else toast(L.powerNow(act) + ' (demo)');
    };
    draw(); root.classList.add('power-open'); S.powerEnd = end;
    if (REAL) inv('ready').catch(() => {});
    timer = setInterval(() => { n--; draw(); if (n <= 0) go(); }, 1000);
    $('#bPowerCancel').onclick = end; $('#bPowerNow').onclick = go;
  }

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
      if (!S.job && DL.running && Date.now() - closeArmed > 3000) { closeArmed = Date.now(); toast(L.dlQuitWhile); return; }
      if (S.job) inv('stop').catch(() => {});
      saveQueue(true).finally(() => w.close());
    };
  }

  /* ---------- início ---------- */
  async function bootReal() {
    let st0 = null;
    try {
      const st = await inv('get_state'); st0 = st;
      S.presets = (st.presets || []).map(normPreset);
      if (st.settings && typeof st.settings === 'object') Object.assign(S.set, st.settings); // primeira vez: idioma do Windows e tema Estúdio (padrões acima)
      if (!presetOf(S.set.defaultPreset) && S.presets[0]) S.set.defaultPreset = S.presets[0].id;
      S.engine = Object.assign(S.engine, st.engine); S.version = st.version;
      S.audioDefaults = st.audioDefaults || []; S.imageDefaults = st.imageDefaults || []; S.cameraPreset = st.cameraPreset; S.firstRun = !!st.firstRun;
      // Novidades: abre sozinha uma vez depois de atualizar (não na primeira instalação)
      if (S.set.seenVersion !== S.version) {
        const show = !S.firstRun && (window.MEC_NEWS || []).some((v) => v.version === S.version);
        S.set.seenVersion = S.version; saveSettings();
        if (show) setTimeout(() => openNews(true), 900);
      }
      if (st.presetsRecovered) setTimeout(() => toast(L.presetsRecovered(st.presetsRecovered)), 1200);
      // Presets de áudio entram uma vez para quem já usava o app (os seus presets não mudam)
      if (!S.set.audioPresetsAdded && !S.presets.some(isAudioP) && S.audioDefaults.length) {
        S.presets.push(...clone(S.audioDefaults)); S.set.audioPresetsAdded = true; savePresets(); saveSettings();
      } else if (!S.set.audioPresetsAdded) { S.set.audioPresetsAdded = true; saveSettings(); }
      const imgDefs = st.imageDefaults || [];
      if (!S.set.imagePresetsAdded && imgDefs.length) {
        if (!S.presets.some(isImageP)) { S.presets.push(...clone(imgDefs)); savePresets(); }
        S.set.imagePresetsAdded = true; saveSettings();
      }
      if (!st.engine.ffmpeg) S.engine.status = 'missing';
    } catch (e) { console.error(e); }
    applyTheme(); dlLoad(); applyLang(); renderAll();
    setView(S.set.view === 'dl' ? 'dl' : 'conv', true);
    requestAnimationFrame(() => inv('ready').catch(() => {}));
    restoreQueue(st0 && st0.queue);
    sendWatch();
    if (S.engine.status === 'missing') toast(L.ffmpegMissing);

    let batch = []; let batchTimer = 0; let firstNew = null;
    on('scan-start', (p) => { if (p.count > 2) toast(L.scanning(p.count)); });
    on('item-added', (p) => {
      const audioOnly = !p.info.video;
      const o = p.origin || null;
      const asked = o && o.preset ? findPreset(o.preset) : null;
      const pid = asked ? asked.id : p.info.isImage ? defaultImageId() : audioOnly ? defaultAudioId() : presetOf(S.set.defaultPreset) ? S.set.defaultPreset : S.presets[0].id;
      const q = { id: p.id, path: p.path, file: p.file, dir: p.dir, src: mapSrc(p.info), preset: pid, cfg: clone(presetOf(pid)), status: 'ready', thumb: null };
      if (o) {
        q.job = o.job || null; q.watch = o.watch || null;
        if (o.options) applyJobOptions(q, o.options);
        (S.batches[o.tag] = S.batches[o.tag] || []).push(q.id);
      }
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
      if (p.origin) { originDone(p); return; }
      if (p.error === 'ffmpeg-missing') { toast(L.ffmpegMissing); return; }
      const errs = (p.errors || []).length;
      if (!p.added) toast(errs ? L.unreadable(errs) : L.noVideosFound);
      else if (p.root) toast(L.folderAdded(p.root, p.added) + (errs ? ' · ' + L.unreadable(errs) : ''), true);
      else toast(L.added(p.added) + (errs ? ' · ' + L.unreadable(errs) : ''), true);
    });
    on('render-progress', (p) => {
      const q = itemOf(p.id); if (!q || q.status !== 'running') return;
      q.p = p.p; q.speed = p.speed; q.mode = p.mode; q.eta = p.eta; const it = $(`.item[data-id="${q.id}"]`);
      if (it) { it.querySelector('.prog').style.setProperty('--p', q.p); const st = it.querySelector('.state'); if (st) { st.textContent = runTxt(q); st.title = p.mode === 'cpu' ? L.cpuDecode : p.mode === 'cpu-encode' ? L.cpuEnc : ''; } }
      updateFill();
    });
    on('drag', (p) => $('#queueCard').classList.toggle('drag-over', !!p.over));
    on('engine', (p) => {
      Object.assign(S.engine, p);
      // RTX 50 na primeira vez: preset extra que mantém 4:2:2 pela placa
      if (S.firstRun && isBlackwell() && S.cameraPreset && !S.set.cameraAdded && !presetOf(S.cameraPreset.id)) {
        S.presets.splice(1, 0, clone(S.cameraPreset)); S.set.cameraAdded = true; savePresets(); saveSettings(); renderPresets();
      } renderQueue(); renderSheetIfOpen();
      if (p.status === 'cpu') toast(L.cpuWarn);
    });
    on('dl-event', (p) => {
      const it = DL.list.find((x) => x.id === p.id); if (!it || it.status !== 'run') return;
      if (p.meta) it.meta = Object.assign({}, it.meta, p.meta);
      if (p.step) it.step = p.step;
      dlPatch(it);
    });
    on('dl-setup', (p) => { if (DL.setup && !DL.setup.err) { DL.setup = { item: p.item, done: p.done, total: p.total }; dlRender(); } });
    on('update-progress', (p) => { if (p.total) { S.updating = Math.round(p.done / p.total * 100); renderUpdateBtn(); renderUpdCard(); } });
    setTimeout(() => { if (autoUpd()) checkUpdate(false); prunePreviews(); }, 4000);
  }

  if (REAL) bootReal();
  else {
    if (qs.get('dlempty')) DL.list = []; else dlDemo();
    applyTheme(); applyLang();
    if (qs.get('sel')) selectOnly(qs.get('sel') === 'none' ? null : +qs.get('sel'));
    if (qs.get('multi')) qs.get('multi').split(',').forEach((id) => S.picked.add(+id));
    if (qs.get('empty')) { S.queue = []; selectOnly(null); }
    if (qs.get('open')) qs.get('open').split(',').forEach((k) => { S.open[k] = true; });
    if (qs.get('fold')) S.set.foldPresets = true;
    if (qs.get('update')) { S.update = { version: '0.2.12' }; setTimeout(renderUpdCard, 0); }
    S.version = ((window.MEC_NEWS || [])[0] || {}).version || S.version;
    if (qs.get('trim')) { const [a, b] = qs.get('trim').split(',').map(Number); const q = selItem(); if (q) q.cuts = [[a, b]]; }
    if (qs.get('cuts')) { const q = selItem(); if (q) { q.cuts = qs.get('cuts').split(';').map((x) => x.split(',').map(Number)); q.cutSel = +(qs.get('cutsel') || 0); q.cutJoin = !!qs.get('join'); } }
    if (qs.get('after')) S.after = qs.get('after');
    if (qs.get('err')) { const q = S.queue[+(qs.get('erri') || 3)]; Object.assign(q, { status: 'err', errCode: qs.get('err'), error: '[out#0/mp4 @ 000001] Error writing trailer: No space left on device\nError closing file D:\\Renders\\IMG_4823_proxy.mp4: No space left on device' }); }
    if (qs.get('dest')) S.presets.forEach((p) => { if (p.kind !== 'audio' && p.kind !== 'image') p.output.folder = { on: true, text: 'D:\\Renders' }; }), S.queue.forEach((q) => { q.cfg.output.folder = { on: true, text: 'D:\\Renders' }; });
    renderAll(); setT(S.t, true);
    requestAnimationFrame(drawWave);
    if (qs.get('cmp')) { S.cmp = true; renderPreview(); }
    if (qs.get('watch')) S.set.watch = [{ path: 'D:\\Entrada iPhone', preset: 'iphone-4k60', on: true }, { path: 'E:\\Cartao FX30', preset: 'proxy', on: false }];
    if (qs.get('sheet')) openSheet(true);
    if (qs.get('news')) openNews(true);
    if (qs.get('cutter')) setTimeout(() => { openCutter(true); if (qs.get('cz')) { setZoom(+qs.get('cz'), 0.5, S.t); } }, 200);
    if (qs.get('power')) powerCountdown(qs.get('power'));
    renderAfter();
    if (qs.get('folder')) setTimeout(addFolder, 300);
    if (qs.get('run')) setTimeout(() => $('#bRender').click(), 50);
    renderUpdateBtn();
    setView(qs.get('view') === 'dl' ? 'dl' : 'conv', true);
    if (qs.get('dlsetup')) { DL.setup = { item: 'deno', done: 21e6, total: 47e6 }; dlRender(); }
  }
  addEventListener('resize', drawWave);
})();
