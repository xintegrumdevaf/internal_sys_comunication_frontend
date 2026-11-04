import { AlertTriangle, Clock, Lightbulb } from "lucide-react";
import { CordialityBadge } from "@/modules/quality/ui/CordialityBadge";
import {
  qualityFindingCategoryLabel,
  qualityReviewStatusLabel,
  qualityReviewTriggerLabel,
  type QualityFindingDto,
  type QualityReviewDto,
} from "@/modules/quality/domain/quality-review";

interface QualitySummaryCardProps {
  review: QualityReviewDto;
}

export function QualitySummaryCard({ review }: QualitySummaryCardProps) {
  const highFindings = (review.findings || []).filter(
    (f: QualityFindingDto) => f.severity === "high",
  );
  const mediumFindings = (review.findings || []).filter(
    (f: QualityFindingDto) => f.severity === "medium",
  );

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-4 shadow-xs">
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

      {/* Faltas Críticas Destacadas Directamente */}
      {highFindings.length > 0 && (
        <div className="p-3.5 rounded-lg border border-danger/40 bg-danger/10 text-danger space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 shrink-0" />
            <h4 className="text-xs font-extrabold uppercase tracking-wide">
              Faltas graves detectadas ({highFindings.length})
            </h4>
          </div>
          <ul className="space-y-2 text-xs">
            {highFindings.map((f: QualityFindingDto) => (
              <li
                key={f.id}
                className="bg-card/80 p-2.5 rounded-md border border-danger/30 text-foreground space-y-1"
              >
                <div className="flex items-center justify-between gap-1.5">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-danger/20 text-danger">
                    {qualityFindingCategoryLabel(f.category)}
                  </span>
                  <span className="text-[10px] text-danger font-bold uppercase">Alta gravedad</span>
                </div>
                <p className="text-[12px] font-semibold italic text-danger/90">«{f.excerpt}»</p>
                <p className="text-[11px] text-muted-foreground">{f.rationale}</p>
                {f.recommendation && (
                  <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 mt-1">
                    💡 Debió decir: {f.recommendation}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Puntos Medios a Mejorar */}
      {mediumFindings.length > 0 && (
        <div className="p-3 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="size-3.5 shrink-0" />
            <h4 className="text-[11px] font-bold uppercase tracking-wide">
              Puntos a mejorar ({mediumFindings.length})
            </h4>
          </div>
          <ul className="space-y-1.5 text-[11px]">
            {mediumFindings.map((f: QualityFindingDto) => (
              <li key={f.id} className="text-foreground/90">
                <span className="font-semibold text-amber-600 dark:text-amber-400">
                  [{qualityFindingCategoryLabel(f.category)}]
                </span>{" "}
                «{f.excerpt}» — {f.rationale}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Resumen Detallado / Síntesis */}
      {review.summary && (
        <div className="space-y-1.5">
          <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <Lightbulb className="size-3.5 text-primary" />
            <span>Análisis y Síntesis</span>
          </h4>
          <div className="p-3 rounded-lg border border-border bg-background/50 text-[12px] leading-relaxed text-foreground/90 whitespace-pre-wrap">
            {review.summary}
          </div>
        </div>
      )}

      {/* Eficiencia Operativa */}
      {review.efficiencyNotes && (
        <div className="space-y-1.5">
          <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <Clock className="size-3.5 text-amber-500" />
            <span>Eficiencia y Tiempos de Respuesta</span>
          </h4>
          <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 text-[12px] leading-relaxed text-foreground/90">
            {review.efficiencyNotes}
          </div>
        </div>
      )}
    </div>
  );
}
