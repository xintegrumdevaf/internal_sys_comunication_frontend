import { apiDelete, apiGet, apiPost, apiPut } from "@/shared/http/http-client";
import type { AgentDto, AgentRole } from "@/modules/identity/domain/agent";
import type { DepartmentDto } from "@/modules/identity/domain/department";

export type CreateAgentPayload = {
  name: string;
  email: string;
  role?: AgentRole;
  primaryDepartmentId?: string | null;
};

export type UpdateAgentPayload = Partial<CreateAgentPayload> & { active?: boolean };

/**
 * La contrasena temporal solo viaja en la respuesta de create/reset-password
 * — nunca se puede volver a consultar despues (docs/spec/06_BACKEND_GAPS.md §1.b).
 */
export type AgentWithTemporaryPassword = { agent: AgentDto; temporaryPassword: string };

/**
 * Puerto de infraestructura del modulo identity: unico punto que sabe que
 * agentes/departamentos viven en `GET /api/agents` / `GET /api/departments`
 * de isp-customer-service-api (docs/API_ENDPOINTS.md §3). El CRUD de
 * escritura (docs/spec/06_BACKEND_GAPS.md §1, resuelto) requiere que quien
 * llama sea un agente con role=admin — verificado por el backend a partir
 * de la sesion real (cookie), no de algo que este cliente declare.
 */
export function listAgents(): Promise<AgentDto[]> {
  return apiGet<AgentDto[]>("/api/agents");
}

export function listDepartments(): Promise<DepartmentDto[]> {
  return apiGet<DepartmentDto[]>("/api/departments");
}

export function createAgent(payload: CreateAgentPayload): Promise<AgentWithTemporaryPassword> {
  return apiPost<AgentWithTemporaryPassword>("/api/agents", payload);
}

export function updateAgent(agentId: string, payload: UpdateAgentPayload): Promise<AgentDto> {
  return apiPut<AgentDto>(`/api/agents/${agentId}`, payload);
}

export function deactivateAgent(agentId: string): Promise<AgentDto> {
  return apiDelete<AgentDto>(`/api/agents/${agentId}`);
}

export function resetAgentPassword(agentId: string): Promise<AgentWithTemporaryPassword> {
  return apiPost<AgentWithTemporaryPassword>(`/api/agents/${agentId}/reset-password`);
}
