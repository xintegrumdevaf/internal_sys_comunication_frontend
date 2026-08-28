import { apiGet, apiPost, apiDelete } from "@/shared/http/http-client";
import { Campaign, CreateCampaignPayload } from "../domain/campaign";

let localCampaignsStore: Campaign[] = [
  {
    id: "camp-1",
    name: "Promocion Fibra Optica 300MB",
    status: "COMPLETED",
    quickMode: true,
    intervalSeconds: 45,
    messageText: "Hola {{name}}, aprovecha el 50% de descuento en tu plan de Internet este mes.",
    sentCount: 48,
    totalRecipients: 48,
    createdAt: "2026-08-20T10:00:00Z",
    updatedAt: "2026-08-20T11:30:00Z",
    routingConfig: {
      chatStatus: "closed",
      departmentName: "Ventas",
      assignedUserName: "",
      keepAssigned: false,
      delegateToBot: true,
      forceChatUpdate: false,
    },
    contactConfig: {
      tags: ["Clientes VIP"],
      customFields: [],
      forceContactUpdate: false,
    },
  },
  {
    id: "camp-2",
    name: "Recordatorio Pago Factura Vencida",
    status: "RUNNING",
    quickMode: false,
    intervalSeconds: 60,
    messageText: "Estimado cliente {{name}}, tu factura vence en 2 dias.",
    sentCount: 12,
    totalRecipients: 50,
    createdAt: "2026-08-27T08:00:00Z",
    updatedAt: "2026-08-27T09:15:00Z",
    routingConfig: {
      chatStatus: "pending",
      departmentName: "Cobranzas",
      assignedUserName: "Juan Perez",
      yeepAssigned: true,
      keepAssigned: true,
      delegateToBot: false,
      forceChatUpdate: true,
    },
    contactConfig: {
      tags: ["Cobranzas"],
      customFields: [{ key: "prioridad", value: "alta" }],
      forceContactUpdate: true,
    },
  },
];

export const campaignsGateway = {
  async listCampaigns(): Promise<Campaign[]> {
    try {
      const res = await apiGet<Campaign[]>("/api/campaigns");
      if (res && Array.isArray(res)) return res;
    } catch {
      // Fallback
    }
    return localCampaignsStore;
  },

  async getCampaignById(id: string): Promise<Campaign | null> {
    try {
      return await apiGet<Campaign>(`/api/campaigns/${id}`);
    } catch {
      return localCampaignsStore.find((c) => c.id === id) || null;
    }
  },

  async createCampaign(payload: CreateCampaignPayload): Promise<Campaign> {
    try {
      const created = await apiPost<Campaign>("/api/campaigns", payload);
      if (created) return created;
    } catch {
      // Fallback
    }
    const newCamp: Campaign = {
      id: `camp-${Date.now()}`,
      name: payload.name,
      status: "DRAFT",
      quickMode: payload.quickMode,
      intervalSeconds: payload.intervalSeconds,
      messageText: payload.messageText,
      sentCount: 0,
      totalRecipients: payload.recipients?.length || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      routingConfig: payload.routingConfig,
      contactConfig: payload.contactConfig,
      recipients: payload.recipients || [],
    };
    localCampaignsStore = [newCamp, ...localCampaignsStore];
    return newCamp;
  },

  async importCampaignRecipients(campaignId: string, file: File): Promise<{ count: number }> {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await apiPost<{ count: number }>(
        `/api/campaigns/${campaignId}/recipients/import`,
        formData,
      );
      if (res) return res;
    } catch {
      // Fallback
    }
    return { count: 10 };
  },

  async startCampaign(id: string): Promise<Campaign> {
    try {
      const res = await apiPost<Campaign>(`/api/campaigns/${id}/start`, {});
      if (res) return res;
    } catch {
      // Fallback
    }
    localCampaignsStore = localCampaignsStore.map((c) =>
      c.id === id ? { ...c, status: "RUNNING", updatedAt: new Date().toISOString() } : c,
    );
    return localCampaignsStore.find((c) => c.id === id)!;
  },

  async suspendCampaign(id: string): Promise<Campaign> {
    try {
      const res = await apiPost<Campaign>(`/api/campaigns/${id}/suspend`, {});
      if (res) return res;
    } catch {
      // Fallback
    }
    localCampaignsStore = localCampaignsStore.map((c) =>
      c.id === id ? { ...c, status: "SUSPENDED", updatedAt: new Date().toISOString() } : c,
    );
    return localCampaignsStore.find((c) => c.id === id)!;
  },

  async resumeCampaign(id: string): Promise<Campaign> {
    try {
      const res = await apiPost<Campaign>(`/api/campaigns/${id}/resume`, {});
      if (res) return res;
    } catch {
      // Fallback
    }
    localCampaignsStore = localCampaignsStore.map((c) =>
      c.id === id ? { ...c, status: "RUNNING", updatedAt: new Date().toISOString() } : c,
    );
    return localCampaignsStore.find((c) => c.id === id)!;
  },

  async deleteCampaign(id: string): Promise<void> {
    try {
      await apiDelete(`/api/campaigns/${id}`);
    } catch {
      // Fallback
    }
    localCampaignsStore = localCampaignsStore.filter((c) => c.id !== id);
  },
};
