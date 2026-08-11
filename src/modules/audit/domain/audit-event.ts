export type AuditEventDto = {
  id: string;
  action: string;
  actorUserId?: string | null;
  resourceType: string;
  resourceId: string;
  metadata?: Record<string, string | number | boolean | null>;
  createdAt: string;
};
