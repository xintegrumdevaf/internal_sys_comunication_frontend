import { apiGet, apiPost } from "@/shared/http/http-client";
import type {
  PromptDto,
  PromptVersionDto,
  CreatePromptVersionPayload,
  SimulatePromptPayload,
  SimulatePromptResponse,
} from "../domain/prompt.types";

function unwrap<T>(response: unknown): T {
  if (response && typeof response === "object" && "data" in response) {
    return (response as { data: T }).data;
  }
  return response as T;
}

export const promptService = {
  /**
   * Obtiene la lista de todas las plantillas de prompts disponibles.
   * GET /api/prompts
   */
  listPrompts: async (): Promise<PromptDto[]> => {
    const res = await apiGet<PromptDto[] | { data: PromptDto[] }>("/api/prompts");
    const data = unwrap<PromptDto[]>(res);
    return Array.isArray(data) ? data : [];
  },

  /**
   * Obtiene el detalle de un prompt por su slug con todo su historial de versiones.
   * GET /api/prompts/:slug
   */
  getPromptBySlug: async (slug: string): Promise<PromptDto> => {
    const res = await apiGet<PromptDto | { data: PromptDto }>(
      `/api/prompts/${encodeURIComponent(slug)}`,
    );
    return unwrap<PromptDto>(res);
  },

  /**
   * Guarda una nueva versión de un prompt (borrador o publicar directo).
   * POST /api/prompts/:slug/versions
   */
  createVersion: async (
    slug: string,
    payload: CreatePromptVersionPayload,
  ): Promise<PromptVersionDto> => {
    const res = await apiPost<PromptVersionDto | { data: PromptVersionDto }>(
      `/api/prompts/${encodeURIComponent(slug)}/versions`,
      payload,
    );
    return unwrap<PromptVersionDto>(res);
  },

  /**
   * Publica una versión específica de un prompt.
   * POST /api/prompts/:slug/publish
   */
  publishVersion: async (slug: string, versionId: string): Promise<void> => {
    await apiPost<void>(`/api/prompts/${encodeURIComponent(slug)}/publish`, { versionId });
  },

  /**
   * Ejecuta un rollback a la versión anterior o a la versión indicada.
   * POST /api/prompts/:slug/rollback
   */
  rollbackVersion: async (slug: string, targetVersionId?: string): Promise<void> => {
    const body = targetVersionId ? { targetVersionId } : {};
    await apiPost<void>(`/api/prompts/${encodeURIComponent(slug)}/rollback`, body);
  },

  /**
   * Simula la ejecución de un prompt en vivo con variables de prueba.
   * POST /api/prompts/:slug/simulate
   */
  simulatePrompt: async (
    slug: string,
    payload: SimulatePromptPayload,
  ): Promise<SimulatePromptResponse> => {
    const res = await apiPost<SimulatePromptResponse | { data: SimulatePromptResponse }>(
      `/api/prompts/${encodeURIComponent(slug)}/simulate`,
      payload,
    );
    return unwrap<SimulatePromptResponse>(res);
  },
};
