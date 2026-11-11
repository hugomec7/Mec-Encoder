/* Player do motor (mecview): lê a transmissão do play, desenha os quadros (I420, Rec. 709) com WebGL
   e agenda o som no AudioContext. O relógio é o do som (como num editor): a imagem segue o que está tocando.
   Sem som (vídeo mudo ou tocando para trás), o relógio é o do PC.

   const p = new MecEnginePlayer(canvas, audioContext, audioInput)
   p.start(url, { onTime(tSrc, tOut), onEnd(), onStall(on), onError(msg) })
   p.stop()                       */
(() => {
  const VS = 'attribute vec2 p;varying vec2 uv;void main(){uv=vec2((p.x+1.)/2.,(1.-p.y)/2.);gl_Position=vec4(p,0.,1.);}';
  // Rec. 709, faixa de TV (16-235) → RGB
  const FS = `precision mediump float;varying vec2 uv;uniform sampler2D ty,tu,tv;
    void main(){float y=(texture2D(ty,uv).r-.0627451)*1.1643836;float u=(texture2D(tu,uv).r-.5)*1.1383929;float v=(texture2D(tv,uv).r-.5)*1.1383929;
    gl_FragColor=vec4(clamp(vec3(y+1.5748*v,y-.1873*u-.4681*v,y+1.8556*u),0.,1.),1.);}`;

  class Bytes {
    constructor() { this.chunks = []; this.avail = 0; this.off = 0; }
    push(c) { this.chunks.push(c); this.avail += c.length; }
    take(n) {
      if (this.avail < n) return null;
      const out = new Uint8Array(n); let k = 0;
      while (k < n) {
        const c = this.chunks[0]; const m = Math.min(n - k, c.length - this.off);
        out.set(c.subarray(this.off, this.off + m), k); k += m; this.off += m;
        if (this.off === c.length) { this.chunks.shift(); this.off = 0; }
      }
      this.avail -= n;
      return out;
    }
  }

  class MecEnginePlayer {
    constructor(canvas, actx, input) {
      this.cv = canvas; this.actx = actx; this.input = input; this.gl = null; this.run = 0;
    }
    initGl() {
      if (this.gl) return true;
      const gl = this.cv.getContext('webgl', { alpha: false, antialias: false, preserveDrawingBuffer: true });
      if (!gl) return false;
      const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return o; };
      const pr = gl.createProgram();
      gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr); gl.useProgram(pr);
      const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      this.tex = ['ty', 'tu', 'tv'].map((n, i) => {
        const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, t);
        [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER].forEach((k) => gl.texParameteri(gl.TEXTURE_2D, k, gl.LINEAR));
        [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach((k) => gl.texParameteri(gl.TEXTURE_2D, k, gl.CLAMP_TO_EDGE));
        gl.uniform1i(gl.getUniformLocation(pr, n), i);
        return t;
      });
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      this.gl = gl;
      return true;
    }
    draw(f) {
      const gl = this.gl; const cw = (f.w + 1) >> 1; const ch = (f.h + 1) >> 1;
      if (this.cv.width !== f.w || this.cv.height !== f.h) { this.cv.width = f.w; this.cv.height = f.h; }
      gl.viewport(0, 0, f.w, f.h);
      [[f.y, f.w, f.h], [f.u, cw, ch], [f.v, cw, ch]].forEach(([d, w, h], i) => {
        gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, this.tex[i]);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, w, h, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, d);
      });
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    // relógio: segundos da saída que estão sendo ouvidos/vistos agora
    clock() {
      const s = this.s;
      if (!s.t0) return 0;
      if (s.audio) return this.actx.currentTime - s.t0 - (this.actx.outputLatency || this.actx.baseLatency || 0);
      return (s.stallAt || performance.now()) / 1000 - s.t0;
    }
    async start(url, cb) {
      this.stop();
      if (!this.initGl()) { cb.onError && cb.onError('webgl'); return; }
      const run = ++this.run;
      const s = this.s = { ctrl: new AbortController(), vq: [], pend: [], srcs: [], audio: false, info: null, end: false, t0: 0, last: null,
        stalled: false, stallAt: 0, wake: null, cb, frames: 0, dropped: 0, fdur: 1 / 30 };
      let res;
      try { res = await fetch(url, { signal: s.ctrl.signal, cache: 'no-store' }); } catch (e) { if (run === this.run) cb.onError && cb.onError(String(e)); return; }
      if (run !== this.run) return;
      if (!res.ok || !res.body) { cb.onError && cb.onError('http ' + res.status); return; }
      const rd = res.body.getReader(); const B = new Bytes();
      s.rd = rd;
      this.loop(run);
      let need = 8; let type = 0;
      try {
        for (;;) {
          // a fila de quadros cheia (meio segundo): espera a tela consumir (o motor espera junto)
          while (s.vq.length > Math.max(12, Math.round(0.5 / s.fdur)) && run === this.run) await new Promise((r) => { s.wake = r; });
          if (run !== this.run) return;
          const { value, done } = await rd.read();
          if (run !== this.run) return;
          if (done) break;
          B.push(value);
          for (;;) {
            if (!type) { const h = B.take(8); if (!h) break; const dv = new DataView(h.buffer); type = dv.getUint32(0, true); need = dv.getUint32(4, true); }
            const d = need ? B.take(need) : new Uint8Array(0); if (!d) break;
            this.packet(type, d); type = 0;
          }
        }
      } catch (e) { if (run === this.run && e.name !== 'AbortError') cb.onError && cb.onError(String(e)); return; }
      if (run === this.run) { s.end = true; this.maybeStart(); }
    }
    packet(type, d) {
      const s = this.s; const dv = new DataView(d.buffer, d.byteOffset, d.byteLength);
      if (type === 4) {
        s.info = { fps: dv.getFloat64(0, true), audio: !!dv.getUint32(8, true), rate: dv.getUint32(12, true), total: dv.getFloat64(16, true) };
        s.audio = s.info.audio && !!this.actx; s.fdur = 1 / (s.info.fps || 30);
      } else if (type === 1) {
        const w = dv.getUint32(16, true); const h = dv.getUint32(20, true); const cw = (w + 1) >> 1; const ch = (h + 1) >> 1;
        const y0 = 24; const u0 = y0 + w * h; const v0 = u0 + cw * ch;
        s.vq.push({ tout: dv.getFloat64(0, true), tsrc: dv.getFloat64(8, true), w, h, y: d.subarray(y0, u0), u: d.subarray(u0, v0), v: d.subarray(v0, v0 + cw * ch) });
        this.maybeStart();
      } else if (type === 2) {
        if (!s.audio) return;
        const tout = dv.getFloat64(0, true); const n = dv.getUint32(8, true);
        const f = new Float32Array(d.buffer.slice(d.byteOffset + 16, d.byteOffset + 16 + n * 8));
        const ab = this.actx.createBuffer(2, n, s.info.rate || 48000);
        const L = ab.getChannelData(0); const R = ab.getChannelData(1);
        for (let k = 0; k < n; k++) { L[k] = f[2 * k]; R[k] = f[2 * k + 1]; }
        s.pend.push({ tout, ab });
        if (s.t0) this.flushAudio(); else this.maybeStart();
      } else if (type === 3) { s.end = true; this.maybeStart(); }
    }
    audioAhead() { const s = this.s; const p = s.pend; return p.length ? p[p.length - 1].tout + p[p.length - 1].ab.duration - (p[0].tout) : 0; }
    // começa quando tem imagem e som suficientes (ou acabou a transmissão)
    maybeStart() {
      const s = this.s; if (s.t0 || !s.info) return;
      const vOk = s.vq.length >= Math.min(6, Math.max(2, Math.round(0.1 / s.fdur))) || s.end;
      const aOk = !s.audio || this.audioAhead() >= 0.12 || s.end;
      if (!vOk || !aOk) return;
      const first = s.vq.length ? s.vq[0].tout : s.pend.length ? s.pend[0].tout : 0;
      if (s.audio) { if (this.actx.state === 'suspended') this.actx.resume(); s.t0 = this.actx.currentTime + 0.06 - first; this.flushAudio(); }
      else s.t0 = performance.now() / 1000 + 0.03 - first;
    }
    flushAudio() {
      const s = this.s; const now = this.actx.currentTime;
      while (s.pend.length) {
        const { tout, ab } = s.pend.shift();
        const at = s.t0 + tout; const src = this.actx.createBufferSource(); src.buffer = ab; src.connect(this.input);
        if (at >= now) src.start(at); else if (now - at < ab.duration) src.start(now, now - at); else continue;
        s.srcs.push(src); src.onended = () => { const i = s.srcs.indexOf(src); if (i >= 0) s.srcs.splice(i, 1); };
      }
    }
    loop(run) {
      const tick = () => {
        if (run !== this.run) return;
        const s = this.s;
        if (s.t0) {
          const t = this.clock();
          let f = null;
          while (s.vq.length && s.vq[0].tout <= t + 0.004) { if (f) s.dropped++; f = s.vq.shift(); }
          if (f) { this.draw(f); s.last = f; s.frames++; s.cb.onTime && s.cb.onTime(f.tsrc, f.tout); if (s.wake) { const w = s.wake; s.wake = null; w(); } }
          // acabou
          if (s.end && !s.vq.length && (!s.last || t >= s.last.tout + s.fdur) && (!s.audio || !s.pend.length)) { const cb = s.cb; this.stop(true); cb.onEnd && cb.onEnd(); return; }
          // faltou imagem: segura o relógio até encher de novo
          if (!s.end && !s.vq.length && s.last && t > s.last.tout + 2.5 * s.fdur && !s.stalled) {
            s.stalled = true; s.stallAt = performance.now();
            if (s.audio) this.actx.suspend(); s.cb.onStall && s.cb.onStall(true);
          } else if (s.stalled && (s.vq.length >= 4 || s.end)) {
            s.stalled = false;
            if (s.audio) this.actx.resume(); else s.t0 += (performance.now() - s.stallAt) / 1000;
            s.stallAt = 0; s.cb.onStall && s.cb.onStall(false);
          }
          if (s.wake && s.vq.length <= Math.max(12, Math.round(0.5 / s.fdur))) { const w = s.wake; s.wake = null; w(); }
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
    stats() { const s = this.s || {}; return { frames: s.frames || 0, dropped: s.dropped || 0, queued: (s.vq || []).length, stalled: !!s.stalled }; }
    stop(keepImage) {
      this.run++;
      const s = this.s; if (!s) return;
      try { s.ctrl.abort(); } catch {}
      s.srcs.forEach((x) => { try { x.stop(); } catch {} });
      s.srcs = []; s.vq = []; s.pend = [];
      if (s.stalled && s.audio && this.actx.state === 'suspended') this.actx.resume();
      if (s.wake) { const w = s.wake; s.wake = null; w(); }
      if (!keepImage) this.s = null; else this.s = Object.assign({}, s, { t0: 0 });
    }
  }
  window.MecEnginePlayer = MecEnginePlayer;
})();
