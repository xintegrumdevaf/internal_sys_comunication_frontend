import { useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2, MessagesSquare, RefreshCcw } from "lucide-react";
import { MessageMediaBody } from "@/modules/conversations/ui/MessageMediaBody";
import { dayLabel, messageClock } from "@/shared/datetime";
import {
  findingHighlightClass,
  findingSeverityForMessage,
  qualityFindingCategoryLabel,
  qualityFindingSeverityLabel,
  qualityReviewStatusLabel,
  qualityReviewTriggerLabel,
} from "@/modules/quality/domain/quality-review";
import { useQualityReviewDetail } from "@/modules/quality/application/use-quality-review-detail";
import { CordialityBadge } from "@/modules/quality/ui/CordialityBadge";

/**
 * Detalle de review: timeline con highlight de findings + panel lateral.
 * Test de highlight: `finding-highlight` + data-severity en mensajes remarcados.
 */
export function QualityReviewDetail({
  reviewId,
  onBack,
  agentName,
}: {
  reviewId: string;
  onBack: () => void;
  agentName: (agentId: string) => string;
}) {
  const navigate = useNavigate();
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const {
    review,
    messages,
    loading,
    busy,
    backendUnavailable,
    noteDraft,
    setNoteDraft,
    submitNote,
    markReviewed,
    requestOnDemand,
    chatDeepLink,
  } = useQualityReviewDetail(reviewId);

  useEffect(() => {
    messageRefs.current = {};
  }, [reviewId]);

  const scrollToMessage = (messageId: string) => {
    messageRefs.current[messageId]?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  if (backendUnavailable) {
    return (
      <div className="space-y-4 animate-fade-up">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Volver
        </button>
        <div className="p-6 rounded-xl border border-border bg-card text-sm text-muted-foreground">
          <p className="font-bold text-foreground mb-1">Supervisión de calidad no disponible</p>
          <p>Pendiente de backend (Etapa 10). No hay puntuaciones simuladas.</p>
        </div>
      </div>
    );
  }

  if (loading && !review) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground p-8 animate-fade-up">
        <Loader2 className="size-4 animate-spin" /> Cargando revisión…
      </div>
    );
  }

  if (!review) {
    return (
      <div className="space-y-4 animate-fade-up">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Volver
        </button>
        <p className="text-sm text-muted-foreground">No se encontró esta revisión.</p>
      </div>
    );
  }

  let lastRenderedDay = "";

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Volver al ranking
        </button>
        <div className="flex flex-wrap gap-2">
          {chatDeepLink && (
            <button
              type="button"
              onClick={() =>
                void navigate({ to: chatDeepLink.to, search: chatDeepLink.search })
              }
              className="inline-flex items-center gap-1.5 text-[11px] px-3 py-2 rounded-md border border-border font-bold uppercase hover:bg-foreground/5"
            >
              <MessagesSquare className="size-3.5" /> Abrir chat interno
            </button>
          )}
          {review.status === "ready" && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void markReviewed()}
              className="text-[11px] px-3 py-2 rounded-md bg-primary text-primary-foreground font-bold uppercase disabled:opacity-40"
            >
              Marcar revisada
            </button>
          )}
          {(review.status === "failed") && (
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void requestOnDemand().then((id) => {
                  if (id && id !== reviewId) {
                    void navigate({ to: "/calidad", search: { reviewId: id } });
                  }
                })
              }
              className="inline-flex items-center gap-1.5 text-[11px] px-3 py-2 rounded-md border border-border font-bold uppercase hover:bg-foreground/5 disabled:opacity-40"
            >
              <RefreshCcw className="size-3.5" /> Reintentar análisis
            </button>
          )}
        </div>
      </div>

      <section className="grid grid-cols-12 gap-6 min-h-[560px]">
        <div className="col-span-12 lg:col-span-7 bg-card border border-border rounded-xl flex flex-col overflow-hidden min-h-[480px]">
          <div className="p-4 border-b border-border bg-background/60">
            <h3 className="text-xs font-extrabold uppercase tracking-widest">
              Timeline · {review.customerLabel || "Cliente"}
            </h3>
            <p className="text-[10px] text-muted-foreground mt-1">
              {review.waPhone ? `${review.waPhone} · ` : ""}
              Agente {agentName(review.agentId)} · mensajes remarcados = hallazgos
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-background/40">
            {review.status === "pending" && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                <Loader2 className="size-3.5 animate-spin" /> Análisis en curso…
              </div>
            )}
            {messages.map((m) => {
              const fromCustomer = m.author === "customer";
              const day = dayLabel(m.createdAt);
              const showDay = day !== lastRenderedDay;
              lastRenderedDay = day;
              const severity = findingSeverityForMessage(review.findings, m.id);
              const highlight =
                severity === "high" ? findingHighlightClass("high") : "";
              return (
                <div key={m.id}>
                  {showDay && (
                    <div className="flex justify-center my-3">
                      <span className="px-3 py-1 rounded-full bg-foreground/5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                        {day}
                      </span>
                    </div>
                  )}
                  <div
                    ref={(el) => {
                      messageRefs.current[m.id] = el;
                    }}
                    data-message-id={m.id}
                    data-finding-severity={severity === "high" ? "high" : undefined}
                    className={`flex items-end gap-2 mb-2 ${fromCustomer ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[75%] px-3 py-2 rounded-2xl text-[12px] leading-snug shadow-sm ${
                        fromCustomer
                          ? "bg-card border border-border rounded-bl-md"
                          : highlight
                            ? `rounded-br-md finding-highlight ${highlight}`
                            : "bg-primary text-primary-foreground rounded-br-md"
                      }`}
                    >
                      {!fromCustomer && (
                        <p
                          className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${
                            highlight ? "text-white/80" : "opacity-75"
                          }`}
                        >
                          {m.author === "agent" ? agentName(m.agentId ?? review.agentId) : "Asistente IA"}
                        </p>
                      )}
                      <MessageMediaBody message={m} />
                      <div
                        className={`flex justify-end mt-1.5 ${
                          fromCustomer
                            ? "text-muted-foreground"
                            : highlight
                              ? "text-white/80"
                              : "text-primary-foreground/80"
                        }`}
                      >
                        <span className="text-[10px] tabular-nums">
                          {messageClock(m.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {messages.length === 0 && (
              <p className="text-xs text-muted-foreground text-center mt-8">
                No hay mensajes para mostrar en este caso.
              </p>
            )}
          </div>
        </div>

        <aside className="col-span-12 lg:col-span-5 space-y-4">
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-extrabold uppercase tracking-widest">Resumen</h3>
              <CordialityBadge score={review.cordialityScore} />
            </div>
            <p className="text-[11px] font-mono tabular-nums text-muted-foreground">
              Msgs {review.messagesAnalyzed}/{review.messagesTotal}
              {review.chunkSize > 0 ? ` · tramo ${review.chunkSize}` : ""}
            </p>
            <dl className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <dt className="text-muted-foreground">Estado</dt>
                <dd className="font-bold">{qualityReviewStatusLabel(review.status)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Origen</dt>
                <dd className="font-bold">{qualityReviewTriggerLabel(review.trigger)}</dd>
              </div>
            </dl>
            {review.status === "failed" && (
              <p className="text-[11px] text-danger">
                {review.errorMessage ??
                  "El análisis falló. Puedes reintentar desde el botón superior."}
              </p>
            )}
            {review.summary && (
              <p className="text-[12px] leading-relaxed text-foreground/90 whitespace-pre-wrap">
                {review.summary}
              </p>
            )}
            {review.efficiencyNotes && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                  Eficiencia
                </p>
                <p className="text-[12px] leading-relaxed">{review.efficiencyNotes}</p>
              </div>
            )}
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="text-xs font-extrabold uppercase tracking-widest">
                Hallazgos ({review.findings.length})
              </h3>
            </div>
            <ul className="divide-y divide-border max-h-56 overflow-y-auto">
              {review.findings.map((f) => (
                <li key={f.id}>
                  <button
                    type="button"
                    onClick={() => scrollToMessage(f.messageId)}
                    className="w-full text-left p-3 hover:bg-foreground/5 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase">
                        {qualityFindingSeverityLabel(f.severity)}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {qualityFindingCategoryLabel(f.category)}
                      </span>
                    </div>
                    <p className="text-[11px] font-medium line-clamp-2">{f.excerpt}</p>
                    <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">
                      {f.rationale}
                    </p>
                  </button>
                </li>
              ))}
              {review.findings.length === 0 && (
                <li className="p-4 text-[11px] text-muted-foreground">
                  Sin hallazgos en esta revisión.
                </li>
              )}
            </ul>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-widest">
              Notas de coaching
            </h3>
            <ul className="space-y-2 max-h-36 overflow-y-auto">
              {review.notes.map((n) => (
                <li
                  key={n.id}
                  className="p-2 rounded-md border border-border bg-background/40 text-[11px]"
                >
                  <p className="leading-relaxed">{n.body}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {new Date(n.createdAt).toLocaleString("es-CO")}
                  </p>
                </li>
              ))}
              {review.notes.length === 0 && (
                <li className="text-[11px] text-muted-foreground">Aún no hay notas.</li>
              )}
            </ul>
            <textarea
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              rows={3}
              placeholder="Escribe una nota de coaching…"
              className="w-full text-xs px-3 py-2 border border-border rounded-md bg-background resize-y outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              type="button"
              disabled={busy || !noteDraft.trim()}
              onClick={() => void submitNote()}
              className="w-full text-[11px] px-3 py-2 rounded-md bg-primary text-primary-foreground font-bold uppercase disabled:opacity-40"
            >
              Guardar nota
            </button>
          </div>
        </aside>
      </section>
    </div>
  );
}
