import { useState, useMemo } from "react";
import { HelpCircle, AlertCircle, ArrowLeft, ChevronRight, Layers } from "lucide-react";
import type { CasesDistributionDto } from "../domain/analytics.types";
import { formatWorkflow, formatEscalationReason } from "../domain/analytics-translations";

interface RootCausesChartProps {
  distribution?: CasesDistributionDto | null;
  isLoading?: boolean;
}

const BAR_COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-cyan-500",
];

export function RootCausesChart({ distribution, isLoading }: RootCausesChartProps) {
  // Estado para el desglose interactivo (drill-down por departamento/área)
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);

  const { workflowData, selectedWorkflowItem, categorySpecificReasons, dedupedGlobalReasons } =
    useMemo(() => {
      const rawWorkflows =
        distribution?.byWorkflow.map((item, idx) => ({
          id: item.workflowType,
          label: formatWorkflow(item.workflowType),
          count: item.count,
          percentage: item.percentage,
          color: BAR_COLORS[idx % BAR_COLORS.length],
        })) ?? [];

      const rawReasons =
        distribution?.topEscalationReasons.map((item) => ({
          id: `${item.workflowType ?? "all"}_${item.reason}`,
          workflowType: item.workflowType,
          rawReason: item.reason,
          label: formatEscalationReason(item.reason),
          count: item.count,
          percentage: item.percentage,
        })) ?? [];

      // Deduplicación de causas globales sumando ocurrencias de distintas áreas
      const globalMap = new Map<string, { label: string; count: number }>();
      for (const r of rawReasons) {
        const existing = globalMap.get(r.label);
        if (existing) {
          existing.count += r.count;
        } else {
          globalMap.set(r.label, { label: r.label, count: r.count });
        }
      }
      const dedupedGlobal = Array.from(globalMap.values()).sort((a, b) => b.count - a.count);

      const currentItem = rawWorkflows.find((w) => w.id === selectedWorkflow) ?? null;

      // Filtrar causas específicas si hay un workflow seleccionado en drill-down
      const specific = selectedWorkflow
        ? rawReasons.filter((e) => !e.workflowType || e.workflowType === selectedWorkflow)
        : rawReasons;

      const specificTotal = specific.reduce((acc, s) => acc + s.count, 0);
      const specificWithLocalPct = specific.map((s) => ({
        ...s,
        localPercentage:
          specificTotal > 0 ? Math.round((s.count / specificTotal) * 1000) / 10 : s.percentage,
      }));

      return {
        workflowData: rawWorkflows,
        selectedWorkflowItem: currentItem,
        categorySpecificReasons: specificWithLocalPct,
        dedupedGlobalReasons: dedupedGlobal,
      };
    }, [distribution, selectedWorkflow]);

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-5 shadow-xs animate-pulse">
        <div className="h-6 w-48 bg-muted rounded-md mb-3" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 bg-muted/40 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // Mostramos máximo 5 áreas para evitar desbordes y que la tarjeta no genere scroll interno
  const displayedWorkflows = workflowData.slice(0, 5);

  return (
    <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
      <div>
        {/* Cabecera dinámica con navegación de regreso */}
        <div className="flex items-center justify-between mb-3 border-b border-border pb-3">
          <div className="flex items-center gap-2">
            {selectedWorkflow ? (
              <button
                type="button"
                onClick={() => setSelectedWorkflow(null)}
                className="size-8 rounded-lg border border-border bg-background hover:bg-foreground/5 grid place-items-center text-foreground transition-all cursor-pointer shadow-xs"
                title="Volver a todas las áreas"
              >
                <ArrowLeft className="size-4" />
              </button>
            ) : (
              <div className="size-8 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
                <HelpCircle className="size-4" />
              </div>
            )}
            <div>
              <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-foreground flex items-center gap-1.5">
                {selectedWorkflowItem ? (
                  <>
                    <span>{selectedWorkflowItem.label}</span>
                    <span className="text-[10px] text-muted-foreground font-normal">
                      · Desglose de Motivos
                    </span>
                  </>
                ) : (
                  "Top Motivos Reales de Consulta (Causa Raíz)"
                )}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {selectedWorkflowItem
                  ? `Problemáticas detectadas en ${selectedWorkflowItem.label}.`
                  : "Presiona un área para ver sus problemas específicos sin desbordes."}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-mono font-bold text-foreground">
              {selectedWorkflowItem
                ? `${selectedWorkflowItem.count} casos (${selectedWorkflowItem.percentage}%)`
                : `Total: ${distribution?.totalCases ?? 0} casos`}
            </span>
          </div>
        </div>

        {/* Vista 1: Drill-down de motivos específicos del área seleccionada */}
        {selectedWorkflow && selectedWorkflowItem ? (
          <div className="space-y-3 my-2 animate-fade-in">
            {categorySpecificReasons.length > 0 ? (
              <div className="space-y-2.5">
                {categorySpecificReasons.slice(0, 5).map((reason, idx) => (
                  <div key={reason.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-foreground flex items-center gap-2 truncate">
                        <span className="text-[10px] font-mono text-muted-foreground w-4 shrink-0">
                          #{idx + 1}
                        </span>
                        <span className="truncate">{reason.label}</span>
                      </span>
                      <span className="font-mono text-muted-foreground shrink-0 ml-2">
                        <span className="font-extrabold text-foreground">{reason.count}</span> casos
                        ({reason.localPercentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-muted/60 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 bg-primary"
                        style={{ width: `${Math.min(reason.localPercentage, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-muted-foreground">
                <p>No se registraron fallas complejas para {selectedWorkflowItem.label}.</p>
                <p className="text-[11px] mt-1 text-muted-foreground/80">
                  Las consultas fueron atendidas en el flujo estándar.
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Vista 2: Ranking General por Área (Sin scroll interno forzado) */
          <div className="space-y-2.5 my-2">
            {displayedWorkflows.map((item, index) => (
              <div
                key={item.id}
                onClick={() => setSelectedWorkflow(item.id)}
                className="p-1.5 -mx-1.5 rounded-xl hover:bg-foreground/5 cursor-pointer transition-all space-y-1 group"
                title={`Haz clic para ver el desglose detallado de ${item.label}`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                    <span className="text-[10px] font-mono text-muted-foreground w-4">
                      #{index + 1}
                    </span>
                    <span>{item.label}</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-muted-foreground">
                      <span className="font-extrabold text-foreground">{item.count}</span> casos (
                      {item.percentage}%)
                    </span>
                    <ChevronRight className="size-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
                <div className="w-full bg-muted/60 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${item.color}`}
                    style={{ width: `${Math.min(item.percentage, 100)}%` }}
                  />
                </div>
              </div>
            ))}

            {displayedWorkflows.length === 0 && (
              <div className="py-6 text-center text-xs text-muted-foreground">
                No hay datos registrados en el rango seleccionado.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mini-sección inferior: Causas globales de derivación (Deduplicadas y fijas a máximo 4) */}
      {!selectedWorkflow && dedupedGlobalReasons.length > 0 && (
        <div className="mt-3 pt-2.5 border-t border-border/60">
          <div className="flex items-center justify-between text-[11px] font-bold text-amber-600 dark:text-amber-400 mb-1.5">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="size-3.5" />
              <span>Causas frecuentes de derivación a asesor:</span>
            </div>
            <span className="text-[10px] font-normal text-muted-foreground hidden sm:flex items-center gap-1">
              <Layers className="size-3" /> Clic en un área para aislar
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {dedupedGlobalReasons.slice(0, 4).map((e) => (
              <span
                key={e.label}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-background border border-border text-[10px] font-medium text-foreground shadow-xs"
              >
                <span>{e.label}</span>
                <span className="font-mono font-bold text-muted-foreground">({e.count})</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
