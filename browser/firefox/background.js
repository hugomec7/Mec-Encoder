/* Mec Encoder para Firefox.
   Clique no botão: manda o link copiado (se ainda não foi enviado) ou a página aberta para o Mec Encoder,
   que baixa no modo Baixar rápido. Botão direito num link, vídeo ou página: escolhe vídeo, áudio ou GIF.
   Quem decide o link e abre o app é o mec-link.exe (native messaging, host "com.hugomec.mecencoder"). */
const HOST = 'com.hugomec.mecencoder';
const t = (k) => browser.i18n.getMessage(k);
const CTX = ['link', 'video', 'audio', 'page'];
const KINDS = [['video', 'menuVideo'], ['audio', 'menuAudio'], ['gif', 'menuGif']];

function makeMenus() {
  browser.contextMenus.removeAll().then(() => {
    // na página: Mec Encoder › Baixar vídeo / só o áudio / GIF
    browser.contextMenus.create({ id: 'root', title: t('menuRoot'), contexts: CTX });
    KINDS.forEach(([k, m]) => browser.contextMenus.create({ id: k, parentId: 'root', title: t(m), contexts: CTX }));
    // no próprio botão (botão direito no ícone): só o áudio / GIF do link copiado ou da página
    KINDS.slice(1).forEach(([k, m]) => browser.contextMenus.create({ id: 'btn-' + k, title: t(m), contexts: ['action'] }));
  });
}
browser.runtime.onInstalled.addListener(makeMenus);
browser.runtime.onStartup.addListener(makeMenus);

const isWeb = (u) => /^https?:\/\//i.test(u || '');

browser.action.onClicked.addListener((tab) => send({ page: tab.url, kind: 'video' }, tab.id));

browser.contextMenus.onClicked.addListener((info, tab) => {
  const id = String(info.menuItemId);
  const tabId = tab && tab.id;
  if (id.startsWith('btn-')) { send({ page: info.pageUrl || (tab && tab.url), kind: id.slice(4) }, tabId); return; }
  if (!KINDS.some(([k]) => k === id)) return;
  // link > endereço do vídeo (se for um arquivo de verdade, não blob:) > página clicada
  let link = info.linkUrl || (isWeb(info.srcUrl) ? info.srcUrl : '');
  if (!link && !info.mediaType) link = info.pageUrl;
  send({ link: isWeb(link) ? link : '', page: info.pageUrl || (tab && tab.url), kind: id }, tabId);
});

async function send(msg, tabId) {
  let r;
  try { r = await browser.runtime.sendNativeMessage(HOST, msg); }
  catch (e) { r = { ok: false, error: 'host-missing' }; }
  if (r && r.ok) { badge(tabId, '✓', '#2f9e44', `${t('okTitle')}\n${(r.urls || []).join('\n')}`); return; }
  const err = (r && r.error) || 'host-missing';
  if (err === 'no-link') { badge(tabId, '!', '#e8590c', t('noLink')); return; }
  badge(tabId, '!', '#e03131', t('noApp'));
  if (err === 'host-missing' || err === 'app-missing') browser.tabs.create({ url: browser.runtime.getURL('help.html') });
}

// selo no ícone por alguns segundos (✓ recebido, ! problema), com a explicação ao passar o mouse
const timers = {};
function badge(tabId, text, color, title) {
  const o = tabId != null ? { tabId } : {};
  browser.action.setBadgeBackgroundColor(Object.assign({ color }, o));
  if (browser.action.setBadgeTextColor) browser.action.setBadgeTextColor(Object.assign({ color: '#ffffff' }, o));
  browser.action.setBadgeText(Object.assign({ text }, o));
  browser.action.setTitle(Object.assign({ title }, o));
  clearTimeout(timers[tabId]);
  timers[tabId] = setTimeout(() => {
    browser.action.setBadgeText(Object.assign({ text: '' }, o));
    browser.action.setTitle(Object.assign({ title: null }, o));
  }, text === '✓' ? 2500 : 6000);
}
