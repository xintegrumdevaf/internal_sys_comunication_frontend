import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Sparkles, ArrowRight, Inbox, TrendingUp } from "lucide-react";
import { useSession, useDepartmentsQuery } from "@/modules/identity/application/use-session";
import { getDashboard } from "@/modules/dashboard/infrastructure/dashboard.gateway";
import { listConversations } from "@/modules/conversations/infrastructure/conversation.gateway";
import type { DashboardDto } from "@/modules/dashboard/domain/dashboard";
import type { ConversationDto } from "@/modules/conversations/domain/conversation";
import {
  useAnalyticsOverview,
  useAgentsPerformance,
} from "@/modules/analytics/application/use-analytics";
import { calculatePresetDates } from "@/modules/analytics/domain/analytics.types";
import { OperationalKpiPulse } from "./OperationalKpiPulse";
import { DepartmentSaturationGrid } from "./DepartmentSaturationGrid";
import { AgentWorkloadMonitor, type FilterStatus } from "./AgentWorkloadMonitor";
import { AgentShiftView } from "./AgentShiftView";

export type DashboardFilters = {
  agentStatus?: FilterStatus;
  agentSearch?: string;
  deptOperational?: boolean;
  page?: number;
  pageSize?: number;
};

interface DashboardOverviewProps {
  initialFilters?: DashboardFilters;
}

export function DashboardOverview({ initialFilters }: DashboardOverviewProps) {
  const navigate = useNavigate();
  const session = useSession();
  const isAdminOrSupervisor = session?.role === "admin" || session?.role === "manager";

  // Preset temporal de HOY para el pulso operativo en vivo
  const todayFilter = useMemo(() => calculatePresetDates("today"), []);

  // Queries analíticas en tiempo real
  const overviewQuery = useAnalyticsOverview(todayFilter);
  const agentsPerformanceQuery = useAgentsPerformance(todayFilter);
  const { data: departments = [], isLoading: isLoadingDepts } = useDepartmentsQuery();

  // Estados locales para métricas rápidas de bandeja
  const [dashboard, setDashboard] = useState<DashboardDto | null>(null);
  const [conversations, setConversations] = useState<ConversationDto[]>([]);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  useEffect(() => {
    if (!session?.id) return;
    setLoadingDashboard(true);
    Promise.all([
      getDashboard(session.id).then(setDashboard),
      listConversations({
        status: "open",
        userId: isAdminOrSupervisor ? undefined : session.id,
      }).then(setConversations),
    ])
      .catch((err) => console.error("Error cargando cockpit operativo:", err))
      .finally(() => setLoadingDashboard(false));
  }, [session?.id, isAdminOrSupervisor]);

  const overview = overviewQuery.data;
  const agentsPerformance = useMemo(
    () => agentsPerformanceQuery.data ?? [],
    [agentsPerformanceQuery.data],
  );

  // Cálculos de capacidad y ocupación en vivo para administradores/jefes
  const { totalClosedToday, totalCapacityInShift, totalActiveNow, unassignedQueueCount } =
    useMemo(() => {
      const closed =
        overview?.completedCases ??
        agentsPerformance.reduce((acc, a) => acc + (a.casesCompleted || 0), 0);
      const inShift = agentsPerformance.filter((a) => a.autoAssignEnabled);
      const capacity = inShift.reduce((acc, a) => acc + (a.maxCapacityThreshold || 6), 0);

      // Fuente de verdad sincronizada con la bandeja en vivo (OperationalInbox)
      const active =
        conversations.length > 0
          ? conversations.length
          : (overview?.activeCases ?? dashboard?.openConversations ?? 0);

      const unassigned =
        conversations.length > 0
          ? conversations.filter((c) => !c.activeCase?.assignedAgentId).length
          : (dashboard?.unassignedQueue ?? overview?.unassignedCases ?? 0);

      return {
        totalClosedToday: closed,
        totalCapacityInShift: capacity,
        totalActiveNow: active,
        unassignedQueueCount: unassigned,
      };
    }, [
      agentsPerformance,
      conversations,
      overview?.completedCases,
      overview?.activeCases,
      overview?.unassignedCases,
      dashboard?.openConversations,
      dashboard?.unassignedQueue,
    ]);

  // Manejo de atajos con sincronización a la URL (se conserva al recargar con F5)
  const handleFilterSaturated = () => {
    void navigate({
      to: "/",
      search: (prev) => ({
        ...prev,
        agentStatus: "saturated",
        page: 1,
      }),
      replace: true,
    });
  };

  const handleToggleOperational = (value: boolean) => {
    void navigate({
      to: "/",
      search: (prev) => ({
        ...prev,
        deptOperational: value,
      }),
      replace: true,
    });
  };

  const handleAgentFiltersChange = (filters: {
    status?: FilterStatus;
    search?: string;
    page?: number;
    pageSize?: number;
  }) => {
    void navigate({
      to: "/",
      search: (prev) => ({
        ...prev,
        agentStatus: filters.status === "all" ? undefined : filters.status,
        agentSearch: filters.search || undefined,
        page: filters.page && filters.page > 1 ? filters.page : undefined,
        pageSize: filters.pageSize && filters.pageSize !== 6 ? filters.pageSize : undefined,
      }),
      replace: true,
    });
  };

  // Si no hay sesión cargada aún, mostrar skeleton rápido
  if (!session) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-card rounded-2xl border border-border" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-card rounded-2xl border border-border" />
          ))}
        </div>
      </div>
    );
  }

  // Vista para Asesores Operativos
  if (!isAdminOrSupervisor) {
    const myPerf = agentsPerformance.find((a) => a.agentId === session.id);
    return (
      <div className="animate-fade-up">
        <AgentShiftView
          session={session}
          dashboard={dashboard}
          myPerformance={myPerf}
          conversations={conversations}
          isLoading={loadingDashboard || agentsPerformanceQuery.isLoading}
        />
      </div>
    );
  }

  // Vista para Administradores y Supervisores (Centro de Mando Operativo)
  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header del Centro de Operaciones */}
      <section className="p-4 sm:p-5 rounded-2xl border border-border bg-card shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-2xl bg-primary/10 text-primary grid place-items-center shrink-0 shadow-xs ring-1 ring-primary/20">
            <Sparkles className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-extrabold text-foreground tracking-tight">
                Centro de Mando Operativo
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-extrabold uppercase">
                {session.role === "admin" ? "Administrador" : "Jefe de Área"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Monitoreo del turno en tiempo real con atajos directos a colas, bandejas y filtros
              persistentes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/analytics"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-background hover:bg-muted text-foreground text-xs font-semibold transition-all shadow-xs"
          >
            <TrendingUp className="size-3.5 text-primary" />
            <span>Analíticas Detalladas</span>
          </Link>
          <Link
            to="/bandeja"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-all shadow-xs"
          >
            <Inbox className="size-3.5" />
            <span>Ir a Bandeja</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </section>

      {/* Módulo 1: Pulso Operativo del Día (Macro-KPIs de Decisión con Atajos) */}
      <OperationalKpiPulse
        overview={overview}
        totalClosedToday={totalClosedToday}
        totalActiveNow={totalActiveNow}
        totalCapacityInShift={totalCapacityInShift}
        unassignedQueueCount={unassignedQueueCount}
        avgWaitSeconds={overview?.avgQueueWaitTimeSeconds}
        isLoading={overviewQuery.isLoading || agentsPerformanceQuery.isLoading}
        onFilterSaturated={handleFilterSaturated}
      />

      {/* Módulo 2: Semáforo de Saturación por Departamento (con Atajos a Bandejas) */}
      <DepartmentSaturationGrid
        departments={departments}
        agentsPerformance={agentsPerformance}
        conversations={conversations}
        departmentBreakdown={dashboard?.departmentBreakdown}
        isLoading={isLoadingDepts || agentsPerformanceQuery.isLoading}
        initialShowOnlyOperational={initialFilters?.deptOperational}
        onToggleOperational={handleToggleOperational}
      />

      {/* Módulo 3: Monitor de Carga Individual de Asesores (con Paginación y Atajos) */}
      <AgentWorkloadMonitor
        agentsPerformance={agentsPerformance}
        departments={departments}
        isLoading={agentsPerformanceQuery.isLoading}
        initialStatusFilter={initialFilters?.agentStatus}
        initialSearch={initialFilters?.agentSearch}
        initialPage={initialFilters?.page}
        initialPageSize={initialFilters?.pageSize}
        onFilterChange={handleAgentFiltersChange}
      />
    </div>
  );
}
