// Gerado por docs/release-notes/make_news.py — não edite à mão.
window.MEC_NEWS = [
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
 },
 {
  "version": "0.2.0",
  "en": [
   "**Convert audio**: audio files (MP3, WAV, M4A, AAC, FLAC, OGG, AIFF…) now go into the same queue. New audio presets: **WAV** (24-bit), **MP3 320**, **AAC 256 (.m4a)** and **FLAC**, with Quality, Bits, Sample rate and Channels (all with Source). Pick an audio preset for a video to **extract its audio**. Existing users get the audio presets once; your own presets are not changed.",
   "**HDR → Rec. 709 is now Automatic / Off**: Automatic converts only when the video is HDR, so one preset works for SDR and HDR footage.",
   "**Auto bitrate level**: High · Balanced · Light (Light makes much smaller backups).",
   "**Protected presets**: if the presets file can't be fully read, the app keeps a copy (presets.broken-….json) and tells you, instead of silently going back to defaults. One broken preset no longer affects the others.",
   "**New defaults for new users** (only on first run): RAW, Backup, Proxy, Meta Glass and the audio presets. All video defaults use H.265 4:2:0 with Source bit depth, so they run on the GPU on any RTX 20/30/40/50, and Delete original starts off. On an RTX 50, a \"Like the camera\" (4:2:2) preset is added too.",
   "The CPU warning now says exactly why (4:2:2 or 10-bit H.264) and what to change to use the GPU. The line under the preview always shows the chroma (4:2:0 or 4:2:2)."
  ],
  "pt": [
   "**Converter áudio**: arquivos de áudio (MP3, WAV, M4A, AAC, FLAC, OGG, AIFF…) agora entram na mesma fila. Novos presets de áudio: **WAV** (24-bit), **MP3 320**, **AAC 256 (.m4a)** e **FLAC**, com Qualidade, Bits, Taxa e Canais (todos com Original). Escolha um preset de áudio para um vídeo para **extrair o áudio** dele. Quem já usa o app recebe os presets de áudio uma vez; os seus presets não mudam.",
   "**HDR → Rec. 709 agora é Automático / Desligado**: o Automático converte só quando o vídeo é HDR, então um preset só serve para vídeo normal e HDR.",
   "**Nível do bitrate Auto**: Alta · Equilibrada · Leve (o Leve deixa backups bem menores).",
   "**Presets protegidos**: se o arquivo de presets não puder ser lido por inteiro, o app guarda uma cópia (presets.broken-….json) e avisa, em vez de voltar aos padrões sem dizer nada. Um preset com problema não afeta mais os outros.",
   "**Padrões novos para quem baixar** (só na primeira vez): RAW, Backup, Proxy, Meta Glass e os presets de áudio. Todos os de vídeo usam H.265 4:2:0 com profundidade Original, então rodam pela placa em qualquer RTX 20/30/40/50, e o Apagar o original vem desligado. Numa RTX 50 entra também um preset \"Igual à câmera\" (4:2:2).",
   "O aviso de CPU agora diz o motivo certo (4:2:2 ou H.264 10-bit) e o que mudar para usar a placa. A linha embaixo da prévia sempre mostra o croma (4:2:0 ou 4:2:2)."
  ]
 },
 {
  "version": "0.1.8",
  "en": [
   "**\"Like the camera\" (e.g. Sony FX30 XAVC S)**: Codec, Chroma, Bit depth, FPS and Format now have **Source**. With all of them on Source, an FX30 file comes out H.264 4:2:2 10-bit, upright, in .mp4.",
   "New **Chroma** option: Source · 4:2:0 · 4:2:2. H.264 can now be 10-bit.",
   "On RTX 20/30/40 cards, 4:2:2 and 10-bit H.264 are encoded on the CPU (x264/x265), because their NVENC can't encode them. The app shows an orange warning. RTX 50 encodes them on the GPU.",
   "New **Format** option (Output panel): Source · MP4 · MOV. Source keeps the file's extension (.MP4 stays .mp4, iPhone .MOV stays .mov).",
   "**Copied PCM audio in .mp4** is now written like Sony does (\"twos\"), bit-identical to the original.",
   "**Camera timecode** is kept (e.g. FX30 07:51:07:46), so clips sync in Premiere.",
   "**AAC audio**: new **Quality** (Source · 128–320 kb/s) and **Sample rate** (Source · 44.1 · 48 kHz). Source uses the original audio's kb/s and rate. **Copy** is still the exact copy."
  ],
  "pt": [
   "**\"Igual à câmera\" (ex.: Sony FX30 XAVC S)**: Codec, Croma, Profundidade, FPS e Formato agora têm **Original**. Com tudo em Original, um arquivo da FX30 sai H.264 4:2:2 10-bit, em pé, em .mp4.",
   "Nova opção **Croma**: Original · 4:2:0 · 4:2:2. O H.264 agora também pode ser 10-bit.",
   "Nas RTX 20/30/40, 4:2:2 e H.264 10-bit são gravados pela CPU (x264/x265), porque a NVENC delas não grava esses formatos. O app avisa em laranja. As RTX 50 gravam pela placa.",
   "Nova opção **Formato** (painel Saída): Original · MP4 · MOV. Original mantém a extensão do arquivo (.MP4 continua .mp4, .MOV do iPhone continua .mov).",
   "**Áudio PCM copiado em .mp4** agora é gravado do jeito da Sony (\"twos\"), idêntico bit a bit ao original.",
   "O **timecode da câmera** é mantido (ex.: FX30 07:51:07:46), para sincronizar no Premiere.",
   "**Áudio AAC**: nova **Qualidade** (Original · 128–320 kb/s) e **Taxa** (Original · 44,1 · 48 kHz). Original usa os kb/s e a taxa do áudio original. **Copiar** continua sendo a cópia exata."
  ]
 },
 {
  "version": "0.1.7",
  "en": [
   "**FPS** now always has **Source**. With CFR it locks to the file's own frame rate (iPhone recorded at 60 → 60 constant; FX30 → 59.94). Picking a number while on VFR switches to CFR. The value that will come out shows under \"FPS\".",
   "**Bit depth** has **Source**: 8-bit stays 8-bit, 10-bit stays 10-bit (shown under \"Bit depth\").",
   "**HDR → Rec. 709**: the description moved to an ⓘ icon (hover to read). The \"same bitrate as the source\" note is gone."
  ],
  "pt": [
   "**FPS** agora sempre tem **Original**. Com CFR, fixa no fps do próprio arquivo (iPhone gravado a 60 → 60 constante; FX30 → 59,94). Escolher um número com VFR ligado passa para CFR. O valor que vai sair aparece embaixo de \"FPS\".",
   "**Profundidade** tem **Original**: 8-bit continua 8-bit, 10-bit continua 10-bit (aparece embaixo de \"Profundidade\").",
   "**HDR → Rec. 709**: a descrição foi para o ícone ⓘ (passe o mouse). O aviso de \"mesmo bitrate do original\" saiu."
  ]
 },
 {
  "version": "0.1.6",
  "en": [
   "**NVIDIA RTX 50 (Blackwell) reads 4:2:2 on the GPU**: Sony FX30/FX3 and other H.264/HEVC 4:2:2 files are decoded on the GPU and converted to 4:2:0 there. RTX 20/30/40 cards can't read 4:2:2, so those files keep rendering through the CPU (same result, just slower). If the GPU path fails on any file, the app falls back automatically."
  ],
  "pt": [
   "**NVIDIA RTX 50 (Blackwell) lê 4:2:2 pela placa**: arquivos H.264/HEVC 4:2:2 da Sony FX30/FX3 e outros são lidos pela GPU e convertidos para 4:2:0 nela mesma. As RTX 20/30/40 não leem 4:2:2, então esses arquivos continuam renderizando pela CPU (mesmo resultado, só mais lento). Se o caminho pela placa falhar em algum arquivo, o app tenta outro jeito sozinho."
  ]
 }
];
