import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api-client";
import { resolveApiUrl } from "@/lib/api-base";
import type {
  AgentDto,
  AuditEventDto,
  CaseDto,
  CaseSummaryDto,
  CaseTimelineEntryDto,
  ConversationDto,
  ConversationStatus,
  DashboardDto,
  DepartmentDto,
  EscalationDto,
  EscalationStatus,
  MessageDto,
  N8nWorkflowCategory,
  N8nWorkflowEntryDto,
} from "@/adapters/http/dto";

/**
 * Funciones de acceso a isp-customer-service-api (endpoints reales).
 * Ver docs/spec/02_MODULES.md y isp-customer-service-api/docs/API_ENDPOINTS.md.
 * Nada aquí simula datos: toda función llama al backend real.
 */

function withMediaUrls(messages: MessageDto[]): MessageDto[] {
  return messages.map((message) =>
    message.mediaUrl ? { ...message, mediaUrl: resolveApiUrl(message.mediaUrl) } : message,
  );
}

// ---------------------------------------------------------------------------
// Catálogos
// ---------------------------------------------------------------------------

export async function listDepartmentsFn(): Promise<DepartmentDto[]> {
  return apiGet<DepartmentDto[]>("/api/departments");
}

export async function listAgentsFn(): Promise<AgentDto[]> {
  return apiGet<AgentDto[]>("/api/agents");
}

// ---------------------------------------------------------------------------
// Conversaciones y mensajes
// ---------------------------------------------------------------------------

export async function listConversationsFn(arg?: {
  data?: { departmentId?: string; userId?: string; status?: ConversationStatus };
}): Promise<ConversationDto[]> {
  return apiGet<ConversationDto[]>("/api/conversations", { query: arg?.data });
}

export async function listMessagesFn(arg: {
  data: { conversationId: string; limit?: number; cursor?: string };
}): Promise<MessageDto[]> {
  const items = await apiGet<MessageDto[]>(
    `/api/conversations/${arg.data.conversationId}/messages`,
    { query: { limit: arg.data.limit, cursor: arg.data.cursor } },
  );
  return withMediaUrls(items);
}

export async function listCasesForConversationFn(arg: {
  data: { conversationId: string };
}): Promise<CaseDto[]> {
  return apiGet<CaseDto[]>(`/api/conversations/${arg.data.conversationId}/cases`);
}

export async function getConversationAutomationFn(arg: {
  data: { conversationId: string };
}): Promise<{ caseId: string; enabled: boolean; disabledReason: string | null } | null> {
  return apiGet(`/api/conversations/${arg.data.conversationId}/automation`);
}

export async function replyAsHumanFn(arg: {
  data: { conversationId: string; agentUserId: string; body: string };
}): Promise<MessageDto> {
  const message = await apiPost<MessageDto>(
    `/api/conversations/${arg.data.conversationId}/reply`,
    { agentUserId: arg.data.agentUserId, body: arg.data.body },
  );
  return withMediaUrls([message])[0]!;
}

export async function takeControlFn(arg: {
  data: { conversationId: string; agentUserId: string };
}): Promise<ConversationDto> {
  return apiPost<ConversationDto>(`/api/conversations/${arg.data.conversationId}/take-control`, {
    agentUserId: arg.data.agentUserId,
  });
}

// ---------------------------------------------------------------------------
// Casos
// ---------------------------------------------------------------------------

export async function getCaseFn(arg: { data: { caseId: string } }): Promise<CaseDto> {
  return apiGet<CaseDto>(`/api/cases/${arg.data.caseId}`);
}

export async function getCaseSummaryFn(arg: {
  data: { caseId: string };
}): Promise<CaseSummaryDto> {
  return apiGet<CaseSummaryDto>(`/api/cases/${arg.data.caseId}/summary`);
}

export async function getCaseTimelineFn(arg: {
  data: { caseId: string };
}): Promise<CaseTimelineEntryDto[]> {
  return apiGet<CaseTimelineEntryDto[]>(`/api/cases/${arg.data.caseId}/timeline`);
}

export async function claimCaseFn(arg: {
  data: { caseId: string; agentUserId: string };
}): Promise<void> {
  await apiPost(`/api/cases/${arg.data.caseId}/claim`, { agentUserId: arg.data.agentUserId });
}

export async function assignCaseFn(arg: {
  data: {
    caseId: string;
    agentUserId: string;
    departmentId?: string | null;
    actorAgentId: string;
  };
}): Promise<void> {
  await apiPost(
    `/api/cases/${arg.data.caseId}/assign`,
    { agentUserId: arg.data.agentUserId, departmentId: arg.data.departmentId },
    { agentId: arg.data.actorAgentId },
  );
}

export async function reassignCaseFn(arg: {
  data: {
    caseId: string;
    agentUserId: string;
    departmentId?: string | null;
    actorAgentId: string;
  };
}): Promise<void> {
  await apiPost(
    `/api/cases/${arg.data.caseId}/reassign`,
    { agentUserId: arg.data.agentUserId, departmentId: arg.data.departmentId },
    { agentId: arg.data.actorAgentId },
  );
}

export async function completeCaseFn(arg: {
  data: { caseId: string; agentUserId?: string; resolutionNote?: string };
}): Promise<CaseDto> {
  return apiPost<CaseDto>(`/api/cases/${arg.data.caseId}/complete`, {
    agentUserId: arg.data.agentUserId,
    resolutionNote: arg.data.resolutionNote,
  });
}

export async function cancelCaseFn(arg: {
  data: { caseId: string; reason: string; agentUserId?: string };
}): Promise<CaseDto> {
  return apiPost<CaseDto>(`/api/cases/${arg.data.caseId}/cancel`, {
    reason: arg.data.reason,
    agentUserId: arg.data.agentUserId,
  });
}

export async function transferCaseFn(arg: {
  data: { caseId: string; toDepartmentId: string; reason: string; agentUserId?: string };
}): Promise<CaseDto> {
  return apiPost<CaseDto>(`/api/cases/${arg.data.caseId}/transfer`, {
    toDepartmentId: arg.data.toDepartmentId,
    reason: arg.data.reason,
    agentUserId: arg.data.agentUserId,
  });
}

export async function disableAutomationFn(arg: {
  data: { caseId: string; reason: string; agentUserId?: string };
}) {
  return apiPost(`/api/cases/${arg.data.caseId}/disable-automation`, {
    reason: arg.data.reason,
    agentUserId: arg.data.agentUserId,
  });
}

export async function reactivateAutomationFn(arg: {
  data: { caseId: string; agentUserId?: string };
}) {
  return apiPost(`/api/cases/${arg.data.caseId}/reactivate-automation`, {
    agentUserId: arg.data.agentUserId,
  });
}

// ---------------------------------------------------------------------------
// Escalaciones / triage
// ---------------------------------------------------------------------------

export async function listEscalationsFn(arg: {
  data: {
    agentUserId: string;
    departmentId?: string | null;
    status?: EscalationStatus;
    triage?: boolean;
  };
}): Promise<EscalationDto[]> {
  return apiGet<EscalationDto[]>("/api/escalations", {
    query: {
      status: arg.data.status,
      departmentId: arg.data.triage ? "null" : (arg.data.departmentId ?? undefined),
      triage: arg.data.triage ? "true" : undefined,
    },
    agentId: arg.data.agentUserId,
  });
}

// ---------------------------------------------------------------------------
// Dashboard y auditoría
// ---------------------------------------------------------------------------

export async function getDashboardFn(arg: { data: { userId: string } }): Promise<DashboardDto> {
  return apiGet<DashboardDto>("/api/dashboard", { query: { userId: arg.data.userId } });
}

export async function listAuditEventsFn(
  arg?: { data?: { limit?: number } },
): Promise<AuditEventDto[]> {
  return apiGet<AuditEventDto[]>("/api/audit", { query: { limit: arg?.data?.limit } });
}

// ---------------------------------------------------------------------------
// Admin — catálogo n8n (solo role=admin)
// ---------------------------------------------------------------------------

export async function listN8nWorkflowsFn(arg: {
  data: { actorAgentId: string; category?: N8nWorkflowCategory };
}): Promise<N8nWorkflowEntryDto[]> {
  return apiGet<N8nWorkflowEntryDto[]>("/api/admin/n8n-workflows", {
    query: { category: arg.data.category },
    agentId: arg.data.actorAgentId,
  });
}

export async function upsertN8nWorkflowFn(arg: {
  data: {
    actorAgentId: string;
    action: string;
    url: string;
    timeoutMs?: number;
    maxRetries?: number;
    active?: boolean;
  };
}): Promise<N8nWorkflowEntryDto> {
  return apiPut<N8nWorkflowEntryDto>(
    `/api/admin/n8n-workflows/${arg.data.action}`,
    {
      url: arg.data.url,
      timeoutMs: arg.data.timeoutMs,
      maxRetries: arg.data.maxRetries,
      active: arg.data.active,
    },
    { agentId: arg.data.actorAgentId },
  );
}

export async function deactivateN8nWorkflowFn(arg: {
  data: { actorAgentId: string; action: string };
}): Promise<N8nWorkflowEntryDto> {
  return apiDelete<N8nWorkflowEntryDto>(`/api/admin/n8n-workflows/${arg.data.action}`, {
    agentId: arg.data.actorAgentId,
  });
}
