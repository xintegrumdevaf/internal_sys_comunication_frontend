import { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import {
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  LineChart as LineIcon,
  BarChart2,
} from "lucide-react";
import type { DailyTrendItem } from "../domain/analytics.types";

interface BurnRateTrendChartProps {
  dailyTrend?: DailyTrendItem[];
  isLoading?: boolean;
}

export function BurnRateTrendChart({ dailyTrend = [], isLoading }: BurnRateTrendChartProps) {
  // Por defecto, si hay más de 14 días usamos curva continua para no comprimir barras
  const [viewMode, setViewMode] = useState<"area" | "bar">(() =>
    dailyTrend.length > 14 ? "area" : "bar",
  );

  const { chartData, totalIncoming, totalResolved, burnRatio, isHealthy } = useMemo(() => {
    if (!dailyTrend || dailyTrend.length === 0) {
      return {
        chartData: [],
        totalIncoming: 0,
        totalResolved: 0,
        burnRatio: 0,
        isHealthy: true,
      };
    }

    let inCount = 0;
    let outCount = 0;

    const data = dailyTrend.map((item) => {
      inCount += item.incoming;
      outCount += item.resolved;

      const parts = item.date.split("-");
      const shortLabel = parts.length === 3 ? `${parts[2]}/${parts[1]}` : item.date;

      return {
        date: item.date,
        label: shortLabel,
        Entrantes: item.incoming,
        Resueltos: item.resolved,
      };
    });

    const ratio = inCount > 0 ? Math.round((outCount / inCount) * 100) : 100;
    const healthy = outCount >= inCount || ratio >= 90;

    return {
      chartData: data,
      totalIncoming: inCount,
      totalResolved: outCount,
      burnRatio: ratio,
      isHealthy: healthy,
    };
  }, [dailyTrend]);

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-5 shadow-xs animate-pulse">
        <div className="h-6 w-48 bg-muted rounded-md mb-3" />
        <div className="h-60 bg-muted/40 rounded-xl" />
      </div>
    );
  }

  const backlogDelta = totalIncoming - totalResolved;
  // Intervalo inteligente de etiquetas según la cantidad de días
  const axisInterval = Math.max(0, Math.floor(chartData.length / 7));

  return (
    <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
      <div>
        {/* Cabecera y Controles */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 grid place-items-center shrink-0">
              <TrendingUp className="size-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-foreground">
                Entrantes vs. Resueltos (Velocidad de Desahogo)
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Compara el ritmo de llegada de clientes contra la capacidad de cierre del equipo.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            {/* Selector de Modo: Curva Continua vs Barras */}
            <div className="inline-flex items-center rounded-lg border border-border bg-background p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setViewMode("area")}
                title="Ver como curva continua suave (ideal para 30+ días)"
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                  viewMode === "area"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LineIcon className="size-3" />
                <span>Curva</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("bar")}
                title="Ver como barras diarias"
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                  viewMode === "bar"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <BarChart2 className="size-3" />
                <span>Barras</span>
              </button>
            </div>

            {/* Chip de Salud Operativa */}
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                isHealthy
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
              }`}
            >
              {isHealthy ? (
                <>
                  <CheckCircle2 className="size-3" />
                  <span>Ritmo Óptimo ({burnRatio}%)</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="size-3" />
                  <span>Deuda (+{backlogDelta})</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Gráfico Dinámico: Área Suave o Barras */}
        <div className="h-56 w-full mt-3">
          {chartData.length > 0 && (totalIncoming > 0 || totalResolved > 0) ? (
            <ResponsiveContainer width="100%" height="100%">
              {viewMode === "area" ? (
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="burnRateInGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="burnRateOutGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="label"
                    stroke="#888888"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    interval={axisInterval}
                  />
                  <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-popover border border-border p-2.5 rounded-xl shadow-lg text-xs space-y-1">
                            <p className="font-bold text-foreground">Fecha: {label}</p>
                            <div className="flex items-center gap-2 text-primary font-mono">
                              <span className="size-2 rounded-full bg-blue-500" />
                              <span>Entrantes: {payload[0]?.value ?? 0}</span>
                            </div>
                            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-mono">
                              <span className="size-2 rounded-full bg-emerald-500" />
                              <span>Resueltos: {payload[1]?.value ?? 0}</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: "11px", paddingBottom: "8px" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="Entrantes"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#burnRateInGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="Resueltos"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#burnRateOutGrad)"
                  />
                </AreaChart>
              ) : (
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="label"
                    stroke="#888888"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    interval={axisInterval}
                  />
                  <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-popover border border-border p-2.5 rounded-xl shadow-lg text-xs space-y-1">
                            <p className="font-bold text-foreground">Fecha: {label}</p>
                            <div className="flex items-center gap-2 text-primary font-mono">
                              <span className="size-2 rounded-full bg-primary" />
                              <span>Entrantes: {payload[0]?.value ?? 0}</span>
                            </div>
                            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-mono">
                              <span className="size-2 rounded-full bg-emerald-500" />
                              <span>Resueltos: {payload[1]?.value ?? 0}</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: "11px", paddingBottom: "8px" }}
                  />
                  <Bar dataKey="Entrantes" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="Resueltos" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              )}
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-xs text-muted-foreground">
              <p>No hay casos registrados en este período.</p>
            </div>
          )}
        </div>
      </div>

      {/* Resumen al pie */}
      <div className="mt-3 pt-3 border-t border-border/60 grid grid-cols-3 gap-2 text-center text-xs">
        <div className="p-2 rounded-xl bg-background/60 border border-border/40">
          <p className="text-[10px] uppercase font-bold text-muted-foreground">Entrantes</p>
          <p className="font-mono font-extrabold text-blue-600 dark:text-blue-400 mt-0.5">
            {totalIncoming}
          </p>
        </div>
        <div className="p-2 rounded-xl bg-background/60 border border-border/40">
          <p className="text-[10px] uppercase font-bold text-muted-foreground">Resueltos</p>
          <p className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
            {totalResolved}
          </p>
        </div>
        <div className="p-2 rounded-xl bg-background/60 border border-border/40">
          <p className="text-[10px] uppercase font-bold text-muted-foreground">Tasa Desahogo</p>
          <p
            className={`font-mono font-extrabold mt-0.5 ${
              isHealthy
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {burnRatio}%
          </p>
        </div>
      </div>
    </div>
  );
}
