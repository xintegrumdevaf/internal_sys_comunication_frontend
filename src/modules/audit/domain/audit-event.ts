export type AuditEventDto = {
  id: string;
  action: string;
  actorUserId?: string | null;
  resourceType: string;
  resourceId: string;
  metadata?: Record<string, string | number | boolean | null>;
  createdAt: string;
};

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
};

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
