import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2, MessagesSquare, RefreshCcw } from "lucide-react";
import { dayLabel } from "@/shared/datetime";
import type { QualityFindingDto } from "@/modules/quality/domain/quality-review";
import { useQualityReviewDetail } from "@/modules/quality/application/use-quality-review-detail";
import { QualitySummaryCard } from "@/modules/quality/ui/QualitySummaryCard";
import {
  QualityTimelineMessage,
  formatElapsedNotice,
} from "@/modules/quality/ui/QualityTimelineMessage";
import { internalChatApi } from "@/services/internalChatApi";
import { toast } from "sonner";

/**
 * Detalle de review: timeline con aislamiento de agente auditado, chips de traspaso
 * y diferenciación de demoras de SLA vs faltas de respeto.
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
  const [scopeFilter, setScopeFilter] = useState<"audited" | "all">("audited");

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
    reanalyze,
    chatDeepLink,
  } = useQualityReviewDetail(reviewId);

  useEffect(() => {
    messageRefs.current = {};
  }, [reviewId]);

  const scrollToMessage = (messageId: string) => {
    messageRefs.current[messageId]?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleObjectInChat = async (agentId: string, revId: string, finding: QualityFindingDto) => {
    try {
      const thread = await internalChatApi.getOrCreateDirectThread(agentId, revId);

      await internalChatApi.sendMessage(thread.id, {
        body: "Observación sobre el caso: por favor justificar o corregir este fragmento.",
        type: "quality_quote",
        contextData: {
          qualityReviewId: revId,
          originalMessageId: finding.messageId,
          category: finding.category,
          severity: finding.severity,
          excerpt: finding.excerpt,
          cordialityScore: review?.cordialityScore ?? undefined,
        },
      });

      void navigate({
        to: "/chat-interno",
        search: { threadId: thread.id, peerId: agentId, qualityReviewId: revId },
      });
      toast.success("Observación enviada al chat interno");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al objetar en chat");
    }
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

  const otherAgentsPresent = messages.some(
    (m) => m.author === "agent" && Boolean(m.agentId) && m.agentId !== review.agentId,
  );

  const displayedMessages = messages.filter((m) => {
    if (scopeFilter === "all") return true;
    if (m.author === "agent" && Boolean(m.agentId) && m.agentId !== review.agentId) {
      return false;
    }
    return true;
  });

  let lastRenderedDay = "";
  let lastMessageTime: Date | null = null;

  return (
    <div className="flex flex-col flex-1 min-h-0 min-w-0 h-[calc(100dvh-130px)] max-h-[calc(100dvh-130px)] gap-3 sm:gap-4 animate-fade-up">
      {/* Barra de Acciones Superior Fija */}
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 p-3 sm:p-3.5 rounded-xl border border-border bg-card shadow-xs">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ArrowLeft className="size-4" /> Volver al ranking
        </button>
        <div className="flex flex-wrap gap-2 sm:gap-2.5">
          {chatDeepLink && (
            <button
              type="button"
              onClick={() => void navigate({ to: chatDeepLink.to, search: chatDeepLink.search })}
              className="inline-flex items-center gap-2 text-xs px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg border border-border font-bold uppercase hover:bg-foreground/5 transition-colors cursor-pointer"
            >
              <MessagesSquare className="size-4" /> Abrir chat interno
            </button>
          )}
          <button
            type="button"
            disabled={busy || review.status === "pending"}
            onClick={() => void reanalyze()}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg border border-border font-bold uppercase hover:bg-foreground/5 disabled:opacity-40 transition-colors cursor-pointer"
            title="Volver a evaluar este chat completo con el prompt y reglas de calidad vigentes"
          >
            <RefreshCcw
              className={`size-3.5 ${busy || review.status === "pending" ? "animate-spin" : ""}`}
            />
            {busy || review.status === "pending" ? "Analizando…" : "Reanalizar con IA"}
          </button>
          {review.status === "ready" && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void markReviewed()}
              className="text-xs px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg bg-primary text-primary-foreground font-bold uppercase disabled:opacity-40 hover:bg-primary/90 transition-colors shadow-xs cursor-pointer"
            >
              Marcar revisada
            </button>
          )}
        </div>
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 flex-1 min-h-0 h-full overflow-hidden">
        {/* Columna Izquierda: Timeline con scroll propio */}
        <div className="col-span-12 lg:col-span-7 bg-card border border-border rounded-xl flex flex-col overflow-hidden min-h-0 h-full shadow-xs">
          <div className="shrink-0 p-3 sm:p-4 border-b border-border bg-background/60 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-widest">
                Timeline · {review.customerLabel || "Cliente"}
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {review.waPhone ? `${review.waPhone} · ` : ""}
                Auditando a {agentName(review.agentId)}
              </p>
            </div>

            {/* Selector de ámbito si hay múltiples agentes en el caso */}
            {otherAgentsPresent && (
              <div className="flex items-center p-0.5 rounded-lg border border-border bg-background shadow-2xs">
                <button
                  type="button"
                  onClick={() => setScopeFilter("audited")}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all cursor-pointer ${
                    scopeFilter === "audited"
                      ? "bg-primary text-primary-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="Mostrar únicamente los mensajes entre el cliente y el agente auditado"
                >
                  Solo {agentName(review.agentId)}
                </button>
                <button
                  type="button"
                  onClick={() => setScopeFilter("all")}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all cursor-pointer ${
                    scopeFilter === "all"
                      ? "bg-primary text-primary-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="Mostrar la conversación completa incluyendo agentes anteriores o posteriores"
                >
                  Conversación completa
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-1 bg-background/40">
            {review.status === "pending" && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                <Loader2 className="size-3.5 animate-spin" /> Análisis en curso…
              </div>
            )}

            {displayedMessages.map((m) => {
              const msgDate = new Date(m.createdAt);
              const day = dayLabel(m.createdAt);
              const showDay = day !== lastRenderedDay;
              lastRenderedDay = day;

              let elapsedNotice: string | null = null;
              if (!showDay && lastMessageTime) {
                const diffMs = msgDate.getTime() - lastMessageTime.getTime();
                elapsedNotice = formatElapsedNotice(diffMs);
              }
              lastMessageTime = msgDate;

              const finding = review.findings.find((f) => f.messageId === m.id);

              return (
                <QualityTimelineMessage
                  key={m.id}
                  message={m}
                  auditedAgentId={review.agentId}
                  agentName={agentName}
                  finding={finding}
                  showDay={showDay}
                  day={day}
                  elapsedNotice={elapsedNotice}
                  messageRef={(el) => {
                    messageRefs.current[m.id] = el;
                  }}
                />
              );
            })}

            {displayedMessages.length === 0 && (
              <p className="text-xs text-muted-foreground text-center mt-8">
                No hay mensajes para mostrar en este ámbito.
              </p>
            )}
          </div>
        </div>

        {/* Columna Derecha: Resumen, Hallazgos y Notas con scroll propio */}
        <aside className="col-span-12 lg:col-span-5 flex flex-col min-h-0 h-full overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1 sm:pr-2">
            <QualitySummaryCard
              review={review}
              onScrollToMessage={scrollToMessage}
              onObjectInChat={(f) => void handleObjectInChat(review.agentId, review.id, f)}
            />

            <div className="bg-card border border-border rounded-xl p-4 space-y-3 shadow-xs">
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
                className="w-full text-[11px] px-3 py-2 rounded-md bg-primary text-primary-foreground font-bold uppercase disabled:opacity-40 cursor-pointer"
              >
                Guardar nota
              </button>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
