/**
 * DTOs reales del backend isp-customer-service-api.
 * Ver docs/spec/01_DATA_MODEL.md — calcados de isp-customer-service-api/docs/spec/03_API_CONTRACT.md §C.4.
 * No quedan tipos mock (PaymentCase/WorkOrder de la API anterior fueron eliminados).
 */

export type DepartmentVisibility = "shared" | "restricted";

export type DepartmentDto = {
  id: string;
  slug: string; // "support" | "billing" | "sales" (seed real del backend)
  name: string;
  visibility: DepartmentVisibility;
  active: boolean;
  createdAt: string;
};

export type AgentRole = "agent" | "manager" | "admin";

export type AgentDto = {
  id: string; // UUID real, usado como agentUserId / header x-agent-id
  name: string;
  email: string;
  role: AgentRole;
  primaryDepartmentId: string | null;
  active: boolean;
  createdAt: string;
};

export type ConversationStatus = "open" | "pending" | "resolved" | "closed";
export type MessageAuthor = "customer" | "ai" | "agent" | "system";
export type MessageDirection = "inbound" | "outbound";
export type MessageType = "text" | "audio" | "image" | "document";

export type MessagePreviewDto = {
  body: string;
  author: MessageAuthor;
  direction: MessageDirection;
  createdAt: string;
} | null;

export type ConversationDto = {
  id: string;
  waPhone: string;
  customerId: string | null;
  activeCaseId: string | null;
  status: ConversationStatus;
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;
  /** Calculado al leer (JOIN al último message) — nunca se persiste aparte. */
  lastMessagePreview: MessagePreviewDto;
};

export type MessageDto = {
  id: string;
  conversationId: string;
  caseId: string | null;
  direction: MessageDirection;
  author: MessageAuthor;
  body: string;
  type: MessageType;
  createdAt: string;
  mediaId?: string;
  mimeType?: string;
  caption?: string;
  filename?: string;
  mediaUrl?: string;
};

export type CaseStatus =
  | "NEW"
  | "ACTIVE"
  | "WAITING_USER"
  | "PAUSED"
  | "ESCALATED"
  | "HUMAN_ACTIVE"
  | "COMPLETED"
  | "EXPIRED"
  | "CANCELLED";

export type SupportInternetContext = {
  client?: { nationalId: string; fullName: string };
  contract?: {
    id: string;
    sector: string;
    oltName: string;
    pon: string;
    serial: string;
    router: string;
  };
  balance?: { hasDebt: boolean; amount?: number };
  diagnostic?: { status: string; lastQuestion?: string; result?: string };
};

export type BillingBalanceContext = {
  purpose?: "balance" | "record_payment";
  client?: { nationalId: string; fullName: string };
  invoices?: { id: string; amount: number; dueDate: string }[];
  balance?: { hasDebt: boolean; amount?: number };
  payment?: {
    amount?: number;
    reference?: string;
    date?: string;
    status?: "PENDING" | "RECORDED" | "REJECTED";
  };
};

export type SalesPackagesContext = {
  purpose?: "packages" | "upgrade";
  requestedSpeed?: string;
  currentPlan?: { name: string; speed: string };
  offer?: { planId: string; name?: string; price: number; speed?: string; answer?: string };
};

export type GeneralInquiryContext = {
  question: string;
  retrieved?: { found: boolean; answer?: string; sources?: string[] };
};

export type CaseContext =
  | { workflowType: "SUPPORT_INTERNET"; data: SupportInternetContext }
  | { workflowType: "BILLING_BALANCE"; data: BillingBalanceContext }
  | { workflowType: "SALES_PACKAGES"; data: SalesPackagesContext }
  | { workflowType: "GENERAL_INQUIRY"; data: GeneralInquiryContext }
  | { workflowType: string; data: Record<string, unknown> };

export type AutomationStateDto = {
  enabled: boolean;
  disabledReason: string | null;
};

export type CaseDto = {
  id: string;
  conversationId: string;
  workflowType: string | null;
  status: CaseStatus;
  departmentId: string | null;
  assignedAgentId: string | null;
  context: CaseContext;
  automation: AutomationStateDto | null;
  currentState?: string;
  createdAt: string;
  lastActivityAt: string;
  expiresAt: string | null;
};

export type CaseTimelineEntryDto =
  | {
      kind: "execution";
      action: string;
      status: "DISPATCHED" | "COMPLETED" | "FAILED";
      at: string;
      output?: unknown;
      error?: unknown;
    }
  | { kind: "event"; action: string; status: "RECORDED"; at: string; payload?: unknown };

export type CaseSummaryDto = {
  problem: string;
  workflow: string;
  department: string;
  status: string;
  reason: string;
  completedSteps: string[];
  results: Record<string, unknown>;
  pendingAction: string;
  timeline: Array<{ action: string; status: string; at: string }>;
  readableSummary?: string;
};

export type EscalationStatus = "PENDING" | "ASSIGNED" | "RESOLVED";
export type EscalationPriority = "low" | "normal" | "high" | "urgent";

export type EscalationDto = {
  id: string;
  caseId: string;
  departmentId: string | null;
  priority: EscalationPriority;
  reason: string;
  summary: CaseSummaryDto;
  status: EscalationStatus;
  assignedAgentId: string | null;
  createdAt: string;
  resolvedAt: string | null;
};

export type DashboardDto = {
  userId: string;
  openConversations: number;
  myAssignedCases: number;
  escalatedPending: number;
  waitingUser: number;
};

export type AuditEventDto = {
  id: string;
  action: string;
  actorUserId?: string | null;
  resourceType: string;
  resourceId: string;
  metadata?: Record<string, string | number | boolean | null>;
  createdAt: string;
};

export type N8nWorkflowCategory = "case_action" | "admin_action";

export type N8nWorkflowEntryDto = {
  action: string;
  category: N8nWorkflowCategory;
  url: string;
  description?: string | null;
  timeoutMs: number;
  maxRetries: number;
  active: boolean;
  updatedAt: string;
};

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
