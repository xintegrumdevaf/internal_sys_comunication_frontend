import { AlertTriangle, Clock } from "lucide-react";
import { CordialityBadge } from "@/modules/quality/ui/CordialityBadge";
import { QualityStructuredAnalysis } from "@/modules/quality/ui/QualityStructuredAnalysis";
import { QualityFindingsList } from "@/modules/quality/ui/QualityFindingsList";
import {
  qualityReviewStatusLabel,
  qualityReviewTriggerLabel,
  type QualityFindingDto,
  type QualityReviewDto,
} from "@/modules/quality/domain/quality-review";

interface QualitySummaryCardProps {
  review: QualityReviewDto;
  onScrollToMessage?: (messageId: string) => void;
  onObjectInChat?: (finding: QualityFindingDto) => void;
}

export function QualitySummaryCard({
  review,
  onScrollToMessage,
  onObjectInChat,
}: QualitySummaryCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 sm:p-5 space-y-4 shadow-xs">
      {/* Header Resumen */}
      <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
        <div>
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-foreground">
            Resumen de Evaluación
          </h3>
          <p className="text-[11px] font-mono tabular-nums text-muted-foreground mt-0.5">
            Msgs {review.messagesAnalyzed}/{review.messagesTotal}
            {review.chunkSize > 0 ? ` · tramo de ${review.chunkSize}` : ""}
          </p>
        </div>
        <CordialityBadge score={review.cordialityScore} />
      </div>

      {/* Metadata */}
      <dl className="grid grid-cols-2 gap-2 text-[11px] bg-background/50 p-2.5 rounded-lg border border-border">
        <div>
          <dt className="text-muted-foreground">Estado</dt>
          <dd className="font-bold text-foreground">{qualityReviewStatusLabel(review.status)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Origen del análisis</dt>
          <dd className="font-bold text-foreground">{qualityReviewTriggerLabel(review.trigger)}</dd>
        </div>
      </dl>

      {/* Error si falló */}
      {review.status === "failed" && (
        <div className="p-3 rounded-lg border border-danger/30 bg-danger/10 text-xs text-danger font-medium flex items-center gap-2">
          <AlertTriangle className="size-4 shrink-0" />
          <span>
            {review.errorMessage ?? "El análisis falló. Puedes reintentar desde el botón superior."}
          </span>
        </div>
      )}

      {/* Eficiencia Operativa (mostrada una sola vez de forma ejecutiva) */}
      {review.efficiencyNotes && (
        <div className="p-3 rounded-xl border border-amber-500/25 bg-amber-500/5 space-y-1 text-xs">
          <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400">
            <Clock className="size-3.5 shrink-0" />
            <span>Eficiencia y Tiempos Operativos</span>
          </div>
          <p className="text-foreground/90 leading-relaxed text-[11px]">{review.efficiencyNotes}</p>
        </div>
      )}

      {/* Observaciones y Hallazgos Visuales Unificados */}
      <QualityFindingsList
        findings={review.findings}
        onScrollToMessage={onScrollToMessage}
        onObjectInChat={onObjectInChat}
      />

      {/* Análisis y Síntesis por Tramos */}
      {review.summary && (
        <QualityStructuredAnalysis summary={review.summary} score={review.cordialityScore} />
      )}
    </div>
  );
}
