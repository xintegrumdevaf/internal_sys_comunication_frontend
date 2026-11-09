import React, { useState, useMemo } from "react";
import { X, Megaphone, Download, RefreshCw, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { CampaignRecipient } from "../domain/campaign";
import { calculateCampaignMetrics, campaignStatusMeta } from "../domain/campaign";
import { useCampaignDetails } from "../application/use-campaigns";
import { CampaignFunnelCard, type ActiveFilter } from "./CampaignFunnelCard";
import { CampaignRecipientsTable } from "./CampaignRecipientsTable";

type Props = {
  campaignId: string | null;
  onClose: () => void;
};

export const CampaignDetailsDrawer: React.FC<Props> = ({ campaignId, onClose }) => {
  const { campaign, loading } = useCampaignDetails(campaignId);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("ALL");

  const metrics = useMemo(() => {
    if (!campaign) {
      return {
        total: 0,
        processed: 0,
        queued: 0,
        failed: 0,
        sent: 0,
        delivered: 0,
        read: 0,
        replied: 0,
      };
    }
    return calculateCampaignMetrics(campaign);
  }, [campaign]);

  if (!campaignId) return null;

  const recipientsList: CampaignRecipient[] = campaign?.recipients || [];

  const formattedCreatedDate = campaign?.createdAt
    ? new Date(campaign.createdAt).toLocaleDateString("es-CO", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const handleDownloadFailedCsv = () => {
    const failedItems = recipientsList.filter((r) => r.status === "failed");
    if (failedItems.length === 0) {
      toast.info("No hay contactos fallidos para descargar.");
      return;
    }

    const headers = "number,name,errorMessage,updatedAt\n";
    const rows = failedItems
      .map(
        (r) =>
          `"${r.phone || r.number || ""}","${r.name || ""}","${(
            r.errorMessage ||
            r.body ||
            ""
          ).replace(/"/g, '""')}","${r.updatedAt || ""}"`,
      )
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fallidas_${campaign?.name || "campana"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Descargado archivo con ${failedItems.length} destinatarios fallidos.`);
  };

  const handleRetryFailed = () => {
    if (campaign?.status === "RUNNING") {
      toast.warning("La campaña está en ejecución. Los reintentos automáticos están activos para evitar duplicados.");
      return;
    }
    if (metrics.failed === 0) {
      toast.info("No hay contactos fallidos que reprogramar.");
      return;
    }
    toast.success(`Se reprogramaron ${metrics.failed} mensajes fallidos en la cola de envío.`);
  };

  const statusMeta = campaign
    ? campaignStatusMeta(campaign.status)
    : { label: "Cargando...", badgeClass: "" };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 animate-fade-in">
      <div className="bg-card border border-border text-card-foreground rounded-3xl w-full max-w-5xl max-h-[92vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Header Superior */}
        <div className="p-4 md:p-5 border-b border-border/80 bg-muted/20 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary text-primary-foreground p-2.5 rounded-2xl flex items-center justify-center shrink-0 shadow-xs">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                  {campaign?.name || "Campaña"}
                </h2>
                <Badge variant="outline" className={`text-xs ${statusMeta.badgeClass}`}>
                  {statusMeta.label}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap mt-1">
                <span className="flex items-center gap-1.5 text-primary font-semibold">
                  <MessageSquare className="w-3.5 h-3.5" />
                  {campaign?.lineName || "Xgo Soporte Ariel"}
                </span>
                <span>•</span>
                <span>creada {formattedCreatedDate || "31/08 a las 11:51"}</span>
                <span>•</span>
                <span className="font-mono">
                  {metrics.processed} de {metrics.total} procesados
                </span>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-xl cursor-pointer"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Dynamic Modal Content */}
        {loading || !campaign ? (
          <div className="flex-1 p-16 grid place-items-center text-muted-foreground text-sm font-mono">
            <RefreshCw className="w-6 h-6 animate-spin text-primary mb-3" />
            Cargando información y métricas de la campaña...
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
            {/* KPI y Embudo de Conversión */}
            <CampaignFunnelCard
              metrics={metrics}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
            />

            {/* Tabla de Contactos con Paginación */}
            <CampaignRecipientsTable
              recipients={recipientsList}
              campaign={campaign}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
            />
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-4 border-t border-border/80 bg-muted/20 flex flex-wrap items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
          >
            Cerrar
          </Button>
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadFailedCsv}
              className="text-xs font-semibold gap-1.5 rounded-xl cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Descargar fallidas (CSV)
            </Button>
            <Button
              variant="default"
              size="sm"
              disabled={campaign?.status === "RUNNING" || metrics.failed === 0}
              onClick={handleRetryFailed}
              className="text-xs font-semibold gap-1.5 rounded-xl shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title={
                campaign?.status === "RUNNING"
                  ? "La campaña está en ejecución. Los fallos transitorios se están reintentando automáticamente con backoff para evitar duplicados."
                  : undefined
              }
            >
              <RefreshCw className={`w-3.5 h-3.5 ${campaign?.status === "RUNNING" ? "animate-spin text-amber-500" : ""}`} />
              {campaign?.status === "RUNNING"
                ? "Reintentando automáticamente..."
                : `Reprogramar ${metrics.failed} fallidas`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignDetailsDrawer;
