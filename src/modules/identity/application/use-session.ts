import { useMemo, useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import { listAgents, listDepartments } from "@/modules/identity/infrastructure/agent-directory.gateway";
import { toSessionUser, type SessionUser } from "@/modules/identity/domain/session";

/**
 * Sesion real sobre isp-customer-service-api (docs/spec/00_OVERVIEW.md §2).
 * No hay JWT: solo se recuerda QUE agent.id esta activo en este navegador
 * (localStorage); sus datos (rol, departamento, activo/inactivo) siempre se
 * refrescan en vivo desde GET /api/agents. Nada se cachea como si fuera la
 * fuente de verdad.
 */

const SESSION_KEY = "netops.session.agentId";
const SESSION_EVENT = "netops-session-change";

function readAgentId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(SESSION_KEY);
}

export function signIn(agentId: string): void {
  window.localStorage.setItem(SESSION_KEY, agentId);
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function signOut(): void {
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
    queryFn: listAgents,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

export function useDepartmentsQuery() {
  return useQuery({
    queryKey: ["departments"],
    queryFn: listDepartments,
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

/** Sesion activa - null mientras carga o si el agente ya no existe/esta inactivo. */
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
