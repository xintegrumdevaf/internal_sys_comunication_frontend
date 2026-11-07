import React, { useMemo } from "react";
import { Megaphone, Send, CheckCheck, PlayCircle, Clock } from "lucide-react";
import type { Campaign } from "../domain/campaign";

interface CampaignsMetricsHeaderProps {
  campaigns: Campaign[];
}

export const CampaignsMetricsHeader: React.FC<CampaignsMetricsHeaderProps> = ({ campaigns }) => {
  const summary = useMemo(() => {
    let totalSent = 0;
    let totalRecipients = 0;
    let runningCount = 0;
    let completedCount = 0;
    let draftCount = 0;

    campaigns.forEach((c) => {
      const sent = Math.max(0, c.sentCount || 0);
      const total = Math.max(0, c.totalRecipients || 0);
      totalSent += sent;
      totalRecipients += total;

      if (c.status === "RUNNING") runningCount++;
      else if (c.status === "COMPLETED" || c.status === "FINISHED") completedCount++;
      else if (c.status === "DRAFT") draftCount++;
    });

    const completionRate =
      totalRecipients > 0 ? Math.min(100, Math.round((totalSent / totalRecipients) * 100)) : 0;

    return {
      totalCampaigns: campaigns.length,
      totalSent,
      totalRecipients,
      runningCount,
      completedCount,
      draftCount,
      completionRate,
    };
  }, [campaigns]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 w-full">
      {/* Tarjeta 1: Total de Campañas */}
      <div className="p-3.5 sm:p-4 rounded-2xl border border-border/80 bg-card/70 backdrop-blur-xs shadow-xs space-y-1">
        <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
          <span>Total Campañas</span>
          <div className="p-1.5 rounded-xl bg-primary/10 text-primary">
            <Megaphone className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-bold font-mono text-foreground">
          {summary.totalCampaigns}
        </div>
        <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
          <span className="text-emerald-500 font-bold">{summary.completedCount} terminadas</span>
          <span>•</span>
          <span>{summary.draftCount} borradores</span>
        </div>
      </div>

      {/* Tarjeta 2: Mensajes Enviados */}
      <div className="p-3.5 sm:p-4 rounded-2xl border border-border/80 bg-card/70 backdrop-blur-xs shadow-xs space-y-1">
        <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
          <span>Mensajes Despachados</span>
          <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-500">
            <Send className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-bold font-mono text-foreground">
          {summary.totalSent.toLocaleString("es-CO")}
        </div>
        <div className="text-[11px] text-muted-foreground">
          de {summary.totalRecipients.toLocaleString("es-CO")} contactos cargados
        </div>
      </div>

      {/* Tarjeta 3: Tasa de Procesamiento Global */}
      <div className="p-3.5 sm:p-4 rounded-2xl border border-border/80 bg-card/70 backdrop-blur-xs shadow-xs space-y-1">
        <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
          <span>Efectividad de Envío</span>
          <div className="p-1.5 rounded-xl bg-blue-500/10 text-blue-500">
            <CheckCheck className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-bold font-mono text-foreground">
          {summary.completionRate}%
        </div>
        <div className="text-[11px] text-muted-foreground">
          {summary.totalRecipients > 0 ? "Cobertura de base de datos" : "Sin base cargada"}
        </div>
      </div>

      {/* Tarjeta 4: En Ejecución (Workers Activos) */}
      <div className="p-3.5 sm:p-4 rounded-2xl border border-border/80 bg-card/70 backdrop-blur-xs shadow-xs space-y-1">
        <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
          <span>En Ejecución (Workers)</span>
          <div
            className={`p-1.5 rounded-xl ${
              summary.runningCount > 0
                ? "bg-emerald-500/10 text-emerald-500"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {summary.runningCount > 0 ? (
              <PlayCircle className="w-3.5 h-3.5 animate-pulse" />
            ) : (
              <Clock className="w-3.5 h-3.5" />
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xl sm:text-2xl font-bold font-mono text-foreground">
            {summary.runningCount}
          </span>
          {summary.runningCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              En segundo plano
            </span>
          )}
        </div>
        <div className="text-[11px] text-muted-foreground">
          {summary.runningCount > 0 ? "Workers procesando en Redis" : "No hay envíos activos"}
        </div>
      </div>
    </div>
  );
};
