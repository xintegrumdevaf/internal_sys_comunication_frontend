import { AlertTriangle, ArrowRight, Clock, Phone, UserCheck, X } from "lucide-react";
import { formatWaPhone } from "@/modules/conversations/domain/conversation";
import { formatEscalationReason } from "@/modules/realtime/domain/realtime-event";

export type RealtimeToastType = "escalated" | "assigned" | "reminder";

export type RealtimeToastCardProps = {
  type: RealtimeToastType;
  title: string;
  customerName?: string | null;
  customerPhone?: string | null;
  reason?: string | null;
  scheduleTag?: string | null;
  reminderReason?: string | null;
  actionLabel?: string;
  onAction: () => void;
  onDismiss: () => void;
};

export function RealtimeToastCard({
  type,
  title,
  customerName,
  customerPhone,
  reason,
  scheduleTag,
  reminderReason,
  actionLabel = "Atender conversación",
  onAction,
  onDismiss,
}: RealtimeToastCardProps) {
  const isEscalated = type === "escalated";
  const isAssigned = type === "assigned";

  const formattedPhone = customerPhone ? formatWaPhone(customerPhone) : null;
  const formattedReason =
    reason || reminderReason ? formatEscalationReason(reason || reminderReason) : null;

  const accentStyles = isEscalated
    ? {
        border: "border-amber-500/30 dark:border-amber-500/40 border-l-4 border-l-amber-500",
        iconBg: "bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400",
        badge: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
        badgeLabel: "Escalado urgente",
        Icon: AlertTriangle,
      }
    : isAssigned
      ? {
          border:
            "border-emerald-500/30 dark:border-emerald-500/40 border-l-4 border-l-emerald-500",
          iconBg: "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400",
          badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
          badgeLabel: "Caso asignado",
          Icon: UserCheck,
        }
      : {
          border: "border-sky-500/30 dark:border-sky-500/40 border-l-4 border-l-sky-500",
          iconBg: "bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400",
          badge: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20",
          badgeLabel: scheduleTag ? `Agendado [${scheduleTag}]` : "Recordatorio",
          Icon: Clock,
        };

  const { Icon } = accentStyles;

  return (
    <div
      className={`w-[340px] sm:w-[380px] p-3.5 sm:p-4 rounded-xl border bg-card/95 text-card-foreground shadow-2xl backdrop-blur-md flex flex-col gap-3 transition-all animate-fade-in ${accentStyles.border}`}
      role="alert"
    >
      {/* Cabecera con Icono, Categoría y Botón Cerrar */}
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg shrink-0 ${accentStyles.iconBg}`}>
            <Icon className="size-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span
                className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${accentStyles.badge}`}
              >
                {accentStyles.badgeLabel}
              </span>
              <span className="text-[10px] text-muted-foreground">Ahora</span>
            </div>
            <p className="font-bold text-xs text-foreground mt-0.5 leading-tight">{title}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-foreground/5 transition-colors cursor-pointer shrink-0"
          title="Descartar"
        >
          <X className="size-3.5" />
        </button>
      </div>

      {/* Datos de Valor: Cliente, Teléfono y Causa */}
      <div className="bg-foreground/5 dark:bg-foreground/5 border border-border/60 rounded-lg p-2.5 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <div className="font-bold text-xs text-foreground truncate">
            {customerName || "Cliente WhatsApp"}
          </div>
          {formattedPhone && (
            <div className="inline-flex items-center gap-1 text-[11px] font-mono text-muted-foreground shrink-0">
              <Phone className="size-2.5 text-muted-foreground/80" />
              <span>{formattedPhone}</span>
            </div>
          )}
        </div>

        {formattedReason && (
          <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <span className="font-semibold text-foreground/80">Motivo:</span>
            <span className="truncate">{formattedReason}</span>
          </div>
        )}
      </div>

      {/* Botón de Acción Directo */}
      <button
        type="button"
        onClick={onAction}
        className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-xs cursor-pointer"
      >
        <span>{actionLabel}</span>
        <ArrowRight className="size-3.5" />
      </button>
    </div>
  );
}
