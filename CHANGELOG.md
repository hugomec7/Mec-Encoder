# Changelog · Novidades

## 0.2.11

**English**
- **Everything from the test versions 0.2.7 to 0.2.10** comes in this update: several cuts per video, the Cutter, timeline zoom, play with sound (plays the result, skipping the cuts), timecode ruler, magnet and configurable shortcuts. See them in What's new.
- **Skip cuts** has its own icon (a jump between two pieces) instead of scissors, turns blue when on and shows two texts: **Skipping cuts** (plays the result) and **Whole video** (plays the original). In the Cutter it is the same size as **New cut**.
- **Quieter play button**: a rounded square with a soft background, like the other controls, instead of the white circle. Simpler play and pause icons.
- **Even spacing** in the Cutter: In, ‹, ⏮, ▶, ⏭, › and Out are the same distance apart, away from the timecode.

**Português**
- **Tudo das versões de teste 0.2.7 a 0.2.10** vem nesta atualização: vários cortes por vídeo, o Cortador, zoom na linha do tempo, play com som (toca o resultado, pulando os cortes), régua de timecode, ímã e atalhos configuráveis. Veja em Novidades.
- **Pular cortes** ganhou ícone próprio (um salto entre dois pedaços) no lugar da tesoura, fica azul quando ligado e mostra dois textos: **Pulando cortes** (toca o resultado) e **Vídeo inteiro** (toca o original). No Cortador tem o mesmo tamanho do **Novo corte**.
- **Play mais discreto**: quadrado arredondado com fundo suave, como os outros controles, no lugar do círculo branco. Ícones de play e pause mais simples.
- **Espaçamento igual** no Cortador: Início, ‹, ⏮, ▶, ⏭, › e Fim com a mesma distância entre si, afastados do timecode.

## 0.2.10 (pré-lançamento)

**English**
- **Test version**: not offered by the app's automatic update. Download it from this page.
- **Play shows the result**: with cuts marked, play starts at the playhead and skips what was cut. Put the playhead near the end of a cut and press play to see how it joins the next one. The time on top of the preview shows where you are in the final file. The **Skip cuts** button (or **Shift+Space**) switches between playing with the cuts and playing the original; while playing, it continues from the same point.
- **⏮ ⏭ go from cut to cut** (start and last frame of each cut; without cuts, the beginning and the end). Shortcuts **↑ ↓**. They replace the 5-second buttons (Shift+← → still jump 5 seconds).
- **Volume slider** next to the speaker (click the speaker to mute).
- The **▶ Cuts** button was removed: the normal play does that now.
- The **In** and **Out** buttons show only their icons again.
- **Fix**: removing a cut with × now updates the list right away (before, it only disappeared from the timeline).

**Português**
- **Versão de teste**: a atualização automática do app não oferece esta versão. Baixe por esta página.
- **O play mostra o resultado**: com cortes marcados, o play começa na agulha e pula o que foi cortado. Ponha a agulha perto do fim de um corte e aperte play para ver como ele emenda no próximo. O tempo em cima da prévia mostra onde você está no arquivo final. O botão **Pular cortes** (ou **Shift+Espaço**) alterna entre tocar com os cortes e tocar o original; tocando, continua do mesmo ponto.
- **⏮ ⏭ vão de corte em corte** (início e último quadro de cada corte; sem cortes, o começo e o fim). Atalhos **↑ ↓**. Eles substituem os botões de 5 segundos (Shift+← → continuam pulando 5 segundos).
- **Controle de volume** deslizante ao lado do alto-falante (clicar no alto-falante tira o som).
- O botão **▶ Trechos** saiu: o play normal já faz isso.
- Os botões de **Início** e **Fim** voltaram a ser só o ícone.
- No app em português, **trecho** virou **corte**: "Novo corte", a lista de "Cortes" etc.
- **Correção**: tirar um corte pelo × atualiza a lista na hora (antes só sumia da linha do tempo).

## 0.2.9 (pré-lançamento)

**English**
- **Test version**: not offered by the app's automatic update. Download it from this page.
- **Play button** in the converter and in the Cutter, with sound. **Space** plays and pauses; **J K L** like Premiere (L again: 2×, 4×; K pauses; J goes back 1 second). Pausing snaps the playhead to the frame and shows the exact image of the original.
  - Phone videos play right away. Files the player can't open (Sony FX30 10-bit 4:2:2, HDR, ProRes…) are converted while they play, on the graphics card (NVIDIA, AMD or Intel) or on the CPU, starting in about a second.
  - **Auto** quality starts at 720p and lowers itself if the PC can't keep up. If not even 360p keeps up, a light preview is prepared once and plays right away the next time.
- **Play one cut**: hover over the cut number (1, 2, 3…) in the Cutter list and click ▶. It plays from the first to the last frame of the cut and stops there, with the time played and the cut's duration on top of the preview.
- **▶ Cuts** (**Shift+Space**) plays only the cuts, one after the other, like the joined file.
- **Repeat**, **speed** (0.25× to 4×), **volume** and an **audio meter** next to the timecode.
- **Timecode ruler** above the timeline: the numbers follow the zoom (minutes, seconds, frames). Click or drag on it to move the playhead.
- **Magnet**: dragging the playhead near the start or the end of a cut snaps it to the first or last frame. Hold **Alt** to drag without the magnet.
- New shortcuts (all can be changed in Settings › Shortcuts): **Shift+I / Shift+O** go to the start or the last frame of the cut, **Home / End** go to the beginning or the end, **Ctrl+L** turns Repeat on and off.
- Settings › **Playback**: preview quality, space for saved previews and **Delete** previews.

**Português**
- **Versão de teste**: a atualização automática do app não oferece esta versão. Baixe por esta página.
- **Botão de play** no conversor e no Cortador, com som. **Espaço** toca e pausa; **J K L** como no Premiere (L de novo: 2×, 4×; K pausa; J volta 1 segundo). Ao pausar, a agulha prende no quadro e volta a imagem exata do original.
  - Vídeos de celular tocam na hora. Arquivos que o player não abre (Sony FX30 10-bit 4:2:2, HDR, ProRes…) são convertidos enquanto tocam, na placa de vídeo (NVIDIA, AMD ou Intel) ou na CPU, começando em cerca de 1 segundo.
  - A qualidade **Auto** começa em 720p e baixa sozinha se o PC não acompanhar. Se nem 360p acompanhar, uma prévia leve é preparada uma vez e da próxima vez toca na hora.
- **Tocar um trecho**: passe o mouse no número do trecho (1, 2, 3…) na lista do Cortador e clique no ▶. Ele toca do primeiro ao último quadro do trecho e para ali, com o tempo tocado e a duração do trecho em cima da prévia.
- **▶ Trechos** (**Shift+Espaço**) toca só os trechos, um atrás do outro, como o arquivo juntado.
- **Repetir**, **velocidade** (0,25× a 4×), **volume** e **medidor de áudio** ao lado do timecode.
- **Régua de timecode** em cima da linha do tempo: os números acompanham o zoom (minutos, segundos, quadros). Clique ou arraste nela para mover a agulha.
- **Ímã**: arrastando a agulha perto do início ou do fim de um trecho, ela gruda no primeiro ou no último quadro. Segure **Alt** para arrastar sem ímã.
- Atalhos novos (todos dá para trocar em Configurações › Atalhos): **Shift+I / Shift+O** vão ao início ou ao último quadro do trecho, **Home / End** vão ao começo ou ao fim, **Ctrl+L** liga e desliga o Repetir.
- Configurações › **Reprodução**: qualidade da prévia, espaço para as prévias guardadas e **Apagar** prévias.

## 0.2.8 (pré-lançamento)

**English**
- **Test version**: not offered by the app's automatic update. Download it from this page.
- **Cutter**: cutting now has its own page, with a large preview and timeline and the list of cuts. Open it with the **Cut** button under the preview, the scissors on a queued video, right-click › Open the Cutter, or the **C** key. **Done** (Enter/Esc) goes back to the queue; **Cancel** undoes the changes.
  - **I** = start of the cut, **O** = end of the cut (the playhead frame is included), **S** = new cut at the playhead (inside a cut, it splits it).
  - The list shows each cut with start and end in timecode (you can type them), duration and ×. Clicking a cut takes the playhead to its start.
  - **[Separate | Joined]** above the list, and the names of the files that will be saved.
  - Click the edge of a cut to go to its first or last frame; drag to adjust frame by frame.
- **Playhead snaps to frames**, and the timecode counts frames like Premiere.
- **New zoom bar** under the timeline with the cuts in miniature: drag the middle to move, drag the ends to zoom.
- **Shortcuts** can be changed in Settings › Shortcuts.
- **Fixes**: dragging the zoomed preview stopped when the button was released (it kept following the mouse); the middle mouse button also moves the preview and the timeline.

**Português**
- **Versão de teste**: a atualização automática do app não oferece esta versão. Baixe por esta página.
- **Cortador**: cortar agora tem uma página própria, com prévia e linha do tempo grandes e a lista de trechos. Abra pelo botão **Cortar** embaixo da prévia, pela tesoura no vídeo da fila, pelo botão direito › Abrir o Cortador ou pela tecla **C**. **Concluir** (Enter/Esc) volta para a fila; **Cancelar** desfaz o que mudou.
  - **I** = início do trecho, **O** = fim do trecho (o quadro da agulha entra), **S** = trecho novo na agulha (dentro de um trecho, divide em dois).
  - A lista mostra cada trecho com início e fim em timecode (dá para digitar), duração e ×. Clicar num trecho leva a agulha ao começo dele.
  - **[Separados | Juntos]** em cima da lista, e os nomes dos arquivos que vão sair.
  - Clicar na borda de um trecho leva a agulha ao primeiro ou ao último quadro; arrastar ajusta quadro a quadro.
- **Agulha presa nos quadros**, e o timecode conta quadros como o Premiere.
- **Barra de zoom nova** embaixo da linha do tempo, com os trechos em miniatura: arraste o meio para andar, as pontas para dar zoom.
- **Atalhos** configuráveis em Configurações › Atalhos.
- **Correções**: arrastar a prévia com zoom para quando o botão é solto (antes continuava seguindo o mouse); o botão do meio do mouse também arrasta a prévia e a linha do tempo.

## 0.2.7 (pré-lançamento)

**English**
- **Test version**: not offered by the app's automatic update yet. Download it from this page if you want to try it.
- **Several cuts in the same video**: Ctrl+K (or the scissors button) starts a new cut at the playhead (inside a cut, it splits it in two); I and O move the start and end of the selected cut; drag the edges to adjust. Under the preview, the cuts menu chooses **one file per cut** (_01, _02...) or **join the cuts into one file**, and removes cuts. Joined cuts keep PCM audio from cameras like the FX30 and the camera timecode of the first cut.
- **Timeline zoom**: mouse wheel over the timeline zooms where the mouse is; Shift+wheel (or the small bar under it) moves sideways; = and - zoom on the playhead; \ shows everything. Up close each frame shows as a stripe, for frame-exact cuts.
- **Preview zoom**: mouse wheel over the video zooms in (sharper preview); drag to move; double-click to go back. In Compare, both sides move together.
- **The cut is yellow**: the marked part of the timeline is yellow, exactly what will be rendered. The blue area up to the playhead is gone.
- **Studio theme** (Settings › Appearance): graphite, quieter colors, technical numbers in a monospaced font. The other themes did not change.
- **Fixes**: image preview and thumbnail (JPG came out empty); a preset's color now changes right away, also while editing the preset.
- Command line: `--trim` can be repeated for several cuts, and `--join` joins them. Jobs folder: `"trim"` accepts a list of cuts and `"join": true`.

**Português**
- **Versão de teste**: a atualização automática do app ainda não oferece esta versão. Baixe por esta página se quiser testar.
- **Vários cortes no mesmo vídeo**: Ctrl+K (ou o botão da tesoura) começa um trecho novo na agulha (dentro de um trecho, divide em dois); I e O mudam o início e o fim do trecho escolhido; arraste as bordas para ajustar. Embaixo da prévia, o menu dos trechos escolhe **um arquivo por trecho** (_01, _02...) ou **juntar os trechos num arquivo**, e tira trechos. Trechos juntos mantêm o áudio PCM de câmeras como a FX30 e o timecode do primeiro trecho.
- **Zoom na linha do tempo**: rodinha do mouse em cima da linha do tempo dá zoom onde o mouse está; Shift+rodinha (ou a barrinha embaixo) anda para os lados; = e - dão zoom na agulha; \ mostra tudo. De perto cada quadro aparece como uma faixa, para cortar no quadro exato.
- **Zoom na prévia**: rodinha em cima do vídeo aproxima (a prévia vem mais nítida); arraste para andar; duplo clique volta. No Comparar, os dois lados andam juntos.
- **Trecho em amarelo**: a parte marcada da linha do tempo fica amarela, exatamente o que vai ser renderizado. Saiu a faixa azul até a agulha.
- **Tema Estúdio** (Configurações › Aparência): grafite, cores mais calmas, números técnicos em fonte mono. Os outros temas não mudaram.
- **Correções**: prévia e miniatura de imagem (JPG saía vazio); a cor do preset muda na hora, também editando o preset.
- Linha de comando: `--trim` pode repetir para vários trechos, e `--join` junta. Pasta de tarefas: `"trim"` aceita uma lista de trechos e `"join": true`.

## 0.2.6

**English**
- **Watch folders** (Settings): pick a folder and a preset; new files that land there are converted by themselves. It waits for the copy to finish, looks only at the folder itself (not subfolders), and files that were already there are left alone. Files that arrive while the app is closed are converted when it opens. Each folder can be turned on/off.
- **Jobs folder (automation)**: with Mec Encoder open, drop a .json with the files and the preset into the jobs folder (Settings › Automation › Open) and it goes into the queue and renders by itself. Progress goes to `<name>.status.json` (state, progress, output and error of each file). Output folder, suffix, subfolder and trim can be set in the job. Format in jobs\README.txt.
- **Command line: mec.exe** (in the app's bin folder): `mec convert <files or folders> --preset RAW`, with `--out`, `--suffix`, `--trim`, `--parallel`, `--dry-run` and `--json` (one line per event). Also `mec presets`, `mec probe` and `mec engine`. Same presets and same engine as the app. Settings › Automation › Copy path.
- The render engine now lives in the core, shared by the app and mec.exe.

**Português**
- **Pastas vigiadas** (Configurações): escolha uma pasta e um preset; arquivo novo que cair lá é convertido sozinho. Espera a cópia terminar, olha só a própria pasta (sem as subpastas) e o que já estava lá fica como está. Arquivos que chegarem com o app fechado são convertidos quando ele abrir. Cada pasta pode ser ligada/desligada.
- **Pasta de tarefas (automação)**: com o Mec Encoder aberto, coloque um .json com os arquivos e o preset na pasta de tarefas (Configurações › Automação › Abrir) e ele entra na fila e renderiza sozinho. O andamento vai para `<nome>.status.json` (situação, progresso, saída e erro de cada arquivo). Dá para pedir pasta de saída, sufixo, subpasta e trecho. O formato está em jobs\README.txt.
- **Linha de comando: mec.exe** (na pasta bin do app): `mec convert <arquivos ou pastas> --preset RAW`, com `--out`, `--suffix`, `--trim`, `--parallel`, `--dry-run` e `--json` (uma linha por evento). Também `mec presets`, `mec probe` e `mec engine`. Mesmos presets e mesmo motor do app. Configurações › Automação › Copiar caminho.
- O motor de render agora fica no núcleo, o mesmo para o app e o mec.exe.

## 0.2.5

**English**
- **Update** no longer opens a black command window while installing. Only the small Windows installer progress bar shows, and the app opens again by itself. (This update itself may still show the window one last time.)

**Português**
- **Atualizar** não abre mais uma janela preta de comando durante a instalação. Só aparece a barrinha de progresso do instalador do Windows, e o app abre de novo sozinho. (Esta atualização ainda pode mostrar a janela uma última vez.)

## 0.2.4

**English**
- **Save to**: each preset can save to the original's folder or to a **fixed folder** (e.g. D:\Renders). With **Keep folders**, files from a dragged folder go into the same subfolders inside it.
- **Name tags**: the **{ }** button next to Suffix inserts {date}, {time}, {res}, {fps}, {bits}, {n} (number in queue), {codec} and {preset}. The final file name shows next to "Output". Subfolder accepts tags too (e.g. {date} = one folder per day).
- **Clear error messages**: a failed video says what happened and what to do (disk full, file open in another program, drive disconnected, damaged file, graphics card busy…). **Try again** and **Copy error details** are on the video and in the right-click menu.
- **Queue is saved**: closing the app (or a crash) no longer loses the queue. What was rendering comes back ready, and the half-written file is deleted.
- **Trim**: mark **In** and **Out** on the timeline (I and O keys, or the buttons) and only that part is converted. Drag the edges to adjust; Duplicate lets you cut several parts of the same video. The camera timecode follows the start of the part. The original is never deleted when trimming.
- **When finished: Nothing · Sleep · Shut down**, next to the totals. You get 60 seconds to cancel, it only happens if the queue finished without errors, and it goes back to "Nothing" after use.
- **What's new** window after an update (also in the Mec Encoder menu).

**Português**
- **Salvar em**: cada preset pode salvar na pasta do original ou numa **pasta fixa** (ex.: D:\Renders). Com **Manter pastas**, os arquivos de uma pasta arrastada vão para as mesmas subpastas lá dentro.
- **Etiquetas no nome**: o botão **{ }** ao lado do Sufixo insere {data}, {hora}, {res}, {fps}, {bits}, {n} (número na fila), {codec} e {preset}. O nome final aparece ao lado de "Saída". A Subpasta também aceita etiquetas (ex.: {data} = uma pasta por dia).
- **Mensagens de erro claras**: um vídeo que falhou diz o que aconteceu e o que fazer (disco cheio, arquivo aberto em outro programa, disco desconectado, arquivo corrompido, placa de vídeo ocupada…). **Tentar de novo** e **Copiar detalhes do erro** ficam no vídeo e no botão direito.
- **Fila salva**: fechar o app (ou ele travar) não perde mais a fila. O que estava renderizando volta como pronto, e o arquivo pela metade é apagado.
- **Cortar trecho**: marque **Início** e **Fim** na linha do tempo (teclas I e O, ou os botões) e só esse pedaço é convertido. Arraste as bordas para ajustar; com Duplicar dá para tirar vários trechos do mesmo vídeo. O timecode da câmera acompanha o início do trecho. O original nunca é apagado quando você corta.
- **Ao terminar: Nada · Suspender · Desligar**, ao lado dos totais. Você tem 60 segundos para cancelar, só acontece se a fila terminou sem erro, e volta para "Nada" depois de usar.
- Janela de **Novidades** depois de atualizar (também no menu Mec Encoder).

## 0.2.3

**English**
- **Aspect ratio** (Video and Image): Source · 9:16 · 16:9 · 1:1 · 4:5 · 4:3 · 3:4 · 21:9, with **Fit: Crop** (fills the frame, cuts the edges from the center) or **Bars** (keeps the whole picture, adds black bars). Resolution shows the final size with the ratio applied, and the preview shows the result. Crop/bars run on the CPU (the GPU still decodes and encodes).
- Warning when an H.264 output would be larger than 4096 px on a side.
- Preset folders: same spacing between all folder rows, including "Presets".

**Português**
- **Proporção** (Vídeo e Imagem): Original · 9:16 · 16:9 · 1:1 · 4:5 · 4:3 · 3:4 · 21:9, com **Encaixe: Cortar** (preenche o quadro, corta as bordas pelo centro) ou **Barras** (mantém a imagem inteira, com barras pretas). A Resolução mostra o tamanho final já com a proporção, e a prévia mostra o resultado. Cortar/barras roda na CPU (a placa continua lendo e gravando).
- Aviso quando um H.264 passaria de 4096 px de lado.
- Pastas de presets: o mesmo espaço entre todas as linhas, inclusive "Presets".

## 0.2.2

**English**
- **Presets like HandBrake: everything in folders.** "Presets" is now the main folder (presets not in any folder), and every folder opens and closes on its own. Right-click a folder: New preset in this folder · Rename · Delete. Manage › Collapse all / Expand all. Deleting a folder never deletes presets.
- **Convert images**: PNG, JPG, WebP, BMP, TIFF, GIF and HEIC/AVIF (when FFmpeg can read the file) go into the same queue. New image presets (folder "Images"): **JPG 90**, **PNG** and **WebP 85**, with Format, Quality, Lossless (WebP), Resolution (Source · 50% · 25% · Custom) and Rotate. Transparent areas become white in JPG. Existing users get the image presets once.
- Small sizes show in KB in the estimated size.

**Português**
- **Presets como no HandBrake: tudo em pastas.** "Presets" agora é a pasta principal (presets que não estão em nenhuma pasta), e cada pasta abre e fecha sozinha. Botão direito numa pasta: Novo preset nesta pasta · Renomear · Excluir. Gerenciar › Recolher todas / Abrir todas. Excluir uma pasta nunca apaga presets.
- **Converter imagens**: PNG, JPG, WebP, BMP, TIFF, GIF e HEIC/AVIF (quando o FFmpeg consegue ler o arquivo) entram na mesma fila. Novos presets de imagem (pasta "Images"): **JPG 90**, **PNG** e **WebP 85**, com Formato, Qualidade, Sem perda (WebP), Resolução (Original · 50% · 25% · Personalizado) e Girar. No JPG, o que é transparente vira branco. Quem já usa o app recebe os presets de imagem uma vez.
- Tamanhos pequenos aparecem em KB no tamanho estimado.

## 0.2.1

**English**
- **Bitrate**: Auto now comes with its level right in the menu: Source · Auto · High · Auto · Balanced · Auto · Light · Manual, with an ⓘ explaining each one. The estimated size now follows the level.
- **Dropdowns**: clicking the same box again closes the menu.
- **Render again**: finished videos have a ↻ button (and right-click › Render again). The previous file is kept; the new one gets " (2)".
- **Duplicate** a video in the queue (right-click › Duplicate), e.g. to render the same file with different presets and compare times. While another copy is still in the queue, the original is never sent to the Recycle Bin.
- **Clear** is always visible: Remove finished · Remove all.

**Português**
- **Bitrate**: o Auto agora vem com o nível no próprio menu: Original · Auto · Alta · Auto · Equilibrada · Auto · Leve · Manual, com um ⓘ explicando cada um. O tamanho estimado agora acompanha o nível.
- **Menus suspensos**: clicar de novo na mesma caixa fecha o menu.
- **Renderizar de novo**: vídeos prontos têm um botão ↻ (e botão direito › Renderizar de novo). O arquivo anterior fica; o novo ganha " (2)".
- **Duplicar** um vídeo na fila (botão direito › Duplicar), por exemplo para renderizar o mesmo arquivo com presets diferentes e comparar os tempos. Enquanto houver outra cópia na fila, o original nunca vai para a Lixeira.
- **Limpar** sempre aparece: Tirar os prontos · Tirar todos.

## 0.2.0

**English**
- **Convert audio**: audio files (MP3, WAV, M4A, AAC, FLAC, OGG, AIFF…) now go into the same queue. New audio presets: **WAV** (24-bit), **MP3 320**, **AAC 256 (.m4a)** and **FLAC**, with Quality, Bits, Sample rate and Channels (all with Source). Pick an audio preset for a video to **extract its audio**. Existing users get the audio presets once; your own presets are not changed.
- **HDR → Rec. 709 is now Automatic / Off**: Automatic converts only when the video is HDR, so one preset works for SDR and HDR footage.
- **Auto bitrate level**: High · Balanced · Light (Light makes much smaller backups).
- **Protected presets**: if the presets file can't be fully read, the app keeps a copy (presets.broken-….json) and tells you, instead of silently going back to defaults. One broken preset no longer affects the others.
- **New defaults for new users** (only on first run): RAW, Backup, Proxy, Meta Glass and the audio presets. All video defaults use H.265 4:2:0 with Source bit depth, so they run on the GPU on any RTX 20/30/40/50, and Delete original starts off. On an RTX 50, a "Like the camera" (4:2:2) preset is added too.
- The CPU warning now says exactly why (4:2:2 or 10-bit H.264) and what to change to use the GPU. The line under the preview always shows the chroma (4:2:0 or 4:2:2).

**Português**
- **Converter áudio**: arquivos de áudio (MP3, WAV, M4A, AAC, FLAC, OGG, AIFF…) agora entram na mesma fila. Novos presets de áudio: **WAV** (24-bit), **MP3 320**, **AAC 256 (.m4a)** e **FLAC**, com Qualidade, Bits, Taxa e Canais (todos com Original). Escolha um preset de áudio para um vídeo para **extrair o áudio** dele. Quem já usa o app recebe os presets de áudio uma vez; os seus presets não mudam.
- **HDR → Rec. 709 agora é Automático / Desligado**: o Automático converte só quando o vídeo é HDR, então um preset só serve para vídeo normal e HDR.
- **Nível do bitrate Auto**: Alta · Equilibrada · Leve (o Leve deixa backups bem menores).
- **Presets protegidos**: se o arquivo de presets não puder ser lido por inteiro, o app guarda uma cópia (presets.broken-….json) e avisa, em vez de voltar aos padrões sem dizer nada. Um preset com problema não afeta mais os outros.
- **Padrões novos para quem baixar** (só na primeira vez): RAW, Backup, Proxy, Meta Glass e os presets de áudio. Todos os de vídeo usam H.265 4:2:0 com profundidade Original, então rodam pela placa em qualquer RTX 20/30/40/50, e o Apagar o original vem desligado. Numa RTX 50 entra também um preset "Igual à câmera" (4:2:2).
- O aviso de CPU agora diz o motivo certo (4:2:2 ou H.264 10-bit) e o que mudar para usar a placa. A linha embaixo da prévia sempre mostra o croma (4:2:0 ou 4:2:2).

## 0.1.8

**English**
- **"Like the camera" (e.g. Sony FX30 XAVC S)**: Codec, Chroma, Bit depth, FPS and Format now have **Source**. With all of them on Source, an FX30 file comes out H.264 4:2:2 10-bit, upright, in .mp4.
- New **Chroma** option: Source · 4:2:0 · 4:2:2. H.264 can now be 10-bit.
- On RTX 20/30/40 cards, 4:2:2 and 10-bit H.264 are encoded on the CPU (x264/x265), because their NVENC can't encode them. The app shows an orange warning. RTX 50 encodes them on the GPU.
- New **Format** option (Output panel): Source · MP4 · MOV. Source keeps the file's extension (.MP4 stays .mp4, iPhone .MOV stays .mov).
- **Copied PCM audio in .mp4** is now written like Sony does ("twos"), bit-identical to the original.
- **Camera timecode** is kept (e.g. FX30 07:51:07:46), so clips sync in Premiere.
- **AAC audio**: new **Quality** (Source · 128–320 kb/s) and **Sample rate** (Source · 44.1 · 48 kHz). Source uses the original audio's kb/s and rate. **Copy** is still the exact copy.

**Português**
- **"Igual à câmera" (ex.: Sony FX30 XAVC S)**: Codec, Croma, Profundidade, FPS e Formato agora têm **Original**. Com tudo em Original, um arquivo da FX30 sai H.264 4:2:2 10-bit, em pé, em .mp4.
- Nova opção **Croma**: Original · 4:2:0 · 4:2:2. O H.264 agora também pode ser 10-bit.
- Nas RTX 20/30/40, 4:2:2 e H.264 10-bit são gravados pela CPU (x264/x265), porque a NVENC delas não grava esses formatos. O app avisa em laranja. As RTX 50 gravam pela placa.
- Nova opção **Formato** (painel Saída): Original · MP4 · MOV. Original mantém a extensão do arquivo (.MP4 continua .mp4, .MOV do iPhone continua .mov).
- **Áudio PCM copiado em .mp4** agora é gravado do jeito da Sony ("twos"), idêntico bit a bit ao original.
- O **timecode da câmera** é mantido (ex.: FX30 07:51:07:46), para sincronizar no Premiere.
- **Áudio AAC**: nova **Qualidade** (Original · 128–320 kb/s) e **Taxa** (Original · 44,1 · 48 kHz). Original usa os kb/s e a taxa do áudio original. **Copiar** continua sendo a cópia exata.

## 0.1.7

**English**
- **FPS** now always has **Source**. With CFR it locks to the file's own frame rate (iPhone recorded at 60 → 60 constant; FX30 → 59.94). Picking a number while on VFR switches to CFR. The value that will come out shows under "FPS".
- **Bit depth** has **Source**: 8-bit stays 8-bit, 10-bit stays 10-bit (shown under "Bit depth").
- **HDR → Rec. 709**: the description moved to an ⓘ icon (hover to read). The "same bitrate as the source" note is gone.

**Português**
- **FPS** agora sempre tem **Original**. Com CFR, fixa no fps do próprio arquivo (iPhone gravado a 60 → 60 constante; FX30 → 59,94). Escolher um número com VFR ligado passa para CFR. O valor que vai sair aparece embaixo de "FPS".
- **Profundidade** tem **Original**: 8-bit continua 8-bit, 10-bit continua 10-bit (aparece embaixo de "Profundidade").
- **HDR → Rec. 709**: a descrição foi para o ícone ⓘ (passe o mouse). O aviso de "mesmo bitrate do original" saiu.

## 0.1.6

**English**
- **NVIDIA RTX 50 (Blackwell) reads 4:2:2 on the GPU**: Sony FX30/FX3 and other H.264/HEVC 4:2:2 files are decoded on the GPU and converted to 4:2:0 there. RTX 20/30/40 cards can't read 4:2:2, so those files keep rendering through the CPU (same result, just slower). If the GPU path fails on any file, the app falls back automatically.

**Português**
- **NVIDIA RTX 50 (Blackwell) lê 4:2:2 pela placa**: arquivos H.264/HEVC 4:2:2 da Sony FX30/FX3 e outros são lidos pela GPU e convertidos para 4:2:0 nela mesma. As RTX 20/30/40 não leem 4:2:2, então esses arquivos continuam renderizando pela CPU (mesmo resultado, só mais lento). Se o caminho pela placa falhar em algum arquivo, o app tenta outro jeito sozinho.

## 0.1.5

**English**
- **Render times**: each video shows elapsed time and time left while rendering, and how long it took when done (e.g. ✓ Done · 1:02). Below the queue: elapsed and time left for the whole queue, then “Last render: 2:04 · 3 videos”. The finish notice also says how long the queue took.
- **Faster with Sony FX30 (H.264 4:2:2 10-bit) and other files the GPU can't read**: they go straight to the CPU, and every pixel format conversion now uses all CPU threads (before, FFmpeg's automatic conversion used a single thread). Conversion to 4:2:0 happens before rotating, so rotating costs less.
- Editing a preset no longer repeats its name and color in the panel (they're in the presets at the top). Rename now happens right on the preset (right-click › Rename). Modified / Discard / Save changes only appear when something changed.

**Português**
- **Tempo de render**: cada vídeo mostra o tempo decorrido e quanto falta enquanto renderiza, e quanto levou quando termina (ex.: ✓ Pronto · 1:02). Embaixo da fila: tempo decorrido e quanto falta para a fila inteira e, depois, “Último render: 2:04 · 3 vídeos”. O aviso de fim também diz quanto a fila levou.
- **Mais rápido com Sony FX30 (H.264 4:2:2 10-bit) e outros arquivos que a placa não lê**: vão direto para a CPU, e toda conversão de formato agora usa todas as threads (antes a conversão automática do FFmpeg usava uma só). A passagem para 4:2:0 acontece antes de girar, então girar custa menos.
- Ao editar um preset, o nome e a cor não aparecem mais repetidos no painel (estão nos presets lá em cima). Renomear agora é direto no preset (botão direito › Renomear). Modificado / Descartar / Salvar alterações só aparecem quando algo mudou.

## 0.1.4

**English**
- **Faster renders**: the GPU now decodes the video (NVDEC) and does the scaling and 10→8-bit conversion (scale_cuda). Only rotation and HDR → Rec. 709 still run on the CPU; proxies are scaled before rotating, so the CPU only rotates a small frame. If GPU decoding fails on a file, the app falls back automatically.
- **Videos at the same time** (Settings › Performance): render 1, 2 or 3 videos at once. Default: 2.
- The queue shows the **speed** while rendering (e.g. 55% · 2.4×).
- **Render log** (Settings › Performance › Open): command, mode (GPU/CPU), speed and errors of each render.
- **Select several videos**: Ctrl+click, Shift+click or Ctrl+A. Any change in the panel (including Delete original) applies to all selected videos. Right-click: render, preset or remove the selection; dragging a preset onto a selected video applies it to all of them.

**Português**
- **Renders mais rápidos**: a placa agora lê o vídeo (NVDEC) e faz a redução e a conversão de 10 para 8-bit (scale_cuda). Só girar e HDR → Rec. 709 continuam na CPU; o proxy é reduzido antes de girar, então a CPU só gira um quadro pequeno. Se a leitura pela placa falhar num arquivo, o app tenta outro jeito sozinho.
- **Vídeos ao mesmo tempo** (Configurações › Desempenho): renderiza 1, 2 ou 3 vídeos juntos. Padrão: 2.
- A fila mostra a **velocidade** enquanto renderiza (ex.: 55% · 2,4×).
- **Registro de renders** (Configurações › Desempenho › Abrir): comando, modo (GPU/CPU), velocidade e erros de cada render.
- **Selecionar vários vídeos**: Ctrl+clique, Shift+clique ou Ctrl+A. Qualquer ajuste no painel (inclusive Apagar o original) vale para todos os selecionados. Botão direito: renderizar, trocar preset ou tirar a seleção da fila; arrastar um preset para um vídeo selecionado aplica em todos.

## 0.1.3

**English**
- **Preview shows the Output by default.** New **Compare** button puts Original and Output side by side.
- The line under the preview now shows **how the video will come out** (size, codec, fps CFR/VFR, color, rotation, estimated size), not the original file info.
- **Video** reorganized: Resolution, Bitrate, Codec, Bit depth, FPS, **VFR | CFR**, Rotate, Max quality, HDR → Rec. 709.
- Options are now **dropdown menus**, so the panel is cleaner.
- “Constant frame rate” switch replaced by **VFR | CFR** under FPS. Descriptions of Max quality and frame rate removed.
- The play button was removed from the preview (frame-by-frame and the timeline stay).

**Português**
- **A prévia mostra o Resultado por padrão.** Novo botão **Comparar** coloca Original e Resultado lado a lado.
- A linha embaixo da prévia agora mostra **como o vídeo vai ficar** (tamanho, codec, fps CFR/VFR, cor, rotação, tamanho estimado), não a informação do arquivo original.
- **Vídeo** reorganizado: Resolução, Bitrate, Codec, Profundidade, FPS, **VFR | CFR**, Girar, Qualidade máxima, HDR → Rec. 709.
- As opções agora são **menus suspensos**, o painel fica mais limpo.
- O botão “Manter frame rate constante” virou **VFR | CFR** embaixo do FPS. Saíram as descrições de Qualidade máxima e de frame rate.
- O botão de play saiu da prévia (quadro a quadro e a linha do tempo continuam).

## 0.1.2

**English**
- Mec Encoder menu: **Settings**, **Theme** (opens the theme choices), **Check for updates** and, at the bottom, the **version**, which opens the project page on GitHub.
- **Open presets folder** stays only in the Presets › Manage menu.

**Português**
- Menu do Mec Encoder: **Configurações**, **Tema** (abre as opções de tema), **Procurar atualizações** e, no final, a **versão**, que abre a página do projeto no GitHub.
- **Abrir pasta dos presets** fica só no menu Presets › Gerenciar.

## 0.1.1

**English**
- **New layout**: Presets › Video › Audio › Advanced on the right. Frame rate and HDR → Rec. 709 are now inside Video.
- **Output** (suffix, subfolder, delete original) moved to the bottom left, next to Render queue.
- **Rotate**: 0°, 90° clockwise, 180°, 90° counterclockwise. Turns a horizontal video upright.
- **Resolution** shows the exact output size (e.g. 540 × 960) and has a **Custom** option (width × height; leave one empty to keep the proportion).
- **Presets don't save by themselves anymore**: edit, then click **Save changes** (or **Discard**).
- Presets have **colors only** (no icons). Change the color by clicking the dot or with right-click › Color.
- **Preset folders**: create, rename, collapse and delete folders; **drag presets** to reorder them or move them into a folder. Right-click › Move to folder.
- **Open presets folder** (Manage menu and app menu).
- **Settings and theme** moved to the menu under the **Mec Encoder** name (top left).
- **OLED is the default theme.**
- The default presets are now **RAW, RAW HDR, Proxy and Meta HDR**.
- The rotation notice over the preview and “New videos use” on the main screen were removed (the latter is in Settings).
- Portable updates download the same .zip from the release page.

**Português**
- **Novo layout**: Presets › Vídeo › Áudio › Avançado à direita. Frame rate e HDR → Rec. 709 agora ficam dentro de Vídeo.
- **Saída** (sufixo, subpasta, apagar original) foi para o canto inferior esquerdo, perto do Renderizar fila.
- **Girar**: 0°, 90° horário, 180°, 90° anti-horário. Deixa em pé um vídeo gravado deitado.
- **Resolução** mostra o tamanho exato do resultado (ex.: 540 × 960) e tem a opção **Personalizado** (largura × altura; deixe uma vazia para manter a proporção).
- **Presets não salvam mais sozinhos**: edite e clique em **Salvar alterações** (ou **Descartar**).
- Presets têm **só cor** (sem ícone). Troque a cor clicando na bolinha ou com botão direito › Cor.
- **Pastas de presets**: crie, renomeie, recolha e exclua pastas; **arraste os presets** para reordenar ou colocar numa pasta. Botão direito › Mover para pasta.
- **Abrir pasta dos presets** (menu Gerenciar e menu do app).
- **Configurações e tema** foram para o menu no nome **Mec Encoder** (canto superior esquerdo).
- **OLED é o tema padrão.**
- Os presets padrão agora são **RAW, RAW HDR, Proxy e Meta HDR**.
- Saíram o aviso de rotação em cima da prévia e o “Vídeos novos usam” da tela principal (este continua nas Configurações).
- A atualização do portátil baixa o mesmo .zip da página de releases.

## 0.1.0 — first test build · primeira build de teste

**English**
- Converts with **NVIDIA NVENC** (H.265 / H.264, 8 or 10-bit). Without an NVIDIA card it falls back to the CPU and tells you.
- **Drop videos or whole folders** (subfolders included) from File Explorer, or use **+**.
- **Queue where each video has its own preset**; reorder by dragging, drag a preset onto a video, render one video or the whole queue.
- **Preview with real frames**: Original / Output shows the rotation, scale and color the render will produce. Drag the timeline to check any frame. Real audio waveform.
- **iPhone rotation fixed**: rotation is applied explicitly, so files never come out sideways.
- **Constant frame rate** (e.g. 59.94), **1080p by the shorter side** (vertical stays vertical), 50% / 25% proxies.
- **HDR (HLG/PQ) → Rec. 709** with the same filter chain HandBrake uses.
- Audio: AAC stereo/mono with track mapping (two mics → left/right), or copy. A/V sync, metadata copy. Tracks FFmpeg can't read (iPhone spatial audio) are skipped.
- Suffix, subfolder and **delete original** (only after the new file is checked; it goes to the Recycle Bin).
- **Presets**: create, rename, duplicate, delete, import Shutter Encoder `.enc`, export/import `.json`.
- **Show in folder**, finish sound, Windows notification when the app is in the background.
- **Updates inside the app**: when a new version is published, an “Update” button appears at the top. Presets and settings are kept.
- English and Portuguese; light, dark and OLED themes.

Known limits: video playback with sound in the preview comes later (frames and timeline already work).

**Português**
- Converte com **NVIDIA NVENC** (H.265 / H.264, 8 ou 10-bit). Sem placa NVIDIA, usa a CPU e avisa.
- **Arraste vídeos ou pastas inteiras** (com subpastas) do Explorador de Arquivos, ou use o **+**.
- **Fila em que cada vídeo tem o próprio preset**; reordene arrastando, arraste um preset até o vídeo, renderize um vídeo só ou a fila inteira.
- **Prévia com quadros reais**: Original / Resultado mostra a rotação, a escala e a cor que o render vai gerar. Arraste a linha do tempo para ver qualquer quadro. Forma de onda do áudio de verdade.
- **Rotação do iPhone resolvida**: a rotação é aplicada de forma explícita, o arquivo nunca sai deitado.
- **Frame rate constante** (ex.: 59,94), **1080p pelo lado menor** (vertical continua vertical), proxies 50% / 25%.
- **HDR (HLG/PQ) → Rec. 709** com a mesma sequência de filtros do HandBrake.
- Áudio: AAC estéreo/mono com escolha de faixas (dois microfones → esquerdo/direito), ou cópia. Sincronia A/V, cópia de metadados. Faixas que o FFmpeg não lê (áudio espacial do iPhone) são ignoradas.
- Sufixo, subpasta e **apagar o original** (só depois de conferir o arquivo novo; vai para a Lixeira).
- **Presets**: criar, renomear, duplicar, excluir, importar `.enc` do Shutter Encoder, exportar/importar `.json`.
- **Mostrar na pasta**, som ao terminar, notificação do Windows quando o app está em segundo plano.
- **Atualização dentro do app**: quando sair versão nova, aparece um botão “Atualizar” no topo. Presets e configurações continuam.
- Inglês e português; temas claro, escuro e OLED.

Limitação conhecida: reproduzir o vídeo com som na prévia chega depois (quadros e linha do tempo já funcionam).

## Design steps · Etapas de design

### Step 1.2: v2 chosen · v2 escolhida
**English**
- **v2 is the official layout.**
- **OLED theme** (pure black), in Settings › Appearance next to System, Light and Dark.
- **Render a single video**: hover a video and click ▶, or right-click › Render this video. The sound plays when that video is done.
- **Render queue** plays the sound once, when the whole queue is done.
- **Reorder the queue** by dragging videos, with spring animation.
- **Drag a preset onto a video** to change its preset, or onto the “use for all” area that appears at the top of the queue.
- **Use one preset for all videos**: layers button in the queue header, or right-click a preset.
- **Show in folder** (hover button or right-click). Finished videos open the converted file.
- Right-click menu on videos: render, show in folder, move to top, remove.
- **Collapsible Presets panel**; Video, Audio and the other sections also fold.
- **Smooth scrolling** with an elastic bounce at the ends.
- **Works with an empty queue**: you can edit presets with no videos; videos that still use an unchanged preset follow the edits.
- **Finish sound** with an on/off switch in Settings.
- Shortcuts: Space plays the preview, Delete removes the selected video, Esc closes menus.

**Português**
- **A v2 é o layout oficial.**
- **Tema OLED** (preto puro), em Configurações › Aparência, junto com Sistema, Claro e Escuro.
- **Renderizar um vídeo só**: passe o mouse no vídeo e clique em ▶, ou botão direito › Renderizar este vídeo. O som toca quando aquele vídeo termina.
- **Renderizar fila** toca o som uma vez, quando a fila inteira termina.
- **Reordenar a fila** arrastando os vídeos, com animação de mola.
- **Arrastar um preset até um vídeo** para trocar o preset dele, ou até a área “usar em todos” que aparece no topo da fila.
- **Usar um preset em todos os vídeos**: botão de camadas no topo da fila, ou botão direito no preset.
- **Mostrar na pasta** (botão ao passar o mouse ou botão direito). Vídeos prontos abrem o arquivo convertido.
- Menu de botão direito nos vídeos: renderizar, mostrar na pasta, mover para o topo, tirar da fila.
- **Painel de Presets recolhível**; Vídeo, Áudio e as outras seções também recolhem.
- **Scroll suave** com efeito elástico nas pontas.
- **Funciona com a fila vazia**: dá para editar os presets sem vídeos; os vídeos que usam o preset sem mudanças acompanham as edições.
- **Som ao terminar**, com botão para ligar/desligar nas Configurações.
- Atalhos: Espaço reproduz a prévia, Delete tira o vídeo selecionado, Esc fecha menus.

### Step 1.1: interface v2
**English**
- New **v2 layout**, more minimal: one surface with thin dividers, collapsible settings sections with a one-line summary, compact queue and presets. (v1 is still available while we choose.)
- Window controls moved to the **Windows position** (top right), with a modern look.
- **English is now the main language**, with Portuguese in Settings.
- **Drop folders**: every video inside, subfolders included, is added to the queue. The folder path shows next to each video.
- **Default preset for new videos**, chosen in the drop area or in Settings.
- **8-bit / 10-bit** option.
- **Advanced** section: **A/V sync** and **copy metadata**.
- **Settings**: language, appearance (system, light, dark), default preset, clear queue when finished, notify when finished.
- Frame rate option renamed to **Constant frame rate**.
- HDR → Rec. 709 now documented to use the exact HandBrake filter chain.

**Português**
- Novo **layout v2**, mais minimalista: uma superfície só com divisórias finas, seções de ajustes que abrem e fecham com resumo de uma linha, fila e presets compactos. (A v1 continua disponível até a escolha.)
- Botões da janela no **padrão do Windows** (canto superior direito), com visual moderno.
- **Inglês agora é o idioma principal**, com português nas Configurações.
- **Arrastar pastas**: todos os vídeos de dentro, inclusive das subpastas, entram na fila. O caminho da pasta aparece em cada vídeo.
- **Preset padrão para vídeos novos**, escolhido na área de arrastar ou nas Configurações.
- Opção **8-bit / 10-bit**.
- Seção **Avançado**: **sincronia A/V** e **copiar metadados**.
- **Configurações**: idioma, aparência (sistema, claro, escuro), preset padrão, limpar a fila ao terminar, avisar quando terminar.
- Opção de frame rate renomeada para **Manter frame rate constante**.
- HDR → Rec. 709 documentado com a mesma sequência de filtros do HandBrake.

### Step 1: interface · Etapa 1: interface
**English**
- Three-column layout: **Queue**, **Preview** and **Presets/Settings**; dark and light themes.
- Each queued video shows the **preset it will use**; `*` marks a change from the preset.
- **Automatic warning** when a video is HDR and the preset doesn't convert it.
- **Original / Output** preview with resolution, codec, fps and color, plus a rotation notice.
- **Save to preset** and **Apply to all**.

**Português**
- Layout em três colunas: **Fila**, **Prévia** e **Presets/Ajustes**; temas escuro e claro.
- Cada vídeo da fila mostra o **preset que vai usar**; `*` indica ajuste diferente do preset.
- **Aviso automático** quando o vídeo é HDR e o preset não converte.
- Prévia **Original / Resultado** com resolução, codec, fps e cor, mais aviso de rotação.
- **Salvar no preset** e **Aplicar a todos**.
