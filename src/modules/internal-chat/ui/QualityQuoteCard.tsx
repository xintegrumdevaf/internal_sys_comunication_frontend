import React from "react";
import type { InternalMessage } from "@/services/internalChatApi";

interface Props {
  message: InternalMessage;
  onNavigateToAudit?: (qualityReviewId: string) => void;
}

export const QualityQuoteCard: React.FC<Props> = ({ message, onNavigateToAudit }) => {
  const { category, severity, excerpt, cordialityScore, qualityReviewId } =
    (message.contextData as {
      category?: string;
      severity?: "low" | "medium" | "high";
      excerpt?: string;
      cordialityScore?: number;
      qualityReviewId?: string;
    }) || {};

  const severityColor =
    severity === "high"
      ? "bg-red-100 text-red-800 border-red-300 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800"
      : severity === "medium"
        ? "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800"
        : "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800";

  return (
    <div className="flex flex-col space-y-2 max-w-lg">
      <div className={`p-3 rounded-lg border text-sm ${severityColor}`}>
        <div className="flex items-center justify-between font-semibold mb-1 gap-2">
          <span>⚠️ Observación de Calidad ({category ?? "General"})</span>
          <span className="text-xs uppercase px-2 py-0.5 rounded-full bg-white/70 dark:bg-black/40">
            {severity ?? "Revisión"}
          </span>
        </div>

        {excerpt && (
          <blockquote className="italic border-l-2 border-current pl-2 my-2 text-xs">
            "{excerpt}"
          </blockquote>
        )}

        {cordialityScore !== undefined && (
          <div className="text-xs mt-1">
            Puntaje de cordialidad: <strong>{cordialityScore}/100</strong>
          </div>
        )}

        {qualityReviewId && onNavigateToAudit && (
          <button
            type="button"
            onClick={() => onNavigateToAudit(qualityReviewId)}
            className="mt-2 text-xs underline font-medium hover:opacity-80 block text-left cursor-pointer"
          >
            Ver conversación auditada ↗
          </button>
        )}
      </div>

      {/* Comentario del supervisor */}
      {message.body && <p className="text-sm text-foreground px-1">{message.body}</p>}
    </div>
  );
};
