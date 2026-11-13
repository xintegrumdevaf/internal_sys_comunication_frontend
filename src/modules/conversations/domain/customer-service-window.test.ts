import { describe, expect, it } from "vitest";
import {
  isCustomerServiceWindowClosed,
  isWhatsAppSessionWindowError,
} from "./customer-service-window";

const NOW = Date.parse("2026-11-02T16:10:00.000Z");
const MIN = 60 * 1000;

function message(partial: {
  author: string;
  createdAt: string;
  direction?: string;
  status?: string;
  errorMessage?: string | null;
}) {
  return partial;
}

describe("isCustomerServiceWindowClosed", () => {
  it("está abierta si el cliente escribió hace menos de 24 h, aunque haya un fallo viejo", () => {
    const closed = isCustomerServiceWindowClosed(
      [
        message({
          author: "agent",
          direction: "outbound",
          status: "failed",
          errorMessage: "131047 Re-engagement message",
          createdAt: new Date(NOW - 30 * 60 * MIN).toISOString(),
        }),
        message({
          author: "customer",
          direction: "inbound",
          createdAt: new Date(NOW - 20 * MIN).toISOString(),
        }),
        message({
          author: "agent",
          direction: "outbound",
          status: "sent",
          createdAt: new Date(NOW - 2 * MIN).toISOString(),
        }),
      ],
      NOW,
    );
    expect(closed).toBe(false);
  });

  it("está cerrada si el último mensaje del cliente tiene 24 h o más", () => {
    const closed = isCustomerServiceWindowClosed(
      [
        message({
          author: "customer",
          direction: "inbound",
          createdAt: new Date(NOW - 25 * 60 * MIN).toISOString(),
        }),
      ],
      NOW,
    );
    expect(closed).toBe(true);
  });

  it("está cerrada si WhatsApp rechazó un envío después del último mensaje del cliente", () => {
    const closed = isCustomerServiceWindowClosed(
      [
        message({
          author: "customer",
          direction: "inbound",
          createdAt: new Date(NOW - 30 * MIN).toISOString(),
        }),
        message({
          author: "agent",
          direction: "outbound",
          status: "failed",
          errorMessage: JSON.stringify({ code: 131047 }),
          createdAt: new Date(NOW - 5 * MIN).toISOString(),
        }),
      ],
      NOW,
    );
    expect(closed).toBe(true);
  });

  it("está cerrada si todavía no hay ningún mensaje del cliente", () => {
    expect(
      isCustomerServiceWindowClosed(
        [
          message({
            author: "agent",
            direction: "outbound",
            createdAt: new Date(NOW).toISOString(),
          }),
        ],
        NOW,
      ),
    ).toBe(true);
  });
});

describe("isWhatsAppSessionWindowError", () => {
  it("detecta código 131047 en JSON y texto plano", () => {
    expect(isWhatsAppSessionWindowError(JSON.stringify({ code: 131047 }))).toBe(true);
    expect(isWhatsAppSessionWindowError("Error code 131047: Re-engagement message")).toBe(true);
  });

  it("detecta menciones de ventana de 24h y re-engagement", () => {
    expect(isWhatsAppSessionWindowError("customer service window has expired")).toBe(true);
    expect(isWhatsAppSessionWindowError("Ventana de 24 horas cerrada")).toBe(true);
    expect(isWhatsAppSessionWindowError("Outside the 24-hour window")).toBe(true);
    expect(isWhatsAppSessionWindowError("Requires re-engagement template")).toBe(true);
  });

  it("detecta plantilla solo cuando está vinculada a expiración de ventana", () => {
    expect(isWhatsAppSessionWindowError("Enviar plantilla para reabrir ventana de 24 horas")).toBe(
      true,
    );
    expect(isWhatsAppSessionWindowError("Template required because window expired")).toBe(true);
  });

  it("no clasifica errores de TEMPLATE_REQUIRED inicial como fallo de ventana 24h", () => {
    expect(isWhatsAppSessionWindowError("TEMPLATE_REQUIRED")).toBe(false);
    expect(
      isWhatsAppSessionWindowError(
        "WhatsApp messages must start with an approved template (TEMPLATE_REQUIRED)",
      ),
    ).toBe(false);
    expect(isWhatsAppSessionWindowError("Template parameter missing")).toBe(false);
  });

  it("retorna false para mensajes nulos o vacíos", () => {
    expect(isWhatsAppSessionWindowError(null)).toBe(false);
    expect(isWhatsAppSessionWindowError(undefined)).toBe(false);
    expect(isWhatsAppSessionWindowError("")).toBe(false);
  });
});
