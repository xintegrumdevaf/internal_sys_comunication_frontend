import { Link } from "@tanstack/react-router";
import {
  Inbox,
  Activity,
  Bot,
  Clock,
  Timer,
  AlertCircle,
  AlertTriangle,
  UserX,
} from "lucide-react";
import type { AnalyticsOverviewDto } from "../domain/analytics.types";

interface MacroKpiCardsProps {
  overview?: AnalyticsOverviewDto | null;
  isLoading?: boolean;
}

export function MacroKpiCards({ overview, isLoading }: MacroKpiCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-2xl border border-border bg-card/60 animate-pulse p-4"
          />
        ))}
      </div>
    );
  }

  const formatNumber = (num: number | null | undefined, fallback = "—") => {
    if (num === null || num === undefined) return fallback;
    return new Intl.NumberFormat("es-AR", { maximumFractionDigits: 1 }).format(num);
  };

  const formatPercent = (num: number | null | undefined) => {
    if (num === null || num === undefined) return "—";
    return `${formatNumber(num)}%`;
  };

  const formatSeconds = (sec: number | null | undefined) => {
    if (sec === null || sec === undefined) return { value: "—", unit: "" };
    if (sec < 60) {
      return { value: `${Math.round(sec)}`, unit: "seg" };
    }
    if (sec < 3600) {
      return { value: (sec / 60).toFixed(1), unit: "min" };
    }
    return { value: (sec / 3600).toFixed(1), unit: "h" };
  };

  const formatMinutes = (min: number | null | undefined) => {
    if (min === null || min === undefined) return { value: "—", unit: "" };
    if (min < 60) {
      return { value: min.toFixed(1), unit: "min" };
    }
    return { value: (min / 60).toFixed(1), unit: "h" };
  };

  const queueWait = formatSeconds(overview?.avgQueueWaitTimeSeconds);
  const resolutionTime = formatMinutes(overview?.avgResolutionTimeMinutes);

  const unassignedCount = overview?.unassignedCases ?? 0;
  const unattendedCount = overview?.unattendedCases ?? 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {/* 1. Total Casos */}
      <div className="relative p-4 sm:p-5 border border-border bg-card rounded-2xl shadow-xs transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 overflow-hidden flex flex-col justify-between">
        <div className="absolute top-0 left-0 right-0 h-1 bg-primary/60" />
        <div>
          <div className="flex items-center justify-between">
            <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Total Casos
            </p>
            <Inbox className="size-4 text-primary" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono mt-2 tracking-tight text-foreground">
            {formatNumber(overview?.totalCases)}
          </p>
        </div>
        <p className="text-[10px] sm:text-[11px] mt-2 text-muted-foreground truncate">
          {overview?.completedCases ?? 0} resueltos
        </p>
      </div>

      {/* 2. Casos Activos con desglose de cola y desatendidos */}
      <div className="relative p-4 sm:p-5 border border-border bg-card rounded-2xl shadow-xs transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 overflow-hidden flex flex-col justify-between">
        <div className="absolute top-0 left-0 right-0 h-1 bg-sky-500" />
        <div>
          <div className="flex items-center justify-between">
            <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Casos Activos
            </p>
            <Activity className="size-4 text-sky-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono mt-2 tracking-tight text-sky-600 dark:text-sky-400">
            {formatNumber(overview?.activeCases)}
          </p>
        </div>

        {/* Micro-indicadores de salud operativa en vivo */}
        <div className="mt-2 flex items-center gap-1.5 flex-wrap">
          {unassignedCount > 0 && (
            <Link
              to="/bandeja"
              search={{ tab: "unassigned" }}
              title="Ver casos en cola sin asignar en la Bandeja"
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-all cursor-pointer"
            >
              <UserX className="size-3" />
              {unassignedCount} cola
            </Link>
          )}
          {unattendedCount > 0 && (
            <Link
              to="/bandeja"
              search={{ tab: "unattended" }}
              title="Ver casos desatendidos con cliente esperando en la Bandeja"
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 hover:bg-rose-500/25 transition-all cursor-pointer"
            >
              <AlertTriangle className="size-3" />
              {unattendedCount} demorados
            </Link>
          )}
          {unassignedCount === 0 && unattendedCount === 0 && (
            <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate">
              En cola o atención viva
            </p>
          )}
        </div>
      </div>

      {/* 3. Tasa Contención Bot */}
      <div className="relative p-4 sm:p-5 border border-border bg-card rounded-2xl shadow-xs transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 overflow-hidden flex flex-col justify-between">
        <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
        <div>
          <div className="flex items-center justify-between">
            <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Contención IA
            </p>
            <Bot className="size-4 text-emerald-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono mt-2 tracking-tight text-emerald-600 dark:text-emerald-400">
            {formatPercent(overview?.botContainmentRate)}
          </p>
        </div>
        <p className="text-[10px] sm:text-[11px] mt-2 text-emerald-600 dark:text-emerald-400 font-medium truncate">
          Resuelto sin escalación
        </p>
      </div>

      {/* 4. Resolución Media */}
      <div className="relative p-4 sm:p-5 border border-border bg-card rounded-2xl shadow-xs transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 overflow-hidden flex flex-col justify-between">
        <div className="absolute top-0 left-0 right-0 h-1 bg-violet-500" />
        <div>
          <div className="flex items-center justify-between">
            <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Resolución Media
            </p>
            <Clock className="size-4 text-violet-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono mt-2 tracking-tight text-foreground">
            {resolutionTime.value}
            {resolutionTime.unit && (
              <span className="text-xs sm:text-sm ml-1 font-sans font-normal text-muted-foreground">
                {resolutionTime.unit}
              </span>
            )}
          </p>
        </div>
        <p className="text-[10px] sm:text-[11px] mt-2 text-muted-foreground truncate">
          Ciclo de vida total
        </p>
      </div>

      {/* 5. Espera Media en Cola */}
      <div className="relative p-4 sm:p-5 border border-border bg-card rounded-2xl shadow-xs transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 overflow-hidden flex flex-col justify-between">
        <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
        <div>
          <div className="flex items-center justify-between">
            <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Espera en Cola
            </p>
            <Timer className="size-4 text-amber-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono mt-2 tracking-tight text-foreground">
            {queueWait.value}
            {queueWait.unit && (
              <span className="text-xs sm:text-sm ml-1 font-sans font-normal text-muted-foreground">
                {queueWait.unit}
              </span>
            )}
          </p>
        </div>
        <p className="text-[10px] sm:text-[11px] mt-2 text-amber-600 dark:text-amber-400 font-medium truncate">
          Hasta asignación humana
        </p>
      </div>

      {/* 6. Tasa de Escalación */}
      <div className="relative p-4 sm:p-5 border border-border bg-card rounded-2xl shadow-xs transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 overflow-hidden flex flex-col justify-between">
        <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500" />
        <div>
          <div className="flex items-center justify-between">
            <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Escalaciones
            </p>
            <AlertCircle className="size-4 text-rose-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono mt-2 tracking-tight text-rose-600 dark:text-rose-400">
            {formatPercent(overview?.escalationRate)}
          </p>
        </div>
        <p className="text-[10px] sm:text-[11px] mt-2 text-muted-foreground truncate">
          {(overview?.escalatedCases ?? 0) > 0
            ? `${overview?.escalatedCases} derivados a humano`
            : "Derivados a humano"}
        </p>
      </div>
    </div>
  );
}
