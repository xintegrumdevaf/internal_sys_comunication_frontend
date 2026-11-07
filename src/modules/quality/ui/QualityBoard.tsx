import { useState } from "react";
import { ShieldCheck, Loader2 } from "lucide-react";
import { useDepartmentsQuery, useDirectoryUsers } from "@/modules/identity/application/use-session";
import {
  highFindingCount,
  isMessageAnalysisComplete,
} from "@/modules/quality/domain/quality-review";
import { useQualityBoard } from "@/modules/quality/application/use-quality-board";
import {
  MOCK_AGENT_ID,
  MOCK_AGENT_NAME,
  MOCK_QUALITY_REVIEW_ID,
} from "@/modules/quality/infrastructure/quality-mocks";
import { QualityReviewDetail } from "@/modules/quality/ui/QualityReviewDetail";
import { QualityStatsCards } from "@/modules/quality/ui/QualityStatsCards";
import { QualityFiltersBar } from "@/modules/quality/ui/QualityFiltersBar";
import { QualityRankingTable } from "@/modules/quality/ui/QualityRankingTable";
import { QualityReviewsTable } from "@/modules/quality/ui/QualityReviewsTable";
import { useSlaConfig } from "@/modules/sla/application/use-sla-config";
import { SlaSettingsModal } from "@/modules/sla/ui/SlaSettingsModal";

export function QualityBoard({
  reviewId,
  onSelectReview,
  onClearReview,
}: {
  reviewId?: string;
  onSelectReview: (id: string) => void;
  onClearReview: () => void;
}) {
  const { config: slaConfig } = useSlaConfig();
  const [slaModalOpen, setSlaModalOpen] = useState(false);
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
    refreshing,
    analyzingCaseId,
    batchBusy,
    backendUnavailable,
    reload,
    analyzeChat,
    analyzePendingChats,
    reanalyzeAllChats,
  } = useQualityBoard({ pausePolling: Boolean(reviewId) });

  const isAdmin = session?.role === "admin";
  const agentName = (agentId: string) => {
    if (agentId === MOCK_AGENT_ID) return MOCK_AGENT_NAME;
    return (
      directory.find((a) => a.id === agentId)?.name ??
      stats.find((s) => s.agentId === agentId)?.agentName ??
      "Agente"
    );
  };

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
        onBack={(opts) => {
          if (opts?.mutated) {
            void reload({ silent: true });
          }
          onClearReview();
        }}
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
  const criticalCount = reviews.filter(
    (r) => (r.cordialityScore !== null && r.cordialityScore < 40) || highFindingCount(r) > 0,
  ).length;
  const showAgentColumn = !filters.agentId;
  const listTitle = filters.agentId ? `Chats de ${agentName(filters.agentId)}` : "Chats";
  const analyzeBtnLabel = filters.agentId
    ? `Analizar chats de ${agentName(filters.agentId)}`
    : "Analizar chats recientes";

  return (
    <div className="space-y-6 animate-fade-up flex-1 flex flex-col min-h-0">
      {/* Banner Informativo con acceso directo para probar el scroll */}
      <div className="p-4 sm:p-5 rounded-xl border border-border bg-card text-xs sm:text-sm text-muted-foreground flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-start gap-3">
          <ShieldCheck className="size-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-foreground">Supervisión y Auditoría de Calidad</p>
            <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
              Cada caso cerrado equivale a 1 conversación auditada. La IA analiza por tramos hasta
              cubrir todos los mensajes, evaluando contexto multimedia, audios y tiempos de
              respuesta.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onSelectReview(MOCK_QUALITY_REVIEW_ID)}
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold uppercase transition-all shadow-2xs cursor-pointer self-start sm:self-auto"
          title="Abrir chat de 34 mensajes con 3 tramos y hallazgos para probar el scroll independiente"
        >
          <span>🧪 Probar Scroll (34 msgs)</span>
        </button>
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

      {/* Indicadores con Skeletons */}
      <div className="shrink-0">
        <QualityStatsCards
          loading={loading}
          agentsCount={stats.length}
          chatsCount={reviews.length}
          incompleteMsgCount={incompleteMsg}
          pendingCount={pendingCount}
          failedCount={failedCount}
        />
      </div>

      {/* Barra de Filtros Unificada con Radix Select y Filtro de Críticos */}
      <div className="shrink-0">
        <QualityFiltersBar
          filters={filters}
          setFilters={setFilters}
          agentOptions={agentOptions}
          departments={departments}
          isAdmin={isAdmin}
          slaMinutes={slaConfig.responseThresholdMinutes}
          onOpenSlaModal={() => setSlaModalOpen(true)}
          batchBusy={batchBusy}
          refreshing={refreshing}
          isAnalyzingAny={Boolean(analyzingCaseId)}
          onAnalyzePendingChats={() => void analyzePendingChats()}
          onReanalyzeAllChats={() => void reanalyzeAllChats()}
          analyzeBtnLabel={analyzeBtnLabel}
          criticalCount={criticalCount}
        />
      </div>

      {/* Tablas de Ranking y Reviews con Scroll Acotado y Paginación */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-[480px] items-stretch">
        <QualityRankingTable
          stats={stats}
          loading={loading}
          refreshing={refreshing}
          selectedAgentId={filters.agentId}
          onSelectAgent={(agentId) =>
            setFilters((p) => ({
              ...p,
              agentId: p.agentId === agentId ? "" : agentId,
            }))
          }
        />

        <QualityReviewsTable
          reviews={reviews}
          loading={loading}
          refreshing={refreshing}
          listTitle={listTitle}
          showAgentColumn={showAgentColumn}
          agentName={agentName}
          onSelectReview={onSelectReview}
          onClearAgentFilter={
            filters.agentId ? () => setFilters((p) => ({ ...p, agentId: "" })) : undefined
          }
          analyzingCaseId={analyzingCaseId}
          batchBusy={batchBusy}
          analyzeChat={analyzeChat}
          analyzeBtnLabel={analyzeBtnLabel}
        />
      </section>

      <SlaSettingsModal open={slaModalOpen} onOpenChange={setSlaModalOpen} />
    </div>
  );
}
