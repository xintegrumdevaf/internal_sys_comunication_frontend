import { createHmac, timingSafeEqual } from "node:crypto";
import { getWhatsAppCloudConfig } from "@/adapters/whatsapp-cloud/config";
import type { MessageType } from "@/core/modules/conversations/domain/message";

export type ParsedInboundWhatsAppMessage = {
  waPhone: string;
  body: string;
  waMessageId: string;
  customerName?: string;
  phoneNumberId?: string;
  timestamp?: string;
  type: MessageType;
  mediaId?: string;
  mimeType?: string;
  caption?: string;
  filename?: string;
};

export function verifyMetaWebhookChallenge(input: {
  mode: string | null;
  token: string | null;
  challenge: string | null;
}): string | null {
  const config = getWhatsAppCloudConfig();
  if (!config) return null;
  if (input.mode === "subscribe" && input.token === config.verifyToken && input.challenge) {
    return input.challenge;
  }
  return null;
}

export function verifyMetaSignature(
  rawBody: string,
  signatureHeader: string | null,
): boolean {
  const config = getWhatsAppCloudConfig();
  if (!config?.appSecret) {
    return true;
  }
  if (!signatureHeader?.startsWith("sha256=")) return false;

  const expected = createHmac("sha256", config.appSecret)
    .update(rawBody, "utf8")
    .digest("hex");
  const received = signatureHeader.slice("sha256=".length);

  try {
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(received, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

type MetaMediaObject = {
  id?: string;
  mime_type?: string;
  caption?: string;
  filename?: string;
  voice?: boolean;
};

type MetaMessage = {
  from?: string;
  id?: string;
  timestamp?: string;
  type?: string;
  text?: { body?: string };
  button?: { text?: string };
  interactive?: {
    button_reply?: { title?: string };
    list_reply?: { title?: string };
  };
  image?: MetaMediaObject;
  document?: MetaMediaObject;
  audio?: MetaMediaObject;
  video?: MetaMediaObject;
};

type MetaWebhookValue = {
  messaging_product?: string;
  metadata?: {
    display_phone_number?: string;
    phone_number_id?: string;
  };
  contacts?: Array<{
    profile?: { name?: string };
    wa_id?: string;
    user_id?: string;
  }>;
  messages?: MetaMessage[];
  [key: string]: unknown;
};

type MetaWebhookBody = {
  object?: string;
  entry?: Array<{
    changes?: Array<{
      field?: string;
      value?: MetaWebhookValue;
    }>;
  }>;
};

/** Shape n8n WhatsApp workflows expect: Meta `value` + `field`. */
export type MetaChangeForN8n = MetaWebhookValue & { field: string };

/**
 * Extract inbound message changes as the flat array n8n expects, e.g.
 * `[{ messaging_product, metadata, contacts, messages, field: "messages" }]`.
 */
export function extractMetaChangesForN8n(body: unknown): MetaChangeForN8n[] {
  const payload = body as MetaWebhookBody;
  if (payload.object !== "whatsapp_business_account") return [];

  const out: MetaChangeForN8n[] = [];
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      if (!value?.messages?.length) continue;
      out.push({
        ...value,
        field: change.field ?? "messages",
      });
    }
  }
  return out;
}

const MEDIA_TYPES = new Set(["image", "audio", "video", "document"]);

function normalizeMessageType(raw?: string): MessageType {
  switch (raw) {
    case "text":
    case "image":
    case "audio":
    case "video":
    case "document":
      return raw;
    case "button":
    case "interactive":
      return "text";
    default:
      return raw ? "other" : "text";
  }
}

function mediaObject(message: MetaMessage): MetaMediaObject | undefined {
  switch (message.type) {
    case "image":
      return message.image;
    case "audio":
      return message.audio;
    case "video":
      return message.video;
    case "document":
      return message.document;
    default:
      return undefined;
  }
}

function previewLabel(type: MessageType): string {
  switch (type) {
    case "image":
      return "Imagen";
    case "audio":
      return "Audio";
    case "video":
      return "Video";
    case "document":
      return "Documento";
    default:
      return "Adjunto";
  }
}

type ExtractedContent = {
  body: string;
  type: MessageType;
  mediaId?: string;
  mimeType?: string;
  caption?: string;
  filename?: string;
};

function extractContent(message: MetaMessage): ExtractedContent | null {
  const type = normalizeMessageType(message.type);

  switch (message.type) {
    case "text": {
      const body = message.text?.body?.trim();
      return body ? { body, type: "text" } : null;
    }
    case "button": {
      const body = message.button?.text?.trim();
      return body ? { body, type: "text" } : null;
    }
    case "interactive": {
      const body =
        message.interactive?.button_reply?.title?.trim() ||
        message.interactive?.list_reply?.title?.trim();
      return body ? { body, type: "text" } : null;
    }
    case "image":
    case "audio":
    case "video":
    case "document": {
      const media = mediaObject(message);
      const caption = media?.caption?.trim() || undefined;
      const filename = media?.filename?.trim() || undefined;
      const body =
        caption || filename || previewLabel(type);
      return {
        body,
        type,
        mediaId: media?.id,
        mimeType: media?.mime_type,
        caption,
        filename,
      };
    }
    default:
      return message.type
        ? { body: previewLabel("other"), type: "other" }
        : null;
  }
}

export function parseInboundWhatsAppWebhook(
  body: unknown,
): ParsedInboundWhatsAppMessage[] {
  const payload = body as MetaWebhookBody;
  if (payload.object !== "whatsapp_business_account") return [];

  const out: ParsedInboundWhatsAppMessage[] = [];

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      if (!value?.messages?.length) continue;

      const contactName = value.contacts?.[0]?.profile?.name;
      for (const message of value.messages) {
        if (!message.from || !message.id) continue;
        const content = extractContent(message);
        if (!content) continue;

        out.push({
          waPhone: `+${message.from.replace(/\D/g, "")}`,
          body: content.body,
          waMessageId: message.id,
          customerName: contactName,
          phoneNumberId: value.metadata?.phone_number_id,
          timestamp: message.timestamp,
          type: content.type,
          mediaId: content.mediaId,
          mimeType: content.mimeType,
          caption: content.caption,
          filename: content.filename,
        });
      }
    }
  }

  return out;
}

function messageHasMediaPayload(message: MetaMessage): boolean {
  if (!message.type || !MEDIA_TYPES.has(message.type)) return false;
  return Boolean(mediaObject(message)?.id);
}

/**
 * Clone Meta changes and attach hub proxy fields on each media message.
 * `waMessageId → hubMessageId` must come from successful ingest.
 */
export function enrichMetaChangesWithHubMedia(
  changes: MetaChangeForN8n[],
  waToHubMessageId: Map<string, string>,
  publicBaseUrl?: string,
): MetaChangeForN8n[] {
  const base = publicBaseUrl?.replace(/\/$/, "") ?? "";
  if (!base) {
    console.warn(
      "[whatsapp] APP_PUBLIC_URL not set — hub_media_url will be relative paths",
    );
  }

  return changes.map((change) => {
    if (!change.messages?.length) return change;
    return {
      ...change,
      messages: change.messages.map((message) => {
        if (!message.id || !messageHasMediaPayload(message)) return message;
        const hubMessageId = waToHubMessageId.get(message.id);
        if (!hubMessageId) return message;
        const path = `/api/media/${hubMessageId}`;
        return {
          ...message,
          hub_message_id: hubMessageId,
          hub_media_url: base ? `${base}${path}` : path,
        };
      }),
    };
  });
}

export function inferDepartmentSlugFromText(
  body: string,
  fallback: string,
): string {
  const t = body.toLowerCase();
  if (
    t.includes("pago") ||
    t.includes("boucher") ||
    t.includes("comprobante") ||
    t.includes("factura") ||
    t.includes("mora")
  ) {
    return "cartera";
  }
  if (
    t.includes("traslado") ||
    t.includes("mudanza") ||
    t.includes("instalaci") ||
    t.includes("cobertura") ||
    t.includes("visita")
  ) {
    return "traslados";
  }
  if (
    t.includes("internet") ||
    t.includes("onu") ||
    t.includes("lento") ||
    t.includes("señal") ||
    t.includes("dano") ||
    t.includes("daño")
  ) {
    return "soporte";
  }
  return fallback;
}
