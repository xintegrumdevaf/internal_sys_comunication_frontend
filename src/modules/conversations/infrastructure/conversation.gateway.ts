import { apiGet, apiPost } from "@/shared/http/http-client";
import { resolveApiUrl } from "@/shared/http/api-base";
import type {
  ConversationDto,
  ConversationStatus,
  MessageDto,
} from "@/modules/conversations/domain/conversation";
import type { OutboundMediaKind } from "@/modules/conversations/domain/outbound-media";
import type { CaseDto } from "@/modules/cases/domain/case";
import type { ZernioSyncStatus } from "@/types/department";

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

export function searchConversations(
  query: string,
  filter?: {
    departmentId?: string;
    userId?: string;
    limit?: number;
  },
): Promise<ConversationDto[]> {
  return apiGet<ConversationDto[]>("/api/conversations/search", {
    query: {
      q: query,
      departmentId: filter?.departmentId,
      userId: filter?.userId,
      limit: filter?.limit,
    },
  });
}

export function getConversation(
  conversationId: string,
  options?: { signal?: AbortSignal },
): Promise<ConversationDto> {
  return apiGet<ConversationDto>(`/api/conversations/${conversationId}`, {
    signal: options?.signal,
  });
}

export async function listMessages(
  conversationId: string,
  page?: { limit?: number; cursor?: string },
  options?: { signal?: AbortSignal },
): Promise<MessageDto[]> {
  const items = await apiGet<MessageDto[]>(`/api/conversations/${conversationId}/messages`, {
    query: { limit: page?.limit, cursor: page?.cursor },
    signal: options?.signal,
  });
  return withMediaUrls(items);
}

export function listCasesForConversation(
  conversationId: string,
  options?: { signal?: AbortSignal },
): Promise<CaseDto[]> {
  return apiGet<CaseDto[]>(`/api/conversations/${conversationId}/cases`, {
    signal: options?.signal,
  });
}

export function getConversationAutomation(
  conversationId: string,
  options?: { signal?: AbortSignal },
): Promise<{ caseId: string; enabled: boolean; disabledReason: string | null } | null> {
  return apiGet(`/api/conversations/${conversationId}/automation`, {
    signal: options?.signal,
  });
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

/**
 * Envía imagen, video, audio o documento.
 * `POST /api/conversations/:id/reply` acepta multipart (`file`, `caption`, `type`, `mimeType`, `filename`).
 * Las rutas `/media` y `/attachments` usan el mismo handler.
 */
export async function replyWithMedia(
  conversationId: string,
  file: File,
  options?: { caption?: string; type?: OutboundMediaKind },
): Promise<MessageDto> {
  const form = new FormData();
  form.append("file", file, file.name);
  const caption = options?.caption?.trim();
  if (caption) form.append("caption", caption);
  if (options?.type) form.append("type", options.type);
  if (file.type) form.append("mimeType", file.type);
  if (file.name) form.append("filename", file.name);
  const message = await apiPost<MessageDto>(`/api/conversations/${conversationId}/reply`, form);
  return withMediaUrls([message])[0]!;
}

export async function sendTemplate(
  conversationId: string,
  templateName: string,
  languageCode = "es",
  parameters: string[] = [],
): Promise<MessageDto> {
  const message = await apiPost<MessageDto>(`/api/conversations/${conversationId}/template`, {
    templateName,
    languageCode,
    parameters,
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

export function closeConversation(conversationId: string): Promise<ConversationDto> {
  return apiPost<ConversationDto>(`/api/conversations/${conversationId}/close`);
}

export function deriveConversation(
  conversationId: string,
  toDepartmentId: string,
  reason: string,
): Promise<{ caseId: string; departmentId: string; departmentName: string }> {
  return apiPost(`/api/conversations/${conversationId}/derive`, { toDepartmentId, reason });
}

export function startZernioHistorySync(
  days: number = 30,
): Promise<{ message: string; jobId: string }> {
  return apiPost<{ message: string; jobId: string }>("/api/conversations/sync-history", {
    days,
    limit: 100,
  });
}

export function getZernioHistorySyncStatus(): Promise<ZernioSyncStatus> {
  return apiGet<ZernioSyncStatus>("/api/conversations/sync-history/status");
}
