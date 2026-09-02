import { apiGet, apiPost, apiPut, apiDelete } from "@/shared/http/http-client";
import { Campaign, CreateCampaignPayload } from "../domain/campaign";

export const campaignsGateway = {
  async listCampaigns(): Promise<Campaign[]> {
    try {
      return await apiGet<Campaign[]>("/api/campaigns");
    } catch {
      return mockCampaigns;
    }
  },

  async getCampaign(id: string): Promise<Campaign> {
    try {
      return await apiGet<Campaign>(`/api/campaigns/${id}`);
    } catch {
      const found = mockCampaigns.find((c) => c.id === id);
      if (found) return found;
      return mockCampaigns[0];
    }
  },

  async createCampaign(payload: CreateCampaignPayload): Promise<Campaign> {
    try {
      return await apiPost<Campaign>("/api/campaigns", payload);
    } catch {
      const newCamp: Campaign = {
        id: `camp_${Date.now()}`,
        name: payload.name,
        status: "DRAFT",
        quickMode: payload.quickMode ?? true,
        intervalSeconds: payload.intervalSeconds ?? 30,
        messageText: payload.messageText ?? "",
        templateId: payload.templateId,
        templateName: payload.templateName,
        sentCount: 0,
        totalRecipients: payload.recipients?.length || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        routingConfig: payload.routingConfig ?? {
          chatStatus: "open",
          departmentName: payload.area || "",
          keepAssigned: true,
          delegateToBot: false,
          forceChatUpdate: false,
        },
        contactConfig: payload.contactConfig ?? {
          tags: [],
          customFields: [],
          forceContactUpdate: false,
        },
        recipients: payload.recipients,
      };
      mockCampaigns.unshift(newCamp);
      return newCamp;
    }
  },

  async importCampaignRecipients(campaignId: string, file: File): Promise<unknown> {
    try {
      const formData = new FormData();
      formData.append("file", file);
      return await apiPost(`/api/campaigns/${campaignId}/recipients/import`, formData);
    } catch {
      return { success: true };
    }
  },

  async startCampaign(id: string): Promise<Campaign> {
    try {
      return await apiPost<Campaign>(`/api/campaigns/${id}/start`);
    } catch {
      const found = mockCampaigns.find((c) => c.id === id);
      if (found) found.status = "RUNNING";
      return found || mockCampaigns[0];
    }
  },

  async suspendCampaign(id: string): Promise<Campaign> {
    try {
      return await apiPost<Campaign>(`/api/campaigns/${id}/suspend`);
    } catch {
      const found = mockCampaigns.find((c) => c.id === id);
      if (found) found.status = "SUSPENDED";
      return found || mockCampaigns[0];
    }
  },

  async resumeCampaign(id: string): Promise<Campaign> {
    try {
      return await apiPost<Campaign>(`/api/campaigns/${id}/resume`);
    } catch {
      const found = mockCampaigns.find((c) => c.id === id);
      if (found) found.status = "RUNNING";
      return found || mockCampaigns[0];
    }
  },

  async deleteCampaign(id: string): Promise<Campaign> {
    try {
      return await apiDelete<Campaign>(`/api/campaigns/${id}`);
    } catch {
      const idx = mockCampaigns.findIndex((c) => c.id === id);
      if (idx !== -1) mockCampaigns.splice(idx, 1);
      return { id } as Campaign;
    }
  },
};

const mockCampaigns: Campaign[] = [
  {
    id: "camp_corte_3108",
    name: "CorteTV3108",
    status: "COMPLETED",
    lineName: "Xgo Soporte Ariel",
    quickMode: true,
    intervalSeconds: 30,
    messageText:
      "¡Hola! Le saluda XGO Telecomunicaciones. Le recordamos regularizar su pago del servicio de TV.",
    sentCount: 49,
    deliveredCount: 46,
    readCount: 17,
    repliedCount: 8,
    failedCount: 5,
    queuedCount: 0,
    processedCount: 54,
    totalRecipients: 54,
    createdAt: "2026-08-31T11:51:00.000Z",
    updatedAt: "2026-08-31T12:35:00.000Z",
    routingConfig: {
      chatStatus: "open",
      departmentName: "Soporte",
      assignedUserName: "Ariel",
      keepAssigned: true,
      delegateToBot: false,
      forceChatUpdate: false,
    },
    contactConfig: {
      tags: ["Corte TV", "Septiembre"],
      customFields: [],
      forceContactUpdate: false,
    },
    recipients: [
      {
        id: "rec_1",
        number: "593984985910",
        name: "MTD220 - JUAN ANDRES QUISPHE",
        body: "¡Hola! Le saluda XGO Telecomunicaciones. Le recordamos...",
        status: "delivered",
        updatedAt: "31/08 11:57",
      },
      {
        id: "rec_2",
        number: "593984814548",
        name: "MARIA CRISALIDA DE LOURDES",
        body: "¡Hola! Le saluda XGO Telecomunicaciones. Le recordamos...",
        status: "replied",
        updatedAt: "31/08 12:09",
      },
      {
        id: "rec_3",
        number: "593984688283",
        name: "LUZ IMELDA YAGUANA ENCALADA",
        body: "¡Hola! Le saluda XGO Telecomunicaciones. Le recordamos...",
        status: "read",
        updatedAt: "31/08 12:33",
      },
      {
        id: "rec_4",
        number: "593984181859",
        name: "SARA IVONE CANTOS MUECKAY",
        body: "Meta API 131026 error: Message Undeliverable.",
        errorMessage: "Meta API 131026 error: Message Undeliverable.",
        status: "failed",
        updatedAt: "31/08 11:56",
      },
      {
        id: "rec_5",
        number: "593984127594",
        name: "CRUZ ALAVA MAXIMO MAXIMILIANO",
        body: "¡Hola! Le saluda XGO Telecomunicaciones. Le recordamos...",
        status: "delivered",
        updatedAt: "31/08 11:56",
      },
      {
        id: "rec_6",
        number: "593983948324",
        name: "Milton Augusto Bahamonte Quintero",
        body: "¡Hola! Le saluda XGO Telecomunicaciones. Le recordamos...",
        status: "read",
        updatedAt: "31/08 12:07",
      },
      {
        id: "rec_7",
        number: "593958843352",
        name: "Irene Alicia Sola Velasquez",
        body: "¡Hola! Le saluda XGO Telecomunicaciones. Le recordamos...",
        status: "delivered",
        updatedAt: "31/08 11:54",
      },
      {
        id: "rec_8",
        number: "593958790380",
        name: "CHIPANTASIG SANGUANO WILSON",
        body: "¡Hola! Le saluda XGO Telecomunicaciones. Le recordamos...",
        status: "read",
        updatedAt: "01/09 06:16",
      },
      {
        id: "rec_9",
        number: "593958640902",
        name: "Luis Emilio Cargua Logaña",
        body: "¡Hola! Le saluda XGO Telecomunicaciones. Le recordamos...",
        status: "delivered",
        updatedAt: "31/08 11:54",
      },
      {
        id: "rec_10",
        number: "593999967233",
        name: "ANDRES MARCELO MOLINA TAPIA",
        body: "¡Hola! Le saluda XGO Telecomunicaciones. Le recordamos...",
        status: "replied",
        updatedAt: "31/08 15:46",
      },
      {
        id: "rec_11",
        number: "593998639108",
        name: "BETUN CHIQUITO MARIA JOSE",
        body: "¡Hola! Le saluda XGO Telecomunicaciones. Le recordamos...",
        status: "replied",
        updatedAt: "31/08 12:08",
      },
    ],
  },
  {
    id: "camp_1",
    name: "Promoción Fibra Óptica 200Mbps",
    status: "RUNNING",
    lineName: "Xgo Soporte Ariel",
    quickMode: true,
    intervalSeconds: 45,
    messageText: "Hola {{name}}, aprovecha el 20% de descuento en tu plan de internet.",
    sentCount: 142,
    totalRecipients: 500,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date().toISOString(),
    routingConfig: {
      chatStatus: "open",
      departmentName: "Ventas",
      assignedUserName: "",
      keepAssigned: true,
      delegateToBot: false,
      forceChatUpdate: false,
    },
    contactConfig: {
      tags: ["Clientes VIP"],
      customFields: [{ key: "ciudad", value: "Bogotá" }],
      forceContactUpdate: false,
    },
  },
  {
    id: "camp_2",
    name: "Recordatorio Facturación Septiembre",
    status: "DRAFT",
    lineName: "Xgo Cobranzas",
    quickMode: false,
    intervalSeconds: 60,
    messageText: "Estimado {{name}}, tu factura vence el próximo 5 de septiembre.",
    sentCount: 0,
    totalRecipients: 120,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date().toISOString(),
    routingConfig: {
      chatStatus: "closed",
      departmentName: "Cobranzas",
      assignedUserName: "",
      keepAssigned: false,
      delegateToBot: false,
      forceChatUpdate: false,
    },
    contactConfig: {
      tags: [],
      customFields: [],
      forceContactUpdate: false,
    },
  },
];
