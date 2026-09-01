import { apiGet } from "@/shared/http/http-client";
import type {
  AgentPerformanceDto,
  AIEfficiencyDto,
  AnalyticsFilterParams,
  AnalyticsOverviewDto,
  CasesDistributionDto,
  InfrastructureAlertDto,
} from "../domain/analytics.types";

/**
 * Cliente de API tipado para el módulo de analíticas operativas y gerenciales.
 * Consume los 5 endpoints documentados en docs/spec/03_API_CONTRACT.md.
 */
export const analyticsApi = {
  getOverview: (params?: AnalyticsFilterParams) =>
    apiGet<AnalyticsOverviewDto>("/api/analytics/overview", {
      query: params as Record<string, string | undefined>,
    }),

  getCasesDistribution: (params?: AnalyticsFilterParams) =>
    apiGet<CasesDistributionDto>("/api/analytics/cases-distribution", {
      query: params as Record<string, string | undefined>,
    }),

  getAIEfficiency: (params?: AnalyticsFilterParams) =>
    apiGet<AIEfficiencyDto>("/api/analytics/ai-efficiency", {
      query: params as Record<string, string | undefined>,
    }),

  getAgentsPerformance: (params?: AnalyticsFilterParams) =>
    apiGet<AgentPerformanceDto[]>("/api/analytics/agents-performance", {
      query: params as Record<string, string | undefined>,
    }),

  getInfrastructureAlerts: (params?: AnalyticsFilterParams) =>
    apiGet<InfrastructureAlertDto[]>("/api/analytics/infrastructure-alerts", {
      query: params as Record<string, string | undefined>,
    }),
};
