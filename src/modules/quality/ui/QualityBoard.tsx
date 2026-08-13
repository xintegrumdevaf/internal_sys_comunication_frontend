import { Loader2, Sparkles } from "lucide-react";
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
    return (
      <QualityReviewDetail
        reviewId={reviewId}
        onBack={onClearReview}
        agentName={agentName}
      />
    );
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
  const listTitle = filters.agentId
    ? `Chats de ${agentName(filters.agentId)}`
    : "Chats";
  const analyzeBtnLabel = filters.agentId
    ? `Analizar chats de ${agentName(filters.agentId)}`
    : "Analizar chats recientes";

  return (
    <>
      <div className="mb-4 p-3 rounded-lg border border-border bg-card text-[11px] text-muted-foreground animate-fade-up">
        Cada caso cerrado = 1 conversación. La IA analiza por tramos (tamaño configurable) hasta
        cubrir <strong>todos</strong> los mensajes; al terminar genera la valoración total y la
        review con fallos marcados. Columna <strong>Msgs</strong>: analizados / total.
      </div>

      {pendingCount > 0 && (
        <div className="mb-4 flex items-center gap-2 p-3 rounded-lg border border-primary/30 bg-primary/5 text-xs text-foreground animate-fade-up">
          <Loader2 className="size-4 animate-spin shrink-0 text-primary" />
          <span>
            Analizando tramos… ({pendingCount} conversación(es) en cola). La lista se actualiza sola.
          </span>
        </div>
      )}

      {failedCount > 0 && pendingCount === 0 && (
        <div className="mb-4 p-3 rounded-lg border border-destructive/30 bg-destructive/5 text-xs animate-fade-up">
          {failedCount} fallido(s). «Reintentar» en la fila o vuelve a «{analyzeBtnLabel}».
        </div>
      )}

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-up">
        <StatCard label="Agentes" value={loading ? "…" : String(stats.length)} />
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

      <section className="flex flex-wrap gap-2 items-center animate-fade-up">
        <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
          Agente
          <select
            value={filters.agentId}
            onChange={(e) => setFilters((p) => ({ ...p, agentId: e.target.value }))}
            className="ml-2 text-xs px-3 py-1.5 border border-border rounded-md bg-card font-normal normal-case tracking-normal min-w-[180px]"
          >
            <option value="">Todos los agentes</option>
            {agentOptions.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
          Desde
          <input
            type="date"
            value={filters.from}
            onChange={(e) => setFilters((p) => ({ ...p, from: e.target.value }))}
            className="ml-2 text-xs px-2 py-1.5 border border-border rounded-md bg-card font-normal normal-case tracking-normal"
          />
        </label>
        <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
          Hasta
          <input
            type="date"
            value={filters.to}
            onChange={(e) => setFilters((p) => ({ ...p, to: e.target.value }))}
            className="ml-2 text-xs px-2 py-1.5 border border-border rounded-md bg-card font-normal normal-case tracking-normal"
          />
        </label>
        {isAdmin && (
          <select
            value={filters.departmentId}
            onChange={(e) => setFilters((p) => ({ ...p, departmentId: e.target.value }))}
            className="text-xs px-3 py-2 border border-border rounded-md bg-card"
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
          className="text-xs px-3 py-2 border border-border rounded-md bg-card"
        >
          <option value="">Cualquier estado</option>
          <option value="pending">Por analizar</option>
          <option value="ready">Analizado</option>
          <option value="failed">Fallido</option>
          <option value="reviewed">Revisada</option>
        </select>
        <button
          type="button"
          disabled={batchBusy || Boolean(analyzingCaseId)}
          onClick={() => void analyzePendingChats()}
          title="Encola hasta 5 casos cerrados recientes sin score (Ollama, uno a uno)"
          className="inline-flex items-center gap-1.5 text-[11px] px-3 py-2 rounded-md border border-primary/40 bg-primary/10 font-bold uppercase hover:bg-primary/15 disabled:opacity-50"
        >
          {batchBusy ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Sparkles className="size-3.5" />
          )}
          {analyzeBtnLabel}
        </button>
      </section>

      <section className="grid grid-cols-12 gap-6 animate-fade-up">
        <div className="col-span-12 lg:col-span-4 bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="text-xs font-extrabold uppercase tracking-widest">
              Ranking por agente
            </h3>
            <p className="text-[10px] text-muted-foreground mt-1">
              Score promedio de chats con valoración total completa.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-background/60 text-[10px] uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="text-left px-3 py-2">Agente</th>
                  <th className="text-right px-3 py-2">Chats</th>
                  <th className="text-left px-3 py-2">Score</th>
                  <th className="text-right px-3 py-2">Crít.</th>
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
                      <td className="px-3 py-2.5 font-semibold truncate max-w-[160px]">
                        {row.agentName}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono tabular-nums">
                        {row.analyzedCount}/{row.closedWithAgentMessages}
                      </td>
                      <td className="px-3 py-2.5">
                        <CordialityBadge
                          score={row.analyzedCount > 0 ? row.avgCordialityScore : null}
                        />
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono">
                        {row.criticalReviewCount}
                      </td>
                    </tr>
                  );
                })}
                {!loading && stats.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-muted-foreground text-center">
                      Sin datos en este rango. Usa «Analizar chats recientes».
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8 bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-widest">
                {listTitle} ({reviews.length})
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Msgs = mensajes analizados / total. Score solo al completar todos los tramos.
              </p>
            </div>
            {filters.agentId && (
              <button
                type="button"
                onClick={() => setFilters((p) => ({ ...p, agentId: "" }))}
                className="text-[10px] font-bold uppercase text-primary hover:underline"
              >
                Quitar filtro
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-background/60 text-[10px] uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="text-left px-3 py-2">Cliente</th>
                  {showAgentColumn && <th className="text-left px-3 py-2">Agente</th>}
                  <th className="text-right px-3 py-2">Msgs</th>
                  <th className="text-left px-3 py-2">Score</th>
                  <th className="text-left px-3 py-2">Estado</th>
                  <th className="text-right px-3 py-2">Crít.</th>
                  <th className="text-left px-3 py-2 min-w-[140px]">Resumen</th>
                  <th className="text-left px-3 py-2">Fecha</th>
                  <th className="text-right px-3 py-2">Acción</th>
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
                        r.status === "failed" ? "bg-destructive/5" : ""
                      }`}
                      onClick={() => onSelectReview(r.id)}
                    >
                      <td className="px-3 py-2.5">
                        <div className="font-semibold truncate max-w-[160px]">
                          {r.customerLabel || "Cliente"}
                        </div>
                        <div className="font-mono text-[10px] text-muted-foreground truncate">
                          {r.waPhone || "—"}
                        </div>
                      </td>
                      {showAgentColumn && (
                        <td className="px-3 py-2.5 font-semibold truncate max-w-[100px]">
                          {agentName(r.agentId)}
                        </td>
                      )}
                      <td
                        className={`px-3 py-2.5 text-right font-mono tabular-nums font-semibold ${
                          complete ? "text-foreground" : "text-warning"
                        }`}
                      >
                        {msgLabel}
                      </td>
                      <td className="px-3 py-2.5">
                        <CordialityBadge
                          score={
                            r.status === "ready" || r.status === "reviewed"
                              ? r.cordialityScore
                              : null
                          }
                        />
                      </td>
                      <td className="px-3 py-2.5 font-bold text-[10px]">
                        {r.status === "pending" ? (
                          <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400">
                            {(r.startedAt || r.messagesAnalyzed > 0) && (
                              <Loader2 className="size-3 animate-spin" />
                            )}
                            {statusLabel}
                          </span>
                        ) : r.status === "failed" ? (
                          <span className="text-destructive">{statusLabel}</span>
                        ) : (
                          statusLabel
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono">
                        {highFindingCount(r) > 0 ? (
                          <span className="text-destructive font-bold">{highFindingCount(r)}</span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground max-w-[200px]">
                        <span className="line-clamp-2">
                          {r.status === "failed"
                            ? r.errorMessage ?? "Error de análisis"
                            : r.summary ?? "—"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">
                        {relativeTime(r.completedAt ?? r.createdAt)}
                      </td>
                      <td className="px-3 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                        {showRetry ? (
                          <button
                            type="button"
                            disabled={busy || batchBusy || Boolean(analyzingCaseId)}
                            onClick={() => void analyzeChat(r.caseId)}
                            className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-md border border-primary/40 bg-primary/10 font-bold uppercase hover:bg-primary/15 disabled:opacity-50"
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
                      className="px-4 py-8 text-muted-foreground text-center"
                    >
                      No hay revisiones aún. Pulsa «{analyzeBtnLabel}» para encolar casos
                      cerrados recientes.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  );
}
