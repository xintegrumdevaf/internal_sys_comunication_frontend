import React from "react";
import { Send, CheckCheck, Eye, CornerDownLeft, Clock, AlertCircle, Info, RotateCw } from "lucide-react";

export type ActiveFilter = "ALL" | "sent" | "delivered" | "read" | "replied" | "failed" | "queued";

export interface CampaignMetricsData {
  total: number;
  processed: number;
  queued: number;
  retrying?: number;
  failed: number;
  sent: number;
  delivered: number;
  read: number;
  replied: number;
}

interface CampaignFunnelCardProps {
  metrics: CampaignMetricsData;
  activeFilter: ActiveFilter;
  onFilterChange: (filter: ActiveFilter) => void;
}

export const CampaignFunnelCard: React.FC<CampaignFunnelCardProps> = ({
  metrics,
  activeFilter,
  onFilterChange,
}) => {
  const sentPct = 100;
  const baseSent = Math.max(metrics.sent, 1);
  const deliveredPct = ((metrics.delivered / baseSent) * 100).toFixed(1);
  const readPct = ((metrics.read / baseSent) * 100).toFixed(1);
  const repliedPct = ((metrics.replied / baseSent) * 100).toFixed(1);

  const toggleFilter = (f: ActiveFilter) => {
    onFilterChange(activeFilter === f ? "ALL" : f);
  };

  return (
    <div className="space-y-4">
      {/* KPI Stats Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl border border-border/80 bg-card/60 backdrop-blur-xs shadow-xs">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight font-mono">
            {metrics.total}
          </span>
          <span className="text-xs sm:text-sm font-semibold text-muted-foreground">
            contactos en la campaña
          </span>
        </div>

        <div className="flex items-center gap-2">
          {Boolean(metrics.retrying && metrics.retrying > 0) && (
            <div className="border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 animate-pulse">
              <RotateCw className="w-3.5 h-3.5 animate-spin text-amber-600 dark:text-amber-400" />
              <span>{metrics.retrying} en reintento automático</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => toggleFilter("queued")}
            className={`border px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeFilter === "queued"
                ? "bg-amber-500/20 border-amber-500/50 text-amber-500 shadow-xs"
                : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/60"
            }`}
          >
            <Clock className="w-3.5 h-3.5 opacity-70" />
            <span>{metrics.queued} en la cola</span>
          </button>

          <button
            type="button"
            onClick={() => toggleFilter("failed")}
            className={`border px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeFilter === "failed"
                ? "bg-red-500/20 border-red-500/50 text-red-500 shadow-xs"
                : "bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20"
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5 text-red-500" />
            <span>{metrics.failed} fallaron</span>
          </button>
        </div>
      </div>

      {/* Progress Line */}
      <div className="w-full bg-muted/40 h-2 rounded-full overflow-hidden flex border border-border/70">
        <div
          className="bg-primary h-full transition-all duration-500"
          style={{ width: `${(metrics.sent / Math.max(metrics.total, 1)) * 100}%` }}
          title={`Enviados: ${metrics.sent}`}
        />
        {metrics.failed > 0 && (
          <div
            className="bg-red-500 h-full transition-all duration-500"
            style={{ width: `${(metrics.failed / Math.max(metrics.total, 1)) * 100}%` }}
            title={`Fallidos: ${metrics.failed}`}
          />
        )}
      </div>

      {/* Funnel Rates Card */}
      <div className="bg-card/70 border border-border/80 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xs backdrop-blur-xs">
        {/* Enviadas */}
        <div
          onClick={() => toggleFilter("sent")}
          className={`flex items-center group cursor-pointer p-1.5 rounded-xl transition-colors ${
            activeFilter === "sent" ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-muted/40"
          }`}
          title="Haz clic para filtrar mensajes enviados"
        >
          <div className="flex items-center w-32 shrink-0">
            <Send className="w-4 h-4 text-primary mr-2" />
            <span className="text-xs font-bold text-foreground">Enviadas</span>
          </div>
          <div className="flex-1 bg-muted/40 h-3 rounded-full overflow-hidden p-0.5 border border-border/60">
            <div
              className="bg-primary h-full rounded-full transition-all duration-500"
              style={{ width: `${sentPct}%` }}
            />
          </div>
          <div className="flex items-baseline justify-end w-28 shrink-0 pl-3 font-mono">
            <span className="font-bold text-foreground text-xs mr-1">{metrics.sent}</span>
            <span className="text-[10px] text-muted-foreground uppercase">base 100%</span>
          </div>
        </div>

        {/* Entregadas */}
        <div
          onClick={() => toggleFilter("delivered")}
          className={`flex items-center group cursor-pointer p-1.5 rounded-xl transition-colors ${
            activeFilter === "delivered"
              ? "bg-emerald-500/10 ring-1 ring-emerald-500/30"
              : "hover:bg-muted/40"
          }`}
          title="Haz clic para filtrar entregadas"
        >
          <div className="flex items-center w-32 shrink-0">
            <CheckCheck className="w-4 h-4 text-emerald-500 mr-2" />
            <span className="text-xs font-bold text-foreground">Entregadas</span>
          </div>
          <div className="flex-1 bg-muted/40 h-3 rounded-full overflow-hidden p-0.5 border border-border/60">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${deliveredPct}%` }}
            />
          </div>
          <div className="flex items-baseline justify-end w-28 shrink-0 pl-3 font-mono">
            <span className="font-bold text-foreground text-xs mr-1">{metrics.delivered}</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
              {deliveredPct}%
            </span>
          </div>
        </div>

        {/* Leídas */}
        <div
          onClick={() => toggleFilter("read")}
          className={`flex items-center group cursor-pointer p-1.5 rounded-xl transition-colors ${
            activeFilter === "read" ? "bg-blue-500/10 ring-1 ring-blue-500/30" : "hover:bg-muted/40"
          }`}
          title="Haz clic para filtrar leídas"
        >
          <div className="flex items-center w-32 shrink-0">
            <Eye className="w-4 h-4 text-blue-500 mr-2" />
            <span className="text-xs font-bold text-foreground">Leídas</span>
          </div>
          <div className="flex-1 bg-muted/40 h-3 rounded-full overflow-hidden p-0.5 border border-border/60">
            <div
              className="bg-blue-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${readPct}%` }}
            />
          </div>
          <div className="flex items-baseline justify-end w-28 shrink-0 pl-3 font-mono">
            <span className="font-bold text-foreground text-xs mr-1">{metrics.read}</span>
            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">
              {readPct}%
            </span>
          </div>
        </div>

        {/* Respondieron */}
        <div
          onClick={() => toggleFilter("replied")}
          className={`flex items-center group cursor-pointer p-1.5 rounded-xl transition-colors ${
            activeFilter === "replied"
              ? "bg-purple-500/10 ring-1 ring-purple-500/30"
              : "hover:bg-muted/40"
          }`}
          title="Haz clic para filtrar quienes respondieron"
        >
          <div className="flex items-center w-32 shrink-0">
            <CornerDownLeft className="w-4 h-4 text-purple-500 mr-2" />
            <span className="text-xs font-bold text-foreground">Respondieron</span>
          </div>
          <div className="flex-1 bg-muted/40 h-3 rounded-full overflow-hidden p-0.5 border border-border/60">
            <div
              className="bg-purple-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${repliedPct}%` }}
            />
          </div>
          <div className="flex items-baseline justify-end w-28 shrink-0 pl-3 font-mono">
            <span className="font-bold text-foreground text-xs mr-1">{metrics.replied}</span>
            <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold">
              {repliedPct}%
            </span>
          </div>
        </div>

        {/* Nota informativa */}
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-1 border-t border-border/40">
          <Info className="w-3.5 h-3.5 text-primary shrink-0" />
          <span>
            Tasas calculadas sobre las enviadas. Haz clic en cualquier nivel del embudo para filtrar
            los contactos.
          </span>
        </div>
      </div>
    </div>
  );
};
