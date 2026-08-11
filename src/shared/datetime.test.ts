import { describe, expect, it } from "vitest";
import { messageClock, relativeTime } from "./datetime";

describe("relativeTime", () => {
  it("muestra minutos cuando el evento fue hace menos de una hora", () => {
    const iso = new Date(Date.now() - 5 * 60_000).toISOString();
    expect(relativeTime(iso)).toBe("5m");
  });

  it("nunca reporta 0m para eventos muy recientes (redondeo hacia arriba mínimo 1)", () => {
    const iso = new Date(Date.now() - 1_000).toISOString();
    expect(relativeTime(iso)).toBe("1m");
  });

  it("muestra horas cuando el evento fue hace más de 60 minutos", () => {
    const iso = new Date(Date.now() - 3 * 3_600_000).toISOString();
    expect(relativeTime(iso)).toBe("3h");
  });

  it("muestra días cuando el evento fue hace más de 24 horas", () => {
    const iso = new Date(Date.now() - 2 * 86_400_000).toISOString();
    expect(relativeTime(iso)).toBe("2d");
  });
});

describe("messageClock", () => {
  it("formatea en reloj de 24h (es-CO) sin segundos", () => {
    const iso = new Date("2026-01-01T15:05:00.000Z").toISOString();
    const formatted = messageClock(iso);
    expect(formatted).toMatch(/^\d{2}:\d{2}$/);
  });
});
