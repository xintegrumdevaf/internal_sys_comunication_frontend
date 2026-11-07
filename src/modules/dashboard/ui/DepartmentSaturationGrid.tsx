import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2,
  ChevronRight,
  Timer,
  Users,
  CheckCircle2,
  AlertTriangle,
  Filter,
  ArrowUpRight,
} from "lucide-react";
import type { DepartmentDto } from "@/modules/identity/domain/department";
import type { AgentPerformanceDto } from "@/modules/analytics/domain/analytics.types";
import type { ConversationDto } from "@/modules/conversations/domain/conversation";
import type { DepartmentBreakdownItem } from "@/modules/dashboard/domain/dashboard";
import { CircularGauge } from "./CircularGauge";

interface DepartmentSaturationGridProps {
  departments: DepartmentDto[];
  agentsPerformance: AgentPerformanceDto[];
  conversations?: ConversationDto[];
  departmentBreakdown?: DepartmentBreakdownItem[];
  isLoading?: boolean;
  initialShowOnlyOperational?: boolean;
  onToggleOperational?: (value: boolean) => void;
}

const STORAGE_KEY_OPERATIONAL = "dashboard_dept_show_operational";

export function DepartmentSaturationGrid({
  departments,
  agentsPerformance,
  conversations,
  departmentBreakdown = [],
  isLoading,
  initialShowOnlyOperational,
  onToggleOperational,
}: DepartmentSaturationGridProps) {
  // Persistencia de vista de áreas: URL param > localStorage > default true
  const [showOnlyOperational, setShowOnlyOperational] = useState<boolean>(() => {
    if (initialShowOnlyOperational !== undefined) return initialShowOnlyOperational;
    const saved = localStorage.getItem(STORAGE_KEY_OPERATIONAL);
    return saved !== null ? saved === "true" : true;
  });

  const handleToggle = () => {
    const nextVal = !showOnlyOperational;
    setShowOnlyOperational(nextVal);
    localStorage.setItem(STORAGE_KEY_OPERATIONAL, String(nextVal));
    onToggleOperational?.(nextVal);
  };

  useEffect(() => {
    if (
      initialShowOnlyOperational !== undefined &&
      initialShowOnlyOperational !== showOnlyOperational
    ) {
      setShowOnlyOperational(initialShowOnlyOperational);
    }
  }, [initialShowOnlyOperational, showOnlyOperational]);

  const deptMetrics = useMemo(() => {
    return departments.map((dept) => {
      const deptAgents = agentsPerformance.filter((a) => a.primaryDepartmentId === dept.id);
      const onShiftCount = deptAgents.filter((a) => a.autoAssignEnabled).length;
      const maxCapacityPerAgent = dept.maxConcurrentCases || 6;
      const totalDeptCapacity = onShiftCount * maxCapacityPerAgent;

      // Cálculo de cola y casos activos sincronizado con la bandeja en tiempo real
      let queueCount = 0;
      let activeHandled = 0;

      if (conversations && conversations.length > 0) {
        // Fuente primaria: conversaciones abiertas reales en memoria (mismo cálculo que la bandeja)
        const deptOpen = conversations.filter((c) => c.activeCase?.departmentId === dept.id);
        queueCount = deptOpen.filter((c) => !c.activeCase?.assignedAgentId).length;
        activeHandled = deptOpen.filter((c) => Boolean(c.activeCase?.assignedAgentId)).length;
      } else {
        // Fallback al breakdown del backend
        const queueItem = departmentBreakdown.find((d) => d.departmentId === dept.id);
        const handledByAgents = deptAgents.reduce((acc, a) => acc + (a.activeCasesNow || 0), 0);
        queueCount =
          queueItem?.queueCases ??
          (queueItem?.activeCases ? Math.max(0, queueItem.activeCases - handledByAgents) : 0);
        activeHandled = queueItem?.handledCases ?? handledByAgents;
      }

      const closedToday = deptAgents.reduce((acc, a) => acc + (a.casesCompleted || 0), 0);

      const occupancyPct =
        totalDeptCapacity > 0
          ? Math.min(Math.round((activeHandled / totalDeptCapacity) * 100), 100)
          : activeHandled > 0
            ? 100
            : 0;

      const isNoStaff = totalDeptCapacity === 0 && deptAgents.length === 0;
      const isOverloaded = occupancyPct >= 85 || (totalDeptCapacity === 0 && activeHandled > 0);
      const isModerate = occupancyPct >= 60 && occupancyPct < 85;

      let gaugeColor = "#10b981"; // emerald
      if (isOverloaded)
        gaugeColor = "#f43f5e"; // rose
      else if (isModerate) gaugeColor = "#f59e0b"; // amber

      return {
        dept,
        deptAgents,
        onShiftCount,
        maxCapacityPerAgent,
        totalDeptCapacity,
        activeHandled,
        queueCount,
        closedToday,
        occupancyPct,
        isNoStaff,
        isOverloaded,
        isModerate,
        gaugeColor,
      };
    });
  }, [departments, agentsPerformance, departmentBreakdown, conversations]);

  const displayedDepts = useMemo(() => {
    if (!showOnlyOperational) return deptMetrics;
    return deptMetrics.filter(
      (d) => d.deptAgents.length > 0 || d.activeHandled > 0 || d.queueCount > 0,
    );
  }, [deptMetrics, showOnlyOperational]);

  const congestedCount = deptMetrics.filter((d) => d.isOverloaded).length;
  const totalQueue = deptMetrics.reduce((acc, d) => acc + d.queueCount, 0);

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-5 shadow-xs animate-pulse">
        <div className="h-6 w-48 bg-muted rounded-md mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-36 bg-muted/50 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs">
      {/* Cabecera con título, métricas de congestión y toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-border pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-foreground flex items-center gap-2">
              <Building2 className="size-4 text-primary" /> Semáforo de Saturación por Departamento
            </h3>
            {congestedCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 animate-pulse flex items-center gap-1">
                <AlertTriangle className="size-3" />
                {congestedCount} área(s) en congestión
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Balance de carga por área con atajos directos a las colas y bandejas operativas.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleToggle}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
              showOnlyOperational
                ? "bg-primary/10 border-primary/30 text-primary"
                : "bg-background border-border text-muted-foreground hover:bg-muted"
            }`}
            title="Alternar entre áreas operativas y todas las áreas (se conserva al recargar)"
          >
            <Filter className="size-3" />
            <span>{showOnlyOperational ? "Áreas operativas" : "Todas las áreas"}</span>
          </button>

          <Link
            to="/bandeja"
            search={{ tab: "unassigned" }}
            className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
            title="Ver todos los casos en cola de espera"
          >
            <span>Ver colas ({totalQueue})</span>
            <ChevronRight className="size-3.5" />
          </Link>
        </div>
      </div>

      {/* Grilla visual de tarjetas con indicadores circulares y atajos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="p-4 rounded-2xl border border-border/80 bg-card/60 backdrop-blur-xs flex flex-col justify-between space-y-4 animate-pulse shadow-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-32 rounded-md" />
                    <Skeleton className="h-3 w-20 rounded-md" />
                  </div>
                  <Skeleton className="size-14 rounded-full shrink-0" />
                </div>
                <div className="space-y-2 pt-2 border-t border-border/50">
                  <Skeleton className="h-3 w-full rounded-md" />
                  <Skeleton className="h-3 w-4/5 rounded-md" />
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-border/50">
                  <Skeleton className="h-3 w-24 rounded-md" />
                  <Skeleton className="h-3 w-24 rounded-md" />
                </div>
              </div>
            ))
          : displayedDepts.map((item) => {
              const {
                dept,
                deptAgents,
                onShiftCount,
                maxCapacityPerAgent,
                totalDeptCapacity,
                activeHandled,
                queueCount,
                closedToday,
                occupancyPct,
                isOverloaded,
                isModerate,
                gaugeColor,
              } = item;

              return (
                <div
                  key={dept.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between shadow-xs hover:shadow-md ${
                    isOverloaded
                      ? "bg-rose-500/[0.04] border-rose-500/30 hover:border-rose-500/60"
                      : isModerate
                        ? "bg-amber-500/[0.04] border-amber-500/30 hover:border-amber-500/60"
                        : "bg-background/80 border-border hover:border-border/80"
                  }`}
                >
                  <div>
                    {/* Cabecera de la tarjeta: Título con atajo e Indicador Circular */}
                    <div className="flex items-start justify-between gap-3 mb-2.5">
                      <div className="min-w-0 flex-1">
                        <Link
                          to="/bandeja"
                          search={{ departmentId: dept.id }}
                          className="text-sm font-extrabold text-foreground truncate tracking-tight hover:text-primary transition-colors flex items-center gap-1 group"
                          title={`Atajo: Abrir bandeja de ${dept.name}`}
                        >
                          <span className="truncate">{dept.name}</span>
                          <ArrowUpRight className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </Link>
                        <p className="text-[10px] text-muted-foreground uppercase font-mono mt-0.5">
                          {dept.slug} • Cupo: {maxCapacityPerAgent}/asesor
                        </p>
                      </div>

                      <CircularGauge percentage={occupancyPct} color={gaugeColor} />
                    </div>

                    {/* Barra de progreso y estado con atajo */}
                    <div className="space-y-1.5 my-3">
                      <div className="flex justify-between items-center text-xs font-mono">
                        <span
                          className={`font-bold text-[11px] ${
                            isOverloaded
                              ? "text-rose-600 dark:text-rose-400"
                              : isModerate
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {isOverloaded
                            ? totalDeptCapacity === 0
                              ? "Sin asesores en turno"
                              : "Saturado"
                            : isModerate
                              ? "Carga moderada"
                              : "Disponible"}
                        </span>
                        <Link
                          to="/bandeja"
                          search={{ departmentId: dept.id, tab: "open" }}
                          className="text-muted-foreground hover:text-foreground text-[11px] hover:underline"
                          title="Ver casos activos en atención"
                        >
                          {activeHandled} de {totalDeptCapacity} cupos
                        </Link>
                      </div>

                      <div className="w-full bg-muted/60 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out"
                          style={{
                            width: `${occupancyPct}%`,
                            backgroundColor: gaugeColor,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Chips de métricas de negocio con atajos */}
                  <div>
                    <div className="pt-3 border-t border-border/60 grid grid-cols-3 gap-1.5 text-center">
                      {/* Asesores */}
                      <div className="p-1.5 rounded-lg bg-background/50 border border-border/40 flex flex-col items-center">
                        <span className="text-[9px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                          <Users className="size-2.5" /> En turno
                        </span>
                        <span className="text-xs font-extrabold font-mono text-foreground mt-0.5">
                          {onShiftCount}/{deptAgents.length}
                        </span>
                      </div>

                      {/* En cola (Atajo a casos no asignados del área) */}
                      {queueCount > 0 ? (
                        <Link
                          to="/bandeja"
                          search={{ departmentId: dept.id, tab: "unassigned" }}
                          className="p-1.5 rounded-lg border flex flex-col items-center bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer animate-pulse"
                          title={`Atajo: Ver ${queueCount} caso(s) en cola de ${dept.name}`}
                        >
                          <span className="text-[9px] font-bold uppercase flex items-center gap-1">
                            <Timer className="size-2.5" /> En cola
                          </span>
                          <span className="text-xs font-extrabold font-mono mt-0.5">
                            {queueCount}
                          </span>
                        </Link>
                      ) : (
                        <div className="p-1.5 rounded-lg bg-background/50 border border-border/40 text-muted-foreground flex flex-col items-center">
                          <span className="text-[9px] font-bold uppercase flex items-center gap-1">
                            <Timer className="size-2.5" /> En cola
                          </span>
                          <span className="text-xs font-extrabold font-mono mt-0.5">0</span>
                        </div>
                      )}

                      {/* Cerrados hoy (Atajo a casos resueltos del área) */}
                      <Link
                        to="/bandeja"
                        search={{ departmentId: dept.id, tab: "resolved" }}
                        className="p-1.5 rounded-lg bg-background/50 border border-border/40 hover:bg-muted flex flex-col items-center text-emerald-600 dark:text-emerald-400 transition-all cursor-pointer"
                        title={`Casos resueltos por asesores en el turno de hoy: ${closedToday} (clic para ver bandeja)`}
                      >
                        <span className="text-[9px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                          <CheckCircle2 className="size-2.5 text-emerald-500" /> Hoy
                        </span>
                        <span className="text-xs font-extrabold font-mono mt-0.5">
                          {closedToday}
                        </span>
                      </Link>
                    </div>

                    {/* Footer de Acciones Rápidas */}
                    <div className="mt-2.5 pt-2 border-t border-border/40 flex items-center justify-between text-[11px]">
                      <Link
                        to="/bandeja"
                        search={{ departmentId: dept.id }}
                        className="text-muted-foreground hover:text-primary font-medium flex items-center gap-1 transition-colors"
                      >
                        <span>Bandeja del área</span>
                        <ChevronRight className="size-3" />
                      </Link>

                      {queueCount > 0 ? (
                        <Link
                          to="/bandeja"
                          search={{ departmentId: dept.id, tab: "unassigned" }}
                          className="text-rose-600 dark:text-rose-400 hover:underline font-bold font-mono flex items-center gap-1"
                        >
                          <span>Atender cola ({queueCount})</span>
                          <ArrowUpRight className="size-3" />
                        </Link>
                      ) : (
                        <span className="text-[10px] text-muted-foreground font-mono">
                          Sin cola pendiente
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

        {!isLoading && displayedDepts.length === 0 && (
          <div className="col-span-full py-12 text-center text-xs text-muted-foreground">
            No hay áreas operativas activas con los filtros actuales.
          </div>
        )}
      </div>
    </div>
  );
}
