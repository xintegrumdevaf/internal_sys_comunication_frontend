import { useState } from "react";
import { X, CheckCircle2, AlertTriangle, Clock, RefreshCw } from "lucide-react";
import type { Campaign } from "../domain/campaign";
import { useCampaignDetails } from "../application/use-campaigns";

type Props = {
  campaignId: string | null;
  onClose: () => void;
};

export function CampaignDetailsDrawer({ campaignId, onClose }: Props) {
  const { campaign, loading } = useCampaignDetails(campaignId);
  const [filterStatus, setFilterStatus] = useState<"all" | "failed" | "delivered" | "sent">("all");

  if (!campaignId) return null;

  const filteredRecipients = (campaign?.recipients || []).filter((r) => {
    if (filterStatus === "all") return true;
    return r.status === filterStatus;
  });

  const deliveredCount = campaign?.deliveredCount ?? 0;
  const failedCount = campaign?.failedCount ?? 0;
  const progress = campaign?.progress ?? 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-end p-0 animate-fade-in">
      <div className="bg-card border-l border-border h-full w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border bg-muted/40 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-primary">
              Detalle de Monitoreo de Campaña
            </span>
            <h3 className="text-sm font-extrabold font-mono">{campaign?.name || "Cargando..."}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-7 rounded-lg hover:bg-foreground/10 grid place-items-center text-muted-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content */}
        {loading || !campaign ? (
          <div className="flex-1 grid place-items-center text-muted-foreground text-xs font-mono">
            <RefreshCw className="size-5 animate-spin text-primary mb-2" />
            Cargando estadísticas en tiempo real...
          </div>
        ) : (
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            {/* Resumen KPIs de campaña */}
            <div className="grid grid-cols-4 gap-3 text-mono text-xs">
              <div className="p-3 bg-background rounded-xl border border-border">
                <p className="text-[9px] uppercase font-bold text-muted-foreground">
                  Total Recibos
                </p>
                <p className="text-base font-extrabold font-mono mt-0.5">
                  {campaign.totalRecipients}
                </p>
              </div>
              <div className="p-3 bg-background rounded-xl border border-border">
                <p className="text-[9px] uppercase font-bold text-muted-foreground">Enviados</p>
                <p className="text-base font-extrabold font-mono mt-0.5">{campaign.sentCount}</p>
              </div>
              <div className="p-3 bg-background rounded-xl border border-border">
                <p className="text-[9px] uppercase font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="size-3" /> Entregados
                </p>
                <p className="text-base font-extrabold font-mono mt-0.5 text-emerald-400">
                  {deliveredCount}
                </p>
              </div>
              <div className="p-3 bg-danger/10 border border-danger/20 rounded-xl">
                <p className="text-[9px] uppercase font-bold text-danger flex items-center gap-1">
                  <AlertTriangle className="size-3" /> Fallidos
                </p>
                <p className="text-base font-extrabold font-mono mt-0.5 text-danger font-bold">
                  {failedCount}
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="bg-background border border-border p-3 rounded-xl space-y-1.5">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-muted-foreground">Avance global del envío:</span>
                <span className="font-bold text-primary">{progress}%</span>
              </div>
              <div className="w-full bg-muted/40 h-2.5 rounded-full overflow-hidden border border-border">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Listado de destinatarios */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
                  Desglose por Número ({filteredRecipients.length})
                </h4>
                <div className="flex gap-1 text-[10px] font-mono">
                  <button
                    type="button"
                    onClick={() => setFilterStatus("all")}
                    className={`px-2 py-0.5 rounded border ${
                      filterStatus === "all"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border"
                    }`}
                  >
                    Todos ({campaign.recipients?.length || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterStatus("failed")}
                    className={`px-2 py-0.5 rounded border ${
                      filterStatus === "failed"
                        ? "bg-danger text-white border-danger"
                        : "border-border text-danger"
                    }`}
                  >
                    Fallidos ({failedCount})
                  </button>
                </div>
              </div>

              <div className="border border-border rounded-xl overflow-hidden bg-background divide-y divide-border">
                {filteredRecipients.length > 0 ? (
                  filteredRecipients.map((rec, idx) => (
                    <div
                      key={idx}
                      className="p-3 text-xs space-y-1 hover:bg-card/50 transition-colors"
                    >
                      <div className="flex items-center justify-between font-mono">
                        <span className="font-bold text-foreground">{rec.phone || rec.number}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            rec.status === "delivered"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : rec.status === "failed"
                                ? "bg-danger/15 text-danger font-bold"
                                : "bg-info/10 text-info"
                          }`}
                        >
                          {rec.status || "pendiente"}
                        </span>
                      </div>

                      {/* Variables utilizadas */}
                      {rec.variables && Object.keys(rec.variables).length > 0 && (
                        <div className="text-[10px] font-mono text-muted-foreground flex flex-wrap gap-1 pt-0.5">
                          {Object.entries(rec.variables ?? {}).map(([k, v]) => (
                            <span
                              key={k}
                              className="px-1.5 py-0.5 rounded bg-card border border-border"
                            >
                              {`{{${k}}}`}: <strong className="text-foreground">{v}</strong>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Detalle explícito si falló */}
                      {rec.status === "failed" && rec.errorMessage && (
                        <p className="text-[11px] text-danger font-semibold bg-danger/10 p-1.5 rounded border border-danger/20 flex items-center gap-1.5 mt-1">
                          <AlertTriangle className="size-3.5 shrink-0" />
                          Motivo: {rec.errorMessage}
                        </p>
                      )}

                      {rec.sentAt && (
                        <p className="text-[9px] text-muted-foreground font-mono flex items-center gap-1 pt-0.5">
                          <Clock className="size-2.5" /> Enviado a las {rec.sentAt}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="p-4 text-center text-muted-foreground text-xs italic">
                    Sin destinatarios para el filtro seleccionado.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
