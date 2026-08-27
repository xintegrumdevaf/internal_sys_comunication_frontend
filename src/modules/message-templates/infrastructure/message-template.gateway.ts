import { apiDelete, apiGet, apiPost } from "@/shared/http/http-client";
import type {
  BackendCreateTemplatePayload,
  BackendTemplateListResponse,
  MessageTemplate,
  RawBackendTemplate,
  TemplateCategory,
  TemplateHeader,
  TemplateButton,
  TemplateStatus,
  WabaConnectionDto,
} from "@/modules/message-templates/domain/message-template";
import { mapRawBackendTemplateToDomain } from "@/modules/message-templates/domain/message-template";

export type ListMessageTemplatesFilter = {
  query?: string;
  category?: TemplateCategory;
  connectionId?: string;
  status?: TemplateStatus;
  limit?: number;
  offset?: number;
  agentUserId?: string;
};

export type CreateMessageTemplatePayload = {
  name: string;
  category: TemplateCategory;
  language: string;
  languageLabel?: string;
  connectionId: string;
  header?: TemplateHeader;
  body: string;
  footer?: string;
  buttons?: TemplateButton[];
};

/**
 * GET /api/message-templates
 * Query Params: category, connectionId, status, search, limit, offset
 */
export async function listMessageTemplates(
  filter?: ListMessageTemplatesFilter,
): Promise<MessageTemplate[]> {
  const rawRes = await apiGet<BackendTemplateListResponse | RawBackendTemplate[]>(
    "/api/message-templates",
    {
      query: {
        search: filter?.query,
        category: filter?.category,
        connectionId: filter?.connectionId,
        status: filter?.status,
        limit: filter?.limit,
        offset: filter?.offset,
      },
      agentId: filter?.agentUserId,
    },
  );

  let rawList: RawBackendTemplate[] = [];
  if (Array.isArray(rawRes)) {
    rawList = rawRes;
  } else if (rawRes && Array.isArray(rawRes.templates)) {
    rawList = rawRes.templates;
  }

  return rawList.map(mapRawBackendTemplateToDomain);
}

/**
 * GET /api/message-templates/:id
 */
export async function getMessageTemplateById(
  id: string,
  agentUserId?: string,
): Promise<MessageTemplate> {
  const raw = await apiGet<RawBackendTemplate>(`/api/message-templates/${id}`, {
    agentId: agentUserId,
  });
  return mapRawBackendTemplateToDomain(raw);
}

/**
 * POST /api/message-templates
 */
export async function createMessageTemplate(
  payload: CreateMessageTemplatePayload,
  agentUserId?: string,
): Promise<MessageTemplate> {
  const bodyPayload: BackendCreateTemplatePayload = {
    name: payload.name,
    category: payload.category,
    language: payload.language,
    connectionId: payload.connectionId || "default",
    headerType: payload.header?.type || "NONE",
    headerContent: payload.header?.text || null,
    bodyText: payload.body,
    footerText: payload.footer || null,
    buttons:
      payload.buttons && payload.buttons.length > 0
        ? payload.buttons.map((b) => ({
            type: b.url ? "URL" : b.phoneNumber ? "PHONE" : "QUICK_REPLY",
            text: b.text,
            url: b.url,
            phoneNumber: b.phoneNumber,
          }))
        : null,
  };

  const raw = await apiPost<RawBackendTemplate>("/api/message-templates", bodyPayload, {
    agentId: agentUserId,
  });

  return mapRawBackendTemplateToDomain(raw);
}

/**
 * DELETE /api/message-templates/:id
 */
export function deleteMessageTemplate(
  id: string,
  agentUserId?: string,
): Promise<{ success: boolean; id?: string }> {
  return apiDelete<{ success: boolean; id?: string }>(`/api/message-templates/${id}`, {
    agentId: agentUserId,
  });
}

/**
 * Conexiones WABA activas.
 * El backend opera sobre un único número de teléfono con connectionId: "default".
 */
export async function listWabaConnections(_agentUserId?: string): Promise<WabaConnectionDto[]> {
  return [
    {
      id: "default",
      name: "Línea Oficial WhatsApp",
      status: "active",
    },
  ];
}
