import type {
  TelegramAlertRuleConfig,
  TelegramSettings,
  TelegramTopicConfig,
} from "./settings.types";

export const DEFAULT_TELEGRAM_TOPICS: TelegramTopicConfig[] = [
  {
    id: "topic-sla",
    name: "Alertas de SLA & Demoras",
    category: "SLA",
    threadId: 10,
    enabled: true,
  },
  {
    id: "topic-infra",
    name: "Infraestructura & Fibra / OLT",
    category: "INFRASTRUCTURE",
    threadId: 20,
    enabled: true,
  },
  {
    id: "topic-digests",
    name: "Pulso Operativo Ejecutivo",
    category: "DIGEST",
    threadId: 30,
    enabled: true,
  },
];

export const DEFAULT_TELEGRAM_ALERT_RULES: TelegramAlertRuleConfig[] = [
  {
    id: "rule-sla-delay",
    name: "Demora Crítica en Atención Humana",
    category: "SLA",
    threshold: 15,
    unit: "minutos",
    severity: "CRITICAL",
    enabled: true,
    description: "Alerta roja si un cliente asignado a un asesor supera este tiempo sin respuesta.",
  },
  {
    id: "rule-infra-outage",
    name: "Corte Masivo o Falla de Sector (OLT)",
    category: "INFRASTRUCTURE",
    threshold: 3,
    unit: "reclamos",
    severity: "CRITICAL",
    enabled: true,
    description:
      "Dispara aviso urgente si varios clientes del mismo sector reportan fallas en los últimos 30m.",
  },
  {
    id: "rule-queue-overflow",
    name: "Saturación de Cola de Espera",
    category: "QUEUE",
    threshold: 10,
    unit: "casos en cola",
    severity: "WARNING",
    enabled: true,
    description:
      "Avisa si la cola de espera de cualquier departamento supera este volumen sin agentes libres.",
  },
];

export const DEFAULT_TELEGRAM_SETTINGS: TelegramSettings = {
  enabled: false,
  botToken: "",
  defaultChatId: "",
  topicsEnabled: false,
  topics: DEFAULT_TELEGRAM_TOPICS,
  slaTopicId: 10,
  infraTopicId: 20,
  digestsTopicId: 30,
  digestsEnabled: true,
  digestHours: ["09:00", "14:00", "19:00"],
  timeZone: "America/Guayaquil",
  alertRules: DEFAULT_TELEGRAM_ALERT_RULES,
  slaThresholdMinutes: 15,
  infraAlertMinCases: 3,
  queueSaturationThreshold: 10,
  webhookSecret: "",
  commandsEnabled: true,
  aiCopilotEnabled: false,
  frontendUrl: "",
};

/**
 * Ensures loaded Telegram settings have normalized booleans and non-empty rule/topic defaults.
 */
export function normalizeTelegramSettings(data: TelegramSettings): TelegramSettings {
  return {
    ...data,
    topicsEnabled: Boolean(data.topicsEnabled),
    topics: data.topics && data.topics.length > 0 ? data.topics : DEFAULT_TELEGRAM_TOPICS,
    alertRules:
      data.alertRules && data.alertRules.length > 0
        ? data.alertRules
        : DEFAULT_TELEGRAM_ALERT_RULES,
  };
}

/**
 * Strips UI masking tokens so live connection checks fall back to persisted backend tokens.
 */
export function extractCleanBotToken(token?: string): string | undefined {
  const trimmed = token?.trim();
  if (!trimmed || trimmed.includes("•") || trimmed.includes("*")) {
    return undefined;
  }
  return trimmed;
}

/**
 * Validates and normalizes a 24h HH:mm schedule string, returning an error message when invalid.
 */
export function validateDigestHourInput(
  rawHour: string,
  existingHours: string[],
): { hour?: string; error?: string; info?: string } {
  const trimmed = rawHour.trim();
  if (!/^\d{2}:\d{2}$/.test(trimmed)) {
    return { error: "El formato debe ser HH:mm en 24 horas (ej. 08:30 o 18:00)" };
  }
  const [hours, minutes] = trimmed.split(":").map(Number);
  if (
    hours === undefined ||
    minutes === undefined ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return { error: "Hora inválida" };
  }
  if (existingHours.includes(trimmed)) {
    return { info: "Ese horario ya está en la lista" };
  }
  return { hour: trimmed };
}

export function buildNewTelegramTopic(): TelegramTopicConfig {
  return {
    id: `topic-${Date.now()}`,
    name: "Nuevo Tema",
    category: "GENERAL",
    threadId: 1,
    enabled: true,
  };
}

export function buildNewTelegramAlertRule(): TelegramAlertRuleConfig {
  return {
    id: `rule-${Date.now()}`,
    name: "Nueva Regla de Alerta",
    category: "SLA",
    threshold: 15,
    unit: "minutos",
    severity: "CRITICAL",
    enabled: true,
    description: "Descripción de la condición que dispara este aviso.",
  };
}
