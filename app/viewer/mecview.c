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
 *   close <id>                     → "ok\n"
 *   quit
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
    int eof;
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

static void close_clip(Clip *c) {
    if (!c->used) return;
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

/* Lê até sair o quadro que cobre `target`. Devolve o quadro (na placa ou na CPU) em `out`. */
static int decode_to(Clip *c, int64_t target, AVFrame *out, int *ndec) {
    AVFrame *f = av_frame_alloc();
    int r = 0, found = 0, sent_eof = 0;
    AVFrame *prev = av_frame_alloc(); int have_prev = 0;
    while (!found) {
        r = avcodec_receive_frame(c->dec, f);
        if (r == AVERROR(EAGAIN)) {
            if (sent_eof) break;
            r = av_read_frame(c->fmt, pkt);
            if (r == AVERROR_EOF) { avcodec_send_packet(c->dec, NULL); sent_eof = 1; continue; }
            if (r < 0) break;
            if (pkt->stream_index == c->vs) avcodec_send_packet(c->dec, pkt);
            av_packet_unref(pkt);
            continue;
        }
        if (r == AVERROR_EOF) { c->eof = 1; break; }
        if (r < 0) break;
        (*ndec)++;
        int64_t ts = f->best_effort_timestamp != AV_NOPTS_VALUE ? f->best_effort_timestamp : f->pts;
        if (ts == AV_NOPTS_VALUE) ts = c->last_ts != AV_NOPTS_VALUE ? c->last_ts + 2 * c->half : c->start;
        c->last_ts = ts;
        if (ts >= target - c->half) {
            /* passou do alvo sem cair nele (quadro faltando): fica com o anterior, se estava mais perto */
            if (have_prev && ts > target + c->half && target - prev->best_effort_timestamp < ts - target) {
                av_frame_move_ref(out, prev);
            } else {
                av_frame_move_ref(out, f);
            }
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

static int build_graph(Clip *c, const AVFrame *f, const char *desc) {
    char args[512];
    free_graph(c);
    c->graph = avfilter_graph_alloc();
    if (!c->graph) return AVERROR(ENOMEM);
    AVRational sar = f->sample_aspect_ratio.num ? f->sample_aspect_ratio : (AVRational){ 1, 1 };
    snprintf(args, sizeof args, "video_size=%dx%d:pix_fmt=%d:time_base=%d/%d:pixel_aspect=%d/%d",
             f->width, f->height, f->format, c->tb.num, c->tb.den, sar.num, sar.den);
    int r = avfilter_graph_create_filter(&c->src, avfilter_get_by_name("buffer"), "in", args, NULL, c->graph);
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

static void cmd_frame(long long id, double t, const char *desc) {
    int64_t t0 = av_gettime_relative();
    Clip *c = find_clip(id);
    if (!c) { reply_err("not open", 0); return; }
    c->touched = ++tick;
    int64_t target = c->start + (int64_t)(t / av_q2d(c->tb) + 0.5);
    int seeked = 0, ndec = 0, r = 0;
    double t_dec = 0, t_xfer = 0, t_filt = 0;
    int same = c->last_pick != AV_NOPTS_VALUE && c->last->format != -1 && c->last->data[0] &&
               target >= c->last_pick - c->half && target < c->last_pick + c->half;
    if (!same) {
        AVFrame *raw = av_frame_alloc();
        int64_t td = av_gettime_relative();
        /* pra frente e perto (até 3 s): continua lendo sem pular; senão pula para o quadro-chave antes */
        int64_t near = (int64_t)(3.0 / av_q2d(c->tb));
        /* se existe um quadro-chave entre onde o leitor está e o alvo, pular para ele é mais rápido */
        int key_ahead = 0;
        if (c->last_ts != AV_NOPTS_VALUE) {
            const AVIndexEntry *k = avformat_index_get_entry_from_timestamp(c->fmt->streams[c->vs], target, AVSEEK_FLAG_BACKWARD);
            key_ahead = k && k->timestamp > c->last_ts + c->half;
        }
        if (c->last_ts == AV_NOPTS_VALUE || c->eof || target <= c->last_ts || target - c->last_ts > near || key_ahead) {
            r = av_seek_frame(c->fmt, c->vs, target, AVSEEK_FLAG_BACKWARD);
            if (r < 0) r = av_seek_frame(c->fmt, c->vs, target, AVSEEK_FLAG_BACKWARD | AVSEEK_FLAG_ANY);
            avcodec_flush_buffers(c->dec);
            c->eof = 0; c->last_ts = AV_NOPTS_VALUE; seeked = 1;
        }
        r = decode_to(c, target, raw, &ndec);
        /* o pulo caiu depois do alvo (índice ruim): volta 2 s e tenta de novo */
        if (r >= 0 && seeked && raw->best_effort_timestamp != AV_NOPTS_VALUE && raw->best_effort_timestamp > target + c->half) {
            av_frame_unref(raw);
            av_seek_frame(c->fmt, c->vs, target - (int64_t)(2.0 / av_q2d(c->tb)), AVSEEK_FLAG_BACKWARD);
            avcodec_flush_buffers(c->dec); c->eof = 0; c->last_ts = AV_NOPTS_VALUE;
            r = decode_to(c, target, raw, &ndec);
        }
        t_dec = ms_since(td);
        if (r < 0) { av_frame_free(&raw); reply_err("decode", r); return; }
        int64_t tx = av_gettime_relative();
        c->last_hw = raw->hw_frames_ctx != NULL;
        av_frame_unref(c->last);
        if (raw->hw_frames_ctx) {
            r = av_hwframe_transfer_data(c->last, raw, 0);
            if (r >= 0) { av_frame_copy_props(c->last, raw); }
        } else {
            r = av_frame_ref(c->last, raw);
        }
        av_frame_free(&raw);
        t_xfer = ms_since(tx);
        if (r < 0) { reply_err("transfer", r); return; }
        c->last_pick = c->last->best_effort_timestamp != AV_NOPTS_VALUE ? c->last->best_effort_timestamp : target;
    }
    int64_t tf = av_gettime_relative();
    AVFrame *f = c->last;
    if (!c->graph || c->gw != f->width || c->gh != f->height || c->gfmt != f->format || strcmp(c->graph_desc ? c->graph_desc : "", desc)) {
        if ((r = build_graph(c, f, desc)) < 0) { free_graph(c); reply_err("filter", r); return; }
    }
    AVFrame *in = av_frame_alloc(), *rgb = av_frame_alloc();
    av_frame_ref(in, f);
    r = av_buffersrc_add_frame_flags(c->src, in, AV_BUFFERSRC_FLAG_KEEP_REF);
    if (r >= 0) r = av_buffersink_get_frame(c->sink, rgb);
    av_frame_free(&in);
    t_filt = ms_since(tf);
    if (r < 0) { av_frame_free(&rgb); free_graph(c); reply_err("filter run", r); return; }
    int w = rgb->width, h = rgb->height;
    double pick = (c->last_pick - c->start) * av_q2d(c->tb);
    printf("img %d %d %d %.6f %d %d %.1f %.1f %.1f %.1f %d\n", w, h, w * h * 4, pick, seeked, ndec, t_dec, t_xfer, t_filt, ms_since(t0), c->last_hw);
    for (int y = 0; y < h; y++) fwrite(rgb->data[0] + (size_t)y * rgb->linesize[0], 1, (size_t)w * 4, stdout);
    fflush(stdout);
    av_frame_free(&rgb);
}

int main(void) {
#ifdef _WIN32
    _setmode(_fileno(stdin), _O_BINARY);
    _setmode(_fileno(stdout), _O_BINARY);
#endif
    av_log_set_level(AV_LOG_ERROR);
    pkt = av_packet_alloc();
    static char line[LINE_MAX_LEN];
    while (fgets(line, sizeof line, stdin)) {
        size_t n = strlen(line);
        while (n && (line[n - 1] == '\n' || line[n - 1] == '\r')) line[--n] = 0;
        char cmd[16] = ""; long long id = 0; int off = 0;
        if (sscanf(line, "%15s%n", cmd, &off) < 1) continue;
        char *rest = line + off;
        if (!strcmp(cmd, "quit")) break;
        if (!strcmp(cmd, "open")) {
            int hw = 0, o2 = 0;
            if (sscanf(rest, "%lld %d %n", &id, &hw, &o2) < 2) { reply_err("bad open", 0); continue; }
            cmd_open(id, hw, rest + o2);
        } else if (!strcmp(cmd, "frame")) {
            double t = 0; int o2 = 0;
            if (sscanf(rest, "%lld %lf %n", &id, &t, &o2) < 2) { reply_err("bad frame", 0); continue; }
            cmd_frame(id, t, o2 ? rest + o2 : "");
        } else if (!strcmp(cmd, "close")) {
            sscanf(rest, "%lld", &id);
            Clip *c = find_clip(id); if (c) close_clip(c);
            printf("ok\n"); fflush(stdout);
        } else {
            reply_err("unknown", 0);
        }
    }
    for (int i = 0; i < MAX_CLIPS; i++) close_clip(&clips[i]);
    av_packet_free(&pkt);
    return 0;
}
