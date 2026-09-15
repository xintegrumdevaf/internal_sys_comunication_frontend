import { apiDelete, apiGet, apiPost, apiPut } from "@/shared/http/http-client";
import type {
  QuickReply,
  CreateQuickReplyPayload,
  UpdateQuickReplyPayload,
  ResolveQuickReplyResponse,
} from "@/types/quick-reply";

interface QuickReplyEnvelope {
  quickReplies?: QuickReply[];
  quickReply?: QuickReply;
}

export const quickRepliesApi = {
  list: async (params?: {
    departmentId?: string | null;
    search?: string;
    category?: string;
    activeOnly?: boolean;
  }): Promise<QuickReply[]> => {
    const query: Record<string, string | number | undefined> = {};
    if (params?.departmentId === null) {
      query.departmentId = "null";
    } else if (params?.departmentId !== undefined) {
      query.departmentId = params.departmentId;
    }
    if (params?.search) query.search = params.search;
    if (params?.category) query.category = params.category;
    if (params?.activeOnly !== undefined) query.activeOnly = String(params.activeOnly);

    const res = await apiGet<QuickReplyEnvelope | QuickReply[]>("/api/quick-replies", {
      query,
    });

    if (Array.isArray(res)) return res;
    return res?.quickReplies ?? [];
  },

  resolve: async (params: {
    shortcut: string;
    departmentId?: string | null;
    conversationId?: string;
  }): Promise<ResolveQuickReplyResponse> => {
    const query: Record<string, string | number | undefined> = {
      shortcut: params.shortcut,
    };
    if (params.departmentId !== undefined && params.departmentId !== null) {
      query.departmentId = params.departmentId;
    }
    if (params.conversationId) {
      query.conversationId = params.conversationId;
    }

    const res = await apiGet<ResolveQuickReplyResponse>("/api/quick-replies/resolve", {
      query,
    });
    return res;
  },

  create: async (payload: CreateQuickReplyPayload): Promise<QuickReply> => {
    const res = await apiPost<QuickReplyEnvelope | QuickReply>("/api/quick-replies", payload);
    return (res as QuickReplyEnvelope)?.quickReply ?? (res as QuickReply);
  },

  update: async (id: string, payload: UpdateQuickReplyPayload): Promise<QuickReply> => {
    const res = await apiPut<QuickReplyEnvelope | QuickReply>(`/api/quick-replies/${id}`, payload);
    return (res as QuickReplyEnvelope)?.quickReply ?? (res as QuickReply);
  },

  delete: async (id: string): Promise<void> => {
    await apiDelete<void>(`/api/quick-replies/${id}`);
  },
};
