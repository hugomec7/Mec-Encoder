"""Gera app/ui/news.js (janela de Novidades) a partir das notas de versão. Rode antes de cada release:
python docs/release-notes/make_news.py

A janela de Novidades mostra só a versão em uso, curta. O texto dela vem do bloco escondido no topo das notas
(o GitHub não mostra comentários):

<!-- app
! en | Firefox extension | Copy the video link and click the extension. | firefox
! pt | Extensão para o Firefox | Copie o link do vídeo e clique na extensão. | firefox
- en | One short line per change.
- pt | Uma linha curta por mudança.
-->

"!" = novidade principal (card grande no topo): idioma | título | texto | ação (opcional: "firefox" mostra o botão
Instalar extensão). "-" = item da lista. Sem o bloco, a janela usa as listas **English** / **Português** inteiras.
"""
import json, pathlib, re

here = pathlib.Path(__file__).resolve().parent
def key(p): return tuple(int(x) for x in p.stem.split('.'))
notes = sorted((p for p in here.glob('*.md') if re.fullmatch(r'\d+\.\d+\.\d+', p.stem)), key=key, reverse=True)[:8]
out = []
for p in notes:
    text = p.read_text(encoding='utf-8')
    lang, item = None, {'version': p.stem, 'en': [], 'pt': []}
    block = re.search(r'<!--\s*app\s*\n(.*?)-->', text, re.S)
    if block:
        hl, app = {}, {'en': [], 'pt': []}
        for line in block.group(1).splitlines():
            parts = [x.strip() for x in line.strip().split('|')]
            if len(parts) < 2 or parts[0][:1] not in '!-': continue
            kind, lg = parts[0][:1], parts[0][1:].strip()
            if kind == '!':
                hl[lg] = {'title': parts[1], 'text': parts[2] if len(parts) > 2 else '', 'action': parts[3] if len(parts) > 3 else ''}
            elif lg in app:
                app[lg].append('|'.join(parts[1:]).strip())
        if hl: item['hl'] = hl
        item['app'] = app
        text = text.replace(block.group(0), '')
    for line in text.splitlines():
        s = line.strip()
        if s.startswith('**English**'): lang = 'en'
        elif s.startswith('**Português**'): lang = 'pt'
        elif s.startswith('- ') and lang: item[lang].append(s[2:])
    out.append(item)
js = '// Gerado por docs/release-notes/make_news.py — não edite à mão.\nwindow.MEC_NEWS = ' + json.dumps(out, ensure_ascii=False, indent=1) + ';\n'
(here.parent.parent / 'app' / 'ui' / 'news.js').write_text(js, encoding='utf-8')
print('news.js:', ', '.join(i['version'] + (' (resumo)' if 'app' in i else '') for i in out))
