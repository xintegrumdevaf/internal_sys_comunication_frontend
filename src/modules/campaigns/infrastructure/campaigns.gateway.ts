import { apiGet, apiPost } from "@/shared/http/http-client";
import type { CampaignRecipient, WhatsAppCampaign } from "../domain/campaign";

export type CreateCampaignPayload = {
  name: string;
  templateId: string;
  area?: string;
  recipients: CampaignRecipient[];
};

const INITIAL_CAMPAIGNS_SEED: WhatsAppCampaign[] = [
  {
    id: "camp_1",
    name: "recordatorio_pago_v3",
    templateId: "tpl_1",
    templateName: "recordatorio_pago_v3",
    area: "Cartera",
    status: "in_progress",
    totalRecipients: 4820,
    sentCount: 4820,
    deliveredCount: 4732,
    failedCount: 88,
    progress: 98,
    createdAt: "2026-08-26T08:00:00Z",
    recipients: [
      { phone: "+573001234567", variables: { "1": "Carlos", "2": "$45.000" }, status: "delivered", sentAt: "08:01 AM" },
      { phone: "+573009876543", variables: { "1": "Ana", "2": "$120.000" }, status: "delivered", sentAt: "08:02 AM" },
      { phone: "+573105554433", variables: { "1": "Pedro", "2": "$65.000" }, status: "failed", errorMessage: "Número de WhatsApp no válido o fuera de cobertura", sentAt: "08:03 AM" },
      { phone: "+573204443322", variables: { "1": "Sofía", "2": "$89.000" }, status: "failed", errorMessage: "Usuario ha marcado Opt-out / Bloqueado", sentAt: "08:04 AM" },
    ],
  },
  {
    id: "camp_2",
    name: "corte_programado_v2",
    templateId: "tpl_2",
    templateName: "corte_programado_v2",
    area: "Soporte",
    status: "completed",
    totalRecipients: 2140,
    sentCount: 2140,
    deliveredCount: 2098,
    failedCount: 42,
    progress: 100,
    createdAt: "2026-08-25T14:00:00Z",
    recipients: [
      { phone: "+573112223344", variables: { "1": "Mateo", "2": "Norte" }, status: "delivered", sentAt: "14:01 PM" },
      { phone: "+573007778899", variables: { "1": "Laura", "2": "Centro" }, status: "failed", errorMessage: "Error temporal de entrega en Meta Cloud", sentAt: "14:02 PM" },
    ],
  },
  {
    id: "camp_3",
    name: "confirmacion_visita_v4",
    templateId: "tpl_2",
    templateName: "corte_programado_v2",
    area: "UTGA",
    status: "completed",
    totalRecipients: 148,
    sentCount: 148,
    deliveredCount: 141,
    failedCount: 7,
    progress: 100,
    createdAt: "2026-08-24T10:30:00Z",
  },
];

let localCampaignsStore: WhatsAppCampaign[] = [...INITIAL_CAMPAIGNS_SEED];

export async function fetchCampaigns(): Promise<WhatsAppCampaign[]> {
  try {
    const remote = await apiGet<WhatsAppCampaign[]>("/api/campaigns");
    if (Array.isArray(remote) && remote.length > 0) {
      localCampaignsStore = remote;
      return remote;
    }
  } catch {
    // Usar store local enriquecido si el backend aún no responde
  }
  return localCampaignsStore;
}

export async function fetchCampaignById(id: string): Promise<WhatsAppCampaign | null> {
  try {
    const remote = await apiGet<WhatsAppCampaign>(`/api/campaigns/${id}`);
    if (remote) return remote;
  } catch {
    // Fallback
  }
  return localCampaignsStore.find((c) => c.id === id) || null;
}

export async function sendCampaign(payload: CreateCampaignPayload): Promise<WhatsAppCampaign> {
  const newCampaign: WhatsAppCampaign = {
    id: `camp_${Date.now()}`,
    name: payload.name,
    templateId: payload.templateId,
    templateName: payload.name,
    area: payload.area || "Administración",
    status: "in_progress",
    totalRecipients: payload.recipients.length,
    sentCount: Math.floor(payload.recipients.length * 0.4),
    deliveredCount: Math.floor(payload.recipients.length * 0.38),
    failedCount: Math.floor(payload.recipients.length * 0.02),
    progress: 40,
    createdAt: new Date().toISOString(),
    recipients: payload.recipients.map((r, idx) => ({
      ...r,
      status: idx % 10 === 0 ? "failed" : idx % 2 === 0 ? "delivered" : "sent",
      errorMessage: idx % 10 === 0 ? "Teléfono sin cuenta de WhatsApp activa" : undefined,
      sentAt: new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }),
    })),
  };

  try {
    const created = await apiPost<WhatsAppCampaign>("/api/campaigns", payload);
    if (created && created.id) {
      localCampaignsStore = [created, ...localCampaignsStore];
      return created;
    }
  } catch {
    // Fallback
  }

  localCampaignsStore = [newCampaign, ...localCampaignsStore];
  return newCampaign;
}
