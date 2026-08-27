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
export function auditActionLabel(action: string): string {
  return AUDIT_ACTION_LABELS[action] ?? humanizeAction(action);
}
