import { describe, expect, it } from "vitest";
import { escalationPriorityLabel, escalationStatusLabel, getEscalationSla } from "./escalation";

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

describe("getEscalationSla", () => {
  it("clasifica como 'ok' cuando tiene menos de 5 minutos", () => {
    const recent = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    const sla = getEscalationSla(recent);
    expect(sla.risk).toBe("ok");
    expect(sla.minutesWaiting).toBe(2);
    expect(sla.label).toContain("En SLA");
  });

  it("clasifica como 'warning' cuando tiene entre 5 y 15 minutos", () => {
    const warningDate = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const sla = getEscalationSla(warningDate);
    expect(sla.risk).toBe("warning");
    expect(sla.minutesWaiting).toBe(10);
    expect(sla.label).toContain("Riesgo SLA");
  });

  it("clasifica como 'breached' cuando supera los 15 minutos", () => {
    const breachedDate = new Date(Date.now() - 25 * 60 * 1000).toISOString();
    const sla = getEscalationSla(breachedDate);
    expect(sla.risk).toBe("breached");
    expect(sla.minutesWaiting).toBe(25);
    expect(sla.label).toContain("SLA Vencido");
    expect(sla.badgeCls).toContain("animate-pulse");
  });
});
