"""Gera app/ui/news.js (janela de Novidades) a partir das notas de versão. Rode antes de cada release:
python docs/release-notes/make_news.py"""
import json, pathlib, re

here = pathlib.Path(__file__).resolve().parent
def key(p): return tuple(int(x) for x in p.stem.split('.'))
notes = sorted((p for p in here.glob('*.md') if re.fullmatch(r'\d+\.\d+\.\d+', p.stem)), key=key, reverse=True)[:8]
out = []
for p in notes:
    lang, item = None, {'version': p.stem, 'en': [], 'pt': []}
    for line in p.read_text(encoding='utf-8').splitlines():
        s = line.strip()
        if s.startswith('**English**'): lang = 'en'
        elif s.startswith('**Português**'): lang = 'pt'
        elif s.startswith('- ') and lang: item[lang].append(s[2:])
    out.append(item)
js = '// Gerado por docs/release-notes/make_news.py — não edite à mão.\nwindow.MEC_NEWS = ' + json.dumps(out, ensure_ascii=False, indent=1) + ';\n'
(here.parent.parent / 'app' / 'ui' / 'news.js').write_text(js, encoding='utf-8')
print('news.js:', ', '.join(i['version'] for i in out))
