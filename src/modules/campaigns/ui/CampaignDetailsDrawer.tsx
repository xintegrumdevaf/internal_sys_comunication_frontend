import React, { useState, useMemo } from "react";
import {
  X,
  Megaphone,
  Clock,
  AlertCircle,
  Send,
  CheckCheck,
  Eye,
  CornerDownLeft,
  Info,
  Search,
  ExternalLink,
  Download,
  RefreshCw,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { CampaignRecipient } from "../domain/campaign";
import { calculateCampaignMetrics, campaignStatusMeta } from "../domain/campaign";
import { useCampaignDetails } from "../application/use-campaigns";

type Props = {
  campaignId: string | null;
  onClose: () => void;
};

type ActiveFilter = "ALL" | "sent" | "delivered" | "read" | "replied" | "failed" | "queued";

export const CampaignDetailsDrawer: React.FC<Props> = ({ campaignId, onClose }) => {
  const { campaign, loading } = useCampaignDetails(campaignId);
  const [searchTerm, setSearchTerm] = useState("");
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

  // Filter contacts by active status filter and search term
  const filteredRecipients = recipientsList.filter((r) => {
    const status = r.status || "sent";

    let matchesFilter = true;
    if (activeFilter === "sent") {
      matchesFilter = ["sent", "delivered", "read", "replied"].includes(status);
    } else if (activeFilter === "delivered") {
      matchesFilter = ["delivered", "read", "replied"].includes(status);
    } else if (activeFilter === "read") {
      matchesFilter = ["read", "replied"].includes(status);
    } else if (activeFilter === "replied") {
      matchesFilter = status === "replied";
    } else if (activeFilter === "failed") {
      matchesFilter = status === "failed";
    } else if (activeFilter === "queued") {
      matchesFilter = status === "queued";
    }

    if (!matchesFilter) return false;

    if (!searchTerm.trim()) return true;

    const term = searchTerm.toLowerCase().trim();
    const nameMatch = (r.name || "").toLowerCase().includes(term);
    const numberMatch = (r.number || r.phone || "").includes(term);
    const bodyMatch = (r.body || "").toLowerCase().includes(term);

    return nameMatch || numberMatch || bodyMatch;
  });

  const sentPct = 100;
  const baseSent = Math.max(metrics.sent, 1);
  const deliveredPct = ((metrics.delivered / baseSent) * 100).toFixed(1);
  const readPct = ((metrics.read / baseSent) * 100).toFixed(1);
  const repliedPct = ((metrics.replied / baseSent) * 100).toFixed(1);

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
          `"${r.number || r.phone}","${r.name || ""}","${(r.errorMessage || r.body || "").replace(
            /"/g,
            '""'
          )}","${r.updatedAt || ""}"`
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
    if (metrics.failed === 0) {
      toast.info("No hay contactos fallidos que reprogramar.");
      return;
    }
    toast.success(`Se reprogramaron ${metrics.failed} mensajes fallidos en la cola de envío.`);
  };

  const statusMeta = campaign ? campaignStatusMeta(campaign.status) : { label: "Cargando...", badgeClass: "" };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 animate-fade-in">
      <div className="bg-card border border-border text-card-foreground rounded-2xl w-full max-w-4xl max-h-[92vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Header Superior */}
        <div className="p-4 md:p-5 border-b border-border bg-muted/20 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary text-primary-foreground p-2.5 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-foreground tracking-tight">{campaign?.name || "Campaña"}</h2>
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
                <span>
                  {metrics.processed} de {metrics.total} procesados
                </span>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Dynamic Modal Content */}
        {loading || !campaign ? (
          <div className="flex-1 p-12 grid place-items-center text-muted-foreground text-sm font-mono">
            <RefreshCw className="w-6 h-6 animate-spin text-primary mb-3" />
            Cargando resumen de información de la campaña...
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
            {/* KPI Header Stats */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-baseline">
                <span className="text-3xl font-extrabold text-foreground tracking-tight">{metrics.total}</span>
                <span className="text-muted-foreground text-sm font-medium ml-2.5">contactos en la campaña</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveFilter(activeFilter === "queued" ? "ALL" : "queued")}
                  className={`border px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 transition-colors ${
                    activeFilter === "queued"
                      ? "bg-amber-500/20 border-amber-500/40 text-amber-500 font-semibold"
                      : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/60"
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 opacity-70" />
                  <span>{metrics.queued} en la cola</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveFilter(activeFilter === "failed" ? "ALL" : "failed")}
                  className={`border px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    activeFilter === "failed"
                      ? "bg-danger/20 border-danger/40 text-danger"
                      : "bg-danger/10 border-danger/20 text-danger hover:bg-danger/20"
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5 text-danger" />
                  <span>{metrics.failed} fallaron</span>
                </button>
              </div>
            </div>

            {/* Top Multi-color Progress Indicator Bar */}
            <div className="w-full bg-muted/40 h-1.5 rounded-full overflow-hidden flex border border-border">
              <div
                className="bg-primary h-full transition-all duration-500"
                style={{ width: `${(metrics.sent / Math.max(metrics.total, 1)) * 100}%` }}
              />
              {metrics.failed > 0 && (
                <div
                  className="bg-danger h-full transition-all duration-500"
                  style={{ width: `${(metrics.failed / Math.max(metrics.total, 1)) * 100}%` }}
                />
              )}
            </div>

            {/* Funnel Rates Card */}
            <div className="bg-card border border-border rounded-xl p-4 md:p-5 space-y-3.5 shadow-sm">
              {/* Row 1: Enviadas */}
              <div
                onClick={() => setActiveFilter(activeFilter === "sent" ? "ALL" : "sent")}
                className="flex items-center group cursor-pointer"
                title="Haz clic para filtrar mensajes enviados"
              >
                <div className="flex items-center w-32 shrink-0">
                  <Send className="w-4 h-4 text-muted-foreground mr-2 group-hover:text-primary transition-colors" />
                  <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                    Enviadas
                  </span>
                </div>
                <div className="flex-1 bg-muted/40 h-3.5 rounded-full overflow-hidden p-0.5 border border-border">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-500"
                    style={{ width: `${sentPct}%` }}
                  />
                </div>
                <div className="flex items-baseline justify-end w-28 shrink-0 pl-3">
                  <span className="font-extrabold text-foreground text-xs mr-1">{metrics.sent}</span>
                  <span className="text-[11px] text-muted-foreground font-medium">base 100%</span>
                </div>
              </div>

              {/* Row 2: Entregadas */}
              <div
                onClick={() => setActiveFilter(activeFilter === "delivered" ? "ALL" : "delivered")}
                className="flex items-center group cursor-pointer"
                title="Haz clic para filtrar entregadas"
              >
                <div className="flex items-center w-32 shrink-0">
                  <CheckCheck className="w-4 h-4 text-muted-foreground mr-2 group-hover:text-primary transition-colors" />
                  <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                    Entregadas
                  </span>
                </div>
                <div className="flex-1 bg-muted/40 h-3.5 rounded-full overflow-hidden p-0.5 border border-border">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-500"
                    style={{ width: `${deliveredPct}%` }}
                  />
                </div>
                <div className="flex items-baseline justify-end w-28 shrink-0 pl-3">
                  <span className="font-extrabold text-foreground text-xs mr-1">{metrics.delivered}</span>
                  <span className="text-[11px] text-muted-foreground font-medium">{deliveredPct}%</span>
                </div>
              </div>

              {/* Row 3: Leídas */}
              <div
                onClick={() => setActiveFilter(activeFilter === "read" ? "ALL" : "read")}
                className="flex items-center group cursor-pointer"
                title="Haz clic para filtrar leídas"
              >
                <div className="flex items-center w-32 shrink-0">
                  <Eye className="w-4 h-4 text-muted-foreground mr-2 group-hover:text-primary transition-colors" />
                  <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                    Leídas
                  </span>
                </div>
                <div className="flex-1 bg-muted/40 h-3.5 rounded-full overflow-hidden p-0.5 border border-border">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-500"
                    style={{ width: `${readPct}%` }}
                  />
                </div>
                <div className="flex items-baseline justify-end w-28 shrink-0 pl-3">
                  <span className="font-extrabold text-foreground text-xs mr-1">{metrics.read}</span>
                  <span className="text-[11px] text-muted-foreground font-medium">{readPct}%</span>
                </div>
              </div>

              {/* Row 4: Respondieron */}
              <div
                onClick={() => setActiveFilter(activeFilter === "replied" ? "ALL" : "replied")}
                className="flex items-center group cursor-pointer"
                title="Haz clic para filtrar quienes respondieron"
              >
                <div className="flex items-center w-32 shrink-0">
                  <CornerDownLeft className="w-4 h-4 text-muted-foreground mr-2 group-hover:text-primary transition-colors" />
                  <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                    Respondieron
                  </span>
                </div>
                <div className="flex-1 bg-muted/40 h-3.5 rounded-full overflow-hidden p-0.5 border border-border">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-500"
                    style={{ width: `${repliedPct}%` }}
                  />
                </div>
                <div className="flex items-baseline justify-end w-28 shrink-0 pl-3">
                  <span className="font-extrabold text-foreground text-xs mr-1">{metrics.replied}</span>
                  <span className="text-[11px] text-muted-foreground font-medium">{repliedPct}%</span>
                </div>
              </div>

              {/* Footer text note */}
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-1">
                <Info className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span>
                  Tasas sobre las enviadas. Los niveles son acumulativos — haz clic en uno para filtrar la lista.
                </span>
              </div>
            </div>

            {/* Table Header & Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              <div className="text-xs text-muted-foreground font-medium">
                mostrando {filteredRecipients.length} de {metrics.total} contactos
                {activeFilter !== "ALL" && (
                  <button
                    type="button"
                    onClick={() => setActiveFilter("ALL")}
                    className="ml-2 text-primary hover:underline font-semibold"
                  >
                    (Limpiar filtro: {activeFilter})
                  </button>
                )}
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="text"
                  placeholder="Buscar nombre o número"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 text-xs"
                />
              </div>
            </div>

            {/* Contacts Table */}
            <div className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
              <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/40 text-muted-foreground font-semibold uppercase text-[10px] tracking-wider border-b border-border sticky top-0 z-10">
                    <tr>
                      <th className="py-3 px-4">Contacto</th>
                      <th className="py-3 px-4">Mensaje</th>
                      <th className="py-3 px-4">Actualizado</th>
                      <th className="py-3 px-4">Estado</th>
                      <th className="py-3 px-3 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredRecipients.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-muted-foreground text-xs italic">
                          No se encontraron contactos para el filtro aplicado.
                        </td>
                      </tr>
                    ) : (
                      filteredRecipients.map((r, idx) => {
                        const isFailed = r.status === "failed";
                        const isReplied = r.status === "replied";
                        const isRead = r.status === "read";
                        const isDelivered = r.status === "delivered";

                        return (
                          <tr key={r.id || idx} className="hover:bg-muted/20 transition-colors">
                            {/* Contacto */}
                            <td className="py-3 px-4">
                              <div className="font-bold text-foreground uppercase text-xs tracking-tight line-clamp-1">
                                {r.name || r.number || "Sin nombre"}
                              </div>
                              <div className="text-[11px] font-mono text-muted-foreground mt-0.5">
                                {r.number || r.phone}
                              </div>
                            </td>

                            {/* Mensaje */}
                            <td className="py-3 px-4 max-w-xs">
                              {isFailed ? (
                                <span className="text-danger font-semibold text-xs line-clamp-2">
                                  {r.errorMessage || r.body || "Meta API 131026 error: Message Undeliverable."}
                                </span>
                              ) : (
                                <span className="text-muted-foreground text-xs line-clamp-1">
                                  {r.body || campaign.messageText}
                                </span>
                              )}
                            </td>

                            {/* Actualizado */}
                            <td className="py-3 px-4 text-muted-foreground font-mono text-xs whitespace-nowrap">
                              {r.updatedAt || "31/08 11:57"}
                            </td>

                            {/* Estado */}
                            <td className="py-3 px-4 whitespace-nowrap">
                              {isFailed ? (
                                <div className="flex items-center gap-1.5 text-danger font-semibold text-xs">
                                  <AlertCircle className="w-3.5 h-3.5 text-danger" />
                                  <span>Falló</span>
                                </div>
                              ) : isReplied ? (
                                <div className="flex items-center gap-1.5 text-emerald-500 font-semibold text-xs">
                                  <CornerDownLeft className="w-3.5 h-3.5 text-emerald-500" />
                                  <span>Respondió</span>
                                </div>
                              ) : isRead ? (
                                <div className="flex items-center gap-1.5 text-info font-semibold text-xs">
                                  <Eye className="w-3.5 h-3.5 text-info" />
                                  <span>Leída</span>
                                </div>
                              ) : isDelivered ? (
                                <div className="flex items-center gap-1.5 text-muted-foreground font-medium text-xs">
                                  <CheckCheck className="w-3.5 h-3.5 text-muted-foreground" />
                                  <span>Entregada</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 text-amber-500 font-medium text-xs">
                                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                                  <span>En cola</span>
                                </div>
                              )}
                            </td>

                            {/* Action Icon */}
                            <td className="py-3 px-3 text-right whitespace-nowrap">
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Abrir en chat"
                                onClick={() => toast.info(`Abriendo chat con ${r.number || r.phone}`)}
                                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-4 border-t border-border bg-muted/20 flex flex-wrap items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            Cerrar
          </Button>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadFailedCsv}
              className="text-xs font-semibold gap-2"
            >
              <Download className="w-4 h-4" />
              Descargar fallidas (CSV)
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleRetryFailed}
              className="text-xs font-semibold gap-2 shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Reprogramar {metrics.failed} fallidas
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignDetailsDrawer;
