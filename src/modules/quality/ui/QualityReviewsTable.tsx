import { useState } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, Loader2, Sparkles } from "lucide-react";
import {
  highFindingCount,
  isMessageAnalysisComplete,
  messageAnalysisProgressLabel,
  qualityReviewStatusLabel,
  type QualityReviewDto,
} from "@/modules/quality/domain/quality-review";
import { CordialityBadge } from "@/modules/quality/ui/CordialityBadge";
import { relativeTime } from "@/shared/datetime";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

interface QualityReviewsTableProps {
  reviews: QualityReviewDto[];
  loading: boolean;
  listTitle: string;
  showAgentColumn: boolean;
  agentName: (agentId: string) => string;
  onSelectReview: (id: string) => void;
  onClearAgentFilter?: () => void;
  analyzingCaseId: string | null;
  batchBusy: boolean;
  analyzeChat: (caseId: string) => Promise<unknown>;
  analyzeBtnLabel: string;
}

export function QualityReviewsTable({
  reviews,
  loading,
  listTitle,
  showAgentColumn,
  agentName,
  onSelectReview,
  onClearAgentFilter,
  analyzingCaseId,
  batchBusy,
  analyzeChat,
  analyzeBtnLabel,
}: QualityReviewsTableProps) {
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const totalPages = Math.max(1, Math.ceil(reviews.length / pageSize));
  const activePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (activePage - 1) * pageSize;
  const paginatedReviews = reviews.slice(startIndex, startIndex + pageSize);

  return (
    <div className="col-span-1 lg:col-span-8 bg-card border border-border rounded-xl overflow-hidden shadow-xs flex flex-col h-full min-h-[480px]">
      {/* Cabecera de la Lista */}
      <div className="p-4 sm:p-5 border-b border-border bg-background/60 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div>
          <h3 className="text-xs font-extrabold uppercase tracking-widest">
            {listTitle} ({reviews.length})
          </h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Msgs = mensajes analizados / total. Score generado al completar todos los tramos.
          </p>
        </div>
        {onClearAgentFilter && (
          <button
            type="button"
            onClick={onClearAgentFilter}
            className="text-[11px] font-bold uppercase text-primary hover:underline cursor-pointer"
          >
            Quitar filtro de agente
          </button>
        )}
      </div>

      {/* Contenedor con Scroll Acotado y Sticky Header */}
      <div className="overflow-y-auto overflow-x-auto flex-1 min-h-0">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-background/95 backdrop-blur border-b border-border text-[10px] uppercase tracking-widest text-muted-foreground font-bold z-10">
            <tr>
              <th className="text-left px-3.5 py-3">Cliente</th>
              {showAgentColumn && <th className="text-left px-3.5 py-3">Agente</th>}
              <th className="text-right px-3.5 py-3">Msgs</th>
              <th className="text-left px-3.5 py-3">Score</th>
              <th className="text-left px-3.5 py-3">Estado</th>
              <th className="text-right px-3.5 py-3">Crít.</th>
              <th className="text-left px-3.5 py-3 min-w-[140px]">Resumen</th>
              <th className="text-left px-3.5 py-3">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading && reviews.length === 0
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-3.5 py-3">
                      <div className="h-4 w-28 bg-foreground/10 rounded mb-1" />
                      <div className="h-3 w-16 bg-foreground/10 rounded" />
                    </td>
                    {showAgentColumn && (
                      <td className="px-3.5 py-3">
                        <div className="h-4 w-20 bg-foreground/10 rounded" />
                      </td>
                    )}
                    <td className="px-3.5 py-3 text-right">
                      <div className="h-4 w-10 bg-foreground/10 rounded ml-auto" />
                    </td>
                    <td className="px-3.5 py-3">
                      <div className="h-5 w-16 bg-foreground/10 rounded-full" />
                    </td>
                    <td className="px-3.5 py-3">
                      <div className="h-4 w-14 bg-foreground/10 rounded" />
                    </td>
                    <td className="px-3.5 py-3 text-right">
                      <div className="h-4 w-6 bg-foreground/10 rounded ml-auto" />
                    </td>
                    <td className="px-3.5 py-3">
                      <div className="h-4 w-40 bg-foreground/10 rounded" />
                    </td>
                    <td className="px-3.5 py-3">
                      <div className="h-4 w-12 bg-foreground/10 rounded" />
                    </td>
                    <td className="px-3.5 py-3 text-right">
                      <div className="h-6 w-16 bg-foreground/10 rounded ml-auto" />
                    </td>
                  </tr>
                ))
              : paginatedReviews.map((r) => {
                  const busy = analyzingCaseId === r.caseId;
                  const statusLabel = qualityReviewStatusLabel(r.status, r.startedAt, {
                    messagesAnalyzed: r.messagesAnalyzed,
                    messagesTotal: r.messagesTotal,
                  });
                  const msgLabel = messageAnalysisProgressLabel(r);
                  const complete = isMessageAnalysisComplete(r);
                  const showRetry = r.status === "failed";
                  const showQueued = r.status === "pending";

                  return (
                    <tr
                      key={r.id}
                      className={`hover:bg-foreground/5 cursor-pointer transition-colors ${
                        r.status === "failed" ? "bg-danger/5" : ""
                      }`}
                      onClick={() => onSelectReview(r.id)}
                    >
                      <td className="px-3.5 py-3">
                        <div className="font-semibold truncate max-w-[150px]">
                          {r.customerLabel || "Cliente"}
                        </div>
                        <div className="font-mono text-[10px] text-muted-foreground truncate">
                          {r.waPhone || "—"}
                        </div>
                      </td>
                      {showAgentColumn && (
                        <td className="px-3.5 py-3 font-semibold truncate max-w-[100px]">
                          {agentName(r.agentId)}
                        </td>
                      )}
                      <td
                        className={`px-3.5 py-3 text-right font-mono tabular-nums font-semibold ${
                          complete ? "text-foreground" : "text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {msgLabel}
                      </td>
                      <td className="px-3.5 py-3">
                        <CordialityBadge
                          score={
                            r.status === "ready" || r.status === "reviewed"
                              ? r.cordialityScore
                              : null
                          }
                        />
                      </td>
                      <td className="px-3.5 py-3 font-bold text-[10px]">
                        {r.status === "pending" ? (
                          <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400">
                            {(r.startedAt || r.messagesAnalyzed > 0) && (
                              <Loader2 className="size-3 animate-spin" />
                            )}
                            {statusLabel}
                          </span>
                        ) : r.status === "failed" ? (
                          <span className="text-danger">{statusLabel}</span>
                        ) : (
                          statusLabel
                        )}
                      </td>
                      <td className="px-3.5 py-3 text-right font-mono">
                        {highFindingCount(r) > 0 ? (
                          <span className="text-danger font-bold">{highFindingCount(r)}</span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-3.5 py-3 text-muted-foreground max-w-[200px]">
                        <span className="line-clamp-2">
                          {r.status === "failed"
                            ? (r.errorMessage ?? "Error de análisis")
                            : (r.summary ?? "—")}
                        </span>
                      </td>
                      <td className="px-3.5 py-3 text-muted-foreground whitespace-nowrap">
                        {relativeTime(r.completedAt ?? r.createdAt)}
                      </td>
                    </tr>
                  );
                })}

            {!loading && reviews.length === 0 && (
              <tr>
                <td
                  colSpan={showAgentColumn ? 8 : 7}
                  className="px-4 py-12 text-muted-foreground text-center"
                >
                  No hay revisiones aún. Pulsa «{analyzeBtnLabel}» para encolar casos recientes.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Barra de Paginación Persistente */}
      {reviews.length > 0 && (
        <div className="p-3 border-t border-border bg-background/80 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground shrink-0">
          <div className="flex items-center gap-3">
            <span>
              Mostrando <strong className="text-foreground font-semibold">{startIndex + 1}</strong>–
              <strong className="text-foreground font-semibold">
                {Math.min(startIndex + pageSize, reviews.length)}
              </strong>{" "}
              de <strong className="text-foreground font-semibold">{reviews.length}</strong> chats
            </span>
            <div className="flex items-center gap-1.5 pl-2 border-l border-border">
              <span className="text-[11px] text-muted-foreground hidden sm:inline">Por pág:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-7 px-2 text-[11px] rounded-md border border-border bg-background text-foreground font-medium cursor-pointer hover:bg-muted/50 focus:outline-hidden focus:ring-1 focus:ring-primary"
                aria-label="Cantidad de chats por página"
              >
                {PAGE_SIZE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={activePage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 rounded-md border border-border bg-background hover:bg-muted disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors flex items-center gap-1 text-[11px] font-medium"
              title="Página anterior"
            >
              <ChevronLeft className="size-3.5" />
              <span className="hidden sm:inline">Anterior</span>
            </button>
            <span className="font-mono text-[11px] font-semibold px-2">
              Pág. {activePage} de {totalPages}
            </span>
            <button
              type="button"
              disabled={activePage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 rounded-md border border-border bg-background hover:bg-muted disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors flex items-center gap-1 text-[11px] font-medium"
              title="Página siguiente"
            >
              <span className="hidden sm:inline">Siguiente</span>
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
