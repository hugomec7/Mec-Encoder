# Changelog · Novidades

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
