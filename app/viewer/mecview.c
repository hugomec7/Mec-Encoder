/*
 * mecview — motor de quadros do player do Mec Encoder.
 *
 * Fica rodando ao lado do app com os vídeos abertos. Para cada pedido, pula direto para o quadro
 * (sem abrir o arquivo de novo), lê na placa de vídeo quando dá (D3D11VA no Windows) ou no processador,
 * passa pelo mesmo filtro da prévia (giro, recorte, tamanho, HDR → SDR) e devolve o quadro em RGBA.
 *
 * Protocolo (uma linha por pedido na entrada; respostas na saída):
 *   open <id> <hw 0|1> <caminho>   → "ok <largura> <altura> <hw 0|1> <ms>\n"            ou "err <motivo>\n"
 *   frame <id> <t> <filtro>        → "img <w> <h> <bytes> <t do quadro> <pulou 0|1> <quadros lidos>
 *                                      <ms ler+decodificar> <ms copiar da placa> <ms filtro> <ms total> <hw 0|1>\n"
 *                                    seguido de <bytes> de RGBA (w*h*4)                  ou "err <motivo>\n"
 *                                    (+ " <da memória 0|1>" no fim da linha)
 *   cache <MB>                     → "ok\n"   (quanto de RAM a memória de quadros pode usar)
 *   close <id>                     → "ok\n"
 *   quit
 *
 * Memória de quadros: depois de entregar um quadro, enquanto não chega outro pedido, o motor lê em
 * segundo plano os quadros em volta (um pouco para frente, depois para trás, depois mais para frente)
 * e guarda prontos (já filtrados). Clicar ou andar com as setas ali perto sai da memória, na hora.
 * <t> é em segundos a partir do começo do arquivo (como o -ss do FFmpeg).
 */
#include <libavformat/avformat.h>
#include <libavcodec/avcodec.h>
#include <libavfilter/avfilter.h>
#include <libavfilter/buffersrc.h>
#include <libavfilter/buffersink.h>
#include <libavutil/hwcontext.h>
#include <libavutil/imgutils.h>
#include <libavutil/opt.h>
#include <libavutil/avstring.h>
#include <libavutil/time.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#ifdef _WIN32
#include <fcntl.h>
#include <io.h>
#include <windows.h>
#else
#include <poll.h>
#include <unistd.h>
#endif

#define MAX_CLIPS 4
#define LINE_MAX_LEN 65536

typedef struct Clip {
    int used;
    long long id;
    unsigned long long touched;
    AVFormatContext *fmt;
    AVCodecContext *dec;
    AVBufferRef *hwdev;
    enum AVPixelFormat hw_fmt;
    int vs;                 /* índice da faixa de vídeo */
    AVRational tb;
    int64_t start;          /* começo do arquivo na base de tempo da faixa */
    int64_t half;           /* meio quadro na base da faixa */
    int64_t last_ts;        /* tempo do último quadro que saiu do decodificador (AV_NOPTS_VALUE = nenhum) */
    int eof, sent_eof;
    AVFrame *last;          /* último quadro entregue (já na memória do PC), para repetir sem ler de novo */
    int64_t last_pick;
    int last_hw;
    /* filtro da prévia */
    AVFilterGraph *graph;
    AVFilterContext *src, *sink;
    char *graph_desc;
    int gw, gh, gfmt;
} Clip;

static Clip clips[MAX_CLIPS];
static unsigned long long tick = 0;
static AVPacket *pkt;

static double ms_since(int64_t t0) { return (av_gettime_relative() - t0) / 1000.0; }

static void reply_err(const char *what, int code) {
    char buf[256] = "";
    if (code) av_strerror(code, buf, sizeof buf);
    printf("err %s%s%s\n", what, code ? ": " : "", buf);
    fflush(stdout);
}

static enum AVPixelFormat pick_format(AVCodecContext *ctx, const enum AVPixelFormat *fmts) {
    Clip *c = (Clip *)ctx->opaque;
    const enum AVPixelFormat *p;
    if (c && c->hw_fmt != AV_PIX_FMT_NONE)
        for (p = fmts; *p != AV_PIX_FMT_NONE; p++) if (*p == c->hw_fmt) return *p;
    /* a placa não aceitou (ex.: 4:2:2): primeiro formato de CPU */
    for (p = fmts; *p != AV_PIX_FMT_NONE; p++) {
        const AVPixFmtDescriptor *d = av_pix_fmt_desc_get(*p);
        if (d && !(d->flags & AV_PIX_FMT_FLAG_HWACCEL)) return *p;
    }
    return fmts[0];
}

static void free_graph(Clip *c) {
    avfilter_graph_free(&c->graph);
    c->src = c->sink = NULL;
    av_freep(&c->graph_desc);
}

static void cache_forget(long long id);
static void close_clip(Clip *c) {
    if (!c->used) return;
    cache_forget(c->id);
    free_graph(c);
    av_frame_free(&c->last);
    avcodec_free_context(&c->dec);
    avformat_close_input(&c->fmt);
    av_buffer_unref(&c->hwdev);
    memset(c, 0, sizeof *c);
}

static Clip *find_clip(long long id) {
    for (int i = 0; i < MAX_CLIPS; i++) if (clips[i].used && clips[i].id == id) return &clips[i];
    return NULL;
}

static int open_decoder(Clip *c, int hw) {
    const AVCodec *codec = NULL;
    AVStream *st = c->fmt->streams[c->vs];
    codec = avcodec_find_decoder(st->codecpar->codec_id);
    if (!codec) return AVERROR_DECODER_NOT_FOUND;
    c->dec = avcodec_alloc_context3(codec);
    if (!c->dec) return AVERROR(ENOMEM);
    avcodec_parameters_to_context(c->dec, st->codecpar);
    c->dec->pkt_timebase = st->time_base;
    c->dec->opaque = c;
    c->dec->get_format = pick_format;
    c->hw_fmt = AV_PIX_FMT_NONE;
    if (hw) {
#ifdef _WIN32
        const char *names[] = { "d3d11va", "cuda", NULL };
#else
        const char *names[] = { "cuda", "vaapi", NULL };
#endif
        for (int n = 0; names[n] && c->hw_fmt == AV_PIX_FMT_NONE; n++) {
            enum AVHWDeviceType type = av_hwdevice_find_type_by_name(names[n]);
            if (type == AV_HWDEVICE_TYPE_NONE) continue;
            for (int i = 0;; i++) {
                const AVCodecHWConfig *cfg = avcodec_get_hw_config(codec, i);
                if (!cfg) break;
                if ((cfg->methods & AV_CODEC_HW_CONFIG_METHOD_HW_DEVICE_CTX) && cfg->device_type == type) {
                    if (av_hwdevice_ctx_create(&c->hwdev, type, NULL, NULL, 0) >= 0) {
                        c->hw_fmt = cfg->pix_fmt;
                        c->dec->hw_device_ctx = av_buffer_ref(c->hwdev);
                    }
                    break;
                }
            }
        }
    }
    /* na placa: sem atraso de threads; na CPU: todas as threads (lê o GOP mais rápido) */
    c->dec->thread_count = c->hw_fmt != AV_PIX_FMT_NONE ? 1 : 0;
    return avcodec_open2(c->dec, codec, NULL);
}

static void cmd_open(long long id, int hw, const char *path) {
    int64_t t0 = av_gettime_relative();
    Clip *c = find_clip(id);
    if (c) close_clip(c);
    c = NULL;
    for (int i = 0; i < MAX_CLIPS; i++) if (!clips[i].used) { c = &clips[i]; break; }
    if (!c) { /* fecha o mais antigo */
        c = &clips[0];
        for (int i = 1; i < MAX_CLIPS; i++) if (clips[i].touched < c->touched) c = &clips[i];
        close_clip(c);
    }
    int r = avformat_open_input(&c->fmt, path, NULL, NULL);
    if (r < 0) { memset(c, 0, sizeof *c); reply_err("open", r); return; }
    c->used = 1; c->id = id; c->touched = ++tick;
    if ((r = avformat_find_stream_info(c->fmt, NULL)) < 0) { close_clip(c); reply_err("info", r); return; }
    c->vs = av_find_best_stream(c->fmt, AVMEDIA_TYPE_VIDEO, -1, -1, NULL, 0);
    if (c->vs < 0) { close_clip(c); reply_err("no video", 0); return; }
    if ((r = open_decoder(c, hw)) < 0) { close_clip(c); reply_err("decoder", r); return; }
    AVStream *st = c->fmt->streams[c->vs];
    c->tb = st->time_base;
    /* zero = começo do arquivo (como o -ss do FFmpeg) */
    c->start = c->fmt->start_time != AV_NOPTS_VALUE ? av_rescale_q(c->fmt->start_time, AV_TIME_BASE_Q, c->tb) : 0;
    AVRational fr = st->avg_frame_rate.num ? st->avg_frame_rate : st->r_frame_rate;
    if (!fr.num || !fr.den) fr = (AVRational){ 30, 1 };
    c->half = av_rescale_q(1, av_inv_q(fr), c->tb) / 2;
    if (c->half < 1) c->half = 1;
    c->last_ts = AV_NOPTS_VALUE;
    c->last_pick = AV_NOPTS_VALUE;
    c->last = av_frame_alloc();
    printf("ok %d %d %d %.1f\n", st->codecpar->width, st->codecpar->height, c->hw_fmt != AV_PIX_FMT_NONE, ms_since(t0));
    fflush(stdout);
}

/* Pula para o quadro-chave antes de `ts` e limpa o decodificador. */
static void do_seek(Clip *c, int64_t ts) {
    if (av_seek_frame(c->fmt, c->vs, ts, AVSEEK_FLAG_BACKWARD) < 0)
        av_seek_frame(c->fmt, c->vs, ts, AVSEEK_FLAG_BACKWARD | AVSEEK_FLAG_ANY);
    avcodec_flush_buffers(c->dec);
    c->eof = c->sent_eof = 0;
    c->last_ts = AV_NOPTS_VALUE;
}

/* Próximo quadro do decodificador (na placa ou na CPU). 0 = saiu um; AVERROR_EOF = acabou o arquivo. */
static int decode_next(Clip *c, AVFrame *f) {
    for (;;) {
        int r = avcodec_receive_frame(c->dec, f);
        if (r == 0) {
            int64_t ts = f->best_effort_timestamp != AV_NOPTS_VALUE ? f->best_effort_timestamp : f->pts;
            if (ts == AV_NOPTS_VALUE) ts = c->last_ts != AV_NOPTS_VALUE ? c->last_ts + 2 * c->half : c->start;
            f->best_effort_timestamp = ts;
            c->last_ts = ts;
            return 0;
        }
        if (r == AVERROR_EOF) { c->eof = 1; return r; }
        if (r != AVERROR(EAGAIN)) return r;
        if (c->sent_eof) { c->eof = 1; return AVERROR_EOF; }
        r = av_read_frame(c->fmt, pkt);
        if (r == AVERROR_EOF) { avcodec_send_packet(c->dec, NULL); c->sent_eof = 1; continue; }
        if (r < 0) return r;
        if (pkt->stream_index == c->vs) avcodec_send_packet(c->dec, pkt);
        av_packet_unref(pkt);
    }
}

/* Lê até sair o quadro que cobre `target`. Devolve o quadro (na placa ou na CPU) em `out`. */
static int decode_to(Clip *c, int64_t target, AVFrame *out, int *ndec) {
    AVFrame *f = av_frame_alloc(), *prev = av_frame_alloc();
    int r = 0, found = 0, have_prev = 0;
    while (!found) {
        r = decode_next(c, f);
        if (r < 0) break;
        (*ndec)++;
        int64_t ts = f->best_effort_timestamp;
        if (ts >= target - c->half) {
            /* passou do alvo sem cair nele (quadro faltando): fica com o anterior, se estava mais perto */
            if (have_prev && ts > target + c->half && target - prev->best_effort_timestamp < ts - target) av_frame_move_ref(out, prev);
            else av_frame_move_ref(out, f);
            found = 1;
            break;
        }
        av_frame_unref(prev); av_frame_move_ref(prev, f); have_prev = 1;
    }
    /* fim do arquivo antes do alvo: o último quadro */
    if (!found && have_prev) { av_frame_move_ref(out, prev); found = 1; }
    av_frame_free(&f); av_frame_free(&prev);
    return found ? 0 : (r < 0 ? r : AVERROR_EOF);
}

/* ---------- memória de quadros ---------- */
typedef struct Ent { long long id; uint32_t key; int64_t ts; int w, h; uint8_t *data; size_t size; unsigned long long used; } Ent;
static Ent *ents; static int nents, capents;
static size_t cache_bytes, cache_limit = (size_t)1536 << 20;

static uint32_t hash_str(const char *s) { uint32_t h = 2166136261u; while (*s) { h ^= (uint8_t)*s++; h *= 16777619u; } return h; }

static Ent *cache_find(long long id, uint32_t key, int64_t target, int64_t half) {
    Ent *best = NULL;
    for (int i = 0; i < nents; i++) {
        Ent *e = &ents[i];
        if (e->id != id || e->key != key || e->ts < target - half || e->ts > target + half) continue;
        if (!best || llabs(e->ts - target) < llabs(best->ts - target)) best = e;
    }
    if (best) best->used = ++tick;
    return best;
}
static void cache_drop(int i) { cache_bytes -= ents[i].size; av_free(ents[i].data); ents[i] = ents[--nents]; }
static void cache_trim(size_t need) {
    while (nents && cache_bytes + need > cache_limit) {
        int o = 0;
        for (int i = 1; i < nents; i++) if (ents[i].used < ents[o].used) o = i;
        cache_drop(o);
    }
}
static void cache_forget(long long id) { for (int i = nents - 1; i >= 0; i--) if (ents[i].id == id) cache_drop(i); }
static void cache_put(long long id, uint32_t key, int64_t ts, const AVFrame *rgb) {
    size_t row = (size_t)rgb->width * 4, size = row * rgb->height;
    if (size > cache_limit / 4) return;
    for (int i = 0; i < nents; i++) if (ents[i].id == id && ents[i].key == key && ents[i].ts == ts) { ents[i].used = ++tick; return; }
    cache_trim(size);
    if (nents == capents) { capents = capents ? capents * 2 : 256; ents = av_realloc_array(ents, capents, sizeof *ents); }
    uint8_t *d = av_malloc(size);
    if (!d) return;
    for (int y = 0; y < rgb->height; y++) memcpy(d + y * row, rgb->data[0] + (size_t)y * rgb->linesize[0], row);
    ents[nents++] = (Ent){ id, key, ts, rgb->width, rgb->height, d, size, ++tick };
    cache_bytes += size;
}

static int build_graph(Clip *c, const AVFrame *f, const char *desc) {
    char args[512];
    free_graph(c);
    c->graph = avfilter_graph_alloc();
    if (!c->graph) return AVERROR(ENOMEM);
    AVRational sar = f->sample_aspect_ratio.num ? f->sample_aspect_ratio : (AVRational){ 1, 1 };
    snprintf(args, sizeof args, "video_size=%dx%d:pix_fmt=%d:time_base=%d/%d:pixel_aspect=%d/%d",
             f->width, f->height, f->format, c->tb.num, c->tb.den, sar.num, sar.den);
    /* espaço de cor e faixa na entrada (FFmpeg 7.1+): sem isso o scale antes do zscale trata as cores diferente
       do FFmpeg de linha de comando. Nas versões antigas a opção não existe e é ignorada. */
    c->src = avfilter_graph_alloc_filter(c->graph, avfilter_get_by_name("buffer"), "in");
    if (!c->src) return AVERROR(ENOMEM);
    av_opt_set_int(c->src, "colorspace", f->colorspace, AV_OPT_SEARCH_CHILDREN);
    av_opt_set_int(c->src, "range", f->color_range, AV_OPT_SEARCH_CHILDREN);
    int r = avfilter_init_str(c->src, args);
    if (r < 0) return r;
    r = avfilter_graph_create_filter(&c->sink, avfilter_get_by_name("buffersink"), "out", NULL, NULL, c->graph);
    if (r < 0) return r;
    AVFilterInOut *outs = avfilter_inout_alloc(), *ins = avfilter_inout_alloc();
    outs->name = av_strdup("in"); outs->filter_ctx = c->src; outs->pad_idx = 0; outs->next = NULL;
    ins->name = av_strdup("out"); ins->filter_ctx = c->sink; ins->pad_idx = 0; ins->next = NULL;
    char *full = av_asprintf("%s%sformat=rgba", desc, desc[0] ? "," : "");
    r = avfilter_graph_parse_ptr(c->graph, full, &ins, &outs, NULL);
    av_free(full);
    avfilter_inout_free(&ins); avfilter_inout_free(&outs);
    if (r < 0) return r;
    if ((r = avfilter_graph_config(c->graph, NULL)) < 0) return r;
    c->graph_desc = av_strdup(desc);
    c->gw = f->width; c->gh = f->height; c->gfmt = f->format;
    return 0;
}

/* Quadro da CPU → filtro da prévia → RGBA em `rgb`. */
static int filter_frame(Clip *c, AVFrame *sw, const char *desc, AVFrame *rgb) {
    int r;
    if (!c->graph || c->gw != sw->width || c->gh != sw->height || c->gfmt != sw->format || strcmp(c->graph_desc ? c->graph_desc : "", desc)) {
        if ((r = build_graph(c, sw, desc)) < 0) { free_graph(c); return r; }
    }
    r = av_buffersrc_add_frame_flags(c->src, sw, AV_BUFFERSRC_FLAG_KEEP_REF);
    if (r >= 0) r = av_buffersink_get_frame(c->sink, rgb);
    if (r < 0) free_graph(c);
    return r;
}

/* Quadro na placa → memória do PC (na CPU já está). */
static int to_cpu(AVFrame *dst, AVFrame *src) {
    if (!src->hw_frames_ctx) return av_frame_ref(dst, src);
    int r = av_hwframe_transfer_data(dst, src, 0);
    if (r >= 0) av_frame_copy_props(dst, src);
    return r;
}

static void send_rgba(int w, int h, const uint8_t *data, int stride) {
    for (int y = 0; y < h; y++) fwrite(data + (size_t)y * stride, 1, (size_t)w * 4, stdout);
    fflush(stdout);
}

/* Deixa o leitor pronto para chegar em `t`: continua lendo se está logo antes (até 3 s, sem quadro-chave
   no meio); senão pula para o quadro-chave antes de `t`. 1 = pulou. */
static int position(Clip *c, int64_t t) {
    int key_ahead = 0;
    if (c->last_ts != AV_NOPTS_VALUE) {
        const AVIndexEntry *k = avformat_index_get_entry_from_timestamp(c->fmt->streams[c->vs], t, AVSEEK_FLAG_BACKWARD);
        key_ahead = k && k->timestamp > c->last_ts + c->half;
    }
    if (c->last_ts == AV_NOPTS_VALUE || c->eof || t <= c->last_ts || t - c->last_ts > (int64_t)(3.0 / av_q2d(c->tb)) || key_ahead) { do_seek(c, t); return 1; }
    return 0;
}

/* ---------- leitura em segundo plano (prefetch) ---------- */
enum { PF_IDLE, PF_FWD1, PF_BACK, PF_FWD2 };
static struct { int stage; Clip *c; long long id; uint32_t key; char *desc; int64_t center, fwd1_end, back_from, fwd2_end; int seeked; } pf;

static void pf_start(Clip *c, uint32_t key, const char *desc, int64_t center, size_t frame_bytes) {
    av_freep(&pf.desc);
    /* quantos quadros cabem: até 1/3 s para frente, 1 s para trás e 2 s para frente, se a memória deixar */
    int64_t fd = 2 * c->half; if (fd < 1) fd = 1;
    double fit = frame_bytes ? (double)cache_limit * 0.7 / frame_bytes : 300;
    int64_t span = (int64_t)(fit * fd);
    int64_t one = (int64_t)(1.0 / av_q2d(c->tb));
    int64_t back = FFMIN(one, span / 3), fwd = FFMIN(2 * one, span - back);
    pf = (typeof(pf)){ PF_FWD1, c, c->id, key, av_strdup(desc), center,
                       center + FFMIN(fwd, one / 3), FFMAX(c->start, center - back), center + fwd, 0 };
}

/* Um passo do prefetch (um quadro). 0 = nada a fazer. */
static int pf_step(void) {
    if (pf.stage == PF_IDLE) return 0;
    Clip *c = pf.c;
    if (!c->used || c->id != pf.id) { pf.stage = PF_IDLE; return 0; }
    AVFrame *f = av_frame_alloc();
    int r = 0, ok = 1;
    if (pf.stage == PF_BACK && !pf.seeked) {
        /* para trás: tudo já na memória? então pula esta parte */
        int all = 1;
        for (int64_t t = pf.back_from; t < pf.center - c->half && all; t += 2 * c->half) all = cache_find(c->id, pf.key, t, c->half) != NULL;
        if (all) { pf.stage = PF_FWD2; pf.seeked = 0; av_frame_free(&f); return 1; }
        do_seek(c, pf.back_from); pf.seeked = 1;
    }
    if ((pf.stage == PF_FWD1 || pf.stage == PF_FWD2) && !pf.seeked) {
        /* para frente: começa no primeiro quadro que ainda não está guardado */
        int64_t end = pf.stage == PF_FWD1 ? pf.fwd1_end : pf.fwd2_end;
        int64_t t = pf.center + 2 * c->half;
        while (t < end && cache_find(c->id, pf.key, t, c->half)) t += 2 * c->half;
        if (t >= end) { pf.stage = pf.stage == PF_FWD1 ? PF_BACK : PF_IDLE; av_frame_free(&f); return 1; }
        position(c, t);
        pf.seeked = 1;
    }
    r = decode_next(c, f);
    if (r < 0) ok = 0;
    if (ok) {
        int64_t ts = f->best_effort_timestamp;
        int stop = 0, want = 0;
        if (pf.stage == PF_FWD1) { want = ts > pf.center; stop = ts >= pf.fwd1_end; }
        else if (pf.stage == PF_BACK) { want = ts >= pf.back_from - c->half && ts < pf.center - c->half; stop = ts >= pf.center - c->half; }
        else { want = ts > pf.center; stop = ts >= pf.fwd2_end; }
        if (want && !cache_find(c->id, pf.key, ts, c->half / 2 + 1)) {
            AVFrame *sw = av_frame_alloc(), *rgb = av_frame_alloc();
            if (to_cpu(sw, f) >= 0 && filter_frame(c, sw, pf.desc, rgb) >= 0) cache_put(c->id, pf.key, ts, rgb);
            av_frame_free(&sw); av_frame_free(&rgb);
        }
        if (stop) {
            if (pf.stage == PF_FWD1) pf.stage = PF_BACK;
            else if (pf.stage == PF_BACK) pf.stage = PF_FWD2;
            else pf.stage = PF_IDLE;
            pf.seeked = 0;
        }
    } else {
        /* fim do arquivo ou erro: passa para a próxima parte */
        pf.stage = pf.stage == PF_FWD1 ? PF_BACK : pf.stage == PF_BACK ? PF_FWD2 : PF_IDLE;
        pf.seeked = 0;
    }
    av_frame_free(&f);
    return 1;
}

static void cmd_frame(long long id, double t, const char *desc) {
    int64_t t0 = av_gettime_relative();
    Clip *c = find_clip(id);
    if (!c) { reply_err("not open", 0); return; }
    c->touched = ++tick;
    uint32_t key = hash_str(desc);
    int64_t target = c->start + (int64_t)(t / av_q2d(c->tb) + 0.5);
    /* já está na memória */
    Ent *e = cache_find(id, key, target, c->half);
    if (e) {
        printf("img %d %d %d %.6f 0 0 0.0 0.0 0.0 %.1f %d 1\n", e->w, e->h, e->w * e->h * 4, (e->ts - c->start) * av_q2d(c->tb), ms_since(t0), c->last_hw);
        send_rgba(e->w, e->h, e->data, e->w * 4);
        pf_start(c, key, desc, e->ts, e->size);
        return;
    }
    int seeked = 0, ndec = 0, r = 0;
    double t_dec = 0, t_xfer = 0, t_filt = 0;
    int same = c->last_pick != AV_NOPTS_VALUE && c->last->data[0] &&
               target >= c->last_pick - c->half && target < c->last_pick + c->half;
    if (!same) {
        AVFrame *raw = av_frame_alloc();
        int64_t td = av_gettime_relative();
        seeked = position(c, target);
        r = decode_to(c, target, raw, &ndec);
        /* o pulo caiu depois do alvo (índice ruim): volta 2 s e tenta de novo */
        if (r >= 0 && seeked && raw->best_effort_timestamp > target + c->half) {
            av_frame_unref(raw);
            do_seek(c, target - (int64_t)(2.0 / av_q2d(c->tb)));
            r = decode_to(c, target, raw, &ndec);
        }
        t_dec = ms_since(td);
        if (r < 0) { av_frame_free(&raw); reply_err("decode", r); return; }
        int64_t tx = av_gettime_relative();
        c->last_hw = raw->hw_frames_ctx != NULL;
        av_frame_unref(c->last);
        r = to_cpu(c->last, raw);
        av_frame_free(&raw);
        t_xfer = ms_since(tx);
        if (r < 0) { reply_err("transfer", r); return; }
        c->last_pick = c->last->best_effort_timestamp != AV_NOPTS_VALUE ? c->last->best_effort_timestamp : target;
    }
    int64_t tf = av_gettime_relative();
    AVFrame *rgb = av_frame_alloc();
    r = filter_frame(c, c->last, desc, rgb);
    t_filt = ms_since(tf);
    if (r < 0) { av_frame_free(&rgb); reply_err("filter", r); return; }
    int w = rgb->width, h = rgb->height;
    double pick = (c->last_pick - c->start) * av_q2d(c->tb);
    printf("img %d %d %d %.6f %d %d %.1f %.1f %.1f %.1f %d 0\n", w, h, w * h * 4, pick, seeked, ndec, t_dec, t_xfer, t_filt, ms_since(t0), c->last_hw);
    send_rgba(w, h, rgb->data[0], rgb->linesize[0]);
    cache_put(id, key, c->last_pick, rgb);
    pf_start(c, key, desc, c->last_pick, (size_t)w * h * 4);
    av_frame_free(&rgb);
}

/* ---------- entrada: linhas do app, sem travar enquanto o prefetch trabalha ---------- */
static char inbuf[LINE_MAX_LEN * 2];
static size_t inlen;

static int has_line(void) { return memchr(inbuf, '\n', inlen) != NULL; }

/* Lê o que já chegou (sem esperar, se `wait` = 0). 0 = fim da entrada. */
static int fill(int wait) {
    if (inlen >= sizeof inbuf - 1) return 1;
#ifdef _WIN32
    HANDLE h = GetStdHandle(STD_INPUT_HANDLE);
    DWORD avail = 0, got = 0;
    if (!wait) { if (!PeekNamedPipe(h, NULL, 0, NULL, &avail, NULL)) return 0; if (!avail) return 1; }
    DWORD want = (DWORD)(sizeof inbuf - 1 - inlen);
    if (!wait && avail < want) want = avail;
    if (!ReadFile(h, inbuf + inlen, want, &got, NULL) || !got) return 0;
    inlen += got;
#else
    if (!wait) { struct pollfd pfd = { 0, POLLIN, 0 }; if (poll(&pfd, 1, 0) <= 0) return 1; }
    ssize_t got = read(0, inbuf + inlen, sizeof inbuf - 1 - inlen);
    if (got <= 0) return 0;
    inlen += (size_t)got;
#endif
    return 1;
}

static int take_line(char *line, size_t cap) {
    char *nl = memchr(inbuf, '\n', inlen);
    if (!nl) return 0;
    size_t n = (size_t)(nl - inbuf);
    size_t m = n < cap - 1 ? n : cap - 1;
    memcpy(line, inbuf, m); line[m] = 0;
    memmove(inbuf, nl + 1, inlen - n - 1); inlen -= n + 1;
    while (m && line[m - 1] == '\r') line[--m] = 0;
    return 1;
}

int main(void) {
#ifdef _WIN32
    _setmode(_fileno(stdout), _O_BINARY);
#endif
    av_log_set_level(AV_LOG_ERROR);
    pkt = av_packet_alloc();
    static char line[LINE_MAX_LEN];
    for (;;) {
        /* pedido novo tem prioridade; sem pedido, um passo do prefetch; sem nada, espera */
        if (!has_line()) {
            if (!fill(0)) break;
            if (!has_line()) {
                if (pf_step()) continue;
                if (!fill(1)) break;
                if (!has_line()) continue;
            }
        }
        take_line(line, sizeof line);
        char cmd[16] = ""; long long id = 0; int off = 0;
        if (sscanf(line, "%15s%n", cmd, &off) < 1) continue;
        char *rest = line + off;
        if (!strcmp(cmd, "quit")) break;
        if (!strcmp(cmd, "open")) {
            int hw = 0, o2 = 0;
            if (sscanf(rest, "%lld %d %n", &id, &hw, &o2) < 2) { reply_err("bad open", 0); continue; }
            pf.stage = PF_IDLE;
            cmd_open(id, hw, rest + o2);
        } else if (!strcmp(cmd, "frame")) {
            double t = 0; int o2 = 0;
            if (sscanf(rest, "%lld %lf %n", &id, &t, &o2) < 2) { reply_err("bad frame", 0); continue; }
            cmd_frame(id, t, o2 ? rest + o2 : "");
        } else if (!strcmp(cmd, "cache")) {
            long long mb = 0; sscanf(rest, "%lld", &mb);
            if (mb >= 64) { cache_limit = (size_t)mb << 20; cache_trim(0); }
            printf("ok\n"); fflush(stdout);
        } else if (!strcmp(cmd, "close")) {
            sscanf(rest, "%lld", &id);
            Clip *c = find_clip(id); if (c) { if (pf.c == c) pf.stage = PF_IDLE; close_clip(c); }
            printf("ok\n"); fflush(stdout);
        } else {
            reply_err("unknown", 0);
        }
    }
    pf.stage = PF_IDLE;
    for (int i = 0; i < MAX_CLIPS; i++) close_clip(&clips[i]);
    av_packet_free(&pkt);
    return 0;
}
