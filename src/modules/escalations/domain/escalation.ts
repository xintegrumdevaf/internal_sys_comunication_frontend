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
