/* Botão flutuante em cima de qualquer vídeo (opcional: ligado pela chave no menu do ícone).
   Ao passar o mouse sobre um vídeo, aparece um botão no canto; clique = menu Baixar rápido / Só o áudio / GIF
   com o link da página (o yt-dlp acha o vídeo nela). Fica numa "shadow root" para o site não mexer no visual. */
(() => {
  if (window.__mecFloat) return; window.__mecFloat = true;
  const t = (k) => browser.i18n.getMessage(k);
  const MIN_W = 200, MIN_H = 120;

  const host = document.createElement('mec-encoder-float');
  host.style.cssText = 'all:initial;position:fixed;top:0;left:0;width:0;height:0;z-index:2147483647';
  const root = host.attachShadow({ mode: 'closed' });
  root.innerHTML = `<style>
    .btn{position:fixed;display:none;align-items:center;gap:6px;height:30px;padding:0 10px 0 8px;border:0;border-radius:15px;cursor:pointer;
      background:rgba(23,24,27,.88);color:#fff;font:600 12px/1 system-ui,"Segoe UI",sans-serif;box-shadow:0 2px 8px rgba(0,0,0,.35)}
    .btn:hover{background:#1f6feb}.btn.ok{background:#2f9e44}.btn.err{background:#e03131}
    .btn svg{width:15px;height:15px;fill:currentColor}
    .menu{position:fixed;display:none;min-width:170px;padding:4px 0;border-radius:10px;background:#17181b;color:#e9e9ea;
      box-shadow:0 6px 24px rgba(0,0,0,.45);font:13px/18px system-ui,"Segoe UI",sans-serif}
    .menu button{all:unset;box-sizing:border-box;display:block;width:100%;padding:8px 14px;cursor:pointer}
    .menu button:first-child{font-weight:600}.menu button:hover{background:#2a2d33}
  </style>
  <button class="btn" part="btn"><svg viewBox="0 0 24 24"><path d="M12 3v11.17l-3.59-3.58L7 12l5 5 5-5-1.41-1.41L13 14.17V3h-2zM5 19v2h14v-2H5z"/></svg><span></span></button>
  <div class="menu"></div>`;
  const btn = root.querySelector('.btn'); const menu = root.querySelector('.menu');
  btn.querySelector('span').textContent = 'Mec Encoder'; btn.title = t('xTitle');
  [['video', 'btnQuick'], ['audio', 'btnAudio'], ['gif', 'GIF']].forEach(([kind, key]) => {
    const b = document.createElement('button'); b.textContent = key === 'GIF' ? 'GIF' : t(key);
    b.addEventListener('click', (e) => { e.stopPropagation(); hideMenu(); send(kind); });
    menu.append(b);
  });
  (document.body || document.documentElement).append(host);

  let video = null; let hideTimer = 0;
  const big = (v) => { const r = v.getBoundingClientRect(); return r.width >= MIN_W && r.height >= MIN_H; };
  function place() {
    if (!video || !video.isConnected) { hide(); return; }
    const r = video.getBoundingClientRect();
    btn.style.display = 'flex';
    btn.style.top = `${Math.max(4, r.top + 10)}px`;
    btn.style.left = `${Math.max(4, Math.min(innerWidth - btn.offsetWidth - 4, r.right - btn.offsetWidth - 10))}px`;
  }
  function hide() { btn.style.display = 'none'; hideMenu(); video = null; }
  function hideMenu() { menu.style.display = 'none'; }

  // vídeo debaixo do mouse (mesmo com os controles do site por cima dele)
  let raf = 0;
  addEventListener('mousemove', (e) => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      if (e.composedPath().includes(host)) { clearTimeout(hideTimer); return; }
      const v = document.elementsFromPoint(e.clientX, e.clientY).find((el) => el instanceof HTMLVideoElement);
      if (v && big(v)) { clearTimeout(hideTimer); if (v !== video) { video = v; hideMenu(); } place(); }
      else if (video && menu.style.display !== 'block') { clearTimeout(hideTimer); hideTimer = setTimeout(hide, 700); }
    });
  }, { passive: true });
  addEventListener('scroll', () => { if (video) place(); }, { passive: true, capture: true });
  addEventListener('resize', () => { if (video) place(); });
  // tela cheia: o botão vai junto para dentro do elemento em tela cheia
  document.addEventListener('fullscreenchange', () => { (document.fullscreenElement || document.body || document.documentElement).append(host); hide(); });

  btn.addEventListener('click', (e) => {
    e.preventDefault(); e.stopPropagation();
    if (menu.style.display === 'block') { hideMenu(); return; }
    menu.style.display = 'block';
    const r = btn.getBoundingClientRect();
    menu.style.top = `${Math.min(innerHeight - menu.offsetHeight - 4, r.bottom + 4)}px`;
    menu.style.left = `${Math.max(4, Math.min(innerWidth - menu.offsetWidth - 4, r.right - menu.offsetWidth))}px`;
  });
  document.addEventListener('click', (e) => { if (!e.composedPath().includes(host)) hideMenu(); }, true);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hideMenu(); });

  async function send(kind) {
    btn.classList.remove('ok', 'err');
    let r = null;
    // a página é o melhor link para o yt-dlp; dentro de um player embutido (iframe), é o link do próprio player
    try { r = await browser.runtime.sendMessage({ type: 'send', link: location.href, page: location.href, kind }); } catch {}
    const ok = !!(r && r.ok);
    btn.classList.add(ok ? 'ok' : 'err');
    btn.querySelector('span').textContent = ok ? t('sent') : t('noApp');
    setTimeout(() => { btn.classList.remove('ok', 'err'); btn.querySelector('span').textContent = 'Mec Encoder'; }, 2500);
  }
})();
