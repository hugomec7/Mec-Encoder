/* Mec Encoder para Firefox: o meio de campo entre o navegador e o app.
   - Clique no ícone: abre o menu (popup.html), que pergunta aqui qual link seria usado ("peek") e manda baixar ("send").
   - Botão nos posts do X (content/x.js): manda o link do post ("send").
   - Botão direito num link, vídeo ou página: Mec Encoder › Baixar vídeo / só o áudio / GIF.
   Quem decide o link e abre o app é o mec-link.exe (native messaging, host "com.hugomec.mecencoder"). */
const HOST = 'com.hugomec.mecencoder';
const t = (k) => browser.i18n.getMessage(k);
const CTX = ['link', 'video', 'audio', 'page'];
const KINDS = [['video', 'menuVideo'], ['audio', 'menuAudio'], ['gif', 'menuGif']];

function makeMenus() {
  browser.contextMenus.removeAll().then(() => {
    browser.contextMenus.create({ id: 'root', title: t('menuRoot'), contexts: CTX });
    KINDS.forEach(([k, m]) => browser.contextMenus.create({ id: k, parentId: 'root', title: t(m), contexts: CTX }));
  });
}
browser.runtime.onInstalled.addListener(makeMenus);
browser.runtime.onStartup.addListener(makeMenus);

const isWeb = (u) => /^https?:\/\//i.test(u || '');

async function native(msg) {
  try { return await browser.runtime.sendNativeMessage(HOST, msg); }
  catch (e) { return { ok: false, error: 'host-missing' }; }
}

/* Envia para o app e mostra o resultado no ícone (✓ recebido, ! problema). Sem o app conectado, abre a ajuda. */
async function send(msg, tabId) {
  const r = await native(msg);
  if (r && r.ok) { badge(tabId, '✓', '#2f9e44', `${t('okTitle')}\n${(r.urls || []).join('\n')}`); return r; }
  const err = (r && r.error) || 'host-missing';
  if (err === 'no-link') { badge(tabId, '!', '#e8590c', t('noLink')); return r; }
  badge(tabId, '!', '#e03131', t('noApp'));
  if (err === 'host-missing' || err === 'app-missing') browser.tabs.create({ url: browser.runtime.getURL('help.html') });
  return r;
}

/* Botão em cima de qualquer vídeo (chave na aba Avançado do menu do ícone, desligado por padrão).
   Ligado = permissão "todos os sites" + script registrado (vale no X também, com o link do post).
   Sites da lista "Sites sem o botão" são conferidos pelo próprio script. */
const FLOAT = { id: 'mec-float-2', all: { origins: ['<all_urls>'] } };
async function floatState() {
  const { float = false } = await browser.storage.local.get('float');
  return float && await browser.permissions.contains(FLOAT.all);
}
async function floatSync() {
  const on = await floatState();
  const regs = await browser.scripting.getRegisteredContentScripts();
  // versões antigas do registro (mec-float sem o X) saem
  const old = regs.filter((r) => r.id.startsWith('mec-float') && r.id !== FLOAT.id).map((r) => r.id);
  if (old.length) await browser.scripting.unregisterContentScripts({ ids: old });
  const reg = regs.some((r) => r.id === FLOAT.id);
  if (on && !reg) {
    await browser.scripting.registerContentScripts([{
      id: FLOAT.id, matches: ['<all_urls>'],
      js: ['content/float.js'], allFrames: true, runAt: 'document_idle', persistAcrossSessions: true,
    }]);
  } else if (!on && reg) {
    await browser.scripting.unregisterContentScripts({ ids: [FLOAT.id] });
  }
  return on;
}
browser.runtime.onStartup.addListener(floatSync);
browser.runtime.onInstalled.addListener(floatSync);
browser.permissions.onRemoved.addListener(floatSync);
// o menu do ícone fecha quando o Firefox mostra o pedido de permissão: quem liga a chave é este aviso
browser.permissions.onAdded.addListener(async (p) => {
  if ((p.origins || []).includes('<all_urls>')) { await browser.storage.local.set({ float: true }); floatSync(); }
});

// menu do ícone e botão do X
browser.runtime.onMessage.addListener((m, sender) => {
  if (!m) return;
  const tabId = sender.tab ? sender.tab.id : m.tabId;
  if (m.type === 'float-get') return floatState();
  if (m.type === 'float-set') {
    return browser.storage.local.set({ float: !!m.on }).then(async () => {
      const on = await floatSync();
      if (!m.on) await browser.permissions.remove(FLOAT.all).catch(() => {});
      return on;
    });
  }
  if (m.type === 'peek') return native({ action: 'peek', page: m.page || '' });
  if (m.type === 'send') return send({ link: isWeb(m.link) ? m.link : '', page: m.page || '', kind: m.kind || 'video', clip: !!m.clip }, tabId);
  if (m.type === 'help') return browser.tabs.create({ url: browser.runtime.getURL('help.html') });
});

browser.contextMenus.onClicked.addListener((info, tab) => {
  const id = String(info.menuItemId);
  if (!KINDS.some(([k]) => k === id)) return;
  // link > endereço do vídeo (se for um arquivo de verdade, não blob:) > página clicada
  let link = info.linkUrl || (isWeb(info.srcUrl) ? info.srcUrl : '');
  if (!link && !info.mediaType) link = info.pageUrl;
  send({ link: isWeb(link) ? link : '', page: info.pageUrl || (tab && tab.url), kind: id }, tab && tab.id);
});

// selo no ícone por alguns segundos, com a explicação ao passar o mouse
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
