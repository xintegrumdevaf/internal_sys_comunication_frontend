import { Loader2, Sparkles, ShieldCheck } from "lucide-react";
import { StatCard } from "@/app/shell/AppShell";
import { useDepartmentsQuery, useDirectoryUsers } from "@/modules/identity/application/use-session";
import {
  highFindingCount,
  isMessageAnalysisComplete,
  messageAnalysisProgressLabel,
  qualityReviewStatusLabel,
  type QualityReviewStatus,
} from "@/modules/quality/domain/quality-review";
import { useQualityBoard } from "@/modules/quality/application/use-quality-board";
import { CordialityBadge } from "@/modules/quality/ui/CordialityBadge";
import { QualityReviewDetail } from "@/modules/quality/ui/QualityReviewDetail";
import { relativeTime } from "@/shared/datetime";

/**
 * Ranking + lista de chats. Progreso por conversación: msgs analizados/total.
 */
export function QualityBoard({
  reviewId,
  onSelectReview,
  onClearReview,
}: {
  reviewId?: string;
  onSelectReview: (id: string) => void;
  onClearReview: () => void;
}) {
  const { data: departments = [] } = useDepartmentsQuery();
  const directory = useDirectoryUsers();
  const {
    session,
    filters,
    setFilters,
    stats,
    reviews,
    pendingCount,
    loading,
    analyzingCaseId,
    batchBusy,
    backendUnavailable,
    analyzeChat,
    analyzePendingChats,
  } = useQualityBoard({ pausePolling: Boolean(reviewId) });

  const isAdmin = session?.role === "admin";
  const agentName = (agentId: string) =>
    directory.find((a) => a.id === agentId)?.name ??
    stats.find((s) => s.agentId === agentId)?.agentName ??
    "Agente";

  const agentOptions = (() => {
    const byId = new Map<string, string>();
    for (const s of stats) byId.set(s.agentId, s.agentName);
    for (const a of directory) {
      if (a.role === "agent" || a.role === "manager") {
        if (!byId.has(a.id)) byId.set(a.id, a.name);
      }
    }
    return [...byId.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
  })();

  if (reviewId) {
    return <QualityReviewDetail reviewId={reviewId} onBack={onClearReview} agentName={agentName} />;
  }

  if (backendUnavailable) {
    return (
      <div className="p-6 rounded-xl border border-border bg-card text-sm text-muted-foreground animate-fade-up">
        <p className="font-bold text-foreground mb-1">Supervisión de calidad no disponible</p>
        <p>
          Pendiente de backend. Endpoints{" "}
          <span className="font-mono text-[11px]">/api/quality/*</span>.
        </p>
      </div>
    );
  }

  const failedCount = reviews.filter((r) => r.status === "failed").length;
  const incompleteMsg = reviews.filter(
    (r) => r.status === "pending" || !isMessageAnalysisComplete(r),
  ).length;
  const showAgentColumn = !filters.agentId;
  const listTitle = filters.agentId ? `Chats de ${agentName(filters.agentId)}` : "Chats";
  const analyzeBtnLabel = filters.agentId
    ? `Analizar chats de ${agentName(filters.agentId)}`
    : "Analizar chats recientes";

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Banner Informativo */}
      <div className="p-4 sm:p-5 rounded-xl border border-border bg-card text-xs sm:text-sm text-muted-foreground flex items-start gap-3 shadow-xs">
        <ShieldCheck className="size-5 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-foreground">Supervisión y Auditoría de Calidad</p>
          <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
            Cada caso cerrado equivale a 1 conversación auditada. La IA analiza por tramos hasta
            cubrir todos los mensajes, generando la valoración de cordialidad y resaltando posibles
            hallazgos críticos.
          </p>
        </div>
      </div>

      {pendingCount > 0 && (
        <div className="flex items-center gap-2.5 p-3.5 sm:p-4 rounded-xl border border-primary/30 bg-primary/5 text-xs text-foreground shadow-xs animate-fade-up">
          <Loader2 className="size-4 animate-spin shrink-0 text-primary" />
          <span>
            Analizando tramos en segundo plano… ({pendingCount} conversación(es) en cola). La lista
            se actualiza automáticamente.
          </span>
        </div>
      )}

      {failedCount > 0 && pendingCount === 0 && (
        <div className="p-3.5 sm:p-4 rounded-xl border border-danger/30 bg-danger/5 text-xs text-danger shadow-xs animate-fade-up">
          {failedCount} análisis fallido(s). Pulsa «Reintentar» en la fila o ejecuta «
          {analyzeBtnLabel}».
        </div>
      )}

      {/* Indicadores */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Agentes evaluados" value={loading ? "…" : String(stats.length)} />
        <StatCard label="Chats en lista" value={loading ? "…" : String(reviews.length)} />
        <StatCard
          label="Msgs incompletos"
          value={loading ? "…" : String(incompleteMsg)}
          hint="Conversaciones sin cobertura total"
          tone={incompleteMsg > 0 ? "warning" : undefined}
        />
        <StatCard
          label="En cola / fallidos"
          value={loading ? "…" : `${pendingCount} / ${failedCount}`}
          tone={pendingCount > 0 || failedCount > 0 ? "warning" : undefined}
        />
      </section>

      {/* Barra de Filtros y Acciones */}
      <section className="p-3.5 sm:p-4 rounded-xl border border-border bg-card flex flex-wrap gap-3 items-center justify-between shadow-xs">
        <div className="flex flex-wrap gap-2.5 items-center w-full lg:w-auto">
          <select
            value={filters.agentId}
            onChange={(e) => setFilters((p) => ({ ...p, agentId: e.target.value }))}
            className="text-xs px-3 py-2 border border-border rounded-lg bg-background font-medium outline-none focus:ring-2 focus:ring-primary/20 w-full sm:w-auto"
          >
            <option value="">Todos los agentes</option>
            {agentOptions.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <span className="text-[10px] font-bold uppercase text-muted-foreground shrink-0">
              Desde:
            </span>
            <input
              type="date"
              value={filters.from}
              onChange={(e) => setFilters((p) => ({ ...p, from: e.target.value }))}
              className="text-xs px-2.5 py-1.5 border border-border rounded-lg bg-background outline-none focus:ring-2 focus:ring-primary/20 flex-1 sm:flex-initial"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <span className="text-[10px] font-bold uppercase text-muted-foreground shrink-0">
              Hasta:
            </span>
            <input
              type="date"
              value={filters.to}
              onChange={(e) => setFilters((p) => ({ ...p, to: e.target.value }))}
              className="text-xs px-2.5 py-1.5 border border-border rounded-lg bg-background outline-none focus:ring-2 focus:ring-primary/20 flex-1 sm:flex-initial"
            />
          </div>

          {isAdmin && (
            <select
              value={filters.departmentId}
              onChange={(e) => setFilters((p) => ({ ...p, departmentId: e.target.value }))}
              className="text-xs px-3 py-2 border border-border rounded-lg bg-background font-medium outline-none focus:ring-2 focus:ring-primary/20 w-full sm:w-auto"
            >
              <option value="">Todas las áreas</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          )}

          <select
            value={filters.status}
            onChange={(e) =>
              setFilters((p) => ({
                ...p,
                status: e.target.value as QualityReviewStatus | "",
              }))
            }
            className="text-xs px-3 py-2 border border-border rounded-lg bg-background font-medium outline-none focus:ring-2 focus:ring-primary/20 w-full sm:w-auto"
          >
            <option value="">Cualquier estado</option>
            <option value="pending">Por analizar</option>
            <option value="ready">Analizado</option>
            <option value="failed">Fallido</option>
            <option value="reviewed">Revisada</option>
          </select>
        </div>

        <button
          type="button"
          disabled={batchBusy || Boolean(analyzingCaseId)}
          onClick={() => void analyzePendingChats()}
          title="Encola hasta 5 casos cerrados recientes sin score (Ollama, uno a uno)"
          className="inline-flex items-center justify-center gap-2 text-xs px-3.5 py-2 rounded-lg border border-primary/40 bg-primary/10 font-bold uppercase hover:bg-primary/20 text-primary transition-colors disabled:opacity-50 w-full lg:w-auto shadow-xs"
        >
          {batchBusy ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Sparkles className="size-3.5" />
          )}
          <span>{analyzeBtnLabel}</span>
        </button>
      </section>

      {/* Tablas de Ranking y Reviews */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Ranking por agente */}
        <div className="col-span-1 lg:col-span-4 bg-card border border-border rounded-xl overflow-hidden shadow-xs flex flex-col">
          <div className="p-4 sm:p-5 border-b border-border bg-background/60">
            <h3 className="text-xs font-extrabold uppercase tracking-widest">Ranking por Agente</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Score promedio de chats con valoración total.
            </p>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-xs">
              <thead className="bg-background/80 border-b border-border text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                <tr>
                  <th className="text-left px-3.5 py-3">Agente</th>
                  <th className="text-right px-3.5 py-3">Chats</th>
                  <th className="text-left px-3.5 py-3">Score</th>
                  <th className="text-right px-3.5 py-3">Crít.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stats.map((row) => {
                  const active = filters.agentId === row.agentId;
                  return (
                    <tr
                      key={row.agentId}
                      className={`hover:bg-foreground/5 cursor-pointer transition-colors ${
                        active ? "bg-primary/5 ring-inset ring-1 ring-primary/20" : ""
                      }`}
                      onClick={() =>
                        setFilters((p) => ({
                          ...p,
                          agentId: p.agentId === row.agentId ? "" : row.agentId,
                        }))
                      }
                    >
                      <td className="px-3.5 py-3 font-semibold truncate max-w-[140px]">
                        {row.agentName}
                      </td>
                      <td className="px-3.5 py-3 text-right font-mono tabular-nums text-muted-foreground">
                        {row.analyzedCount}/{row.closedWithAgentMessages}
                      </td>
                      <td className="px-3.5 py-3">
                        <CordialityBadge
                          score={row.analyzedCount > 0 ? row.avgCordialityScore : null}
                        />
                      </td>
                      <td className="px-3.5 py-3 text-right font-mono font-bold">
                        {row.criticalReviewCount}
                      </td>
                    </tr>
                  );
                })}
                {!loading && stats.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-muted-foreground text-center">
                      Sin datos en este rango.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Lista de Reviews */}
        <div className="col-span-1 lg:col-span-8 bg-card border border-border rounded-xl overflow-hidden shadow-xs flex flex-col">
          <div className="p-4 sm:p-5 border-b border-border bg-background/60 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-widest">
                {listTitle} ({reviews.length})
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Msgs = mensajes analizados / total. Score generado al completar todos los tramos.
              </p>
            </div>
            {filters.agentId && (
              <button
                type="button"
                onClick={() => setFilters((p) => ({ ...p, agentId: "" }))}
                className="text-[11px] font-bold uppercase text-primary hover:underline"
              >
                Quitar filtro
              </button>
            )}
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-xs">
              <thead className="bg-background/80 border-b border-border text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                <tr>
                  <th className="text-left px-3.5 py-3">Cliente</th>
                  {showAgentColumn && <th className="text-left px-3.5 py-3">Agente</th>}
                  <th className="text-right px-3.5 py-3">Msgs</th>
                  <th className="text-left px-3.5 py-3">Score</th>
                  <th className="text-left px-3.5 py-3">Estado</th>
                  <th className="text-right px-3.5 py-3">Crít.</th>
                  <th className="text-left px-3.5 py-3 min-w-[140px]">Resumen</th>
                  <th className="text-left px-3.5 py-3">Fecha</th>
                  <th className="text-right px-3.5 py-3">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reviews.map((r) => {
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
                      <td className="px-3.5 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        {showRetry ? (
                          <button
                            type="button"
                            disabled={busy || batchBusy || Boolean(analyzingCaseId)}
                            onClick={() => void analyzeChat(r.caseId)}
                            className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-lg border border-primary/40 bg-primary/10 font-bold uppercase hover:bg-primary/20 text-primary transition-colors disabled:opacity-50"
                          >
                            {busy ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              <Sparkles className="size-3" />
                            )}
                            Reintentar
                          </button>
                        ) : showQueued ? (
                          <span className="text-[10px] text-muted-foreground uppercase font-bold">
                            En cola
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {!loading && reviews.length === 0 && (
                  <tr>
                    <td
                      colSpan={showAgentColumn ? 9 : 8}
                      className="px-4 py-12 text-muted-foreground text-center"
                    >
                      No hay revisiones aún. Pulsa «{analyzeBtnLabel}» para encolar casos recientes.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
