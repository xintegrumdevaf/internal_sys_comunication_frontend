/** Entidades Conversation/Message reales del backend (03_API_CONTRACT.md §C.4). */

export type ConversationStatus = "open" | "pending" | "resolved" | "closed";
export type MessageAuthor = "customer" | "ai" | "agent" | "system";
export type MessageDirection = "inbound" | "outbound";
export type MessageType = "text" | "audio" | "image" | "document";

export type MessagePreviewDto = {
  body: string;
  author: MessageAuthor;
  direction: MessageDirection;
  createdAt: string;
} | null;

export type ConversationDto = {
  id: string;
  waPhone: string;
  customerId: string | null;
  activeCaseId: string | null;
  status: ConversationStatus;
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;
  /** Calculado al leer (JOIN al último message) — nunca se persiste aparte. */
  lastMessagePreview: MessagePreviewDto;
};

export type MessageDto = {
  id: string;
  conversationId: string;
  caseId: string | null;
  direction: MessageDirection;
  author: MessageAuthor;
  body: string;
  type: MessageType;
  createdAt: string;
  mediaId?: string;
  mimeType?: string;
  caption?: string;
  filename?: string;
  mediaUrl?: string;
};
