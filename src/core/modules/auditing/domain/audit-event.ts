import type { AuditEventId, UserId } from "@/core/shared/domain/ids";

export type AuditAction =
  | "MESSAGE_RECEIVED"
  | "CONVERSATION_OPENED"
  | "TAKE_CONTROL"
  | "TRANSFER"
  | "AUTH_OK"
  | "HANDOVER";

export type AuditEvent = {
  id: AuditEventId;
  action: AuditAction;
  actorUserId?: UserId;
  resourceType: string;
  resourceId: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
};

export function createAuditEvent(input: {
  id: AuditEventId;
  action: AuditAction;
  resourceType: string;
  resourceId: string;
  actorUserId?: UserId;
  metadata?: Record<string, unknown>;
}): AuditEvent {
  return {
    ...input,
    createdAt: new Date(),
  };
}
