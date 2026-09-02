import { apiGet, apiPost } from "@/shared/http/http-client";

export interface InternalParticipant {
  agentId: string;
  agentName: string;
  agentEmail: string;
  agentRole: "agent" | "manager" | "admin";
  lastReadAt: string;
}

export interface InternalThread {
  id: string;
  type: "direct" | "group" | "quality_coaching";
  referenceId: string | null;
  participants: InternalParticipant[];
  unreadCount: number;
  lastMessage: {
    id: string;
    senderAgentId: string;
    senderAgentName: string;
    type: "text" | "quality_quote" | "conversation_excerpt";
    body: string;
    createdAt: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface InternalMessage {
  id: string;
  threadId: string;
  senderAgentId: string;
  senderAgentName: string;
  type: "text" | "quality_quote" | "conversation_excerpt";
  body: string;
  contextData: {
    qualityReviewId?: string;
    originalMessageId?: string;
    category?: string;
    severity?: "low" | "medium" | "high";
    excerpt?: string;
    cordialityScore?: number;
    [key: string]: unknown;
  };
  createdAt: string;
}

export const internalChatApi = {
  // Listar hilos del agente
  getThreads: async (): Promise<InternalThread[]> => {
    const data = await apiGet<InternalThread[]>("/api/internal/threads");
    return data ?? [];
  },

  // Obtener o crear chat 1:1 con un compañero/supervisor
  getOrCreateDirectThread: async (
    peerAgentId: string,
    referenceId?: string,
  ): Promise<InternalThread> => {
    return apiPost<InternalThread>("/api/internal/threads/direct", { peerAgentId, referenceId });
  },

  // Obtener mensajes de un hilo
  getMessages: async (
    threadId: string,
    options?: { limit?: number; cursor?: string },
  ): Promise<{ messages: InternalMessage[]; nextCursor: string | null }> => {
    const raw = await apiGet<{
      data: InternalMessage[];
      pagination?: { nextCursor?: string | null };
    }>(`/api/internal/threads/${threadId}/messages`, {
      query: {
        limit: options?.limit,
        cursor: options?.cursor,
      },
      raw: true,
    });
    return { messages: raw.data ?? [], nextCursor: raw.pagination?.nextCursor ?? null };
  },

  // Enviar mensaje (texto normal o quality_quote)
  sendMessage: async (
    threadId: string,
    payload: { body: string; type?: string; contextData?: Record<string, unknown> },
  ): Promise<InternalMessage> => {
    return apiPost<InternalMessage>(`/api/internal/threads/${threadId}/messages`, payload);
  },

  // Marcar como leído
  markAsRead: async (threadId: string): Promise<void> => {
    await apiPost<void>(`/api/internal/threads/${threadId}/read`);
  },
};
