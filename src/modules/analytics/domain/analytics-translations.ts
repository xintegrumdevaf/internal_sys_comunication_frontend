export const WORKFLOW_LABELS: Record<string, string> = {
  SUPPORT_INTERNET: "Soporte Técnico",
  BILLING_BALANCE: "Facturación",
  GENERAL_INQUIRY: "Consultas Generales",
  UNCLASSIFIED: "Sin clasificar",
  SALES_PACKAGES: "Ventas",
};

export const ESCALATION_REASON_LABELS: Record<string, string> = {
  EXTERNAL_SERVICE_ERROR: "Falla de servicio externo",
  REQUEST_HUMAN: "Solicitud de asesor humano",
  UNCLEAR: "Consulta no comprendida",
  UNSUPPORTED_ACTION: "Acción no soportada",
  MAX_ATTEMPTS_EXCEEDED: "Límite de intentos excedido",
  PAYMENT_RECEIPT_ESCALATED: "Comprobante de pago recibido",
  "Comprobante de pago adjunto (documento/imagen)": "Comprobante de pago adjunto",
  DIAGNOSTIC_FAILED: "Diagnóstico no concluyente",
};

export const STEP_LABELS: Record<string, string> = {
  TRIAGE: "Mesa de Triaje",
  VALIDATE_CLIENT: "Validación de Cliente",
  CHECK_CLIENT_STATUS: "Estado de Cuenta",
  CHECK_BALANCE: "Consulta de Saldo",
  DIAGNOSTIC: "Diagnóstico Técnico",
  WAITING_USER_CLIENT: "Esperando Cédula",
  WAITING_USER_DISAMBIGUATE: "Desambiguación de Contrato",
  WAITING_USER_DIAGNOSTIC: "Revisión de Router",
  WAITING_USER_RECEIPT: "Esperando Comprobante",
  CLOSED_PENDING_PAYMENT: "Pendiente de Pago",
  RESPOND_NO_DEBT: "Sin Deuda",
  RESPOND_DEBT_WITH_OPTIONS: "Saldo Pendiente",
  RECORD_PAYMENT: "Registro de Pago",
};

export function formatWorkflow(val?: string | null): string {
  if (!val) return "Sin clasificar";
  const key = val.toUpperCase().trim();
  return WORKFLOW_LABELS[key] ?? val.replace(/_/g, " ");
}

export function formatEscalationReason(val?: string | null): string {
  if (!val) return "Sin especificar";
  const key = val.trim();
  return ESCALATION_REASON_LABELS[key] ?? ESCALATION_REASON_LABELS[key.toUpperCase()] ?? val.replace(/_/g, " ");
}

export function formatStep(val?: string | null): string {
  if (!val) return "";
  const key = val.toUpperCase().trim();
  return STEP_LABELS[key] ?? val.replace(/_/g, " ");
}
