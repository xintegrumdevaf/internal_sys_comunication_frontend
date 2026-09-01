import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { AgentDto } from "@/modules/identity/domain/agent";
import * as authGateway from "@/modules/identity/infrastructure/auth.gateway";
import {
  listAgents,
  listDepartments,
} from "@/modules/identity/infrastructure/agent-directory.gateway";
import { toSessionUser, type SessionUser } from "@/modules/identity/domain/session";

/**
 * Sesion real sobre isp-customer-service-api (docs/spec/06_BACKEND_GAPS.md
 * §1.b). La identidad vive en una cookie httpOnly que pone el backend al
 * loguear con `POST /api/auth/login` — este modulo nunca la lee ni la
 * escribe directamente, solo sabe "hay sesion o no" preguntando
 * `GET /api/auth/me` (que el navegador manda automaticamente con la cookie).
 */

export function useAgentsQuery() {
  return useQuery({
    queryKey: ["agents"],
    queryFn: listAgents,
    staleTime: 15_000,
    refetchInterval: 30_000,
    retry: false, // sin sesion, esto falla (403) a proposito — no tiene sentido reintentar
  });
}

export function useDepartmentsQuery() {
  return useQuery({
    queryKey: ["departments"],
    queryFn: listDepartments,
    staleTime: 60_000,
    retry: false,
  });
}

function useCurrentAgentQuery() {
  return useQuery({
    queryKey: ["session", "me"],
    queryFn: authGateway.fetchCurrentAgent,
    staleTime: 30_000,
    retry: false,
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

/** Sesion activa segun la cookie real — null mientras carga o si no hay sesion valida. */
export function useSession(): SessionUser | null {
  const { data: agent } = useCurrentAgentQuery();
  const { data: departments } = useDepartmentsQuery();
  return useMemo(() => {
    if (!agent || !departments) return null;
    return toSessionUser(agent, departments);
  }, [agent, departments]);
}

/**
 * true mientras todavia no sabemos si hay sesion o no (primera consulta a
 * `GET /api/auth/me` en curso). Sin esto, `AppShell`/`login.tsx` verian
 * `useSession() === null` un instante en CADA recarga de pagina y
 * redirigirian a /login aunque la persona si tenga sesion — un "flash" de
 * logout falso muy molesto para trabajo de alta frecuencia.
 */
export function useSessionLoading(): boolean {
  const { isLoading } = useCurrentAgentQuery();
  return isLoading;
}

/** Alta/baja de sesion: login real con credenciales, logout revoca la sesion en el servidor. */
export function useAuth() {
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authGateway.login(email, password),
    onSuccess: async () => {
      // Tras loguear, todo lo que dependia de "no hay sesion" (agents,
      // departments, me) debe re-consultarse — ya no van a fallar con 403.
      await queryClient.invalidateQueries();
    },
  });

  const logoutMutation = useMutation({
    mutationFn: authGateway.logout,
    onSuccess: () => {
      // Limpiar TODA la cache: nadie debe seguir viendo datos de la sesion
      // anterior (conversaciones, casos, etc.) tras cerrar sesion.
      queryClient.clear();
    },
  });

  return {
    login: (email: string, password: string) => loginMutation.mutateAsync({ email, password }),
    logout: () => logoutMutation.mutateAsync(),
    loggingIn: loginMutation.isPending,
    loginError: loginMutation.error instanceof Error ? loginMutation.error.message : null,
  };
}

/**
 * Hook para alternar la disponibilidad del agente actual (`autoAssignEnabled`)
 * conectándose a `PATCH /api/auth/me/availability` y manteniendo sincronizado
 * el estado global de la sesión y el directorio de agentes.
 */
export function useMyAvailability() {
  const queryClient = useQueryClient();
  const session = useSession();

  const mutation = useMutation({
    mutationFn: (autoAssignEnabled: boolean) => authGateway.updateMyAvailability(autoAssignEnabled),
    onSuccess: (updatedAgent) => {
      queryClient.setQueryData<AgentDto | null>(["session", "me"], updatedAgent);
      void queryClient.invalidateQueries({ queryKey: ["agents"] });
      toast.success(
        updatedAgent.autoAssignEnabled
          ? "Disponible para asignación"
          : "En pausa / Desconectado",
      );
    },
    onError: (err) => {
      const msg =
        err instanceof Error && err.message !== "Failed to fetch"
          ? err.message
          : "No se pudo actualizar la disponibilidad (verifica la conexión con el backend).";
      toast.error(msg);
    },
  });

  return {
    autoAssignEnabled: session?.autoAssignEnabled ?? false,
    setAvailability: (enabled: boolean) => mutation.mutateAsync(enabled),
    toggleAvailability: () => mutation.mutateAsync(!session?.autoAssignEnabled),
    updating: mutation.isPending,
  };
}

/**
 * Hook para cambio de contraseña (tanto voluntario como obligatorio por primer login).
 * Al completarse exitosamente, desactiva la bandera `mustChangePassword` en la sesión local.
 */
export function useChangePassword() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ current, next }: { current: string; next: string }) =>
      authGateway.changePassword(current, next),
    onSuccess: () => {
      queryClient.setQueryData<AgentDto | null>(["session", "me"], (old) => {
        if (!old) return old;
        return { ...old, mustChangePassword: false };
      });
      void queryClient.invalidateQueries({ queryKey: ["session", "me"] });
    },
  });

  return {
    changePassword: (current: string, next: string) =>
      mutation.mutateAsync({ current, next }),
    changing: mutation.isPending,
  };
}

