"""Confere a transmissão do play do motor (mecview serve): trechos, velocidade, para trás, quadros
idênticos ao FFmpeg (lendo do começo) e som sem buracos. Uso: python test_play.py <mecview> <ffmpeg> <pasta>"""
import os, socket, struct, subprocess, sys, threading, time, urllib.parse

exe, ffmpeg, tmp = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(tmp, exist_ok=True)
path = os.path.join(tmp, 'av.mp4')
subprocess.run([ffmpeg, '-v', 'error', '-y', '-f', 'lavfi', '-i', 'testsrc2=s=640x360:r=30', '-f', 'lavfi', '-i', 'sine=f=440:r=44100',
                '-t', '8', '-c:v', 'libx264', '-preset', 'ultrafast', '-g', '30', '-c:a', 'aac', '-shortest', path], check=True)
VF = 'scale=w=320:h=320:force_original_aspect_ratio=decrease:flags=bilinear'

p = subprocess.Popen([exe], stdin=subprocess.PIPE, stdout=subprocess.PIPE)
p.stdin.write(b'serve\n'); p.stdin.flush()
_, port, token = p.stdout.readline().decode().split()
port = int(port)

def stream(parts='', rate=1, dir=1, limit=None):
    q = urllib.parse.urlencode({'token': token, 'path': path, 'parts': parts, 'vf': VF, 'hw': 1, 'rate': rate, 'dir': dir, 'audio': 1})
    s = socket.create_connection(('127.0.0.1', port))
    s.sendall(f'GET /play?{q} HTTP/1.1\r\nHost: x\r\n\r\n'.encode())
    f = s.makefile('rb')
    status = f.readline().decode()
    while f.readline() not in (b'\r\n', b''): pass
    out = {'status': status.split()[1], 'video': [], 'audio': [], 'info': None, 'end': False}
    while True:
        h = f.read(8)
        if len(h) < 8: break
        t, n = struct.unpack('<II', h)
        d = f.read(n)
        if t == 4: out['info'] = struct.unpack('<dIId', d)
        elif t == 1:
            to, ts, w, hh = struct.unpack('<ddII', d[:24]); out['video'].append((to, ts, w, hh, d[24:24 + w * hh]))
        elif t == 2:
            to, ns, ch = struct.unpack('<dII', d[:16]); out['audio'].append((to, ns))
        elif t == 3: out['end'] = True; break
        if limit and len(out['video']) >= limit: break
    s.close()
    return out

def ref_y(n):
    """quadro n (Y, 320x180) lendo do começo"""
    return subprocess.run([ffmpeg, '-v', 'error', '-i', path, '-vf', f'select=eq(n\\,{n}),{VF},scale=out_color_matrix=bt709:out_range=tv,format=yuv420p', '-frames:v', '1', '-f', 'rawvideo', '-'], capture_output=True).stdout

bad = 0
def check(cond, msg):
    global bad
    print(('ok    ' if cond else 'FALHOU ') + msg); bad += not cond

# 1) dois trechos, 1x
r = stream('1-2.5,5-6')
v, a = r['video'], r['audio']
check(r['status'] == '200' and r['end'], f'transmissão completa ({len(v)} quadros, {len(a)} pedaços de som)')
check(abs(r['info'][3] - 2.5) < 0.01, f"duração na saída {r['info'][3]:.3f} s")
check(len(v) == 75, f'quadros: {len(v)} (esperado 45 + 30)')
srcs = [round(x[1] * 30) for x in v]
check(srcs == list(range(30, 75)) + list(range(150, 180)), 'quadros do original: 30..74 e 150..179, sem os cortados')
outs = [x[0] for x in v]
check(all(abs(outs[k] - k / 30) < 0.002 for k in range(len(outs))), 'tempo de saída contínuo, 1/30 s por quadro')
same = sum(v[k][4] == ref_y(srcs[k])[:len(v[k][4])] and len(v[k][4]) == 320 * 180 for k in (0, 44, 45, 74))
check(same == 4, f'quadros idênticos ao FFmpeg nas emendas ({same}/4)')
ns = sum(x[1] for x in a)
check(abs(ns - 2.5 * 48000) < 48000 * 0.03, f'som: {ns} amostras (~{2.5 * 48000:.0f})')
gaps = max(abs(a[k + 1][0] - (a[k][0] + a[k][1] / 48000)) for k in range(len(a) - 1))
check(gaps < 0.002, f'som sem buracos (maior desvio {gaps * 1000:.2f} ms)')

# 2) velocidade 2x
r = stream('1-3', rate=2)
v, a = r['video'], r['audio']
check(len(v) == 60 and abs(v[-1][0] - 59 / 60) < 0.002, f'2x: {len(v)} quadros em {v[-1][0]:.3f} s de saída')
ns = sum(x[1] for x in a)
check(abs(ns - 1.0 * 48000) < 48000 * 0.05, f'2x: som {ns} amostras (~48000, tom mantido pelo atempo)')

# 3) para trás
r = stream('2-4', dir=-1)
v = r['video']
srcs = [round(x[1] * 30) for x in v]
check(srcs == list(range(119, 59, -1)), f'para trás: quadros {srcs[:3]}...{srcs[-3:]} (119 → 60)')
check(not r['audio'], 'para trás sem som')

# 4) um pedido novo encerra o anterior
res = {}
def long_one(): res['a'] = stream('0-8')
th = threading.Thread(target=long_one); th.start(); time.sleep(0.05)
r2 = stream('3-3.5')
th.join(10)
check(not res['a']['end'] and r2['end'], f"pedido novo encerrou o anterior (anterior parou com {len(res['a']['video'])} quadros)")

# 5) senha errada
s = socket.create_connection(('127.0.0.1', port)); s.sendall(b'GET /play?token=x&path=a HTTP/1.1\r\n\r\n')
check(b'403' in s.recv(100), 'senha errada recusada'); s.close()

p.stdin.write(b'quit\n'); p.stdin.flush(); p.wait(10)
sys.exit(1 if bad else 0)
