import { describe, expect, it } from "vitest";
import { formatDeliveryError } from "./delivery-error";

describe("formatDeliveryError", () => {
  it("retorna fallo genérico cuando el mensaje es nulo o indefinido", () => {
    expect(formatDeliveryError(null)).toEqual({
      is24h: false,
      short: "Fallo de entrega",
      detail: "Error de entrega en WhatsApp / Meta",
    });
    expect(formatDeliveryError(undefined)).toEqual({
      is24h: false,
      short: "Fallo de entrega",
      detail: "Error de entrega en WhatsApp / Meta",
    });
  });

  it("identifica errores de ventana de 24h cerrada", () => {
    const errorJson = JSON.stringify({
      code: 131047,
      message: "Re-engagement message",
    });
    const result = formatDeliveryError(errorJson);
    expect(result.is24h).toBe(true);
    expect(result.short).toBe("Ventana 24h cerrada (Requiere plantilla)");
    expect(result.detail).toContain("Han pasado más de 24 horas");
  });

  it("identifica TEMPLATE_REQUIRED para iniciar chats nuevos sin marcar is24h", () => {
    const result1 = formatDeliveryError(
      "WhatsApp messages to this user must start with an approved template (TEMPLATE_REQUIRED)",
    );
    expect(result1.is24h).toBe(false);
    expect(result1.short).toBe("Plantilla requerida");
    expect(result1.detail).toContain("TEMPLATE_REQUIRED");

    const result2 = formatDeliveryError("TEMPLATE_REQUIRED");
    expect(result2.is24h).toBe(false);
    expect(result2.short).toBe("Plantilla requerida");
  });

  it("extrae explicación de JSON de error estándar cuando no es de ventana ni template requerido", () => {
    const errorJson = JSON.stringify({
      title: "Rate limit reached",
      explanation: "Too many messages sent in a short period",
    });
    const result = formatDeliveryError(errorJson);
    expect(result.is24h).toBe(false);
    expect(result.short).toBe("Fallo de entrega");
    expect(result.detail).toBe("Too many messages sent in a short period");
  });

  it("mantiene el texto plano original si no es JSON ni caso especial", () => {
    const result = formatDeliveryError("Network connection timeout to Meta API");
    expect(result.is24h).toBe(false);
    expect(result.short).toBe("Fallo de entrega");
    expect(result.detail).toBe("Network connection timeout to Meta API");
  });
});
