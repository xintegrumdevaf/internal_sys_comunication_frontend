import { ArrowRightLeft, Bot, Clock, UserCheck } from "lucide-react";
import type { MessageDto } from "@/modules/conversations/domain/conversation";
import { MessageMediaBody } from "@/modules/conversations/ui/MessageMediaBody";
import { messageClock } from "@/shared/datetime";
import {
  qualityFindingCategoryLabel,
  qualityFindingSeverityLabel,
  type QualityFindingDto,
} from "@/modules/quality/domain/quality-review";

export function isSystemTransferMessage(body?: string | null): boolean {
  if (!body) return false;
  const trimmed = body.trim();
  return (
    /^(Caso transferido|Caso asignado|Transferido al área|Caso reabierto|Caso cerrado|Se transfirió)/i.test(
      trimmed,
    ) ||
    (/transferid[oa]/i.test(trimmed) && /área|agente|motivo/i.test(trimmed))
  );
}

export function formatElapsedNotice(diffMs: number): string | null {
  const totalMinutes = Math.floor(diffMs / 60000);
  if (totalMinutes < 20) return null;
  if (totalMinutes < 60) return `Transcurrieron ${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return mins > 0 ? `Transcurrieron ${hours}h ${mins}m` : `Transcurrieron ${hours}h`;
}

interface QualityTimelineMessageProps {
  message: MessageDto;
  auditedAgentId: string;
  agentName: (agentId: string) => string;
  finding?: QualityFindingDto;
  showDay: boolean;
  day: string;
  elapsedNotice?: string | null;
  messageRef?: (el: HTMLDivElement | null) => void;
  isHighlighted?: boolean;
}

export function QualityTimelineMessage({
  message: m,
  auditedAgentId,
  agentName,
  finding,
  showDay,
  day,
  elapsedNotice,
  messageRef,
  isHighlighted = false,
}: QualityTimelineMessageProps) {
  const isTransfer = m.author === "system" || isSystemTransferMessage(m.body);
  const fromCustomer = m.author === "customer";
  const isAi = m.author === "ai";
  const isOtherAgent = m.author === "agent" && Boolean(m.agentId) && m.agentId !== auditedAgentId;
  const isAuditedAgent = m.author === "agent" && (!m.agentId || m.agentId === auditedAgentId);

  return (
    <div>
      {/* Separador de Día */}
      {showDay && (
        <div className="flex justify-center my-3">
          <span className="px-3 py-1 rounded-full bg-foreground/5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
            {day}
          </span>
        </div>
      )}

      {/* Indicador de lapso de tiempo SLA entre mensajes */}
      {elapsedNotice && (
        <div className="flex justify-center my-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-muted/60 border border-border/60 text-[10px] font-medium text-muted-foreground">
            <Clock className="size-3 text-muted-foreground" />
            <span>⏱ {elapsedNotice}</span>
          </span>
        </div>
      )}

      {/* Mensajes de Sistema / Eventos de Traspaso (centrados y sobrios) */}
      {isTransfer ? (
        <div className="flex justify-center my-3 px-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-muted/80 border border-border text-[11px] font-medium text-muted-foreground shadow-xs text-center max-w-[85%]">
            <ArrowRightLeft className="size-3.5 text-primary shrink-0" />
            <span>— {m.body} —</span>
          </div>
        </div>
      ) : (
        /* Burbuja de Conversación */
        <div
          ref={messageRef}
          data-message-id={m.id}
          data-finding-severity={finding?.severity}
          className={`flex items-end gap-2 mb-2 ${fromCustomer ? "justify-start" : "justify-end"}`}
        >
          <div
            className={`max-w-[78%] px-3.5 py-2 rounded-2xl text-[12px] leading-snug shadow-xs transition-all duration-300 ${
              isHighlighted
                ? "ring-4 ring-primary/80 ring-offset-2 ring-offset-background scale-[1.03] shadow-md animate-pulse"
                : ""
            } ${
              fromCustomer
                ? "bg-card border border-border text-foreground rounded-bl-md"
                : isOtherAgent
                  ? "bg-muted/70 text-foreground border border-border rounded-br-md"
                  : isAi
                    ? "bg-card border border-primary/20 text-foreground rounded-br-md"
                    : finding?.severity === "high" && finding.category !== "inefficiency"
                      ? "bg-danger text-white rounded-br-md ring-2 ring-danger/40"
                      : finding?.category === "inefficiency"
                        ? "bg-amber-500/15 border border-amber-500/40 text-foreground rounded-br-md"
                        : "bg-primary text-primary-foreground rounded-br-md"
            }`}
          >
            {/* Encabezado del Autor */}
            {!fromCustomer && (
              <div className="mb-1">
                {isAi ? (
                  <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <Bot className="size-3 text-primary" />
                    <span>Asistente IA</span>
                  </p>
                ) : isOtherAgent ? (
                  <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-1 mb-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <UserCheck className="size-3" />
                      <span>{agentName(m.agentId!)}</span>
                    </span>
                    <span className="text-[8px] font-bold uppercase px-1.5 py-0.2 rounded bg-background border border-border text-muted-foreground">
                      Otro agente
                    </span>
                  </div>
                ) : (
                  <p
                    className={`text-[9px] font-bold uppercase tracking-widest ${
                      finding?.severity === "high" && finding.category !== "inefficiency"
                        ? "text-white/90"
                        : "opacity-80"
                    }`}
                  >
                    {agentName(auditedAgentId)}
                  </p>
                )}
              </div>
            )}

            {/* Pill de Hallazgo en la burbuja */}
            {finding && isAuditedAgent && (
              <div className="mb-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-tight bg-background/80 text-foreground border border-border shadow-2xs">
                <span>⚠️ {qualityFindingCategoryLabel(finding.category)}:</span>
                <span className="capitalize">{qualityFindingSeverityLabel(finding.severity)}</span>
              </div>
            )}

            {/* Contenido del Mensaje */}
            <MessageMediaBody message={m} />

            {/* Pie con Hora y Estado de Edición */}
            <div
              className={`flex items-center justify-end gap-1 mt-1.5 ${
                fromCustomer
                  ? "text-muted-foreground"
                  : isOtherAgent || isAi || finding?.category === "inefficiency"
                    ? "text-muted-foreground"
                    : finding?.severity === "high"
                      ? "text-white/80"
                      : "text-primary-foreground/80"
              }`}
            >
              {m.editedAt && (
                <span
                  className="italic text-[9px] opacity-75 mr-0.5"
                  title={`Editado el ${new Date(m.editedAt).toLocaleTimeString()}`}
                >
                  (editado)
                </span>
              )}
              <span className="text-[10px] tabular-nums font-mono">
                {messageClock(m.createdAt)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
