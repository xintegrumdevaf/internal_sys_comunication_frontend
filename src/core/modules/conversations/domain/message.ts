import type { ConversationId, MessageId } from "@/core/shared/domain/ids";

export type MessageDirection = "inbound" | "outbound";
export type MessageAuthor = "customer" | "ai" | "agent" | "system";
export type MessageType =
  | "text"
  | "image"
  | "audio"
  | "video"
  | "document"
  | "other";

export type Message = {
  id: MessageId;
  conversationId: ConversationId;
  direction: MessageDirection;
  author: MessageAuthor;
  body: string;
  externalId?: string;
  type?: MessageType;
  mediaId?: string;
  mimeType?: string;
  caption?: string;
  filename?: string;
  /** Relative path served by the hub proxy, e.g. `/api/media/{id}` */
  mediaUrl?: string;
  createdAt: Date;
};

export function mediaUrlForMessage(messageId: MessageId): string {
  return `/api/media/${messageId}`;
}

export function createInboundMessage(input: {
  id: MessageId;
  conversationId: ConversationId;
  body: string;
  externalId?: string;
  type?: MessageType;
  mediaId?: string;
  mimeType?: string;
  caption?: string;
  filename?: string;
}): Message {
  const hasMedia = Boolean(input.mediaId);
  return {
    id: input.id,
    conversationId: input.conversationId,
    direction: "inbound",
    author: "customer",
    body: input.body,
    externalId: input.externalId,
    type: input.type,
    mediaId: input.mediaId,
    mimeType: input.mimeType,
    caption: input.caption,
    filename: input.filename,
    mediaUrl: hasMedia ? mediaUrlForMessage(input.id) : undefined,
    createdAt: new Date(),
  };
}
