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
