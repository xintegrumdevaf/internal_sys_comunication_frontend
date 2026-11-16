import { describe, expect, it } from "vitest";
import { auditActionLabel, resolveAuditDateRange, toIsoEnd, toIsoStart } from "./audit-event";

describe("auditActionLabel", () => {
  it("traduce las acciones reales que audita el backend", () => {
    expect(auditActionLabel("CASE_CLAIMED")).toBe("Agente reclamó el caso");
    expect(auditActionLabel("CASE_ASSIGNED")).toBe("Caso asignado a un agente");
    expect(auditActionLabel("CONVERSATION_REPLY")).toBe("Respuesta enviada al cliente");
    expect(auditActionLabel("AUTOMATION_DISABLED")).toBe("Se desactivó la automatización");
    expect(auditActionLabel("CASE_AUTO_ASSIGNED")).toBe(
      "Caso asignado automáticamente por el sistema",
    );
    expect(auditActionLabel("AGENT_PASSWORD_RESET")).toBe("Contraseña de agente restablecida");
  });

  it("humaniza acciones futuras no contempladas en el diccionario (nunca deja el enum crudo)", () => {
    expect(auditActionLabel("SOME_NEW_ACTION")).toBe("Some New Action");
  });
});

describe("audit date range utilities", () => {
  it("toIsoStart convierte fecha YYYY-MM-DD en ISO al inicio del día", () => {
    const iso = toIsoStart("2026-11-11");
    expect(iso).toBeDefined();
    expect(new Date(iso!).getUTCFullYear()).toBe(2026);
    expect(toIsoStart("")).toBeUndefined();
    expect(toIsoStart("invalid-date")).toBeUndefined();
  });

  it("toIsoEnd convierte fecha YYYY-MM-DD en ISO al final del día", () => {
    const iso = toIsoEnd("2026-11-11");
    expect(iso).toBeDefined();
    expect(new Date(iso!).getUTCFullYear()).toBe(2026);
    expect(toIsoEnd("")).toBeUndefined();
    expect(toIsoEnd("invalid-date")).toBeUndefined();
  });

  it("resolveAuditDateRange retorna undefined cuando ambos están vacíos", () => {
    const range = resolveAuditDateRange("", "");
    expect(range.from).toBeUndefined();
    expect(range.to).toBeUndefined();
  });

  it("resolveAuditDateRange completa 'to' cuando solo se define 'from'", () => {
    const range = resolveAuditDateRange("2026-11-11", "");
    expect(range.from).toBeDefined();
    expect(range.to).toBeDefined();
    expect(new Date(range.from!).getTime()).toBeLessThanOrEqual(new Date(range.to!).getTime());
  });

  it("resolveAuditDateRange completa 'from' con época cuando solo se define 'to'", () => {
    const range = resolveAuditDateRange("", "2026-11-11");
    expect(range.from).toBe("1970-01-01T00:00:00.000Z");
    expect(range.to).toBeDefined();
  });

  it("resolveAuditDateRange resuelve correctamente cuando se especifican ambas fechas", () => {
    const range = resolveAuditDateRange("2026-11-11", "2026-11-16");
    expect(range.from).toBe(toIsoStart("2026-11-11"));
    expect(range.to).toBe(toIsoEnd("2026-11-16"));
    expect(new Date(range.from!).getTime()).toBeLessThan(new Date(range.to!).getTime());
  });
});
