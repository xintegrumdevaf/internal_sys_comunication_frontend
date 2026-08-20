import type { DepartmentDto } from "@/modules/identity/domain/department";
import { isSupervisor, type SessionUser } from "@/modules/identity/domain/session";

export function isSupervisorSession(session: SessionUser | null | undefined): boolean {
  return isSupervisor(session);
}

/**
 * Aproximacion cliente de docs/spec/01_DATA_MODEL.md §7 del backend: en `shared`
 * (default) cualquier agente activo lee; en `restricted` solo si su
 * `primaryDepartmentId` coincide (no exponemos `agent_membership` completo via
 * GET /api/agents todavia - ver docs/spec/06_BACKEND_GAPS.md si esto no basta).
 * El backend sigue siendo quien realmente autoriza cada escritura/lectura.
 */
export function canAccessDepartment(
  session: SessionUser | null | undefined,
  department: DepartmentDto,
): boolean {
  if (!session) return false;
  if (session.role === "admin") return true;
  if (department.visibility === "shared") return true;
  return session.primaryDepartmentId === department.id;
}

const ADMIN_ONLY_PATHS = new Set(["/usuarios", "/departamentos", "/flujos", "/auditoria", "/campanas"]);
const SUPERVISOR_PATHS = new Set(["/escalaciones", "/asignaciones", "/calidad"]);
const AUTHENTICATED_PATHS = new Set(["/", "/bandeja", "/chat-interno"]);

export function canAccessPath(session: SessionUser | null | undefined, pathname: string): boolean {
  if (!session) return pathname === "/login";
  if (session.role === "admin") return true;
  if (ADMIN_ONLY_PATHS.has(pathname)) return false;
  if (SUPERVISOR_PATHS.has(pathname)) return isSupervisor(session);
  if (AUTHENTICATED_PATHS.has(pathname)) return true;
  return false;
}

export type NavItem = { label: string; to: string; adminOnly?: boolean };

export function modulesForSession(session: SessionUser | null | undefined): NavItem[] {
  if (!session) return [];
  const base: NavItem[] = [
    { label: "Inicio", to: "/" },
    { label: "Conversaciones", to: "/bandeja" },
    { label: "Chat interno", to: "/chat-interno" },
  ];
  if (isSupervisor(session)) {
    base.push(
      { label: "Casos escalados", to: "/escalaciones" },
      { label: "Carga de trabajo", to: "/asignaciones" },
      { label: "Calidad", to: "/calidad" },
    );
  }
  if (session.role === "admin") {
    base.push(
      { label: "Agentes", to: "/usuarios", adminOnly: true },
      { label: "Departamentos", to: "/departamentos", adminOnly: true },
      { label: "Automatizaciones", to: "/flujos", adminOnly: true },
      { label: "Campañas masivas", to: "/campanas", adminOnly: true },
      { label: "Auditoría", to: "/auditoria", adminOnly: true },
    );
  }
  return base;
}
