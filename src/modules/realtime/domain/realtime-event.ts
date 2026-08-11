/** Catalogo de eventos SSE reales (03_API_CONTRACT.md §C.3/§E del backend). */
export type RealtimeEvent =
  | { type: "MESSAGE_RECEIVED"; conversationId: string; messageId: string }
  | { type: "MESSAGE_SENT"; conversationId: string; messageId: string; author: "ai" | "agent" }
  | {
      type: "CASE_ESCALATED";
      caseId: string;
      conversationId: string;
      departmentId: string | null;
      at: string;
    }
  | { type: "CASE_CLAIMED"; caseId: string; agentUserId: string }
  | { type: "HUMAN_ASSIGNED"; caseId: string; agentUserId: string }
  | { type: "AUTOMATION_ENABLED"; caseId: string };
