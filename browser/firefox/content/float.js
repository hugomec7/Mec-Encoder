/* Botão em cima de qualquer vídeo (opcional: chave na aba Avançado do menu do ícone).
   - Mouse sobre um vídeo: aparece um ícone redondo no canto escolhido em Avançado (padrão: em cima, à direita).
   - Arrastar o ícone muda o lugar dele; a posição fica salva para aquele site.
   - Clique: menu Baixar rápido / Só o áudio / GIF. No X vai o link do post; nos outros sites, o da página.
   - Sites da lista "Sites sem o botão" (Avançado) ficam de fora.
   Tudo numa "shadow root" para o site não mexer no visual. */
(() => {
  if (window.__mecFloat) return; window.__mecFloat = true;
  const t = (k) => browser.i18n.getMessage(k);
  const MIN_W = 200, MIN_H = 120, PAD = 10, SIZE = 32;
  const site = location.hostname.replace(/^www\./, '');
  const S = { floatCorner: 'top-right', floatBlocked: [], floatPos: {} };
  const blocked = () => S.floatBlocked.some((d) => site === d || site.endsWith(`.${d}`));

  const host = document.createElement('mec-encoder-float');
  host.style.cssText = 'all:initial;position:fixed;top:0;left:0;width:0;height:0;z-index:2147483647';
  const root = host.attachShadow({ mode: 'closed' });
  root.innerHTML = `<style>
    .btn{position:fixed;display:none;align-items:center;justify-content:center;width:${SIZE}px;height:${SIZE}px;padding:0;border:0;border-radius:50%;
      cursor:pointer;background:rgba(23,24,27,.82);color:#fff;box-shadow:0 2px 8px rgba(0,0,0,.35);touch-action:none;transition:background .15s}
    .btn:hover{background:#1f6feb}.btn.ok{background:#2f9e44}.btn.err{background:#e03131}.btn.drag{cursor:grabbing;background:#1f6feb;transition:none}
    .btn svg{width:17px;height:17px;fill:currentColor;pointer-events:none}
    .menu{position:fixed;display:none;min-width:170px;padding:4px 0;border-radius:10px;background:#17181b;color:#e9e9ea;
      box-shadow:0 6px 24px rgba(0,0,0,.45);font:13px/18px system-ui,"Segoe UI",sans-serif}
    .menu button{all:unset;box-sizing:border-box;display:block;width:100%;padding:8px 14px;cursor:pointer}
    .menu button:first-child{font-weight:600}.menu button:hover{background:#2a2d33}
    .menu .hint{padding:6px 14px 4px;font-size:11px;color:#7d8088;border-top:1px solid #2a2c31;margin-top:4px}
  </style>
  <button class="btn"><svg viewBox="0 0 24 24"><path d="M12 3v11.17l-3.59-3.58L7 12l5 5 5-5-1.41-1.41L13 14.17V3h-2zM5 19v2h14v-2H5z"/></svg></button>
  <div class="menu"></div>`;
  const btn = root.querySelector('.btn'); const menu = root.querySelector('.menu');
  btn.title = t('xTitle'); btn.setAttribute('aria-label', t('xTitle'));
  [['video', 'btnQuick'], ['audio', 'btnAudio'], ['gif', 'GIF']].forEach(([kind, key]) => {
    const b = document.createElement('button'); b.textContent = key === 'GIF' ? 'GIF' : t(key);
    b.addEventListener('click', (e) => { e.stopPropagation(); hideMenu(); send(kind); });
    menu.append(b);
  });
  const hint = document.createElement('div'); hint.className = 'hint'; hint.textContent = t('posHint'); menu.append(hint);
  (document.body || document.documentElement).append(host);

  // ---------- posição ----------
  let video = null; let hideTimer = 0; let drag = null;
  const big = (v) => { const r = v.getBoundingClientRect(); return r.width >= MIN_W && r.height >= MIN_H; };
  // posição em frações do vídeo (0 = esquerda/topo, 1 = direita/baixo): a salva do site ou o canto padrão
  function frac() {
    const p = S.floatPos[site]; if (p) return p;
    return { x: S.floatCorner.endsWith('left') ? 0 : 1, y: S.floatCorner.startsWith('bottom') ? 1 : 0 };
  }
  function moveTo(left, top) {
    btn.style.left = `${Math.max(2, Math.min(innerWidth - SIZE - 2, left))}px`;
    btn.style.top = `${Math.max(2, Math.min(innerHeight - SIZE - 2, top))}px`;
  }
  function place() {
    if (!video || !video.isConnected || blocked()) { hide(); return; }
    const r = video.getBoundingClientRect(); const f = frac();
    btn.style.display = 'flex';
    moveTo(r.left + PAD + f.x * (r.width - SIZE - 2 * PAD), r.top + PAD + f.y * (r.height - SIZE - 2 * PAD));
  }
  function hide() { if (drag) return; btn.style.display = 'none'; hideMenu(); video = null; }
  function hideMenu() { menu.style.display = 'none'; }

  // vídeo debaixo do mouse (mesmo com os controles do site por cima dele)
  let raf = 0;
  addEventListener('mousemove', (e) => {
    if (raf || drag) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      if (blocked()) return;
      if (e.composedPath().includes(host)) { clearTimeout(hideTimer); return; }
      const v = document.elementsFromPoint(e.clientX, e.clientY).find((el) => el instanceof HTMLVideoElement);
      if (v && big(v)) { clearTimeout(hideTimer); if (v !== video) { video = v; hideMenu(); } place(); }
      else if (video && menu.style.display !== 'block') { clearTimeout(hideTimer); hideTimer = setTimeout(hide, 700); }
    });
  }, { passive: true });
  addEventListener('scroll', () => { if (video && !drag) place(); }, { passive: true, capture: true });
  addEventListener('resize', () => { if (video) place(); });
  document.addEventListener('fullscreenchange', () => { (document.fullscreenElement || document.body || document.documentElement).append(host); hide(); });

  // ---------- arrastar = reposicionar; clicar = menu ----------
  btn.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    e.preventDefault(); e.stopPropagation();
    const r = btn.getBoundingClientRect();
    drag = { x0: e.clientX, y0: e.clientY, dx: e.clientX - r.left, dy: e.clientY - r.top, moved: false };
    btn.setPointerCapture(e.pointerId);
  });
  btn.addEventListener('pointermove', (e) => {
    if (!drag) return;
    if (!drag.moved && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 5) return;
    if (!drag.moved) { drag.moved = true; hideMenu(); btn.classList.add('drag'); }
    const r = video ? video.getBoundingClientRect() : null;
    let left = e.clientX - drag.dx; let top = e.clientY - drag.dy;
    if (r) { left = Math.max(r.left, Math.min(r.right - SIZE, left)); top = Math.max(r.top, Math.min(r.bottom - SIZE, top)); }
    moveTo(left, top);
  });
  btn.addEventListener('pointerup', (e) => {
    if (!drag) return;
    const d = drag; drag = null; btn.classList.remove('drag');
    try { btn.releasePointerCapture(e.pointerId); } catch {}
    e.preventDefault(); e.stopPropagation();
    if (!d.moved) { toggleMenu(); return; }
    if (!video) return;
    const r = video.getBoundingClientRect(); const b = btn.getBoundingClientRect();
    const fx = (b.left - r.left - PAD) / Math.max(1, r.width - SIZE - 2 * PAD);
    const fy = (b.top - r.top - PAD) / Math.max(1, r.height - SIZE - 2 * PAD);
    S.floatPos = Object.assign({}, S.floatPos, { [site]: { x: Math.max(0, Math.min(1, fx)), y: Math.max(0, Math.min(1, fy)) } });
    browser.storage.local.set({ floatPos: S.floatPos });
  });
  btn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); });

  function toggleMenu() {
    if (menu.style.display === 'block') { hideMenu(); return; }
    menu.style.display = 'block';
    const r = btn.getBoundingClientRect();
    const below = r.bottom + 4 + menu.offsetHeight <= innerHeight;
    menu.style.top = `${below ? r.bottom + 4 : Math.max(4, r.top - menu.offsetHeight - 4)}px`;
    menu.style.left = `${Math.max(4, Math.min(innerWidth - menu.offsetWidth - 4, r.left))}px`;
  }
  document.addEventListener('click', (e) => { if (!e.composedPath().includes(host)) hideMenu(); }, true);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hideMenu(); });

  // ---------- enviar ----------
  // No X: o link do post do vídeo (a página costuma ser a timeline). Nos outros sites: a página
  // (dentro de um player embutido, é o link do próprio player).
  function linkFor(v) {
    const post = v && v.closest('article[data-testid="tweet"]');
    if (post) {
      const a = [...post.querySelectorAll('a[href*="/status/"]')].find((x) => x.querySelector('time'));
      const m = a && new URL(a.getAttribute('href'), location.origin).pathname.match(/^\/[^/]+\/status\/\d+/);
      if (m) return `https://x.com${m[0]}`;
    }
    return location.href;
  }
  async function send(kind) {
    btn.classList.remove('ok', 'err');
    let r = null;
    const link = linkFor(video);
    try { r = await browser.runtime.sendMessage({ type: 'send', link, page: location.href, kind }); } catch {}
    const ok = !!(r && r.ok);
    btn.classList.add(ok ? 'ok' : 'err');
    btn.title = ok ? t('sent') : t('noApp');
    setTimeout(() => { btn.classList.remove('ok', 'err'); btn.title = t('xTitle'); }, 2500);
  }

  // ---------- opções (aba Avançado) ----------
  browser.storage.local.get(S).then((v) => Object.assign(S, v));
  browser.storage.onChanged.addListener((ch, area) => {
    if (area !== 'local') return;
    Object.keys(S).forEach((k) => { if (ch[k]) S[k] = ch[k].newValue !== undefined ? ch[k].newValue : S[k]; });
    if (ch.floatPos && ch.floatPos.newValue === undefined) S.floatPos = {};
    if (blocked()) hide(); else if (video) place();
  });
})();
