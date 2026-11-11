// Textos do GIF (preset que transforma vídeo em GIF), nos 10 idiomas. Entram por cima de cada idioma.
(() => {
  const T = {
    en: { newGifPreset: 'New GIF preset', gifDesc: 'video to GIF, no sound', gifWidth: 'Width', gifHigh: 'High', gifSmall: 'Light', gifRepeat: 'Loop',
      gifHint: 'GIF has no sound. With cuts, only the cuts become GIF (joined, they make a single GIF).', errs: { 'no-video': 'This file has no video to turn into a GIF.' } },
    pt: { newGifPreset: 'Novo preset de GIF', gifDesc: 'vídeo vira GIF, sem som', gifWidth: 'Largura', gifHigh: 'Alta', gifSmall: 'Leve', gifRepeat: 'Repetir',
      gifHint: 'GIF não tem som. Com cortes, só os trechos viram GIF (juntos, saem num GIF só).', errs: { 'no-video': 'Este arquivo não tem vídeo para virar GIF.' } },
    es: { newGifPreset: 'Nuevo preset de GIF', gifDesc: 'video a GIF, sin sonido', gifWidth: 'Ancho', gifHigh: 'Alta', gifSmall: 'Ligera', gifRepeat: 'Repetir',
      gifHint: 'El GIF no tiene sonido. Con cortes, solo los tramos se vuelven GIF (unidos, salen en un solo GIF).', errs: { 'no-video': 'Este archivo no tiene video para convertir en GIF.' } },
    fr: { newGifPreset: 'Nouveau préréglage GIF', gifDesc: 'vidéo en GIF, sans son', gifWidth: 'Largeur', gifHigh: 'Haute', gifSmall: 'Légère', gifRepeat: 'En boucle',
      gifHint: 'Le GIF n’a pas de son. Avec des coupes, seuls les extraits deviennent un GIF (assemblés, ils font un seul GIF).', errs: { 'no-video': 'Ce fichier n’a pas de vidéo à transformer en GIF.' } },
    de: { newGifPreset: 'Neues GIF-Preset', gifDesc: 'Video zu GIF, ohne Ton', gifWidth: 'Breite', gifHigh: 'Hoch', gifSmall: 'Leicht', gifRepeat: 'Wiederholen',
      gifHint: 'GIFs haben keinen Ton. Mit Schnitten werden nur die Abschnitte zum GIF (zusammengefügt ergeben sie ein GIF).', errs: { 'no-video': 'Diese Datei hat kein Video, das zum GIF werden kann.' } },
    it: { newGifPreset: 'Nuovo preset GIF', gifDesc: 'video in GIF, senza audio', gifWidth: 'Larghezza', gifHigh: 'Alta', gifSmall: 'Leggera', gifRepeat: 'Ripeti',
      gifHint: 'La GIF non ha audio. Con i tagli, solo i tratti diventano GIF (uniti, escono in una sola GIF).', errs: { 'no-video': 'Questo file non ha un video da trasformare in GIF.' } },
    ru: { newGifPreset: 'Новый пресет GIF', gifDesc: 'видео в GIF, без звука', gifWidth: 'Ширина', gifHigh: 'Высокое', gifSmall: 'Лёгкое', gifRepeat: 'Повтор',
      gifHint: 'В GIF нет звука. С обрезкой в GIF попадают только фрагменты (склеенные — в один GIF).', errs: { 'no-video': 'В этом файле нет видео для GIF.' } },
    ja: { newGifPreset: '新しい GIF プリセット', gifDesc: '動画を GIF に（音声なし）', gifWidth: '幅', gifHigh: '高画質', gifSmall: '軽量', gifRepeat: 'ループ',
      gifHint: 'GIF には音声がありません。カットがある場合はその区間だけが GIF になります（結合すると 1 つの GIF）。', errs: { 'no-video': 'このファイルには GIF にできる映像がありません。' } },
    ko: { newGifPreset: '새 GIF 프리셋', gifDesc: '동영상을 GIF로, 소리 없음', gifWidth: '너비', gifHigh: '높음', gifSmall: '가볍게', gifRepeat: '반복',
      gifHint: 'GIF에는 소리가 없습니다. 컷이 있으면 그 구간만 GIF가 됩니다(합치면 GIF 하나로).', errs: { 'no-video': '이 파일에는 GIF로 만들 영상이 없습니다.' } },
    zh: { newGifPreset: '新建 GIF 预设', gifDesc: '视频转 GIF，无声音', gifWidth: '宽度', gifHigh: '高', gifSmall: '轻量', gifRepeat: '循环',
      gifHint: 'GIF 没有声音。有剪切时，只有这些片段会变成 GIF（合并后为一个 GIF）。', errs: { 'no-video': '这个文件没有可以转成 GIF 的视频。' } },
  };
  const all = window.MEC_I18N;
  Object.entries(T).forEach(([lang, t]) => {
    const L = all[lang]; if (!L) return;
    const { errs, ...rest } = t;
    Object.assign(L, rest);
    L.errs = Object.assign({}, L.errs, errs);
  });
})();
