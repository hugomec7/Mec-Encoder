// Gerado por docs/release-notes/make_news.py — não edite à mão.
window.MEC_NEWS = [
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
 },
 {
  "version": "0.3.4",
  "en": [
   "**New player, like a video editor**: clicking or dragging on the timeline, the arrow keys and play no longer open FFmpeg each time. A player engine keeps the video open, reads it on the graphics card (GPU) when it can, and keeps the frames around the playhead ready in memory, so nearby frames show instantly. Works in the Cutter and in Convert (both sides of Compare).",
   "**Play through the engine**: picture and sound together, already without the cut parts and with no stutter between cuts; speed keeps the pitch of the voice. **J** plays backward (again: 2×, 4×), **L** forward (2×, 4×), **K** pauses. If the engine fails on a file, the old player takes over.",
   "**Preview quality like Premiere**: menu next to the speed with Paused and Playing, each in Automatic, Full, 1/2, 1/4 or 1/8.",
   "**Frame memory** in Settings (1 to 8 GB of RAM) and an option to show the player timings on the video.",
   "**Exact frame on cuts**: Export and GIF parts now start on the exact frame even right before a keyframe (in some HEVC videos the cut could start 1–3 frames late). The preview also shows the right frame there.",
   "**Download**: finished downloads keep the link: **Copy link** or **Download again** (choose quality, video or audio only)."
  ],
  "pt": [
   "**Player novo, como de editor de vídeo**: clicar ou arrastar na linha do tempo, as setas e o play não abrem mais o FFmpeg a cada vez. Um motor de reprodução fica com o vídeo aberto, lê na placa de vídeo quando dá e guarda na memória os quadros em volta da agulha, então os quadros perto aparecem na hora. Vale no Cortador e no Converter (os dois lados do Comparar).",
   "**Play pelo motor**: imagem e som juntos, já sem os trechos cortados e sem engasgo entre os cortes; a velocidade mantém o tom da voz. **J** toca para trás (de novo: 2×, 4×), **L** para frente (2×, 4×), **K** pausa. Se o motor falhar num arquivo, o player antigo assume.",
   "**Qualidade do preview como no Premiere**: menu ao lado da velocidade com Pausado e Tocando, cada um em Automática, Completa, 1/2, 1/4 ou 1/8.",
   "**Memória de quadros** nas Configurações (1 a 8 GB de RAM) e opção de mostrar os tempos do player no vídeo.",
   "**Quadro exato nos cortes**: Exportar e os trechos do GIF agora começam no quadro exato mesmo logo antes de um quadro-chave (em alguns vídeos HEVC o corte podia começar 1 a 3 quadros depois). A prévia também mostra o quadro certo ali.",
   "**Baixar**: os downloads concluídos guardam o link: **Copiar link** ou **Baixar de novo** (escolher qualidade, vídeo ou só áudio)."
  ]
 },
 {
  "version": "0.3.3",
  "en": [
   "**Video to GIF** in Convert: a new GIF preset (in the GIF folder) with width, fps, quality (High or Light), loop, aspect ratio and rotation. With cuts, only the cuts become a GIF; joined, they make a single GIF. HDR videos are converted to normal colors.",
   "**Export in the Cutter now only cuts**: the video keeps everything from the original (codec, resolution, fps, bitrate, bit depth, chroma, file format and audio), with no HDR conversion, scaling or rotation, cut on the exact frame. It is saved next to the original as Video_corte.mp4 (several separate cuts: _corte_01, _corte_02…). The video's preset doesn't change; in the queue it shows as \"Cut only\".",
   "**Convert** replaces Finish in the Cutter: it keeps the cuts and opens the Convert tab with the video selected, to choose the preset and render as you like.",
   "**Play in the Cutter** with screen recordings and other files the player can't jump into: it used to play from the start (as if the cut were at the beginning, and \"Skipping cuts\" seemed to do nothing). Now it switches to the live preview and starts on the right frame."
  ],
  "pt": [
   "**Vídeo para GIF** no Converter: preset novo de GIF (na pasta GIF) com largura, FPS, qualidade (Alta ou Leve), repetir, proporção e giro. Com cortes, só os trechos viram GIF; juntos, saem num GIF só. Vídeo HDR sai com as cores normais.",
   "**Exportar no Cortador agora só corta**: o vídeo mantém tudo do original (codec, resolução, fps, bitrate, profundidade, croma, formato do arquivo e áudio), sem converter HDR, mudar o tamanho ou girar, cortado no quadro exato. Salva ao lado do original como Vídeo_corte.mp4 (vários cortes separados: _corte_01, _corte_02…). O preset do vídeo não muda; na fila aparece como \"Só corte\".",
   "**Converter** substitui o Concluir no Cortador: guarda os cortes e abre a aba Converter com o vídeo selecionado, para escolher o preset e renderizar como quiser.",
   "**Play no Cortador** com gravação de tela e outros arquivos em que o player não consegue pular para o meio: tocava do começo (como se o corte estivesse no início, e o \"Pulando cortes\" parecia não fazer nada). Agora passa para a prévia ao vivo e começa no quadro certo."
  ]
 },
 {
  "version": "0.3.2",
  "en": [
   "**Three tabs at the top: Convert · Cut · Download** (Ctrl+1, Ctrl+2, Ctrl+3). Note: Download moved from Ctrl+2 to Ctrl+3.",
   "**Cut tab**: opens the Cutter on the selected video. With no video, drag one there or click **Open video…** and it goes straight into the Cutter.",
   "**Export in the Cutter**: finishes and starts rendering that video with the cuts right away. **Finish** still just keeps the cuts and goes back to the queue.",
   "**Cleaner Download tab**: only **Quick download** (Ctrl+V, best quality), **Audio** (Ctrl+Shift+V, just the sound), **Download…** and **Save to**. Ready for web, audio format and Accounts moved to **Options**.",
   "**Download…** opens with the link from Ctrl+C in a field at the top. Paste several links there, one per line, to pick which ones to download. **Ready for web** is also in this window, in sync with Options.",
   "**Downloading and Done tabs** in the list: finished downloads move to Done by themselves.",
   "In Done: **▶ on the thumbnail** plays the video, and the new **✂ Cut** button sends a downloaded video straight to the Cutter. Download, cut and export without leaving the app."
  ],
  "pt": [
   "**Três abas no topo: Converter · Cortar · Baixar** (Ctrl+1, Ctrl+2, Ctrl+3). Atenção: Baixar passou do Ctrl+2 para o Ctrl+3.",
   "**Aba Cortar**: abre o Cortador no vídeo selecionado. Sem vídeo, arraste um para lá ou clique em **Abrir vídeo…**, e ele entra direto no Cortador.",
   "**Exportar no Cortador**: conclui e já começa a renderizar o vídeo com os cortes. **Concluir** continua só guardando os cortes e voltando para a fila.",
   "**Aba Baixar mais enxuta**: só **Baixar rápido** (Ctrl+V, maior qualidade), **Áudio** (Ctrl+Shift+V, só o som), **Baixar…** e **Salvar em**. Pronto para web, formato do áudio e Contas foram para **Opções**.",
   "**Baixar…** abre com o link do Ctrl+C num campo no topo. Cole vários links ali, um por linha, para escolher quais baixar. O **Pronto para web** também está nessa janela, junto com o das Opções.",
   "**Abas Baixando e Concluídos** na lista: o que termina passa sozinho para Concluídos.",
   "Em Concluídos: o **▶ na miniatura** assiste ao vídeo, e o novo botão **✂ Cortar** manda o vídeo baixado direto para o Cortador. Baixe, corte e exporte sem sair do app."
  ]
 },
 {
  "version": "0.3.1",
  "en": [
   "**Accounts** in the Download tab: Instagram, YouTube, X, Facebook and TikTok. **Sign in** opens the site's own login page in a private window; as soon as you are in, the app saves the session and closes the window. The session stays only on this PC and is used by every download from that site. **Sign out** deletes it.",
   "A download that needs a login shows **Sign in to Instagram** (or the site) right on the row; after you sign in, it starts again by itself.",
   "**Quality** in the tab options: Best, 1080p, 720p or 480p, used by the quick buttons and the several-links box. 1080p counts the shorter side, so a vertical 1080×1920 video is 1080p.",
   "**Choose quality…** (under the quick buttons): reads the link in Ctrl+C and shows each resolution with fps and estimated size, plus **Audio only** and **Thumbnail only**.",
   "**Subtitles** (pick the language, including YouTube's automatic one) and the **thumbnail** can come together, saved next to the video with the same name (Video.pt.srt, Video.jpg).",
   "**Only a section** (from 1:20 to 1:45): downloads just that piece, cut on the exact frame. The file name carries the section.",
   "**Playlists, channels and profiles**: the link opens a list to tick which videos to download, as video or audio and in the chosen quality. The quick buttons open this list too, instead of downloading hundreds of videos at once."
  ],
  "pt": [
   "**Contas** na aba Baixar: Instagram, YouTube, X, Facebook e TikTok. **Entrar** abre a página de login do próprio site numa janela anônima; assim que você entra, o app guarda a sessão e fecha a janela. A sessão fica só neste PC e vale para todos os downloads daquele site. **Sair** apaga a sessão.",
   "Um download que precisa de login mostra **Entrar no Instagram** (ou no site) na própria linha; depois de entrar, ele recomeça sozinho.",
   "**Qualidade** nas opções da aba: Máxima, 1080p, 720p ou 480p, usada pelos botões rápidos e pela caixa de vários links. O 1080p conta pelo lado menor, então um vídeo em pé 1080×1920 é 1080p.",
   "**Escolher qualidade…** (embaixo dos botões rápidos): lê o link do Ctrl+C e mostra cada resolução com fps e tamanho estimado, além de **Só áudio** e **Só a miniatura**.",
   "**Legenda** (com o idioma, inclusive a automática do YouTube) e **miniatura** podem vir junto, salvas ao lado do vídeo com o mesmo nome (Vídeo.pt.srt, Vídeo.jpg).",
   "**Só um trecho** (de 1:20 até 1:45): baixa só esse pedaço, cortado no quadro exato. O nome do arquivo leva o trecho.",
   "**Playlists, canais e perfis**: o link abre uma lista para marcar quais vídeos baixar, em vídeo ou áudio e na qualidade escolhida. Os botões rápidos também abrem essa lista, em vez de baixar centenas de vídeos de uma vez."
  ]
 },
 {
  "version": "0.3.0",
  "en": [
   "**New Download tab** (Ctrl+2): copy a video link from YouTube, TikTok, X, Facebook, Reddit and hundreds of other sites, and click **Download video** or **Download audio**. It downloads right away in the best quality, without asking anything. Shortcuts in the tab: **Ctrl+V** (video) and **Ctrl+Shift+V** (audio). The link in Ctrl+C shows under the buttons.",
   "**Several links at once**: paste one per line. Up to 3 downloads at the same time.",
   "**Ready for web** (on by default): the video comes out as H.264 + AAC in .mp4, which opens in WhatsApp, Instagram and the browser. If the site already sent it that way, it only reorganizes the file; if not (VP9, AV1, HEVC, Opus), it converts on the graphics card in seconds. Turn it off to keep the file exactly as the site sent it.",
   "**Audio saved as** WAV, M4A, MP3 or FLAC, chosen once.",
   "**Save to**: Downloads\\Mec Encoder by default, with the full path shown. Click it to open the folder.",
   "Done downloads: **▶ plays in the Windows player** (or double-click the row), click the **name to rename** the file, send it to the converter queue or show it in the folder.",
   "First time only, the app downloads yt-dlp and Deno (about 60 MB). yt-dlp updates itself once a day; if a site changes, it updates and tries again.",
   "Not yet: Instagram and age-restricted videos need a login, which comes in a next version. Netflix, Spotify and other DRM-protected services can't be downloaded.",
   "**8 new languages**: Spanish, French, German, Italian, Russian, Japanese, Korean and Simplified Chinese. The first time, the app opens in the Windows language.",
   "**Studio is the default theme** for new installs (your current theme stays).",
   "**New versions show up by themselves**: the app checks when it opens, every 3 hours and when you come back to it, and shows a notice in the corner. Option in Settings › Updates.",
   "**Settings reorganized**: shortcuts have their own page (Edit button), GPU is under Performance, Playback comes before the folders.",
   "**Saved previews unused for 7 days are deleted** by themselves (option: 1, 7, 30 days or never).",
   "**Fix**: a single cut no longer stutters at the start in MPC, nor plays the audio out of sync in Films & TV and Windows Media Player. The audio is now rewritten in the same format as the original, starting together with the video.",
   "**Fix**: \"Delete the original\" now also works for cut videos (it goes to the Recycle Bin after all cuts are done and checked).",
   "**Fix**: the icon of the selected item in menus no longer disappears on the blue highlight."
  ],
  "pt": [
   "**Nova aba Baixar** (Ctrl+2): copie o link de um vídeo do YouTube, TikTok, X, Facebook, Reddit e centenas de outros sites e clique em **Baixar vídeo** ou **Baixar áudio**. Baixa na hora, na maior qualidade, sem perguntar nada. Atalhos na aba: **Ctrl+V** (vídeo) e **Ctrl+Shift+V** (áudio). O link que está no Ctrl+C aparece embaixo dos botões.",
   "**Vários links de uma vez**: cole um por linha. Até 3 downloads ao mesmo tempo.",
   "**Pronto para web** (ligado por padrão): o vídeo sai em H.264 + AAC em .mp4, que abre no WhatsApp, Instagram e navegador. Se o site já mandou assim, só reorganiza o arquivo; se não (VP9, AV1, HEVC, Opus), converte na placa de vídeo em segundos. Desligado, guarda o arquivo exatamente como o site mandou.",
   "**Áudio sai em** WAV, M4A, MP3 ou FLAC, escolhido uma vez.",
   "**Salvar em**: Downloads\\Mec Encoder por padrão, com o caminho completo à vista. Clique nele para abrir a pasta.",
   "Downloads prontos: **▶ assiste no player do Windows** (ou dois cliques na linha), clique no **nome para renomear** o arquivo, mande para a fila do conversor ou mostre na pasta.",
   "Só na primeira vez, o app baixa o yt-dlp e o Deno (cerca de 60 MB). O yt-dlp se atualiza sozinho uma vez por dia; se um site mudar, ele atualiza e tenta de novo.",
   "Ainda não: Instagram e vídeos com restrição de idade pedem login, que chega numa próxima versão. Netflix, Spotify e outros serviços com DRM não podem ser baixados.",
   "**8 idiomas novos**: espanhol, francês, alemão, italiano, russo, japonês, coreano e chinês simplificado. Na primeira vez, o app abre no idioma do Windows.",
   "**Estúdio é o tema padrão** para quem instala agora (quem já usa continua com o seu).",
   "**Versões novas aparecem sozinhas**: o app procura ao abrir, a cada 3 horas e ao voltar para ele, e mostra um aviso no canto. Opção em Configurações › Atualizações.",
   "**Configurações reorganizadas**: atalhos numa página própria (botão Editar), GPU em Desempenho, Reprodução antes das pastas.",
   "**Prévias guardadas sem uso há 7 dias são apagadas** sozinhas (opção: 1, 7, 30 dias ou nunca).",
   "**Correção**: um corte só não trava mais no começo no MPC, nem toca o áudio fora de sincronia no Filmes e TV e no Reprodutor Multimídia. O áudio agora é regravado no mesmo formato do original, começando junto com o vídeo.",
   "**Correção**: \"Apagar o original\" também vale para vídeos cortados (vai para a Lixeira depois que todos os cortes saem e são conferidos).",
   "**Correção**: o ícone do item marcado nos menus não some mais sobre o azul."
  ]
 },
 {
  "version": "0.2.11",
  "en": [
   "**Everything from the test versions 0.2.7 to 0.2.10** comes in this update: several cuts per video, the Cutter, timeline zoom, play with sound (plays the result, skipping the cuts), timecode ruler, magnet and configurable shortcuts. See them in What's new.",
   "**Skip cuts** has its own icon (a jump between two pieces) instead of scissors, turns blue when on and shows two texts: **Skipping cuts** (plays the result) and **Whole video** (plays the original). In the Cutter it is the same size as **New cut**.",
   "**Quieter play button**: a rounded square with a soft background, like the other controls, instead of the white circle. Simpler play and pause icons.",
   "**Even spacing** in the Cutter: In, ‹, ⏮, ▶, ⏭, › and Out are the same distance apart, away from the timecode."
  ],
  "pt": [
   "**Tudo das versões de teste 0.2.7 a 0.2.10** vem nesta atualização: vários cortes por vídeo, o Cortador, zoom na linha do tempo, play com som (toca o resultado, pulando os cortes), régua de timecode, ímã e atalhos configuráveis. Veja em Novidades.",
   "**Pular cortes** ganhou ícone próprio (um salto entre dois pedaços) no lugar da tesoura, fica azul quando ligado e mostra dois textos: **Pulando cortes** (toca o resultado) e **Vídeo inteiro** (toca o original). No Cortador tem o mesmo tamanho do **Novo corte**.",
   "**Play mais discreto**: quadrado arredondado com fundo suave, como os outros controles, no lugar do círculo branco. Ícones de play e pause mais simples.",
   "**Espaçamento igual** no Cortador: Início, ‹, ⏮, ▶, ⏭, › e Fim com a mesma distância entre si, afastados do timecode."
  ]
 },
 {
  "version": "0.2.10",
  "en": [
   "**Test version**: not offered by the app's automatic update. Download it from this page.",
   "**Play shows the result**: with cuts marked, play starts at the playhead and skips what was cut. Put the playhead near the end of a cut and press play to see how it joins the next one. The time on top of the preview shows where you are in the final file. The **Skip cuts** button (or **Shift+Space**) switches between playing with the cuts and playing the original; while playing, it continues from the same point.",
   "**⏮ ⏭ go from cut to cut** (start and last frame of each cut; without cuts, the beginning and the end). Shortcuts **↑ ↓**. They replace the 5-second buttons (Shift+← → still jump 5 seconds).",
   "**Volume slider** next to the speaker (click the speaker to mute).",
   "The **▶ Cuts** button was removed: the normal play does that now.",
   "The **In** and **Out** buttons show only their icons again.",
   "**Fix**: removing a cut with × now updates the list right away (before, it only disappeared from the timeline)."
  ],
  "pt": [
   "**Versão de teste**: a atualização automática do app não oferece esta versão. Baixe por esta página.",
   "**O play mostra o resultado**: com cortes marcados, o play começa na agulha e pula o que foi cortado. Ponha a agulha perto do fim de um corte e aperte play para ver como ele emenda no próximo. O tempo em cima da prévia mostra onde você está no arquivo final. O botão **Pular cortes** (ou **Shift+Espaço**) alterna entre tocar com os cortes e tocar o original; tocando, continua do mesmo ponto.",
   "**⏮ ⏭ vão de corte em corte** (início e último quadro de cada corte; sem cortes, o começo e o fim). Atalhos **↑ ↓**. Eles substituem os botões de 5 segundos (Shift+← → continuam pulando 5 segundos).",
   "**Controle de volume** deslizante ao lado do alto-falante (clicar no alto-falante tira o som).",
   "O botão **▶ Trechos** saiu: o play normal já faz isso.",
   "Os botões de **Início** e **Fim** voltaram a ser só o ícone.",
   "No app em português, **trecho** virou **corte**: \"Novo corte\", a lista de \"Cortes\" etc.",
   "**Correção**: tirar um corte pelo × atualiza a lista na hora (antes só sumia da linha do tempo)."
  ]
 }
];
