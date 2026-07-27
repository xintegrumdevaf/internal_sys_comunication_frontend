import type { AuditEvent } from "@/core/modules/auditing/domain/audit-event";

export interface AuditLogPort {
  append(event: AuditEvent): Promise<void>;
  listRecent(limit?: number): Promise<AuditEvent[]>;
}
