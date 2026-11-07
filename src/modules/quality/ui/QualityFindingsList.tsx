import {
  AlertOctagon,
  AlertTriangle,
  ArrowUpRight,
  Clock,
  Eye,
  Lightbulb,
  MessageSquare,
  Zap,
} from "lucide-react";
import {
  qualityFindingCategoryLabel,
  qualityFindingSeverityLabel,
  type QualityFindingCategory,
  type QualityFindingDto,
} from "@/modules/quality/domain/quality-review";

interface QualityFindingsListProps {
  findings: QualityFindingDto[];
  onScrollToMessage?: (messageId: string) => void;
  onObjectInChat?: (finding: QualityFindingDto) => void;
}

function cleanExcerpt(text: string): string {
  return text.replace(/^[«"']+|[»"']+$/g, "").trim();
}

/** Configuración visual diferenciada por categoría de hallazgo */
function getCategoryBadge(category: QualityFindingCategory, severity: string) {
  switch (category) {
    case "neglect":
      return {
        label: "Desatención / Abandono SLA",
        icon: Clock,
        badgeClass: "bg-danger/20 text-danger border-danger/30",
        borderClass: "border-l-danger",
        bgClass: "bg-danger/5 border-danger/25",
        originLabel: "Cliente en espera / Reclamo de atención",
      };
    case "inefficiency":
      return {
        label: "Ineficiencia Operativa",
        icon: Zap,
        badgeClass: "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30",
        borderClass: "border-l-amber-500",
        bgClass: "bg-amber-500/5 border-amber-500/25",
        originLabel: "Mensaje auditado del asesor",
      };
    case "misinformation":
      return {
        label: "Jerga / Explicación Defensiva",
        icon: AlertTriangle,
        badgeClass: "bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30",
        borderClass: "border-l-purple-500",
        bgClass: "bg-purple-500/5 border-purple-500/25",
        originLabel: "Mensaje auditado del asesor",
      };
    case "aggression":
    case "disrespect":
      return {
        label: "Falta de Respeto / Agresión",
        icon: AlertOctagon,
        badgeClass: "bg-danger/20 text-danger border-danger/30",
        borderClass: "border-l-danger",
        bgClass: "bg-danger/5 border-danger/25",
        originLabel: "Mensaje auditado del asesor",
      };
    default:
      return {
        label: qualityFindingCategoryLabel(category),
        icon: AlertTriangle,
        badgeClass:
          severity === "high"
            ? "bg-danger/20 text-danger border-danger/30"
            : "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30",
        borderClass: severity === "high" ? "border-l-danger" : "border-l-amber-500",
        bgClass:
          severity === "high"
            ? "bg-danger/5 border-danger/25"
            : "bg-amber-500/5 border-amber-500/25",
        originLabel: "Mensaje o evento auditado",
      };
  }
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
      {/* Cabecera de Sección */}
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

      {/* Lista de Hallazgos en Formato Comparativo */}
      <div className="space-y-3">
        {findings.map((f) => {
          const isHigh = f.severity === "high";
          const quoteText = cleanExcerpt(f.excerpt);
          const cat = getCategoryBadge(f.category, f.severity);
          const IconComp = cat.icon;

          return (
            <div
              key={f.id}
              className={`p-3.5 sm:p-4 rounded-xl border border-l-4 ${cat.borderClass} ${cat.bgClass} space-y-3 transition-all shadow-xs`}
            >
              {/* Cabecera del Hallazgo: Tipo de Falta y Botones de Acción Estilo Botón Real */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-extrabold uppercase tracking-wide border ${cat.badgeClass}`}
                  >
                    <IconComp className="size-3.5 shrink-0" />
                    <span>{cat.label}</span>
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      isHigh
                        ? "bg-danger/15 text-danger font-extrabold"
                        : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                    }`}
                  >
                    {qualityFindingSeverityLabel(f.severity)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {onScrollToMessage && (
                    <button
                      type="button"
                      onClick={() => onScrollToMessage(f.messageId)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-foreground border border-border bg-background hover:bg-muted transition-all cursor-pointer shadow-xs active:scale-95"
                      title="Ver mensaje en el timeline de la conversación"
                    >
                      <Eye className="size-3.5 text-primary" />
                      <span>Ver en chat</span>
                    </button>
                  )}
                  {onObjectInChat && (
                    <button
                      type="button"
                      onClick={() => onObjectInChat(f)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-foreground border border-border bg-background hover:bg-foreground/5 transition-all cursor-pointer shadow-xs active:scale-95"
                      title="Enviar observación sobre este mensaje al chat interno con el asesor"
                    >
                      <MessageSquare className="size-3.5 text-primary" />
                      <span>Objetar</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Formato Comparativo Lado a Lado: Lo Detectado vs Acción de Mejora */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 items-stretch">
                {/* Columna Izquierda: Lo Detectado (Mensaje/Evento + Diagnóstico) */}
                <div className="flex flex-col justify-between p-3 rounded-xl border border-border/80 bg-background/80 shadow-2xs space-y-2.5">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-1 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="size-3 text-primary shrink-0" />
                        <span>{cat.originLabel}</span>
                      </span>
                      {onScrollToMessage && (
                        <button
                          type="button"
                          onClick={() => onScrollToMessage(f.messageId)}
                          className="inline-flex items-center gap-0.5 text-primary hover:underline font-bold text-[10px] cursor-pointer"
                        >
                          <span>Ir al chat</span>
                          <ArrowUpRight className="size-3" />
                        </button>
                      )}
                    </div>
                    <div
                      onClick={() => onScrollToMessage?.(f.messageId)}
                      className="p-2.5 rounded-lg bg-muted/60 border border-border/60 hover:bg-muted transition-colors cursor-pointer"
                      title="Click para saltar a este mensaje en el chat"
                    >
                      <p className="text-xs font-bold text-foreground leading-snug">{quoteText}</p>
                    </div>
                  </div>

                  <div className="pt-1.5 border-t border-border/50 text-xs leading-relaxed">
                    <div className="flex items-start gap-1.5">
                      {isHigh ? (
                        <AlertOctagon className="size-3.5 text-danger shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="size-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      )}
                      <p className="text-foreground/90 text-[11px]">
                        <strong
                          className={isHigh ? "text-danger" : "text-amber-700 dark:text-amber-400"}
                        >
                          {isHigh ? "Falta: " : "Oportunidad: "}
                        </strong>
                        {f.rationale}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Columna Derecha: Acción de Mejora / Respuesta Sugerida */}
                <div className="flex flex-col justify-between p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-500/15 shadow-2xs space-y-2.5">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                      <Lightbulb className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Acción de Mejora y Solución</span>
                    </div>
                    {f.recommendation && (
                      <div className="p-2.5 rounded-lg bg-background/90 border border-emerald-500/30 shadow-2xs">
                        <p className="text-xs font-medium text-foreground leading-snug">
                          {cleanExcerpt(f.recommendation)}
                        </p>
                      </div>
                    )}
                  </div>

                  <p className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1">
                    <span>💡 Pauta consultiva para evitar reincidencia</span>
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
