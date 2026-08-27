export type AuditCategory = "security" | "operational" | "data_change" | "system";
export type AuditActorType = "agent" | "system" | "customer" | "external_api";

export interface AuditEvent {
  id: string;
  action: string;
  category: AuditCategory;
  resourceType: string;
  resourceId: string;
  actor: {
    id: string | null;
    name: string;
    email: string | null;
    role: string | null;
    type: AuditActorType;
  };
  department: {
    id: string;
    name: string;
  } | null;
  metadata: Record<string, unknown>;
  beforeState: Record<string, unknown> | null;
  afterState: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  correlationId: string | null;
  occurredAt: string;
  /** Compatibilidad hacia atrás */
  createdAt?: string;
  actorUserId?: string | null;
}

export interface AuditStats {
  totalEvents: number;
  byCategory: Record<AuditCategory, number>;
  topActions: Array<{ action: string; count: number }>;
  topActors: Array<{ actorId: string; actorName: string; count: number }>;
}

export interface AuditFilterParams {
  action?: string;
  category?: AuditCategory;
  resourceType?: string;
  resourceId?: string;
  actorId?: string;
  departmentId?: string;
  from?: string;
  to?: string;
  search?: string;
  limit?: number;
  cursor?: string;
}
