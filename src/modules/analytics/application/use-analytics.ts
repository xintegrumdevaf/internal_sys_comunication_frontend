import { useQuery, useQueryClient } from "@tanstack/react-query";
import { analyticsApi } from "../infrastructure/analytics.api";
import type { AnalyticsFilterParams } from "../domain/analytics.types";

export const ANALYTICS_QUERY_KEYS = {
  all: ["analytics"] as const,
  overview: (params: AnalyticsFilterParams) => ["analytics", "overview", params] as const,
  distribution: (params: AnalyticsFilterParams) =>
    ["analytics", "cases-distribution", params] as const,
  aiEfficiency: (params: AnalyticsFilterParams) => ["analytics", "ai-efficiency", params] as const,
  agentsPerformance: (params: AnalyticsFilterParams) =>
    ["analytics", "agents-performance", params] as const,
  infrastructureAlerts: (params: AnalyticsFilterParams) =>
    ["analytics", "infrastructure-alerts", params] as const,
};

export function useAnalyticsOverview(params: AnalyticsFilterParams) {
  return useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.overview(params),
    queryFn: () => analyticsApi.getOverview(params),
    staleTime: 30_000,
    refetchInterval: 45_000,
  });
}

export function useCasesDistribution(params: AnalyticsFilterParams) {
  return useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.distribution(params),
    queryFn: () => analyticsApi.getCasesDistribution(params),
    staleTime: 30_000,
    refetchInterval: 45_000,
  });
}

export function useAIEfficiency(params: AnalyticsFilterParams) {
  return useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.aiEfficiency(params),
    queryFn: () => analyticsApi.getAIEfficiency(params),
    staleTime: 30_000,
    refetchInterval: 45_000,
  });
}

export function useAgentsPerformance(params: AnalyticsFilterParams) {
  return useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.agentsPerformance(params),
    queryFn: () => analyticsApi.getAgentsPerformance(params),
    staleTime: 20_000,
    refetchInterval: 30_000,
  });
}

export function useInfrastructureAlerts(params: AnalyticsFilterParams) {
  return useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.infrastructureAlerts(params),
    queryFn: () => analyticsApi.getInfrastructureAlerts(params),
    staleTime: 15_000,
    refetchInterval: 20_000,
  });
}

export function useAnalyticsDashboard(params: AnalyticsFilterParams) {
  const queryClient = useQueryClient();

  const overviewQuery = useAnalyticsOverview(params);
  const distributionQuery = useCasesDistribution(params);
  const aiEfficiencyQuery = useAIEfficiency(params);
  const agentsPerformanceQuery = useAgentsPerformance(params);
  const alertsQuery = useInfrastructureAlerts(params);

  const isLoading =
    overviewQuery.isLoading ||
    distributionQuery.isLoading ||
    aiEfficiencyQuery.isLoading ||
    agentsPerformanceQuery.isLoading ||
    alertsQuery.isLoading;

  const isError =
    overviewQuery.isError ||
    distributionQuery.isError ||
    aiEfficiencyQuery.isError ||
    agentsPerformanceQuery.isError ||
    alertsQuery.isError;

  const refetchAll = async () => {
    await Promise.all([
      overviewQuery.refetch(),
      distributionQuery.refetch(),
      aiEfficiencyQuery.refetch(),
      agentsPerformanceQuery.refetch(),
      alertsQuery.refetch(),
    ]);
  };

  return {
    overviewQuery,
    distributionQuery,
    aiEfficiencyQuery,
    agentsPerformanceQuery,
    alertsQuery,
    isLoading,
    isError,
    refetchAll,
  };
}
