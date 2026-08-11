import { apiGet } from "@/lib/api-client";
import type { AgentDto } from "@/modules/identity/domain/agent";
import type { DepartmentDto } from "@/modules/identity/domain/department";

/**
 * Puerto de infraestructura del modulo identity: unico punto que sabe que
 * agentes/departamentos viven en `GET /api/agents` / `GET /api/departments`
 * de isp-customer-service-api (docs/API_ENDPOINTS.md §3).
 */
export function listAgents(): Promise<AgentDto[]> {
  return apiGet<AgentDto[]>("/api/agents");
}

export function listDepartments(): Promise<DepartmentDto[]> {
  return apiGet<DepartmentDto[]>("/api/departments");
}
