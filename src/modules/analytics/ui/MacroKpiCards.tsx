import { Inbox, Activity, Bot, Clock, Timer, AlertCircle } from "lucide-react";
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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {/* Total Casos */}
      <div className="relative p-4 sm:p-5 border border-border bg-card rounded-2xl shadow-xs transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-primary/60" />
        <div className="flex items-center justify-between">
          <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Total Casos
          </p>
          <Inbox className="size-4 text-primary" />
        </div>
        <p className="text-2xl sm:text-3xl font-extrabold font-mono mt-2 tracking-tight text-foreground">
          {formatNumber(overview?.totalCases)}
        </p>
        <p className="text-[10px] sm:text-[11px] mt-1 text-muted-foreground truncate">
          {overview?.completedCases ?? 0} resueltos
        </p>
      </div>

      {/* Casos Activos */}
      <div className="relative p-4 sm:p-5 border border-border bg-card rounded-2xl shadow-xs transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-sky-500" />
        <div className="flex items-center justify-between">
          <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Casos Activos
          </p>
          <Activity className="size-4 text-sky-500" />
        </div>
        <p className="text-2xl sm:text-3xl font-extrabold font-mono mt-2 tracking-tight text-sky-600 dark:text-sky-400">
          {formatNumber(overview?.activeCases)}
        </p>
        <p className="text-[10px] sm:text-[11px] mt-1 text-muted-foreground truncate">
          En cola o atención viva
        </p>
      </div>

      {/* Tasa Contención Bot */}
      <div className="relative p-4 sm:p-5 border border-border bg-card rounded-2xl shadow-xs transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
        <div className="flex items-center justify-between">
          <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Contención IA
          </p>
          <Bot className="size-4 text-emerald-500" />
        </div>
        <p className="text-2xl sm:text-3xl font-extrabold font-mono mt-2 tracking-tight text-emerald-600 dark:text-emerald-400">
          {formatPercent(overview?.botContainmentRate)}
        </p>
        <p className="text-[10px] sm:text-[11px] mt-1 text-emerald-600 dark:text-emerald-400 font-medium truncate">
          Resuelto sin escalación
        </p>
      </div>

      {/* Resolución Media (minutos) */}
      <div className="relative p-4 sm:p-5 border border-border bg-card rounded-2xl shadow-xs transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-violet-500" />
        <div className="flex items-center justify-between">
          <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Resolución Media
          </p>
          <Clock className="size-4 text-violet-500" />
        </div>
        <p className="text-2xl sm:text-3xl font-extrabold font-mono mt-2 tracking-tight text-foreground">
          {formatNumber(overview?.avgResolutionTimeMinutes)}
          <span className="text-xs sm:text-sm ml-1 font-sans font-normal text-muted-foreground">
            min
          </span>
        </p>
        <p className="text-[10px] sm:text-[11px] mt-1 text-muted-foreground truncate">
          Ciclo de vida total
        </p>
      </div>

      {/* Espera Media en Cola */}
      <div className="relative p-4 sm:p-5 border border-border bg-card rounded-2xl shadow-xs transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
        <div className="flex items-center justify-between">
          <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Espera en Cola
          </p>
          <Timer className="size-4 text-amber-500" />
        </div>
        <p className="text-2xl sm:text-3xl font-extrabold font-mono mt-2 tracking-tight text-foreground">
          {formatNumber(overview?.avgQueueWaitTimeSeconds)}
          <span className="text-xs sm:text-sm ml-1 font-sans font-normal text-muted-foreground">
            seg
          </span>
        </p>
        <p className="text-[10px] sm:text-[11px] mt-1 text-amber-600 dark:text-amber-400 font-medium truncate">
          Hasta asignación humana
        </p>
      </div>

      {/* Tasa de Escalación */}
      <div className="relative p-4 sm:p-5 border border-border bg-card rounded-2xl shadow-xs transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500" />
        <div className="flex items-center justify-between">
          <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Escalaciones
          </p>
          <AlertCircle className="size-4 text-rose-500" />
        </div>
        <p className="text-2xl sm:text-3xl font-extrabold font-mono mt-2 tracking-tight text-rose-600 dark:text-rose-400">
          {formatPercent(overview?.escalationRate)}
        </p>
        <p className="text-[10px] sm:text-[11px] mt-1 text-muted-foreground truncate">
          Derivados a humano
        </p>
      </div>
    </div>
  );
}
