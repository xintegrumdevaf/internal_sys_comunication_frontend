/**
 * DTOs y tipos del módulo de analíticas (isp-customer-service-api).
 * Contrato especificado en docs/spec/03_API_CONTRACT.md.
 */

export type AnalyticsOverviewDto = {
  totalCases: number;
  activeCases: number;
  completedCases: number;
  botContainmentRate: number;
  avgResolutionTimeMinutes: number | null;
  avgQueueWaitTimeSeconds: number | null;
  escalationRate: number;
};

export type CasesDistributionDto = {
  totalCases: number;
  byWorkflow: Array<{ workflowType: string; count: number; percentage: number }>;
  byFinalStatus: Array<{ status: string; count: number; percentage: number }>;
  topEscalationReasons: Array<{ reason: string; count: number; percentage: number }>;
};

export type AIEfficiencyDto = {
  overallContainmentRate: number;
  botCompletedCases: number;
  humanEscalatedCases: number;
  funnelDropOff: Array<{
    workflowType: string;
    state: string;
    dropOffCount: number;
    percentage: number;
  }>;
  unclearTriageCount: number;
};

export type AgentPerformanceDto = {
  agentId: string;
  agentName: string;
  primaryDepartmentId: string | null;
  primaryDepartmentName: string | null;
  role: "agent" | "manager" | "admin";
  autoAssignEnabled: boolean;
  activeCasesNow: number;
  maxCapacityThreshold: number;
  casesAssigned: number;
  casesCompleted: number;
  casesTransferred: number;
  avgFirstResponseTimeMs: number | null;
  avgHandlingTimeMinutes: number | null;
  fcrRatePercentage: number | null;
  avgCordialityScore: number | null;
  criticalAlertsCount: number;
  openCoachingNotesCount: number;
};

export type InfrastructureAlertDto = {
  sector: string;
  oltName: string | null;
  activeCasesCount: number;
  isHighVolumeAlert: boolean;
};

export type AnalyticsFilterParams = {
  from?: string;
  to?: string;
  departmentId?: string;
};

export type DateRangePreset = "today" | "7d" | "30d" | "custom";

/**
 * Calcula fechas de inicio y fin para los presets rápidos
 */
export function calculatePresetDates(preset: DateRangePreset): { from?: string; to?: string } {
  const now = new Date();
  const to = now.toISOString();

  if (preset === "today") {
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    return { from: startOfToday.toISOString(), to };
  }

  if (preset === "7d") {
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return { from: sevenDaysAgo.toISOString(), to };
  }

  if (preset === "30d") {
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return { from: thirtyDaysAgo.toISOString(), to };
  }

  return {};
}
