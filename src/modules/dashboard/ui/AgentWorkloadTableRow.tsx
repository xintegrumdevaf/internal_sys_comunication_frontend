import { Link } from "@tanstack/react-router";
import { Clock, AlertTriangle, CheckCircle2, ArrowUpRight } from "lucide-react";
import type { AgentPerformanceDto } from "@/modules/analytics/domain/analytics.types";
import type { DepartmentDto } from "@/modules/identity/domain/department";
import { initialsFromName } from "@/modules/identity/domain/session";

interface AgentWorkloadTableRowProps {
  ag: AgentPerformanceDto;
  departments: DepartmentDto[];
  formatFrt: (ms?: number | null) => string;
}

export function AgentWorkloadTableRow({ ag, departments, formatFrt }: AgentWorkloadTableRowProps) {
  const maxCap = ag.maxCapacityThreshold || 6;
  const active = ag.activeCasesNow || 0;
  const occupancyPct = Math.min(Math.round((active / maxCap) * 100), 100);
  const isFull = active >= maxCap;
  const isModerate = active > 0 && !isFull;
  const deptName =
    ag.primaryDepartmentName ||
    departments.find((d) => d.id === ag.primaryDepartmentId)?.name ||
    "Sin Área";

  const targetDeptId = ag.primaryDepartmentId ?? undefined;

  return (
    <tr className="hover:bg-muted/30 transition-colors group">
      {/* Asesor */}
      <td className="py-3 px-3.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="size-8 rounded-full bg-primary/10 text-primary font-bold text-xs grid place-items-center shrink-0">
            {initialsFromName(ag.agentName)}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-foreground truncate">{ag.agentName}</p>
            <p className="text-[10px] text-muted-foreground uppercase">{ag.role}</p>
          </div>
        </div>
      </td>

      {/* Área Principal */}
      <td className="py-3 px-3 text-muted-foreground truncate max-w-[140px] font-medium">
        {deptName}
      </td>

      {/* Estado del Turno */}
      <td className="py-3 px-3">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
            ag.autoAssignEnabled
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/30"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {ag.autoAssignEnabled ? "En turno" : "En pausa"}
        </span>
      </td>

      {/* Nivel de Ocupación Visual */}
      <td className="py-3 px-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span
              className={`font-extrabold ${
                isFull
                  ? "text-rose-600 dark:text-rose-400"
                  : isModerate
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {isFull ? "Saturado" : isModerate ? "Carga media" : "Disponible"}
            </span>
            <span className="text-muted-foreground text-[10px]">
              {active}/{maxCap} ({occupancyPct}%)
            </span>
          </div>
          <div className="w-full bg-muted/70 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isFull ? "bg-rose-500" : isModerate ? "bg-amber-500" : "bg-emerald-500"
              }`}
              style={{ width: `${occupancyPct}%` }}
            />
          </div>
        </div>
      </td>

      {/* Casos Cerrados Hoy */}
      <td className="py-3 px-3 text-center">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-bold">
          <CheckCircle2 className="size-3" />
          {ag.casesCompleted ?? 0}
        </span>
      </td>

      {/* Velocidad de Primera Respuesta (FRT) */}
      <td className="py-3 px-3 text-center font-mono font-semibold text-muted-foreground">
        {formatFrt(ag.avgFirstResponseTimeMs)}
      </td>

      {/* Estado / Alertas (Atajo directo si hay desatención) */}
      <td className="py-3 px-3 text-center">
        {(ag.unattendedActiveCases ?? 0) > 0 ? (
          <Link
            to="/bandeja"
            search={{
              agentId: ag.agentId,
              departmentId: targetDeptId,
              tab: "unattended",
            }}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-extrabold font-mono border border-rose-500/30 hover:bg-rose-500/20 transition-all cursor-pointer"
            title={`Atajo: Ver ${ag.unattendedActiveCases} caso(s) desatendido(s) de ${ag.agentName}`}
          >
            <AlertTriangle className="size-2.5 animate-pulse" />
            <span>{ag.unattendedActiveCases} desatendidos</span>
          </Link>
        ) : (
          <span className="text-[10px] text-muted-foreground font-mono inline-flex items-center gap-1">
            <Clock className="size-2.5 text-emerald-500" /> Al día
          </span>
        )}
      </td>

      {/* Atajo de Navegación Rápida a la Bandeja */}
      <td className="py-3 px-3.5 text-right">
        <Link
          to="/bandeja"
          search={{
            agentId: ag.agentId,
            departmentId: targetDeptId,
          }}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border bg-background hover:bg-muted text-foreground text-xs font-semibold transition-all hover:border-primary/40 shadow-xs cursor-pointer group-hover:border-primary/30"
          title={`Atajo: Abrir bandeja filtrada para ${ag.agentName}`}
        >
          <span>Bandeja</span>
          <ArrowUpRight className="size-3 text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </Link>
      </td>
    </tr>
  );
}
