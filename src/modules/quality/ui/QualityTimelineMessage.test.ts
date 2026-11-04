import { describe, expect, it } from "vitest";
import {
  formatElapsedNotice,
  isSystemTransferMessage,
} from "./QualityTimelineMessage";

describe("isSystemTransferMessage", () => {
  it("detecta eventos de transferencia de caso por agente o sistema", () => {
    expect(
      isSystemTransferMessage(
        "Caso transferido al área Traslados (Daysi Pilataxi) por Adriana Chalavarri. Motivo: pendiente respuesta",
      ),
    ).toBe(true);
    expect(isSystemTransferMessage("Caso asignado al agente Juan Pérez")).toBe(true);
    expect(isSystemTransferMessage("Caso transferido a otra área")).toBe(true);
  });

  it("no confunde mensajes normales del cliente o agente con eventos de traspaso", () => {
    expect(isSystemTransferMessage("Hola, necesito que transfieran mi servicio a otra casa")).toBe(
      false,
    );
    expect(isSystemTransferMessage("Buenas tardes, le valido su servicio")).toBe(false);
    expect(isSystemTransferMessage("?")).toBe(false);
    expect(isSystemTransferMessage(null)).toBe(false);
  });
});

describe("formatElapsedNotice", () => {
  it("devuelve null si transcurrieron menos de 20 minutos", () => {
    expect(formatElapsedNotice(15 * 60 * 1000)).toBeNull();
    expect(formatElapsedNotice(2 * 60 * 1000)).toBeNull();
  });

  it("formatea minutos si transcurrieron entre 20 y 59 minutos", () => {
    expect(formatElapsedNotice(25 * 60 * 1000)).toBe("Transcurrieron 25 min");
    expect(formatElapsedNotice(58 * 60 * 1000)).toBe("Transcurrieron 58 min");
  });

  it("formatea horas y minutos si transcurrieron más de una hora", () => {
    expect(formatElapsedNotice(2 * 3600 * 1000 + 58 * 60 * 1000)).toBe(
      "Transcurrieron 2h 58m",
    );
    expect(formatElapsedNotice(3 * 3600 * 1000)).toBe("Transcurrieron 3h");
  });
});
