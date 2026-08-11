import { useMemo, useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import { listAgentsFn, listDepartmentsFn } from "@/adapters/http/server-fns";
import type { DepartmentDto } from "@/adapters/http/dto";
import { isSupervisor, toSessionUser, type SessionUser } from "@/lib/identity";

/**
 * Sesión real sobre isp-customer-service-api — ver docs/spec/00_OVERVIEW.md §2.
 * No hay JWT: solo se recuerda QUÉ agent.id está activo en este navegador
 * (localStorage), y sus datos (rol, departamento, activo/inactivo) siempre se
 * refrescan en vivo desde GET /api/agents. Nada se cachea como si fuera la
 * fuente de verdad.
 */

const SESSION_KEY = "netops.session.agentId";
const SESSION_EVENT = "netops-session-change";

function readAgentId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(SESSION_KEY);
}

export function signIn(agentId: string) {
  window.localStorage.setItem(SESSION_KEY, agentId);
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function signOut() {
  window.localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event(SESSION_EVENT));
}

function subscribeSession(cb: () => void) {
  window.addEventListener(SESSION_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(SESSION_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

function useSelectedAgentId(): string | null {
  return useSyncExternalStore(subscribeSession, readAgentId, () => null);
}

export function useAgentsQuery() {
  return useQuery({
    queryKey: ["agents"],
    queryFn: listAgentsFn,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

export function useDepartmentsQuery() {
  return useQuery({
    queryKey: ["departments"],
    queryFn: listDepartmentsFn,
    staleTime: 60_000,
  });
}

/** Directorio completo de agentes reales (activos e inactivos) como SessionUser. */
export function useDirectoryUsers(): SessionUser[] {
  const { data: agents } = useAgentsQuery();
  const { data: departments } = useDepartmentsQuery();
  return useMemo(() => {
    if (!agents || !departments) return [];
    return agents
      .map((a) => toSessionUser(a, departments))
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
  }, [agents, departments]);
}

/** Sesión activa — null mientras carga o si el agente ya no existe/está inactivo. */
export function useSession(): SessionUser | null {
  const agentId = useSelectedAgentId();
  const { data: agents } = useAgentsQuery();
  const { data: departments } = useDepartmentsQuery();
  return useMemo(() => {
    if (!agentId || !agents || !departments) return null;
    const agent = agents.find((a) => a.id === agentId);
    if (!agent || !agent.active) return null;
    return toSessionUser(agent, departments);
  }, [agentId, agents, departments]);
}

export function isSupervisorSession(session: SessionUser | null | undefined): boolean {
  return isSupervisor(session);
}

/**
 * Aproximación cliente de docs/spec/01_DATA_MODEL.md §7 del backend: en `shared`
 * (default) cualquier agente activo lee; en `restricted` solo si su
 * `primaryDepartmentId` coincide (no exponemos `agent_membership` completo vía
 * GET /api/agents todavía — ver docs/spec/06_BACKEND_GAPS.md si esto no basta).
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

const ADMIN_ONLY_PATHS = new Set(["/usuarios", "/flujos", "/auditoria", "/campanas"]);
const SUPERVISOR_PATHS = new Set(["/escalaciones", "/asignaciones"]);
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
    { label: "Bandeja Unificada", to: "/bandeja" },
    { label: "Chat interno", to: "/chat-interno" },
  ];
  if (isSupervisor(session)) {
    base.push(
      { label: "Escalaciones", to: "/escalaciones" },
      { label: "Gestión de Asignación", to: "/asignaciones" },
    );
  }
  if (session.role === "admin") {
    base.push(
      { label: "Usuarios", to: "/usuarios", adminOnly: true },
      { label: "Flujos n8n", to: "/flujos", adminOnly: true },
      { label: "Campañas Masivas", to: "/campanas", adminOnly: true },
      { label: "Auditoría & Logs", to: "/auditoria", adminOnly: true },
    );
  }
  return base;
}
