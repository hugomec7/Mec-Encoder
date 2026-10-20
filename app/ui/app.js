// Mec Encoder — lógica da interface
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const root = document.documentElement;
  const qs = new URLSearchParams(location.search);

  const COLORS = { blue: 'var(--blue)', orange: 'var(--orange)', green: 'var(--green)', purple: 'var(--purple)',
    teal: 'var(--teal)', yellow: 'var(--yellow)', pink: 'var(--pink)', indigo: 'var(--indigo)', red: 'var(--red)' };
  const ICONS = {
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
    play: '<path d="M4.5 2.6v10.8c0 .5.6.8 1 .5l8-5.4a.6.6 0 0 0 0-1l-8-5.4c-.4-.3-1 0-1 .5z"/>',
    pause: '<rect x="3.5" y="2.5" width="3.2" height="11" rx="1"/><rect x="9.3" y="2.5" width="3.2" height="11" rx="1"/>',
  };

  const demo = window.MEC_DEMO || { presets: [], queue: [], settings: {} };
  const S = {
    presets: demo.presets,
    queue: demo.queue.map((q) => Object.assign(q, { cfg: clone(demo.presets.find((p) => p.id === q.preset)) })),
    set: Object.assign({ lang: 'en', theme: 'dark', lastDark: 'dark', defaultPreset: demo.presets[0] && demo.presets[0].id,
      clearWhenDone: true, notify: true, sound: true }, demo.settings),
    sel: 2, editPreset: null, pv: 'in', job: null, playing: false, t: .31,
    open: { video: true }, fold: { presets: false },
  };
  const presetOf = (id) => S.presets.find((p) => p.id === id);
  const itemOf = (id) => S.queue.find((q) => q.id === id);
  const selItem = () => itemOf(S.sel);
  let L = window.MEC_I18N.en;

  /* ---------- preferências locais ---------- */
  const store = { get(k) { try { return localStorage.getItem(k); } catch { return null; } },
                  set(k, v) { try { localStorage.setItem(k, v); } catch {} } };
  ['lang', 'theme', 'lastDark'].forEach((k) => { const v = qs.get(k) || store.get('mec.' + k); if (v) S.set[k] = v; });
  if (store.get('mec.foldPresets') === '1') S.fold.presets = true;
  root.dataset.variant = qs.get('v') || '2';

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
    store.set('mec.theme', t); store.set('mec.lastDark', S.set.lastDark); applyTheme(true);
  }
  $('#bTheme').onclick = () => setTheme(root.dataset.theme === 'light' ? S.set.lastDark : 'light');

  /* ---------- idioma ---------- */
  function applyLang() {
    L = window.MEC_I18N[S.set.lang] || window.MEC_I18N.en;
    root.lang = S.set.lang === 'pt' ? 'pt-BR' : 'en';
    const txt = { lQueue: L.queue, bClearDone: L.clearDone, lDropTitle: L.dropTitle, lDropSub: L.dropSub, lNewUse: L.newUse,
      lOriginal: L.original, lResult: L.result, lPresets: L.presets, bManage: L.manage, lModified: L.modified,
      bSavePreset: L.saveToPreset, lEst: L.estSize, lSettings: L.settings, bDone: L.done, lDropAll: L.dropAll, lPvEmpty: L.pvEmpty };
    Object.entries(txt).forEach(([id, t]) => { const el = document.getElementById(id); if (el) el.textContent = t; });
    $('#bMin').title = L.minimize; $('#bMax').title = L.maximize; $('#bClose').title = L.close; $('#bSettings').title = L.settings;
    $('#bSetAll').title = L.setAll; $('#bFoldPresets').title = L.presetsFold;
    renderRenderBtn();
  }

  /* ---------- helpers de mídia ---------- */
  const secs = (tc) => { const [h, m, s, f] = tc.split(':').map(Number); return h * 3600 + m * 60 + s + f / 60; };
  const num = (n, d = 1) => n.toLocaleString(S.set.lang === 'pt' ? 'pt-BR' : 'en-US', { maximumFractionDigits: d });
  const fmtMB = (mb) => mb >= 1000 ? num(mb / 1000, 2) + ' GB' : Math.round(mb) + ' MB';
  const fmtK = (k) => num(k / 1000) + ' Mb/s';
  const fpsTxt = (v) => S.set.lang === 'pt' ? String(v).replace('.', ',') : String(v).replace(',', '.');
  function outDims(src, cfg) {
    let { w, h } = src;
    if (cfg.scale === '50') { w /= 2; h /= 2; } else if (cfg.scale === '25') { w /= 4; h /= 4; }
    else if (cfg.scale === '1080') { const k = 1080 / Math.min(w, h); w *= k; h *= k; }
    return { w: Math.round(w / 2) * 2, h: Math.round(h / 2) * 2 };
  }
  function videoKbps(src, cfg) {
    if (cfg.bitrate.mode === 'manual') return cfg.bitrate.kbps;
    if (cfg.bitrate.mode === 'source') return src.kbps;
    const o = outDims(src, cfg); return Math.round(o.w * o.h * 60 * 0.07 / 1000 / 100) * 100;
  }
  const estMB = (q) => (videoKbps(q.src, q.cfg) + (q.cfg.audio.codec === 'copy' ? 256 : q.cfg.audio.kbps)) * secs(q.src.dur) / 8 / 1000;
  const warnings = (q) => (q.src.hdr && !q.cfg.hdrToSdr ? [L.hdrMismatch(q.src.hdr)] : []);
  const codecName = (c) => (c === 'h265' ? 'H.265' : 'H.264');
  const scaleTxt = (s) => (s === 'source' ? L.source : s === '1080' ? '1080p' : s + '%');
  const pending = () => S.queue.filter((q) => q.status !== 'done');

  /* ---------- cena de exemplo (no app real é o quadro do vídeo) ---------- */
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
      if (e.ctrlKey || e.deltaX && Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      e.preventDefault();
      const d = e.deltaMode === 1 ? e.deltaY * 36 : e.deltaMode === 2 ? e.deltaY * el.clientHeight : e.deltaY;
      if (!raf) cur = target = el.scrollTop;
      const m = max(); target = clamp(target + d, -120, m + 120);
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
    menu.innerHTML = items.map((it, i) => it.sep ? '<hr>' : `<button data-i="${i}" class="${it.sel ? 'sel' : ''} ${it.danger ? 'danger' : ''}">${it.color ? `<i style="--c:${it.color}"></i>` : it.icon ? it.icon : ''}<span>${it.label}</span>${it.sel ? ICONS.check : ''}</button>`).join('');
    const r = at instanceof Element ? at.getBoundingClientRect() : { left: at.x, right: at.x, top: at.y, bottom: at.y };
    const h = items.reduce((a, it) => a + (it.sep ? 9 : 32), 12);
    menu.style.left = clamp(r.left, 8, innerWidth - 240) + 'px';
    menu.style.top = (r.bottom + 6 + h > innerHeight ? r.top - 6 - h : r.bottom + (at instanceof Element ? 6 : 2)) + 'px';
    menu.style.transformOrigin = r.bottom + 6 + h > innerHeight ? 'bottom left' : 'top left';
    menuPick = (i) => onPick(items[i].value);
    menu.classList.remove('show'); void menu.offsetWidth; menu.classList.add('show');
  }
  const closeMenu = () => menu.classList.remove('show');
  menu.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { closeMenu(); menuPick && menuPick(+b.dataset.i); } });
  document.addEventListener('pointerdown', (e) => { if (!e.target.closest('#menu') && !e.target.closest('[data-menu]')) closeMenu(); });
  document.addEventListener('contextmenu', (e) => { if (!e.target.closest('input')) e.preventDefault(); });
  const presetItems = (cur) => S.presets.map((p) => ({ label: p.name, value: p.id, color: COLORS[p.color], sel: p.id === cur }));

  /* ---------- fila ---------- */
  const qList = $('#qList');
  function renderQueue(enterIds = []) {
    const busy = !!S.job;
    $('#queueCard').classList.toggle('empty', !S.queue.length);
    qList.innerHTML = S.queue.map((q) => {
      const p = presetOf(q.preset); const c = COLORS[p.color]; const w = warnings(q);
      const st = q.status === 'done' ? `<span class="state done">${ICONS.check}${L.ready}</span>`
        : q.status === 'running' ? `<span class="state tnum">${Math.round(q.p * 100)}%</span>`
        : q.queued ? `<span class="state">${L.busy}</span>`
        : `<span class="state tnum">${fmtMB(estMB(q))}</span>`;
      const vertical = q.src.h > q.src.w;
      const dir = q.dir ? `<span class="dir">${ICONS.folder}${q.dir.replace(/\//g, ' › ')}</span>` : '';
      const acts = (q.status === 'ready' ? `<button class="a a-render" data-act="render" title="${L.renderThis}">${ICONS.playc}</button>` : '')
        + `<button class="a" data-act="reveal" title="${q.status === 'done' ? L.showOutput : L.showInFolder}">${ICONS.reveal}</button>`
        + (q.status !== 'running' ? `<button class="a" data-act="remove" title="${L.remove}">${ICONS.x}</button>` : '');
      return `<div class="item ${q.id === S.sel ? 'sel' : ''} ${q.status === 'running' ? 'running' : ''} ${q.status === 'done' ? 'is-done' : ''} ${enterIds.includes(q.id) ? 'enter' : ''}" data-id="${q.id}" style="--d:${Math.max(0, enterIds.indexOf(q.id)) * 70}ms">
        <div class="thumb">${scene(q.hue, vertical)}${q.src.hdr ? '<span class="hdr">HDR</span>' : ''}</div>
        <div class="meta">
          <div class="name">${q.file}</div>
          <div class="spec">${dir}${q.src.w}×${q.src.h} · ${q.src.codec} · ${fpsTxt(q.src.fps)} fps${q.src.vfr ? ' VFR' : ''}</div>
          <div class="row2"><span class="badge" style="--c:${c}"><i></i>${p.name}${same(q.cfg, p) ? '' : '*'}</span>
            ${w.length ? `<span class="warn" title="${w.join('\n')}">${ICONS.warn}</span>` : ''}${st}</div>
        </div>
        <div class="acts">${acts}</div>
        <div class="prog" style="--p:${q.p || 0}"><i></i></div>
      </div>`;
    }).join('');
    $('#qCount').textContent = S.queue.length ? L.videos(S.queue.length) : '';
    $('#bClearDone').style.visibility = S.queue.some((q) => q.status === 'done') ? '' : 'hidden';
    const pend = pending();
    $('#tTotal').innerHTML = pend.length ? L.toRender(pend.length, fmtMB(pend.reduce((a, q) => a + estMB(q), 0))) : '';
    const dp = presetOf(S.set.defaultPreset);
    $('#bDefPreset').innerHTML = dp ? `<i style="--c:${COLORS[dp.color]}"></i>${dp.name}${ICONS.chev}` : '';
    $('#bRender').disabled = !pend.length && !busy;
  }

  function removeItem(id) {
    const el = $(`.item[data-id="${id}"]`);
    if (el) { el.style.transition = 'opacity .25s, transform .35s var(--ease)'; el.style.opacity = 0; el.style.transform = 'translateX(-14px) scale(.96)'; }
    setTimeout(() => {
      const before = rects();
      S.queue = S.queue.filter((q) => q.id !== id); if (S.sel === id) S.sel = null;
      renderAll(); flip(before);
    }, 230);
  }
  function itemAction(act, id) {
    const q = itemOf(id); if (!q) return;
    if (act === 'render') renderOne(id);
    else if (act === 'reveal') reveal(q);
    else if (act === 'remove') removeItem(id);
    else if (act === 'top') { const before = rects(); S.queue = [q, ...S.queue.filter((x) => x !== q)]; renderQueue(); flip(before); }
  }
  function reveal(q) {
    const T = window.__TAURI__;
    if (T && q.path) T.core.invoke('reveal', { path: q.status === 'done' ? q.outPath : q.path });
    else toast(L.revealToast);
  }

  qList.addEventListener('click', (e) => {
    if (drag.justDropped) { drag.justDropped = false; return; }
    const it = e.target.closest('.item');
    if (!it) { if (S.sel !== null) { S.sel = null; renderAll(true); } return; }
    const id = +it.dataset.id; const a = e.target.closest('[data-act]');
    if (a) { itemAction(a.dataset.act, id); return; }
    if (S.sel !== id) { S.sel = id; renderAll(true); }
  });
  qList.addEventListener('contextmenu', (e) => {
    const it = e.target.closest('.item'); if (!it) return;
    const q = itemOf(+it.dataset.id);
    openMenu({ x: e.clientX, y: e.clientY }, [
      ...(q.status === 'ready' ? [{ label: L.renderThis, value: 'render', icon: ICONS.playc }] : []),
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
    Object.assign(drag, { el: it, id: +it.dataset.id, y0: e.clientY, on: false, pid: e.pointerId });
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

  $('#bClearDone').onclick = () => {
    const done = S.queue.filter((q) => q.status === 'done'); if (!done.length) return;
    done.forEach((q) => { const el = $(`.item[data-id="${q.id}"]`); if (el) { el.style.transition = 'opacity .25s, transform .35s var(--ease)'; el.style.opacity = 0; el.style.transform = 'scale(.96)'; } });
    setTimeout(() => { const before = rects(); S.queue = S.queue.filter((q) => q.status !== 'done'); if (!selItem()) S.sel = null; renderAll(); flip(before); toast(L.cleared); }, 230);
  };

  // Demo: simula arrastar uma pasta. No app, o Rust percorre a pasta e as subpastas atrás de vídeos.
  function addFolder() {
    const pid = S.set.defaultPreset; const base = Math.max(0, ...S.queue.map((q) => q.id)) + 1;
    const mk = (i, dir, file, rot, hdr) => ({ id: base + i, dir, file, preset: pid, cfg: clone(presetOf(pid)), status: 'ready', hue: ((base + i) * 47) % 360,
      src: { w: 2160, h: 3840, codec: 'HEVC', bits: 10, fps: '59,93', vfr: true, dur: '00:01:08:20', kbps: 48200, audio: 2, hdr, rot, mb: 410 } });
    const add = [mk(0, 'Day 3', 'IMG_4901.MOV', 0, false), mk(1, 'Day 3', 'IMG_4902.MOV', 0, false), mk(2, 'Day 3/Cam B', 'IMG_4911.MOV', 90, 'HLG')];
    S.queue.push(...add); S.sel = add[0].id; renderAll(true, add.map((a) => a.id));
    setTimeout(() => $('#queue').smoothTo(1e6), 60);
    toast(L.folderAdded('Day 3', add.length));
  }
  $('#drop').addEventListener('click', (e) => { if (!e.target.closest('#bDefPreset')) addFolder(); });
  $('#bAdd').onclick = addFolder;
  $('#bDefPreset').onclick = (e) => openMenu(e.currentTarget, presetItems(S.set.defaultPreset), (v) => { S.set.defaultPreset = v; renderQueue(); renderSheetIfOpen(); });
  $('#bSetAll').onclick = (e) => openMenu(e.currentTarget, presetItems(null), (v) => assignAll(v));

  function assign(q, pid) { q.preset = pid; q.cfg = clone(presetOf(pid)); }
  function assignAll(pid) {
    const list = pending(); list.forEach((q) => assign(q, pid)); renderAll();
    $$('.item:not(.is-done) .badge').forEach((b) => b.classList.add('bump'));
    toast(L.assigned(presetOf(pid).name, list.length));
  }

  /* ---------- presets ---------- */
  function describe(p) {
    const parts = [codecName(p.codec) + ' ' + p.bits + '-bit', p.scale === 'source' ? L.sourceRes : scaleTxt(p.scale),
      p.bitrate.mode === 'manual' ? fmtK(p.bitrate.kbps) + ' ' + p.bitrate.rc.toUpperCase() : p.bitrate.mode === 'source' ? L.bitrateSrc : L.bitrateAuto,
      p.fps.conform ? fpsTxt(p.fps.value) + ' fps CFR' : null, p.hdrToSdr ? 'HDR → 709' : null,
      p.audio.codec === 'copy' ? L.audioCopied : `AAC ${p.audio.channels === 'stereo' ? L.stereoL : L.monoL}`].filter(Boolean);
    return `<b>${p.name}:</b> ${parts.join(' · ')}`;
  }
  function renderPresets() {
    const t = target();
    $('#presets').innerHTML = S.presets.map((p) =>
      `<button class="preset ${t.preset && t.preset.id === p.id ? 'sel' : ''}" data-id="${p.id}" style="--c:${COLORS[p.color]}"><span class="ic">${ICONS[p.icon]}</span>${p.name}</button>`
    ).join('') + `<button class="preset add"><span class="ic">${ICONS.plus}</span>${L.newPreset}</button>`;
    $('#presetDesc').innerHTML = t.preset ? describe(t.preset) : '';
    $('#presetsFold').classList.toggle('closed', S.fold.presets);
    $('#bFoldPresets').classList.toggle('closed', S.fold.presets);
  }
  $('#bFoldPresets').onclick = () => { S.fold.presets = !S.fold.presets; store.set('mec.foldPresets', S.fold.presets ? '1' : '0'); renderPresets(); };
  const pressPreset = { justDropped: false };
  $('#presets').addEventListener('click', (e) => {
    if (pressPreset.justDropped) { pressPreset.justDropped = false; return; }
    const b = e.target.closest('.preset'); if (!b) return;
    if (b.classList.contains('add')) { toast(L.soon); return; }
    const q = selItem();
    if (!q) { S.editPreset = b.dataset.id; renderPresets(); renderInspector(true); return; }
    assign(q, b.dataset.id); renderAll(true);
    const badge = $(`.item[data-id="${q.id}"] .badge`); if (badge) badge.classList.add('bump');
  });
  $('#presets').addEventListener('contextmenu', (e) => {
    const b = e.target.closest('.preset:not(.add)'); if (!b) return; const pid = b.dataset.id;
    openMenu({ x: e.clientX, y: e.clientY }, [
      { label: L.useForAll, value: 'all', icon: ICONS.layers },
      { label: L.setDefault, value: 'def', icon: ICONS.star },
      { label: L.editPreset, value: 'edit', icon: ICONS.edit },
    ], (v) => {
      if (v === 'all') assignAll(pid);
      if (v === 'def') { S.set.defaultPreset = pid; renderQueue(); toast(L.defaultSet(presetOf(pid).name)); }
      if (v === 'edit') { S.sel = null; S.editPreset = pid; renderAll(true); }
    });
  });

  /* arrastar um preset até um vídeo (ou até "todos") */
  const ghost = $('#ghost');
  $('#presets').addEventListener('pointerdown', (e) => {
    const b = e.target.closest('.preset:not(.add)'); if (!b || e.button !== 0) return;
    Object.assign(pressPreset, { b, pid: b.dataset.id, x0: e.clientX, y0: e.clientY, on: false });
  });
  addEventListener('pointermove', (e) => {
    const P = pressPreset; if (!P.b) return;
    if (!P.on) {
      if (Math.hypot(e.clientX - P.x0, e.clientY - P.y0) < 6) return;
      P.on = true; const p = presetOf(P.pid);
      ghost.innerHTML = `<i style="--c:${COLORS[p.color]}"></i>${p.name}`; ghost.classList.add('show');
      root.classList.add('dragging-preset'); closeMenu();
    }
    ghost.style.transform = `translate(${e.clientX + 12}px,${e.clientY + 10}px)`;
    const under = document.elementFromPoint(e.clientX, e.clientY);
    const item = under && under.closest('.item:not(.is-done)'); const all = under && under.closest('#allDrop');
    $$('.drop-hover').forEach((el) => el !== item && el !== all && el.classList.remove('drop-hover'));
    if (item) item.classList.add('drop-hover'); if (all) all.classList.add('drop-hover');
  });
  addEventListener('pointerup', (e) => {
    const P = pressPreset; if (!P.b) return;
    if (P.on) {
      const under = document.elementFromPoint(e.clientX, e.clientY);
      const item = under && under.closest('.item:not(.is-done)'); const all = under && under.closest('#allDrop');
      ghost.classList.remove('show'); root.classList.remove('dragging-preset'); $$('.drop-hover').forEach((el) => el.classList.remove('drop-hover'));
      if (all) assignAll(P.pid);
      else if (item) { const q = itemOf(+item.dataset.id); assign(q, P.pid); renderAll(); const bd = $(`.item[data-id="${q.id}"] .badge`); if (bd) bd.classList.add('bump'); toast(L.assigned(presetOf(P.pid).name, 1)); }
      P.justDropped = true; setTimeout(() => { P.justDropped = false; }, 0);
    }
    P.b = null; P.on = false;
  });

  /* ---------- prévia ---------- */
  const chip = (txt, c, ico) => `<span class="chip ${c ? 'hl' : ''}" ${c ? `style="--c:${c}"` : ''}>${ico || ''}${txt}</span>`;
  function renderPreview(anim) {
    const q = selItem(); const fr = $('#frame'); const ch = $('#chips');
    $('#previewCard').classList.toggle('no-video', !q);
    if (!q) { fr.innerHTML = ''; ch.innerHTML = ''; $('#pvMeta').innerHTML = ''; $('#tcEnd').textContent = '00:00:00:00'; return; }
    const out = S.pv === 'out'; const o = outDims(q.src, q.cfg); const vertical = q.src.h > q.src.w;
    const c = [];
    if (!out) {
      c.push(chip(`${q.src.w}×${q.src.h}`), chip(`${q.src.codec} ${q.src.bits}-bit`),
        chip(`${fpsTxt(q.src.fps)} fps${q.src.vfr ? ' ' + L.variable : ''}`, q.src.vfr ? COLORS.orange : null));
      if (q.src.hdr) c.push(chip(`${q.src.hdr} · Rec. 2020`, COLORS.yellow));
      if (q.src.rot) c.push(chip(`${q.src.rot}°`, COLORS.teal, ICONS.rot));
      c.push(chip(L.audioTracks(q.src.audio)));
    } else {
      c.push(chip(`${o.w}×${o.h}`), chip(`${codecName(q.cfg.codec)} ${q.cfg.bits}-bit · NVENC`),
        q.cfg.fps.conform ? chip(`${fpsTxt(q.cfg.fps.value)} fps ${L.constant}`, COLORS.green) : chip(`${fpsTxt(q.src.fps)} fps`));
      if (q.src.hdr) c.push(q.cfg.hdrToSdr ? chip('Rec. 709', COLORS.green) : chip(L.hdrKept, COLORS.orange));
      c.push(chip(`≈ ${fmtMB(estMB(q))}`));
    }
    ch.innerHTML = c.join('');
    $('#pvMeta').innerHTML = c.join('<span class="dot">·</span>');
    if (anim) [ch, $('#pvMeta')].forEach((el) => { el.classList.remove('swap'); void el.offsetWidth; el.classList.add('swap'); });
    const washed = q.src.hdr && (!out || !q.cfg.hdrToSdr);
    fr.style.aspectRatio = vertical ? '9/16' : '16/9';
    fr.style.height = vertical ? '100%' : 'auto'; fr.style.width = vertical ? 'auto' : '100%';
    fr.className = 'frame' + (out ? ' out' : '');
    fr.innerHTML = scene(q.hue, vertical)
      + `<div class="grade" style="${washed ? 'opacity:1;background:rgba(170,170,185,.16);mix-blend-mode:screen' : 'opacity:0'}"></div>`
      + `<span class="tag"><i></i>${out ? L.result : L.original}</span>`
      + `<span class="res tnum">${out ? `${o.w}×${o.h}` : `${q.src.w}×${q.src.h}`}</span>`
      + (q.src.rot ? `<div class="rot-note">${ICONS.rot}${out ? L.rotOut(q.src.rot) : L.rotIn(q.src.rot)}</div>` : '');
    fr.querySelector('svg.scene').style.filter = washed ? 'saturate(.6) contrast(.82) brightness(1.04)' : 'none';
    if (anim) { fr.classList.remove('flip'); void fr.offsetWidth; fr.classList.add('flip'); }
    $('#tcEnd').textContent = q.src.dur; setT(S.t);
  }

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
      const b = e.target.closest('button'); if (!b || b.classList.contains('active')) return;
      el.querySelectorAll('button').forEach((x) => x.classList.toggle('active', x === b));
      place(b); onChange && onChange(b.dataset.v);
    };
    requestAnimationFrame(() => place(el.querySelector('button.active'), true));
  }
  seg($('#pvSeg'), (v) => { S.pv = v; renderPreview(true); });

  /* forma de onda */
  function drawWave() {
    const cv = $('#wave'); const r = cv.getBoundingClientRect(); if (!r.width) return; const dpr = devicePixelRatio || 1;
    cv.width = r.width * dpr; cv.height = r.height * dpr;
    const g = cv.getContext('2d'); g.scale(dpr, dpr);
    g.fillStyle = getComputedStyle(root).getPropertyValue('--wave').trim(); let seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let x = 2; x < r.width - 2; x += 3) {
      const env = .35 + .65 * Math.abs(Math.sin(x / 41) * Math.cos(x / 97));
      const a = Math.max(1.5, env * (rnd() * .7 + .3) * (r.height - 10));
      g.beginPath(); g.roundRect(x, (r.height - a) / 2, 2, a, 1); g.fill();
    }
  }
  const tl = $('#timeline');
  function setT(t) {
    S.t = clamp(t, 0, 1); tl.style.setProperty('--t', S.t * 100 + '%');
    const q = selItem(); if (!q) { $('#tcNow').textContent = '00:00:00:00'; return; }
    const s = secs(q.src.dur) * S.t; const f = Math.floor((s % 1) * 60); const ss = Math.floor(s);
    $('#tcNow').textContent = [Math.floor(ss / 3600), Math.floor(ss / 60) % 60, ss % 60, f].map((n) => String(n).padStart(2, '0')).join(':');
  }
  tl.addEventListener('pointerdown', (e) => {
    if (!selItem()) return;
    const r = tl.getBoundingClientRect(); const mv = (ev) => setT((ev.clientX - r.left) / r.width);
    mv(e); tl.setPointerCapture(e.pointerId); tl.onpointermove = mv; tl.onpointerup = () => { tl.onpointermove = null; };
  });
  let playRaf;
  $('#bPlay').onclick = () => {
    if (!selItem()) return;
    S.playing = !S.playing; $('#playIco').innerHTML = S.playing ? ICONS.pause : ICONS.play;
    cancelAnimationFrame(playRaf);
    if (S.playing) { let last = performance.now(); const dur = secs(selItem().src.dur);
      const step = (now) => { setT(S.t + (now - last) / 1000 / dur); last = now; if (S.t < 1 && S.playing) playRaf = requestAnimationFrame(step); };
      playRaf = requestAnimationFrame(step); }
  };

  /* ---------- inspetor: ajusta o vídeo selecionado ou, sem vídeo, o próprio preset ---------- */
  function target() {
    const q = selItem();
    if (q) return { q, cfg: q.cfg, src: q.src, preset: presetOf(q.preset), isPreset: false };
    const p = presetOf(S.editPreset) || presetOf(S.set.defaultPreset) || S.presets[0];
    return { q: null, cfg: p, src: null, preset: p, isPreset: true };
  }
  const sw = (key, on, red) => `<button class="switch ${on ? 'on' : ''} ${red ? 'red' : ''}" data-k="${key}"></button>`;
  const segH = (key, val, opts) => `<div class="seg" data-k="${key}"><div class="pill"></div>${opts.map(([v, t]) => `<button data-v="${v}" class="${String(v) === String(val) ? 'active' : ''}">${t}</button>`).join('')}</div>`;
  const row = (lbl, ctl, sub, cls = '') => `<div class="row ${cls}"><span class="lbl">${lbl}${sub ? `<small>${sub}</small>` : ''}</span>${ctl}</div>`;
  const sec = (id, title, summary, body, extra = '') => `<div class="sec ${S.open[id] ? 'open' : ''}" data-sec="${id}">
      <button class="sec-head"><span class="sec-t">${title}</span>${extra}<span class="sec-sum">${summary}</span>${ICONS.chev}</button>
      <div class="sec-body"><div class="sec-inner">${body}</div></div></div>`;
  const trackBtn = (i, n) => `<button class="field pick" data-menu="1" data-track="${i}">${L.track(n)}${ICONS.chev}</button>`;

  function renderInspector(anim) {
    const T = target(); const el = $('#inspIn'); const c = T.cfg; const src = T.src;
    const mod = !T.isPreset && !same(c, T.preset);
    $('#inspFor').innerHTML = T.isPreset ? `${L.editing} · <span style="color:${COLORS[T.preset.color]}">${T.preset.name}</span>` : L.settingsFor;
    $('#modified').classList.toggle('show', mod); $('#bSavePreset').classList.toggle('show', mod);
    const a = c.audio; const o = c.output;
    el.innerHTML = (T.isPreset ? `<div class="hint top-hint">${L.presetHint}</div>` : '')
      + sec('video', L.video, `${codecName(c.codec)} · ${c.bits}-bit · ${scaleTxt(c.scale)} · ${c.bitrate.mode === 'manual' ? fmtK(c.bitrate.kbps) : c.bitrate.mode === 'source' ? L.source : L.auto}`,
        `<div class="group">
          ${row(L.codec, segH('codec', c.codec, [['h264', 'H.264'], ['h265', 'H.265']]))}
          ${row(L.bitDepth, segH('bits', c.bits, [[8, '8-bit'], [10, '10-bit']]))}
          ${row(L.resolution, segH('scale', c.scale, [['source', L.source], ['1080', '1080p'], ['50', '50%'], ['25', '25%']]))}
          ${row(L.bitrate, segH('bitrate.mode', c.bitrate.mode, [['auto', L.auto], ['source', L.source], ['manual', L.manual]]))}
          <div class="collapse ${c.bitrate.mode === 'manual' ? '' : 'closed'}" style="max-height:60px">
            ${row(L.value, `<div class="field"><input class="tnum" data-k="bitrate.kbps" value="${num(c.bitrate.kbps, 0)}"><span>kb/s</span></div>${segH('bitrate.rc', c.bitrate.rc, [['cbr', 'CBR'], ['vbr', 'VBR']])}`)}
          </div>
          ${row(L.maxQuality, sw('maxQuality', c.maxQuality), L.maxQualitySub)}
        </div>${c.bitrate.mode === 'source' && src ? `<div class="hint">${L.sameBitrate(fmtK(src.kbps))}</div>` : ''}`)
      + sec('fps', L.frameRate, c.fps.conform ? `${fpsTxt(c.fps.value)} CFR` : L.source,
        `<div class="group">
          ${row(L.cfr, sw('fps.conform', c.fps.conform), L.cfrSub)}
          <div class="collapse ${c.fps.conform ? '' : 'closed'}" style="max-height:60px">
            ${row(L.fps, segH('fps.value', c.fps.value, [['23.976', fpsTxt('23.976')], ['29.97', fpsTxt('29.97')], ['59.94', fpsTxt('59.94')], ['60', '60']]))}
          </div></div>`)
      + sec('color', L.color, c.hdrToSdr ? 'HDR → Rec. 709' : '—',
        `<div class="group">${row(L.hdr, sw('hdrToSdr', c.hdrToSdr), L.hdrSub)}</div>
         ${src && src.hdr && !c.hdrToSdr ? `<div class="hint warn-t">${L.hdrWarn}</div>` : ''}`,
        src && src.hdr ? `<span class="pill-tag" style="--c:${COLORS.yellow}">${L.detected(src.hdr)}</span>` : '')
      + sec('audio', L.audio, a.codec === 'copy' ? L.copy : `AAC · ${a.channels === 'stereo' ? L.stereo : L.mono}`,
        `<div class="group">
          ${row(L.codec, segH('audio.codec', a.codec, [['aac', 'AAC'], ['copy', L.copy]]))}
          ${row(L.channels, segH('audio.channels', a.channels, [['stereo', L.stereo], ['mono', L.mono]]))}
          ${row(L.tracks, `<div class="val">${a.channels === 'stereo' ? trackBtn(0, a.tracks[0]) + trackBtn(1, a.tracks[1]) : trackBtn(0, a.tracks[0])}</div>`, a.channels === 'stereo' ? L.tracksStereo : L.tracksMono)}
          ${a.codec === 'aac' ? row(L.quality, `<span class="val tnum">${a.kbps} kb/s · 48 kHz</span>`) : ''}
        </div>`)
      + sec('output', L.output, [o.suffix.on ? o.suffix.text : null, o.subfolder.on ? o.subfolder.text + '\\' : null, o.deleteSource ? L.deleteSrc : null].filter(Boolean).join(' · ') || L.sameFolder,
        `<div class="group">
          ${row(L.suffix, `<div class="field ${o.suffix.on ? '' : 'off'}"><input data-k="output.suffix.text" value="${o.suffix.text}" class="txt"></div>${sw('output.suffix.on', o.suffix.on)}`)}
          ${row(L.subfolder, `<div class="field ${o.subfolder.on ? '' : 'off'}"><input data-k="output.subfolder.text" value="${o.subfolder.text}" class="txt"></div>${sw('output.subfolder.on', o.subfolder.on)}`)}
          ${row(L.deleteSrc, sw('output.deleteSource', o.deleteSource, true), L.deleteSrcSub, o.deleteSource ? 'danger' : '')}
          ${row(L.dest, `<span class="val">${L.sameFolder}${ICONS.chev}</span>`)}
        </div><div class="hint">${L.savesAs(outName(T.q ? T.q.file : 'IMG_0001.MOV', c))}</div>`)
      + sec('adv', L.advanced, [c.avSync ? L.avSync : null, c.metadata ? L.metadata : null].filter(Boolean).join(' · ') || '—',
        `<div class="group">
          ${row(L.avSync, sw('avSync', c.avSync), L.avSyncSub)}
          ${row(L.metadata, sw('metadata', c.metadata), L.metadataSub)}
        </div>`);
    $$('.seg', el).forEach((s) => seg(s, (v) => set(s.dataset.k, v)));
    $('#estBox').style.visibility = T.q ? '' : 'hidden';
    if (T.q) $('#est').textContent = '≈ ' + fmtMB(estMB(T.q));
    $('#bApplyAll').textContent = T.isPreset ? L.setForAllBtn : L.applyAll;
    $('#bApplyAll').disabled = !pending().length;
    if (anim) { el.classList.remove('swap'); void el.offsetWidth; el.classList.add('swap'); }
  }
  function outName(file, cfg) {
    const c = cfg.output; const base = file.replace(/\.[^.]+$/, '');
    const suf = c.suffix.on ? c.suffix.text.replace('{codec}', codecName(cfg.codec).replace('.', '')) : '';
    return (c.subfolder.on ? c.subfolder.text + '\\' : '') + base + suf + '.' + cfg.container;
  }
  function set(key, v) {
    const T = target();
    // ao editar o preset, os vídeos que ainda usam o preset sem mudanças acompanham
    const followers = T.isPreset ? S.queue.filter((q) => q.status !== 'done' && q.preset === T.preset.id && same(q.cfg, T.preset)) : [];
    const ks = key.split('.'); let o = T.cfg; ks.slice(0, -1).forEach((k) => { o = o[k]; });
    const last = ks[ks.length - 1];
    o[last] = typeof o[last] === 'boolean' ? !o[last] : typeof o[last] === 'number' ? Number(String(v).replace(/\D/g, '')) : v;
    if (key === 'audio.channels') T.cfg.audio.tracks = v === 'mono' ? [1, 1] : [1, 2];
    followers.forEach((q) => { q.cfg = clone(T.preset); });
    renderQueue(); renderPresets(); renderInspector(); renderPreview();
  }
  $('#inspIn').addEventListener('click', (e) => {
    const s = e.target.closest('.switch');
    if (s) { s.classList.toggle('on'); setTimeout(() => set(s.dataset.k), 180); return; }
    const h = e.target.closest('.sec-head');
    if (h) { const box = h.parentElement; const id = box.dataset.sec; S.open[id] = !S.open[id]; box.classList.toggle('open', S.open[id]); return; }
    const t = e.target.closest('[data-track]');
    if (t) { const T = target(); const i = +t.dataset.track; const n = T.src ? T.src.audio : 2;
      openMenu(t, [1, 2, 3, 4].slice(0, Math.max(2, n)).map((k) => ({ label: L.track(k), value: k, sel: T.cfg.audio.tracks[i] === k })),
        (k) => { T.cfg.audio.tracks[i] = k; renderAll(); }); }
  });
  $('#inspIn').addEventListener('change', (e) => { const i = e.target.closest('input[data-k]'); if (i) set(i.dataset.k, i.value); });
  $('#bSavePreset').onclick = () => { const q = selItem(); const p = presetOf(q.preset); Object.assign(p, clone(q.cfg), { id: p.id, name: p.name, icon: p.icon, color: p.color }); renderAll(); toast(L.presetSaved(p.name)); };
  $('#bApplyAll').onclick = () => {
    const T = target();
    if (T.isPreset) { assignAll(T.preset.id); return; }
    pending().forEach((x) => { x.preset = T.q.preset; x.cfg = clone(T.q.cfg); }); renderAll(); toast(L.appliedAll);
  };
  $('#bManage').onclick = () => toast(L.soon);

  /* ---------- configurações ---------- */
  function renderSheet() {
    const dp = presetOf(S.set.defaultPreset);
    $('#sheetBody').innerHTML = `
      <div class="group">
        ${row(L.language, segH('lang', S.set.lang, [['en', 'English'], ['pt', 'Português']]))}
        ${row(L.appearance, segH('theme', S.set.theme, [['system', L.system], ['light', L.light], ['dark', L.dark], ['oled', L.oled]]))}
      </div>
      <div class="sec-label">${L.general}</div>
      <div class="group">
        ${row(L.newVideosUse, `<button class="field pick" data-menu="1" id="bSheetDef"><i class="dotc" style="--c:${dp ? COLORS[dp.color] : 'var(--text-3)'}"></i>${dp ? dp.name : ''}${ICONS.chev}</button>`)}
        ${row(L.clearWhenDone, sw('clearWhenDone', S.set.clearWhenDone))}
        ${row(L.sound, sw('sound', S.set.sound))}
        ${row(L.notify, sw('notify', S.set.notify))}
        ${row(L.gpu, `<span class="val">NVIDIA NVENC</span>`)}
      </div>
      <div class="about">Mec Encoder 0.1.0 · <span>@hugoeditor_</span></div>`;
    $$('#sheetBody .seg').forEach((s) => seg(s, (v) => {
      if (s.dataset.k === 'theme') { setTheme(v); return; }
      S.set.lang = v; store.set('mec.lang', v); applyLang(); renderAll(); renderSheet();
    }));
    $('#bSheetDef').onclick = (e) => openMenu(e.currentTarget, presetItems(S.set.defaultPreset), (v) => { S.set.defaultPreset = v; renderSheet(); renderQueue(); });
  }
  const renderSheetIfOpen = () => root.classList.contains('sheet-open') && renderSheet();
  $('#sheetBody').addEventListener('click', (e) => {
    const s = e.target.closest('.switch'); if (!s) return;
    s.classList.toggle('on'); S.set[s.dataset.k] = s.classList.contains('on');
    if (s.dataset.k === 'sound' && S.set.sound) playDone();
  });
  const openSheet = (on) => { if (on) renderSheet(); root.classList.toggle('sheet-open', on); };
  $('#bSettings').onclick = () => openSheet(true);
  $('#bDone').onclick = () => openSheet(false);
  $('#sheetBg').onclick = () => openSheet(false);
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { openSheet(false); closeMenu(); }
    if (e.target.closest('input')) return;
    if (e.key === ' ' && selItem()) { e.preventDefault(); $('#bPlay').click(); }
    if (e.key === 'Delete' && selItem()) removeItem(S.sel);
  });

  /* ---------- render (simulado no modo demo) ----------
     "Renderizar fila": avisa uma vez, quando a fila inteira termina.
     Render de um vídeo só: avisa quando aquele vídeo termina. */
  const sfx = $('#sfxDone');
  function playDone() { try { sfx.currentTime = 0; const p = sfx.play(); if (p) p.catch(() => {}); } catch {} }
  function notify(msg) {
    toast(msg, true);
    if (S.set.sound) playDone();
    // No app: notificação do Windows (tauri-plugin-notification) quando a janela não estiver em foco.
  }
  function renderRenderBtn() {
    const b = $('#bRender'); const run = S.job && S.job.mode === 'queue';
    b.classList.toggle('stop', !!S.job);
    $('#renderTxt').textContent = S.job ? L.stop : L.render;
    if (!run) $('#renderFill').style.setProperty('--p', 0);
  }
  let timer = null;
  function startJob(job) { S.job = job; renderRenderBtn(); renderQueue(); clearInterval(timer); timer = setInterval(tick, 120); }
  function stopJob() {
    clearInterval(timer); timer = null;
    S.queue.forEach((q) => { if (q.status === 'running') { q.status = 'ready'; q.p = 0; } q.queued = false; });
    S.job = null; renderRenderBtn(); renderQueue();
  }
  function renderOne(id) {
    const q = itemOf(id); if (!q || q.status !== 'ready') return;
    if (!S.job) { startJob({ mode: 'single', list: [id] }); return; }
    if (S.job.mode === 'single') { if (!S.job.list.includes(id)) { S.job.list.push(id); q.queued = true; renderQueue(); } }
    else { const before = rects(); const at = S.queue.findIndex((x) => x.status === 'running') + 1; S.queue = S.queue.filter((x) => x !== q); S.queue.splice(at, 0, q); renderQueue(); flip(before); }
    toast(L.willRenderNext(q.file));
  }
  function tick() {
    const J = S.job; if (!J) return;
    let cur = S.queue.find((q) => q.status === 'running');
    if (!cur) {
      if (J.mode === 'queue') cur = S.queue.find((q) => q.status === 'ready');
      else { while (J.list.length && !cur) { const c = itemOf(J.list.shift()); if (c && c.status === 'ready') cur = c; } }
      if (!cur) { finishJob(); return; }
      cur.status = 'running'; cur.queued = false; cur.p = 0; renderQueue();
    }
    cur.p = Math.min(1, cur.p + .035);
    if (cur.p >= 1) {
      cur.status = 'done'; renderQueue(); renderInspector();
      if (J.mode === 'single') notify(L.rendered(cur.file));
    } else {
      const it = $(`.item[data-id="${cur.id}"]`);
      if (it) { it.querySelector('.prog').style.setProperty('--p', cur.p); it.querySelector('.state').textContent = Math.round(cur.p * 100) + '%'; }
    }
    if (J.mode === 'queue') {
      const tot = J.total || 1; const left = S.queue.filter((q) => q.status === 'ready').length + (S.queue.some((q) => q.status === 'running') ? 1 - cur.p : 0);
      $('#renderFill').style.setProperty('--p', clamp(1 - left / tot, 0, 1));
    }
  }
  function finishJob() {
    const J = S.job; clearInterval(timer); timer = null; S.job = null; renderRenderBtn();
    if (J.mode === 'queue') {
      notify(L.queueDone);
      if (S.set.clearWhenDone) setTimeout(() => $('#bClearDone').click(), 1600);
    }
    renderQueue();
  }
  $('#bRender').onclick = () => {
    if (S.job) { stopJob(); return; }
    const n = S.queue.filter((q) => q.status === 'ready').length; if (!n) return;
    startJob({ mode: 'queue', total: n });
  };

  /* ---------- toast ---------- */
  let tt; function toast(t, ok) {
    $('#toastTxt').textContent = t; const el = $('#toast'); el.classList.toggle('ok', !!ok);
    el.classList.remove('show'); void el.offsetWidth; el.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => el.classList.remove('show'), 2600);
  }

  function renderAll(anim, enterIds) { renderQueue(enterIds); renderPresets(); renderPreview(anim); renderInspector(anim); }

  /* ---------- início ---------- */
  applyTheme(); applyLang();
  if (qs.get('sel')) S.sel = qs.get('sel') === 'none' ? null : +qs.get('sel');
  if (qs.get('empty')) { S.queue = []; S.sel = null; }
  if (qs.get('open')) qs.get('open').split(',').forEach((k) => { S.open[k] = true; });
  if (qs.get('fold')) S.fold.presets = true;
  renderAll(); setT(S.t);
  requestAnimationFrame(drawWave);
  addEventListener('resize', drawWave);
  if (qs.get('pv') === 'out') $('#pvSeg button[data-v="out"]').click();
  if (qs.get('sheet')) openSheet(true);
  if (qs.get('folder')) setTimeout(addFolder, 300);
  if (qs.get('run')) setTimeout(() => $('#bRender').click(), 50);
  if (qs.get('hover')) setTimeout(() => { const el = $(`.item[data-id="${qs.get('hover')}"]`); if (el) el.classList.add('hover'); }, 100);
  if (qs.get('ctx')) setTimeout(() => { const el = $(`.item[data-id="${qs.get('ctx')}"]`); if (el) { const r = el.getBoundingClientRect(); el.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, clientX: r.left + 150, clientY: r.top + 40 })); } }, 150);

  // janela (Tauri)
  const TA = window.__TAURI__;
  if (TA) {
    const w = TA.window.getCurrentWindow();
    $('#bClose').onclick = () => w.close(); $('#bMin').onclick = () => w.minimize(); $('#bMax').onclick = () => w.toggleMaximize();
  }
})();
