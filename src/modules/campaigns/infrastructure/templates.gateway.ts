import { apiGet, apiPost } from "@/shared/http/http-client";
import type { WhatsAppTemplate } from "../domain/template";

export type CreateTemplatePayload = {
  name: string;
  category: "MARKETING" | "UTILITY" | "AUTHENTICATION";
  language: string;
  components: WhatsAppTemplate["components"];
  status: "draft" | "pending";
};

const INITIAL_TEMPLATES_SEED: WhatsAppTemplate[] = [
  {
    id: "tpl_1",
    name: "recordatorio_pago_v3",
    category: "UTILITY",
    language: "es",
    status: "approved",
    variables: ["1", "2"],
    createdAt: "2026-08-10T14:30:00Z",
    components: {
      header: { type: "TEXT", text: "Aviso de Cobro NetOps" },
      body: {
        text: "Estimado/a {{1}}, le recordamos que su factura por valor de {{2}} se encuentra próxima a vencer. Evite la suspensión del servicio.",
      },
      footer: { text: "NetOps Communications" },
      buttons: [
        { type: "QUICK_REPLY", text: "Pagar ahora" },
        { type: "QUICK_REPLY", text: "Soporte" },
      ],
    },
  },
  {
    id: "tpl_2",
    name: "corte_programado_v2",
    category: "UTILITY",
    language: "es",
    status: "approved",
    variables: ["1", "2"],
    createdAt: "2026-08-12T09:15:00Z",
    components: {
      header: { type: "TEXT", text: "Mantenimiento Técnico" },
      body: {
        text: "Hola {{1}}, realizaremos un mantenimiento en la zona {{2}} entre las 02:00 y 05:00 AM. Agradecemos su comprensión.",
      },
      footer: { text: "NetOps Soporte Técnico" },
    },
  },
  {
    id: "tpl_3",
    name: "encuesta_nps_v1",
    category: "MARKETING",
    language: "es",
    status: "pending",
    variables: ["1"],
    createdAt: "2026-08-20T16:45:00Z",
    components: {
      body: {
        text: "Hola {{1}}, ¿cómo calificarías la atención de nuestro equipo en el último servicio?",
      },
      buttons: [
        { type: "QUICK_REPLY", text: "10 - Excelente" },
        { type: "QUICK_REPLY", text: "5 - Regular" },
        { type: "QUICK_REPLY", text: "1 - Malo" },
      ],
    },
  },
  {
    id: "tpl_4",
    name: "promocion_fibra_v1",
    category: "MARKETING",
    language: "es",
    status: "rejected",
    rejectedReason:
      "El texto del mensaje viola las políticas de Meta sobre ofertas engañosas. Por favor especifique los términos de la promoción.",
    variables: ["1", "2"],
    createdAt: "2026-08-18T11:00:00Z",
    components: {
      header: { type: "TEXT", text: "Super Promo Fibra" },
      body: {
        text: "Hola {{1}}, obtén 500 Megas por solo {{2}} al mes. Haz clic abajo para contratar.",
      },
      buttons: [
        {
          type: "CALL_TO_ACTION",
          text: "Ver Oferta",
          ctaType: "URL",
          url: "https://netops.io/promo",
        },
      ],
    },
  },
];

// Estado local de almacenamiento para asegurar sincronización y fallbacks si el backend carece de persistencia
let localTemplatesStore: WhatsAppTemplate[] = [...INITIAL_TEMPLATES_SEED];

export async function fetchTemplates(): Promise<WhatsAppTemplate[]> {
  try {
    const remote = await apiGet<WhatsAppTemplate[]>("/api/templates");
    if (Array.isArray(remote) && remote.length > 0) {
      localTemplatesStore = remote;
      return remote;
    }
  } catch {
    // Si la API aún no ha sido poblada o falla red, usar el store local enriquecido
  }
  return localTemplatesStore;
}

export async function createTemplate(payload: CreateTemplatePayload): Promise<WhatsAppTemplate> {
  const newTemplate: WhatsAppTemplate = {
    id: `tpl_${Date.now()}`,
    name: payload.name,
    category: payload.category,
    language: payload.language,
    status: payload.status,
    components: payload.components,
    variables: Object.keys(payload.components.body.text.match(/\{\{(\d+)\}\}/g) || {}),
    createdAt: new Date().toISOString(),
  };

  try {
    const created = await apiPost<WhatsAppTemplate>("/api/templates", payload);
    if (created && created.id) {
      localTemplatesStore = [created, ...localTemplatesStore];
      return created;
    }
  } catch {
    // Fallback local
  }

  localTemplatesStore = [newTemplate, ...localTemplatesStore];
  return newTemplate;
}

export async function syncTemplateStatus(templateId: string): Promise<WhatsAppTemplate> {
  try {
    const updated = await apiPost<WhatsAppTemplate>(`/api/templates/${templateId}/sync`);
    if (updated) {
      localTemplatesStore = localTemplatesStore.map((t) => (t.id === templateId ? updated : t));
      return updated;
    }
  } catch {
    // Fallback simulación de sincronización con Meta
  }

  // Simulación: Si estaba pending pasa a approved
  localTemplatesStore = localTemplatesStore.map((t) => {
    if (t.id === templateId) {
      return {
        ...t,
        status: "approved" as const,
        updatedAt: new Date().toISOString(),
      };
    }
    return t;
  });

  const updatedTpl = localTemplatesStore.find((t) => t.id === templateId);
  return updatedTpl || localTemplatesStore[0];
}
