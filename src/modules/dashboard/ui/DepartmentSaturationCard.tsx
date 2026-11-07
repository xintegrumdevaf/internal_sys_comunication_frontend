import React from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, ChevronRight, CheckCircle2, Timer, Users } from "lucide-react";
import type { DepartmentDto } from "@/modules/identity/domain/department";
import type { AgentPerformanceDto } from "@/modules/analytics/domain/analytics.types";
import { CircularGauge } from "./CircularGauge";

export interface DepartmentMetricItem {
  dept: DepartmentDto;
  deptAgents: AgentPerformanceDto[];
  onShiftCount: number;
  maxCapacityPerAgent: number;
  totalDeptCapacity: number;
  activeHandled: number;
  queueCount: number;
  closedToday: number;
  occupancyPct: number;
  isOverloaded: boolean;
  isModerate: boolean;
  gaugeColor: string;
}

interface DepartmentSaturationCardProps {
  item: DepartmentMetricItem;
}

export const DepartmentSaturationCard: React.FC<DepartmentSaturationCardProps> = ({ item }) => {
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
              <span className="text-xs font-extrabold font-mono mt-0.5">{queueCount}</span>
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
            <span className="text-xs font-extrabold font-mono mt-0.5">{closedToday}</span>
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
            <span className="text-[10px] text-muted-foreground font-mono">Sin cola pendiente</span>
          )}
        </div>
      </div>
    </div>
  );
};
