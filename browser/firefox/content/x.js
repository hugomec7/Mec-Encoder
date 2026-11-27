/* Botão do Mec Encoder nos posts do X que têm vídeo ou GIF: fica na fileira do curtir/salvar.
   Clique: menu pequeno (Baixar rápido / Só o áudio / GIF) com o link do próprio post. Não precisa copiar nada.
   O X muda o site de vez em quando: os seletores ficam todos aqui em cima. */
(() => {
  const SEL = {
    post: 'article[data-testid="tweet"]',
    video: '[data-testid="videoPlayer"], [data-testid="videoComponent"], video',
    actions: '[role="group"]',
    reply: '[data-testid="reply"]',
  };
  const t = (k) => browser.i18n.getMessage(k);
  const NS = 'http://www.w3.org/2000/svg';
  const DL_ICON = 'M12 3v11.17l-3.59-3.58L7 12l5 5 5-5-1.41-1.41L13 14.17V3h-2zM5 19v2h14v-2H5z';

  function icon(d) {
    const s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('aria-hidden', 'true');
    const p = document.createElementNS(NS, 'path'); p.setAttribute('d', d); s.append(p); return s;
  }

  // link do post: o link com a hora ("2h", "27 nov") aponta para /usuario/status/123
  function postUrl(post) {
    const a = [...post.querySelectorAll('a[href*="/status/"]')].find((x) => x.querySelector('time'));
    if (!a) return null;
    const m = new URL(a.getAttribute('href'), location.origin).pathname.match(/^\/[^/]+\/status\/\d+/);
    return m ? `https://x.com${m[0]}` : null;
  }

  function addButton(post) {
    if (post.querySelector('.mec-x-wrap') || !post.querySelector(SEL.video)) return;
    const bar = [...post.querySelectorAll(SEL.actions)].find((g) => g.querySelector(SEL.reply));
    if (!bar) return;
    const wrap = document.createElement('div'); wrap.className = 'mec-x-wrap';
    const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'mec-x-btn';
    btn.title = t('xTitle'); btn.setAttribute('aria-label', t('xTitle')); btn.append(icon(DL_ICON));
    btn.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      const url = postUrl(post);
      if (url) openMenu(btn, url);
    });
    wrap.append(btn);
    // antes do último botão da fileira (compartilhar)
    bar.insertBefore(wrap, bar.lastElementChild);
  }

  // ---------- menu ----------
  let menu = null;
  function closeMenu() { if (menu) { menu.remove(); menu = null; } }
  function isLight() {
    const m = getComputedStyle(document.body).backgroundColor.match(/\d+/g) || [0, 0, 0];
    return (0.299 * m[0] + 0.587 * m[1] + 0.114 * m[2]) > 160;
  }
  function openMenu(btn, url) {
    closeMenu();
    menu = document.createElement('div'); menu.className = `mec-x-menu${isLight() ? ' light' : ''}`;
    [['video', 'btnQuick'], ['audio', 'btnAudio'], ['gif', 'GIF']].forEach(([kind, key]) => {
      const b = document.createElement('button'); b.type = 'button';
      b.textContent = key === 'GIF' ? 'GIF' : t(key);
      b.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); closeMenu(); send(btn, url, kind); });
      menu.append(b);
    });
    document.body.append(menu);
    const r = btn.getBoundingClientRect(); const w = menu.offsetWidth; const h = menu.offsetHeight;
    const top = r.bottom + 4 + h > innerHeight ? r.top - h - 4 : r.bottom + 4;
    menu.style.top = `${Math.max(4, top)}px`;
    menu.style.left = `${Math.min(innerWidth - w - 8, Math.max(8, r.right - w))}px`;
    menu.querySelector('button').focus();
  }
  document.addEventListener('click', (e) => { if (menu && !menu.contains(e.target)) closeMenu(); }, true);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
  addEventListener('scroll', closeMenu, { passive: true });

  async function send(btn, url, kind) {
    btn.classList.remove('ok', 'err'); btn.classList.add('busy');
    let r = null;
    try { r = await browser.runtime.sendMessage({ type: 'send', link: url, page: location.href, kind }); } catch {}
    btn.classList.remove('busy');
    const ok = !!(r && r.ok);
    btn.classList.add(ok ? 'ok' : 'err');
    btn.title = ok ? t('okTitle') : t('noApp');
    setTimeout(() => { btn.classList.remove('ok', 'err'); btn.title = t('xTitle'); }, ok ? 2500 : 5000);
  }

  // ---------- posts que aparecem ao rolar ----------
  let queued = false;
  function scan() { queued = false; document.querySelectorAll(SEL.post).forEach(addButton); }
  new MutationObserver(() => { if (!queued) { queued = true; setTimeout(scan, 250); } })
    .observe(document.body, { childList: true, subtree: true });
  scan();
})();
