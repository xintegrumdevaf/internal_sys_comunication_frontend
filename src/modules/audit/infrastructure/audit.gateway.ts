import { apiGet } from "@/shared/http/http-client";
import type { AuditEventDto } from "@/modules/audit/domain/audit-event";

/** Puerto de infraestructura: GET /api/audit?limit= (docs/API_ENDPOINTS.md §7). */
export function listAuditEvents(limit?: number): Promise<AuditEventDto[]> {
  return apiGet<AuditEventDto[]>("/api/audit", { query: { limit } });
}
