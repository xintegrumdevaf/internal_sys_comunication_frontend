export interface QuickReply {
  id: string;
  shortcut: string;
  title: string;
  body: string;
  departmentId: string | null;
  category: string | null;
  mediaUrl: string | null;
  createdByAgentId: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuickReplyPayload {
  shortcut: string;
  title: string;
  body: string;
  departmentId?: string | null;
  category?: string | null;
  mediaUrl?: string | null;
}

export interface UpdateQuickReplyPayload {
  shortcut?: string;
  title?: string;
  body?: string;
  departmentId?: string | null;
  category?: string | null;
  mediaUrl?: string | null;
  active?: boolean;
}

export interface ResolveQuickReplyResponse {
  quickReply: QuickReply;
  interpolatedBody: string;
  contextUsed: Record<string, string>;
}
