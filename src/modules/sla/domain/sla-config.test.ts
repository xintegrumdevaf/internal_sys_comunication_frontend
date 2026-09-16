import { describe, it, expect } from "vitest";
import { calculateConversationSla, DEFAULT_SLA_CONFIG } from "./sla-config";
import type { ConversationDto } from "@/modules/conversations/domain/conversation";

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
