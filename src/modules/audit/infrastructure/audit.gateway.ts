import { auditApi } from "@/services/auditApi";
import type { AuditEvent, AuditFilterParams, AuditStats } from "@/types/audit";

/** Puerto de infraestructura: GET /api/audit?limit= (compatibilidad) */
export async function listAuditEvents(limit?: number): Promise<AuditEvent[]> {
  const result = await auditApi.listEvents({ limit });
  return result.data;
}

/** Obtiene eventos de auditoría con filtros avanzados */
export function listAdvancedAuditEvents(
  params: AuditFilterParams = {},
): Promise<{ data: AuditEvent[]; nextCursor: string | null }> {
  return auditApi.listEvents(params);
}

/** Obtiene estadísticas y métricas de auditoría */
export function getAuditStats(
  params: { from?: string; to?: string; departmentId?: string } = {},
): Promise<AuditStats> {
  return auditApi.getStats(params);
}
