/*
 * Transmissão do play do motor (mecview): o app pede ao motor ("serve") uma porta local e uma senha;
 * a tela abre http://127.0.0.1:<porta>/play?... e recebe, em sequência, os quadros (I420) e o som
 * (float32 estéreo 48 kHz) do que deve tocar, já sem os cortes, na velocidade pedida, ou para trás.
 * Uma transmissão por vez: um pedido novo encerra o anterior.
 *
 * Parâmetros: token, path, parts (a-b,c-d em segundos), vf (filtro da prévia), hw (0|1),
 *             rate (velocidade, 0.25..4), dir (1 para frente, -1 para trás, sem som), audio (0|1).
 * Pacotes: [u32 tipo][u32 tamanho][dados], little endian:
 *   4 info:  f64 fps, u32 tem_som, u32 taxa (48000), f64 duração na saída
 *   1 vídeo: f64 t_saída, f64 t_original, u32 w, u32 h, Y (w*h), U e V ((w+1)/2 * (h+1)/2 cada)
 *   2 som:   f64 t_saída, u32 amostras, u32 canais (2), float32 intercalado
 *   3 fim
 */
#ifdef _WIN32
#include <winsock2.h>
#include <ws2tcpip.h>
#include <windows.h>
typedef SOCKET sock_t;
#define CLOSESOCK closesocket
#define BADSOCK INVALID_SOCKET
#define MSG_NOSIGNAL 0
#else
#include <sys/socket.h>
#include <netinet/in.h>
#include <netinet/tcp.h>
#include <arpa/inet.h>
#include <pthread.h>
#include <unistd.h>
typedef int sock_t;
#ifndef MSG_NOSIGNAL
#define MSG_NOSIGNAL 0
#endif
#define CLOSESOCK close
#define BADSOCK (-1)
#endif
#include <libavformat/avformat.h>
#include <libavcodec/avcodec.h>
#include <libavfilter/avfilter.h>
#include <libavfilter/buffersrc.h>
#include <libavfilter/buffersink.h>
#include <libavutil/hwcontext.h>
#include <libavutil/opt.h>
#include <libavutil/random_seed.h>
#include <libavutil/channel_layout.h>
#include <libavutil/pixdesc.h>
#include <libavutil/avstring.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define RATE 48000
#define FADE 144 /* 3 ms nas emendas dos cortes, sem estalo */

static volatile long play_gen = 0;
static char play_token[40];
static sock_t listener = BADSOCK;

static long gen_next(void) {
#ifdef _WIN32
    return InterlockedIncrement(&play_gen);
#else
    return __sync_add_and_fetch(&play_gen, 1);
#endif
}

static void spawn(void *(*fn)(void *), void *arg) {
#ifdef _WIN32
    HANDLE h = CreateThread(NULL, 0, (LPTHREAD_START_ROUTINE)(void *)fn, arg, 0, NULL);
    if (h) CloseHandle(h);
#else
    pthread_t t;
    if (!pthread_create(&t, NULL, fn, arg)) pthread_detach(t);
#endif
}

/* ---------- rede ---------- */
static int send_all(sock_t s, const void *buf, size_t n) {
    const char *p = buf;
    while (n) {
        int k = send(s, p, (int)(n > (1 << 30) ? (1 << 30) : n), MSG_NOSIGNAL);
        if (k <= 0) return -1;
        p += k; n -= (size_t)k;
    }
    return 0;
}

static int hexval(int c) { return c >= '0' && c <= '9' ? c - '0' : c >= 'a' && c <= 'f' ? c - 'a' + 10 : c >= 'A' && c <= 'F' ? c - 'A' + 10 : -1; }
static void url_decode(char *s) {
    char *o = s;
    for (; *s; s++) {
        if (*s == '+') *o++ = ' ';
        else if (*s == '%' && hexval(s[1]) >= 0 && hexval(s[2]) >= 0) { *o++ = (char)(hexval(s[1]) * 16 + hexval(s[2])); s += 2; }
        else *o++ = *s;
    }
    *o = 0;
}
/* valor de `key` na query (decodificado, em memória nova) ou NULL */
static char *query_get(const char *q, const char *key) {
    size_t kl = strlen(key);
    for (const char *p = q; p && *p;) {
        const char *amp = strchr(p, '&');
        size_t len = amp ? (size_t)(amp - p) : strlen(p);
        if (len > kl && !strncmp(p, key, kl) && p[kl] == '=') {
            char *v = av_strndup(p + kl + 1, len - kl - 1);
            url_decode(v);
            return v;
        }
        p = amp ? amp + 1 : NULL;
    }
    return NULL;
}

/* ---------- leitura do arquivo ---------- */
typedef struct {
    AVFormatContext *fmt;
    AVCodecContext *vdec, *adec;
    AVBufferRef *hwdev;
    enum AVPixelFormat hwfmt;
    int vs, as;
    AVRational vtb, atb;
    int64_t start;      /* AV_TIME_BASE */
    double fps, half;   /* meio quadro em segundos */
    /* filtros */
    AVFilterGraph *vg; AVFilterContext *vsrc, *vsink; int vgw, vgh, vgf;
    AVFilterGraph *ag; AVFilterContext *asrc, *asink; char alayout[96]; int arate, afmt;
    AVFilterGraph *tg; AVFilterContext *tsrc, *tsink; /* velocidade (atempo) */
} Src;

static enum AVPixelFormat src_pick(AVCodecContext *ctx, const enum AVPixelFormat *fmts) {
    Src *s = ctx->opaque;
    for (const enum AVPixelFormat *p = fmts; *p != AV_PIX_FMT_NONE; p++) if (s && *p == s->hwfmt) return *p;
    for (const enum AVPixelFormat *p = fmts; *p != AV_PIX_FMT_NONE; p++) {
        const AVPixFmtDescriptor *d = av_pix_fmt_desc_get(*p);
        if (d && !(d->flags & AV_PIX_FMT_FLAG_HWACCEL)) return *p;
    }
    return fmts[0];
}

static void src_close(Src *s) {
    avfilter_graph_free(&s->vg); avfilter_graph_free(&s->ag); avfilter_graph_free(&s->tg);
    avcodec_free_context(&s->vdec); avcodec_free_context(&s->adec);
    avformat_close_input(&s->fmt);
    av_buffer_unref(&s->hwdev);
}

static int src_open(Src *s, const char *path, int hw, int want_audio) {
    memset(s, 0, sizeof *s);
    s->vs = s->as = -1; s->hwfmt = AV_PIX_FMT_NONE;
    if (avformat_open_input(&s->fmt, path, NULL, NULL) < 0) return -1;
    if (avformat_find_stream_info(s->fmt, NULL) < 0) return -1;
    s->start = s->fmt->start_time != AV_NOPTS_VALUE ? s->fmt->start_time : 0;
    s->vs = av_find_best_stream(s->fmt, AVMEDIA_TYPE_VIDEO, -1, -1, NULL, 0);
    if (want_audio) s->as = av_find_best_stream(s->fmt, AVMEDIA_TYPE_AUDIO, -1, s->vs, NULL, 0);
    if (s->as < 0) s->as = -1;
    for (unsigned i = 0; i < s->fmt->nb_streams; i++)
        if ((int)i != s->vs && (int)i != s->as) s->fmt->streams[i]->discard = AVDISCARD_ALL;
    if (s->vs >= 0) {
        AVStream *st = s->fmt->streams[s->vs];
        const AVCodec *c = avcodec_find_decoder(st->codecpar->codec_id);
        if (!c) return -1;
        s->vdec = avcodec_alloc_context3(c);
        avcodec_parameters_to_context(s->vdec, st->codecpar);
        s->vdec->pkt_timebase = st->time_base;
        s->vdec->opaque = s; s->vdec->get_format = src_pick;
        if (hw) {
#ifdef _WIN32
            const char *names[] = { "d3d11va", "cuda", NULL };
#else
            const char *names[] = { "cuda", "vaapi", NULL };
#endif
            for (int n = 0; names[n] && s->hwfmt == AV_PIX_FMT_NONE; n++) {
                enum AVHWDeviceType type = av_hwdevice_find_type_by_name(names[n]);
                if (type == AV_HWDEVICE_TYPE_NONE) continue;
                for (int i = 0;; i++) {
                    const AVCodecHWConfig *cfg = avcodec_get_hw_config(c, i);
                    if (!cfg) break;
                    if ((cfg->methods & AV_CODEC_HW_CONFIG_METHOD_HW_DEVICE_CTX) && cfg->device_type == type) {
                        if (av_hwdevice_ctx_create(&s->hwdev, type, NULL, NULL, 0) >= 0) { s->hwfmt = cfg->pix_fmt; s->vdec->hw_device_ctx = av_buffer_ref(s->hwdev); }
                        break;
                    }
                }
            }
        }
        s->vdec->thread_count = s->hwfmt != AV_PIX_FMT_NONE ? 1 : 0;
        if (avcodec_open2(s->vdec, c, NULL) < 0) return -1;
        s->vtb = st->time_base;
        AVRational fr = st->avg_frame_rate.num ? st->avg_frame_rate : st->r_frame_rate;
        s->fps = fr.num && fr.den ? av_q2d(fr) : 30;
        s->half = 0.5 / s->fps;
    }
    if (s->as >= 0) {
        AVStream *st = s->fmt->streams[s->as];
        const AVCodec *c = avcodec_find_decoder(st->codecpar->codec_id);
        if (c) {
            s->adec = avcodec_alloc_context3(c);
            avcodec_parameters_to_context(s->adec, st->codecpar);
            s->adec->pkt_timebase = st->time_base;
            if (avcodec_open2(s->adec, c, NULL) < 0) avcodec_free_context(&s->adec);
        }
        if (!s->adec) s->as = -1;
        s->atb = st->time_base;
    }
    return s->vs >= 0 || s->as >= 0 ? 0 : -1;
}

static double vsec(Src *s, int64_t ts) { return ts * av_q2d(s->vtb) - s->start / (double)AV_TIME_BASE; }

/* filtro de vídeo: o da prévia + I420 Rec. 709 (o que a tela desenha) */
static int vgraph(Src *s, const AVFrame *f, const char *desc) {
    char args[512];
    avfilter_graph_free(&s->vg);
    s->vg = avfilter_graph_alloc();
    AVRational sar = f->sample_aspect_ratio.num ? f->sample_aspect_ratio : (AVRational){ 1, 1 };
    snprintf(args, sizeof args, "video_size=%dx%d:pix_fmt=%d:time_base=%d/%d:pixel_aspect=%d/%d", f->width, f->height, f->format, s->vtb.num, s->vtb.den, sar.num, sar.den);
    s->vsrc = avfilter_graph_alloc_filter(s->vg, avfilter_get_by_name("buffer"), "in");
    av_opt_set_int(s->vsrc, "colorspace", f->colorspace, AV_OPT_SEARCH_CHILDREN);
    av_opt_set_int(s->vsrc, "range", f->color_range, AV_OPT_SEARCH_CHILDREN);
    int r = avfilter_init_str(s->vsrc, args);
    if (r >= 0) r = avfilter_graph_create_filter(&s->vsink, avfilter_get_by_name("buffersink"), "out", NULL, NULL, s->vg);
    if (r < 0) return r;
    AVFilterInOut *o = avfilter_inout_alloc(), *i = avfilter_inout_alloc();
    o->name = av_strdup("in"); o->filter_ctx = s->vsrc; i->name = av_strdup("out"); i->filter_ctx = s->vsink;
    char *full = av_asprintf("%s%sscale=out_color_matrix=bt709:out_range=tv,format=yuv420p", desc, desc[0] ? "," : "");
    r = avfilter_graph_parse_ptr(s->vg, full, &i, &o, NULL);
    av_free(full); avfilter_inout_free(&i); avfilter_inout_free(&o);
    if (r >= 0) r = avfilter_graph_config(s->vg, NULL);
    s->vgw = f->width; s->vgh = f->height; s->vgf = f->format;
    return r;
}

/* filtro de áudio: qualquer formato → float estéreo 48 kHz */
static int agraph(Src *s, const AVFrame *f) {
    char args[512], lay[96] = "stereo";
    avfilter_graph_free(&s->ag);
    s->ag = avfilter_graph_alloc();
    if (f->ch_layout.nb_channels) av_channel_layout_describe(&f->ch_layout, lay, sizeof lay);
    snprintf(args, sizeof args, "time_base=1/%d:sample_rate=%d:sample_fmt=%s:channel_layout=%s", f->sample_rate, f->sample_rate, av_get_sample_fmt_name(f->format), lay);
    int r = avfilter_graph_create_filter(&s->asrc, avfilter_get_by_name("abuffer"), "in", args, NULL, s->ag);
    if (r >= 0) r = avfilter_graph_create_filter(&s->asink, avfilter_get_by_name("abuffersink"), "out", NULL, NULL, s->ag);
    if (r < 0) return r;
    AVFilterInOut *o = avfilter_inout_alloc(), *i = avfilter_inout_alloc();
    o->name = av_strdup("in"); o->filter_ctx = s->asrc; i->name = av_strdup("out"); i->filter_ctx = s->asink;
    r = avfilter_graph_parse_ptr(s->ag, "aresample=48000,aformat=sample_fmts=flt:channel_layouts=stereo", &i, &o, NULL);
    avfilter_inout_free(&i); avfilter_inout_free(&o);
    if (r >= 0) r = avfilter_graph_config(s->ag, NULL);
    snprintf(s->alayout, sizeof s->alayout, "%s", lay); s->arate = f->sample_rate; s->afmt = f->format;
    return r;
}

/* velocidade sem mudar o tom: atempo em cadeia (cada um vai de 0,5 a 2) */
static int tgraph(Src *s, double rate) {
    char chain[256] = "", one[48];
    avfilter_graph_free(&s->tg);
    s->tg = avfilter_graph_alloc();
    double r = rate;
    while (r > 2.0001) { strcat(chain, "atempo=2,"); r /= 2; }
    while (r < 0.4999) { strcat(chain, "atempo=0.5,"); r *= 2; }
    snprintf(one, sizeof one, "atempo=%.6f", r); strcat(chain, one);
    int e = avfilter_graph_create_filter(&s->tsrc, avfilter_get_by_name("abuffer"), "in", "time_base=1/48000:sample_rate=48000:sample_fmt=flt:channel_layout=stereo", NULL, s->tg);
    if (e >= 0) e = avfilter_graph_create_filter(&s->tsink, avfilter_get_by_name("abuffersink"), "out", NULL, NULL, s->tg);
    if (e < 0) return e;
    AVFilterInOut *o = avfilter_inout_alloc(), *i = avfilter_inout_alloc();
    o->name = av_strdup("in"); o->filter_ctx = s->tsrc; i->name = av_strdup("out"); i->filter_ctx = s->tsink;
    e = avfilter_graph_parse_ptr(s->tg, chain, &i, &o, NULL);
    avfilter_inout_free(&i); avfilter_inout_free(&o);
    if (e >= 0) e = avfilter_graph_config(s->tg, NULL);
    return e;
}

/* ---------- envio ---------- */
typedef struct {
    sock_t sock; long gen;
    Src src;
    char *vf;
    double rate;
    double obase;          /* onde o trecho atual começa na saída */
    int64_t aout;          /* amostras de som já enviadas no trecho (com velocidade) */
    double a, b;           /* trecho atual */
    int last_part;
    int first_part;
    uint8_t *buf; size_t cap;
    int fail;
} Job;

static int alive(Job *j) { return !j->fail && play_gen == j->gen; }

static uint8_t *jbuf(Job *j, size_t n) {
    if (n > j->cap) { av_free(j->buf); j->buf = av_malloc(n); j->cap = j->buf ? n : 0; }
    return j->buf;
}

static void put_u32(uint8_t *p, uint32_t v) { memcpy(p, &v, 4); }
static void put_f64(uint8_t *p, double v) { memcpy(p, &v, 8); }

static void send_packet(Job *j, uint32_t type, const uint8_t *data, uint32_t len) {
    uint8_t h[8]; put_u32(h, type); put_u32(h + 4, len);
    if (j->fail) return;
    if (send_all(j->sock, h, 8) < 0 || (len && send_all(j->sock, data, len) < 0)) j->fail = 1;
}

static void send_video(Job *j, AVFrame *yuv, double tout, double tsrc) {
    int w = yuv->width, h = yuv->height, cw = (w + 1) / 2, ch = (h + 1) / 2;
    size_t n = 24 + (size_t)w * h + 2 * (size_t)cw * ch;
    uint8_t *b = jbuf(j, n);
    if (!b) { j->fail = 1; return; }
    put_f64(b, tout); put_f64(b + 8, tsrc); put_u32(b + 16, w); put_u32(b + 20, h);
    uint8_t *p = b + 24;
    for (int y = 0; y < h; y++, p += w) memcpy(p, yuv->data[0] + (size_t)y * yuv->linesize[0], w);
    for (int pl = 1; pl <= 2; pl++) for (int y = 0; y < ch; y++, p += cw) memcpy(p, yuv->data[pl] + (size_t)y * yuv->linesize[pl], cw);
    send_packet(j, 1, b, (uint32_t)n);
}

static void send_audio(Job *j, const float *smp, int n, double tout) {
    if (n <= 0) return;
    size_t len = 16 + (size_t)n * 8;
    uint8_t *b = jbuf(j, len);
    if (!b) { j->fail = 1; return; }
    put_f64(b, tout); put_u32(b + 8, (uint32_t)n); put_u32(b + 12, 2);
    memcpy(b + 16, smp, (size_t)n * 8);
    send_packet(j, 2, b, (uint32_t)len);
}

/* som já cortado no trecho: direto (1x) ou pela velocidade */
static void emit_audio(Job *j, float *smp, int n, int fade_in_at, int fade_out_end) {
    /* emendas: sobe no começo do trecho e desce no fim, se houver outro trecho */
    if (fade_in_at >= 0) for (int k = 0; k < FADE && fade_in_at + k < n; k++) { float g = (float)k / FADE; smp[2 * (fade_in_at + k)] *= g; smp[2 * (fade_in_at + k) + 1] *= g; }
    if (fade_out_end > 0) for (int k = 0; k < FADE && fade_out_end - 1 - k >= 0; k++) { float g = (float)k / FADE; smp[2 * (fade_out_end - 1 - k)] *= g; smp[2 * (fade_out_end - 1 - k) + 1] *= g; }
    if (j->rate > 0.999 && j->rate < 1.001) {
        send_audio(j, smp, n, j->obase + (double)j->aout / RATE);
        j->aout += n;
        return;
    }
    AVFrame *f = av_frame_alloc();
    f->format = AV_SAMPLE_FMT_FLT; f->sample_rate = RATE; f->nb_samples = n;
    av_channel_layout_default(&f->ch_layout, 2);
    if (av_frame_get_buffer(f, 0) >= 0) {
        memcpy(f->data[0], smp, (size_t)n * 8);
        av_buffersrc_add_frame(j->src.tsrc, f);
    }
    av_frame_free(&f);
    AVFrame *o = av_frame_alloc();
    while (av_buffersink_get_frame(j->src.tsink, o) >= 0) {
        send_audio(j, (const float *)o->data[0], o->nb_samples, j->obase + (double)j->aout / RATE);
        j->aout += o->nb_samples;
        av_frame_unref(o);
    }
    av_frame_free(&o);
}

static void flush_tempo(Job *j) {
    if (!j->src.tg) return;
    av_buffersrc_add_frame(j->src.tsrc, NULL);
    AVFrame *o = av_frame_alloc();
    while (av_buffersink_get_frame(j->src.tsink, o) >= 0) {
        send_audio(j, (const float *)o->data[0], o->nb_samples, j->obase + (double)j->aout / RATE);
        j->aout += o->nb_samples;
        av_frame_unref(o);
    }
    av_frame_free(&o);
}

/* um quadro decodificado: dentro do trecho → filtro → tela. 1 = passou do fim do trecho. */
static int on_video(Job *j, AVFrame *f) {
    Src *s = &j->src;
    int64_t ts = f->best_effort_timestamp != AV_NOPTS_VALUE ? f->best_effort_timestamp : f->pts;
    double t = vsec(s, ts);
    if (t >= j->b - s->half) return 1;
    if (t < j->a - s->half) return 0;
    AVFrame *sw = av_frame_alloc(), *yuv = av_frame_alloc();
    int r = f->hw_frames_ctx ? av_hwframe_transfer_data(sw, f, 0) : av_frame_ref(sw, f);
    if (r >= 0 && f->hw_frames_ctx) av_frame_copy_props(sw, f);
    if (r >= 0 && (!s->vg || s->vgw != sw->width || s->vgh != sw->height || s->vgf != sw->format)) r = vgraph(s, sw, j->vf);
    if (r >= 0) r = av_buffersrc_add_frame_flags(s->vsrc, sw, AV_BUFFERSRC_FLAG_KEEP_REF);
    if (r >= 0) r = av_buffersink_get_frame(s->vsink, yuv);
    if (r >= 0) send_video(j, yuv, j->obase + (FFMAX(t, j->a) - j->a) / j->rate, t);
    av_frame_free(&sw); av_frame_free(&yuv);
    return 0;
}

/* um pedaço de som decodificado: converte, corta no trecho, envia. 1 = passou do fim do trecho. */
static int on_audio(Job *j, AVFrame *f) {
    Src *s = &j->src;
    if (!s->ag || s->arate != f->sample_rate || s->afmt != f->format) { if (agraph(s, f) < 0) return 1; }
    if (av_buffersrc_add_frame_flags(s->asrc, f, AV_BUFFERSRC_FLAG_KEEP_REF) < 0) return 0;
    AVFrame *o = av_frame_alloc();
    int past = 0;
    AVRational tb = av_buffersink_get_time_base(s->asink);
    while (!past && av_buffersink_get_frame(s->asink, o) >= 0) {
        if (o->pts != AV_NOPTS_VALUE) {
            double t0 = o->pts * av_q2d(tb) - s->start / (double)AV_TIME_BASE;
            int n = o->nb_samples;
            int from = t0 < j->a ? (int)((j->a - t0) * RATE + 0.5) : 0;
            int to = n;
            if (t0 + (double)n / RATE > j->b) { to = (int)((j->b - t0) * RATE + 0.5); past = 1; }
            if (from < 0) from = 0;
            if (to > n) to = n;
            if (to > from) {
                float *p = (float *)o->data[0] + 2 * from;
                int fin = (t0 + (double)from / RATE <= j->a + 0.5 / RATE) && !j->first_part ? 0 : -1;
                emit_audio(j, p, to - from, fin, past && !j->last_part ? to - from : 0);
            }
        }
        av_frame_unref(o);
    }
    av_frame_free(&o);
    return past;
}

/* Um trecho para frente, de a até b (segundos do arquivo). */
static void play_part(Job *j) {
    Src *s = &j->src;
    int need_v = s->vs >= 0, need_a = s->as >= 0 && s->adec;
    int64_t ts = av_rescale_q((int64_t)(j->a * AV_TIME_BASE) + s->start, AV_TIME_BASE_Q, s->fmt->streams[s->vs >= 0 ? s->vs : s->as]->time_base);
    av_seek_frame(s->fmt, s->vs >= 0 ? s->vs : s->as, ts, AVSEEK_FLAG_BACKWARD);
    if (s->vdec) avcodec_flush_buffers(s->vdec);
    if (s->adec) avcodec_flush_buffers(s->adec);
    avfilter_graph_free(&s->ag);
    if (j->rate < 0.999 || j->rate > 1.001) tgraph(s, j->rate);
    j->aout = 0;
    AVPacket *pkt = av_packet_alloc();
    AVFrame *f = av_frame_alloc();
    int eof = 0;
    while ((need_v || need_a) && alive(j)) {
        if (!eof) {
            int r = av_read_frame(s->fmt, pkt);
            if (r < 0) {
                eof = 1;
                if (need_v) avcodec_send_packet(s->vdec, NULL);
                if (need_a) avcodec_send_packet(s->adec, NULL);
            } else {
                if (pkt->stream_index == s->vs && need_v) avcodec_send_packet(s->vdec, pkt);
                else if (pkt->stream_index == s->as && need_a) avcodec_send_packet(s->adec, pkt);
                av_packet_unref(pkt);
            }
        }
        int got = 0;
        while (need_v && alive(j)) {
            int r = avcodec_receive_frame(s->vdec, f);
            if (r < 0) { if (r == AVERROR_EOF) need_v = 0; break; }
            got = 1;
            if (on_video(j, f)) need_v = 0;
            av_frame_unref(f);
        }
        while (need_a && alive(j)) {
            int r = avcodec_receive_frame(s->adec, f);
            if (r < 0) { if (r == AVERROR_EOF) need_a = 0; break; }
            got = 1;
            if (on_audio(j, f)) need_a = 0;
            av_frame_unref(f);
        }
        if (eof && !got) break;
    }
    flush_tempo(j);
    av_frame_free(&f); av_packet_free(&pkt);
}

/* Para trás (sem som): de b até a, um GOP por vez, quadros na ordem inversa. */
typedef struct { AVFrame **f; double *t; int n, cap; } FList;
static void play_back(Job *j) {
    Src *s = &j->src;
    double cur = j->b, step = 1.0 / s->fps / j->rate;
    double tout = j->obase;
    AVPacket *pkt = av_packet_alloc();
    AVFrame *f = av_frame_alloc();
    double back = 1.0;
    while (cur > j->a + s->half && alive(j)) {
        double from = FFMAX(j->a, cur - back);
        int64_t ts = av_rescale_q((int64_t)(from * AV_TIME_BASE) + s->start, AV_TIME_BASE_Q, s->vtb);
        av_seek_frame(s->fmt, s->vs, ts, AVSEEK_FLAG_BACKWARD);
        avcodec_flush_buffers(s->vdec);
        FList L = { 0 };
        double first = -1;
        int eof = 0, done = 0;
        while (!done && alive(j)) {
            if (!eof) {
                if (av_read_frame(s->fmt, pkt) < 0) { eof = 1; avcodec_send_packet(s->vdec, NULL); }
                else { if (pkt->stream_index == s->vs) avcodec_send_packet(s->vdec, pkt); av_packet_unref(pkt); }
            }
            for (;;) {
                int r = avcodec_receive_frame(s->vdec, f);
                if (r < 0) { if (r == AVERROR_EOF) done = 1; break; }
                int64_t fts = f->best_effort_timestamp != AV_NOPTS_VALUE ? f->best_effort_timestamp : f->pts;
                double t = vsec(s, fts);
                if (first < 0) first = t;
                if (t >= cur - s->half) { done = 1; av_frame_unref(f); break; }
                if (t >= j->a - s->half) {
                    AVFrame *sw = av_frame_alloc(), *yuv = av_frame_alloc();
                    int e = f->hw_frames_ctx ? av_hwframe_transfer_data(sw, f, 0) : av_frame_ref(sw, f);
                    if (e >= 0 && f->hw_frames_ctx) av_frame_copy_props(sw, f);
                    if (e >= 0 && (!s->vg || s->vgw != sw->width || s->vgh != sw->height || s->vgf != sw->format)) e = vgraph(s, sw, j->vf);
                    if (e >= 0) e = av_buffersrc_add_frame_flags(s->vsrc, sw, AV_BUFFERSRC_FLAG_KEEP_REF);
                    if (e >= 0) e = av_buffersink_get_frame(s->vsink, yuv);
                    av_frame_free(&sw);
                    if (e >= 0) {
                        if (L.n == L.cap) { L.cap = L.cap ? L.cap * 2 : 64; L.f = av_realloc_array(L.f, L.cap, sizeof *L.f); L.t = av_realloc_array(L.t, L.cap, sizeof *L.t); }
                        L.f[L.n] = yuv; L.t[L.n] = t; L.n++;
                    } else av_frame_free(&yuv);
                }
                av_frame_unref(f);
            }
            if (eof && done == 0 && L.n == 0 && first < 0) done = 1;
        }
        for (int k = L.n - 1; k >= 0 && alive(j); k--) { send_video(j, L.f[k], tout, L.t[k]); tout += step; }
        for (int k = 0; k < L.n; k++) av_frame_free(&L.f[k]);
        av_free(L.f); av_free(L.t);
        /* nada antes de `cur` neste pulo: volta mais */
        if (first < 0 || first >= cur - s->half) { back *= 2; if (cur - back < j->a - 1) break; continue; }
        cur = first; back = 1.0;
    }
    av_frame_free(&f); av_packet_free(&pkt);
}

static void *serve_one(void *arg) {
    sock_t c = (sock_t)(intptr_t)arg;
    char req[16384]; int n = 0;
    while (n < (int)sizeof req - 1) {
        int k = recv(c, req + n, (int)sizeof req - 1 - n, 0);
        if (k <= 0) break;
        n += k; req[n] = 0;
        if (strstr(req, "\r\n\r\n")) break;
    }
    req[n] = 0;
    char *q = strstr(req, "GET /play?");
    if (!q) {
        const char *bad = "HTTP/1.1 404 Not Found\r\nAccess-Control-Allow-Origin: *\r\nContent-Length: 0\r\nConnection: close\r\n\r\n";
        send_all(c, bad, strlen(bad)); CLOSESOCK(c); return NULL;
    }
    q += 10;
    char *sp = strchr(q, ' '); if (sp) *sp = 0;
    char *token = query_get(q, "token");
    if (!token || strcmp(token, play_token)) {
        const char *no = "HTTP/1.1 403 Forbidden\r\nAccess-Control-Allow-Origin: *\r\nContent-Length: 0\r\nConnection: close\r\n\r\n";
        send_all(c, no, strlen(no)); av_free(token); CLOSESOCK(c); return NULL;
    }
    av_free(token);
    Job *j = av_mallocz(sizeof *j);
    j->sock = c; j->gen = gen_next();
    char *path = query_get(q, "path"), *parts = query_get(q, "parts"), *vf = query_get(q, "vf");
    char *hw = query_get(q, "hw"), *rate = query_get(q, "rate"), *dir = query_get(q, "dir"), *audio = query_get(q, "audio");
    j->vf = vf ? vf : av_strdup("");
    j->rate = rate ? atof(rate) : 1; if (j->rate < 0.1 || j->rate > 16) j->rate = 1;
    int back = dir && atoi(dir) < 0;
    const char *ok = "HTTP/1.1 200 OK\r\nContent-Type: application/octet-stream\r\nCache-Control: no-store\r\nAccess-Control-Allow-Origin: *\r\nConnection: close\r\n\r\n";
    int bufsz = 8 << 20;
    setsockopt(c, SOL_SOCKET, SO_SNDBUF, (const char *)&bufsz, sizeof bufsz);
    int one = 1;
    setsockopt(c, IPPROTO_TCP, TCP_NODELAY, (const char *)&one, sizeof one);
    if (!path || src_open(&j->src, path, hw && atoi(hw), !back && (!audio || atoi(audio))) < 0) {
        const char *e = "HTTP/1.1 500 Error\r\nAccess-Control-Allow-Origin: *\r\nContent-Length: 0\r\nConnection: close\r\n\r\n";
        send_all(c, e, strlen(e));
    } else if (send_all(c, ok, strlen(ok)) == 0) {
        /* trechos */
        double A[256], B[256]; int np = 0;
        for (char *p = parts; p && *p && np < 256;) {
            double a = 0, b = 0; int used = 0;
            if (sscanf(p, "%lf-%lf%n", &a, &b, &used) < 2) break;
            if (b > a) { A[np] = a; B[np] = b; np++; }
            p += used; if (*p == ',') p++; else break;
        }
        if (!np) { A[0] = 0; B[0] = j->src.fmt->duration > 0 ? j->src.fmt->duration / (double)AV_TIME_BASE : 1e9; np = 1; }
        double total = 0; for (int k = 0; k < np; k++) total += (B[k] - A[k]) / j->rate;
        uint8_t info[24];
        put_f64(info, j->src.fps); put_u32(info + 8, j->src.as >= 0 && !back); put_u32(info + 12, RATE); put_f64(info + 16, total);
        send_packet(j, 4, info, 24);
        if (back) {
            /* para trás: do último trecho para o primeiro */
            for (int k = np - 1; k >= 0 && alive(j); k--) { j->a = A[k]; j->b = B[k]; play_back(j); j->obase += (B[k] - A[k]) / j->rate; }
        } else {
            for (int k = 0; k < np && alive(j); k++) {
                j->a = A[k]; j->b = B[k]; j->first_part = k == 0; j->last_part = k == np - 1;
                play_part(j);
                j->obase += (B[k] - A[k]) / j->rate;
            }
        }
        if (alive(j)) send_packet(j, 3, NULL, 0);
    }
    src_close(&j->src);
    av_free(path); av_free(parts); av_free(j->vf); av_free(hw); av_free(rate); av_free(dir); av_free(audio);
    av_free(j->buf);
    CLOSESOCK(c);
    av_free(j);
    return NULL;
}

static void *accept_loop(void *arg) {
    (void)arg;
    for (;;) {
        sock_t c = accept(listener, NULL, NULL);
        if (c == BADSOCK) continue;
        spawn(serve_one, (void *)(intptr_t)c);
    }
    return NULL;
}

/* Liga o servidor (uma vez). "ok <porta> <senha>" ou "err ...". */
void play_serve(void) {
    static int port = 0;
    if (!port) {
#ifdef _WIN32
        WSADATA w; WSAStartup(MAKEWORD(2, 2), &w);
#endif
        listener = socket(AF_INET, SOCK_STREAM, 0);
        struct sockaddr_in a; memset(&a, 0, sizeof a);
        a.sin_family = AF_INET; a.sin_addr.s_addr = htonl(INADDR_LOOPBACK); a.sin_port = 0;
        socklen_t len = sizeof a;
        if (listener == BADSOCK || bind(listener, (struct sockaddr *)&a, sizeof a) < 0 || listen(listener, 8) < 0 ||
            getsockname(listener, (struct sockaddr *)&a, &len) < 0) {
            printf("err serve\n"); fflush(stdout); return;
        }
        port = ntohs(a.sin_port);
        for (int i = 0; i < 4; i++) snprintf(play_token + i * 8, 9, "%08x", av_get_random_seed());
        spawn(accept_loop, NULL);
    }
    printf("ok %d %s\n", port, play_token);
    fflush(stdout);
}

/* Para a transmissão atual (pausou). */
void play_stop(void) { gen_next(); }
