import { describe, expect, it } from "vitest";
import { escalationPriorityLabel, escalationStatusLabel } from "./escalation";

describe("escalationStatusLabel", () => {
  it("traduce los 3 estados reales a español claro", () => {
    expect(escalationStatusLabel("PENDING")).toBe("Sin atender");
    expect(escalationStatusLabel("ASSIGNED")).toBe("Asignada");
    expect(escalationStatusLabel("RESOLVED")).toBe("Resuelta");
  });
});

describe("escalationPriorityLabel", () => {
  it("traduce las 4 prioridades reales con su color semántico", () => {
    expect(escalationPriorityLabel("urgent").label).toBe("Urgente");
    expect(escalationPriorityLabel("urgent").cls).toContain("danger");
    expect(escalationPriorityLabel("high").label).toBe("Alta");
    expect(escalationPriorityLabel("normal").label).toBe("Normal");
    expect(escalationPriorityLabel("low").label).toBe("Baja");
  });
});
