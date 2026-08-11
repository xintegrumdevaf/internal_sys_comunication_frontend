# 01_DATA_MODEL.md

DTOs de frontend, calcados 1:1 del contrato real del backend (`isp-customer-service-api/docs/spec/03_API_CONTRACT.md` §C.4 y `01_DATA_MODEL.md` §4/§6/§7). Reemplazan por completo `src/adapters/http/dto.ts` y eliminan `src/lib/ops-types.ts` (`PaymentCase`/`WorkOrder` no existen en el backend nuevo).

## 1. Catálogos

```ts
export type DepartmentVisibility = "shared" | "restricted";

export type DepartmentDto = {
  id: string;
  slug: string;          // "support" | "billing" | "sales" (seed real, ver scripts/seed.ts del backend)
  name: string;
  visibility: DepartmentVisibility;
  active: boolean;
};

export type AgentRole = "agent" | "manager" | "admin";

export type AgentDto = {
  id: string;             // UUID real, usado como agentUserId / x-agent-id
  name: string;
  email: string;
  role: AgentRole;
  primaryDepartmentId: string | null;
  active: boolean;
};
```

## 2. Conversaciones y mensajes

```ts
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
  // Campos opcionales de media, mismos que ya soporta MessageMediaBody:
  mediaId?: string;
  mimeType?: string;
  caption?: string;
  filename?: string;
  mediaUrl?: string;
};
```

## 3. Casos y contexto tipado

```ts
export type CaseStatus =
  | "NEW" | "ACTIVE" | "WAITING_USER" | "PAUSED"
  | "ESCALATED" | "HUMAN_ACTIVE"
  | "COMPLETED" | "EXPIRED" | "CANCELLED";

export type WorkflowType =
  | "SUPPORT_INTERNET" | "BILLING_BALANCE" | "SALES_PACKAGES" | "GENERAL_INQUIRY"
  | "UNCLASSIFIED" | (string & {});   // pool de triage puede traer null/"UNCLASSIFIED"

export type SupportInternetContext = {
  client?: { nationalId: string; fullName: string };
  contract?: { id: string; sector: string; oltName: string; pon: string; serial: string; router: string };
  balance?: { hasDebt: boolean; amount?: number };
  diagnostic?: { status: string; lastQuestion?: string; result?: string };
};

export type BillingBalanceContext = {
  purpose?: "balance" | "record_payment";
  client?: { nationalId: string; fullName: string };
  invoices?: { id: string; amount: number; dueDate: string }[];
  balance?: { hasDebt: boolean; amount?: number };
  payment?: { amount?: number; reference?: string; date?: string; status?: "PENDING" | "RECORDED" | "REJECTED" };
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
  | { workflowType: string; data: Record<string, unknown> }; // fallback para workflows futuros/UNCLASSIFIED

export type AutomationStateDto = {
  enabled: boolean;
  disabledReason: string | null;
};

export type CaseDto = {
  id: string;
  conversationId: string;
  workflowType: WorkflowType | null;   // null = pool de triage
  status: CaseStatus;
  departmentId: string | null;         // nullable: triage o aún no resuelto
  assignedAgentId: string | null;      // null = sin reclamar / lo maneja el bot
  context: CaseContext;
  automation: AutomationStateDto | null;
  currentState?: string;               // paso del workflow (solo en GET /api/cases/:id)
  createdAt: string;
  lastActivityAt: string;
  expiresAt: string | null;
};

/** GET /api/cases/:id/timeline — ejecuciones + eventos, ya mezclados y ordenados por el backend. */
export type CaseTimelineEntryDto =
  | { kind: "execution"; action: string; status: "DISPATCHED" | "COMPLETED" | "FAILED"; at: string; output?: unknown; error?: unknown }
  | { kind: "event"; action: string; status: "RECORDED"; at: string; payload?: unknown };

/** GET /api/cases/:id/summary — 03_API_CONTRACT.md §D, generado determinísticamente por el backend. */
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
```

## 4. Escalaciones

```ts
export type EscalationStatus = "PENDING" | "ASSIGNED" | "RESOLVED";
export type EscalationPriority = "low" | "normal" | "high" | "urgent";

export type EscalationDto = {
  id: string;
  caseId: string;
  departmentId: string | null;   // null = pool de triage
  priority: EscalationPriority;
  reason: string;
  summary: CaseSummaryDto;
  status: EscalationStatus;
  assignedAgentId: string | null;
  createdAt: string;
  resolvedAt: string | null;
};
```

## 5. Dashboard y auditoría

```ts
/** Forma real de GetDashboardUseCase (backend) — más simple que el mock anterior. */
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
```

## 6. Catálogo n8n (admin)

```ts
export type N8nWorkflowEntryDto = {
  action: string;
  category: "case_action" | "admin_action";
  url: string;
  description?: string | null;
  timeoutMs: number;
  maxRetries: number;
  active: boolean;
  updatedAt: string;
};
```

## 7. Tiempo real (eventos SSE)

```ts
export type RealtimeEvent =
  | { type: "MESSAGE_RECEIVED"; conversationId: string; messageId: string }
  | { type: "MESSAGE_SENT"; conversationId: string; messageId: string; author: "ai" | "agent" }
  | { type: "CASE_ESCALATED"; caseId: string; conversationId: string; departmentId: string | null; at: string }
  | { type: "CASE_CLAIMED"; caseId: string; agentUserId: string }
  | { type: "HUMAN_ASSIGNED"; caseId: string; agentUserId: string }
  | { type: "AUTOMATION_ENABLED"; caseId: string };
```

## 8. Tipos locales de frontend (sin equivalente backend, uso interno de UI)

```ts
/** Sesión activa en este navegador — id = AgentDto.id real, sin capa puente. */
export type SessionUser = {
  id: string;              // = AgentDto.id
  name: string;
  initials: string;
  email: string;
  role: AgentRole;         // real, de AgentDto
  departmentId: string | null;
  departmentSlug: string | null;
  landing: string;         // ruta de aterrizaje calculada del departamento
};

/** Notificación in-app derivada de eventos SSE (03_REALTIME_NOTIFICATIONS.md). */
export type UiNotification = {
  id: string;               // uuid generado en cliente
  kind: "CASE_ESCALATED" | "HUMAN_ASSIGNED";
  caseId: string;
  conversationId?: string;
  departmentId?: string | null;
  createdAt: string;
  read: boolean;
};
```
