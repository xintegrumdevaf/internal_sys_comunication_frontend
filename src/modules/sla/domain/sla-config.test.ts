import { describe, it, expect } from "vitest";
import { calculateConversationSla, formatSlaWaitTime, DEFAULT_SLA_CONFIG } from "./sla-config";
import type { ConversationDto } from "@/modules/conversations/domain/conversation";

describe("formatSlaWaitTime", () => {
  it("formatea minutos correctamente en modo short y full", () => {
    expect(formatSlaWaitTime(0, "short")).toBe("0m");
    expect(formatSlaWaitTime(0, "full")).toBe("0 minutos");

    expect(formatSlaWaitTime(1, "short")).toBe("1m");
    expect(formatSlaWaitTime(1, "full")).toBe("1 minuto");

    expect(formatSlaWaitTime(45, "short")).toBe("45m");
    expect(formatSlaWaitTime(45, "full")).toBe("45 minutos");
  });

  it("formatea horas y minutos correctamente en modo short y full", () => {
    expect(formatSlaWaitTime(60, "short")).toBe("1h");
    expect(formatSlaWaitTime(60, "full")).toBe("1 hora");

    expect(formatSlaWaitTime(75, "short")).toBe("1h 15m");
    expect(formatSlaWaitTime(75, "full")).toBe("1 hora y 15 minutos");

    expect(formatSlaWaitTime(120, "short")).toBe("2h");
    expect(formatSlaWaitTime(120, "full")).toBe("2 horas");

    expect(formatSlaWaitTime(135, "short")).toBe("2h 15m");
    expect(formatSlaWaitTime(135, "full")).toBe("2 horas y 15 minutos");
  });

  it("formatea días y horas correctamente para duraciones prolongadas", () => {
    expect(formatSlaWaitTime(1440, "short")).toBe("1d");
    expect(formatSlaWaitTime(1440, "full")).toBe("1 día");

    expect(formatSlaWaitTime(1500, "short")).toBe("1d 1h");
    expect(formatSlaWaitTime(1500, "full")).toBe("1 día y 1 hora");

    // 10987 minutos = 7 días, 15 horas, 7 minutos (7 * 1440 = 10080; 907 mins restantes = 15h 7m)
    expect(formatSlaWaitTime(10987, "short")).toBe("7d 15h");
    expect(formatSlaWaitTime(10987, "full")).toBe("7 días y 15 horas");
  });
});

describe("calculateConversationSla", () => {
  const baseConversation: ConversationDto = {
    id: "conv-1",
    waPhone: "593998576466",
    customerId: "cust-1",
    activeCaseId: "case-1",
    status: "open",
    lastActivityAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10m ago
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    unreadCount: 1,
    waProfileName: "Cliente Ejemplo",
    lastMessagePreview: {
      body: "Hola, necesito ayuda",
      author: "customer",
      direction: "inbound",
      createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    },
  };

  it("detecta superación de SLA cuando el mensaje del cliente lleva 10m sin respuesta", () => {
    const result = calculateConversationSla(baseConversation, {
      responseThresholdMinutes: 5,
      enabled: true,
      alertSoundEnabled: false,
      warningThresholdPercent: 80,
    });

    expect(result.isWaitingForResponse).toBe(true);
    expect(result.isBreached).toBe(true);
    expect(result.status).toBe("breached");
    expect(result.minutesWaiting).toBeGreaterThanOrEqual(10);
    expect(result.formattedShort).toMatch(/\d+m/);
    expect(result.formattedFull).toMatch(/\d+ minutos/);
  });

  it("mantiene la alerta de SLA si el bot envió acuse automático pero la atención es humana y el asesor no ha respondido", () => {
    const aiAutoAckConversation: ConversationDto = {
      ...baseConversation,
      activeCase: {
        id: "case-1",
        status: "HUMAN_ACTIVE",
        departmentId: "dept-1",
        assignedAgentId: "agent-1",
        automationEnabled: false,
      },
      lastMessagePreview: {
        body: "¡Recibido, gracias! Estamos verificando...",
        author: "ai",
        direction: "outbound",
        createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      },
    };

    const result = calculateConversationSla(aiAutoAckConversation, DEFAULT_SLA_CONFIG);
    expect(result.isWaitingForResponse).toBe(true);
    expect(result.isBreached).toBe(true);
    expect(result.status).toBe("breached");
  });

  it("no marca alerta si el último mensaje fue enviado por un agente humano", () => {
    const agentConversation: ConversationDto = {
      ...baseConversation,
      lastMessagePreview: {
        body: "Te respondo con gusto",
        author: "agent",
        direction: "outbound",
        createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      },
    };

    const result = calculateConversationSla(agentConversation, DEFAULT_SLA_CONFIG);
    expect(result.isWaitingForResponse).toBe(false);
    expect(result.isBreached).toBe(false);
    expect(result.status).toBe("ok");
    expect(result.formattedShort).toBe("0m");
    expect(result.formattedFull).toBe("0 minutos");
  });

  it("no marca alerta si la conversación está resuelta o cerrada", () => {
    const closedConversation: ConversationDto = {
      ...baseConversation,
      status: "resolved",
    };

    const result = calculateConversationSla(closedConversation, DEFAULT_SLA_CONFIG);
    expect(result.isWaitingForResponse).toBe(false);
    expect(result.isBreached).toBe(false);
  });
});
