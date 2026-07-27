import type { ConversationId, MessageId } from "@/core/shared/domain/ids";

export type MessageDirection = "inbound" | "outbound";
export type MessageAuthor = "customer" | "ai" | "agent" | "system";

export type Message = {
  id: MessageId;
  conversationId: ConversationId;
  direction: MessageDirection;
  author: MessageAuthor;
  body: string;
  externalId?: string;
  createdAt: Date;
};

export function createInboundMessage(input: {
  id: MessageId;
  conversationId: ConversationId;
  body: string;
  externalId?: string;
}): Message {
  return {
    id: input.id,
    conversationId: input.conversationId,
    direction: "inbound",
    author: "customer",
    body: input.body,
    externalId: input.externalId,
    createdAt: new Date(),
  };
}
