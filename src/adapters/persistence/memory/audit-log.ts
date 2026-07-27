import type { AuditLogPort } from "@/core/modules/auditing/application/ports";
import type { AuditEvent } from "@/core/modules/auditing/domain/audit-event";

export class InMemoryAuditLog implements AuditLogPort {
  private readonly events: AuditEvent[] = [];

  async append(event: AuditEvent): Promise<void> {
    this.events.push(event);
  }

  async listRecent(limit = 50): Promise<AuditEvent[]> {
    return this.events
      .slice()
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }
}
