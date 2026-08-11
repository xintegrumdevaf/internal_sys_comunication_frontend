import type { AgentDto, AgentRole } from "./agent";
import type { DepartmentDto } from "./department";

export type { AgentRole };

/**
 * Sesion activa en este navegador - id = AgentDto.id real del backend, sin capa
 * puente ni usuario local paralelo (docs/spec/00_OVERVIEW.md §2).
 */
export type SessionUser = {
  id: string;
  name: string;
  initials: string;
  email: string;
  role: AgentRole;
  active: boolean;
  primaryDepartmentId: string | null;
  departmentSlug: string | null;
  departmentName: string | null;
  roleLabel: string;
  /** Ruta de aterrizaje segun el rol real del agente. */
  landing: string;
};

export function initialsFromName(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

function roleLabel(role: AgentRole, departmentName: string | null): string {
  const dept = departmentName ?? "Sin depto.";
  if (role === "admin") return "Admin";
  if (role === "manager") return `Jefe de área · ${dept}`;
  return `Agente · ${dept}`;
}

export function toSessionUser(agent: AgentDto, departments: DepartmentDto[]): SessionUser {
  const department = departments.find((d) => d.id === agent.primaryDepartmentId) ?? null;
  return {
    id: agent.id,
    name: agent.name,
    initials: initialsFromName(agent.name),
    email: agent.email,
    role: agent.role,
    active: agent.active,
    primaryDepartmentId: agent.primaryDepartmentId,
    departmentSlug: department?.slug ?? null,
    departmentName: department?.name ?? null,
    roleLabel: roleLabel(agent.role, department?.name ?? null),
    landing: agent.role === "agent" ? "/bandeja" : "/",
  };
}

export function isSupervisor(user: Pick<SessionUser, "role"> | null | undefined): boolean {
  return user?.role === "manager" || user?.role === "admin";
}

export function isAdminRole(user: Pick<SessionUser, "role"> | null | undefined): boolean {
  return user?.role === "admin";
}
