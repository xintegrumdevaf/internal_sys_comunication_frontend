import type { ConversationDto } from "@/modules/conversations/domain/conversation";
import type { MentionTarget } from "@/modules/internal-chat/domain/internal-chat";

/**
 * Construye los targets de mención @ a partir de conversaciones REALES del
 * backend. Sin datos de ejemplo: si no hay conversaciones, la lista queda
 * vacía (docs/spec/00_OVERVIEW.md §1 — nada quemado ni local).
 *
 * El backend no expone nombre/contrato del cliente a nivel de Conversation
 * (solo waPhone); si el caso activo ya validó al cliente, su nombre vive en
 * `case.context.data.client.fullName` — ese enriquecimiento se hace en
 * CasePanel, no aquí, para no acoplar el chat interno a un caso puntual.
 */
export function targetsFromConversations(conversations: ConversationDto[]): MentionTarget[] {
  return conversations.map((c) => ({
    type: "conversation" as const,
    targetId: c.id,
    label: c.waPhone,
    customerName: c.waPhone,
    conversationId: c.id,
    status: c.status,
    preview: c.lastMessagePreview?.body,
  }));
}
