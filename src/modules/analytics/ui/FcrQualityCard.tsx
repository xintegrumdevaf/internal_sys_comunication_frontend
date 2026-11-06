import { useMemo } from "react";
import { ShieldCheck, RotateCcw, Timer, Zap, CheckCircle2, Wrench } from "lucide-react";
import type { AgentPerformanceDto, AnalyticsOverviewDto } from "../domain/analytics.types";
import { CircularGauge } from "@/modules/dashboard/ui/CircularGauge";

interface FcrQualityCardProps {
  agentsPerformance?: AgentPerformanceDto[];
  overview?: AnalyticsOverviewDto | null;
  isLoading?: boolean;
}

export function FcrQualityCard({
  agentsPerformance = [],
  overview,
  isLoading,
}: FcrQualityCardProps) {
  const { avgFcr, recurrenceRate, avgAhtMinutes, avgWaitSeconds, fcrColor } = useMemo(() => {
    const validFcrAgents = agentsPerformance.filter((a) => a.fcrRatePercentage !== null);
    const fcrSum = validFcrAgents.reduce((acc, a) => acc + (a.fcrRatePercentage || 0), 0);
    const calculatedFcr =
      validFcrAgents.length > 0 ? Math.round(fcrSum / validFcrAgents.length) : 85;

    const recurrence = Math.max(0, 100 - calculatedFcr);

    let color = "#10b981"; // emerald
    if (calculatedFcr < 70)
      color = "#f43f5e"; // rose
    else if (calculatedFcr < 80) color = "#f59e0b"; // amber

    return {
      avgFcr: calculatedFcr,
      recurrenceRate: recurrence,
      avgAhtMinutes: overview?.avgResolutionTimeMinutes ?? null,
      avgWaitSeconds: overview?.avgQueueWaitTimeSeconds ?? null,
      fcrColor: color,
    };
  }, [agentsPerformance, overview]);

  const formatDuration = (seconds: number | null | undefined) => {
    if (seconds === null || seconds === undefined) return "—";
    if (seconds < 60) return `${Math.round(seconds)} seg`;
    const minutes = seconds / 60;
    if (minutes < 60) return `${minutes.toFixed(1)} min`;
    const hours = minutes / 60;
    if (hours < 24) return `${hours.toFixed(1)} h`;
    const days = hours / 24;
    return `${days.toFixed(1)} días`;
  };

  const formatHandlingMinutes = (minutes: number | null | undefined) => {
    if (minutes === null || minutes === undefined) return "—";
    if (minutes < 1) return "< 1 min";
    if (minutes < 60) return `${minutes.toFixed(1)} min`;
    const hours = minutes / 60;
    return `${hours.toFixed(1)} h`;
  };

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-5 shadow-xs animate-pulse">
        <div className="h-6 w-48 bg-muted rounded-md mb-3" />
        <div className="h-44 bg-muted/40 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
      <div>
        {/* Cabecera y Contexto */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 grid place-items-center shrink-0">
              <ShieldCheck className="size-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-foreground">
                Efectividad de Atención y Reincidencias
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Porcentaje de casos resueltos limpiamente sin que el cliente vuelva a quejarse
                dentro de 48 horas.
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold self-start sm:self-auto">
            <Wrench className="size-3" />
            <span>Clave en Soporte Técnico y Averías</span>
          </div>
        </div>

        {/* Bloque Central de Calidad */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center my-2">
          {/* Gauge y Tasa de Resolución en 1er contacto */}
          <div className="flex items-center gap-4 p-3 rounded-xl bg-background/60 border border-border/40">
            <CircularGauge percentage={avgFcr} color={fcrColor} size={64} strokeWidth={5.5} />
            <div>
              <p className="text-[10px] font-bold uppercase text-muted-foreground">
                Resolución en 1er Contacto
              </p>
              <p className="text-xl font-mono font-extrabold text-foreground">{avgFcr}%</p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5 flex items-center gap-1">
                <CheckCircle2 className="size-2.5" /> Caso cerrado y sin reaperturas
              </p>
            </div>
          </div>

          {/* Reincidencia / Reapertura a 48h */}
          <div className="flex items-center gap-4 p-3 rounded-xl bg-background/60 border border-border/40">
            <div className="size-12 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 grid place-items-center shrink-0 font-mono font-extrabold text-sm border border-rose-500/20">
              {recurrenceRate}%
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-muted-foreground">
                Tasa de Reincidencia (48h)
              </p>
              <p className="text-xl font-mono font-extrabold text-foreground">{recurrenceRate}%</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                <RotateCcw className="size-2.5" /> Clientes con reiteración
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tiempos Medios al pie */}
      <div className="mt-4 pt-3 border-t border-border/60 grid grid-cols-2 gap-2 text-center text-xs">
        <div className="p-2 rounded-xl bg-background/60 border border-border/40">
          <p className="text-[10px] uppercase font-bold text-muted-foreground flex items-center justify-center gap-1">
            <Timer className="size-3 text-primary" /> Duración Media de Atención
          </p>
          <p className="font-mono font-extrabold text-foreground mt-0.5">
            {formatHandlingMinutes(avgAhtMinutes)}
          </p>
        </div>
        <div className="p-2 rounded-xl bg-background/60 border border-border/40">
          <p className="text-[10px] uppercase font-bold text-muted-foreground flex items-center justify-center gap-1">
            <Zap className="size-3 text-amber-500" /> Espera Media en Cola
          </p>
          <p className="font-mono font-extrabold text-foreground mt-0.5">
            {formatDuration(avgWaitSeconds)}
          </p>
        </div>
      </div>
    </div>
  );
}
