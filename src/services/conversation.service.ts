import { apiGet, apiPost } from "@/shared/http/http-client";
import type { ZernioSyncStatus } from "@/types/department";
import * as conversationGateway from "@/modules/conversations/infrastructure/conversation.gateway";

export const conversationService = {
  // Métodos de conversaciones existentes delegados a su gateway
  listConversations: conversationGateway.listConversations,
  listMessages: conversationGateway.listMessages,
  listCasesForConversation: conversationGateway.listCasesForConversation,
  getConversationAutomation: conversationGateway.getConversationAutomation,
  replyAsHuman: conversationGateway.replyAsHuman,
  takeControl: conversationGateway.takeControl,
  markAsRead: conversationGateway.markAsRead,

  // Sincronización de mensajes históricos de Zernio
  startZernioHistorySync: async (
    days: number = 30,
  ): Promise<{ message: string; jobId: string }> => {
    return apiPost<{ message: string; jobId: string }>("/api/conversations/sync-history", {
      days,
      limit: 100,
    });
  },

  getZernioHistorySyncStatus: async (): Promise<ZernioSyncStatus> => {
    return apiGet<ZernioSyncStatus>("/api/conversations/sync-history/status");
  },
};
