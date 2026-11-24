// Gerado por docs/release-notes/make_news.py — não edite à mão.
window.MEC_NEWS = [
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
 },
 {
  "version": "0.3.6",
  "en": [
   "**Link list** in Download: paste several links at once and each video shows up with its name, thumbnail, site and length before downloading (a playlist or profile becomes one row per video; links with an error are left out). Choose a folder just for this list, for example Memes, without changing the usual download folder; folders you used before stay as shortcuts. The same options as \"Download…\": Video (max quality, 1080, 720 or 480, web ready), Audio, GIF or Thumbnail, plus subtitles and thumbnail. Each download in the list shows the folder it goes to.",
   "**Fix**: in Convert, the aspect ratio mode showed \"Crop\" instead of its usual name since 0.3.5."
  ],
  "pt": [
   "**Lista de links** no Baixar: cole vários links de uma vez e cada vídeo aparece com nome, miniatura, site e duração antes de baixar (playlist ou perfil vira uma linha por vídeo; link com erro fica de fora). Escolha uma pasta só para essa lista, por exemplo Memes, sem mudar a pasta de sempre do Baixar; as pastas usadas antes ficam como atalho. As mesmas opções do \"Baixar...\": Vídeo (qualidade máxima, 1080, 720 ou 480, pronto para web), Áudio, GIF ou Miniatura, além de legenda e miniatura junto. Cada download da lista mostra a pasta para onde vai.",
   "**Correção**: no Converter, o modo de proporção mostrava \"Crop\" no lugar de \"Cortar\" desde a 0.3.5."
  ]
 },
 {
  "version": "0.3.5",
  "en": [
   "**Crop in the Cutter**, like Premiere's Crop: press **C** (or the Crop button) and drag the box to keep only part of the picture, for example just the video of a meme, without the black bars and the text. 8 handles, drag inside to move, drag outside to draw a new box; ratio Free, Original, 9:16, 16:9, 1:1 or 4:5; or type how many pixels to remove from each side. The video comes out at the crop size, in Export and in Convert, and the preview and play already show the result.",
   "**Export saves right in the Cutter**: it no longer goes through the Convert queue nor shows a preset. The video stays exactly like the original, only without the parts you cut (and cropped, if you cropped). Progress shows in the button itself (click to cancel), and when it finishes you can play it or show it in the folder.",
   "**\"Go to Convert\"** replaces the \"Convert\" button in the Cutter, so it doesn't look like it converts right away.",
   "**Download as GIF**: new GIF button next to Audio (and a GIF option in \"Download…\", with a part of the video if you want). It downloads only the picture and delivers a .gif with the settings of the GIF preset from Convert. The \"GIF\" on X, which is actually a video, now comes as a real GIF. Videos you already downloaded have a GIF button in their row."
  ],
  "pt": [
   "**Crop no Cortador**, como o Corte do Premiere: aperte **C** (ou o botão Crop) e arraste o retângulo para ficar só com uma parte da imagem, por exemplo só o vídeo de um meme, sem as bordas pretas e o texto. 8 alças, arrastar dentro move, arrastar fora desenha um novo; proporção Livre, Original, 9:16, 16:9, 1:1 ou 4:5; ou digite quantos pixels tirar de cada lado. O vídeo sai no tamanho do recorte, no Exportar e no Converter, e a prévia e o play já mostram o resultado.",
   "**Exportar salva ali mesmo no Cortador**: não passa mais pela fila do Converter nem mostra preset. O vídeo fica exatamente como o original, só sem os trechos que você cortou (e recortado, se usou o crop). O andamento aparece no próprio botão (clique para cancelar) e no fim dá para tocar ou mostrar na pasta.",
   "**\"Ir para o Conversor\"** no lugar do botão \"Converter\" do Cortador, para não parecer que converte na hora.",
   "**Baixar como GIF**: botão GIF novo ao lado de Áudio (e opção GIF em \"Baixar...\", com trecho se quiser). Baixa só a imagem e entrega um .gif com o ajuste do preset GIF do Converter. O \"GIF\" do X, que na verdade é vídeo, agora vem como GIF de verdade. Os vídeos já baixados têm um botão GIF na linha."
  ]
 }
];
