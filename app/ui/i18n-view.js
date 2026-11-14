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
