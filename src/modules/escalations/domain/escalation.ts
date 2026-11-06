import type { CaseSummaryDto } from "@/modules/cases/domain/case";

export type EscalationStatus = "PENDING" | "ASSIGNED" | "RESOLVED";
export type EscalationPriority = "low" | "normal" | "high" | "urgent";

export type EscalationDto = {
  id: string;
  caseId: string;
  departmentId: string | null; // null = pool de triage
  priority: EscalationPriority;
  reason: string;
  summary: CaseSummaryDto;
  status: EscalationStatus;
  assignedAgentId: string | null;
  createdAt: string;
  resolvedAt: string | null;
  conversationId?: string;
  customerName?: string;
  customerPhone?: string;
};

export type SlaRisk = "ok" | "warning" | "breached";

export function getEscalationSla(createdAt: string): {
  risk: SlaRisk;
  label: string;
  minutesWaiting: number;
  badgeCls: string;
} {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60000));

  if (minutes < 5) {
    return {
      risk: "ok",
      label: `${minutes}m (En SLA)`,
      minutesWaiting: minutes,
      badgeCls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    };
  }
  if (minutes <= 15) {
    return {
      risk: "warning",
      label: `${minutes}m (Riesgo SLA)`,
      minutesWaiting: minutes,
      badgeCls: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    };
  }
  return {
    risk: "breached",
    label: `${minutes}m (SLA Vencido)`,
    minutesWaiting: minutes,
    badgeCls:
      "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 animate-pulse font-semibold",
  };
}

const ESCALATION_STATUS_LABELS: Record<EscalationStatus, string> = {
  PENDING: "Sin atender",
  ASSIGNED: "Asignada",
  RESOLVED: "Resuelta",
};

/** Texto claro en español — nunca el enum crudo (PENDING/ASSIGNED/RESOLVED). */
export function escalationStatusLabel(status: EscalationStatus): string {
  return ESCALATION_STATUS_LABELS[status] ?? status;
}

const ESCALATION_PRIORITY_LABELS: Record<EscalationPriority, { label: string; cls: string }> = {
  urgent: { label: "Urgente", cls: "bg-danger/10 text-danger ring-danger/30" },
  high: { label: "Alta", cls: "bg-warning/10 text-warning ring-warning/30" },
  normal: { label: "Normal", cls: "bg-primary/10 text-primary ring-primary/30" },
  low: { label: "Baja", cls: "bg-foreground/5 text-muted-foreground ring-border" },
};

export function escalationPriorityLabel(priority: EscalationPriority): {
  label: string;
  cls: string;
} {
  return ESCALATION_PRIORITY_LABELS[priority] ?? ESCALATION_PRIORITY_LABELS.normal;
}
