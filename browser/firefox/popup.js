/* Menu do ícone: mostra o link que vai ser baixado (o copiado ou a página) e as opções. */
const t = (k) => browser.i18n.getMessage(k);
const $ = (s) => document.querySelector(s);
document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });

let tab = null;
let peek = { urls: [], from: '', page: '' };
let useClip = true;   // com link copiado e página de vídeo ao mesmo tempo: qual usar

const short = (u) => u.replace(/^https?:\/\/(www\.)?/, '');

// o que vai ser enviado agora
function current() {
  if (peek.from === 'clipboard' && useClip) return { label: t('popupCopied'), urls: peek.urls, clip: true };
  if (peek.page) return { label: t('popupPage'), urls: [peek.page], link: peek.page };
  if (peek.from === 'link' || peek.from === 'page') return { label: t('popupPage'), urls: peek.urls, link: peek.urls[0] };
  return null;
}

function render() {
  const c = current();
  $('#src').classList.toggle('none', !c);
  document.body.classList.toggle('off', !c);
  $('#srcLabel').textContent = c ? c.label : '';
  $('#srcUrl').textContent = c ? (c.urls.length > 1 ? `${c.urls.length} links` : short(c.urls[0])) : t('noLink');
  $('#srcUrl').title = c ? c.urls.join('\n') : '';
  const both = peek.from === 'clipboard' && !!peek.page;
  $('#swap').hidden = !both;
  $('#swap').textContent = useClip ? t('usePage') : t('useClip');
}

function show(text, cls, html) {
  const m = $('#msg'); m.hidden = false; m.className = `msg ${cls || ''}`;
  if (html) { m.textContent = ''; m.append(html); } else m.textContent = text;
}

async function go(kind) {
  const c = current(); if (!c) return;
  document.body.classList.add('off');
  const r = await browser.runtime.sendMessage({ type: 'send', kind, page: tab ? tab.url : '', link: c.link || '', clip: !!c.clip, tabId: tab && tab.id });
  if (r && r.ok) { show(t('sent'), 'ok'); setTimeout(() => window.close(), kind === 'pick' ? 400 : 900); return; }
  document.body.classList.remove('off');
  show(r && r.error === 'no-link' ? t('noLink') : t('noApp'), 'err');
}

document.querySelectorAll('[data-kind]').forEach((b) => b.addEventListener('click', () => go(b.dataset.kind)));
$('#swap').addEventListener('click', () => { useClip = !useClip; render(); });

// chave do botão flutuante: ao ligar, o Firefox pede a permissão de todos os sites (só aqui, com o seu clique)
const fl = $('#float');
browser.runtime.sendMessage({ type: 'float-get' }).then((on) => { fl.checked = !!on; });
fl.addEventListener('change', async () => {
  let want = fl.checked;
  if (want) want = await browser.permissions.request({ origins: ['<all_urls>'] }).catch(() => false);
  const on = await browser.runtime.sendMessage({ type: 'float-set', on: want });
  fl.checked = !!on;
  $('#floatHint').textContent = on ? t('floatReload') : t('floatSub');
});

(async () => {
  [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  const r = await browser.runtime.sendMessage({ type: 'peek', page: tab ? tab.url : '' });
  if (r && r.error === 'host-missing') {
    document.body.classList.add('off'); $('#src').classList.add('none');
    $('#srcUrl').textContent = t('noApp');
    const a = document.createElement('a'); a.href = '#'; a.textContent = t('helpTitle');
    a.onclick = (e) => { e.preventDefault(); browser.runtime.sendMessage({ type: 'help' }); window.close(); };
    show('', 'err', a);
    return;
  }
  peek = { urls: (r && r.urls) || [], from: (r && r.from) || '', page: (r && r.page) || '' };
  render();
  $('#bQuick').focus();
})();
