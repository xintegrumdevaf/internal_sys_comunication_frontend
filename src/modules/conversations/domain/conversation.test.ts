import { describe, expect, it } from "vitest";
import {
  conversationDisplayName,
  conversationStatusLabel,
  formatQuotedMessageSnippet,
  formatWaPhone,
  matchesConversationSearch,
  normalizeSearchQuery,
  type ConversationDto,
} from "./conversation";

describe("conversationStatusLabel", () => {
  it("traduce los 4 estados reales del backend a español claro", () => {
    expect(conversationStatusLabel("open")).toBe("Abierta");
    expect(conversationStatusLabel("pending")).toBe("En espera");
    expect(conversationStatusLabel("resolved")).toBe("Resuelta");
    expect(conversationStatusLabel("closed")).toBe("Cerrada");
  });
});

describe("formatWaPhone", () => {
  it("agrupa un numero de whatsapp crudo en bloques legibles", () => {
    expect(formatWaPhone("593998576466")).toBe("+593 998 576 466");
  });

  it("no rompe con numeros cortos", () => {
    expect(formatWaPhone("12345")).toBe("+12345");
  });
});

describe("conversationDisplayName", () => {
  it("prioriza customerName sobre waProfileName si esta definido", () => {
    expect(
      conversationDisplayName({
        waPhone: "593998576466",
        waProfileName: "Jean",
        customerName: "FUENTES MEZA JEAN PIERRE",
      }),
    ).toBe("FUENTES MEZA JEAN PIERRE");
  });

  it("prioriza el nombre real de perfil de WhatsApp sobre el telefono", () => {
    expect(
      conversationDisplayName({ waPhone: "593998576466", waProfileName: "Sheena Nelson" }),
    ).toBe("Sheena Nelson");
  });

  it("cae al telefono formateado si todavia no hay nombre de perfil", () => {
    expect(conversationDisplayName({ waPhone: "593998576466", waProfileName: null })).toBe(
      "+593 998 576 466",
    );
  });

  it("cae al telefono si el nombre de perfil es solo espacios en blanco", () => {
    expect(conversationDisplayName({ waPhone: "593998576466", waProfileName: "   " })).toBe(
      "+593 998 576 466",
    );
  });

  it("permite modelar mensajes con metadatos de edición e historial", () => {
    const msg = {
      id: "msg_1",
      conversationId: "conv_1",
      caseId: "case_1",
      direction: "outbound" as const,
      author: "agent" as const,
      agentId: "agent_1",
      body: "Mensaje corregido",
      type: "text" as const,
      createdAt: "2026-09-15T12:00:00Z",
      editedAt: "2026-09-15T12:05:00Z",
      editHistory: [
        {
          previousBody: "Mensaje original con error",
          editedAt: "2026-09-15T12:05:00Z",
        },
      ],
    };

    expect(msg.editedAt).toBe("2026-09-15T12:05:00Z");
    expect(msg.editHistory).toHaveLength(1);
    expect(msg.editHistory?.[0]?.previousBody).toBe("Mensaje original con error");
  });

  it("permite modelar mensajes con contexto de respuesta y bandera de reenvío", () => {
    const msg = {
      id: "msg_2",
      conversationId: "conv_1",
      caseId: null,
      direction: "inbound" as const,
      author: "customer" as const,
      agentId: null,
      body: ".",
      type: "text" as const,
      createdAt: "2026-11-12T12:00:00Z",
      replyToMessageId: "msg_1",
      replyTo: {
        id: "msg_1",
        author: "customer" as const,
        body: "",
        type: "image",
        caption: "Comprobante de depósito",
      },
      isForwarded: true,
    };

    expect(msg.isForwarded).toBe(true);
    expect(msg.replyTo?.type).toBe("image");
    expect(msg.replyTo?.caption).toBe("Comprobante de depósito");
  });
});

describe("formatQuotedMessageSnippet", () => {
  it("formatea extractos para mensajes de texto y diversos tipos multimedia", () => {
    expect(formatQuotedMessageSnippet(null)).toBe("");
    expect(
      formatQuotedMessageSnippet({
        author: "customer",
        body: "Hola necesito ayuda",
        type: "text",
      }),
    ).toBe("Hola necesito ayuda");
    expect(
      formatQuotedMessageSnippet({
        author: "customer",
        body: "",
        type: "image",
        caption: "Comprobante Banco Pichincha",
      }),
    ).toBe("📷 Comprobante Banco Pichincha");
    expect(
      formatQuotedMessageSnippet({
        author: "customer",
        body: "",
        type: "image",
      }),
    ).toBe("📷 Foto");
    expect(
      formatQuotedMessageSnippet({
        author: "customer",
        body: "",
        type: "audio",
      }),
    ).toBe("🎤 Audio");
    expect(
      formatQuotedMessageSnippet({
        author: "customer",
        body: "",
        type: "document",
        caption: "Factura.pdf",
      }),
    ).toBe("📄 Factura.pdf");
  });
});

describe("matchesConversationSearch", () => {
  const sampleConv: ConversationDto = {
    id: "conv_1",
    waPhone: "593986528447",
    customerId: "cust_1",
    customerName: "PEREZ SIGUA KEVIN EDURDO",
    waProfileName: "Kevin Perez",
    activeCaseId: "case_1",
    status: "open",
    lastActivityAt: "2026-11-05T12:00:00Z",
    createdAt: "2026-11-05T10:00:00Z",
    updatedAt: "2026-11-05T12:00:00Z",
    unreadCount: 0,
    lastMessagePreview: {
      id: "msg_1",
      body: "Buenas tardes, necesito ayuda con mi factura",
      author: "customer",
      direction: "inbound",
      createdAt: "2026-11-05T12:00:00Z",
    },
    activeCase: {
      id: "case_1",
      status: "HUMAN_ACTIVE",
      departmentId: "dept_1",
      assignedAgentId: "agent_1",
      assignedAgentName: "Alexandra Morquecho",
      automationEnabled: false,
    },
  };

  it("coincide por nombres y apellidos del cliente (customerName)", () => {
    expect(matchesConversationSearch(sampleConv, "PEREZ SIGUA")).toBe(true);
    expect(matchesConversationSearch(sampleConv, "perez sigua")).toBe(true);
    expect(matchesConversationSearch(sampleConv, "kevin edurdo")).toBe(true);
    expect(matchesConversationSearch(sampleConv, "sigua kevin")).toBe(true);
  });

  it("es insensible a mayúsculas y tildes/acentos diacríticos", () => {
    expect(matchesConversationSearch(sampleConv, "Pérez Sigua")).toBe(true);
    expect(matchesConversationSearch(sampleConv, "PÉREZ")).toBe(true);
  });

  it("coincide por nombre de perfil de WhatsApp (waProfileName)", () => {
    const convWithoutCustomer: ConversationDto = {
      ...sampleConv,
      customerName: null,
      waProfileName: "Kevin WhatsApp",
    };
    expect(matchesConversationSearch(convWithoutCustomer, "Kevin WhatsApp")).toBe(true);
    expect(matchesConversationSearch(convWithoutCustomer, "kevin")).toBe(true);
  });

  it("coincide por número de teléfono en formato parcial, internacional o local con 0", () => {
    expect(matchesConversationSearch(sampleConv, "986528")).toBe(true);
    expect(matchesConversationSearch(sampleConv, "+593 986 528 447")).toBe(true);
    expect(matchesConversationSearch(sampleConv, "593986528447")).toBe(true);
    expect(matchesConversationSearch(sampleConv, "0986528447")).toBe(true);
  });

  it("coincide por contenido del último mensaje", () => {
    expect(matchesConversationSearch(sampleConv, "factura")).toBe(true);
    expect(matchesConversationSearch(sampleConv, "Buenas tardes")).toBe(true);
  });

  it("coincide por nombre del asesor asignado o que atendió", () => {
    expect(matchesConversationSearch(sampleConv, "Alexandra")).toBe(true);
    expect(matchesConversationSearch(sampleConv, "Morquecho")).toBe(true);
  });

  it("retorna false si no hay coincidencia con ningún campo", () => {
    expect(matchesConversationSearch(sampleConv, "Carlos Mendoza")).toBe(false);
    expect(matchesConversationSearch(sampleConv, "0999999999")).toBe(false);
    expect(matchesConversationSearch(sampleConv, "soporte tecnico zte")).toBe(false);
  });
});
