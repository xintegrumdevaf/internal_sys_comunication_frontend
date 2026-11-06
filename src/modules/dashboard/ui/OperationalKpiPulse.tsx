import { Link } from "@tanstack/react-router";
import { Activity, CheckCircle2, Gauge, Timer, ArrowUpRight } from "lucide-react";
import type { AnalyticsOverviewDto } from "@/modules/analytics/domain/analytics.types";

interface OperationalKpiPulseProps {
  overview?: AnalyticsOverviewDto | null;
  totalClosedToday: number;
  totalActiveNow: number;
  totalCapacityInShift: number;
  unassignedQueueCount: number;
  avgWaitSeconds?: number | null;
  isLoading?: boolean;
  onFilterSaturated?: () => void;
}

export function OperationalKpiPulse({
  overview,
  totalClosedToday,
  totalActiveNow,
  totalCapacityInShift,
  unassignedQueueCount,
  avgWaitSeconds,
  isLoading,
  onFilterSaturated,
}: OperationalKpiPulseProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-2xl border border-border bg-card/60 animate-pulse p-4"
          />
        ))}
      </div>
    );
  }

  // Porcentaje global de ocupación del equipo en turno
  const globalOccupancyPct =
    totalCapacityInShift > 0
      ? Math.min(Math.round((totalActiveNow / totalCapacityInShift) * 100), 100)
      : totalActiveNow > 0
        ? 100
        : 0;

  const isOverloaded = globalOccupancyPct >= 85;
  const isModerate = globalOccupancyPct >= 60 && globalOccupancyPct < 85;

  const formatWait = (sec?: number | null) => {
    if (sec == null || sec <= 0) return "0 seg";
    if (sec < 60) return `${Math.round(sec)} seg`;
    if (sec < 3600) return `${(sec / 60).toFixed(1)} min`;
    return `${(sec / 3600).toFixed(1)} h`;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Casos Cerrados Hoy (Atajo a bandeja: resueltos) */}
      <Link
        to="/bandeja"
        search={{ tab: "resolved" }}
        className="p-4 sm:p-5 rounded-2xl border border-border bg-card shadow-xs relative overflow-hidden transition-all hover:shadow-md hover:border-emerald-500/40 group cursor-pointer block"
        title="Atajo: Ver casos resueltos hoy en bandeja"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors flex items-center gap-1">
            <span>Casos Cerrados Hoy</span>
            <ArrowUpRight className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </span>
          <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 grid place-items-center">
            <CheckCircle2 className="size-4" />
          </div>
        </div>
        <p className="text-3xl font-extrabold font-mono mt-2 text-foreground">{totalClosedToday}</p>
        <p className="text-[11px] mt-1 text-emerald-600 dark:text-emerald-400 font-medium">
          {overview?.botContainmentRate
            ? `${overview.botContainmentRate}% resueltos por asistente IA`
            : "Resoluciones completadas"}
        </p>
      </Link>

      {/* 2. Clientes Esperando en Cola (Atajo a bandeja: unassigned) */}
      <Link
        to="/bandeja"
        search={{ tab: "unassigned" }}
        className="p-4 sm:p-5 rounded-2xl border border-border bg-card shadow-xs relative overflow-hidden transition-all hover:shadow-md hover:border-rose-500/40 group cursor-pointer block"
        title="Atajo: Ver clientes esperando en cola"
      >
        <div
          className={`absolute top-0 left-0 right-0 h-1 ${unassignedQueueCount > 0 ? "bg-rose-500" : "bg-primary/40"}`}
        />
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors flex items-center gap-1">
            <span>En Cola (Sin Asignar)</span>
            <ArrowUpRight className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </span>
          <div
            className={`size-8 rounded-lg grid place-items-center ${unassignedQueueCount > 0 ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 animate-pulse" : "bg-primary/10 text-primary"}`}
          >
            <Timer className="size-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2 mt-2">
          <p className="text-3xl font-extrabold font-mono text-foreground">
            {unassignedQueueCount}
          </p>
          {unassignedQueueCount > 0 && (
            <span className="text-xs text-rose-600 dark:text-rose-400 font-semibold font-mono">
              Espera media: {formatWait(avgWaitSeconds)}
            </span>
          )}
        </div>
        <p className="text-[11px] mt-1 text-muted-foreground">
          {unassignedQueueCount === 0
            ? "No hay clientes esperando"
            : "Aguardando asesor disponible"}
        </p>
      </Link>

      {/* 3. Nivel de Ocupación Global del Equipo */}
      <button
        type="button"
        onClick={onFilterSaturated}
        className="p-4 sm:p-5 rounded-2xl border border-border bg-card shadow-xs relative overflow-hidden transition-all hover:shadow-md hover:border-primary/40 group cursor-pointer text-left w-full block"
        title="Atajo: Filtrar asesores saturados en la tabla inferior"
      >
        <div
          className={`absolute top-0 left-0 right-0 h-1 ${isOverloaded ? "bg-rose-500" : isModerate ? "bg-amber-500" : "bg-cyan-500"}`}
        />
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors flex items-center gap-1">
            <span>Saturación del Equipo</span>
            <ArrowUpRight className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </span>
          <div
            className={`size-8 rounded-lg grid place-items-center ${isOverloaded ? "bg-rose-500/10 text-rose-600" : isModerate ? "bg-amber-500/10 text-amber-600" : "bg-cyan-500/10 text-cyan-600"}`}
          >
            <Gauge className="size-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2 mt-2">
          <p className="text-3xl font-extrabold font-mono text-foreground">{globalOccupancyPct}%</p>
          <span className="text-xs text-muted-foreground font-mono">
            ({totalActiveNow}/{totalCapacityInShift} cupos)
          </span>
        </div>
        <p
          className={`text-[11px] mt-1 font-medium ${isOverloaded ? "text-rose-600 dark:text-rose-400" : isModerate ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}
        >
          {isOverloaded
            ? "Equipo al límite de capacidad"
            : isModerate
              ? "Carga moderada en turno"
              : "Capacidad disponible"}
        </p>
      </button>

      {/* 4. Casos Activos Totales (Atajo a bandeja: abiertos) */}
      <Link
        to="/bandeja"
        search={{ tab: "open" }}
        className="p-4 sm:p-5 rounded-2xl border border-border bg-card shadow-xs relative overflow-hidden transition-all hover:shadow-md hover:border-primary/40 group cursor-pointer block"
        title="Atajo: Ver todos los casos abiertos en bandeja"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-primary/60" />
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors flex items-center gap-1">
            <span>Casos Activos Totales</span>
            <ArrowUpRight className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </span>
          <div className="size-8 rounded-lg bg-primary/10 text-primary grid place-items-center">
            <Activity className="size-4" />
          </div>
        </div>
        <p className="text-3xl font-extrabold font-mono mt-2 text-foreground">{totalActiveNow}</p>
        <p className="text-[11px] mt-1 text-muted-foreground">En atención humana o IA ahora</p>
      </Link>
    </div>
  );
}
