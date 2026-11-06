import { useNavigate } from "@tanstack/react-router";
import { MessageSquare, Sparkles, UserCheck, AlertTriangle } from "lucide-react";
import {
  type EscalationDto,
  escalationPriorityLabel,
  escalationStatusLabel,
  getEscalationSla,
} from "@/modules/escalations/domain/escalation";
import { relativeTime } from "@/shared/datetime";

export type EscalationRowItemProps = {
  escalation: EscalationDto;
  agentName: string;
  departmentName: string;
  busy: boolean;
  onOpenSummary: (escalation: EscalationDto) => void;
  onClaim: (escalation: EscalationDto) => void;
};

export function EscalationRowItem({
  escalation: e,
  agentName,
  departmentName,
  busy,
  onOpenSummary,
  onClaim,
}: EscalationRowItemProps) {
  const navigate = useNavigate();
  const priority = escalationPriorityLabel(e.priority);
  const sla = getEscalationSla(e.createdAt);
  const isUnassigned = !e.assignedAgentId && e.status === "PENDING";
  const clientName = e.customerName || "Cliente";

  const handleGoToChat = () => {
    if (e.conversationId) {
      void navigate({ to: "/bandeja", search: { conversationId: e.conversationId } as never });
    } else {
      void navigate({ to: "/bandeja" });
    }
  };

  return (
    <tr className="hover:bg-foreground/5 transition-colors group">
      {/* Cliente y Departamento */}
      <td className="px-4 sm:px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs shrink-0 ring-1 ring-primary/20">
            {clientName.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-foreground truncate max-w-[180px] sm:max-w-[220px]">
              {clientName}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {e.customerPhone && (
                <span className="text-[10px] text-muted-foreground font-mono">
                  {e.customerPhone}
                </span>
              )}
              {e.departmentId === null ? (
                <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-danger/10 text-danger border border-danger/20">
                  <AlertTriangle className="size-2.5" /> Triaje IA
                </span>
              ) : (
                <span className="text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded font-medium truncate max-w-[120px]">
                  {departmentName}
                </span>
              )}
            </div>
          </div>
        </div>
      </td>

      {/* Motivo */}
      <td className="px-4 sm:px-6 py-4 max-w-[260px]">
        <div className="font-medium text-foreground text-xs line-clamp-2" title={e.reason}>
          {e.reason}
        </div>
        {e.summary?.workflow && (
          <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
            Flujo: {e.summary.workflow}
          </div>
        )}
      </td>

      {/* Prioridad y SLA */}
      <td className="px-4 sm:px-6 py-4">
        <div className="flex flex-col gap-1.5 items-start">
          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ring-1 ${priority.cls}`}>
            {priority.label}
          </span>
          {e.status === "PENDING" ? (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${sla.badgeCls}`}
              title={`Tiempo en espera: ${sla.minutesWaiting} minutos`}
            >
              ⏱ {sla.label}
            </span>
          ) : (
            <span className="text-[10px] text-muted-foreground font-medium">
              {escalationStatusLabel(e.status)}
            </span>
          )}
        </div>
      </td>

      {/* Asesor */}
      <td className="px-4 sm:px-6 py-4">
        {e.assignedAgentId ? (
          <div className="text-xs font-medium text-foreground flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-500" />
            {agentName}
          </div>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
            En cola disponible
          </span>
        )}
      </td>

      {/* Antigüedad */}
      <td className="px-4 sm:px-6 py-4 text-muted-foreground text-xs whitespace-nowrap">
        {relativeTime(e.createdAt)}
      </td>

      {/* Acciones */}
      <td className="px-4 sm:px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => onOpenSummary(e)}
            className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg border border-border bg-card font-medium text-foreground hover:bg-foreground/5 transition-colors shadow-xs"
            title="Ver diagnóstico e historial generado por IA"
          >
            <Sparkles className="size-3 text-primary" />
            <span className="hidden sm:inline">Diagnóstico</span>
          </button>

          <button
            type="button"
            onClick={handleGoToChat}
            className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg border border-border bg-card font-medium text-foreground hover:bg-foreground/5 transition-colors shadow-xs"
            title="Abrir conversación en Bandeja"
          >
            <MessageSquare className="size-3 text-muted-foreground" />
            <span className="hidden sm:inline">Chat</span>
          </button>

          {isUnassigned && (
            <button
              type="button"
              disabled={busy}
              onClick={() => onClaim(e)}
              className="inline-flex items-center gap-1 text-[11px] px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold disabled:opacity-40 hover:bg-primary/90 transition-colors shadow-xs"
              title="Tomar caso inmediatamente"
            >
              <UserCheck className="size-3" />
              <span>Atender</span>
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
