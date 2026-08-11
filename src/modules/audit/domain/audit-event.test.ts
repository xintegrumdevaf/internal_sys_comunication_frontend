import { describe, expect, it } from "vitest";
import { auditActionLabel } from "./audit-event";

describe("auditActionLabel", () => {
  it("traduce las acciones reales que audita el backend", () => {
    expect(auditActionLabel("CASE_CLAIMED")).toBe("Agente reclamó el caso");
    expect(auditActionLabel("CASE_ASSIGNED")).toBe("Caso asignado a un agente");
    expect(auditActionLabel("CONVERSATION_REPLY")).toBe("Respuesta enviada al cliente");
    expect(auditActionLabel("AUTOMATION_DISABLED")).toBe("Se desactivó la automatización");
    expect(auditActionLabel("CASE_AUTO_ASSIGNED")).toBe("Caso asignado automáticamente por el sistema");
    expect(auditActionLabel("AGENT_PASSWORD_RESET")).toBe("Contraseña de agente restablecida");
  });

  it("humaniza acciones futuras no contempladas en el diccionario (nunca deja el enum crudo)", () => {
    expect(auditActionLabel("SOME_NEW_ACTION")).toBe("Some New Action");
  });
});
