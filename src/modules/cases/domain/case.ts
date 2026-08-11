/**
 * Entidad Case y su contexto tipado por workflow (docs/spec/01_DATA_MODEL.md
 * §3-4 del backend). Este modulo es el dueno del concepto "caso" - conversations,
 * escalations y assignment lo consumen pero nunca lo redefinen (DRY).
 */

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
  | { workflowType: string; data: Record<string, unknown> }; // fallback: workflows futuros/UNCLASSIFIED

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

const WORKFLOW_LABELS: Record<string, { label: string; cls: string }> = {
  SUPPORT_INTERNET: { label: "Soporte", cls: "bg-red-100 text-red-700" },
  BILLING_BALANCE: { label: "Facturación", cls: "bg-green-100 text-green-700" },
  SALES_PACKAGES: { label: "Ventas", cls: "bg-amber-100 text-amber-700" },
  GENERAL_INQUIRY: { label: "Consulta", cls: "bg-blue-100 text-blue-700" },
  UNCLASSIFIED: { label: "Sin clasificar", cls: "bg-purple-100 text-purple-700" },
};

export function workflowLabel(workflowType?: string | null): { label: string; cls: string } {
  if (!workflowType) return { label: "Sin caso", cls: "bg-foreground/5 text-muted-foreground" };
  return (
    WORKFLOW_LABELS[workflowType] ?? {
      label: workflowType,
      cls: "bg-foreground/5 text-muted-foreground",
    }
  );
}

const CASE_STATUS_LABELS: Record<CaseStatus, string> = {
  NEW: "Nuevo",
  ACTIVE: "En curso (IA)",
  WAITING_USER: "Esperando cliente",
  PAUSED: "Pausado",
  ESCALATED: "Escalado",
  HUMAN_ACTIVE: "Atendido por humano",
  COMPLETED: "Completado",
  EXPIRED: "Expirado",
  CANCELLED: "Cancelado",
};

export function caseStatusLabel(status?: CaseStatus): string {
  return status ? (CASE_STATUS_LABELS[status] ?? status) : "—";
}

/** Nombre del cliente si el caso activo ya lo validó (01_DATA_MODEL.md §4 del backend). */
export function clientNameFromCase(c?: CaseDto | null): string | null {
  if (!c) return null;
  const data = c.context?.data as { client?: { fullName?: string } } | undefined;
  return data?.client?.fullName ?? null;
}
