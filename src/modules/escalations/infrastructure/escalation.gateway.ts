import { apiGet } from "@/shared/http/http-client";
import type { EscalationDto, EscalationStatus } from "@/modules/escalations/domain/escalation";

/** Puerto de infraestructura: GET /api/escalations (docs/API_ENDPOINTS.md §6). */
export function listEscalations(filter: {
  agentUserId: string;
  departmentId?: string | null;
  status?: EscalationStatus;
  triage?: boolean;
}): Promise<EscalationDto[]> {
  return apiGet<EscalationDto[]>("/api/escalations", {
    query: {
      status: filter.status,
      departmentId: filter.triage ? "null" : (filter.departmentId ?? undefined),
      triage: filter.triage ? "true" : undefined,
    },
    agentId: filter.agentUserId,
  });
}
