import type {
  AuditCategory,
  AuditActorType,
  AuditEvent,
  AuditStats,
  AuditFilterParams,
} from "@/types/audit";

export type { AuditCategory, AuditActorType, AuditEvent, AuditStats, AuditFilterParams };

/** DTO compatible con la especificación anterior */
export type AuditEventDto = AuditEvent;

/**
 * Acciones reales que audita isp-customer-service-api hoy (ver
 * *.use-case.ts en el backend). Cualquier acción nueva que el backend
 * agregue y no esté en este diccionario se traduce automáticamente con
 * `humanizeAction` (nunca se muestra el enum crudo sin ningún intento de
 * traducción).
 */
const AUDIT_ACTION_LABELS: Record<string, string> = {
  CASE_TRANSFERRED: "Caso transferido a otra área",
  CASE_COMPLETED: "Caso resuelto",
  CASE_CANCELLED: "Caso cancelado",
  CONVERSATION_REPLY: "Respuesta enviada al cliente",
  AUTOMATION_DISABLED: "Se desactivó la automatización",
  AUTOMATION_ENABLED: "Se reactivó la automatización",
  CASE_REASSIGNED: "Caso reasignado a otro agente",
  CASE_ASSIGNED: "Caso asignado a un agente",
  CASE_AUTO_ASSIGNED: "Caso asignado automáticamente por el sistema",
  CASE_CLAIMED: "Agente reclamó el caso",
  TAKE_CONTROL: "Agente tomó el control de la conversación",
  AGENT_CREATED: "Agente creado",
  AGENT_UPDATED: "Datos del agente actualizados",
  AGENT_DEACTIVATED: "Agente desactivado",
  AGENT_PASSWORD_RESET: "Contraseña de agente restablecida",
  AGENT_SHIFT_STARTED: "Turno activado",
  AGENT_SHIFT_ENDED: "Turno cerrado",
  AGENT_AVAILABILITY_CHANGED: "Disponibilidad modificada",
  AGENT_QUEUES_CHANGED: "Colas de atención modificadas",
  USER_LOGIN: "Inicio de sesión",
  USER_LOGOUT: "Cierre de sesión",
  AUTH_FAILED: "Intento de inicio de sesión fallido",
  DEPARTMENT_CREATED: "Departamento creado",
  DEPARTMENT_UPDATED: "Departamento actualizado",
  DEPARTMENT_DEACTIVATED: "Departamento desactivado",
  N8N_WORKFLOW_SAVED: "Flujo n8n guardado",
  N8N_WORKFLOW_DEACTIVATED: "Flujo n8n desactivado",
};

const CATEGORY_LABELS: Record<AuditCategory, string> = {
  security: "Seguridad",
  operational: "Operacional",
  data_change: "Cambio de datos",
  system: "Sistema",
};

export function auditCategoryLabel(category?: string | null): string {
  if (!category) return "General";
  return CATEGORY_LABELS[category as AuditCategory] ?? humanizeAction(category);
}

function humanizeAction(action: string): string {
  return action
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** Texto claro en español para una acción de auditoría — nunca el enum crudo. */
export function auditActionLabel(
  action: string,
  metadata?: Record<string, unknown> | null,
): string {
  if (action === "AGENT_AVAILABILITY_CHANGED" && metadata) {
    if (metadata.switch === "ON" || metadata.currentAutoAssign === true) {
      return "Turno activado";
    }
    if (metadata.switch === "OFF" || metadata.currentAutoAssign === false) {
      return "Turno cerrado";
    }
  }
  return AUDIT_ACTION_LABELS[action] ?? humanizeAction(action);
}

/**
 * Convierte una fecha YYYY-MM-DD en string ISO al inicio del día (00:00:00.000 local).
 */
export function toIsoStart(dateYmd: string): string | undefined {
  if (!dateYmd || typeof dateYmd !== "string") return undefined;
  const [year, month, day] = dateYmd.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  const date = new Date(year, month - 1, day, 0, 0, 0, 0);
  return isNaN(date.getTime()) ? undefined : date.toISOString();
}

/**
 * Convierte una fecha YYYY-MM-DD en string ISO al final del día (23:59:59.999 local).
 */
export function toIsoEnd(dateYmd: string): string | undefined {
  if (!dateYmd || typeof dateYmd !== "string") return undefined;
  const [year, month, day] = dateYmd.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  const date = new Date(year, month - 1, day, 23, 59, 59, 999);
  return isNaN(date.getTime()) ? undefined : date.toISOString();
}

/**
 * Resuelve y normaliza el rango de fechas para el backend de auditoría en formato ISO-8601.
 * Si solo se define 'from', cubre hasta el final del día de hoy (o del día especificado si es futuro).
 * Si solo se define 'to', cubre desde el inicio de la época hasta el final de esa fecha.
 * Si ambos son vacíos, retorna { from: undefined, to: undefined }.
 */
export function resolveAuditDateRange(
  fromYmd?: string,
  toYmd?: string,
): { from?: string; to?: string } {
  const fromClean = fromYmd?.trim() || "";
  const toClean = toYmd?.trim() || "";

  if (!fromClean && !toClean) {
    return { from: undefined, to: undefined };
  }

  if (fromClean && !toClean) {
    const fromIso = toIsoStart(fromClean);
    const now = new Date();
    const todayEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999,
    ).toISOString();
    const toIso = fromIso && fromIso > todayEnd ? toIsoEnd(fromClean) : todayEnd;
    return { from: fromIso, to: toIso };
  }

  if (!fromClean && toClean) {
    return { from: new Date(0).toISOString(), to: toIsoEnd(toClean) };
  }

  return {
    from: toIsoStart(fromClean),
    to: toIsoEnd(toClean),
  };
}
