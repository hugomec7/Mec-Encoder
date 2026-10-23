# Changelog · Novidades

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
