import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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
      topicsEnabled: true,
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
    expect(screen.getByText(/Guía Rápida: ¿Cómo obtener el Token/i)).toBeDefined();
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

  it("renderiza el modo chat único con explicación cuando topicsEnabled es false", async () => {
    vi.spyOn(settingsApi, "getTelegramSettings").mockResolvedValueOnce({
      enabled: true,
      botToken: "123456:••••••••••••cdef",
      defaultChatId: "-1001234567890",
      topicsEnabled: false,
      digestsEnabled: true,
      digestHours: ["09:00"],
      timeZone: "America/Guayaquil",
      slaThresholdMinutes: 15,
      infraAlertMinCases: 3,
      queueSaturationThreshold: 10,
      commandsEnabled: true,
      aiCopilotEnabled: false,
    });

    render(<TelegramSettingsCard />);

    expect(await screen.findByText("Modo Chat Único / Grupo Estándar Activo (Recomendado)")).toBeDefined();
    expect(screen.getByText("Disparar Pulso Ahora (Prueba en Vivo)")).toBeDefined();
    expect(screen.getAllByText("Simular Alerta").length).toBeGreaterThan(0);
  });

  it("detecta cambios pendientes, muestra barra flotante y permite descartar", async () => {
    vi.spyOn(settingsApi, "getTelegramSettings").mockResolvedValueOnce({
      enabled: true,
      botToken: "123456:••••••••••••cdef",
      defaultChatId: "-1001234567890",
      topicsEnabled: false,
      digestsEnabled: true,
      digestHours: ["09:00"],
      timeZone: "America/Guayaquil",
      slaThresholdMinutes: 15,
      infraAlertMinCases: 3,
      queueSaturationThreshold: 10,
      commandsEnabled: true,
      aiCopilotEnabled: false,
    });

    render(<TelegramSettingsCard />);

    expect((await screen.findAllByText("Guardado")).length).toBeGreaterThan(0);

    // Modificar el input de Chat ID
    const chatIdInput = screen.getByPlaceholderText("-1001234567890 o @MiCanalDirectivo");
    fireEvent.change(chatIdInput, { target: { value: "-1009999999999" } });

    // Ahora debe mostrar el estado sucio (isDirty)
    expect(await screen.findByText("Cambios sin guardar")).toBeDefined();
    expect(screen.getAllByText("Guardar Cambios").length).toBeGreaterThan(0);

    // Descartar cambios
    const discardButtons = screen.getAllByText("Descartar");
    fireEvent.click(discardButtons[0]);

    // Vuelve al valor original y estado guardado
    expect(screen.getAllByText("Guardado").length).toBeGreaterThan(0);
    expect((chatIdInput as HTMLInputElement).value).toBe("-1001234567890");
  });
});

