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
  return apiPost(`/api/cases/${caseId}/assign`, { agentUserId, departmentId }, { agentId: actorAgentId });
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

export function completeCase(
  caseId: string,
  agentUserId: string,
  resolutionNote?: string,
): Promise<CaseDto> {
  return apiPost<CaseDto>(`/api/cases/${caseId}/complete`, { agentUserId, resolutionNote });
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
