// Gerado por docs/release-notes/make_news.py — não edite à mão.
window.MEC_NEWS = [
 {
  "version": "0.2.8",
  "en": [
   "**Test version**: not offered by the app's automatic update. Download it from this page.",
   "**Cutter**: cutting now has its own page, with a large preview and timeline and the list of cuts. Open it with the **Cut** button under the preview, the scissors on a queued video, right-click › Open the Cutter, or the **C** key. **Done** (Enter/Esc) goes back to the queue; **Cancel** undoes the changes.",
   "**I** = start of the cut, **O** = end of the cut (the playhead frame is included), **S** = new cut at the playhead (inside a cut, it splits it).",
   "The list shows each cut with start and end in timecode (you can type them), duration and ×. Clicking a cut takes the playhead to its start.",
   "**[Separate | Joined]** above the list, and the names of the files that will be saved.",
   "Click the edge of a cut to go to its first or last frame; drag to adjust frame by frame.",
   "**Playhead snaps to frames**, and the timecode counts frames like Premiere.",
   "**New zoom bar** under the timeline with the cuts in miniature: drag the middle to move, drag the ends to zoom.",
   "**Shortcuts** can be changed in Settings › Shortcuts.",
   "**Fixes**: dragging the zoomed preview stopped when the button was released (it kept following the mouse); the middle mouse button also moves the preview and the timeline."
  ],
  "pt": [
   "**Versão de teste**: a atualização automática do app não oferece esta versão. Baixe por esta página.",
   "**Cortador**: cortar agora tem uma página própria, com prévia e linha do tempo grandes e a lista de trechos. Abra pelo botão **Cortar** embaixo da prévia, pela tesoura no vídeo da fila, pelo botão direito › Abrir o Cortador ou pela tecla **C**. **Concluir** (Enter/Esc) volta para a fila; **Cancelar** desfaz o que mudou.",
   "**I** = início do trecho, **O** = fim do trecho (o quadro da agulha entra), **S** = trecho novo na agulha (dentro de um trecho, divide em dois).",
   "A lista mostra cada trecho com início e fim em timecode (dá para digitar), duração e ×. Clicar num trecho leva a agulha ao começo dele.",
   "**[Separados | Juntos]** em cima da lista, e os nomes dos arquivos que vão sair.",
   "Clicar na borda de um trecho leva a agulha ao primeiro ou ao último quadro; arrastar ajusta quadro a quadro.",
   "**Agulha presa nos quadros**, e o timecode conta quadros como o Premiere.",
   "**Barra de zoom nova** embaixo da linha do tempo, com os trechos em miniatura: arraste o meio para andar, as pontas para dar zoom.",
   "**Atalhos** configuráveis em Configurações › Atalhos.",
   "**Correções**: arrastar a prévia com zoom para quando o botão é solto (antes continuava seguindo o mouse); o botão do meio do mouse também arrasta a prévia e a linha do tempo."
  ]
 },
 {
  "version": "0.2.7",
  "en": [
   "**Test version**: not offered by the app's automatic update yet. Download it from this page if you want to try it.",
   "**Several cuts in the same video**: Ctrl+K (or the scissors button) starts a new cut at the playhead (inside a cut, it splits it in two); I and O move the start and end of the selected cut; drag the edges to adjust. Under the preview, the cuts menu chooses **one file per cut** (_01, _02...) or **join the cuts into one file**, and removes cuts. Joined cuts keep PCM audio from cameras like the FX30 and the camera timecode of the first cut.",
   "**Timeline zoom**: mouse wheel over the timeline zooms where the mouse is; Shift+wheel (or the small bar under it) moves sideways; = and - zoom on the playhead; \\ shows everything. Up close each frame shows as a stripe, for frame-exact cuts.",
   "**Preview zoom**: mouse wheel over the video zooms in (sharper preview); drag to move; double-click to go back. In Compare, both sides move together.",
   "**The cut is yellow**: the marked part of the timeline is yellow, exactly what will be rendered. The blue area up to the playhead is gone.",
   "**Studio theme** (Settings › Appearance): graphite, quieter colors, technical numbers in a monospaced font. The other themes did not change.",
   "**Fixes**: image preview and thumbnail (JPG came out empty); a preset's color now changes right away, also while editing the preset.",
   "Command line: `--trim` can be repeated for several cuts, and `--join` joins them. Jobs folder: `\"trim\"` accepts a list of cuts and `\"join\": true`."
  ],
  "pt": [
   "**Versão de teste**: a atualização automática do app ainda não oferece esta versão. Baixe por esta página se quiser testar.",
   "**Vários cortes no mesmo vídeo**: Ctrl+K (ou o botão da tesoura) começa um trecho novo na agulha (dentro de um trecho, divide em dois); I e O mudam o início e o fim do trecho escolhido; arraste as bordas para ajustar. Embaixo da prévia, o menu dos trechos escolhe **um arquivo por trecho** (_01, _02...) ou **juntar os trechos num arquivo**, e tira trechos. Trechos juntos mantêm o áudio PCM de câmeras como a FX30 e o timecode do primeiro trecho.",
   "**Zoom na linha do tempo**: rodinha do mouse em cima da linha do tempo dá zoom onde o mouse está; Shift+rodinha (ou a barrinha embaixo) anda para os lados; = e - dão zoom na agulha; \\ mostra tudo. De perto cada quadro aparece como uma faixa, para cortar no quadro exato.",
   "**Zoom na prévia**: rodinha em cima do vídeo aproxima (a prévia vem mais nítida); arraste para andar; duplo clique volta. No Comparar, os dois lados andam juntos.",
   "**Trecho em amarelo**: a parte marcada da linha do tempo fica amarela, exatamente o que vai ser renderizado. Saiu a faixa azul até a agulha.",
   "**Tema Estúdio** (Configurações › Aparência): grafite, cores mais calmas, números técnicos em fonte mono. Os outros temas não mudaram.",
   "**Correções**: prévia e miniatura de imagem (JPG saía vazio); a cor do preset muda na hora, também editando o preset.",
   "Linha de comando: `--trim` pode repetir para vários trechos, e `--join` junta. Pasta de tarefas: `\"trim\"` aceita uma lista de trechos e `\"join\": true`."
  ]
 },
 {
  "version": "0.2.6",
  "en": [
   "**Watch folders** (Settings): pick a folder and a preset; new files that land there are converted by themselves. It waits for the copy to finish, looks only at the folder itself (not subfolders), and files that were already there are left alone. Files that arrive while the app is closed are converted when it opens. Each folder can be turned on/off.",
   "**Jobs folder (automation)**: with Mec Encoder open, drop a .json with the files and the preset into the jobs folder (Settings › Automation › Open) and it goes into the queue and renders by itself. Progress goes to `<name>.status.json` (state, progress, output and error of each file). Output folder, suffix, subfolder and trim can be set in the job. Format in jobs\\README.txt.",
   "**Command line: mec.exe** (in the app's bin folder): `mec convert <files or folders> --preset RAW`, with `--out`, `--suffix`, `--trim`, `--parallel`, `--dry-run` and `--json` (one line per event). Also `mec presets`, `mec probe` and `mec engine`. Same presets and same engine as the app. Settings › Automation › Copy path.",
   "The render engine now lives in the core, shared by the app and mec.exe."
  ],
  "pt": [
   "**Pastas vigiadas** (Configurações): escolha uma pasta e um preset; arquivo novo que cair lá é convertido sozinho. Espera a cópia terminar, olha só a própria pasta (sem as subpastas) e o que já estava lá fica como está. Arquivos que chegarem com o app fechado são convertidos quando ele abrir. Cada pasta pode ser ligada/desligada.",
   "**Pasta de tarefas (automação)**: com o Mec Encoder aberto, coloque um .json com os arquivos e o preset na pasta de tarefas (Configurações › Automação › Abrir) e ele entra na fila e renderiza sozinho. O andamento vai para `<nome>.status.json` (situação, progresso, saída e erro de cada arquivo). Dá para pedir pasta de saída, sufixo, subpasta e trecho. O formato está em jobs\\README.txt.",
   "**Linha de comando: mec.exe** (na pasta bin do app): `mec convert <arquivos ou pastas> --preset RAW`, com `--out`, `--suffix`, `--trim`, `--parallel`, `--dry-run` e `--json` (uma linha por evento). Também `mec presets`, `mec probe` e `mec engine`. Mesmos presets e mesmo motor do app. Configurações › Automação › Copiar caminho.",
   "O motor de render agora fica no núcleo, o mesmo para o app e o mec.exe."
  ]
 },
 {
  "version": "0.2.5",
  "en": [
   "**Update** no longer opens a black command window while installing. Only the small Windows installer progress bar shows, and the app opens again by itself. (This update itself may still show the window one last time.)"
  ],
  "pt": [
   "**Atualizar** não abre mais uma janela preta de comando durante a instalação. Só aparece a barrinha de progresso do instalador do Windows, e o app abre de novo sozinho. (Esta atualização ainda pode mostrar a janela uma última vez.)"
  ]
 },
 {
  "version": "0.2.4",
  "en": [
   "**Save to**: each preset can save to the original's folder or to a **fixed folder** (e.g. D:\\Renders). With **Keep folders**, files from a dragged folder go into the same subfolders inside it.",
   "**Name tags**: the **{ }** button next to Suffix inserts {date}, {time}, {res}, {fps}, {bits}, {n} (number in queue), {codec} and {preset}. The final file name shows next to \"Output\". Subfolder accepts tags too (e.g. {date} = one folder per day).",
   "**Clear error messages**: a failed video says what happened and what to do (disk full, file open in another program, drive disconnected, damaged file, graphics card busy…). **Try again** and **Copy error details** are on the video and in the right-click menu.",
   "**Queue is saved**: closing the app (or a crash) no longer loses the queue. What was rendering comes back ready, and the half-written file is deleted.",
   "**Trim**: mark **In** and **Out** on the timeline (I and O keys, or the buttons) and only that part is converted. Drag the edges to adjust; Duplicate lets you cut several parts of the same video. The camera timecode follows the start of the part. The original is never deleted when trimming.",
   "**When finished: Nothing · Sleep · Shut down**, next to the totals. You get 60 seconds to cancel, it only happens if the queue finished without errors, and it goes back to \"Nothing\" after use.",
   "**What's new** window after an update (also in the Mec Encoder menu)."
  ],
  "pt": [
   "**Salvar em**: cada preset pode salvar na pasta do original ou numa **pasta fixa** (ex.: D:\\Renders). Com **Manter pastas**, os arquivos de uma pasta arrastada vão para as mesmas subpastas lá dentro.",
   "**Etiquetas no nome**: o botão **{ }** ao lado do Sufixo insere {data}, {hora}, {res}, {fps}, {bits}, {n} (número na fila), {codec} e {preset}. O nome final aparece ao lado de \"Saída\". A Subpasta também aceita etiquetas (ex.: {data} = uma pasta por dia).",
   "**Mensagens de erro claras**: um vídeo que falhou diz o que aconteceu e o que fazer (disco cheio, arquivo aberto em outro programa, disco desconectado, arquivo corrompido, placa de vídeo ocupada…). **Tentar de novo** e **Copiar detalhes do erro** ficam no vídeo e no botão direito.",
   "**Fila salva**: fechar o app (ou ele travar) não perde mais a fila. O que estava renderizando volta como pronto, e o arquivo pela metade é apagado.",
   "**Cortar trecho**: marque **Início** e **Fim** na linha do tempo (teclas I e O, ou os botões) e só esse pedaço é convertido. Arraste as bordas para ajustar; com Duplicar dá para tirar vários trechos do mesmo vídeo. O timecode da câmera acompanha o início do trecho. O original nunca é apagado quando você corta.",
   "**Ao terminar: Nada · Suspender · Desligar**, ao lado dos totais. Você tem 60 segundos para cancelar, só acontece se a fila terminou sem erro, e volta para \"Nada\" depois de usar.",
   "Janela de **Novidades** depois de atualizar (também no menu Mec Encoder)."
  ]
 },
 {
  "version": "0.2.3",
  "en": [
   "**Aspect ratio** (Video and Image): Source · 9:16 · 16:9 · 1:1 · 4:5 · 4:3 · 3:4 · 21:9, with **Fit: Crop** (fills the frame, cuts the edges from the center) or **Bars** (keeps the whole picture, adds black bars). Resolution shows the final size with the ratio applied, and the preview shows the result. Crop/bars run on the CPU (the GPU still decodes and encodes).",
   "Warning when an H.264 output would be larger than 4096 px on a side.",
   "Preset folders: same spacing between all folder rows, including \"Presets\"."
  ],
  "pt": [
   "**Proporção** (Vídeo e Imagem): Original · 9:16 · 16:9 · 1:1 · 4:5 · 4:3 · 3:4 · 21:9, com **Encaixe: Cortar** (preenche o quadro, corta as bordas pelo centro) ou **Barras** (mantém a imagem inteira, com barras pretas). A Resolução mostra o tamanho final já com a proporção, e a prévia mostra o resultado. Cortar/barras roda na CPU (a placa continua lendo e gravando).",
   "Aviso quando um H.264 passaria de 4096 px de lado.",
   "Pastas de presets: o mesmo espaço entre todas as linhas, inclusive \"Presets\"."
  ]
 },
 {
  "version": "0.2.2",
  "en": [
   "**Presets like HandBrake: everything in folders.** \"Presets\" is now the main folder (presets not in any folder), and every folder opens and closes on its own. Right-click a folder: New preset in this folder · Rename · Delete. Manage › Collapse all / Expand all. Deleting a folder never deletes presets.",
   "**Convert images**: PNG, JPG, WebP, BMP, TIFF, GIF and HEIC/AVIF (when FFmpeg can read the file) go into the same queue. New image presets (folder \"Images\"): **JPG 90**, **PNG** and **WebP 85**, with Format, Quality, Lossless (WebP), Resolution (Source · 50% · 25% · Custom) and Rotate. Transparent areas become white in JPG. Existing users get the image presets once.",
   "Small sizes show in KB in the estimated size."
  ],
  "pt": [
   "**Presets como no HandBrake: tudo em pastas.** \"Presets\" agora é a pasta principal (presets que não estão em nenhuma pasta), e cada pasta abre e fecha sozinha. Botão direito numa pasta: Novo preset nesta pasta · Renomear · Excluir. Gerenciar › Recolher todas / Abrir todas. Excluir uma pasta nunca apaga presets.",
   "**Converter imagens**: PNG, JPG, WebP, BMP, TIFF, GIF e HEIC/AVIF (quando o FFmpeg consegue ler o arquivo) entram na mesma fila. Novos presets de imagem (pasta \"Images\"): **JPG 90**, **PNG** e **WebP 85**, com Formato, Qualidade, Sem perda (WebP), Resolução (Original · 50% · 25% · Personalizado) e Girar. No JPG, o que é transparente vira branco. Quem já usa o app recebe os presets de imagem uma vez.",
   "Tamanhos pequenos aparecem em KB no tamanho estimado."
  ]
 },
 {
  "version": "0.2.1",
  "en": [
   "**Bitrate**: Auto now comes with its level right in the menu: Source · Auto · High · Auto · Balanced · Auto · Light · Manual, with an ⓘ explaining each one. The estimated size now follows the level.",
   "**Dropdowns**: clicking the same box again closes the menu.",
   "**Render again**: finished videos have a ↻ button (and right-click › Render again). The previous file is kept; the new one gets \" (2)\".",
   "**Duplicate** a video in the queue (right-click › Duplicate), e.g. to render the same file with different presets and compare times. While another copy is still in the queue, the original is never sent to the Recycle Bin.",
   "**Clear** is always visible: Remove finished · Remove all."
  ],
  "pt": [
   "**Bitrate**: o Auto agora vem com o nível no próprio menu: Original · Auto · Alta · Auto · Equilibrada · Auto · Leve · Manual, com um ⓘ explicando cada um. O tamanho estimado agora acompanha o nível.",
   "**Menus suspensos**: clicar de novo na mesma caixa fecha o menu.",
   "**Renderizar de novo**: vídeos prontos têm um botão ↻ (e botão direito › Renderizar de novo). O arquivo anterior fica; o novo ganha \" (2)\".",
   "**Duplicar** um vídeo na fila (botão direito › Duplicar), por exemplo para renderizar o mesmo arquivo com presets diferentes e comparar os tempos. Enquanto houver outra cópia na fila, o original nunca vai para a Lixeira.",
   "**Limpar** sempre aparece: Tirar os prontos · Tirar todos."
  ]
 }
];
