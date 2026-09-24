export type RealtimeEvent =
  | {
      type: "MESSAGE_RECEIVED";
      conversationId: string;
      messageId: string;
      bodyPreview?: string;
      authorName?: string;
    }
  | { type: "MESSAGE_SENT"; conversationId: string; messageId: string; author: "ai" | "agent" }
  | {
      type: "MESSAGE_EDITED";
      conversationId: string;
      messageId: string;
      newBody: string;
      editedAt: string;
    }
  | {
      type: "MESSAGE_STATUS_UPDATED";
      conversationId: string;
      messageId?: string;
      status?: string;
    }
  | {
      type: "CASE_ESCALATED";
      caseId: string;
      conversationId: string;
      departmentId: string | null;
      at: string;
    }
  | { type: "CASE_CLAIMED"; caseId: string; agentUserId: string }
  | { type: "HUMAN_ASSIGNED"; caseId: string; agentUserId: string }
  | { type: "AUTOMATION_ENABLED"; caseId: string }
  | { type: "AUTOMATION_DISABLED"; caseId: string }
  | {
      type: "CASE_SCHEDULED_REMINDER";
      caseId: string;
      conversationId: string;
      assignedAgentId?: string | null;
      departmentId?: string | null;
      scheduledAt: string;
      reminderReason?: string | null;
    }
  | {
      type: "INTERNAL_MESSAGE_SENT";
      threadId: string;
      messageId?: string;
      senderAgentId?: string;
      senderAgentName?: string;
      body?: string;
      messageType?: string;
      [key: string]: unknown;
    }
  | {
      type: "INTERNAL_THREAD_READ";
      threadId: string;
      agentId?: string;
      [key: string]: unknown;
    };
