// Mec Encoder — lógica da interface
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
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
    x: '<svg viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M2 2l6 6M8 2L2 8"/></svg>',
    rot: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M13.5 8A5.5 5.5 0 1 1 8 2.5c1.8 0 3.3.8 4.3 2.1"/><path d="M12.8 1.8v3h-3"/></svg>',
    chev: '<svg class="chev" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 4.5L6 7l2.5-2.5"/></svg>',
    folder: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"><path d="M2 4.8C2 4 2.6 3.5 3.3 3.5h3l1.4 1.4h5c.7 0 1.3.6 1.3 1.3v5.5c0 .7-.6 1.3-1.3 1.3H3.3c-.7 0-1.3-.6-1.3-1.3z"/></svg>',
    play: '<path d="M4.5 2.6v10.8c0 .5.6.8 1 .5l8-5.4a.6.6 0 0 0 0-1l-8-5.4c-.4-.3-1 0-1 .5z"/>',
    pause: '<rect x="3.5" y="2.5" width="3.2" height="11" rx="1"/><rect x="9.3" y="2.5" width="3.2" height="11" rx="1"/>',
  };

  const demo = window.MEC_DEMO || { presets: [], queue: [], settings: {} };
  const S = {
    presets: demo.presets,
    queue: demo.queue.map((q) => Object.assign(q, { cfg: clone(demo.presets.find((p) => p.id === q.preset)) })),
    set: Object.assign({ lang: 'en', theme: 'dark', defaultPreset: demo.presets[0] && demo.presets[0].id, clearWhenDone: true, notify: true }, demo.settings),
    sel: 2, pv: 'in', rendering: false, playing: false, t: .31, open: { video: true },
  };
  const presetOf = (id) => S.presets.find((p) => p.id === id);
  const selItem = () => S.queue.find((q) => q.id === S.sel);
  let L = window.MEC_I18N.en;

  /* ---------- preferências (só conveniência local) ---------- */
  const store = { get(k) { try { return localStorage.getItem(k); } catch { return null; } },
                  set(k, v) { try { localStorage.setItem(k, v); } catch {} } };
  ['lang', 'theme'].forEach((k) => { const v = qs.get(k) || store.get('mec.' + k); if (v) S.set[k] = v; });
  root.dataset.variant = qs.get('v') || store.get('mec.variant') || '1';

  /* ---------- tema ---------- */
  const mq = matchMedia('(prefers-color-scheme: dark)');
  function applyTheme(anim) {
    if (anim) { root.classList.add('theming'); setTimeout(() => root.classList.remove('theming'), 600); }
    root.dataset.theme = S.set.theme === 'system' ? (mq.matches ? 'dark' : 'light') : S.set.theme;
    requestAnimationFrame(drawWave);
  }
  mq.addEventListener('change', () => S.set.theme === 'system' && applyTheme(true));
  $('#bTheme').onclick = () => { S.set.theme = root.dataset.theme === 'dark' ? 'light' : 'dark'; store.set('mec.theme', S.set.theme); applyTheme(true); };

  /* ---------- idioma ---------- */
  function applyLang() {
    L = window.MEC_I18N[S.set.lang] || window.MEC_I18N.en;
    root.lang = S.set.lang === 'pt' ? 'pt-BR' : 'en';
    const txt = { lQueue: L.queue, bClearDone: L.clearDone, lDropTitle: L.dropTitle, lDropSub: L.dropSub, lNewUse: L.newUse, lOriginal: L.original,
      lResult: L.result, lPresets: L.presets, bManage: L.manage, lModified: L.modified, bSavePreset: L.saveToPreset,
      lEst: L.estSize, bApplyAll: L.applyAll, lSettings: L.settings, bDone: L.done, inspFor: L.settingsFor };
    Object.entries(txt).forEach(([id, t]) => { const el = document.getElementById(id); if (el) el.textContent = t; });
    $('#renderTxt').textContent = S.rendering ? L.stop : L.render;
    $('#bMin').title = L.minimize; $('#bMax').title = L.maximize; $('#bClose').title = L.close; $('#bSettings').title = L.settings;
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

  /* ---------- menu suspenso ---------- */
  const menu = $('#menu'); let menuPick = null;
  function openMenu(anchor, items, onPick) {
    menu.innerHTML = items.map((it, i) => `<button data-i="${i}" class="${it.sel ? 'sel' : ''}">${it.color ? `<i style="--c:${it.color}"></i>` : ''}<span>${it.label}</span>${it.sel ? ICONS.check : ''}</button>`).join('');
    const r = anchor.getBoundingClientRect(); const h = items.length * 32 + 12;
    menu.style.left = Math.max(8, Math.min(innerWidth - 228, r.left)) + 'px';
    menu.style.top = (r.bottom + 6 + h > innerHeight ? r.top - 6 - h : r.bottom + 6) + 'px';
    menuPick = (i) => onPick(items[i].value);
    menu.classList.add('show');
  }
  menu.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { menu.classList.remove('show'); menuPick && menuPick(+b.dataset.i); } });
  document.addEventListener('pointerdown', (e) => { if (!e.target.closest('#menu') && !e.target.closest('[data-menu]')) menu.classList.remove('show'); });
  const presetItems = (cur) => S.presets.map((p) => ({ label: p.name, value: p.id, color: COLORS[p.color], sel: p.id === cur }));

  /* ---------- fila ---------- */
  function renderQueue(enterIds = []) {
    $('#queue').innerHTML = S.queue.map((q) => {
      const p = presetOf(q.preset); const c = COLORS[p.color]; const w = warnings(q);
      const st = q.status === 'done' ? `<span class="state done">${ICONS.check}${L.ready}</span>`
        : q.status === 'running' ? `<span class="state tnum">${Math.round(q.p * 100)}%</span>`
        : q.status === 'err' ? `<span class="state err">${L.error}</span>`
        : `<span class="state tnum">${fmtMB(estMB(q))}</span>`;
      const vertical = q.src.h > q.src.w;
      const dir = q.dir ? `<span class="dir">${ICONS.folder}${q.dir.replace(/\//g, ' › ')}</span>` : '';
      return `<div class="item ${q.id === S.sel ? 'sel' : ''} ${q.status === 'running' ? 'running' : ''} ${enterIds.includes(q.id) ? 'enter' : ''}" data-id="${q.id}" style="--d:${Math.max(0, enterIds.indexOf(q.id)) * 70}ms">
        <div class="thumb">${scene(q.hue, vertical)}${q.src.hdr ? '<span class="hdr">HDR</span>' : ''}</div>
        <div class="meta">
          <div class="name">${q.file}</div>
          <div class="spec">${dir}${q.src.w}×${q.src.h} · ${q.src.codec} · ${fpsTxt(q.src.fps)} fps${q.src.vfr ? ' VFR' : ''}</div>
          <div class="row2"><span class="badge" style="--c:${c}"><i></i>${p.name}${same(q.cfg, p) ? '' : '*'}</span>
            ${w.length ? `<span class="warn" title="${w.join('\n')}">${ICONS.warn}</span>` : ''}${st}</div>
        </div>
        <div class="prog" style="--p:${q.p || 0}"><i></i></div>
        <button class="x">${ICONS.x}</button>
      </div>`;
    }).join('');
    const pending = S.queue.filter((q) => q.status !== 'done');
    $('#qCount').textContent = L.videos(S.queue.length);
    $('#tTotal').innerHTML = L.toRender(pending.length, fmtMB(pending.reduce((a, q) => a + estMB(q), 0)));
    const dp = presetOf(S.set.defaultPreset);
    $('#bDefPreset').innerHTML = dp ? `<i style="--c:${COLORS[dp.color]}"></i>${dp.name}${ICONS.chev}` : '';
  }
  $('#queue').addEventListener('click', (e) => {
    const it = e.target.closest('.item'); if (!it) return;
    const id = +it.dataset.id;
    if (e.target.closest('.x')) {
      it.style.transition = 'opacity .3s, transform .35s var(--ease)'; it.style.opacity = 0; it.style.transform = 'translateX(-12px) scale(.96)';
      setTimeout(() => { S.queue = S.queue.filter((q) => q.id !== id); if (S.sel === id && S.queue[0]) S.sel = S.queue[0].id; renderAll(); }, 280);
      return;
    }
    if (S.sel !== id) { S.sel = id; renderAll(true); }
  });
  $('#bClearDone').onclick = () => { S.queue = S.queue.filter((q) => q.status !== 'done'); if (!selItem() && S.queue[0]) S.sel = S.queue[0].id; renderAll(); toast(L.cleared); };

  // Demo: simula arrastar uma pasta. No app, o Rust percorre a pasta e as subpastas atrás de vídeos.
  function addFolder() {
    const pid = S.set.defaultPreset; const base = Math.max(0, ...S.queue.map((q) => q.id)) + 1;
    const mk = (i, dir, file, rot, hdr) => ({ id: base + i, dir, file, preset: pid, cfg: clone(presetOf(pid)), status: 'ready', hue: ((base + i) * 47) % 360,
      src: { w: 2160, h: 3840, codec: 'HEVC', bits: 10, fps: '59,93', vfr: true, dur: '00:01:08:20', kbps: 48200, audio: 2, hdr, rot, mb: 410 } });
    const add = [mk(0, 'Day 3', 'IMG_4901.MOV', 0, false), mk(1, 'Day 3', 'IMG_4902.MOV', 0, false), mk(2, 'Day 3/Cam B', 'IMG_4911.MOV', 90, 'HLG')];
    S.queue.push(...add); S.sel = add[0].id; renderAll(true, add.map((a) => a.id));
    $('#queue').scrollTo({ top: 1e5, behavior: 'smooth' });
    toast(L.folderAdded('Day 3', add.length));
  }
  $('#drop').addEventListener('click', (e) => { if (!e.target.closest('#bDefPreset')) addFolder(); });
  $('#bAdd').onclick = addFolder;
  $('#bDefPreset').dataset.menu = '1';
  $('#bDefPreset').onclick = (e) => openMenu(e.currentTarget, presetItems(S.set.defaultPreset), (v) => { S.set.defaultPreset = v; renderQueue(); });

  /* ---------- presets ---------- */
  function describe(p) {
    const parts = [codecName(p.codec) + ' ' + p.bits + '-bit', p.scale === 'source' ? L.sourceRes : scaleTxt(p.scale),
      p.bitrate.mode === 'manual' ? fmtK(p.bitrate.kbps) + ' ' + p.bitrate.rc.toUpperCase() : p.bitrate.mode === 'source' ? L.bitrateSrc : L.bitrateAuto,
      p.fps.conform ? fpsTxt(p.fps.value) + ' fps CFR' : null, p.hdrToSdr ? 'HDR → 709' : null,
      p.audio.codec === 'copy' ? L.audioCopied : `AAC ${p.audio.channels === 'stereo' ? L.stereoL : L.monoL}`].filter(Boolean);
    return `<b>${p.name}:</b> ${parts.join(' · ')}`;
  }
  function renderPresets() {
    const q = selItem();
    $('#presets').innerHTML = S.presets.map((p) =>
      `<button class="preset ${q && q.preset === p.id ? 'sel' : ''}" data-id="${p.id}" style="--c:${COLORS[p.color]}"><span class="ic">${ICONS[p.icon]}</span>${p.name}</button>`
    ).join('') + `<button class="preset add"><span class="ic">${ICONS.plus}</span>${L.newPreset}</button>`;
    const p = q && presetOf(q.preset);
    $('#presetDesc').innerHTML = p ? describe(p) : '';
  }
  $('#presets').addEventListener('click', (e) => {
    const b = e.target.closest('.preset'); if (!b) return;
    if (b.classList.contains('add')) { toast(L.soon); return; }
    const q = selItem(); if (!q) return;
    q.preset = b.dataset.id; q.cfg = clone(presetOf(q.preset));
    renderAll(true);
    const badge = $(`.item[data-id="${q.id}"] .badge`); if (badge) badge.classList.add('bump');
  });

  /* ---------- prévia ---------- */
  const chip = (txt, c, ico) => `<span class="chip ${c ? 'hl' : ''}" ${c ? `style="--c:${c}"` : ''}>${ico || ''}${txt}</span>`;
  function renderPreview(anim) {
    const q = selItem(); const fr = $('#frame'); const ch = $('#chips');
    if (!q) { fr.innerHTML = ''; ch.innerHTML = ''; $('#pvMeta').innerHTML = ''; return; }
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
    $('#tcEnd').textContent = q.src.dur;
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
  const setT = (t) => { S.t = Math.min(1, Math.max(0, t)); tl.style.setProperty('--t', S.t * 100 + '%');
    const q = selItem(); if (!q) return; const s = secs(q.src.dur) * S.t; const f = Math.floor((s % 1) * 60); const ss = Math.floor(s);
    $('#tcNow').textContent = [Math.floor(ss / 3600), Math.floor(ss / 60) % 60, ss % 60, f].map((n) => String(n).padStart(2, '0')).join(':'); };
  tl.addEventListener('pointerdown', (e) => {
    const r = tl.getBoundingClientRect(); const mv = (ev) => setT((ev.clientX - r.left) / r.width);
    mv(e); tl.setPointerCapture(e.pointerId); tl.onpointermove = mv; tl.onpointerup = () => { tl.onpointermove = null; };
  });
  let playRaf;
  $('#bPlay').onclick = () => {
    S.playing = !S.playing; $('#playIco').innerHTML = S.playing ? ICONS.pause : ICONS.play;
    cancelAnimationFrame(playRaf);
    if (S.playing) { let last = performance.now(); const q = selItem(); const dur = q ? secs(q.src.dur) : 60;
      const step = (now) => { setT(S.t + (now - last) / 1000 / dur); last = now; if (S.t < 1 && S.playing) playRaf = requestAnimationFrame(step); };
      playRaf = requestAnimationFrame(step); }
  };

  /* ---------- inspetor ---------- */
  const sw = (key, on, red) => `<button class="switch ${on ? 'on' : ''} ${red ? 'red' : ''}" data-k="${key}"></button>`;
  const segH = (key, val, opts) => `<div class="seg" data-k="${key}"><div class="pill"></div>${opts.map(([v, t]) => `<button data-v="${v}" class="${String(v) === String(val) ? 'active' : ''}">${t}</button>`).join('')}</div>`;
  const row = (lbl, ctl, sub, cls = '') => `<div class="row ${cls}"><span class="lbl">${lbl}${sub ? `<small>${sub}</small>` : ''}</span>${ctl}</div>`;
  const sec = (id, title, summary, body, extra = '') => `<div class="sec ${S.open[id] ? 'open' : ''}" data-sec="${id}">
      <button class="sec-head"><span class="sec-t">${title}</span>${extra}<span class="sec-sum">${summary}</span>${ICONS.chev}</button>
      <div class="sec-body"><div class="sec-inner">${body}</div></div></div>`;
  const trackBtn = (i, n) => `<button class="field pick" data-menu="1" data-track="${i}">${L.track(n)}${ICONS.chev}</button>`;

  function renderInspector(anim) {
    const q = selItem(); const el = $('#insp'); if (!q) { el.innerHTML = ''; return; }
    const c = q.cfg; const p = presetOf(q.preset); const mod = !same(c, p);
    $('#modified').classList.toggle('show', mod); $('#bSavePreset').classList.toggle('show', mod);
    const a = c.audio; const o = c.output;
    el.innerHTML =
      sec('video', L.video, `${codecName(c.codec)} · ${c.bits}-bit · ${scaleTxt(c.scale)} · ${c.bitrate.mode === 'manual' ? fmtK(c.bitrate.kbps) : c.bitrate.mode === 'source' ? L.source : L.auto}`,
        `<div class="group">
          ${row(L.codec, segH('codec', c.codec, [['h264', 'H.264'], ['h265', 'H.265']]))}
          ${row(L.bitDepth, segH('bits', c.bits, [[8, '8-bit'], [10, '10-bit']]))}
          ${row(L.resolution, segH('scale', c.scale, [['source', L.source], ['1080', '1080p'], ['50', '50%'], ['25', '25%']]))}
          ${row(L.bitrate, segH('bitrate.mode', c.bitrate.mode, [['auto', L.auto], ['source', L.source], ['manual', L.manual]]))}
          <div class="collapse ${c.bitrate.mode === 'manual' ? '' : 'closed'}" style="max-height:60px">
            ${row(L.value, `<div class="field"><input class="tnum" data-k="bitrate.kbps" value="${num(c.bitrate.kbps, 0)}"><span>kb/s</span></div>${segH('bitrate.rc', c.bitrate.rc, [['cbr', 'CBR'], ['vbr', 'VBR']])}`)}
          </div>
          ${row(L.maxQuality, sw('maxQuality', c.maxQuality), L.maxQualitySub)}
        </div>${c.bitrate.mode === 'source' ? `<div class="hint">${L.sameBitrate(fmtK(q.src.kbps))}</div>` : ''}`)
      + sec('fps', L.frameRate, c.fps.conform ? `${fpsTxt(c.fps.value)} CFR` : L.source,
        `<div class="group">
          ${row(L.cfr, sw('fps.conform', c.fps.conform), L.cfrSub)}
          <div class="collapse ${c.fps.conform ? '' : 'closed'}" style="max-height:60px">
            ${row(L.fps, segH('fps.value', c.fps.value, [['23.976', fpsTxt('23.976')], ['29.97', fpsTxt('29.97')], ['59.94', fpsTxt('59.94')], ['60', '60']]))}
          </div></div>`)
      + sec('color', L.color, c.hdrToSdr ? 'HDR → Rec. 709' : '—',
        `<div class="group">${row(L.hdr, sw('hdrToSdr', c.hdrToSdr), L.hdrSub)}</div>
         ${q.src.hdr && !c.hdrToSdr ? `<div class="hint warn-t">${L.hdrWarn}</div>` : ''}`,
        q.src.hdr ? `<span class="pill-tag" style="--c:${COLORS.yellow}">${L.detected(q.src.hdr)}</span>` : '')
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
        </div><div class="hint">${L.savesAs(outName(q))}</div>`)
      + sec('adv', L.advanced, [c.avSync ? L.avSync : null, c.metadata ? L.metadata : null].filter(Boolean).join(' · ') || '—',
        `<div class="group">
          ${row(L.avSync, sw('avSync', c.avSync), L.avSyncSub)}
          ${row(L.metadata, sw('metadata', c.metadata), L.metadataSub)}
        </div>`);
    $$('.seg', el).forEach((s) => seg(s, (v) => set(q, s.dataset.k, v)));
    $('#est').textContent = '≈ ' + fmtMB(estMB(q));
    if (anim) { el.classList.remove('swap'); void el.offsetWidth; el.classList.add('swap'); }
  }
  function outName(q) {
    const c = q.cfg.output; const base = q.file.replace(/\.[^.]+$/, '');
    const suf = c.suffix.on ? c.suffix.text.replace('{codec}', codecName(q.cfg.codec).replace('.', '')) : '';
    return (c.subfolder.on ? c.subfolder.text + '\\' : '') + base + suf + '.' + q.cfg.container;
  }
  function set(q, key, v) {
    const ks = key.split('.'); let o = q.cfg; ks.slice(0, -1).forEach((k) => { o = o[k]; });
    const last = ks[ks.length - 1];
    o[last] = typeof o[last] === 'boolean' ? !o[last] : typeof o[last] === 'number' ? Number(String(v).replace(/\D/g, '')) : v;
    if (key === 'audio.channels') q.cfg.audio.tracks = v === 'mono' ? [1, 1] : [1, 2];
    const keep = $('#insp').scrollTop;
    renderQueue(); renderPresets(); renderInspector(); renderPreview(); $('#insp').scrollTop = keep;
  }
  $('#insp').addEventListener('click', (e) => {
    const s = e.target.closest('.switch');
    if (s) { s.classList.toggle('on'); const q = selItem(); setTimeout(() => set(q, s.dataset.k), 180); return; }
    const h = e.target.closest('.sec-head');
    if (h && root.dataset.variant === '2') { const box = h.parentElement; const id = box.dataset.sec; S.open[id] = !S.open[id]; box.classList.toggle('open', S.open[id]); return; }
    const t = e.target.closest('[data-track]');
    if (t) { const q = selItem(); const i = +t.dataset.track;
      openMenu(t, [1, 2, 3, 4].slice(0, Math.max(2, q.src.audio)).map((n) => ({ label: L.track(n), value: n, sel: q.cfg.audio.tracks[i] === n })),
        (n) => { q.cfg.audio.tracks[i] = n; renderAll(); }); }
  });
  $('#insp').addEventListener('change', (e) => { const i = e.target.closest('input[data-k]'); if (i) set(selItem(), i.dataset.k, i.value); });
  $('#bSavePreset').onclick = () => { const q = selItem(); const p = presetOf(q.preset); Object.assign(p, clone(q.cfg), { id: p.id, name: p.name, icon: p.icon, color: p.color }); renderAll(); toast(L.presetSaved(p.name)); };
  $('#bApplyAll').onclick = () => { const q = selItem(); S.queue.forEach((x) => { if (x.status !== 'done') { x.preset = q.preset; x.cfg = clone(q.cfg); } }); renderAll(); toast(L.appliedAll); };
  $('#bManage').onclick = () => toast(L.soon);

  /* ---------- configurações ---------- */
  function renderSheet() {
    const dp = presetOf(S.set.defaultPreset);
    $('#sheetBody').innerHTML = `
      <div class="group">
        ${row(L.language, segH('lang', S.set.lang, [['en', 'English'], ['pt', 'Português']]))}
        ${row(L.appearance, segH('theme', S.set.theme, [['system', L.system], ['light', L.light], ['dark', L.dark]]))}
      </div>
      <div class="sec-label">${L.general}</div>
      <div class="group">
        ${row(L.newVideosUse, `<button class="field pick" data-menu="1" id="bSheetDef"><i class="dotc" style="--c:${dp ? COLORS[dp.color] : 'var(--text-3)'}"></i>${dp ? dp.name : ''}${ICONS.chev}</button>`)}
        ${row(L.clearWhenDone, sw('clearWhenDone', S.set.clearWhenDone))}
        ${row(L.notify, sw('notify', S.set.notify))}
        ${row(L.gpu, `<span class="val">NVIDIA NVENC</span>`)}
      </div>
      <div class="about">Mec Encoder 0.1.0 · <span>@hugoeditor_</span></div>`;
    $$('#sheetBody .seg').forEach((s) => seg(s, (v) => {
      S.set[s.dataset.k] = v; store.set('mec.' + s.dataset.k, v);
      if (s.dataset.k === 'theme') applyTheme(true);
      if (s.dataset.k === 'lang') { applyLang(); renderAll(); renderSheet(); }
    }));
    $('#bSheetDef').onclick = (e) => openMenu(e.currentTarget, presetItems(S.set.defaultPreset), (v) => { S.set.defaultPreset = v; renderSheet(); renderQueue(); });
  }
  $('#sheetBody').addEventListener('click', (e) => { const s = e.target.closest('.switch'); if (s) { s.classList.toggle('on'); S.set[s.dataset.k] = s.classList.contains('on'); } });
  const openSheet = (on) => { if (on) renderSheet(); root.classList.toggle('sheet-open', on); };
  $('#bSettings').onclick = () => openSheet(true);
  $('#bDone').onclick = () => openSheet(false);
  $('#sheetBg').onclick = () => openSheet(false);
  addEventListener('keydown', (e) => { if (e.key === 'Escape') { openSheet(false); menu.classList.remove('show'); } });

  /* ---------- render (simulado) ---------- */
  let timer;
  $('#bRender').onclick = () => {
    S.rendering = !S.rendering; const b = $('#bRender');
    b.classList.toggle('stop', S.rendering); $('#renderTxt').textContent = S.rendering ? L.stop : L.render;
    clearInterval(timer); if (!S.rendering) return;
    timer = setInterval(() => {
      const cur = S.queue.find((q) => q.status === 'running') || S.queue.find((q) => q.status === 'ready');
      if (!cur) { S.rendering = false; b.classList.remove('stop'); $('#renderTxt').textContent = L.render; clearInterval(timer); toast(L.queueDone); return; }
      cur.status = 'running'; cur.p = Math.min(1, (cur.p || 0) + .035); if (cur.p >= 1) cur.status = 'done';
      const done = S.queue.filter((q) => q.status === 'done').length + (cur.status === 'running' ? cur.p : 0);
      $('#renderFill').style.setProperty('--p', done / S.queue.length);
      const it = $(`.item[data-id="${cur.id}"]`);
      if (it && cur.status === 'running') { it.classList.add('running'); it.querySelector('.prog').style.setProperty('--p', cur.p); it.querySelector('.state').textContent = Math.round(cur.p * 100) + '%'; }
      else renderQueue();
    }, 120);
  };

  /* ---------- toast ---------- */
  let tt; function toast(t) { $('#toastTxt').textContent = t; const el = $('#toast'); el.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => el.classList.remove('show'), 2400); }

  function renderAll(anim, enterIds) { renderQueue(enterIds); renderPresets(); renderPreview(anim); renderInspector(anim); }

  applyTheme(); applyLang();
  if (qs.get('sel')) S.sel = +qs.get('sel');
  if (qs.get('open')) qs.get('open').split(',').forEach((k) => { S.open[k] = true; });
  renderAll(); setT(S.t);
  requestAnimationFrame(drawWave);
  addEventListener('resize', drawWave);
  if (qs.get('pv') === 'out') $('#pvSeg button[data-v="out"]').click();
  if (qs.get('sheet')) openSheet(true);
  if (qs.get('folder')) setTimeout(addFolder, 300);

  // janela (Tauri)
  const T = window.__TAURI__;
  if (T) {
    const w = T.window.getCurrentWindow();
    $('#bClose').onclick = () => w.close(); $('#bMin').onclick = () => w.minimize(); $('#bMax').onclick = () => w.toggleMaximize();
  }
})();
