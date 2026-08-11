import { apiDelete, apiGet, apiPut } from "@/shared/http/http-client";
import type { N8nWorkflowCategory, N8nWorkflowEntryDto } from "@/modules/admin-n8n/domain/n8n-workflow";

/**
 * Puerto de infraestructura: GET/PUT/DELETE /api/admin/n8n-workflows[/:action]
 * (docs/API_ENDPOINTS.md §8, solo role=admin).
 */
export function listN8nWorkflows(
  actorAgentId: string,
  category?: N8nWorkflowCategory,
): Promise<N8nWorkflowEntryDto[]> {
  return apiGet<N8nWorkflowEntryDto[]>("/api/admin/n8n-workflows", {
    query: { category },
    agentId: actorAgentId,
  });
}

export function upsertN8nWorkflow(
  actorAgentId: string,
  action: string,
  input: { url: string; timeoutMs?: number; maxRetries?: number; active?: boolean },
): Promise<N8nWorkflowEntryDto> {
  return apiPut<N8nWorkflowEntryDto>(`/api/admin/n8n-workflows/${action}`, input, {
    agentId: actorAgentId,
  });
}

export function deactivateN8nWorkflow(
  actorAgentId: string,
  action: string,
): Promise<N8nWorkflowEntryDto> {
  return apiDelete<N8nWorkflowEntryDto>(`/api/admin/n8n-workflows/${action}`, {
    agentId: actorAgentId,
  });
}
