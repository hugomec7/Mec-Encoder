// Textos do motor do player (selo no Cortador) e do menu de qualidade do preview, nos 10 idiomas.
(() => {
  const T = {
    en: ['Engine', 'GPU', 'CPU', (n) => `${n} ${n === 1 ? 'frame' : 'frames'} read`, 'from memory', 'Preview quality (paused and playing)', 'Paused', 'Playing', 'Automatic', 'Full'],
    pt: ['Motor', 'placa de vídeo', 'processador', (n) => `${n} ${n === 1 ? 'quadro lido' : 'quadros lidos'}`, 'da memória', 'Qualidade do preview (pausado e tocando)', 'Pausado', 'Tocando', 'Automática', 'Completa'],
    es: ['Motor', 'GPU', 'CPU', (n) => `${n} ${n === 1 ? 'fotograma leído' : 'fotogramas leídos'}`, 'de la memoria', 'Calidad de la vista previa (en pausa y reproduciendo)', 'En pausa', 'Reproduciendo', 'Automática', 'Completa'],
    fr: ['Moteur', 'GPU', 'CPU', (n) => `${n} ${n === 1 ? 'image lue' : 'images lues'}`, 'depuis la mémoire', 'Qualité de l’aperçu (en pause et en lecture)', 'En pause', 'En lecture', 'Automatique', 'Complète'],
    de: ['Engine', 'GPU', 'CPU', (n) => `${n} ${n === 1 ? 'Bild gelesen' : 'Bilder gelesen'}`, 'aus dem Speicher', 'Vorschauqualität (pausiert und bei Wiedergabe)', 'Pausiert', 'Wiedergabe', 'Automatisch', 'Voll'],
    it: ['Motore', 'GPU', 'CPU', (n) => `${n} ${n === 1 ? 'fotogramma letto' : 'fotogrammi letti'}`, 'dalla memoria', 'Qualità dell’anteprima (in pausa e in riproduzione)', 'In pausa', 'In riproduzione', 'Automatica', 'Completa'],
    ru: ['Движок', 'GPU', 'CPU', (n) => `кадров прочитано: ${n}`, 'из памяти', 'Качество превью (на паузе и при воспроизведении)', 'На паузе', 'Воспроизведение', 'Авто', 'Полное'],
    ja: ['エンジン', 'GPU', 'CPU', (n) => `${n} フレーム読み込み`, 'メモリから', 'プレビュー画質（一時停止中・再生中）', '一時停止中', '再生中', '自動', 'フル'],
    ko: ['엔진', 'GPU', 'CPU', (n) => `${n}프레임 읽음`, '메모리에서', '미리보기 화질(일시정지·재생 중)', '일시정지', '재생 중', '자동', '전체'],
    zh: ['引擎', 'GPU', 'CPU', (n) => `已读取 ${n} 帧`, '来自内存', '预览质量（暂停与播放）', '暂停时', '播放时', '自动', '完整'],
  };
  const K = ['viewEngine', 'viewGpu', 'viewCpu', 'viewFrames', 'viewMem', 'qualTip', 'qualPaused', 'qualPlaying', 'qualAuto', 'qualFull'];
  Object.entries(T).forEach(([lang, v]) => {
    const L = window.MEC_I18N[lang]; if (L) K.forEach((k, i) => { L[k] = v[i]; });
  });
})();
// Baixar: copiar o link de um download e baixar de novo
(() => {
  const T = {
    en: ['Copy link', 'Link copied', 'Download again (choose quality or audio only)'],
    pt: ['Copiar link', 'Link copiado', 'Baixar de novo (escolher qualidade ou só áudio)'],
    es: ['Copiar enlace', 'Enlace copiado', 'Descargar de nuevo (elegir calidad o solo audio)'],
    fr: ['Copier le lien', 'Lien copié', 'Télécharger à nouveau (choisir la qualité ou l’audio seul)'],
    de: ['Link kopieren', 'Link kopiert', 'Erneut herunterladen (Qualität oder nur Audio wählen)'],
    it: ['Copia link', 'Link copiato', 'Scarica di nuovo (scegli qualità o solo audio)'],
    ru: ['Копировать ссылку', 'Ссылка скопирована', 'Скачать снова (выбрать качество или только звук)'],
    ja: ['リンクをコピー', 'リンクをコピーしました', 'もう一度ダウンロード（画質や音声のみを選択）'],
    ko: ['링크 복사', '링크를 복사했습니다', '다시 다운로드(화질 또는 오디오만 선택)'],
    zh: ['复制链接', '链接已复制', '重新下载（选择画质或仅音频）'],
  };
  Object.entries(T).forEach(([lang, [dlCopyLink, dlLinkCopied, dlAgain]]) => {
    const L = window.MEC_I18N[lang]; if (L) Object.assign(L, { dlCopyLink, dlLinkCopied, dlAgain });
  });
})();
// Configurações do player: memória de quadros e selo de tempos
(() => {
  const T = {
    en: ['Frame memory', 'RAM the player can use to keep frames ready around the playhead. More = more seconds without reading the file', 'Show player timings', 'Small label on the video with how long each frame took'],
    pt: ['Memória de quadros', 'RAM que o player pode usar para guardar quadros prontos em volta da agulha. Mais = mais segundos sem ler o arquivo', 'Mostrar tempos do player', 'Selo no canto do vídeo com quanto cada quadro levou'],
    es: ['Memoria de fotogramas', 'RAM que el reproductor puede usar para guardar fotogramas listos alrededor del cabezal. Más = más segundos sin leer el archivo', 'Mostrar tiempos del reproductor', 'Etiqueta en el video con cuánto tardó cada fotograma'],
    fr: ['Mémoire d’images', 'RAM que le lecteur peut utiliser pour garder des images prêtes autour de la tête de lecture. Plus = plus de secondes sans relire le fichier', 'Afficher les temps du lecteur', 'Petite étiquette sur la vidéo avec le temps de chaque image'],
    de: ['Bildspeicher', 'RAM, den der Player für fertige Bilder rund um den Abspielkopf nutzen darf. Mehr = mehr Sekunden ohne die Datei zu lesen', 'Player-Zeiten anzeigen', 'Kleines Etikett auf dem Video mit der Zeit pro Bild'],
    it: ['Memoria fotogrammi', 'RAM che il player può usare per tenere pronti i fotogrammi attorno alla testina. Di più = più secondi senza leggere il file', 'Mostra tempi del player', 'Etichetta sul video con quanto ha impiegato ogni fotogramma'],
    ru: ['Память кадров', 'ОЗУ для готовых кадров вокруг указателя. Больше = больше секунд без чтения файла', 'Показывать время плеера', 'Метка на видео: сколько занял каждый кадр'],
    ja: ['フレームメモリ', '再生ヘッド周辺のフレームを準備しておくための RAM。多いほどファイルを読まずに済む秒数が増えます', 'プレーヤーの時間を表示', '各フレームにかかった時間を動画上に表示'],
    ko: ['프레임 메모리', '재생 헤드 주변 프레임을 미리 준비하는 RAM. 많을수록 파일을 읽지 않는 구간이 길어집니다', '플레이어 시간 표시', '각 프레임에 걸린 시간을 영상에 표시'],
    zh: ['帧内存', '播放器用来在播放头附近预备帧的内存。越多，不读文件的秒数越多', '显示播放器耗时', '在视频上显示每帧耗时'],
  };
  Object.entries(T).forEach(([lang, [viewMemL, viewMemSub, viewStatsL, viewStatsSub]]) => {
    const L = window.MEC_I18N[lang]; if (L) Object.assign(L, { viewMemL, viewMemSub, viewStatsL, viewStatsSub });
  });
})();
// "Qualidade" tocando: com o motor, Auto = o tamanho da tela
(() => {
  const T = { en: 'Of the video while playing (also in the menu next to the speed). Auto = the size of the screen',
    pt: 'Do vídeo tocando (também no menu ao lado da velocidade). Auto = o tamanho da tela',
    es: 'Del video al reproducir (también en el menú junto a la velocidad). Auto = el tamaño de la pantalla',
    fr: 'De la vidéo en lecture (aussi dans le menu à côté de la vitesse). Auto = la taille de l’écran',
    de: 'Des Videos bei der Wiedergabe (auch im Menü neben der Geschwindigkeit). Auto = die Bildschirmgröße',
    it: 'Del video in riproduzione (anche nel menu accanto alla velocità). Auto = la dimensione dello schermo',
    ru: 'Видео при воспроизведении (также в меню рядом со скоростью). Авто = размер экрана',
    ja: '再生中の動画（速度の横のメニューでも変更可）。自動 = 画面のサイズ',
    ko: '재생 중인 영상(속도 옆 메뉴에서도 변경). 자동 = 화면 크기',
    zh: '播放时的视频（速度旁的菜单中也可设置）。自动 = 屏幕大小' };
  Object.entries(T).forEach(([lang, v]) => { const L = window.MEC_I18N[lang]; if (L) L.playQSub = v; });
})();
// Exportar do Cortador (renderiza aqui, sem a fila do Converter)
(() => {
  const T = {
    en: [(n) => `Exporting… ${n}%`, 'Click to stop', 'This video is already rendering in the queue', (n, f) => (n > 1 ? `${n} files saved` : `Saved: ${f}`), (f) => `Saved: ${f}`, 'Export cancelled', 'Saves only the parts you kept, exactly like the original (no converting)'],
    pt: [(n) => `Exportando… ${n}%`, 'Clique para parar', 'Este vídeo já está renderizando na fila', (n, f) => (n > 1 ? `${n} arquivos salvos` : `Salvo: ${f}`), (f) => `Salvo: ${f}`, 'Exportação cancelada', 'Salva só os trechos que ficaram, igual ao original (sem converter)'],
    es: [(n) => `Exportando… ${n}%`, 'Haz clic para detener', 'Este video ya se está renderizando en la cola', (n, f) => (n > 1 ? `${n} archivos guardados` : `Guardado: ${f}`), (f) => `Guardado: ${f}`, 'Exportación cancelada', 'Guarda solo los tramos que quedaron, igual que el original (sin convertir)'],
    fr: [(n) => `Export… ${n} %`, 'Cliquez pour arrêter', 'Cette vidéo est déjà en rendu dans la file', (n, f) => (n > 1 ? `${n} fichiers enregistrés` : `Enregistré : ${f}`), (f) => `Enregistré : ${f}`, 'Export annulé', 'Enregistre seulement les passages gardés, comme l’original (sans conversion)'],
    de: [(n) => `Exportiere… ${n} %`, 'Klicken zum Stoppen', 'Dieses Video wird bereits in der Warteschlange gerendert', (n, f) => (n > 1 ? `${n} Dateien gespeichert` : `Gespeichert: ${f}`), (f) => `Gespeichert: ${f}`, 'Export abgebrochen', 'Speichert nur die behaltenen Teile, genau wie das Original (ohne Umwandlung)'],
    it: [(n) => `Esportazione… ${n}%`, 'Clicca per fermare', 'Questo video è già in rendering nella coda', (n, f) => (n > 1 ? `${n} file salvati` : `Salvato: ${f}`), (f) => `Salvato: ${f}`, 'Esportazione annullata', 'Salva solo i tratti rimasti, come l’originale (senza convertire)'],
    ru: [(n) => `Экспорт… ${n}%`, 'Нажмите, чтобы остановить', 'Это видео уже рендерится в очереди', (n, f) => (n > 1 ? `Сохранено файлов: ${n}` : `Сохранено: ${f}`), (f) => `Сохранено: ${f}`, 'Экспорт отменён', 'Сохраняет только оставленные фрагменты, как в оригинале (без конвертации)'],
    ja: [(n) => `書き出し中… ${n}%`, 'クリックで停止', 'この動画はすでにキューでレンダリング中です', (n, f) => (n > 1 ? `${n} 個のファイルを保存` : `保存しました: ${f}`), (f) => `保存しました: ${f}`, '書き出しを中止しました', '残した部分だけを元と同じ形式で保存（変換なし）'],
    ko: [(n) => `내보내는 중… ${n}%`, '클릭하면 중지', '이 영상은 이미 대기열에서 렌더링 중입니다', (n, f) => (n > 1 ? `파일 ${n}개 저장됨` : `저장됨: ${f}`), (f) => `저장됨: ${f}`, '내보내기 취소됨', '남긴 구간만 원본 그대로 저장(변환 없음)'],
    zh: [(n) => `正在导出… ${n}%`, '点击停止', '此视频已在队列中渲染', (n, f) => (n > 1 ? `已保存 ${n} 个文件` : `已保存：${f}`), (f) => `已保存：${f}`, '已取消导出', '只保存保留的片段，与原文件相同（不转换）'],
  };
  const K = ['cutExporting', 'cutExportStop', 'cutExportBusy', 'cutSaved', 'cutSavedToast', 'cutExportCancelled', 'cutExportTip'];
  Object.entries(T).forEach(([lang, v]) => { const L = window.MEC_I18N[lang]; if (L) K.forEach((k, i) => { L[k] = v[i]; }); });
})();
// Crop do Cortador
(() => {
  const K = ['cropTool', 'cropTip', 'cropChip', 'cropEdit', 'cropOff', 'cropFree', 'cropOrig', 'cropLeft', 'cropTop', 'cropRight', 'cropBottom', 'cropDone', 'cropFrom'];
  const T = {
    en: ['Crop', 'Crop the picture: keep only part of the frame', 'Cropped', 'Edit', 'Remove', 'Free', 'Original', 'Left', 'Top', 'Right', 'Bottom', 'Done', (w, h) => `Video ${w} × ${h} · saved at the crop size`],
    pt: ['Crop', 'Recortar a imagem: fica só uma parte do quadro', 'Com crop', 'Editar', 'Tirar crop', 'Livre', 'Original', 'Esquerda', 'Topo', 'Direita', 'Base', 'Pronto', (w, h) => `Vídeo ${w} × ${h} · sai no tamanho do recorte`],
    es: ['Recorte', 'Recortar la imagen: queda solo una parte del cuadro', 'Recortado', 'Editar', 'Quitar', 'Libre', 'Original', 'Izquierda', 'Arriba', 'Derecha', 'Abajo', 'Listo', (w, h) => `Video ${w} × ${h} · sale al tamaño del recorte`],
    fr: ['Recadrer', 'Recadrer l’image : garder une partie du cadre', 'Recadré', 'Modifier', 'Retirer', 'Libre', 'Original', 'Gauche', 'Haut', 'Droite', 'Bas', 'OK', (w, h) => `Vidéo ${w} × ${h} · sort à la taille du recadrage`],
    de: ['Zuschneiden', 'Bild zuschneiden: nur einen Teil behalten', 'Zugeschnitten', 'Bearbeiten', 'Entfernen', 'Frei', 'Original', 'Links', 'Oben', 'Rechts', 'Unten', 'Fertig', (w, h) => `Video ${w} × ${h} · Ausgabe in Zuschnittgröße`],
    it: ['Ritaglia', 'Ritaglia l’immagine: resta solo una parte', 'Ritagliato', 'Modifica', 'Togli', 'Libero', 'Originale', 'Sinistra', 'Alto', 'Destra', 'Basso', 'Fatto', (w, h) => `Video ${w} × ${h} · esce alla dimensione del ritaglio`],
    ru: ['Кадрирование', 'Обрезать картинку: оставить часть кадра', 'Кадрировано', 'Изменить', 'Убрать', 'Свободно', 'Исходные', 'Слева', 'Сверху', 'Справа', 'Снизу', 'Готово', (w, h) => `Видео ${w} × ${h} · выход в размере кадрирования`],
    ja: ['切り抜き', '画面の一部だけを残す', '切り抜きあり', '編集', '解除', '自由', '元の比率', '左', '上', '右', '下', '完了', (w, h) => `動画 ${w} × ${h} · 切り抜きサイズで出力`],
    ko: ['자르기', '화면의 일부만 남기기', '자르기 적용', '편집', '해제', '자유', '원본', '왼쪽', '위', '오른쪽', '아래', '완료', (w, h) => `영상 ${w} × ${h} · 자른 크기로 저장`],
    zh: ['裁剪', '裁剪画面：只保留一部分', '已裁剪', '编辑', '取消裁剪', '自由', '原始', '左', '上', '右', '下', '完成', (w, h) => `视频 ${w} × ${h} · 按裁剪尺寸输出`],
  };
  Object.entries(T).forEach(([lang, v]) => { const L = window.MEC_I18N[lang]; if (L) K.forEach((k, i) => { L[k] = v[i]; }); });
})();
// GIF no Downloader
(() => {
  const K = ['dlGifTip', 'dlPickGif', 'dlGifing', 'dlMakeGif'];
  const T = {
    en: [(s) => `Download the link as a GIF${s ? ` (${s}, like the GIF preset)` : ''}`, 'GIF', 'Making the GIF', 'Make a GIF of this link'],
    pt: [(s) => `Baixar o link como GIF${s ? ` (${s}, igual ao preset GIF)` : ''}`, 'GIF', 'Fazendo o GIF', 'Fazer GIF deste link'],
    es: [(s) => `Descargar el enlace como GIF${s ? ` (${s}, como el preset GIF)` : ''}`, 'GIF', 'Creando el GIF', 'Hacer un GIF de este enlace'],
    fr: [(s) => `Télécharger le lien en GIF${s ? ` (${s}, comme le préréglage GIF)` : ''}`, 'GIF', 'Création du GIF', 'Faire un GIF de ce lien'],
    de: [(s) => `Link als GIF laden${s ? ` (${s}, wie die GIF-Vorgabe)` : ''}`, 'GIF', 'GIF wird erstellt', 'GIF aus diesem Link machen'],
    it: [(s) => `Scarica il link come GIF${s ? ` (${s}, come il preset GIF)` : ''}`, 'GIF', 'Creazione della GIF', 'Fai una GIF da questo link'],
    ru: [(s) => `Скачать ссылку как GIF${s ? ` (${s}, как пресет GIF)` : ''}`, 'GIF', 'Делаю GIF', 'Сделать GIF из этой ссылки'],
    ja: [(s) => `リンクをGIFでダウンロード${s ? `（${s}、GIFプリセットと同じ）` : ''}`, 'GIF', 'GIFを作成中', 'このリンクからGIFを作る'],
    ko: [(s) => `링크를 GIF로 다운로드${s ? ` (${s}, GIF 프리셋과 같음)` : ''}`, 'GIF', 'GIF 만드는 중', '이 링크로 GIF 만들기'],
    zh: [(s) => `将链接下载为 GIF${s ? `（${s}，与 GIF 预设相同）` : ''}`, 'GIF', '正在制作 GIF', '用此链接制作 GIF'],
  };
  Object.entries(T).forEach(([lang, v]) => { const L = window.MEC_I18N[lang]; if (L) K.forEach((k, i) => { L[k] = v[i]; }); });
})();
// Lista de links (Baixar)
(() => {
  const K = ['lsBtn', 'lsBtnSub', 'lsTitle', 'lsPaste', 'lsEmpty', 'lsRemove', 'lsClear', 'lsFolder', 'lsPickFolder', 'lsNeedFolder', 'lsWhat', 'lsThumbOnly', 'lsQuality', 'lsMax', 'lsAudioFmt', 'lsSubOrig', 'lsBad', 'lsGo', 'lsQueued'];
  const T = {
    en: ['Link list', 'Several videos at once, all into one folder', 'Link list', 'Paste the links here, one per line (Enter adds)', 'Paste links above. Each video shows its name and thumbnail here before downloading.', 'Remove from the list', 'Clear', 'Save to', 'Choose a folder', 'Choose the folder for this list', 'Download as', 'Thumbnail', 'Max quality', 'Max', (f) => `Audio only, in ${f} (as in Options)`, 'Video language', (n) => `${n} with error (left out)`, (n) => n ? `Download ${n} ${n === 1 ? 'item' : 'items'}` : 'Download', (n, d) => `${n} ${n === 1 ? 'download' : 'downloads'} going to ${d}`],
    pt: ['Lista de links', 'Vários vídeos de uma vez, todos numa pasta', 'Lista de links', 'Cole os links aqui, um por linha (Enter adiciona)', 'Cole os links acima. Cada vídeo aparece aqui com nome e miniatura antes de baixar.', 'Tirar da lista', 'Limpar', 'Salvar em', 'Escolher pasta', 'Escolha a pasta desta lista', 'Baixar como', 'Miniatura', 'Qualidade máxima', 'Máxima', (f) => `Só o som, em ${f} (como nas Opções)`, 'Idioma do vídeo', (n) => `${n} com erro (ficam de fora)`, (n) => n ? `Baixar ${n} ${n === 1 ? 'item' : 'itens'}` : 'Baixar', (n, d) => `${n} ${n === 1 ? 'download indo' : 'downloads indo'} para ${d}`],
    es: ['Lista de enlaces', 'Varios videos a la vez, todos en una carpeta', 'Lista de enlaces', 'Pega los enlaces aquí, uno por línea (Enter añade)', 'Pega enlaces arriba. Cada video aparece aquí con nombre y miniatura antes de descargar.', 'Quitar de la lista', 'Limpiar', 'Guardar en', 'Elegir carpeta', 'Elige la carpeta de esta lista', 'Descargar como', 'Miniatura', 'Calidad máxima', 'Máxima', (f) => `Solo el audio, en ${f} (como en Opciones)`, 'Idioma del video', (n) => `${n} con error (quedan fuera)`, (n) => n ? `Descargar ${n}` : 'Descargar', (n, d) => `${n} ${n === 1 ? 'descarga' : 'descargas'} a ${d}`],
    fr: ['Liste de liens', 'Plusieurs vidéos d’un coup, dans un seul dossier', 'Liste de liens', 'Collez les liens ici, un par ligne (Entrée ajoute)', 'Collez des liens ci-dessus. Chaque vidéo apparaît ici avec son nom et sa miniature avant le téléchargement.', 'Retirer de la liste', 'Vider', 'Enregistrer dans', 'Choisir un dossier', 'Choisissez le dossier de cette liste', 'Télécharger en', 'Miniature', 'Qualité max', 'Max', (f) => `Audio seul, en ${f} (comme dans Options)`, 'Langue de la vidéo', (n) => `${n} en erreur (laissés de côté)`, (n) => n ? `Télécharger ${n}` : 'Télécharger', (n, d) => `${n} ${n === 1 ? 'téléchargement' : 'téléchargements'} vers ${d}`],
    de: ['Linkliste', 'Mehrere Videos auf einmal, alle in einen Ordner', 'Linkliste', 'Links hier einfügen, einer pro Zeile (Enter fügt hinzu)', 'Oben Links einfügen. Jedes Video erscheint hier mit Name und Vorschaubild, bevor es geladen wird.', 'Aus der Liste entfernen', 'Leeren', 'Speichern in', 'Ordner wählen', 'Ordner für diese Liste wählen', 'Laden als', 'Vorschaubild', 'Maximale Qualität', 'Max', (f) => `Nur Ton, als ${f} (wie in Optionen)`, 'Sprache des Videos', (n) => `${n} mit Fehler (ausgelassen)`, (n) => n ? `${n} laden` : 'Laden', (n, d) => `${n} ${n === 1 ? 'Download' : 'Downloads'} nach ${d}`],
    it: ['Lista di link', 'Più video insieme, tutti in una cartella', 'Lista di link', 'Incolla i link qui, uno per riga (Invio aggiunge)', 'Incolla i link sopra. Ogni video appare qui con nome e miniatura prima di scaricarlo.', 'Togli dalla lista', 'Svuota', 'Salva in', 'Scegli cartella', 'Scegli la cartella di questa lista', 'Scarica come', 'Miniatura', 'Qualità massima', 'Max', (f) => `Solo audio, in ${f} (come nelle Opzioni)`, 'Lingua del video', (n) => `${n} con errore (esclusi)`, (n) => n ? `Scarica ${n}` : 'Scarica', (n, d) => `${n} ${n === 1 ? 'download' : 'download'} verso ${d}`],
    ru: ['Список ссылок', 'Много видео сразу, в одну папку', 'Список ссылок', 'Вставьте ссылки сюда, по одной в строке (Enter добавляет)', 'Вставьте ссылки выше. Каждое видео появится здесь с названием и превью до загрузки.', 'Убрать из списка', 'Очистить', 'Сохранить в', 'Выбрать папку', 'Выберите папку для этого списка', 'Скачать как', 'Превью', 'Макс. качество', 'Макс.', (f) => `Только звук, в ${f} (как в настройках)`, 'Язык видео', (n) => `С ошибкой: ${n} (пропущены)`, (n) => n ? `Скачать: ${n}` : 'Скачать', (n, d) => `Загрузок: ${n} → ${d}`],
    ja: ['リンクリスト', '複数の動画をまとめて1つのフォルダへ', 'リンクリスト', 'ここにリンクを貼り付け（1行に1つ、Enterで追加）', '上にリンクを貼り付けると、ダウンロード前に名前とサムネイルがここに表示されます。', 'リストから外す', 'クリア', '保存先', 'フォルダを選択', 'このリストのフォルダを選んでください', '形式', 'サムネイル', '最高画質', '最高', (f) => `音声のみ（${f}、オプションと同じ）`, '動画の言語', (n) => `エラー ${n} 件（除外）`, (n) => n ? `${n} 件をダウンロード` : 'ダウンロード', (n, d) => `${n} 件を ${d} へダウンロード`],
    ko: ['링크 목록', '여러 영상을 한 번에, 한 폴더로', '링크 목록', '여기에 링크를 붙여넣기 (한 줄에 하나, Enter로 추가)', '위에 링크를 붙여넣으면 다운로드 전에 이름과 썸네일이 여기 표시됩니다.', '목록에서 빼기', '비우기', '저장 위치', '폴더 선택', '이 목록의 폴더를 선택하세요', '받을 형식', '썸네일', '최고 화질', '최고', (f) => `소리만, ${f} (옵션과 같음)`, '영상 언어', (n) => `오류 ${n}개 (제외)`, (n) => n ? `${n}개 다운로드` : '다운로드', (n, d) => `${n}개를 ${d}(으)로 다운로드`],
    zh: ['链接列表', '一次下载多个视频，全部放进一个文件夹', '链接列表', '在此粘贴链接，每行一个（回车添加）', '在上方粘贴链接，下载前每个视频会在这里显示名称和缩略图。', '从列表移除', '清空', '保存到', '选择文件夹', '请为此列表选择文件夹', '下载为', '缩略图', '最高画质', '最高', (f) => `仅音频，${f}（与选项相同）`, '视频语言', (n) => `${n} 个出错（已排除）`, (n) => n ? `下载 ${n} 个` : '下载', (n, d) => `${n} 个下载 → ${d}`],
  };
  Object.entries(T).forEach(([lang, v]) => { const L = window.MEC_I18N[lang]; if (L) K.forEach((k, i) => { L[k] = v[i]; }); });
})();
// Apagar o original
(() => {
  const T = {
    en: (f) => `Couldn't move ${f} to the Recycle Bin (another program is using it). The new file was saved.`,
    pt: (f) => `Não deu para mandar ${f} para a Lixeira (outro programa está usando o arquivo). O arquivo novo foi salvo.`,
    es: (f) => `No se pudo enviar ${f} a la Papelera (otro programa lo está usando). El archivo nuevo se guardó.`,
    fr: (f) => `Impossible de mettre ${f} à la Corbeille (un autre programme l’utilise). Le nouveau fichier est enregistré.`,
    de: (f) => `${f} konnte nicht in den Papierkorb (ein anderes Programm nutzt die Datei). Die neue Datei ist gespeichert.`,
    it: (f) => `Impossibile spostare ${f} nel cestino (un altro programma lo sta usando). Il nuovo file è stato salvato.`,
    ru: (f) => `Не удалось переместить ${f} в корзину (файл занят другой программой). Новый файл сохранён.`,
    ja: (f) => `${f} をごみ箱に移動できませんでした（別のプログラムが使用中）。新しいファイルは保存されました。`,
    ko: (f) => `${f}을(를) 휴지통으로 옮기지 못했습니다(다른 프로그램이 사용 중). 새 파일은 저장되었습니다.`,
    zh: (f) => `无法将 ${f} 移到回收站（其他程序正在使用）。新文件已保存。`,
  };
  Object.entries(T).forEach(([lang, v]) => { const L = window.MEC_I18N[lang]; if (L) L.deleteFailed = v; });
})();
// Lista de links avançada: grupos, nomes, renomear vários
(() => {
  const K = ['lsGroupNew', 'lsGroupAdd', 'lsGroupDel', 'lsGroupDelAsk', 'lsGroupName', 'lsGroupPh', 'lsSubfolder', 'lsSubPh', 'lsSubNone', 'lsNameCap', 'lsStart', 'lsEnd', 'lsUseGroupName', 'lsTplLink',
    'lsRenameTip', 'lsSelN', 'lsSelAll', 'lsRename', 'lsRemoveSel', 'lsRenameN', 'lsApply', 'lsReplace', 'lsFind', 'lsReplWith', 'lsNumber', 'lsGoGroup', 'lsGoAll',
    'nmTitle', 'nmSub', 'nmReset', 'nmExample', 'nmTagTip'];
  const tips = (u, t, i, s, d, q) => ({ user: u, title: t, id: i, site: s, date: d, quality: q });
  const T = {
    en: [(n) => `Group ${n}`, 'New group', 'Delete group', (g, n) => `Delete the group "${g}" and its ${n} link${n === 1 ? '' : 's'}?`, 'Group name', 'e.g. Memes', 'Subfolder', 'e.g. tony_stark', 'none', 'File name', 'Start', 'End', 'Use the group name', (t) => `Name model: ${t} · change`,
      'Double-click or F2 to rename', (n) => `${n} selected`, 'Select all', 'Rename', 'Remove', (n) => `Rename ${n} ${n === 1 ? 'video' : 'videos'}`, 'Apply', 'Replace', 'find', 'replace with', 'Number', (g, n) => n ? `Download ${g} (${n})` : `Download ${g}`, (n) => `Download all (${n})`,
      'File name', 'Model for every download. Empty tags disappear along with their separator.', 'Default', 'Example:', tips('@ of the profile', 'Video title (up to 80 characters)', 'End of the link (video id)', 'Site', 'Post date', 'Quality, e.g. 1080p')],
    pt: [(n) => `Grupo ${n}`, 'Novo grupo', 'Apagar grupo', (g, n) => `Apagar o grupo "${g}" e ${n === 1 ? 'o link' : `os ${n} links`} dele?`, 'Nome do grupo', 'ex.: Memes', 'Subpasta', 'ex.: tony_stark', 'nenhuma', 'Nome do arquivo', 'Começo', 'Fim', 'Usar o nome do grupo', (t) => `Modelo do nome: ${t} · mudar`,
      'Clique duplo ou F2 para renomear', (n) => `${n} ${n === 1 ? 'selecionado' : 'selecionados'}`, 'Selecionar todos', 'Renomear', 'Tirar', (n) => `Renomear ${n} ${n === 1 ? 'vídeo' : 'vídeos'}`, 'Aplicar', 'Trocar', 'procurar', 'trocar por', 'Numerar', (g, n) => n ? `Baixar ${g} (${n})` : `Baixar ${g}`, (n) => `Baixar todos (${n})`,
      'Nome do arquivo', 'Modelo de todo download. Etiqueta vazia some junto com o separador.', 'Padrão', 'Exemplo:', tips('@ do perfil', 'Título do vídeo (até 80 caracteres)', 'Final do link (id do vídeo)', 'Site', 'Data do post', 'Qualidade, ex.: 1080p')],
    es: [(n) => `Grupo ${n}`, 'Nuevo grupo', 'Borrar grupo', (g, n) => `¿Borrar el grupo "${g}" y sus ${n} enlaces?`, 'Nombre del grupo', 'ej.: Memes', 'Subcarpeta', 'ej.: tony_stark', 'ninguna', 'Nombre del archivo', 'Inicio', 'Final', 'Usar el nombre del grupo', (t) => `Modelo del nombre: ${t} · cambiar`,
      'Doble clic o F2 para renombrar', (n) => `${n} seleccionados`, 'Seleccionar todo', 'Renombrar', 'Quitar', (n) => `Renombrar ${n} videos`, 'Aplicar', 'Reemplazar', 'buscar', 'reemplazar por', 'Numerar', (g, n) => n ? `Descargar ${g} (${n})` : `Descargar ${g}`, (n) => `Descargar todo (${n})`,
      'Nombre del archivo', 'Modelo para cada descarga. Una etiqueta vacía desaparece con su separador.', 'Predeterminado', 'Ejemplo:', tips('@ del perfil', 'Título del video (hasta 80 caracteres)', 'Final del enlace (id)', 'Sitio', 'Fecha', 'Calidad, ej.: 1080p')],
    fr: [(n) => `Groupe ${n}`, 'Nouveau groupe', 'Supprimer le groupe', (g, n) => `Supprimer le groupe « ${g} » et ses ${n} liens ?`, 'Nom du groupe', 'ex. : Memes', 'Sous-dossier', 'ex. : tony_stark', 'aucun', 'Nom du fichier', 'Début', 'Fin', 'Utiliser le nom du groupe', (t) => `Modèle du nom : ${t} · modifier`,
      'Double-clic ou F2 pour renommer', (n) => `${n} sélectionné(s)`, 'Tout sélectionner', 'Renommer', 'Retirer', (n) => `Renommer ${n} vidéo(s)`, 'Appliquer', 'Remplacer', 'chercher', 'remplacer par', 'Numéroter', (g, n) => n ? `Télécharger ${g} (${n})` : `Télécharger ${g}`, (n) => `Tout télécharger (${n})`,
      'Nom du fichier', 'Modèle pour chaque téléchargement. Une étiquette vide disparaît avec son séparateur.', 'Par défaut', 'Exemple :', tips('@ du profil', 'Titre de la vidéo (80 caractères max.)', 'Fin du lien (id)', 'Site', 'Date', 'Qualité, ex. : 1080p')],
    de: [(n) => `Gruppe ${n}`, 'Neue Gruppe', 'Gruppe löschen', (g, n) => `Gruppe „${g}“ mit ${n} Links löschen?`, 'Gruppenname', 'z. B. Memes', 'Unterordner', 'z. B. tony_stark', 'keiner', 'Dateiname', 'Anfang', 'Ende', 'Gruppennamen verwenden', (t) => `Namensmuster: ${t} · ändern`,
      'Doppelklick oder F2 zum Umbenennen', (n) => `${n} ausgewählt`, 'Alle auswählen', 'Umbenennen', 'Entfernen', (n) => `${n} Videos umbenennen`, 'Anwenden', 'Ersetzen', 'suchen', 'ersetzen durch', 'Nummerieren', (g, n) => n ? `${g} laden (${n})` : `${g} laden`, (n) => `Alle laden (${n})`,
      'Dateiname', 'Muster für jeden Download. Leere Platzhalter verschwinden samt Trennzeichen.', 'Standard', 'Beispiel:', tips('@ des Profils', 'Videotitel (bis 80 Zeichen)', 'Ende des Links (ID)', 'Seite', 'Datum', 'Qualität, z. B. 1080p')],
    it: [(n) => `Gruppo ${n}`, 'Nuovo gruppo', 'Elimina gruppo', (g, n) => `Eliminare il gruppo "${g}" e i suoi ${n} link?`, 'Nome del gruppo', 'es.: Memes', 'Sottocartella', 'es.: tony_stark', 'nessuna', 'Nome del file', 'Inizio', 'Fine', 'Usa il nome del gruppo', (t) => `Modello del nome: ${t} · cambia`,
      'Doppio clic o F2 per rinominare', (n) => `${n} selezionati`, 'Seleziona tutti', 'Rinomina', 'Togli', (n) => `Rinomina ${n} video`, 'Applica', 'Sostituisci', 'cerca', 'sostituisci con', 'Numera', (g, n) => n ? `Scarica ${g} (${n})` : `Scarica ${g}`, (n) => `Scarica tutto (${n})`,
      'Nome del file', 'Modello per ogni download. Un tag vuoto sparisce con il suo separatore.', 'Predefinito', 'Esempio:', tips('@ del profilo', 'Titolo del video (fino a 80 caratteri)', 'Fine del link (id)', 'Sito', 'Data', 'Qualità, es.: 1080p')],
    ru: [(n) => `Группа ${n}`, 'Новая группа', 'Удалить группу', (g, n) => `Удалить группу «${g}» и её ссылки (${n})?`, 'Название группы', 'напр.: Memes', 'Подпапка', 'напр.: tony_stark', 'нет', 'Имя файла', 'Начало', 'Конец', 'Взять название группы', (t) => `Шаблон имени: ${t} · изменить`,
      'Двойной щелчок или F2 — переименовать', (n) => `Выбрано: ${n}`, 'Выбрать все', 'Переименовать', 'Убрать', (n) => `Переименовать: ${n}`, 'Применить', 'Заменить', 'найти', 'заменить на', 'Нумеровать', (g, n) => n ? `Скачать ${g} (${n})` : `Скачать ${g}`, (n) => `Скачать все (${n})`,
      'Имя файла', 'Шаблон для всех загрузок. Пустая метка исчезает вместе с разделителем.', 'По умолчанию', 'Пример:', tips('@ профиля', 'Название видео (до 80 символов)', 'Конец ссылки (id)', 'Сайт', 'Дата', 'Качество, напр. 1080p')],
    ja: [(n) => `グループ ${n}`, '新しいグループ', 'グループを削除', (g, n) => `グループ「${g}」と ${n} 件のリンクを削除しますか？`, 'グループ名', '例: Memes', 'サブフォルダ', '例: tony_stark', 'なし', 'ファイル名', '先頭', '末尾', 'グループ名を使う', (t) => `名前の形式: ${t} · 変更`,
      'ダブルクリックまたは F2 で名前を変更', (n) => `${n} 件選択`, 'すべて選択', '名前を変更', '外す', (n) => `${n} 件の名前を変更`, '適用', '置換', '検索', '置換後', '連番', (g, n) => n ? `${g} をダウンロード (${n})` : `${g} をダウンロード`, (n) => `すべてダウンロード (${n})`,
      'ファイル名', 'すべてのダウンロードの形式。空のタグは区切りごと消えます。', '既定', '例:', tips('プロフィールの @', '動画のタイトル（80文字まで）', 'リンクの末尾（ID）', 'サイト', '投稿日', '画質（例: 1080p）')],
    ko: [(n) => `그룹 ${n}`, '새 그룹', '그룹 삭제', (g, n) => `"${g}" 그룹과 링크 ${n}개를 삭제할까요?`, '그룹 이름', '예: Memes', '하위 폴더', '예: tony_stark', '없음', '파일 이름', '앞', '뒤', '그룹 이름 사용', (t) => `이름 형식: ${t} · 변경`,
      '더블클릭 또는 F2로 이름 바꾸기', (n) => `${n}개 선택됨`, '모두 선택', '이름 바꾸기', '빼기', (n) => `${n}개 이름 바꾸기`, '적용', '바꾸기', '찾기', '바꿀 내용', '번호 붙이기', (g, n) => n ? `${g} 다운로드 (${n})` : `${g} 다운로드`, (n) => `모두 다운로드 (${n})`,
      '파일 이름', '모든 다운로드의 형식. 빈 태그는 구분자와 함께 사라집니다.', '기본값', '예:', tips('프로필 @', '영상 제목 (최대 80자)', '링크 끝 (ID)', '사이트', '게시 날짜', '화질, 예: 1080p')],
    zh: [(n) => `分组 ${n}`, '新建分组', '删除分组', (g, n) => `删除分组“${g}”及其 ${n} 个链接？`, '分组名称', '例如：Memes', '子文件夹', '例如：tony_stark', '无', '文件名', '开头', '结尾', '使用分组名称', (t) => `命名格式：${t} · 修改`,
      '双击或按 F2 重命名', (n) => `已选 ${n} 个`, '全选', '重命名', '移除', (n) => `重命名 ${n} 个视频`, '应用', '替换', '查找', '替换为', '编号', (g, n) => n ? `下载 ${g}（${n}）` : `下载 ${g}`, (n) => `全部下载（${n}）`,
      '文件名', '所有下载使用的格式。空标签会连同分隔符一起去掉。', '默认', '示例：', tips('账号 @', '视频标题（最多 80 字）', '链接末尾（ID）', '网站', '发布日期', '画质，例如 1080p')],
  };
  Object.entries(T).forEach(([lang, v]) => { const L = window.MEC_I18N[lang]; if (L) K.forEach((k, i) => { L[k] = v[i]; }); });
})();
// Renomear com várias agulhas + prefixo/sufixo do grupo
(() => {
  const K = ['mcEditing', 'mcKeys', 'lsSubFor', 'lsPrefix', 'lsSuffix', 'lsGroupTag', 'lsGroupTagTip', 'lsFxHint'];
  const kb = (s) => s.replace(/\[([^\]]+)\]/g, '<kbd>$1</kbd>');
  const T = {
    en: [(n) => `Renaming ${n} ${n === 1 ? 'name' : 'names'}`, kb('[Enter] save · [Esc] cancel · [Ctrl]+[←→] words · [Shift] select'), (n) => `Subfolder for ${n}`, 'Prefix', 'Suffix', '{group}', 'Insert the group name', 'Goes before/after the name of every video in this group. {group} becomes the group name.'],
    pt: [(n) => `Renomeando ${n} ${n === 1 ? 'nome' : 'nomes'}`, kb('[Enter] salva · [Esc] cancela · [Ctrl]+[←→] palavras · [Shift] seleciona'), (n) => `Subpasta para ${n}`, 'Prefixo', 'Sufixo', '{grupo}', 'Inserir o nome do grupo', 'Entra antes/depois do nome de todos os vídeos deste grupo. {grupo} vira o nome do grupo.'],
    es: [(n) => `Renombrando ${n}`, kb('[Enter] guarda · [Esc] cancela · [Ctrl]+[←→] palabras · [Shift] selecciona'), (n) => `Subcarpeta para ${n}`, 'Prefijo', 'Sufijo', '{group}', 'Insertar el nombre del grupo', 'Va antes/después del nombre de todos los videos del grupo. {group} es el nombre del grupo.'],
    fr: [(n) => `Renommage de ${n}`, kb('[Entrée] enregistre · [Échap] annule · [Ctrl]+[←→] mots · [Maj] sélection'), (n) => `Sous-dossier pour ${n}`, 'Préfixe', 'Suffixe', '{group}', 'Insérer le nom du groupe', 'S’ajoute avant/après le nom de chaque vidéo du groupe. {group} devient le nom du groupe.'],
    de: [(n) => `${n} Namen umbenennen`, kb('[Enter] speichern · [Esc] abbrechen · [Strg]+[←→] Wörter · [Umschalt] auswählen'), (n) => `Unterordner für ${n}`, 'Präfix', 'Suffix', '{group}', 'Gruppennamen einfügen', 'Steht vor/nach dem Namen jedes Videos der Gruppe. {group} wird zum Gruppennamen.'],
    it: [(n) => `Rinomina di ${n}`, kb('[Invio] salva · [Esc] annulla · [Ctrl]+[←→] parole · [Maiusc] seleziona'), (n) => `Sottocartella per ${n}`, 'Prefisso', 'Suffisso', '{group}', 'Inserisci il nome del gruppo', 'Va prima/dopo il nome di ogni video del gruppo. {group} diventa il nome del gruppo.'],
    ru: [(n) => `Переименование: ${n}`, kb('[Enter] сохранить · [Esc] отмена · [Ctrl]+[←→] слова · [Shift] выделить'), (n) => `Подпапка для ${n}`, 'Префикс', 'Суффикс', '{group}', 'Вставить название группы', 'Добавляется до/после имени каждого видео группы. {group} — название группы.'],
    ja: [(n) => `${n} 件の名前を編集中`, kb('[Enter] 保存 · [Esc] 取消 · [Ctrl]+[←→] 単語 · [Shift] 選択'), (n) => `${n} 件のサブフォルダ`, '接頭辞', '接尾辞', '{group}', 'グループ名を挿入', 'このグループのすべての動画名の前/後に付きます。{group} はグループ名になります。'],
    ko: [(n) => `이름 ${n}개 편집 중`, kb('[Enter] 저장 · [Esc] 취소 · [Ctrl]+[←→] 단어 · [Shift] 선택'), (n) => `${n}개의 하위 폴더`, '접두사', '접미사', '{group}', '그룹 이름 넣기', '이 그룹 모든 영상 이름의 앞/뒤에 붙습니다. {group}은 그룹 이름이 됩니다.'],
    zh: [(n) => `正在重命名 ${n} 个`, kb('[Enter] 保存 · [Esc] 取消 · [Ctrl]+[←→] 按词 · [Shift] 选择'), (n) => `${n} 个的子文件夹`, '前缀', '后缀', '{group}', '插入分组名称', '加在本组每个视频名称的前/后。{group} 会变成分组名称。'],
  };
  Object.entries(T).forEach(([lang, v]) => { const L = window.MEC_I18N[lang]; if (L) K.forEach((k, i) => { L[k] = v[i]; }); });
})();
// Lista de links: copiar links dos selecionados
(() => {
  const T = { en: ['Copy links', (n) => `${n} links copied`], pt: ['Copiar links', (n) => `${n} links copiados`], es: ['Copiar enlaces', (n) => `${n} enlaces copiados`],
    fr: ['Copier les liens', (n) => `${n} liens copiés`], de: ['Links kopieren', (n) => `${n} Links kopiert`], it: ['Copia link', (n) => `${n} link copiati`],
    ru: ['Копировать ссылки', (n) => `Скопировано ссылок: ${n}`], ja: ['リンクをコピー', (n) => `${n} 件のリンクをコピーしました`], ko: ['링크 복사', (n) => `링크 ${n}개 복사됨`], zh: ['复制链接', (n) => `已复制 ${n} 个链接`] };
  Object.entries(T).forEach(([lang, [a, b]]) => { const L = window.MEC_I18N[lang]; if (L) Object.assign(L, { lsCopyLinks: a, lsLinksCopied: b }); });
})();
// Lista de links: tirar e desfazer
(() => {
  const T = {
    en: [(n) => `${n} ${n === 1 ? 'video' : 'videos'} removed from the list · Ctrl+Shift+Z to undo`, (n) => `${n} ${n === 1 ? 'video' : 'videos'} back on the list`],
    pt: [(n) => `${n} ${n === 1 ? 'vídeo tirado' : 'vídeos tirados'} da lista · Ctrl+Shift+Z desfaz`, (n) => `${n} ${n === 1 ? 'vídeo voltou' : 'vídeos voltaram'} para a lista`],
    es: [(n) => `${n} quitado(s) de la lista · Ctrl+Shift+Z deshace`, (n) => `${n} de vuelta en la lista`],
    fr: [(n) => `${n} retiré(s) de la liste · Ctrl+Maj+Z pour annuler`, (n) => `${n} remis dans la liste`],
    de: [(n) => `${n} aus der Liste entfernt · Strg+Umschalt+Z macht rückgängig`, (n) => `${n} wieder in der Liste`],
    it: [(n) => `${n} tolto/i dalla lista · Ctrl+Maiusc+Z annulla`, (n) => `${n} di nuovo nella lista`],
    ru: [(n) => `Убрано из списка: ${n} · Ctrl+Shift+Z — вернуть`, (n) => `Возвращено в список: ${n}`],
    ja: [(n) => `${n} 件をリストから外しました · Ctrl+Shift+Z で元に戻す`, (n) => `${n} 件をリストに戻しました`],
    ko: [(n) => `목록에서 ${n}개 뺌 · Ctrl+Shift+Z로 되돌리기`, (n) => `${n}개를 목록에 되돌림`],
    zh: [(n) => `已从列表移除 ${n} 个 · Ctrl+Shift+Z 撤销`, (n) => `已恢复 ${n} 个到列表`],
  };
  Object.entries(T).forEach(([lang, [a, b]]) => { const L = window.MEC_I18N[lang]; if (L) Object.assign(L, { lsRemoved: a, lsRestored: b }); });
})();
// Lista de links: repetidos
(() => {
  const T = {
    en: ['Duplicate', (n) => `${n} duplicate ${n === 1 ? 'video' : 'videos'} in this list`, 'Select', 'Remove duplicates'],
    pt: ['Repetido', (n) => `${n} ${n === 1 ? 'vídeo repetido' : 'vídeos repetidos'} nesta lista`, 'Selecionar', 'Remover repetidos'],
    es: ['Repetido', (n) => `${n} video(s) repetido(s) en esta lista`, 'Seleccionar', 'Quitar repetidos'],
    fr: ['Doublon', (n) => `${n} doublon(s) dans cette liste`, 'Sélectionner', 'Retirer les doublons'],
    de: ['Doppelt', (n) => `${n} doppelte(s) Video(s) in dieser Liste`, 'Auswählen', 'Doppelte entfernen'],
    it: ['Doppione', (n) => `${n} video doppi in questa lista`, 'Seleziona', 'Togli i doppioni'],
    ru: ['Повтор', (n) => `Повторов в списке: ${n}`, 'Выбрать', 'Убрать повторы'],
    ja: ['重複', (n) => `このリストに重複が ${n} 件あります`, '選択', '重複を外す'],
    ko: ['중복', (n) => `이 목록에 중복 영상 ${n}개`, '선택', '중복 빼기'],
    zh: ['重复', (n) => `此列表中有 ${n} 个重复视频`, '选择', '移除重复'],
  };
  Object.entries(T).forEach(([lang, [a, b, c, d]]) => { const L = window.MEC_I18N[lang]; if (L) Object.assign(L, { lsDupBadge: a, lsDupMsg: b, lsDupSel: c, lsDupRm: d }); });
})();
