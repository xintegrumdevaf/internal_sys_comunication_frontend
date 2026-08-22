import { apiGet, apiPost } from "@/shared/http/http-client";
import { resolveApiUrl } from "@/shared/http/api-base";
import type {
  ConversationDto,
  ConversationStatus,
  MessageDto,
} from "@/modules/conversations/domain/conversation";
import type { CaseDto } from "@/modules/cases/domain/case";

/**
 * Puerto de infraestructura del modulo conversations: unico punto que conoce
 * las rutas REST reales de /api/conversations/* (docs/API_ENDPOINTS.md §4).
 */

function withMediaUrls(messages: MessageDto[]): MessageDto[] {
  return messages.map((message) => {
    if (message.mediaUrl) {
      return { ...message, mediaUrl: resolveApiUrl(message.mediaUrl) };
    }
    if (message.mediaId) {
      return { ...message, mediaUrl: resolveApiUrl(`/api/media/${message.mediaId}`) };
    }
    return message;
  });
}

export function listConversations(filter?: {
  departmentId?: string;
  userId?: string;
  status?: ConversationStatus;
}): Promise<ConversationDto[]> {
  return apiGet<ConversationDto[]>("/api/conversations", { query: filter });
}

export async function listMessages(
  conversationId: string,
  page?: { limit?: number; cursor?: string },
): Promise<MessageDto[]> {
  const items = await apiGet<MessageDto[]>(`/api/conversations/${conversationId}/messages`, {
    query: { limit: page?.limit, cursor: page?.cursor },
  });
  return withMediaUrls(items);
}

export function listCasesForConversation(conversationId: string): Promise<CaseDto[]> {
  return apiGet<CaseDto[]>(`/api/conversations/${conversationId}/cases`);
}

export function getConversationAutomation(
  conversationId: string,
): Promise<{ caseId: string; enabled: boolean; disabledReason: string | null } | null> {
  return apiGet(`/api/conversations/${conversationId}/automation`);
}

export async function replyAsHuman(
  conversationId: string,
  agentUserId: string,
  body: string,
): Promise<MessageDto> {
  const message = await apiPost<MessageDto>(`/api/conversations/${conversationId}/reply`, {
    agentUserId,
    body,
  });
  return withMediaUrls([message])[0]!;
}

export function takeControl(conversationId: string, agentUserId: string): Promise<ConversationDto> {
  return apiPost<ConversationDto>(`/api/conversations/${conversationId}/take-control`, {
    agentUserId,
  });
}

export function markAsRead(conversationId: string): Promise<void> {
  return apiPost(`/api/conversations/${conversationId}/read`);
}

