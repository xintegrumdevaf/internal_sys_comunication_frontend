import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { Filter, Bot, UserCheck, CheckCircle2, ArrowRight } from "lucide-react";
import type { AnalyticsOverviewDto, AIEfficiencyDto } from "../domain/analytics.types";

interface ResolutionFunnelChartProps {
  overview?: AnalyticsOverviewDto | null;
  aiEfficiency?: AIEfficiencyDto | null;
  isLoading?: boolean;
}

export function ResolutionFunnelChart({
  overview,
  aiEfficiency,
  isLoading,
}: ResolutionFunnelChartProps) {
  const funnelSteps = useMemo(() => {
    const total = overview?.totalCases ?? 0;
    const botClosed = aiEfficiency?.botCompletedCases ?? 0;
    const humanHandled = aiEfficiency?.humanEscalatedCases ?? overview?.escalatedCases ?? 0;
    const totalCompleted = overview?.completedCases ?? 0;

    const botPct = total > 0 ? Math.round((botClosed / total) * 100) : 0;
    const humanPct = total > 0 ? Math.round((humanHandled / total) * 100) : 0;
    const completionPct = total > 0 ? Math.round((totalCompleted / total) * 100) : 0;

    return [
      {
        id: "incoming",
        title: "1. Clientes Entrantes",
        description: "Demanda total recibida por WhatsApp",
        count: total,
        pct: 100,
        color: "bg-blue-500",
        textColor: "text-blue-600 dark:text-blue-400",
        bgColor: "bg-blue-500/10",
        borderColor: "border-blue-500/30",
        icon: Filter,
      },
      {
        id: "bot",
        title: "2. Contención IA",
        description: "Resueltos 100% de forma autónoma",
        count: botClosed,
        pct: botPct,
        color: "bg-cyan-500",
        textColor: "text-cyan-600 dark:text-cyan-400",
        bgColor: "bg-cyan-500/10",
        borderColor: "border-cyan-500/30",
        icon: Bot,
      },
      {
        id: "human",
        title: "3. Escalados a Asesores",
        description: "Requirieron intervención humana",
        count: humanHandled,
        pct: humanPct,
        color: "bg-amber-500",
        textColor: "text-amber-600 dark:text-amber-400",
        bgColor: "bg-amber-500/10",
        borderColor: "border-amber-500/30",
        icon: UserCheck,
      },
      {
        id: "completed",
        title: "4. Casos Resueltos",
        description: "Solucionados y cerrados con éxito",
        count: totalCompleted,
        pct: completionPct,
        color: "bg-emerald-500",
        textColor: "text-emerald-600 dark:text-emerald-400",
        bgColor: "bg-emerald-500/10",
        borderColor: "border-emerald-500/30",
        icon: CheckCircle2,
      },
    ];
  }, [overview, aiEfficiency]);

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-5 shadow-xs animate-pulse">
        <div className="h-6 w-48 bg-muted rounded-md mb-3" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-muted/40 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 border-b border-border pb-3">
        <div>
          <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-foreground flex items-center gap-2">
            <Filter className="size-4 text-primary" /> Embudo de Atención y Eficiencia Operativa
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Flujo de casos: desde la recepción inicial hasta la resolución autónoma por IA o por
            asesores.
          </p>
        </div>
        <div className="text-xs font-mono font-semibold text-muted-foreground">
          Tasa Global de Cierre:{" "}
          <span className="font-bold text-foreground">{funnelSteps[3]?.pct ?? 0}%</span>
        </div>
      </div>

      {/* Pasos del Embudo en Tarjetas Progresivas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {funnelSteps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div
              key={step.id}
              className={`p-4 rounded-xl border ${step.borderColor} ${step.bgColor} relative overflow-hidden flex flex-col justify-between shadow-xs transition-all hover:shadow-md`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider ${step.textColor}`}
                  >
                    {step.title}
                  </span>
                  <div
                    className={`size-7 rounded-lg grid place-items-center bg-background/80 ${step.textColor}`}
                  >
                    <Icon className="size-3.5" />
                  </div>
                </div>

                <div className="flex items-baseline justify-between mt-2">
                  <p className="text-2xl font-mono font-extrabold text-foreground">{step.count}</p>
                  {step.id === "human" && step.count > 0 && (
                    <Link
                      to="/escalaciones"
                      title="Ir a la Mesa de Casos Escalados"
                      className="text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:underline"
                    >
                      Ver mesa →
                    </Link>
                  )}
                  {step.id === "completed" && step.count > 0 && (
                    <Link
                      to="/bandeja"
                      search={{ tab: "resolved" }}
                      title="Ver casos resueltos en la bandeja"
                      className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      Bandeja →
                    </Link>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">{step.description}</p>
              </div>

              <div className="mt-4 pt-2.5 border-t border-border/40">
                <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                  <span className="text-muted-foreground">Proporción</span>
                  <span className={`font-bold ${step.textColor}`}>{step.pct}%</span>
                </div>
                <div className="w-full bg-background/80 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${step.color}`}
                    style={{ width: `${Math.min(step.pct, 100)}%` }}
                  />
                </div>
              </div>

              {idx < funnelSteps.length - 1 && (
                <div className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-muted-foreground/40">
                  <ArrowRight className="size-4" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
