import type { ConversationId, DepartmentId, UserId } from "@/core/shared/domain/ids";
import { ConflictError, ValidationError } from "@/core/shared/domain/errors";

export type ConversationStatus = "open" | "pending" | "resolved" | "closed";
export type HandlerMode = "ai" | "human";

export type Conversation = {
  id: ConversationId;
  waPhone: string;
  waMessageId?: string;
  customerName?: string;
  contractId?: string;
  departmentId: DepartmentId;
  status: ConversationStatus;
  handlerMode: HandlerMode;
  assigneeId?: UserId;
  intent?: string;
  lastMessagePreview?: string;
  createdAt: Date;
  updatedAt: Date;
};

export function openConversation(input: {
  id: ConversationId;
  waPhone: string;
  departmentId: DepartmentId;
  waMessageId?: string;
  customerName?: string;
  contractId?: string;
  intent?: string;
  lastMessagePreview?: string;
}): Conversation {
  const now = new Date();
  return {
    id: input.id,
    waPhone: input.waPhone,
    waMessageId: input.waMessageId,
    customerName: input.customerName,
    contractId: input.contractId,
    departmentId: input.departmentId,
    status: "open",
    handlerMode: "ai",
    intent: input.intent,
    lastMessagePreview: input.lastMessagePreview,
    createdAt: now,
    updatedAt: now,
  };
}

export function assignToHuman(conversation: Conversation, assigneeId: UserId): Conversation {
  if (conversation.status === "closed") {
    throw new ConflictError("Cannot assign a closed conversation");
  }
  return {
    ...conversation,
    handlerMode: "human",
    assigneeId,
    status: conversation.status === "resolved" ? "open" : conversation.status,
    updatedAt: new Date(),
  };
}

export function transferDepartment(
  conversation: Conversation,
  toDepartmentId: DepartmentId,
): Conversation {
  if (conversation.departmentId === toDepartmentId) {
    throw new ValidationError("Conversation is already in that department");
  }
  if (conversation.status === "closed") {
    throw new ConflictError("Cannot transfer a closed conversation");
  }
  return {
    ...conversation,
    departmentId: toDepartmentId,
    assigneeId: undefined,
    handlerMode: "human",
    status: "pending",
    updatedAt: new Date(),
  };
}

export function appendPreview(conversation: Conversation, preview: string): Conversation {
  return {
    ...conversation,
    lastMessagePreview: preview.slice(0, 180),
    updatedAt: new Date(),
  };
}
