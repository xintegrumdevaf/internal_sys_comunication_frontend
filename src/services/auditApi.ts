import { resolveApiUrl } from "@/shared/http/api-base";
import type { AuditEvent, AuditFilterParams, AuditStats } from "@/types/audit";

export const auditApi = {
  /** Obtener listado de auditoría con filtros avanzados */
  async listEvents(
    params: AuditFilterParams = {},
  ): Promise<{ data: AuditEvent[]; nextCursor: string | null }> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, String(value));
      }
    });

    const queryString = searchParams.toString();
    const url = resolveApiUrl(`/api/audit${queryString ? `?${queryString}` : ""}`);
    const res = await fetch(url, {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Error al cargar eventos de auditoría");
    const json =
      typeof res.json === "function" ? await res.json() : JSON.parse(await res.text());
    return { data: json.data ?? [], nextCursor: json.pagination?.nextCursor ?? null };
  },

  /** Obtener métricas y agregaciones para el dashboard */
  async getStats(
    params: { from?: string; to?: string; departmentId?: string } = {},
  ): Promise<AuditStats> {
    const searchParams = new URLSearchParams();
    if (params.from) searchParams.append("from", params.from);
    if (params.to) searchParams.append("to", params.to);
    if (params.departmentId) searchParams.append("departmentId", params.departmentId);

    const queryString = searchParams.toString();
    const url = resolveApiUrl(`/api/audit/stats${queryString ? `?${queryString}` : ""}`);
    const res = await fetch(url, {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Error al cargar métricas de auditoría");
    const json =
      typeof res.json === "function" ? await res.json() : JSON.parse(await res.text());
    return json.data;
  },
};
