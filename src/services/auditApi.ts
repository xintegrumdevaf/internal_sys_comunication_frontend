import { apiGet } from "@/shared/http/http-client";
import type { AuditEvent, AuditFilterParams, AuditStats } from "@/types/audit";

export const auditApi = {
  /** Obtener listado de auditoría con filtros avanzados */
  async listEvents(
    params: AuditFilterParams = {},
  ): Promise<{ data: AuditEvent[]; nextCursor: string | null }> {
    const raw = await apiGet<{ data: AuditEvent[]; pagination?: { nextCursor?: string | null } }>(
      "/api/audit",
      {
        query: {
          category: params.category,
          action: params.action,
          actorId: params.actorId,
          departmentId: params.departmentId,
          search: params.search,
          from: params.from,
          to: params.to,
          limit: params.limit,
          cursor: params.cursor,
        },
        raw: true,
      },
    );
    return { data: raw.data ?? [], nextCursor: raw.pagination?.nextCursor ?? null };
  },

  /** Obtener métricas y agregaciones para el dashboard */
  async getStats(
    params: { from?: string; to?: string; departmentId?: string } = {},
  ): Promise<AuditStats> {
    return apiGet<AuditStats>("/api/audit/stats", {
      query: {
        from: params.from,
        to: params.to,
        departmentId: params.departmentId,
      },
    });
  },
};
