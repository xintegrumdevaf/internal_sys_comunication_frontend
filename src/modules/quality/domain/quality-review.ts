/** DTOs de calidad — docs/spec/01_DATA_MODEL.md §8 (paridad backend 03_API_CONTRACT §C.4). */

export type AgentQualityStatsDto = {
  agentId: string;
  agentName: string;
  departmentId: string | null;
  casesCompleted: number;
  closedWithAgentMessages: number;
  analyzedCount: number;
  pendingCount: number;
  failedCount: number;
  avgCordialityScore: number | null;
  criticalReviewCount: number;
  avgFirstHumanReplyMs: number | null;
};

export type QualityFindingSeverity = "low" | "medium" | "high";
export type QualityFindingCategory =
  | "aggression"
  | "disrespect"
  | "neglect"
  | "misinformation"
  | "inefficiency"
  | "other";

export type QualityFindingDto = {
  id: string;
  messageId: string;
  severity: QualityFindingSeverity;
  category: QualityFindingCategory;
  excerpt: string;
  rationale: string;
};

export type QualityCoachingNoteDto = {
  id: string;
  reviewId: string;
  authorAgentId: string;
  body: string;
  ackStatus: "open" | "acknowledged";
  acknowledgedAt: string | null;
  createdAt: string;
};

export type QualityReviewStatus = "pending" | "ready" | "failed" | "reviewed";
export type QualityReviewTrigger = "auto_case_closed" | "on_demand";

export type QualityReviewDto = {
  id: string;
  conversationId: string;
  caseId: string;
  agentId: string;
  departmentId: string | null;
  cordialityScore: number | null;
  efficiencyNotes: string | null;
  summary: string | null;
  errorMessage: string | null;
  status: QualityReviewStatus;
  trigger: QualityReviewTrigger;
  customerLabel: string;
  waPhone: string;
  waProfileName: string | null;
  highFindingCount: number;
  findingCount: number;
  findings: QualityFindingDto[];
  notes: QualityCoachingNoteDto[];
  messagesTotal: number;
  messagesAnalyzed: number;
  chunkSize: number;
  startedAt: string | null;
  createdAt: string;
  completedAt: string | null;
};

/** Semáforo de cordialidad (07_QUALITY_SUPERVISION.md §4). */
export type CordialityBand = "ok" | "attention" | "critical" | null;

export function cordialityBand(score: number | null | undefined): CordialityBand {
  if (score === null || score === undefined || Number.isNaN(score)) return null;
  if (score >= 70) return "ok";
  if (score >= 40) return "attention";
  return "critical";
}

export function cordialityBandLabel(band: CordialityBand): string {
  if (band === "ok") return "Cordial";
  if (band === "attention") return "Revisar";
  if (band === "critical") return "Crítico";
  return "Sin score";
}

/** Chats cerrados con mensajes de agente que aún no tienen score (ready/reviewed). */
export function unprocessedChatCount(stats: {
  closedWithAgentMessages: number;
  analyzedCount: number;
}): number {
  return Math.max(0, stats.closedWithAgentMessages - stats.analyzedCount);
}

/** Etiqueta de progreso de mensajes por conversación/caso. */
export function messageAnalysisProgressLabel(review: {
  messagesAnalyzed: number;
  messagesTotal: number;
  status: QualityReviewStatus;
}): string {
  const total = review.messagesTotal;
  const done = review.messagesAnalyzed;
  if (total <= 0 && review.status === "pending") return "— msgs";
  if (total <= 0) return "0/0 msgs";
  return `${done}/${total} msgs`;
}

export function isMessageAnalysisComplete(review: {
  messagesAnalyzed: number;
  messagesTotal: number;
  status: QualityReviewStatus;
}): boolean {
  if (review.status === "ready" || review.status === "reviewed") return true;
  return review.messagesTotal > 0 && review.messagesAnalyzed >= review.messagesTotal;
}

/** Clases Tailwind alineadas al design system (danger/warning/primary/muted). */
export function cordialityBandClass(band: CordialityBand): string {
  if (band === "ok") return "bg-primary/10 text-primary ring-primary/30";
  if (band === "attention") return "bg-warning/10 text-warning ring-warning/30";
  if (band === "critical") return "bg-danger/10 text-danger ring-danger/30";
  return "bg-foreground/5 text-muted-foreground ring-border";
}

const REVIEW_STATUS_LABELS: Record<QualityReviewStatus, string> = {
  pending: "Por analizar",
  ready: "Analizado",
  failed: "Fallido",
  reviewed: "Revisada",
};

export function qualityReviewStatusLabel(
  status: QualityReviewStatus,
  startedAt?: string | null,
  progress?: { messagesAnalyzed: number; messagesTotal: number },
): string {
  if (status === "pending" && progress && progress.messagesTotal > 0) {
    return `Analizando ${progress.messagesAnalyzed}/${progress.messagesTotal}`;
  }
  if (status === "pending" && startedAt) return "Analizando";
  if (status === "pending") return "Por analizar";
  return REVIEW_STATUS_LABELS[status] ?? status;
}

const TRIGGER_LABELS: Record<QualityReviewTrigger, string> = {
  auto_case_closed: "Cierre de caso",
  on_demand: "Bajo demanda",
};

export function qualityReviewTriggerLabel(trigger: QualityReviewTrigger): string {
  return TRIGGER_LABELS[trigger] ?? trigger;
}

const FINDING_CATEGORY_LABELS: Record<QualityFindingCategory, string> = {
  aggression: "Agresión",
  disrespect: "Falta de respeto",
  neglect: "Descuido",
  misinformation: "Información incorrecta",
  inefficiency: "Ineficiencia",
  other: "Otro",
};

export function qualityFindingCategoryLabel(category: QualityFindingCategory): string {
  return FINDING_CATEGORY_LABELS[category] ?? category;
}

const FINDING_SEVERITY_LABELS: Record<QualityFindingSeverity, string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
};

export function qualityFindingSeverityLabel(severity: QualityFindingSeverity): string {
  return FINDING_SEVERITY_LABELS[severity] ?? severity;
}

/**
 * Solo mensajes con hallazgo ALTA: fondo rojo sólido (legible).
 * Media/baja: sin marco — el bubble verde del agente se queda verde.
 */
export function findingHighlightClass(severity: QualityFindingSeverity): string {
  if (severity === "high") {
    return "!bg-red-600 !text-white shadow-md ring-0 border-0";
  }
  return "";
}

/** ¿Remarcar el bubble? Solo mala atención grave (high). */
export function shouldHighlightFinding(severity: QualityFindingSeverity | null): boolean {
  return severity === "high";
}

/** Severidad más grave de los findings que apuntan a un messageId, o null. */
export function findingSeverityForMessage(
  findings: QualityFindingDto[],
  messageId: string,
): QualityFindingSeverity | null {
  const matched = findings.filter((f) => f.messageId === messageId);
  if (matched.length === 0) return null;
  if (matched.some((f) => f.severity === "high")) return "high";
  if (matched.some((f) => f.severity === "medium")) return "medium";
  return "low";
}

export function highFindingCount(
  review: Pick<QualityReviewDto, "findings" | "highFindingCount">,
): number {
  if (typeof review.highFindingCount === "number" && review.highFindingCount > 0) {
    return review.highFindingCount;
  }
  return review.findings.filter((f) => f.severity === "high").length;
}

/** Deep-link a chat interno desde detalle de calidad (07 §5). */
export function buildQualityChatDeepLink(agentId: string, reviewId: string): {
  to: "/chat-interno";
  search: { peerId: string; qualityReviewId: string };
} {
  return {
    to: "/chat-interno",
    search: { peerId: agentId, qualityReviewId: reviewId },
  };
}

export function formatFirstReplyMs(ms: number | null | undefined): string {
  if (ms === null || ms === undefined || Number.isNaN(ms)) return "—";
  if (ms < 60_000) return `${Math.max(1, Math.round(ms / 1000))}s`;
  const minutes = Math.round(ms / 60_000);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  return `${hours} h`;
}

export function defaultQualityDateRange(days = 30): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  return { from: from.toISOString(), to: to.toISOString() };
}

/** Normaliza un review de lista (backend puede omitir findings/notes/summary). */
export function normalizeQualityReview(raw: Partial<QualityReviewDto> & { id: string }): QualityReviewDto {
  const findings = raw.findings ?? [];
  const highFromFindings = findings.filter((f) => f.severity === "high").length;
  return {
    id: raw.id,
    conversationId: raw.conversationId ?? "",
    caseId: raw.caseId ?? "",
    agentId: raw.agentId ?? "",
    departmentId: raw.departmentId ?? null,
    cordialityScore: raw.cordialityScore ?? null,
    efficiencyNotes: raw.efficiencyNotes ?? null,
    summary: raw.summary ?? null,
    errorMessage: raw.errorMessage ?? null,
    status: raw.status ?? "pending",
    trigger: raw.trigger ?? "auto_case_closed",
    customerLabel: raw.customerLabel ?? raw.waPhone ?? "Cliente",
    waPhone: raw.waPhone ?? "",
    waProfileName: raw.waProfileName ?? null,
    highFindingCount: raw.highFindingCount ?? highFromFindings,
    findingCount: raw.findingCount ?? findings.length,
    findings,
    notes: raw.notes ?? [],
    messagesTotal: raw.messagesTotal ?? 0,
    messagesAnalyzed: raw.messagesAnalyzed ?? 0,
    chunkSize: raw.chunkSize ?? 40,
    startedAt: raw.startedAt ?? null,
    createdAt: raw.createdAt ?? new Date(0).toISOString(),
    completedAt: raw.completedAt ?? null,
  };
}

export function normalizeAgentStats(
  raw: Partial<AgentQualityStatsDto> & { agentId: string },
): AgentQualityStatsDto {
  return {
    agentId: raw.agentId,
    agentName: raw.agentName ?? "Agente",
    departmentId: raw.departmentId ?? null,
    casesCompleted: raw.casesCompleted ?? 0,
    closedWithAgentMessages: raw.closedWithAgentMessages ?? 0,
    analyzedCount: raw.analyzedCount ?? 0,
    pendingCount: raw.pendingCount ?? 0,
    failedCount: raw.failedCount ?? 0,
    avgCordialityScore: raw.avgCordialityScore ?? null,
    criticalReviewCount: raw.criticalReviewCount ?? 0,
    avgFirstHumanReplyMs: raw.avgFirstHumanReplyMs ?? null,
  };
}
