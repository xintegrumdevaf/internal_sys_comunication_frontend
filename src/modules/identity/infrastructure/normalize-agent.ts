import type { AgentDto, AgentRole } from "@/modules/identity/domain/agent";

/** Payload crudo del API (campos opcionales / nullables antes de normalizar). */
export type AgentRaw = {
  id: string;
  name?: string;
  email?: string;
  role?: AgentRole;
  primaryDepartmentId?: string | null;
  departmentIds?: string[] | null;
  active?: boolean;
  createdAt?: string;
  autoAssignEnabled?: boolean | null;
  mustChangePassword?: boolean | null;
};

/**
 * Normaliza un agente crudo del API. `autoAssignEnabled` y `mustChangePassword` ausente/null → false
 */
export function normalizeAgent(raw: AgentRaw): AgentDto {
  const rawDepartmentIds = Array.isArray(raw.departmentIds)
    ? raw.departmentIds.filter((d): d is string => typeof d === "string")
    : [];
  const departmentIds =
    rawDepartmentIds.length > 0
      ? rawDepartmentIds
      : raw.primaryDepartmentId
        ? [raw.primaryDepartmentId]
        : [];

  return {
    id: raw.id,
    name: raw.name ?? "",
    email: raw.email ?? "",
    role: raw.role ?? "agent",
    primaryDepartmentId: raw.primaryDepartmentId ?? null,
    departmentIds,
    active: raw.active ?? true,
    autoAssignEnabled: Boolean(raw.autoAssignEnabled),
    mustChangePassword: Boolean(raw.mustChangePassword),
    createdAt: raw.createdAt ?? "",
  };
}
