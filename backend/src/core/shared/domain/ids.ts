export type DepartmentId = string & { readonly __brand: "DepartmentId" };
export type UserId = string & { readonly __brand: "UserId" };
export type ConversationId = string & { readonly __brand: "ConversationId" };
export type MessageId = string & { readonly __brand: "MessageId" };
export type TransferId = string & { readonly __brand: "TransferId" };
export type AuditEventId = string & { readonly __brand: "AuditEventId" };

export function asDepartmentId(id: string): DepartmentId {
  return id as DepartmentId;
}
export function asUserId(id: string): UserId {
  return id as UserId;
}
export function asConversationId(id: string): ConversationId {
  return id as ConversationId;
}
export function asMessageId(id: string): MessageId {
  return id as MessageId;
}
export function asTransferId(id: string): TransferId {
  return id as TransferId;
}
export function asAuditEventId(id: string): AuditEventId {
  return id as AuditEventId;
}

export function createId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}
