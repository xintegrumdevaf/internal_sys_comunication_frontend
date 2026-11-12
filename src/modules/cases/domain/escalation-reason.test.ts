import { describe, expect, it } from "vitest";
import { describeHumanHandling } from "./escalation-reason";

describe("describeHumanHandling", () => {
  it("distingue fallo de IA en cola esperando agente", () => {
    const res = describeHumanHandling({
      status: "ESCALATED",
      assignedAgentName: null,
      disabledReason: "AI_ERROR",
    });

    expect(res.category).toBe("ai_error");
    expect(res.tone).toBe("danger");
    expect(res.badgeLabel).toBe("En cola · Fallo IA");
    expect(res.reasonLabel).toContain("IA");
    expect(res.isWaitingQueue).toBe(true);
    expect(res.detail).toContain("esperando");
  });

  it("distingue fallo de IA ya asignado a un asesor", () => {
    const res = describeHumanHandling({
      status: "HUMAN_ACTIVE",
      assignedAgentName: "Carlos",
      disabledReason: "AI_ERROR",
    });

    expect(res.tone).toBe("danger");
    expect(res.badgeLabel).toBe("Carlos · Fallo IA");
    expect(res.isWaitingQueue).toBe(false);
  });

  it("distingue caso sin comprensión de IA tras repregunta", () => {
    const res = describeHumanHandling({
      status: "ESCALATED",
      assignedAgentName: null,
      disabledReason: "MAX_CLARIFY_ATTEMPTS_EXCEEDED",
    });

    expect(res.category).toBe("unclear");
    expect(res.tone).toBe("warning");
    expect(res.badgeLabel).toBe("En cola · IA no entendió");
    expect(res.detail).toContain("dos mensajes");
  });

  it("indica explícitamente espera en cola cuando no hay razón especial pero está ESCALATED sin agente", () => {
    const res = describeHumanHandling({
      status: "ESCALATED",
      assignedAgentName: null,
      disabledReason: null,
    });

    expect(res.category).toBe("queue");
    expect(res.badgeLabel).toBe("En cola · Esperando agente");
    expect(res.detail).toContain("No había agentes disponibles");
  });

  it("describe control manual cuando un agente toma la conversación", () => {
    const res = describeHumanHandling({
      status: "HUMAN_ACTIVE",
      assignedAgentName: "Ana",
      disabledReason: "manual_override",
    });

    expect(res.category).toBe("manual");
    expect(res.tone).toBe("info");
    expect(res.badgeLabel).toBe("Manual: Ana");
  });
});
