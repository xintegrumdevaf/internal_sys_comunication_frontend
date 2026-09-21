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
  formattedShort: string;
  formattedFull: string;
};

/**
 * Formatea los minutos de espera del SLA a unidades convencionales (minutos, horas o días).
 *
 * - Formato 'short' (para badges y etiquetas compactas):
 *   - < 60 min: "15m"
 *   - 1h a < 24h: "1h 15m" (o "2h" si 0 min)
 *   - >= 24h: "7d 15h" (o "7d" si 0 horas)
 *
 * - Formato 'full' (para textos descriptivos y alertas):
 *   - < 60 min: "1 minuto" / "15 minutos"
 *   - 1h a < 24h: "1 hora y 15 minutos" / "2 horas"
 *   - >= 24h: "7 días y 15 horas" / "1 día"
 */
export function formatSlaWaitTime(minutes: number, format: "short" | "full" = "short"): string {
  const safeMinutes = Math.max(0, Math.floor(minutes));

  if (safeMinutes < 60) {
    if (format === "short") {
      return `${safeMinutes}m`;
    }
    return safeMinutes === 1 ? "1 minuto" : `${safeMinutes} minutos`;
  }

  const hours = Math.floor(safeMinutes / 60);
  const remainingMins = safeMinutes % 60;

  if (hours < 24) {
    if (format === "short") {
      return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
    }
    const hoursLabel = hours === 1 ? "1 hora" : `${hours} horas`;
    if (remainingMins === 0) {
      return hoursLabel;
    }
    const minsLabel = remainingMins === 1 ? "1 minuto" : `${remainingMins} minutos`;
    return `${hoursLabel} y ${minsLabel}`;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  if (format === "short") {
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  }

  const daysLabel = days === 1 ? "1 día" : `${days} días`;
  if (remainingHours === 0) {
    return daysLabel;
  }
  const hoursLabel = remainingHours === 1 ? "1 hora" : `${remainingHours} horas`;
  return `${daysLabel} y ${hoursLabel}`;
}

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
  const defaultZeroStatus = (threshold: number): ConversationSlaStatus => ({
    isWaitingForResponse: false,
    minutesWaiting: 0,
    status: "ok",
    isBreached: false,
    thresholdMinutes: threshold,
    formattedShort: "0m",
    formattedFull: "0 minutos",
  });

  if (!config.enabled) {
    return defaultZeroStatus(config.responseThresholdMinutes);
  }

  // Una conversación no requiere SLA si está resuelta o cerrada
  const isResolvedOrClosed = conversation.status === "resolved" || conversation.status === "closed";
  if (isResolvedOrClosed) {
    return defaultZeroStatus(config.responseThresholdMinutes);
  }

  const lastPreview = conversation.lastMessagePreview;

  // Si el último mensaje registrado fue enviado por un agente humano, el asesor ya respondió a tiempo
  const isRespondedByHumanAgent = lastPreview?.author === "agent";
  if (isRespondedByHumanAgent) {
    return defaultZeroStatus(config.responseThresholdMinutes);
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
    return defaultZeroStatus(config.responseThresholdMinutes);
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
    formattedShort: formatSlaWaitTime(minutesWaiting, "short"),
    formattedFull: formatSlaWaitTime(minutesWaiting, "full"),
  };
}
