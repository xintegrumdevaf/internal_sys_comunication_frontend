import { useState } from "react";
import { AlertCircle, BarChart3, Users } from "lucide-react";
import { useAnalyticsDashboard } from "../application/use-analytics";
import { type AnalyticsFilterParams, calculatePresetDates } from "../domain/analytics.types";
import { AnalyticsFilterBar } from "./AnalyticsFilterBar";
import { MacroKpiCards } from "./MacroKpiCards";
import { AgentPerformanceTable } from "./AgentPerformanceTable";
import { HourlyDemandChart } from "./HourlyDemandChart";
import { BurnRateTrendChart } from "./BurnRateTrendChart";
import { ResolutionFunnelChart } from "./ResolutionFunnelChart";
import { RootCausesChart } from "./RootCausesChart";
import { FcrQualityCard } from "./FcrQualityCard";

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
    isLoading,
    isError,
    refetchAll,
  } = useAnalyticsDashboard(filters);

  return (
    <div className="space-y-6 animate-fade-up">
      {/* 1. Header y Filtros Globales de Fecha y Área */}
      <AnalyticsFilterBar
        filters={filters}
        onFilterChange={setFilters}
        onRefresh={() => void refetchAll()}
        isRefreshing={isLoading}
      />

      {/* Mensaje de Error si falla la API */}
      {isError && (
        <div className="p-4 rounded-2xl border border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-between gap-4">
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
            className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold uppercase tracking-wider hover:bg-rose-700 transition-colors shadow-xs shrink-0 cursor-pointer"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* 2. Tarjetas Macro KPIs de Alto Nivel */}
      <section className="space-y-2.5">
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <BarChart3 className="size-3.5 text-primary" /> Indicadores Clave de Desempeño (KPIs)
        </h3>
        <MacroKpiCards overview={overviewQuery.data} isLoading={overviewQuery.isLoading} />
      </section>

      {/* 3. Embudo de Atención y Eficiencia Operativa */}
      <section className="space-y-2.5">
        <ResolutionFunnelChart
          overview={overviewQuery.data}
          aiEfficiency={aiEfficiencyQuery.data}
          isLoading={overviewQuery.isLoading || aiEfficiencyQuery.isLoading}
        />
      </section>

      {/* 4. Gráficas de Tráfico y Ritmo de Atención: Curva Horaria + Quemado de Casos */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HourlyDemandChart
          hourlyDemand={distributionQuery.data?.hourlyDemand}
          isLoading={distributionQuery.isLoading}
        />
        <BurnRateTrendChart
          dailyTrend={distributionQuery.data?.dailyTrend}
          isLoading={distributionQuery.isLoading}
        />
      </section>

      {/* 5. Gráficas de Calidad y Causa Raíz: Motivos de Consulta + Resolución en Primer Contacto */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RootCausesChart
          distribution={distributionQuery.data}
          isLoading={distributionQuery.isLoading}
        />
        <FcrQualityCard
          agentsPerformance={agentsPerformanceQuery.data ?? []}
          overview={overviewQuery.data}
          isLoading={agentsPerformanceQuery.isLoading || overviewQuery.isLoading}
        />
      </section>

      {/* 6. Tabla Paginada de Rendimiento de Asesores */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Users className="size-3.5 text-primary" /> Rendimiento y Productividad Individual del
            Equipo
          </h3>
        </div>
        <AgentPerformanceTable
          agents={agentsPerformanceQuery.data ?? []}
          isLoading={agentsPerformanceQuery.isLoading}
        />
      </section>
    </div>
  );
}
