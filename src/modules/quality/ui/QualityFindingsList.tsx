import { AlertOctagon, AlertTriangle, Eye, Lightbulb, MessageSquare } from "lucide-react";
import {
  qualityFindingCategoryLabel,
  qualityFindingSeverityLabel,
  type QualityFindingDto,
} from "@/modules/quality/domain/quality-review";

interface QualityFindingsListProps {
  findings: QualityFindingDto[];
  onScrollToMessage?: (messageId: string) => void;
  onObjectInChat?: (finding: QualityFindingDto) => void;
}

export function QualityFindingsList({
  findings,
  onScrollToMessage,
  onObjectInChat,
}: QualityFindingsListProps) {
  if (findings.length === 0) {
    return (
      <div className="p-4 rounded-xl border border-border bg-background/50 text-center space-y-1 shadow-xs">
        <p className="text-xs font-bold text-foreground">Sin observaciones críticas</p>
        <p className="text-[11px] text-muted-foreground">
          No se detectaron faltas graves ni oportunidades de mejora en esta conversación.
        </p>
      </div>
    );
  }

  const highCount = findings.filter((f) => f.severity === "high").length;
  const mediumCount = findings.filter((f) => f.severity === "medium").length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-xs font-extrabold uppercase tracking-widest text-foreground flex items-center gap-1.5">
          <span>Observaciones y Conductas ({findings.length})</span>
        </h4>
        <div className="flex items-center gap-1.5 text-[10px] font-bold">
          {highCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-danger/15 text-danger border border-danger/25">
              {highCount} {highCount === 1 ? "Grave" : "Graves"}
            </span>
          )}
          {mediumCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/25">
              {mediumCount} a mejorar
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2.5">
        {findings.map((f) => {
          const isHigh = f.severity === "high";

          return (
            <div
              key={f.id}
              className={`p-3.5 rounded-xl border space-y-3 transition-all shadow-xs ${
                isHigh ? "border-danger/40 bg-danger/5" : "border-amber-500/35 bg-amber-500/5"
              }`}
            >
              {/* Cabecera del Hallazgo: Categoría, Gravedad y Acciones */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide ${
                      isHigh
                        ? "bg-danger/20 text-danger"
                        : "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                    }`}
                  >
                    {qualityFindingCategoryLabel(f.category)}
                  </span>
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">
                    • {qualityFindingSeverityLabel(f.severity)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {onScrollToMessage && (
                    <button
                      type="button"
                      onClick={() => onScrollToMessage(f.messageId)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold text-muted-foreground hover:text-foreground border border-border/80 bg-background/80 hover:bg-muted transition-colors cursor-pointer"
                      title="Ver mensaje en el timeline de la conversación"
                    >
                      <Eye className="size-3" />
                      <span>Ver en chat</span>
                    </button>
                  )}
                  {onObjectInChat && (
                    <button
                      type="button"
                      onClick={() => onObjectInChat(f)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold text-foreground border border-border/80 bg-background hover:bg-foreground/5 transition-colors cursor-pointer shadow-2xs"
                      title="Enviar observación sobre este mensaje al chat interno con el asesor"
                    >
                      <MessageSquare className="size-3 text-primary" />
                      <span>Objetar</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Mensaje visual auditado del Asesor */}
              <div className="rounded-lg border border-border/80 bg-background/90 p-2.5 shadow-2xs space-y-1">
                <div className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  <MessageSquare className="size-3 text-primary shrink-0" />
                  <span>Mensaje auditado del asesor:</span>
                </div>
                <p className="text-xs font-semibold italic text-foreground px-1 leading-snug">
                  «{f.excerpt}»
                </p>
              </div>

              {/* Diagnóstico puntual del problema */}
              <div className="flex items-start gap-2 text-xs leading-relaxed">
                {isHigh ? (
                  <AlertOctagon className="size-4 text-danger shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                )}
                <div className="text-foreground/90">
                  <strong className={isHigh ? "text-danger" : "text-amber-700 dark:text-amber-400"}>
                    {isHigh ? "Falta detectada: " : "Oportunidad de mejora: "}
                  </strong>
                  <span>{f.rationale}</span>
                </div>
              </div>

              {/* Recomendación pedagógica / Cómo debió responder */}
              {f.recommendation && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 space-y-1 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                    <Lightbulb className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Acción recomendada / Debió decir:</span>
                  </div>
                  <p className="text-xs text-foreground/95 leading-relaxed font-medium pl-5">
                    {f.recommendation}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
