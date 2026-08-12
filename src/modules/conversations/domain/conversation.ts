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
  /**
   * Nombre de perfil/agenda de WhatsApp — real, viene del webhook de Meta
   * (`contacts[].profile.name`), nunca inventado. `null` hasta que llega el
   * primer mensaje del cliente. Nota: WhatsApp NO permite obtener la foto de
   * perfil vía la API oficial (restricción de privacidad de Meta, aplica a
   * cualquier negocio) — por eso solo hay nombre, no foto.
   */
  waProfileName: string | null;
};

/**
 * Formatea un número de WhatsApp crudo ("593998576466") en algo legible
 * ("+593 998 576 466") — un asesor o un jefe de área no debería leer una
 * cadena de 12 dígitos pegados.
 */
export function formatWaPhone(waPhone: string): string {
  const digits = waPhone.replace(/\D/g, "");
  if (digits.length < 8) return `+${digits}`;
  const cc = digits.slice(0, 3);
  const rest = digits.slice(3);
  const groups = rest.match(/.{1,3}/g) ?? [rest];
  return `+${cc} ${groups.join(" ")}`;
}

/**
 * Nombre a mostrar para un cliente: prioriza el nombre real de su perfil de
 * WhatsApp; si todavía no llegó ningún mensaje con `contacts` en el payload,
 * cae al teléfono formateado — nunca "Cliente" ni un placeholder inventado.
 */
export function conversationDisplayName(
  conversation: Pick<ConversationDto, "waPhone" | "waProfileName">,
): string {
  return conversation.waProfileName?.trim() || formatWaPhone(conversation.waPhone);
}

const CONVERSATION_STATUS_LABELS: Record<ConversationStatus, string> = {
  open: "Abierta",
  pending: "En espera",
  resolved: "Resuelta",
  closed: "Cerrada",
};

/** Texto claro en español para el estado de la conversación (nunca el enum crudo en inglés). */
export function conversationStatusLabel(status: ConversationStatus): string {
  return CONVERSATION_STATUS_LABELS[status] ?? status;
}

export type MessageDto = {
  id: string;
  conversationId: string;
  caseId: string | null;
  direction: MessageDirection;
  author: MessageAuthor;
  /** Set en replies humanos (backend 07_QUALITY_SUPERVISION.md §6); null en inbound/ai/system. */
  agentId: string | null;
  body: string;
  type: MessageType;
  createdAt: string;
  mediaId?: string;
  mimeType?: string;
  caption?: string;
  filename?: string;
  mediaUrl?: string;
};
