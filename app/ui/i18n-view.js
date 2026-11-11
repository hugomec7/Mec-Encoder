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
