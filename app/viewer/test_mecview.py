"""Confere o motor do player (mecview): para vários vídeos e tempos, o quadro tem de ser idêntico ao do
FFmpeg com -ss no mesmo tempo e o mesmo filtro. Uso: python test_mecview.py <mecview> <ffmpeg> <pasta temporária>"""
import os, subprocess, sys, time

exe, ffmpeg, tmp = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(tmp, exist_ok=True)

def make(name, args):
    path = os.path.join(tmp, name)
    subprocess.run([ffmpeg, '-v', 'error', '-y'] + args + [path], check=True)
    return path

clips = [
    (make('hdr.mov', ['-f', 'lavfi', '-i', 'testsrc2=s=1920x1080:r=60000/1001,format=yuv420p10le', '-t', '4', '-c:v', 'libx265', '-preset', 'ultrafast',
                      '-x265-params', 'keyint=60:log-level=error:colorprim=bt2020:transfer=arib-std-b67:colormatrix=bt2020nc:range=limited', '-color_range', 'tv', '-color_primaries', 'bt2020', '-color_trc', 'arib-std-b67', '-colorspace', 'bt2020nc', '-tag:v', 'hvc1']),
     60000 / 1001,
     'scale=w=640:h=640:force_original_aspect_ratio=decrease:flags=bilinear,zscale=tin=arib-std-b67:pin=bt2020:min=bt2020nc:rin=tv:t=linear:npl=100,'
     'format=gbrpf32le,tonemap=tonemap=hable:desat=0:peak=10,zscale=p=bt709:t=bt709:m=bt709:r=tv'),
    (make('h264.mp4', ['-f', 'lavfi', '-i', 'testsrc2=s=1280x720:r=30', '-t', '4', '-c:v', 'libx264', '-preset', 'ultrafast', '-g', '45']),
     30, 'transpose=clock,scale=w=640:h=640:force_original_aspect_ratio=decrease:flags=bilinear'),
    (make('422.mov', ['-f', 'lavfi', '-i', 'testsrc2=s=1280x720:r=25,format=yuv422p10le', '-t', '3', '-c:v', 'libx265', '-preset', 'ultrafast', '-x265-params', 'keyint=25:log-level=error']),
     25, 'scale=w=640:h=640:force_original_aspect_ratio=decrease:flags=bilinear'),
]

p = subprocess.Popen([exe], stdin=subprocess.PIPE, stdout=subprocess.PIPE)
def ask(line):
    p.stdin.write((line + '\n').encode('utf-8')); p.stdin.flush()
    head = p.stdout.readline().decode().strip()
    data = p.stdout.read(int(head.split()[3])) if head.startswith('img') else None
    return head, data

dur = [4, 4, 3]
bad = 0
for i, (path, fps, vf) in enumerate(clips):
    head, _ = ask(f'open {i} 1 {path}')
    print(os.path.basename(path), head)
    if not head.startswith('ok'): bad += 1; continue
    for n in [0, 75, 76, 30, 100, 100, 3]:
        t = n / fps
        t0 = time.time(); head, data = ask(f'frame {i} {t:.6f} {vf}'); ms = (time.time() - t0) * 1000
        ref = subprocess.run([ffmpeg, '-v', 'error', '-ss', f'{t:.6f}', '-i', path, '-frames:v', '1', '-vf', vf + ',format=rgba', '-f', 'rawvideo', '-'], capture_output=True).stdout
        if not ref:
            # sem referência só pode ser depois do fim (e o motor entrega o último quadro)
            ok = n / fps >= dur[i] - 0.5 / fps and head.startswith('img')
            print(f'  t={t:.3f} {"ok " if ok else "FALHOU"} {head} (depois do fim)'); bad += not ok; continue
        same = data == ref
        if not same and data and len(data) == len(ref):
            d = sum(abs(a - b) for a, b in zip(data[::101], ref[::101])) / len(data[::101])
            same = d < 0.5
        print(f'  t={t:.3f} {"ok " if same else "DIFERENTE"} {head} ({ms:.0f} ms)')
        bad += not same
p.stdin.write(b'quit\n'); p.stdin.flush(); p.wait(10)
sys.exit(1 if bad else 0)
