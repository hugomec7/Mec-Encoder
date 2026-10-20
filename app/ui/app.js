// Mec Encoder — lógica da interface
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  const COLORS = { blue: 'var(--blue)', orange: 'var(--orange)', green: 'var(--green)', purple: 'var(--purple)',
    teal: 'var(--teal)', yellow: 'var(--yellow)', pink: 'var(--pink)', indigo: 'var(--indigo)', red: 'var(--red)' };
  const ICONS = {
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="6.5" y="2.5" width="11" height="19" rx="3"/><path d="M10.5 18.5h3"/></svg>',
    hdr: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v17" /><path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor"/></svg>',
    proxy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="4"/><rect x="7.5" y="10.5" width="6" height="6" rx="1.5" fill="currentColor"/></svg>',
    camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5A2.5 2.5 0 0 1 5.5 6H7l1.5-2h7L17 6h1.5A2.5 2.5 0 0 1 21 8.5v9a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z"/><circle cx="12" cy="13" r="3.5"/></svg>',
    meta: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 15.5c0-4 2-8 4.3-8 3.4 0 4.6 9 7.6 9 1.8 0 2.6-1.6 2.6-3.6 0-3.3-1.7-5.4-3.6-5.4-2.6 0-4.3 4.2-5.6 6.4-1.2 2-2.1 2.6-3.2 2.6C4.8 16.5 4 16.2 4 15.5z"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    warn: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M7.1 2.5a1 1 0 0 1 1.8 0l5.4 9.6a1 1 0 0 1-.9 1.5H2.6a1 1 0 0 1-.9-1.5zM8 6v3.2" /><path d="M8 5.6v3.6M8 11.2v.1" stroke="#000" stroke-opacity=".55" stroke-width="1.6" stroke-linecap="round"/></svg>',
    check: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 8.5l3 3 6-7"/></svg>',
    x: '<svg viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M2 2l6 6M8 2L2 8"/></svg>',
    rot: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M13.5 8A5.5 5.5 0 1 1 8 2.5c1.8 0 3.3.8 4.3 2.1"/><path d="M12.8 1.8v3h-3"/></svg>',
    chev: '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 4.5L6 7l2.5-2.5"/></svg>',
    play: '<path d="M4.5 2.6v10.8c0 .5.6.8 1 .5l8-5.4a.6.6 0 0 0 0-1l-8-5.4c-.4-.3-1 0-1 .5z"/>',
    pause: '<rect x="3.5" y="2.5" width="3.2" height="11" rx="1"/><rect x="9.3" y="2.5" width="3.2" height="11" rx="1"/>',
  };

  const demo = window.MEC_DEMO || { presets: [], queue: [] };
  const S = {
    presets: demo.presets,
    queue: demo.queue.map((q) => Object.assign(q, { cfg: clone(demo.presets.find((p) => p.id === q.preset)) })),
    sel: 2, pv: 'in', rendering: false, playing: false, t: .31,
  };
  const presetOf = (id) => S.presets.find((p) => p.id === id);
  const selItem = () => S.queue.find((q) => q.id === S.sel);

  /* ---------- tema ---------- */
  const store = { get(k) { try { return localStorage.getItem(k); } catch { return null; } },
                  set(k, v) { try { localStorage.setItem(k, v); } catch {} } };
  const root = document.documentElement;
  const urlTheme = new URLSearchParams(location.search).get('theme');
  root.dataset.theme = urlTheme || store.get('mec.theme') || 'dark';
  $('#bTheme').onclick = () => {
    root.classList.add('theming');
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    store.set('mec.theme', root.dataset.theme);
    setTimeout(() => root.classList.remove('theming'), 600);
    drawWave();
  };

  /* ---------- helpers de mídia ---------- */
  const secs = (tc) => { const [h, m, s, f] = tc.split(':').map(Number); return h * 3600 + m * 60 + s + f / 60; };
  const fmtMB = (mb) => mb >= 1000 ? (mb / 1000).toFixed(2).replace('.', ',') + ' GB' : Math.round(mb) + ' MB';
  const fmtK = (k) => (k / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' Mb/s';
  function outDims(src, cfg) {
    let { w, h } = src;
    if (cfg.scale === '50') { w /= 2; h /= 2; }
    else if (cfg.scale === '25') { w /= 4; h /= 4; }
    else if (cfg.scale === '1080') { const k = 1080 / Math.min(w, h); w *= k; h *= k; }
    return { w: Math.round(w / 2) * 2, h: Math.round(h / 2) * 2 };
  }
  function videoKbps(src, cfg) {
    if (cfg.bitrate.mode === 'manual') return cfg.bitrate.kbps;
    if (cfg.bitrate.mode === 'source') return src.kbps;
    const o = outDims(src, cfg); return Math.round(o.w * o.h * 60 * 0.07 / 1000 / 100) * 100; // auto (CQ) ~ estimativa
  }
  function estMB(q) {
    const ak = q.cfg.audio.codec === 'copy' ? 256 : q.cfg.audio.kbps;
    return (videoKbps(q.src, q.cfg) + ak) * secs(q.src.dur) / 8 / 1000;
  }
  function warnings(q) {
    const w = [];
    if (q.src.hdr && !q.cfg.hdrToSdr) w.push(`Vídeo em HDR (${q.src.hdr}), mas o preset não converte para Rec. 709`);
    return w;
  }
  const codecName = (c) => c === 'h265' ? 'H.265' : 'H.264';

  /* ---------- cena de exemplo (no app real é o quadro do vídeo) ---------- */
  function scene(hue, vertical) {
    const W = vertical ? 90 : 160, H = vertical ? 160 : 90, g = 'g' + hue + (vertical ? 'v' : 'h');
    const bl = [];
    let x = -4; let i = 0;
    while (x < W) { const bw = W * (.07 + ((i * 37) % 9) / 100); const bh = H * (.10 + ((i * 53) % 19) / 100); bl.push(`<rect x="${x}" y="${H * .74 - bh}" width="${bw}" height="${bh + 2}" rx="1"/>`); x += bw + 1.5; i++; }
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

  /* ---------- fila ---------- */
  function renderQueue(enterId) {
    const el = $('#queue');
    el.innerHTML = S.queue.map((q) => {
      const p = presetOf(q.preset); const c = COLORS[p.color]; const w = warnings(q);
      const st = q.status === 'done' ? `<span class="state done">${ICONS.check}Pronto</span>`
        : q.status === 'running' ? `<span class="state tnum">${Math.round(q.p * 100)}%</span>`
        : q.status === 'err' ? `<span class="state err">Erro</span>`
        : `<span class="state tnum">${fmtMB(estMB(q))}</span>`;
      const vertical = q.src.h > q.src.w;
      return `<div class="item ${q.id === S.sel ? 'sel' : ''} ${q.status === 'running' ? 'running' : ''} ${q.id === enterId ? 'enter' : ''}" data-id="${q.id}">
        <div class="thumb">${scene(q.hue, vertical)}${q.src.hdr ? '<span class="hdr">HDR</span>' : ''}</div>
        <div class="meta">
          <div class="name">${q.file}</div>
          <div class="spec">${q.src.w}×${q.src.h} · ${q.src.codec} · ${q.src.fps} fps${q.src.vfr ? ' VFR' : ''}</div>
          <div class="row2"><span class="badge" style="--c:${c}"><i></i>${p.name}${same(q.cfg, p) ? '' : '*'}</span>
            ${w.length ? `<span class="warn" title="${w.join('\n')}">${ICONS.warn}</span>` : ''}${st}</div>
        </div>
        <div class="prog" style="--p:${q.p || 0}"><i></i></div>
        <button class="x" title="Tirar da fila">${ICONS.x}</button>
      </div>`;
    }).join('');
    const pending = S.queue.filter((q) => q.status !== 'done');
    $('#qCount').textContent = `${S.queue.length} vídeos`;
    $('#tTotal').innerHTML = `<b>${pending.length}</b> para renderizar · ≈ <b>${fmtMB(pending.reduce((a, q) => a + estMB(q), 0))}</b>`;
    $('#tEta').textContent = 'NVENC · RTX';
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
  $('#bClearDone').onclick = () => { S.queue = S.queue.filter((q) => q.status !== 'done'); if (!selItem() && S.queue[0]) S.sel = S.queue[0].id; renderAll(); toast('Concluídos removidos da fila'); };
  $('#drop').onclick = () => {
    const id = Math.max(0, ...S.queue.map((q) => q.id)) + 1;
    const pid = selItem() ? selItem().preset : S.presets[0].id;
    S.queue.push({ id, file: `IMG_48${30 + id}.MOV`, src: { w: 2160, h: 3840, codec: 'HEVC', bits: 10, fps: '59,93', vfr: true, dur: '00:01:08:20', kbps: 48200, audio: 2, hdr: false, rot: 90, mb: 410 },
      preset: pid, cfg: clone(presetOf(pid)), status: 'ready', hue: (id * 47) % 360 });
    S.sel = id; renderAll(true, id); toast('1 vídeo adicionado à fila');
  };

  /* ---------- presets ---------- */
  function renderPresets() {
    const q = selItem();
    $('#presets').innerHTML = S.presets.map((p) =>
      `<button class="preset ${q && q.preset === p.id ? 'sel' : ''}" data-id="${p.id}" style="--c:${COLORS[p.color]}"><span class="ic">${ICONS[p.icon]}</span>${p.name}</button>`
    ).join('') + `<button class="preset add" id="bNewPreset"><span class="ic">${ICONS.plus}</span>Novo</button>`;
    const p = q && presetOf(q.preset);
    $('#presetDesc').innerHTML = p ? describe(p) : '';
  }
  function describe(p) {
    const parts = [codecName(p.codec), p.scale === 'source' ? 'resolução original' : p.scale === '1080' ? '1080p' : p.scale + '%',
      p.bitrate.mode === 'manual' ? fmtK(p.bitrate.kbps) + ' ' + p.bitrate.rc.toUpperCase() : p.bitrate.mode === 'source' ? 'bitrate do original' : 'bitrate auto',
      p.fps.conform ? p.fps.value.replace('.', ',') + ' fps CFR' : null, p.hdrToSdr ? 'HDR → 709' : null,
      p.audio.codec === 'copy' ? 'áudio copiado' : `AAC ${p.audio.channels === 'stereo' ? 'estéreo' : 'mono'}`].filter(Boolean);
    return `<b>${p.name}:</b> ${parts.join(' · ')}`;
  }
  $('#presets').addEventListener('click', (e) => {
    const b = e.target.closest('.preset'); if (!b || b.classList.contains('add')) { if (b) toast('Criar preset (em breve)'); return; }
    const q = selItem(); if (!q) return;
    q.preset = b.dataset.id; q.cfg = clone(presetOf(q.preset));
    renderAll(true);
    const badge = $(`.item[data-id="${q.id}"] .badge`); if (badge) badge.classList.add('bump');
  });

  /* ---------- prévia ---------- */
  function chip(txt, c, ico) { return `<span class="chip ${c ? 'hl' : ''}" ${c ? `style="--c:${c}"` : ''}>${ico || ''}${txt}</span>`; }
  function renderPreview(anim) {
    const q = selItem(); const fr = $('#frame'); const ch = $('#chips');
    if (!q) { fr.innerHTML = ''; ch.innerHTML = ''; return; }
    const out = S.pv === 'out'; const o = outDims(q.src, q.cfg); const vertical = q.src.h > q.src.w;
    let c = [];
    if (!out) {
      c.push(chip(`${q.src.w}×${q.src.h}`));
      c.push(chip(`${q.src.codec} ${q.src.bits}-bit`));
      c.push(chip(`${q.src.fps} fps${q.src.vfr ? ' variável' : ''}`, q.src.vfr ? COLORS.orange : null));
      if (q.src.hdr) c.push(chip(`${q.src.hdr} · Rec. 2020`, COLORS.yellow));
      if (q.src.rot) c.push(chip(`Rotação ${q.src.rot}°`, COLORS.teal, ICONS.rot));
      c.push(chip(`${q.src.audio} faixas de áudio`));
    } else {
      c.push(chip(`${o.w}×${o.h}`));
      c.push(chip(`${codecName(q.cfg.codec)} · NVENC`));
      c.push(q.cfg.fps.conform ? chip(`${q.cfg.fps.value.replace('.', ',')} fps constante`, COLORS.green) : chip(`${q.src.fps} fps`));
      if (q.src.hdr) c.push(q.cfg.hdrToSdr ? chip('Rec. 709', COLORS.green) : chip('HDR sem conversão', COLORS.orange));
      c.push(chip(`≈ ${fmtMB(estMB(q))}`));
    }
    ch.innerHTML = c.join('');
    if (anim) { ch.classList.remove('swap'); void ch.offsetWidth; ch.classList.add('swap'); }

    const washed = q.src.hdr && (!out || !q.cfg.hdrToSdr);
    fr.style.aspectRatio = vertical ? '9/16' : '16/9';
    fr.style.height = vertical ? '100%' : 'auto'; fr.style.width = vertical ? 'auto' : '100%';
    fr.className = 'frame' + (out ? ' out' : '');
    fr.innerHTML = scene(q.hue, vertical)
      + `<div class="grade" style="${washed ? 'opacity:1;background:rgba(170,170,185,.16);mix-blend-mode:screen' : 'opacity:0'}"></div>`
      + `<span class="tag"><i></i>${out ? 'Resultado' : 'Original'}</span>`
      + `<span class="res tnum">${out ? `${o.w}×${o.h}` : `${q.src.w}×${q.src.h}`}</span>`
      + (q.src.rot ? `<div class="rot-note">${ICONS.rot}${out ? `Rotação do arquivo (${q.src.rot}°) aplicada: sai em pé` : `Arquivo com metadado de rotação de ${q.src.rot}°`}</div>` : '');
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
    el.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b || b.classList.contains('active')) return;
      el.querySelectorAll('button').forEach((x) => x.classList.toggle('active', x === b));
      place(b); onChange && onChange(b.dataset.v);
    });
    requestAnimationFrame(() => place(el.querySelector('button.active'), true));
    return { place: (instant) => place(el.querySelector('button.active'), instant) };
  }
  seg($('#pvSeg'), (v) => { S.pv = v; renderPreview(true); });

  /* forma de onda */
  function drawWave() {
    const cv = $('#wave'); const r = cv.getBoundingClientRect(); const dpr = devicePixelRatio || 1;
    cv.width = r.width * dpr; cv.height = r.height * dpr;
    const g = cv.getContext('2d'); g.scale(dpr, dpr);
    const col = getComputedStyle(root).getPropertyValue('--text-3').trim();
    g.fillStyle = col; let seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let x = 2; x < r.width - 2; x += 3) {
      const env = .35 + .65 * Math.abs(Math.sin(x / 41) * Math.cos(x / 97));
      const a = Math.max(1.5, env * (rnd() * .7 + .3) * (r.height - 10));
      g.beginPath(); g.roundRect(x, (r.height - a) / 2, 2, a, 1); g.fill();
    }
  }
  const tl = $('#timeline');
  const setT = (t) => { S.t = Math.min(1, Math.max(0, t)); tl.style.setProperty('--t', S.t * 100 + '%');
    const q = selItem(); if (!q) return; const s = secs(q.src.dur) * S.t;
    const f = Math.floor((s % 1) * 60); const ss = Math.floor(s);
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
  function renderInspector(anim) {
    const q = selItem(); const el = $('#insp'); if (!q) { el.innerHTML = ''; return; }
    const c = q.cfg; const p = presetOf(q.preset);
    $('#inspFor').textContent = 'Ajustes deste vídeo';
    const mod = !same(c, p);
    $('#modified').classList.toggle('show', mod); $('#bSavePreset').classList.toggle('show', mod);
    el.innerHTML = `
      <div class="sec-label">Vídeo</div>
      <div class="group">
        <div class="row"><span class="lbl">Codec</span>${segH('codec', c.codec, [['h264', 'H.264'], ['h265', 'H.265']])}</div>
        <div class="row"><span class="lbl">Resolução</span>${segH('scale', c.scale, [['source', 'Original'], ['1080', '1080p'], ['50', '50%'], ['25', '25%']])}</div>
        <div class="row"><span class="lbl">Bitrate</span>${segH('bitrate.mode', c.bitrate.mode, [['auto', 'Auto'], ['source', 'Original'], ['manual', 'Manual']])}</div>
        <div class="collapse ${c.bitrate.mode === 'manual' ? '' : 'closed'}" style="max-height:60px">
          <div class="row"><span class="lbl"><span>Valor</span></span>
            <div class="field"><input class="tnum" data-k="bitrate.kbps" value="${c.bitrate.kbps.toLocaleString('pt-BR')}"><span>kb/s</span></div>
            ${segH('bitrate.rc', c.bitrate.rc, [['cbr', 'CBR'], ['vbr', 'VBR']])}</div>
        </div>
        <div class="row"><span class="lbl">Qualidade máxima<small>NVENC preset P7, mais lento</small></span>${sw('maxQuality', c.maxQuality)}</div>
      </div>
      ${c.bitrate.mode === 'source' ? `<div class="hint">Usa o mesmo bitrate do arquivo original: <b>${fmtK(q.src.kbps)}</b>.</div>` : ''}

      <div class="sec-label">Frame rate</div>
      <div class="group">
        <div class="row"><span class="lbl">Cravar frame rate constante<small>Corrige o VFR do iPhone para o After Effects</small></span>${sw('fps.conform', c.fps.conform)}</div>
        <div class="collapse ${c.fps.conform ? '' : 'closed'}" style="max-height:60px">
          <div class="row"><span class="lbl">FPS</span>${segH('fps.value', c.fps.value, [['23.976', '23,976'], ['29.97', '29,97'], ['59.94', '59,94'], ['60', '60']])}</div>
        </div>
      </div>

      <div class="sec-label">Cor ${q.src.hdr ? `<span class="pill-tag" style="--c:${COLORS.yellow}">${q.src.hdr} detectado</span>` : ''}</div>
      <div class="group">
        <div class="row"><span class="lbl">HDR → Rec. 709<small>Tone mapping no padrão do HandBrake</small></span>${sw('hdrToSdr', c.hdrToSdr)}</div>
      </div>
      ${q.src.hdr && !c.hdrToSdr ? `<div class="hint" style="color:var(--orange)">Este vídeo é HDR. Sem a conversão ele vai ficar lavado no Premiere.</div>` : ''}

      <div class="sec-label">Áudio</div>
      <div class="group">
        <div class="row"><span class="lbl">Codec</span>${segH('audio.codec', c.audio.codec, [['aac', 'AAC'], ['copy', 'Copiar']])}</div>
        <div class="row"><span class="lbl">Canais</span>${segH('audio.channels', c.audio.channels, [['stereo', 'Estéreo'], ['mono', 'Mono']])}</div>
        <div class="row"><span class="lbl">Faixas<small>${c.audio.channels === 'stereo' ? 'Esquerdo / Direito' : 'Mono a partir de'}</small></span>
          <div class="val">${c.audio.channels === 'stereo'
            ? `<span class="field" style="padding:0 8px">Áudio ${c.audio.tracks[0]}&nbsp;${ICONS.chev}</span><span class="field" style="padding:0 8px">Áudio ${c.audio.tracks[1]}&nbsp;${ICONS.chev}</span>`
            : `<span class="field" style="padding:0 8px">Áudio ${c.audio.tracks[0]}&nbsp;${ICONS.chev}</span>`}</div></div>
        ${c.audio.codec === 'aac' ? `<div class="row"><span class="lbl">Qualidade</span><span class="val tnum">${c.audio.kbps} kb/s · 48 kHz</span></div>` : ''}
      </div>

      <div class="sec-label">Saída</div>
      <div class="group">
        <div class="row"><span class="lbl">Sufixo</span>
          <div class="field" style="${c.output.suffix.on ? '' : 'opacity:.4'}"><input class="w-s" data-k="output.suffix.text" value="${c.output.suffix.text}" style="width:72px;text-align:left"></div>${sw('output.suffix.on', c.output.suffix.on)}</div>
        <div class="row"><span class="lbl">Criar subpasta</span>
          <div class="field" style="${c.output.subfolder.on ? '' : 'opacity:.4'}"><input data-k="output.subfolder.text" value="${c.output.subfolder.text}" style="width:72px;text-align:left"></div>${sw('output.subfolder.on', c.output.subfolder.on)}</div>
        <div class="row ${c.output.deleteSource ? 'danger' : ''}"><span class="lbl">Apagar o original<small>Só depois de conferir o arquivo novo</small></span>${sw('output.deleteSource', c.output.deleteSource, true)}</div>
        <div class="row"><span class="lbl">Destino</span><span class="val">Mesma pasta ${ICONS.chev}</span></div>
      </div>
      <div class="hint">Vai salvar como <b>${outName(q)}</b></div>`;
    $$('.seg', el).forEach((s) => seg(s, (v) => { set(q, s.dataset.k, v); }));
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
  $('#insp').addEventListener('click', (e) => { const s = e.target.closest('.switch'); if (s) { s.classList.toggle('on'); const q = selItem(); setTimeout(() => set(q, s.dataset.k), 180); } });
  $('#insp').addEventListener('change', (e) => { const i = e.target.closest('input[data-k]'); if (i) set(selItem(), i.dataset.k, i.value); });
  $('#bSavePreset').onclick = () => { const q = selItem(); const p = presetOf(q.preset); Object.assign(p, clone(q.cfg), { id: p.id, name: p.name, icon: p.icon, color: p.color }); renderAll(); toast(`Preset “${p.name}” atualizado`); };
  $('#bApplyAll').onclick = () => { const q = selItem(); S.queue.forEach((x) => { if (x.status !== 'done') { x.preset = q.preset; x.cfg = clone(q.cfg); } }); renderAll(); toast('Ajustes aplicados à fila inteira'); };
  $('#bManage').onclick = () => toast('Gerenciar presets: importar, exportar e compartilhar (próxima etapa)');

  /* ---------- render (simulado) ---------- */
  let timer;
  $('#bRender').onclick = () => {
    S.rendering = !S.rendering; const b = $('#bRender');
    b.classList.toggle('stop', S.rendering);
    $('#renderTxt').textContent = S.rendering ? 'Parar' : 'Renderizar fila';
    clearInterval(timer);
    if (!S.rendering) return;
    timer = setInterval(() => {
      let cur = S.queue.find((q) => q.status === 'running') || S.queue.find((q) => q.status === 'ready');
      if (!cur) { S.rendering = false; b.classList.remove('stop'); $('#renderTxt').textContent = 'Renderizar fila'; clearInterval(timer); toast('Fila concluída'); return; }
      cur.status = 'running'; cur.p = Math.min(1, (cur.p || 0) + .035);
      if (cur.p >= 1) { cur.status = 'done'; }
      const all = S.queue.length; const done = S.queue.filter((q) => q.status === 'done').length + (cur.status === 'running' ? cur.p : 0);
      $('#renderFill').style.setProperty('--p', done / all);
      const it = $(`.item[data-id="${cur.id}"]`);
      if (it && cur.status === 'running') { it.classList.add('running'); it.querySelector('.prog').style.setProperty('--p', cur.p); it.querySelector('.state').textContent = Math.round(cur.p * 100) + '%'; }
      else renderQueue();
    }, 120);
  };

  /* ---------- toast ---------- */
  let tt; function toast(t) { $('#toastTxt').textContent = t; const el = $('#toast'); el.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => el.classList.remove('show'), 2200); }

  function renderAll(anim, enterId) { renderQueue(enterId); renderPresets(); renderPreview(anim); renderInspector(anim); }
  renderAll(); setT(S.t);
  requestAnimationFrame(drawWave);
  addEventListener('resize', () => { drawWave(); $$('.seg').forEach((s) => s.querySelector('.pill') && (s.querySelector('.pill').style.transition = 'none')); });

  // atalhos para os prints de teste: ?sel=2&pv=out
  const qs = new URLSearchParams(location.search);
  if (qs.get('sel')) { S.sel = +qs.get('sel'); renderAll(); }
  if (qs.get('pv') === 'out') $('#pvSeg button[data-v="out"]').click();

  // janela (Tauri)
  const T = window.__TAURI__;
  if (T) {
    const w = T.window.getCurrentWindow();
    $('#bClose').onclick = () => w.close(); $('#bMin').onclick = () => w.minimize(); $('#bMax').onclick = () => w.toggleMaximize();
  }
})();
