// Textos do motor do player (selo de tempo no Cortador), nos 10 idiomas.
(() => {
  const T = {
    en: ['Engine', 'GPU', 'CPU', (n) => `${n} ${n === 1 ? 'frame' : 'frames'} read`],
    pt: ['Motor', 'placa de vídeo', 'processador', (n) => `${n} ${n === 1 ? 'quadro lido' : 'quadros lidos'}`],
    es: ['Motor', 'GPU', 'CPU', (n) => `${n} ${n === 1 ? 'fotograma leído' : 'fotogramas leídos'}`],
    fr: ['Moteur', 'GPU', 'CPU', (n) => `${n} ${n === 1 ? 'image lue' : 'images lues'}`],
    de: ['Engine', 'GPU', 'CPU', (n) => `${n} ${n === 1 ? 'Bild gelesen' : 'Bilder gelesen'}`],
    it: ['Motore', 'GPU', 'CPU', (n) => `${n} ${n === 1 ? 'fotogramma letto' : 'fotogrammi letti'}`],
    ru: ['Движок', 'GPU', 'CPU', (n) => `кадров прочитано: ${n}`],
    ja: ['エンジン', 'GPU', 'CPU', (n) => `${n} フレーム読み込み`],
    ko: ['엔진', 'GPU', 'CPU', (n) => `${n}프레임 읽음`],
    zh: ['引擎', 'GPU', 'CPU', (n) => `已读取 ${n} 帧`],
  };
  Object.entries(T).forEach(([lang, [viewEngine, viewGpu, viewCpu, viewFrames]]) => {
    const L = window.MEC_I18N[lang]; if (L) Object.assign(L, { viewEngine, viewGpu, viewCpu, viewFrames });
  });
})();
