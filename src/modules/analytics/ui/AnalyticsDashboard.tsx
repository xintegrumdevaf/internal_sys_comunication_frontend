import { useState } from "react";
import { AlertCircle, BarChart3, RefreshCw } from "lucide-react";
import { useAnalyticsDashboard } from "../application/use-analytics";
import type { AnalyticsFilterParams } from "../domain/analytics.types";
import { calculatePresetDates } from "../domain/analytics.types";
import { AnalyticsFilterBar } from "./AnalyticsFilterBar";
import { InfrastructureAlertBanner } from "./InfrastructureAlertBanner";
import { MacroKpiCards } from "./MacroKpiCards";
import { AgentPerformanceTable } from "./AgentPerformanceTable";
import { AiEfficiencySection } from "./AiEfficiencySection";

export function AnalyticsDashboard() {
  // Inicializamos con el rango de los últimos 30 días por defecto
  const [filters, setFilters] = useState<AnalyticsFilterParams>(() => {
    const { from, to } = calculatePresetDates("30d");
    return { from, to };
  });

  const {
    overviewQuery,
    distributionQuery,
    aiEfficiencyQuery,
    agentsPerformanceQuery,
    alertsQuery,
    isLoading,
    isError,
    refetchAll,
  } = useAnalyticsDashboard(filters);

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header y Filtros Globales */}
      <AnalyticsFilterBar
        filters={filters}
        onFilterChange={setFilters}
        onRefresh={() => void refetchAll()}
        isRefreshing={isLoading}
      />

      {/* Banner de Incidentes Críticos de Infraestructura (Mass Outage) */}
      {alertsQuery.data && <InfrastructureAlertBanner alerts={alertsQuery.data} />}

      {/* Mensaje de Error si falla la API */}
      {isError && (
        <div className="p-4 rounded-2xl border border-danger/40 bg-danger/10 text-danger flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="size-5 shrink-0" />
            <p className="text-xs font-semibold">
              Ocurrió un problema al cargar algunas métricas analíticas. Verifica tu conexión con el
              servidor.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void refetchAll()}
            className="px-3 py-1.5 rounded-lg bg-danger text-white text-xs font-bold uppercase tracking-wider hover:bg-danger/90 transition-colors shadow-xs shrink-0 cursor-pointer"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Tarjetas Macro KPIs */}
      <section className="space-y-2.5">
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <BarChart3 className="size-3.5 text-primary" /> Indicadores Clave de Desempeño (KPIs)
        </h3>
        <MacroKpiCards overview={overviewQuery.data} isLoading={overviewQuery.isLoading} />
      </section>

      {/* Distribución y Eficiencia de IA */}
      <section className="space-y-2.5">
        <AiEfficiencySection
          distribution={distributionQuery.data}
          aiEfficiency={aiEfficiencyQuery.data}
          isLoading={distributionQuery.isLoading || aiEfficiencyQuery.isLoading}
        />
      </section>

      {/* Tabla de Rendimiento de Agentes */}
      <section className="space-y-2.5">
        <AgentPerformanceTable
          agents={agentsPerformanceQuery.data ?? []}
          isLoading={agentsPerformanceQuery.isLoading}
        />
      </section>
    </div>
  );
}
