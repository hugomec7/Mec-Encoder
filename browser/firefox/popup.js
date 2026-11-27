/* Menu do ícone.
   Aba Baixar: mostra o link que vai ser baixado (o copiado ou a página) e as opções.
   Aba Avançado: botão em cima dos vídeos (liga/desliga, posição padrão, posições salvas, sites sem o botão). */
const t = (k) => browser.i18n.getMessage(k);
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
$$('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });

let tab = null;
let peek = { urls: [], from: '', page: '' };
let useClip = true;   // com link copiado e página de vídeo ao mesmo tempo: qual usar

const short = (u) => u.replace(/^https?:\/\/(www\.)?/, '');
const siteOf = (u) => { try { const h = new URL(u).hostname.replace(/^www\./, ''); return /^https?:/.test(u) ? h : ''; } catch { return ''; } };

// ---------- abas ----------
function showTab(name) {
  $$('.tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === name));
  $('#tab-main').hidden = name !== 'main'; $('#tab-adv').hidden = name !== 'adv';
  browser.storage.local.set({ popupTab: name });
}
$$('.tabs button').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.tab)));

// ---------- aba Baixar ----------
function current() {
  if (peek.from === 'clipboard' && useClip) return { label: t('popupCopied'), urls: peek.urls, clip: true };
  if (peek.page) return { label: t('popupPage'), urls: [peek.page], link: peek.page };
  if (peek.from === 'link' || peek.from === 'page') return { label: t('popupPage'), urls: peek.urls, link: peek.urls[0] };
  return null;
}

function render() {
  const c = current();
  $('#src').classList.toggle('none', !c);
  $('#tab-main').classList.toggle('off', !c);
  $('#srcLabel').textContent = c ? c.label : '';
  $('#srcUrl').textContent = c ? (c.urls.length > 1 ? `${c.urls.length} links` : short(c.urls[0])) : t('noLink');
  $('#srcUrl').title = c ? c.urls.join('\n') : '';
  $('#swap').hidden = !(peek.from === 'clipboard' && !!peek.page);
  $('#swap').textContent = useClip ? t('usePage') : t('useClip');
}

function show(text, cls, el) {
  const m = $('#msg'); m.hidden = false; m.className = `msg ${cls || ''}`;
  if (el) { m.textContent = ''; m.append(el); } else m.textContent = text;
}

async function go(kind) {
  const c = current(); if (!c) return;
  $('#tab-main').classList.add('off');
  const r = await browser.runtime.sendMessage({ type: 'send', kind, page: tab ? tab.url : '', link: c.link || '', clip: !!c.clip, tabId: tab && tab.id });
  if (r && r.ok) { show(t('sent'), 'ok'); setTimeout(() => window.close(), kind === 'pick' ? 400 : 900); return; }
  $('#tab-main').classList.remove('off');
  show(r && r.error === 'no-link' ? t('noLink') : t('noApp'), 'err');
}

$$('[data-kind]').forEach((b) => b.addEventListener('click', () => go(b.dataset.kind)));
$('#swap').addEventListener('click', () => { useClip = !useClip; render(); });

// ---------- aba Avançado ----------
const O = { floatCorner: 'top-right', floatBlocked: [], floatPos: {} };
const save = (o) => { Object.assign(O, o); return browser.storage.local.set(o); };

function renderAdv(on) {
  if (on !== undefined) $('#float').checked = !!on;
  $('#floatOpts').classList.toggle('off', !$('#float').checked);
  $$('.corners button').forEach((b) => b.classList.toggle('on', b.dataset.corner === O.floatCorner));
  const here = tab && siteOf(tab.url);
  $('#blkThis').hidden = !here || O.floatBlocked.includes(here);
  $('#blkThis').textContent = `+ ${t('blockedThis')} (${here})`;
  const ul = $('#blkList'); ul.textContent = '';
  if (!O.floatBlocked.length) { const li = document.createElement('li'); li.className = 'empty'; li.textContent = t('blockedEmpty'); ul.append(li); }
  O.floatBlocked.forEach((d) => {
    const li = document.createElement('li'); const s = document.createElement('span'); s.textContent = d;
    const x = document.createElement('button'); x.textContent = '×'; x.title = t('blockedRemove');
    x.addEventListener('click', () => save({ floatBlocked: O.floatBlocked.filter((y) => y !== d) }).then(() => renderAdv()));
    li.append(s, x); ul.append(li);
  });
}

// "https://www.exemplo.com/abc" → "exemplo.com"
function cleanSite(v) {
  v = v.trim().toLowerCase(); if (!v) return '';
  if (!/^[a-z]+:\/\//.test(v)) v = `https://${v}`;
  try { return new URL(v).hostname.replace(/^www\./, ''); } catch { return ''; }
}
function addBlocked(d) {
  if (!d || O.floatBlocked.includes(d)) return;
  save({ floatBlocked: [...O.floatBlocked, d].sort() }).then(() => renderAdv());
}

const fl = $('#float');
fl.addEventListener('change', async () => {
  let want = fl.checked;
  // o Firefox pede a permissão de todos os sites (só aqui, com o seu clique); o menu pode fechar nessa hora
  if (want) want = await browser.permissions.request({ origins: ['<all_urls>'] }).catch(() => false);
  const on = await browser.runtime.sendMessage({ type: 'float-set', on: want });
  renderAdv(on);
  $('#floatHint').textContent = on ? t('floatReload') : t('floatSub');
});
// posição padrão nova vale para todos os sites (substitui o que foi arrastado em cada um)
$$('.corners button').forEach((b) => b.addEventListener('click', () => save({ floatCorner: b.dataset.corner, floatPos: {} }).then(() => renderAdv())));
$('#blkAdd').addEventListener('click', () => { addBlocked(cleanSite($('#blkInput').value)); $('#blkInput').value = ''; });
$('#blkInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('#blkAdd').click(); });
$('#blkInput').placeholder = t('blockedPh');
$('#blkThis').addEventListener('click', () => addBlocked(siteOf(tab.url)));

// ---------- início ----------
(async () => {
  [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  const st = await browser.storage.local.get(Object.assign({ popupTab: 'main' }, O));
  Object.assign(O, { floatCorner: st.floatCorner, floatBlocked: st.floatBlocked, floatPos: st.floatPos });
  showTab(st.popupTab);
  renderAdv(await browser.runtime.sendMessage({ type: 'float-get' }));

  const r = await browser.runtime.sendMessage({ type: 'peek', page: tab ? tab.url : '' });
  if (r && r.error === 'host-missing') {
    $('#tab-main').classList.add('off'); $('#src').classList.add('none');
    $('#srcUrl').textContent = t('noApp');
    const a = document.createElement('a'); a.href = '#'; a.textContent = t('helpTitle');
    a.onclick = (e) => { e.preventDefault(); browser.runtime.sendMessage({ type: 'help' }); window.close(); };
    show('', 'err', a);
    return;
  }
  peek = { urls: (r && r.urls) || [], from: (r && r.from) || '', page: (r && r.page) || '' };
  render();
  if (st.popupTab === 'main') $('#bQuick').focus();
})();
