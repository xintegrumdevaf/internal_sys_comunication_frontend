import { describe, expect, it } from "vitest";
import { conversationDisplayName, conversationStatusLabel, formatWaPhone } from "./conversation";

describe("conversationStatusLabel", () => {
  it("traduce los 4 estados reales del backend a español claro", () => {
    expect(conversationStatusLabel("open")).toBe("Abierta");
    expect(conversationStatusLabel("pending")).toBe("En espera");
    expect(conversationStatusLabel("resolved")).toBe("Resuelta");
    expect(conversationStatusLabel("closed")).toBe("Cerrada");
  });
});

describe("formatWaPhone", () => {
  it("agrupa un numero de whatsapp crudo en bloques legibles", () => {
    expect(formatWaPhone("593998576466")).toBe("+593 998 576 466");
  });

  it("no rompe con numeros cortos", () => {
    expect(formatWaPhone("12345")).toBe("+12345");
  });
});

describe("conversationDisplayName", () => {
  it("prioriza el nombre real de perfil de WhatsApp sobre el telefono", () => {
    expect(
      conversationDisplayName({ waPhone: "593998576466", waProfileName: "Sheena Nelson" }),
    ).toBe("Sheena Nelson");
  });

  it("cae al telefono formateado si todavia no hay nombre de perfil", () => {
    expect(conversationDisplayName({ waPhone: "593998576466", waProfileName: null })).toBe(
      "+593 998 576 466",
    );
  });

  it("cae al telefono si el nombre de perfil es solo espacios en blanco", () => {
    expect(conversationDisplayName({ waPhone: "593998576466", waProfileName: "   " })).toBe(
      "+593 998 576 466",
    );
  });
});
