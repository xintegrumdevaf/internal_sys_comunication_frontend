/**
 * Deep-link desde /calidad → /chat-interno (07_QUALITY_SUPERVISION.md §5).
 * Query: peerId + qualityReviewId. Los hallazgos se envían como mensaje del hilo
 * (no van en el composer ni en un panel con marcos).
 */

import type { QualityFindingDto, QualityReviewDto } from "@/modules/quality/domain/quality-review";
import {
  qualityFindingCategoryLabel,
  qualityFindingSeverityLabel,
} from "@/modules/quality/domain/quality-review";

export type InternalChatDeepLink = {
  threadId?: string;
  peerId?: string;
  qualityReviewId?: string;
};

export function parseInternalChatDeepLink(
  search: URLSearchParams | Record<string, unknown>,
): InternalChatDeepLink {
  const get = (key: string): string | undefined => {
    if (search instanceof URLSearchParams) {
      const value = search.get(key);
      return value && value.length > 0 ? value : undefined;
    }
    const raw = search[key];
    return typeof raw === "string" && raw.length > 0 ? raw : undefined;
  };

  return {
    threadId: get("threadId"),
    peerId: get("peerId"),
    qualityReviewId: get("qualityReviewId"),
  };
}

/** Marcador interno para no duplicar el mismo briefing en el hilo. */
export function qualityReviewMessageMarker(reviewId: string): string {
  return `[[quality-review:${reviewId}]]`;
}

/**
 * Cuerpo del mensaje que se publica en el chat 1:1 con el agente
 * (visible en la ventana de chat, no en el input).
 */
export function qualityFindingsChatMessage(review: QualityReviewDto): string {
  const negative = review.findings.filter((f) => f.severity === "high" || f.severity === "medium");
  const marker = qualityReviewMessageMarker(review.id);
  const client =
    review.customerLabel || review.waPhone
      ? `Cliente: ${review.customerLabel || "—"}${review.waPhone ? ` (${review.waPhone})` : ""}`
      : null;
  const score =
    review.cordialityScore !== null && review.cordialityScore !== undefined
      ? `Score de cordialidad: ${review.cordialityScore}`
      : null;

  const lines: string[] = ["Revisión de calidad — mensajes a justificar:", marker];
  if (client) lines.push(client);
  if (score) lines.push(score);
  if (review.summary) {
    lines.push("");
    lines.push(review.summary);
  }
  lines.push("");
  if (negative.length === 0) {
    lines.push("No hay hallazgos medium/high; comenta el tono general de la atención.");
  } else {
    negative.forEach((f, i) => {
      lines.push(
        `${i + 1}. [${qualityFindingSeverityLabel(f.severity)} · ${qualityFindingCategoryLabel(f.category)}]`,
      );
      lines.push(`   «${f.excerpt}»`);
      lines.push(`   → ${f.rationale}`);
      lines.push("");
    });
  }
  lines.push("Por favor responde en este chat con tu justificación o compromiso de mejora.");
  return lines.join("\n").trim();
}

/** @deprecated Preferir qualityFindingsChatMessage + envío al hilo. */
export function qualityReviewComposerPrefill(_qualityReviewId: string): string {
  return "";
}

/** @deprecated Preferir qualityFindingsChatMessage. */
export function qualityFindingsJustificationPrefill(
  _findings: QualityFindingDto[],
  _reviewId: string,
): string {
  return "";
}
