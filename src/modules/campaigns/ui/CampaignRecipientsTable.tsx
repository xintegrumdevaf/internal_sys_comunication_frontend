import React, { useState, useMemo } from "react";
import {
  Search,
  X,
  AlertCircle,
  CornerDownLeft,
  Eye,
  CheckCheck,
  Send,
  Clock,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Campaign, CampaignRecipient } from "../domain/campaign";
import type { ActiveFilter } from "./CampaignFunnelCard";

interface CampaignRecipientsTableProps {
  recipients: CampaignRecipient[];
  campaign: Campaign;
  activeFilter: ActiveFilter;
  onFilterChange: (filter: ActiveFilter) => void;
}

const PAGE_SIZE = 10;

export const CampaignRecipientsTable: React.FC<CampaignRecipientsTableProps> = ({
  recipients,
  campaign,
  activeFilter,
  onFilterChange,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [selectedRecipientMessage, setSelectedRecipientMessage] = useState<{
    name: string;
    phone: string;
    message: string;
    isError?: boolean;
  } | null>(null);

  // Filtrado de contactos
  const filteredRecipients = useMemo(() => {
    return recipients.filter((r) => {
      const st = (r.status || "pending").toLowerCase();

      let matchesFilter = true;
      if (activeFilter === "sent") {
        matchesFilter = ["sent", "delivered", "read", "replied"].includes(st);
      } else if (activeFilter === "delivered") {
        matchesFilter = ["delivered", "read", "replied"].includes(st);
      } else if (activeFilter === "read") {
        matchesFilter = ["read", "replied"].includes(st);
      } else if (activeFilter === "replied") {
        matchesFilter = st === "replied";
      } else if (activeFilter === "failed") {
        matchesFilter = st === "failed" || st === "skipped";
      } else if (activeFilter === "queued") {
        matchesFilter = st === "queued" || st === "pending" || st === "draft";
      }

      if (!matchesFilter) return false;

      if (!searchTerm.trim()) return true;

      const term = searchTerm.toLowerCase().trim();
      const nameMatch = (r.name || "").toLowerCase().includes(term);
      const numberMatch = (r.number || r.phone || "").includes(term);
      const bodyMatch = (r.body || r.customBody || "").toLowerCase().includes(term);

      return nameMatch || numberMatch || bodyMatch;
    });
  }, [recipients, activeFilter, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredRecipients.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const paginatedRecipients = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredRecipients.slice(start, start + PAGE_SIZE);
  }, [filteredRecipients, currentPage]);

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setPage(1);
  };

  const getRecipientBody = (r: CampaignRecipient): string => {
    return (
      r.body ||
      r.customBody ||
      r.bodyText ||
      campaign.messageText ||
      campaign.messageBody ||
      (campaign.templateName || campaign.template_name
        ? `Plantilla: ${campaign.templateName || campaign.template_name}`
        : "Sin contenido")
    );
  };

  return (
    <div className="space-y-3.5">
      {/* Header, Search y Filtros Rápidos */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground font-semibold">
            Mostrando {filteredRecipients.length} de {recipients.length} contactos
          </span>
          {activeFilter !== "ALL" && (
            <button
              type="button"
              onClick={() => onFilterChange("ALL")}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 cursor-pointer"
            >
              <span>Filtro: {activeFilter}</span>
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Buscar nombre o número..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-8 pr-7 text-xs h-8.5 rounded-xl border-border bg-background"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => handleSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Tabla de Contactos con Paginación */}
      <div className="border border-border/80 rounded-2xl overflow-hidden bg-card/80 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs table-fixed">
            <thead className="bg-muted/40 text-muted-foreground font-bold uppercase text-[10px] tracking-wider border-b border-border/80">
              <tr>
                <th className="py-2.5 px-4 w-[28%]">Contacto</th>
                <th className="py-2.5 px-4 w-[38%]">Mensaje</th>
                <th className="py-2.5 px-4 w-[16%]">Actualizado</th>
                <th className="py-2.5 px-4 w-[12%]">Estado</th>
                <th className="py-2.5 px-3 w-[6%] text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {paginatedRecipients.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-12 text-center text-muted-foreground text-xs italic"
                  >
                    No se encontraron contactos para el criterio de búsqueda o filtro.
                  </td>
                </tr>
              ) : (
                paginatedRecipients.map((r, idx) => {
                  const st = (r.status || "sent").toLowerCase();
                  const isFailed = st === "failed";
                  const isReplied = st === "replied";
                  const isRead = st === "read";
                  const isDelivered = st === "delivered";
                  const isSent = st === "sent";

                  const messageText = getRecipientBody(r);
                  const errorText =
                    r.errorMessage || "Meta API error: No se pudo entregar el mensaje.";

                  return (
                    <tr key={r.id || idx} className="hover:bg-muted/20 transition-colors">
                      {/* Contacto */}
                      <td className="py-2.5 px-4">
                        <div className="font-bold text-foreground uppercase text-xs truncate">
                          {r.name || "Sin nombre"}
                        </div>
                        <div className="text-[11px] font-mono text-muted-foreground">
                          {r.number || r.phone || "Sin número"}
                        </div>
                      </td>

                      {/* Mensaje (Sin superposición ni solapamiento) */}
                      <td className="py-2.5 px-4">
                        {isFailed ? (
                          <div
                            onClick={() =>
                              setSelectedRecipientMessage({
                                name: r.name || r.number || "Destinatario",
                                phone: r.number || r.phone || "",
                                message: errorText,
                                isError: true,
                              })
                            }
                            className="text-red-500 font-medium text-xs truncate cursor-pointer hover:underline"
                            title="Haz clic para ver el error completo"
                          >
                            ⚠️ {errorText}
                          </div>
                        ) : (
                          <div
                            onClick={() =>
                              setSelectedRecipientMessage({
                                name: r.name || r.number || "Destinatario",
                                phone: r.number || r.phone || "",
                                message: messageText,
                              })
                            }
                            className="text-muted-foreground text-xs truncate cursor-pointer hover:text-foreground flex items-center gap-1.5"
                            title="Haz clic para ver el mensaje completo"
                          >
                            <span className="text-amber-500 font-normal shrink-0">📌</span>
                            <span className="truncate">{messageText}</span>
                          </div>
                        )}
                      </td>

                      {/* Actualizado */}
                      <td className="py-2.5 px-4 text-muted-foreground font-mono text-[11px] whitespace-nowrap">
                        {r.updatedAt || "31/08 11:57"}
                      </td>

                      {/* Estado */}
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        {isFailed ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-500/10 text-red-500 border border-red-500/20">
                            <AlertCircle className="w-3 h-3" />
                            Falló
                          </span>
                        ) : isReplied ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                            <CornerDownLeft className="w-3 h-3" />
                            Respondió
                          </span>
                        ) : isRead ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-500/10 text-blue-500 border border-blue-500/20">
                            <Eye className="w-3 h-3" />
                            Leída
                          </span>
                        ) : isDelivered ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <CheckCheck className="w-3 h-3" />
                            Entregada
                          </span>
                        ) : isSent ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-primary/10 text-primary border border-primary/20">
                            <Send className="w-3 h-3" />
                            Enviada
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20">
                            <Clock className="w-3 h-3" />
                            En cola
                          </span>
                        )}
                      </td>

                      {/* Acción */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Abrir en chat"
                          onClick={() => toast.info(`Abriendo chat con ${r.number || r.phone}`)}
                          className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
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

        {/* Barra de Paginación */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-border/70 bg-muted/10 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Mostrando{" "}
              <strong className="text-foreground font-mono">
                {(currentPage - 1) * PAGE_SIZE + 1}
              </strong>{" "}
              a{" "}
              <strong className="text-foreground font-mono">
                {Math.min(currentPage * PAGE_SIZE, filteredRecipients.length)}
              </strong>{" "}
              de <strong className="text-foreground font-mono">{filteredRecipients.length}</strong>{" "}
              contactos
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1 rounded-lg border border-border hover:bg-muted disabled:opacity-30 cursor-pointer"
                title="Página anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-mono text-xs font-bold text-foreground">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1 rounded-lg border border-border hover:bg-muted disabled:opacity-30 cursor-pointer"
                title="Página siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal flotante de mensaje completo */}
      {selectedRecipientMessage && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-3.5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-bold text-foreground">
                  {selectedRecipientMessage.name} ({selectedRecipientMessage.phone})
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecipientMessage(null)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div
              className={`p-3.5 rounded-xl border text-xs leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap font-sans ${
                selectedRecipientMessage.isError
                  ? "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400 font-mono"
                  : "bg-muted/40 border-border text-foreground"
              }`}
            >
              {selectedRecipientMessage.message}
            </div>

            <div className="flex justify-end pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedRecipientMessage(null)}
                className="text-xs font-bold uppercase"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
