import { useMemo } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import { Clock, Zap } from "lucide-react";
import type { HourlyDemandItem } from "../domain/analytics.types";

interface HourlyDemandChartProps {
  hourlyDemand?: HourlyDemandItem[];
  isLoading?: boolean;
}

export function HourlyDemandChart({ hourlyDemand = [], isLoading }: HourlyDemandChartProps) {
  const { chartData, peakHour, totalTraffic, avgHourly } = useMemo<{
    chartData: Array<{ hour: number; label: string; casos: number }>;
    peakHour: HourlyDemandItem | null;
    totalTraffic: number;
    avgHourly: number;
  }>(() => {
    if (!hourlyDemand || hourlyDemand.length === 0) {
      return { chartData: [], peakHour: null, totalTraffic: 0, avgHourly: 0 };
    }

    let maxCount = -1;
    let peakItem: HourlyDemandItem | null = null;
    let sum = 0;

    const data = hourlyDemand.map((item) => {
      sum += item.count;
      if (item.count > maxCount) {
        maxCount = item.count;
        peakItem = item;
      }
      return {
        hour: item.hour,
        label: item.label,
        casos: item.count,
      };
    });

    const avg = data.length > 0 ? Math.round((sum / data.length) * 10) / 10 : 0;

    return { chartData: data, peakHour: peakItem, totalTraffic: sum, avgHourly: avg };
  }, [hourlyDemand]);

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-5 shadow-xs animate-pulse">
        <div className="h-6 w-48 bg-muted rounded-md mb-3" />
        <div className="h-60 bg-muted/40 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
      <div>
        {/* Cabecera */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
              <Clock className="size-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-foreground">
                Curva Horaria de Demanda (Picos de Tráfico 24h)
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Volumen de clientes que escriben según la hora del día para planificar turnos del
                equipo.
              </p>
            </div>
          </div>

          {peakHour && peakHour.count > 0 && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[11px] font-bold self-start sm:self-auto">
              <Zap className="size-3" />
              <span>
                Hora Pico: {peakHour.label} ({peakHour.count} casos)
              </span>
            </div>
          )}
        </div>

        {/* Gráfico de Área Suave */}
        <div className="h-56 w-full mt-3">
          {chartData.length > 0 && totalTraffic > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="hourlyDemandGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="label"
                  stroke="#888888"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  interval={2}
                />
                <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as { label: string; casos: number };
                      return (
                        <div className="bg-popover border border-border p-2.5 rounded-xl shadow-lg text-xs">
                          <p className="font-bold text-foreground">Hora: {data.label}</p>
                          <p className="text-primary font-mono font-semibold mt-0.5">
                            {data.casos} contacto{data.casos === 1 ? "" : "s"} entrante
                            {data.casos === 1 ? "" : "s"}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="casos"
                  stroke="#0ea5e9"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#hourlyDemandGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-xs text-muted-foreground">
              <p>No hay registro de actividad horaria en este rango de fechas.</p>
            </div>
          )}
        </div>
      </div>

      {/* Resumen al pie */}
      <div className="mt-3 pt-3 border-t border-border/60 grid grid-cols-2 sm:grid-cols-3 gap-2 text-center text-xs">
        <div className="p-2 rounded-xl bg-background/60 border border-border/40">
          <p className="text-[10px] uppercase font-bold text-muted-foreground">Volumen Total</p>
          <p className="font-mono font-extrabold text-foreground mt-0.5">{totalTraffic} casos</p>
        </div>
        <div className="p-2 rounded-xl bg-background/60 border border-border/40">
          <p className="text-[10px] uppercase font-bold text-muted-foreground">Promedio / Hora</p>
          <p className="font-mono font-extrabold text-foreground mt-0.5">{avgHourly} casos/h</p>
        </div>
        <div className="p-2 rounded-xl bg-background/60 border border-border/40 col-span-2 sm:col-span-1">
          <p className="text-[10px] uppercase font-bold text-muted-foreground">
            Horario más concurrido
          </p>
          <p className="font-mono font-extrabold text-primary mt-0.5">
            {peakHour && peakHour.count > 0 ? `${peakHour.label} hs` : "—"}
          </p>
        </div>
      </div>
    </div>
  );
}
