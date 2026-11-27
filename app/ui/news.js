// Gerado por docs/release-notes/make_news.py — não edite à mão.
window.MEC_NEWS = [
 {
  "version": "0.3.14",
  "en": [
   "**Installing the Firefox extension is clear now.** The **Install extension** button is in three places: the News window (the whole highlight card installs), the Download tab card and Settings › Firefox extension, now with the Firefox icon and a line explaining what happens. Clicking opens the signed extension in Firefox (even if your default browser is another one), and Firefox asks to add it.",
   "**Fixed: \"Connected\" without the extension.** The app now reads Firefox's own list of extensions to know if Mec Encoder's extension is installed and enabled. It shows **Installed ✓** only when it really is, and updates by itself when you come back to the app after installing or removing it.",
   "Without Firefox on the computer, the button becomes **Get Firefox** (official Mozilla page)."
  ],
  "pt": [
   "**Instalar a extensão do Firefox ficou claro.** O botão **Instalar extensão** está em três lugares: na janela de Novidades (o card de destaque inteiro instala), no cartão da aba Baixar e em Configurações › Extensão do Firefox, agora com o ícone do Firefox e uma linha explicando o que acontece. O clique abre a extensão assinada no Firefox (mesmo que o seu navegador padrão seja outro), e o Firefox pergunta se pode adicionar.",
   "**Corrigido: \"Conectada\" sem a extensão.** O app agora lê a lista de extensões do próprio Firefox para saber se a extensão do Mec Encoder está instalada e ativa. Ele mostra **Instalada ✓** só quando está mesmo, e atualiza sozinho quando você volta para o app depois de instalar ou tirar a extensão.",
   "Sem Firefox no computador, o botão vira **Baixar o Firefox** (página oficial da Mozilla)."
  ],
  "hl": {
   "en": {
    "title": "Installing the Firefox extension is easier",
    "text": "Click Install extension here, in Settings or in the Download tab: Firefox opens and asks to add it.",
    "action": "firefox"
   },
   "pt": {
    "title": "Ficou fácil instalar a extensão do Firefox",
    "text": "Clique em Instalar extensão aqui, nas Configurações ou na aba Baixar: o Firefox abre e pergunta se pode adicionar.",
    "action": "firefox"
   }
  },
  "app": {
   "en": [
    "Settings › **Firefox extension** shows the Firefox icon and whether the extension is installed.",
    "Fixed: the app said \"Connected\" even without the extension installed."
   ],
   "pt": [
    "Configurações › **Extensão do Firefox** mostra o ícone do Firefox e se a extensão está instalada.",
    "Corrigido: o app dizia \"Conectada\" mesmo sem a extensão instalada."
   ]
  }
 },
 {
  "version": "0.3.13",
  "en": [
   "**Firefox extension.** Download videos without leaving the browser. Copy the video link (on X: Share › Copy link) and click the Mec Encoder icon: a menu shows the link and the options **Quick download**, **Audio only**, **GIF** and **Choose quality…**. It also works by right-clicking a link, a video or the page. Install it from the Download tab (**Install extension**) or from Options.",
   "**Button on top of videos (optional).** In the extension menu › Advanced, turn on \"Button on videos\": a small round icon appears over any video on any site, with the same menu. Drag it to move it (the spot is saved per site), choose the default position (top or bottom; left, center or right) and list the sites where it shouldn't appear. Off by default; Firefox asks for permission to access all sites only when you turn it on.",
   "**Doesn't interrupt you.** Downloads sent from the browser go to the Download tab without bringing the window to the front. With the app closed, it opens minimized. The same link isn't downloaded twice.",
   "**How it connects.** The new `mec-link.exe` (in the `bin` folder) is the bridge between Firefox and the app (Firefox \"native messaging\"). The app sets it up by itself every time it opens. Nothing goes to the internet: the link goes from the browser to the app on your own computer.",
   "**News window**: shorter, only with the version you are using, and the main new feature highlighted. The full notes stay here on GitHub.",
   "Test versions now have \"teste\" in the name (for example `0.3.13-teste.1`) and are updated to the final version."
  ],
  "pt": [
   "**Extensão para o Firefox.** Baixe vídeos sem sair do navegador. Copie o link do vídeo (no X: Compartilhar › Copiar link) e clique no ícone do Mec Encoder: um menu mostra o link e as opções **Baixar rápido**, **Só o áudio**, **GIF** e **Escolher qualidade…**. Também funciona com o botão direito num link, num vídeo ou na página. Instale pela aba Baixar (**Instalar extensão**) ou pelas Opções.",
   "**Botão em cima dos vídeos (opcional).** No menu da extensão › Avançado, ligue \"Botão em cima dos vídeos\": aparece um ícone redondo pequeno sobre qualquer vídeo de qualquer site, com o mesmo menu. Arraste para mudar o lugar (fica salvo por site), escolha a posição padrão (em cima ou embaixo; à esquerda, no centro ou à direita) e liste os sites onde ele não deve aparecer. Vem desligado; o Firefox pede a permissão de acessar todos os sites só quando você liga.",
   "**Não atrapalha.** Os downloads mandados pelo navegador vão para a aba Baixar sem trazer a janela para a frente. Com o app fechado, ele abre minimizado. O mesmo link não é baixado duas vezes.",
   "**Como conecta.** O novo `mec-link.exe` (na pasta `bin`) é a ponte entre o Firefox e o app (\"native messaging\" do Firefox). O app configura sozinho toda vez que abre. Nada vai para a internet: o link sai do navegador e vai para o app no seu próprio computador.",
   "**Janela de Novidades**: mais curta, só com a versão que você está usando e a novidade principal em destaque. As notas completas continuam aqui no GitHub.",
   "Versões de teste agora têm \"teste\" no nome (por exemplo `0.3.13-teste.1`) e recebem a atualização para a versão final."
  ],
  "hl": {
   "en": {
    "title": "Firefox extension",
    "text": "Copy the video link, click the extension and it downloads on its own, without opening the app. It can also put a button on top of any video.",
    "action": "firefox"
   },
   "pt": {
    "title": "Extensão para o Firefox",
    "text": "Copie o link do vídeo, clique na extensão e ele baixa sozinho, sem abrir o app. Também pode pôr um botão em cima de qualquer vídeo.",
    "action": "firefox"
   }
  },
  "app": {
   "en": [
    "Downloads sent from the browser don't interrupt you: the app opens minimized and doesn't come to the front.",
    "**Choose quality…** in the extension opens the app straight in the quality window.",
    "Shorter **News** window, with just this version."
   ],
   "pt": [
    "Os downloads mandados pelo navegador não atrapalham: o app abre minimizado e não vem para a frente.",
    "**Escolher qualidade…** na extensão abre o app direto na janela de qualidade.",
    "Janela de **Novidades** mais curta, só com esta versão."
   ]
  }
 },
 {
  "version": "0.3.12",
  "en": [
   "**Tasks folder: queue without converting.** A new optional field `\"start\": false` in the job `.json` puts the files in the app's queue with the chosen preset and leaves them waiting for you to click Convert. Nothing renders on its own. The options (`outputFolder`, `keepTree`, `suffix`, `subfolder`, `trim`, `join`, `deleteSource`) are kept in each item, and the items survive closing and opening the app. The job `.json` goes to `queued\\` and `<name>.status.json` stays with `state: \"queued\"`. A preset that doesn't exist sends the job to `failed\\` with `error: \"preset-not-found\"`. Jobs without `\"start\"` work as before. Details in `jobs\\README.txt`.",
   "**Jobs placed while the app is closed** are picked up as soon as it opens, after the window is ready.",
   "**Open files from the command line**: `mec-encoder.exe \"file\" \"folder\"` adds them to the queue with the default preset, without converting. With the app already open, the paths go to the open window and it comes to the front."
  ],
  "pt": [
   "**Pasta de tarefas: enfileirar sem converter.** Um campo novo e opcional, `\"start\": false`, no `.json` do pedido coloca os arquivos na fila do app com a predefinição pedida e deixa parados, esperando você clicar em Converter. Nada renderiza sozinho. As opções (`outputFolder`, `keepTree`, `suffix`, `subfolder`, `trim`, `join`, `deleteSource`) ficam guardadas em cada item, e os itens continuam na fila depois de fechar e abrir o app. O `.json` do pedido vai para `queued\\` e o `<nome>.status.json` fica com `state: \"queued\"`. Predefinição que não existe manda o pedido para `failed\\` com `error: \"preset-not-found\"`. Pedidos sem `\"start\"` funcionam como antes. Detalhes no `jobs\\README.txt`.",
   "**Pedidos colocados com o app fechado** são pegos assim que ele abre, depois que a janela fica pronta.",
   "**Abrir arquivos pela linha de comando**: `mec-encoder.exe \"arquivo\" \"pasta\"` coloca na fila com a predefinição padrão, sem converter. Com o app já aberto, os caminhos vão para a janela aberta e ela vem para a frente."
  ]
 },
 {
  "version": "0.3.11",
  "en": [
   "**Support for new sites in Download.** When a site isn't recognized, Mec Encoder now looks for the video on the page itself. With one video it downloads right away; with several, the list opens so you can choose.",
   "**Link list**: the recent folder shortcuts have an X on hover to remove them from the history (the folder on disk isn't touched)."
  ],
  "pt": [
   "**Suporte a novos sites no Baixar.** Quando o site não é reconhecido, o Mec Encoder agora procura o vídeo na própria página. Com um vídeo, baixa direto; com vários, abre a lista para você escolher.",
   "**Lista de links**: os atalhos de pastas recentes têm um X ao passar o mouse, para tirar do histórico (a pasta no disco não é mexida)."
  ]
 },
 {
  "version": "0.3.10",
  "en": [
   "**Link list: `{link}` and `{user}` fixed.** Reading a link didn't pass the video id, the @ and the date to the list, so `{link}` came out empty and the file was named after the link itself. On X, the @ and the post number now come from the link itself (`x.com/<user>/status/<number>`): `{user}_{link}` gives `@user_2121333733617701141`. Groups already saved are fixed when the list opens.",
   "**Rename with one click**, like in Completed: hover over the name and click. If the video is checked together with others, all checked videos are renamed at once.",
   "The selection bar keeps only \"Select all\" and \"Copy links\".",
   "The `{ }` button on an empty Model field now inserts only the tag you clicked."
  ],
  "pt": [
   "**Lista de links: `{link}` e `{usuario}` corrigidos.** A leitura do link não passava o id do vídeo, o @ e a data para a lista, então o `{link}` saía vazio e o arquivo ficava com o próprio link como nome. No X, o @ e o número do post agora vêm do próprio link (`x.com/<usuario>/status/<número>`): `{usuario}_{link}` vira `@usuario_2121333733617701141`. Os grupos já salvos são corrigidos ao abrir a lista.",
   "**Renomear com um clique**, igual em Concluídos: passe o mouse no nome e clique. Se o vídeo estiver marcado junto com outros, todos os marcados são renomeados de uma vez.",
   "A barra dos selecionados ficou só com \"Selecionar todos\" e \"Copiar links\".",
   "O botão `{ }` com o campo Modelo vazio agora coloca só a etiqueta clicada."
  ]
 },
 {
  "version": "0.3.9",
  "en": [
   "**Name model per group** in the Link list: each group has its own \"Model\" field (for example `{title}_{date}` for Memes and `{user}_{title}_{id}` for Motion). Empty uses the model from Options. The `{ }` button lists the tags, including `{group}`, and the X goes back to the model from Options."
  ],
  "pt": [
   "**Modelo do nome por grupo** na Lista de links: cada grupo tem o próprio campo \"Modelo\" (por exemplo `{titulo}_{data}` para Memes e `{usuario}_{titulo}_{id}` para Motion). Vazio, usa o modelo das Opções. O botão `{ }` mostra as etiquetas, inclusive `{grupo}`, e o X volta para o modelo das Opções."
  ]
 },
 {
  "version": "0.3.8",
  "en": [
   "**Advanced link list** in Download:",
   "**Groups** in tabs (for example Memes and Motion), each with its own folder, subfolder, prefix/suffix (`{group}` becomes the group name) and download options. Groups are kept until you click the X on the tab. \"Download this group\" or \"Download all\".",
   "**Rename like in File Pilot**: select one or several videos (checkbox, click, Ctrl/Shift+click) and press F2 or double-click the name. Each name gets its own cursor, and typing, arrows, Ctrl+arrows (words), Shift (select), Home/End, delete, paste and Ctrl+Z apply to all of them at once.",
   "Copy the link of one video or of all selected ones, a subfolder only for the selected ones, and X removes every selected video (Ctrl+Shift+Z brings them back).",
   "**Duplicate warning**: the same video pasted twice (even as twitter.com and x.com, or with `?s=20`) is marked, with \"Remove duplicates\".",
   "**File name model** (Download → Options): `{user}_{title}_{id}` by default, with `{site}`, `{date}` and `{quality}`. It applies to every download, including Quick download. An empty tag disappears along with its separator."
  ],
  "pt": [
   "**Lista de links avançada** no Baixar:",
   "**Grupos** em abas (por exemplo Memes e Motion), cada um com pasta, subpasta, prefixo/sufixo (`{grupo}` vira o nome do grupo) e as opções de baixar. Os grupos ficam guardados até você clicar no X da aba. \"Baixar este grupo\" ou \"Baixar todos\".",
   "**Renomear como no File Pilot**: selecione um ou vários vídeos (caixinha, clique, Ctrl/Shift+clique) e aperte F2 ou dê clique duplo no nome. Cada nome ganha a sua agulha, e digitar, setas, Ctrl+setas (palavras), Shift (selecionar), Home/End, apagar, colar e Ctrl+Z valem para todos ao mesmo tempo.",
   "Copiar o link de um vídeo ou de todos os selecionados, subpasta só para os selecionados, e o X tira todos os selecionados (Ctrl+Shift+Z traz de volta).",
   "**Aviso de repetidos**: o mesmo vídeo colado duas vezes (mesmo como twitter.com e x.com, ou com `?s=20`) fica marcado, com \"Remover repetidos\".",
   "**Modelo do nome do arquivo** (Baixar → Opções): `{usuario}_{titulo}_{id}` por padrão, com `{site}`, `{data}` e `{qualidade}`. Vale em todo download, inclusive o Baixar rápido. Etiqueta vazia some junto com o separador."
  ]
 },
 {
  "version": "0.3.7",
  "en": [
   "**Fix: \"Delete original\" works again.** Since 0.3.4 the new player kept the video open for the preview, and Windows doesn't move an open file to the Recycle Bin, so the original stayed in place without any warning. Now the preview lets go of the file before deleting, it tries again for a few seconds if another program is holding it, and if it still can't, a message says so (the new file is always saved)."
  ],
  "pt": [
   "**Correção: \"Apagar o original\" voltou a funcionar.** Desde a 0.3.4 o player novo deixava o vídeo aberto para a prévia, e o Windows não manda para a Lixeira um arquivo aberto, então o original ficava no lugar sem nenhum aviso. Agora a prévia solta o arquivo antes de apagar, tenta de novo por alguns segundos se outro programa estiver segurando, e se mesmo assim não der, aparece um aviso (o arquivo novo é sempre salvo)."
  ]
 }
];
