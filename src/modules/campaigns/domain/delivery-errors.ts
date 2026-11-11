/**
 * Traductor de errores de Meta WhatsApp Cloud API / Zernio para la interfaz de usuario.
 */

export function translateDeliveryError(
  rawError?: string | null,
  code?: number | string | null,
): string {
  const codeStr = code !== undefined && code !== null ? String(code).trim() : null;
  const raw = (rawError || "").trim();
  const lower = raw.toLowerCase();

  // 1. Error 131049: Límite de marketing / ecosistema de Meta
  if (
    codeStr === "131049" ||
    lower.includes("131049") ||
    lower.includes("healthy ecosystem engagement") ||
    lower.includes("ecosystem engagement") ||
    lower.includes("marketing message limit")
  ) {
    return "Límite de protección de Meta: Meta bloqueó la entrega para evitar saturar al destinatario con mensajes de marketing/campaña (Error Meta 131049).";
  }

  // 2. Error 131047: Ventana de 24 horas cerrada
  if (
    codeStr === "131047" ||
    lower.includes("131047") ||
    lower.includes("24 hours") ||
    lower.includes("24-hour") ||
    lower.includes("customer service window") ||
    lower.includes("re-engagement") ||
    (lower.includes("template") && lower.includes("required"))
  ) {
    return "Ventana de 24 horas cerrada: Han transcurrido más de 24h desde el último mensaje del cliente. WhatsApp requiere una plantilla oficial (Template) aprobada (Error Meta 131047).";
  }

  // 3. Error 131026: Número no disponible o sin WhatsApp
  if (
    codeStr === "131026" ||
    lower.includes("131026") ||
    lower.includes("message undeliverable") ||
    lower.includes("undeliverable")
  ) {
    return "Número no disponible: El destinatario no tiene una cuenta activa de WhatsApp o no puede recibir mensajes en este momento (Error Meta 131026).";
  }

  // 4. Error 131051: Límite de tipo de mensaje superado
  if (codeStr === "131051" || lower.includes("131051") || lower.includes("unsupported message type")) {
    return "Tipo de mensaje no admitido o se superó el límite de frecuencia para este tipo de contenido (Error Meta 131051).";
  }

  // 5. Error 131056: Discrepancia de variables en plantilla
  if (
    codeStr === "131056" ||
    lower.includes("131056") ||
    lower.includes("param count mismatch") ||
    lower.includes("variable mapping")
  ) {
    return "Error en plantilla: Las variables enviadas no coinciden con los parámetros requeridos por la plantilla (Error Meta 131056).";
  }

  // 6. Error 132000: Plantilla no existe
  if (
    codeStr === "132000" ||
    lower.includes("132000") ||
    lower.includes("template does not exist")
  ) {
    return "La plantilla indicada no existe o no está aprobada en el idioma seleccionado (Error Meta 132000).";
  }

  // 7. Error 132001: Plantilla pausada por Meta
  if (codeStr === "132001" || lower.includes("132001") || lower.includes("template paused")) {
    return "Plantilla pausada temporalmente por Meta debido a reportes de baja calidad (Error Meta 132001).";
  }

  // 8. Error 132007: Plantilla deshabilitada
  if (codeStr === "132007" || lower.includes("132007") || lower.includes("template disabled")) {
    return "Plantilla deshabilitada permanentemente por Meta por infracción de políticas de mensajería (Error Meta 132007).";
  }

  // 9. Error 130429 o 429: Rate limit
  if (
    codeStr === "130429" ||
    lower.includes("130429")
  ) {
    return "Límite de tasa alcanzado: Se superó la cantidad de mensajes permitidos por segundo en Meta/Zernio (Error Rate Limit).";
  }

  return raw || "Error de entrega en WhatsApp / Meta";
}

