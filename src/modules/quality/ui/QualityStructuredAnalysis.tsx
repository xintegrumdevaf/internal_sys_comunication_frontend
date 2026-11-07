import { useMemo, useState } from "react";
import {
  AlertOctagon,
  CheckCircle2,
  HelpCircle,
  Layers,
  Lightbulb,
  MessageSquareQuote,
  Sparkles,
} from "lucide-react";

interface QualityStructuredAnalysisProps {
  summary: string;
  score?: number | null;
}

interface ParsedTramo {
  index: number;
  rawText: string;
  faltas?: string;
  hasFaltasGraves: boolean;
  contexto?: string;
  recomendacion?: string;
  ejemploRespuesta?: string;
}

/**
 * Resalta de forma gráfica términos clave, citas y etiquetas estructuradas.
 */
function HighlightedText({ text }: { text: string }) {
  if (!text) return null;

  // Regex para detectar citas «...» o '...', números '1)', '2)', o etiquetas en mayúsculas
  const tokens = text.split(
    /(«[^»]+»|'[^']+'|\b\d+\)\s*|\b(?:FALTAS DETECTADAS|CONTEXTO Y MOTIVO|RECOMENDACIÓN PEDAGÓGICA|Ejemplo de respuesta adecuada|Puntos a mejorar|Eficiencia):)/gi,
  );

  return (
    <span>
      {tokens.map((token, idx) => {
        if (!token) return null;

        // Citas con comillas latinas o simples
        if (
          (token.startsWith("«") && token.endsWith("»")) ||
          (token.startsWith("'") && token.endsWith("'"))
        ) {
          return (
            <span
              key={idx}
              className="inline-block my-0.5 px-1.5 py-0.5 rounded bg-primary/10 border border-primary/25 font-bold text-foreground text-[11px] not-italic shadow-2xs"
            >
              {token}
            </span>
          );
        }

        // Números de pasos 1), 2), 3)
        if (/^\d+\)\s*$/.test(token)) {
          return (
            <span key={idx} className="font-extrabold text-primary mr-1">
              {token}
            </span>
          );
        }

        // Encabezados o etiquetas
        if (
          /^(?:FALTAS DETECTADAS|CONTEXTO Y MOTIVO|RECOMENDACIÓN PEDAGÓGICA|Ejemplo de respuesta adecuada|Puntos a mejorar|Eficiencia):$/i.test(
            token,
          )
        ) {
          return (
            <strong key={idx} className="font-extrabold uppercase text-foreground mr-1">
              {token}
            </strong>
          );
        }

        // Resaltar palabras críticas clave
        const parts = token.split(
          /\b(deficiente|ineficiencia|agresividad|falta de respeto|sanción|grave|insultos|abandono|negligente)\b/gi,
        );
        if (parts.length > 1) {
          return (
            <span key={idx}>
              {parts.map((p, pIdx) => {
                if (
                  /^(deficiente|ineficiencia|agresividad|falta de respeto|sanción|grave|insultos|abandono|negligente)$/i.test(
                    p,
                  )
                ) {
                  return (
                    <strong
                      key={pIdx}
                      className="font-extrabold text-danger bg-danger/10 px-1 py-0.2 rounded"
                    >
                      {p}
                    </strong>
                  );
                }
                return p;
              })}
            </span>
          );
        }

        return <span key={idx}>{token}</span>;
      })}
    </span>
  );
}

export function QualityStructuredAnalysis({ summary }: QualityStructuredAnalysisProps) {
  // Parser estructurado de síntesis y tramos
  const { tramos } = useMemo(() => {
    if (!summary) return { tramos: [] };

    // Buscar sección "Síntesis por tramos:"
    const tramosSplit = summary.split(/Síntesis por tramos:\s*/i);
    const tramoSection = tramosSplit[1] ? tramosSplit[1].trim() : "";

    if (!tramoSection) {
      return { tramos: [] };
    }

    // Separar por cada número de tramo "1. ", "2. ", etc.
    const tramoBlocks = tramoSection
      .split(/(?:^|\n)(?=\d+\.\s+)/)
      .filter((b) => b.trim().length > 0);

    const parsedTramos: ParsedTramo[] = tramoBlocks.map((block, idx) => {
      const cleanBlock = block.replace(/^\d+\.\s+/, "").trim();

      // Extraer Faltas detectadas
      let faltas: string | undefined;
      const faltasMatch = cleanBlock.match(
        /(?:\(1\)\s*)?FALTAS DETECTADAS:\s*([\s\S]*?)(?=(?:\(2\)\s*)?CONTEXTO Y MOTIVO:|\(3\)|RECOMENDACIÓN|$)/i,
      );
      if (faltasMatch && faltasMatch[1]) {
        faltas = faltasMatch[1].trim();
      }

      // Extraer Contexto y motivo
      let contexto: string | undefined;
      const contextoMatch = cleanBlock.match(
        /(?:\(2\)\s*)?CONTEXTO Y MOTIVO:\s*([\s\S]*?)(?=(?:\(3\)\s*)?RECOMENDACIÓN PEDAGÓGICA:|$)/i,
      );
      if (contextoMatch && contextoMatch[1]) {
        contexto = contextoMatch[1].trim();
      }

      // Extraer Recomendación pedagógica y ejemplo
      let recomendacion: string | undefined;
      let ejemploRespuesta: string | undefined;
      const recMatch = cleanBlock.match(
        /(?:\(3\)\s*)?RECOMENDACIÓN PEDAGÓGICA:\s*([\s\S]*?)(?=Ejemplo de respuesta adecuada:|$)/i,
      );
      if (recMatch && recMatch[1]) {
        recomendacion = recMatch[1].trim();
      }

      const ejemploMatch = cleanBlock.match(/Ejemplo de respuesta adecuada:\s*([\s\S]*)/i);
      if (ejemploMatch && ejemploMatch[1]) {
        ejemploRespuesta = ejemploMatch[1].trim();
      }

      const hasFaltasGraves =
        Boolean(faltas) &&
        !/no se detectan faltas/i.test(faltas ?? "") &&
        !/sin faltas/i.test(faltas ?? "");

      return {
        index: idx + 1,
        rawText: cleanBlock,
        faltas,
        hasFaltasGraves,
        contexto,
        recomendacion,
        ejemploRespuesta,
      };
    });

    return { tramos: parsedTramos };
  }, [summary]);

  const [activeTramo, setActiveTramo] = useState<number>(1);

  if (!summary) return null;

  return (
    <div className="space-y-4">
      {/* Título de Sección con badge gráfico */}
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-foreground flex items-center gap-1.5">
          <Lightbulb className="size-4 text-primary shrink-0" />
          <span>Análisis y Síntesis Ejecutiva</span>
        </h4>
        {tramos.length > 0 && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
            {tramos.length} {tramos.length === 1 ? "tramo auditado" : "tramos auditados"}
          </span>
        )}
      </div>

      {/* Selector de Tramos si hay más de 1 */}
      {tramos.length > 1 && (
        <div className="flex items-center gap-1.5 p-1 rounded-lg border border-border bg-background/80">
          <Layers className="size-3.5 text-muted-foreground ml-1.5 shrink-0" />
          <span className="text-[10px] font-bold uppercase text-muted-foreground mr-1">Tramo:</span>
          {tramos.map((t) => (
            <button
              key={t.index}
              type="button"
              onClick={() => setActiveTramo(t.index)}
              className={`px-2.5 py-1 rounded text-[10px] font-extrabold uppercase transition-all cursor-pointer ${
                activeTramo === t.index
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
              }`}
            >
              Tramo {t.index} {t.hasFaltasGraves ? "• ⚠️" : ""}
            </button>
          ))}
        </div>
      )}

      {/* Desglose Estructurado del Tramo */}
      {tramos.length > 0 ? (
        tramos
          .filter((t) => (tramos.length > 1 ? t.index === activeTramo : true))
          .map((t) => {
            const hasStructuredFields =
              Boolean(t.faltas) ||
              Boolean(t.contexto) ||
              Boolean(t.recomendacion) ||
              Boolean(t.ejemploRespuesta);

            if (!hasStructuredFields) {
              return (
                <div
                  key={t.index}
                  className="p-3.5 rounded-xl border border-border bg-background/50 text-xs leading-relaxed space-y-2 shadow-xs"
                >
                  <div className="flex items-center gap-1.5 font-bold uppercase text-[10px] text-muted-foreground">
                    <Sparkles className="size-3.5 text-primary" />
                    <span>Resumen Tramo {t.index}</span>
                  </div>
                  <p className="text-foreground/90">
                    <HighlightedText text={t.rawText} />
                  </p>
                </div>
              );
            }

            return (
              <div key={t.index} className="space-y-3">
                {/* 1. Faltas y conductas detectadas */}
                {t.faltas && (
                  <div
                    className={`p-3.5 rounded-xl border space-y-1.5 transition-all shadow-xs ${
                      t.hasFaltasGraves
                        ? "border-danger/40 bg-danger/10 text-foreground"
                        : "border-emerald-500/30 bg-emerald-500/5 text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      {t.hasFaltasGraves ? (
                        <AlertOctagon className="size-4 text-danger shrink-0" />
                      ) : (
                        <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      )}
                      <h5
                        className={`text-[11px] font-extrabold uppercase tracking-wide ${
                          t.hasFaltasGraves
                            ? "text-danger"
                            : "text-emerald-700 dark:text-emerald-300"
                        }`}
                      >
                        {t.hasFaltasGraves
                          ? "Faltas u Oportunidades Detectadas"
                          : "Conducta de Atención"}
                      </h5>
                    </div>
                    <p className="text-xs leading-relaxed">
                      <HighlightedText text={t.faltas} />
                    </p>
                  </div>
                )}

                {/* 2. Contexto y motivo del cliente */}
                {t.contexto && (
                  <div className="p-3.5 rounded-xl border border-sky-500/30 bg-sky-500/5 space-y-1.5 shadow-xs">
                    <div className="flex items-center gap-1.5">
                      <HelpCircle className="size-4 text-sky-600 dark:text-sky-400 shrink-0" />
                      <h5 className="text-[11px] font-extrabold uppercase tracking-wide text-sky-700 dark:text-sky-300">
                        Contexto y Motivo del Contacto
                      </h5>
                    </div>
                    <p className="text-xs leading-relaxed text-foreground/90">
                      <HighlightedText text={t.contexto} />
                    </p>
                  </div>
                )}

                {/* 3. Recomendación Pedagógica */}
                {t.recomendacion && (
                  <div className="p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 space-y-2 shadow-xs">
                    <div className="flex items-center gap-1.5">
                      <Lightbulb className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <h5 className="text-[11px] font-extrabold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                        Recomendación Pedagógica de Coaching
                      </h5>
                    </div>
                    <p className="text-xs leading-relaxed text-foreground/90">
                      <HighlightedText text={t.recomendacion} />
                    </p>

                    {/* Ejemplo de respuesta adecuada que debió dar */}
                    {t.ejemploRespuesta && (
                      <div className="mt-2.5 pt-2.5 border-t border-emerald-500/25 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                          <MessageSquareQuote className="size-3.5 shrink-0" />
                          <span>Ejemplo exacto de cómo debió responder el agente:</span>
                        </div>
                        <div className="p-3 rounded-lg border border-emerald-500/30 bg-background/90 text-foreground text-xs leading-relaxed italic shadow-2xs">
                          «{t.ejemploRespuesta.replace(/^[«"']+|[»"']+$/g, "")}»
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
      ) : (
        <div className="p-3.5 rounded-xl border border-border bg-background/50 text-xs leading-relaxed space-y-2 shadow-xs">
          <p className="text-foreground/90 whitespace-pre-wrap">
            <HighlightedText text={summary} />
          </p>
        </div>
      )}
    </div>
  );
}
