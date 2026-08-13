import type { AgentDto, AgentRole } from "@/modules/identity/domain/agent";

/** Payload crudo del API (campos opcionales / nullables antes de normalizar). */
export type AgentRaw = {
  id: string;
  name?: string;
  email?: string;
  role?: AgentRole;
  primaryDepartmentId?: string | null;
  active?: boolean;
  createdAt?: string;
  autoAssignEnabled?: boolean | null;
};

/**
 * Normaliza un agente crudo del API. `autoAssignEnabled` ausente/null → false
 * (contrato frontend-first mientras el backend aún no lo expone).
 */
export function normalizeAgent(raw: AgentRaw): AgentDto {
  return {
    id: raw.id,
    name: raw.name ?? "",
    email: raw.email ?? "",
    role: raw.role ?? "agent",
    primaryDepartmentId: raw.primaryDepartmentId ?? null,
    active: raw.active ?? true,
    autoAssignEnabled: Boolean(raw.autoAssignEnabled),
    createdAt: raw.createdAt ?? "",
  };
}
