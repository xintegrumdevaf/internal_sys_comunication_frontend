import type { ConversationDto } from "@/modules/conversations/domain/conversation";

export type SlaConfigDto = {
  /** Tiempo límite de respuesta en minutos (ej. 5) */
  responseThresholdMinutes: number;
  /** Activar/desactivar las alertas de SLA globalmente */
  enabled: boolean;
  /** Activar/desactivar sonido de alerta al superar el SLA */
  alertSoundEnabled: boolean;
  /** Porcentaje a partir del cual se muestra estado de advertencia (ej. 80% = 4m para un límite de 5m) */
  warningThresholdPercent: number;
};

export const DEFAULT_SLA_CONFIG: SlaConfigDto = {
  responseThresholdMinutes: 5,
  enabled: true,
  alertSoundEnabled: false,
  warningThresholdPercent: 80,
};

export type ConversationSlaStatus = {
  isWaitingForResponse: boolean;
  minutesWaiting: number;
  status: "ok" | "warning" | "breached";
  isBreached: boolean;
  thresholdMinutes: number;
};

/**
 * Calcula si una conversación tiene un mensaje de cliente pendiente de respuesta por parte del asesor humano
 * y si ha superado el umbral configurable de SLA (ej. 5 minutos).
 */
export function calculateConversationSla(
  conversation: Pick<
    ConversationDto,
    "status" | "lastActivityAt" | "lastMessagePreview" | "activeCase"
  >,
  config: SlaConfigDto = DEFAULT_SLA_CONFIG,
): ConversationSlaStatus {
  if (!config.enabled) {
    return {
      isWaitingForResponse: false,
      minutesWaiting: 0,
      status: "ok",
      isBreached: false,
      thresholdMinutes: config.responseThresholdMinutes,
    };
  }

  // Una conversación no requiere SLA si está resuelta o cerrada
  const isResolvedOrClosed = conversation.status === "resolved" || conversation.status === "closed";
  if (isResolvedOrClosed) {
    return {
      isWaitingForResponse: false,
      minutesWaiting: 0,
      status: "ok",
      isBreached: false,
      thresholdMinutes: config.responseThresholdMinutes,
    };
  }

  const lastPreview = conversation.lastMessagePreview;

  // Si el último mensaje registrado fue enviado por un agente humano, el asesor ya respondió a tiempo
  const isRespondedByHumanAgent = lastPreview?.author === "agent";
  if (isRespondedByHumanAgent) {
    return {
      isWaitingForResponse: false,
      minutesWaiting: 0,
      status: "ok",
      isBreached: false,
      thresholdMinutes: config.responseThresholdMinutes,
    };
  }

  // La conversación requiere respuesta si:
  // 1. El último mensaje fue del cliente (inbound/customer), O
  // 2. La conversación está en atención humana (HUMAN_ACTIVE / asignada a un asesor) y el asesor no ha respondido
  // (un mensaje automático del bot de la IA no cuenta como respuesta del asesor humano).
  const isHumanHandled =
    conversation.activeCase?.status === "HUMAN_ACTIVE" ||
    conversation.activeCase?.automationEnabled === false ||
    Boolean(conversation.activeCase?.assignedAgentId);

  const isLastFromCustomer =
    Boolean(lastPreview) &&
    (lastPreview?.author === "customer" || lastPreview?.direction === "inbound");

  const isWaitingForResponse = isLastFromCustomer || (isHumanHandled && !isRespondedByHumanAgent);

  if (!isWaitingForResponse) {
    return {
      isWaitingForResponse: false,
      minutesWaiting: 0,
      status: "ok",
      isBreached: false,
      thresholdMinutes: config.responseThresholdMinutes,
    };
  }

  // Calcular minutos transcurridos desde la última actividad / mensaje del cliente
  const lastActivityTime = new Date(
    lastPreview?.createdAt || conversation.lastActivityAt,
  ).getTime();
  const now = Date.now();
  const diffMs = Math.max(0, now - lastActivityTime);
  const minutesWaiting = Math.floor(diffMs / 60000);

  const threshold = config.responseThresholdMinutes || 5;
  const warningMinutes = Math.floor((threshold * config.warningThresholdPercent) / 100);

  const isBreached = minutesWaiting >= threshold;
  const isWarning = !isBreached && minutesWaiting >= warningMinutes;

  return {
    isWaitingForResponse: true,
    minutesWaiting,
    status: isBreached ? "breached" : isWarning ? "warning" : "ok",
    isBreached,
    thresholdMinutes: threshold,
  };
}
