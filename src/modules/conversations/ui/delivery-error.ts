import { isWhatsAppSessionWindowError } from "@/modules/conversations/domain/customer-service-window";

export interface FormattedDeliveryError {
  is24h: boolean;
  short: string;
  detail: string;
}

export function formatDeliveryError(errorMessage?: string | null): FormattedDeliveryError {
  if (!errorMessage) {
    return {
      is24h: false,
      short: "Fallo de entrega",
      detail: "Error de entrega en WhatsApp / Meta",
    };
  }
  if (isWhatsAppSessionWindowError(errorMessage)) {
    return {
      is24h: true,
      short: "Ventana 24h cerrada (Requiere plantilla)",
      detail:
        "Han pasado más de 24 horas desde el último mensaje del cliente. WhatsApp exige enviar una plantilla aprobada (Template) para reabrir el chat.",
    };
  }
  let raw = errorMessage;
  try {
    const parsed = JSON.parse(errorMessage);
    if (typeof parsed === "object" && parsed !== null) {
      raw = parsed.explanation || parsed.details || parsed.message || parsed.title || errorMessage;
    }
  } catch {
    // Si no es JSON válido, se conserva el errorMessage original como texto plano
  }

  return {
    is24h: false,
    short: "Fallo de entrega",
    detail: raw,
  };
}
