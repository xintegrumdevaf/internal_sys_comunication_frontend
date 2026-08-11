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
};

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

export function escalationPriorityLabel(priority: EscalationPriority): { label: string; cls: string } {
  return ESCALATION_PRIORITY_LABELS[priority] ?? ESCALATION_PRIORITY_LABELS.normal;
}
