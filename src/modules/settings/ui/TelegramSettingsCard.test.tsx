import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TelegramSettingsCard } from "./TelegramSettingsCard";
import { settingsApi } from "../infrastructure/settings.api";

describe("TelegramSettingsCard", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renderiza la cabecera, inputs y horarios configurados", async () => {
    vi.spyOn(settingsApi, "getTelegramSettings").mockResolvedValueOnce({
      enabled: true,
      botToken: "123456:••••••••••••cdef",
      defaultChatId: "-1001234567890",
      slaTopicId: 10,
      infraTopicId: 20,
      digestsTopicId: 30,
      digestsEnabled: true,
      digestHours: ["09:00", "14:00", "19:00"],
      timeZone: "America/Guayaquil",
      slaThresholdMinutes: 15,
      infraAlertMinCases: 3,
      queueSaturationThreshold: 10,
      webhookSecret: "••••••••••••",
      commandsEnabled: true,
      aiCopilotEnabled: true,
    });

    render(<TelegramSettingsCard />);

    expect(await screen.findByText("Centinela & Ops de Telegram")).toBeDefined();
    expect(screen.getByText("Credenciales de Telegram Bot API")).toBeDefined();
    expect(screen.getByText("Enrutamiento por Temas (Supergrupo con Foros)")).toBeDefined();
    expect(screen.getByText("Agregar Tema")).toBeDefined();
    expect(screen.getByText("Pulso Operativo Ejecutivo (Digests Programados)")).toBeDefined();
    expect(screen.getByText("Envío Automático de Pulso Programado")).toBeDefined();
    expect(screen.getByText("Umbrales del Centinela Reactivo")).toBeDefined();
    expect(screen.getByText("Agregar Regla")).toBeDefined();
    expect(screen.getByText("Interacción Bidireccional & Copilot con IA")).toBeDefined();
    expect(screen.getByText("09:00")).toBeDefined();
    expect(screen.getByText("14:00")).toBeDefined();
    expect(screen.getByText("19:00")).toBeDefined();
    expect(screen.getByText("Guardar Configuración de Telegram")).toBeDefined();
  });
});

