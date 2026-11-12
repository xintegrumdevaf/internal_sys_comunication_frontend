export type RealtimeEvent =
  | {
      type: "MESSAGE_RECEIVED";
      conversationId: string;
      messageId: string;
      bodyPreview?: string;
      authorName?: string;
      departmentId?: string | null;
      assignedAgentId?: string | null;
      isHumanActive?: boolean;
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
      customerName?: string | null;
      customerPhone?: string | null;
      reason?: string | null;
    }
  | { type: "CASE_CLAIMED"; caseId: string; agentUserId: string }
  | {
      type: "HUMAN_ASSIGNED";
      caseId: string;
      agentUserId: string;
      conversationId?: string;
      customerName?: string | null;
      customerPhone?: string | null;
    }
  | { type: "AUTOMATION_ENABLED"; caseId: string }
  | { type: "AUTOMATION_DISABLED"; caseId: string }
  | {
      type: "CASE_SCHEDULED_REMINDER";
      caseId: string;
      conversationId: string;
      assignedAgentId?: string | null;
      departmentId?: string | null;
      scheduledAt: string;
      scheduleTag?: string | null;
      reminderReason?: string | null;
    }
  | {
      type: "UNASSIGNED_SLA_BREACH";
      caseId: string;
      conversationId: string;
      departmentId: string | null;
      departmentName?: string | null;
      waitMinutes: number;
      customerName: string;
      customerPhone?: string;
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

export function formatEscalationReason(reason?: string | null): string {
  if (!reason) return "Atención manual requerida";
  const upper = reason.toUpperCase();
  if (upper.includes("REQUEST_HUMAN")) return "Solicitud de asesor humano";
  if (upper.includes("TIMEOUT")) return "Tiempo de respuesta excedido";
  if (upper.includes("EXTERNAL_SERVICE_ERROR")) return "Falla en servicio externo";
  if (upper.includes("AI_ERROR") || upper.includes("UNSUPPORTED"))
    return "Consulta fuera de alcance IA";
  if (upper.includes("TRIAGE")) return "Pool de triage y derivación";
  if (upper.includes("TECHNICAL")) return "Incidencia técnica en enlace";
  return reason;
}
