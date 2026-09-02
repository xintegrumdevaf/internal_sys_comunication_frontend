import {
  formatWorkflow,
  formatEscalationReason,
  formatStep,
} from "../domain/analytics-translations";
import { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { Bot, GitFork, ArrowDownRight, AlertOctagon, Sparkles } from "lucide-react";
import type { AIEfficiencyDto, CasesDistributionDto } from "../domain/analytics.types";

interface AiEfficiencySectionProps {
  distribution?: CasesDistributionDto | null;
  aiEfficiency?: AIEfficiencyDto | null;
  isLoading?: boolean;
}

const COLORS = [
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f43f5e", // rose
];

export function AiEfficiencySection({
  distribution,
  aiEfficiency,
  isLoading,
}: AiEfficiencySectionProps) {
  const workflowData = useMemo(() => {
    return (
      distribution?.byWorkflow.map((item) => ({
        id: item.workflowType,
        name: formatWorkflow(item.workflowType),
        count: item.count,
        percentage: item.percentage,
      })) ?? []
    );
  }, [distribution]);

  const escalationData = useMemo(() => {
    return (
      distribution?.topEscalationReasons.slice(0, 5).map((item) => ({
        id: item.reason,
        name: formatEscalationReason(item.reason),
        count: item.count,
        percentage: item.percentage,
      })) ?? []
    );
  }, [distribution]);

  const funnelData = useMemo(() => {
    return aiEfficiency?.funnelDropOff ?? [];
  }, [aiEfficiency]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-80 rounded-2xl border border-border bg-card/60 animate-pulse" />
        <div className="h-80 rounded-2xl border border-border bg-card/60 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Distribución por Workflow (Bar Chart) */}
        <div className="col-span-1 lg:col-span-6 bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <GitFork className="size-4 text-primary" />
              <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-foreground">
                Casos por Tipo de Flujo (Workflow)
              </h3>
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              Total: {distribution?.totalCases ?? 0}
            </span>
          </div>

          <p className="text-[11px] text-muted-foreground mb-4">
            Volumen atendido según la tipificación del incidente.
          </p>

          <div className="h-64 w-full">
            {workflowData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={workflowData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                >
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: "var(--muted-foreground, #888)" }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground, #888)" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card, #fff)",
                      borderColor: "var(--border, #ccc)",
                      borderRadius: "0.75rem",
                      fontSize: "12px",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                    formatter={(val: unknown) => [`${val} casos`, "Volumen"]}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {workflowData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                Sin datos de flujos en este período.
              </div>
            )}
          </div>
        </div>

        {/* Motivos Principales de Escalación (Pie / Progress) */}
        <div className="col-span-1 lg:col-span-6 bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertOctagon className="size-4 text-rose-500" />
              <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-foreground">
                Motivos de Escalación a Humano
              </h3>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground mb-4">
            Razones por las que el bot derivó el caso a un agente.
          </p>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-64 pr-1">
            {escalationData.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <div className="max-w-[70%] truncate">
                    <span className="font-semibold text-foreground block truncate">
                      {item.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono font-normal block truncate">
                      {item.id}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="text-muted-foreground">{item.count} casos</span>
                    <span className="font-bold text-rose-600 dark:text-rose-400">
                      {item.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-muted/60 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: COLORS[idx % COLORS.length],
                    }}
                  />
                </div>
              </div>
            ))}

            {escalationData.length === 0 && (
              <div className="h-40 flex items-center justify-center text-xs text-muted-foreground">
                No se registraron escalaciones en este período.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Embudo y Fricción de IA (Funnel Drop-off) */}
      <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Bot className="size-4 text-emerald-500" />
            <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-foreground">
              Embudo de Automatización y Puntos de Fricción (Drop-Off)
            </h3>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-muted-foreground">
              Tasa General de Contención:{" "}
              <strong className="text-emerald-600 dark:text-emerald-400 font-mono">
                {aiEfficiency?.overallContainmentRate
                  ? `${aiEfficiency.overallContainmentRate.toFixed(1)}%`
                  : "—"}
              </strong>
            </span>
            <span className="text-muted-foreground hidden sm:inline">•</span>
            <span className="text-muted-foreground">
              Sin categorizar en Triage:{" "}
              <strong className="text-foreground font-mono">
                {aiEfficiency?.unclearTriageCount ?? 0}
              </strong>
            </span>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground mb-4">
          Pasos de cada flujo donde el cliente abandona o requiere intervención manual. Permite
          identificar preguntas confusas o fallas de validación.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {funnelData.map((step, index) => (
            <div
              key={index}
              className="p-3.5 rounded-xl border border-border bg-background/50 hover:bg-background transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {formatWorkflow(step.workflowType)}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-mono text-[10px] font-bold">
                    {step.percentage.toFixed(1)}% fricción
                  </span>
                </div>
                <h4 className="text-xs font-bold text-foreground truncate">
                  Paso: <span className="font-mono text-primary">{formatStep(step.state)}</span>{" "}
                  <span className="text-[10px] text-muted-foreground font-normal">
                    ({step.state})
                  </span>
                </h4>
              </div>

              <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground flex items-center gap-1">
                  <ArrowDownRight className="size-3 text-rose-500" /> Caídas:
                </span>
                <span className="font-mono font-bold text-foreground">
                  {step.dropOffCount} clientes
                </span>
              </div>
            </div>
          ))}

          {funnelData.length === 0 && (
            <div className="col-span-full py-8 text-center text-xs text-muted-foreground">
              Sin puntos críticos de fricción identificados en este período.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
