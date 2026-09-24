import { apiGet, apiPost } from "@/shared/http/http-client";
import type { CaseDto, CaseSummaryDto, CaseTimelineEntryDto } from "@/modules/cases/domain/case";

/**
 * Puerto de infraestructura del modulo cases: unico punto que conoce las rutas
 * REST reales de /api/cases/* (isp-customer-service-api/docs/API_ENDPOINTS.md §5).
 */

export function getCase(caseId: string): Promise<CaseDto> {
  return apiGet<CaseDto>(`/api/cases/${caseId}`);
}

export function getCaseSummary(caseId: string): Promise<CaseSummaryDto> {
  return apiGet<CaseSummaryDto>(`/api/cases/${caseId}/summary`);
}

export function getCaseTimeline(caseId: string): Promise<CaseTimelineEntryDto[]> {
  return apiGet<CaseTimelineEntryDto[]>(`/api/cases/${caseId}/timeline`);
}

export function claimCase(caseId: string, agentUserId: string): Promise<void> {
  return apiPost(`/api/cases/${caseId}/claim`, { agentUserId });
}

export function assignCase(
  caseId: string,
  agentUserId: string,
  actorAgentId: string,
  departmentId?: string | null,
): Promise<void> {
  return apiPost(
    `/api/cases/${caseId}/assign`,
    { agentUserId, departmentId },
    { agentId: actorAgentId },
  );
}

export function reassignCase(
  caseId: string,
  agentUserId: string,
  actorAgentId: string,
  departmentId?: string | null,
): Promise<void> {
  return apiPost(
    `/api/cases/${caseId}/reassign`,
    { agentUserId, departmentId },
    { agentId: actorAgentId },
  );
}

export type CloseReason = "RESOLVED" | "CLIENT_NO_RESPONSE";

export type CompleteCasePayload = {
  closeReason?: CloseReason;
  resolutionNote?: string;
  agentUserId?: string;
};

export function completeCase(
  caseId: string,
  payload?: CompleteCasePayload | string,
  resolutionNoteArg?: string,
): Promise<CaseDto> {
  let body: Record<string, unknown> = {};
  if (typeof payload === "object" && payload !== null) {
    body = {
      closeReason: payload.closeReason ?? "RESOLVED",
      ...(payload.resolutionNote ? { resolutionNote: payload.resolutionNote } : {}),
      ...(payload.agentUserId ? { agentUserId: payload.agentUserId } : {}),
    };
  } else {
    body = {
      closeReason: "RESOLVED",
      ...(payload ? { agentUserId: payload } : {}),
      ...(resolutionNoteArg ? { resolutionNote: resolutionNoteArg } : {}),
    };
  }
  return apiPost<CaseDto>(`/api/cases/${caseId}/complete`, body);
}

export type ScheduleCasePayload = {
  scheduledAt: string;
  reminderReason?: string;
};

export function scheduleCase(caseId: string, payload: ScheduleCasePayload): Promise<CaseDto> {
  return apiPost<CaseDto>(`/api/cases/${caseId}/schedule`, payload);
}

export function cancelCase(caseId: string, reason: string, agentUserId: string): Promise<CaseDto> {
  return apiPost<CaseDto>(`/api/cases/${caseId}/cancel`, { reason, agentUserId });
}

export function transferCase(
  caseId: string,
  toDepartmentId: string,
  reason: string,
  agentUserId: string,
): Promise<CaseDto> {
  return apiPost<CaseDto>(`/api/cases/${caseId}/transfer`, { toDepartmentId, reason, agentUserId });
}

export function disableAutomation(caseId: string, reason: string, agentUserId: string) {
  return apiPost(`/api/cases/${caseId}/disable-automation`, { reason, agentUserId });
}

export function reactivateAutomation(caseId: string, agentUserId: string) {
  return apiPost(`/api/cases/${caseId}/reactivate-automation`, { agentUserId });
}

export type AdvanceCasePayload = {
  entities: Record<string, unknown>;
};

export function advanceCase(caseId: string, payload: AdvanceCasePayload): Promise<CaseDto> {
  return apiPost<CaseDto>(`/api/cases/${caseId}/advance`, payload);
}
