import { apiGet, apiPatch, apiPost, ApiError } from "@/shared/http/http-client";
import type { AgentDto } from "@/modules/identity/domain/agent";
import { normalizeAgent } from "@/modules/identity/infrastructure/normalize-agent";

/**
 * Puerto de infraestructura para el login real (docs/spec/06_BACKEND_GAPS.md
 * §1.b) — `POST /api/auth/login` deja una cookie httpOnly; a partir de ahi
 * el navegador la manda solo en cada request (`credentials: "include"` en
 * http-client.ts), nunca la maneja este codigo directamente.
 */
export async function login(email: string, password: string): Promise<AgentDto> {
  const agent = await apiPost<AgentDto>("/api/auth/login", { email, password });
  return normalizeAgent(agent);
}

export function logout(): Promise<void> {
  return apiPost<void>("/api/auth/logout");
}

/** Sesion actual segun la cookie real — null si no hay sesion (401/403). */
export async function fetchCurrentAgent(): Promise<AgentDto | null> {
  try {
    const agent = await apiGet<AgentDto>("/api/auth/me");
    return normalizeAgent(agent);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      return null;
    }
    // Si fue un error de red o error de servidor (500), relanzamos el error
    // para que React Query conserve la sesión activa en caché y no desconecte al usuario.
    throw error;
  }
}

export function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  return apiPost<void>("/api/auth/change-password", { currentPassword, newPassword });
}

/**
 * Actualiza la disponibilidad del agente actual para entrar o salir del pool de auto-asignación.
 * `PATCH /api/auth/me/availability` con `{ autoAssignEnabled: boolean }`.
 */
export async function updateMyAvailability(autoAssignEnabled: boolean): Promise<AgentDto> {
  const agent = await apiPatch<AgentDto>("/api/auth/me/availability", { autoAssignEnabled });
  return normalizeAgent(agent);
}
