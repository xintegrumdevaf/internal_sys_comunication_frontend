import { resolveApiUrl } from "@/shared/http/api-base";

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
    const res = await fetch(resolveApiUrl("/api/internal/threads"), { credentials: "include" });
    const { data } = await res.json();
    return data ?? [];
  },

  // Obtener o crear chat 1:1 con un compañero/supervisor
  getOrCreateDirectThread: async (
    peerAgentId: string,
    referenceId?: string,
  ): Promise<InternalThread> => {
    const res = await fetch(resolveApiUrl("/api/internal/threads/direct"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ peerAgentId, referenceId }),
    });
    const { data } = await res.json();
    return data;
  },

  // Obtener mensajes de un hilo
  getMessages: async (
    threadId: string,
    options?: { limit?: number; cursor?: string },
  ): Promise<{ messages: InternalMessage[]; nextCursor: string | null }> => {
    const params = new URLSearchParams();
    if (options?.limit) params.set("limit", String(options.limit));
    if (options?.cursor) params.set("cursor", options.cursor);

    const queryString = params.toString() ? `?${params.toString()}` : "";
    const res = await fetch(
      resolveApiUrl(`/api/internal/threads/${threadId}/messages${queryString}`),
      { credentials: "include" },
    );
    const json = await res.json();
    return { messages: json.data ?? [], nextCursor: json.pagination?.nextCursor ?? null };
  },

  // Enviar mensaje (texto normal o quality_quote)
  sendMessage: async (
    threadId: string,
    payload: { body: string; type?: string; contextData?: Record<string, unknown> },
  ): Promise<InternalMessage> => {
    const res = await fetch(resolveApiUrl(`/api/internal/threads/${threadId}/messages`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    const { data } = await res.json();
    return data;
  },

  // Marcar como leído
  markAsRead: async (threadId: string): Promise<void> => {
    await fetch(resolveApiUrl(`/api/internal/threads/${threadId}/read`), {
      method: "POST",
      credentials: "include",
    });
  },
};
