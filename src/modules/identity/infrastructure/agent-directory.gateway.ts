import { apiDelete, apiGet, apiPost, apiPut } from "@/shared/http/http-client";
import type { AgentDto, AgentRole } from "@/modules/identity/domain/agent";
import type { DepartmentDto } from "@/modules/identity/domain/department";
import { normalizeAgent } from "@/modules/identity/infrastructure/normalize-agent";

export type CreateAgentPayload = {
  name: string;
  email: string;
  role?: AgentRole;
  primaryDepartmentId?: string | null;
};

export type CreateDepartmentPayload = {
  name: string;
  slug: string;
  visibility: "shared" | "restricted";
};

export type UpdateDepartmentPayload = Partial<CreateDepartmentPayload> & {
  active?: boolean;
};


export type UpdateAgentPayload = Partial<CreateAgentPayload> & {
  active?: boolean;
  autoAssignEnabled?: boolean;
};

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
export async function listAgents(): Promise<AgentDto[]> {
  const agents = await apiGet<AgentDto[]>("/api/agents");
  return agents.map((a) => normalizeAgent(a));
}

export function listDepartments(): Promise<DepartmentDto[]> {
  return apiGet<DepartmentDto[]>("/api/departments");
}

export async function createAgent(payload: CreateAgentPayload): Promise<AgentWithTemporaryPassword> {
  const result = await apiPost<AgentWithTemporaryPassword>("/api/agents", payload);
  return { ...result, agent: normalizeAgent(result.agent) };
}

export async function updateAgent(agentId: string, payload: UpdateAgentPayload): Promise<AgentDto> {
  const agent = await apiPut<AgentDto>(`/api/agents/${agentId}`, payload);
  return normalizeAgent(agent);
}

export async function deactivateAgent(agentId: string): Promise<AgentDto> {
  const agent = await apiDelete<AgentDto>(`/api/agents/${agentId}`);
  return normalizeAgent(agent);
}

export async function resetAgentPassword(agentId: string): Promise<AgentWithTemporaryPassword> {
  const result = await apiPost<AgentWithTemporaryPassword>(`/api/agents/${agentId}/reset-password`);
  return { ...result, agent: normalizeAgent(result.agent) };
}

export async function createDepartment(payload: CreateDepartmentPayload): Promise<DepartmentDto> {
  return apiPost<DepartmentDto>("/api/departments", payload);
}

export async function updateDepartment(departmentId: string, payload: UpdateDepartmentPayload): Promise<DepartmentDto> {
  return apiPut<DepartmentDto>(`/api/departments/${departmentId}`, payload);
}

export async function deactivateDepartment(departmentId: string): Promise<DepartmentDto> {
  return apiDelete<DepartmentDto>(`/api/departments/${departmentId}`);
}

