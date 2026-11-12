import type { CaseStatus } from "./case";

export type HumanHandlingTone = "danger" | "warning" | "info" | "neutral";

export type HumanHandlingCategory =
  | "ai_error"
  | "external_error"
  | "unclear"
  | "unsupported"
  | "human_direct"
  | "client_request"
  | "manual"
  | "auto_assigned"
  | "queue"
  | "human";

export type HumanHandlingDescription = {
  category: HumanHandlingCategory;
  /** Etiqueta breve para badges compactos en lista lateral y cabecera del chat. */
  badgeLabel: string;
  /** Título descriptivo del motivo por el cual el caso está en atención humana. */
  reasonLabel: string;
  /** Explicación completa sin ambigüedad (tooltip y tarjeta de detalle en CasePanel). */
  detail: string;
  /** Severidad visual: danger = error técnico, warning = sin comprensión / en cola, info = flujo normal. */
  tone: HumanHandlingTone;
  /** True si está esperando agente libre en el área. */
  isWaitingQueue: boolean;
};

/**
 * Traduce el estado del caso y `automation.disabledReason` en etiquetas claras
 * para que el agente/supervisor distinga fallo de IA, falta de comprensión,
 * solicitud directa de humano o espera en cola por falta de asesores libres.
 */
export function describeHumanHandling(params: {
  status?: CaseStatus;
  assignedAgentName?: string | null;
  disabledReason?: string | null;
}): HumanHandlingDescription {
  const { status, assignedAgentName, disabledReason } = params;
  const agent = assignedAgentName?.trim() || null;
  const isWaitingQueue = !agent && status === "ESCALATED";
  const rawReason = disabledReason?.trim() ?? "";
  const upper = rawReason.toUpperCase();
  const queueSuffix = isWaitingQueue
    ? " Está en cola esperando que un asesor del área se libere."
    : "";

  if (upper.includes("AI_ERROR")) {
    return {
      category: "ai_error",
      badgeLabel: agent
        ? `${agent} · Fallo IA`
        : isWaitingQueue
          ? "En cola · Fallo IA"
          : "Fallo IA",
      reasonLabel: "Fallo técnico del proveedor de IA",
      detail: `El modelo de IA devolvió un error o respuesta inválida y no pudo procesar el mensaje.${queueSuffix}`,
      tone: "danger",
      isWaitingQueue,
    };
  }

  if (upper.includes("TIMEOUT")) {
    return {
      category: "external_error",
      badgeLabel: agent
        ? `${agent} · Timeout externo`
        : isWaitingQueue
          ? "En cola · Timeout"
          : "Timeout externo",
      reasonLabel: "Tiempo de espera agotado",
      detail: `Un servicio externo tardó demasiado en responder y el caso fue derivado a humano.${queueSuffix}`,
      tone: "danger",
      isWaitingQueue,
    };
  }

  if (upper.includes("EXTERNAL_SERVICE_ERROR")) {
    return {
      category: "external_error",
      badgeLabel: agent
        ? `${agent} · Fallo sistema`
        : isWaitingQueue
          ? "En cola · Fallo sistema"
          : "Fallo sistema",
      reasonLabel: "Fallo en sistema externo (CRM/ISP)",
      detail: `Ocurrió una falla técnica consultando sistemas externos durante la atención.${queueSuffix}`,
      tone: "danger",
      isWaitingQueue,
    };
  }

  if (upper.includes("MAX_CLARIFY_ATTEMPTS_EXCEEDED")) {
    return {
      category: "unclear",
      badgeLabel: agent
        ? `${agent} · IA no entendió`
        : isWaitingQueue
          ? "En cola · IA no entendió"
          : "IA no entendió",
      reasonLabel: "IA no logró clasificar tras repregunta",
      detail: `Tras dos mensajes sin certeza suficiente, la IA derivó automáticamente el caso.${queueSuffix}`,
      tone: "warning",
      isWaitingQueue,
    };
  }

  if (upper.includes("UNSUPPORTED")) {
    return {
      category: "unsupported",
      badgeLabel: agent
        ? `${agent} · Fuera de alcance IA`
        : isWaitingQueue
          ? "En cola · Fuera de alcance"
          : "Fuera de alcance IA",
      reasonLabel: "Solicitud sin flujo automático",
      detail: `La intención del cliente no cuenta con flujo automatizado configurado.${queueSuffix}`,
      tone: "warning",
      isWaitingQueue,
    };
  }

  if (rawReason.toLowerCase().startsWith("atención personalizada requerida")) {
    return {
      category: "human_direct",
      badgeLabel: agent
        ? `${agent} · Directo`
        : isWaitingQueue
          ? "En cola · Directo"
          : "Atención directa",
      reasonLabel: rawReason,
      detail: `Este tipo de consulta está configurado para atención humana directa.${queueSuffix}`,
      tone: isWaitingQueue ? "warning" : "info",
      isWaitingQueue,
    };
  }

  if (upper.includes("REQUEST_HUMAN")) {
    return {
      category: "client_request",
      badgeLabel: agent
        ? `${agent} · Pidió asesor`
        : isWaitingQueue
          ? "En cola · Pidió asesor"
          : "Pidió asesor",
      reasonLabel: "Cliente solicitó atención humana",
      detail: `El cliente pidió hablar con una persona o requirió derivación directa.${queueSuffix}`,
      tone: isWaitingQueue ? "warning" : "info",
      isWaitingQueue,
    };
  }

  if (rawReason.toLowerCase() === "manual_override") {
    return {
      category: "manual",
      badgeLabel: agent ? `Manual: ${agent}` : "Control manual",
      reasonLabel: "Control tomado manualmente por un asesor",
      detail: agent
        ? `${agent} tomó el control manual de la conversación y pausó al asistente IA.`
        : "Un asesor tomó el control manual y pausó al asistente IA.",
      tone: "info",
      isWaitingQueue: false,
    };
  }

  if (upper === "AUTO_ASSIGNED") {
    return {
      category: "auto_assigned",
      badgeLabel: agent ? `Humano: ${agent}` : "Auto-asignado",
      reasonLabel: "Derivado y auto-asignado a agente disponible",
      detail: agent
        ? `El caso fue asignado automáticamente a ${agent} para atención humana.`
        : "El caso fue derivado automáticamente a atención humana.",
      tone: "info",
      isWaitingQueue: false,
    };
  }

  if (isWaitingQueue) {
    return {
      category: "queue",
      badgeLabel: "En cola · Esperando agente",
      reasonLabel: rawReason || "Esperando asesor disponible en el área",
      detail:
        "No había agentes disponibles con cupo al momento de escalar; el caso aguarda en cola a que uno se libere o lo reclame.",
      tone: "warning",
      isWaitingQueue: true,
    };
  }

  if (agent) {
    return {
      category: "human",
      badgeLabel: `Humano: ${agent}`,
      reasonLabel: rawReason || "En atención por asesor humano",
      detail: rawReason
        ? `${rawReason} · Atendido por ${agent}.`
        : `Atendido actualmente por ${agent}.`,
      tone: "info",
      isWaitingQueue: false,
    };
  }

  return {
    category: "human",
    badgeLabel: "Humano (Sin asignar)",
    reasonLabel: rawReason || "Pendiente de asignación a un asesor",
    detail: rawReason || "Caso en atención humana pendiente de que un asesor lo reclame.",
    tone: "warning",
    isWaitingQueue: false,
  };
}
