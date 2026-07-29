import { createHmac, timingSafeEqual } from "node:crypto";
import { getWhatsAppCloudConfig } from "@/adapters/whatsapp-cloud/config";

export type ParsedInboundWhatsAppMessage = {
  waPhone: string;
  body: string;
  waMessageId: string;
  customerName?: string;
  phoneNumberId?: string;
  timestamp?: string;
  type: string;
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
  image?: { caption?: string };
  document?: { caption?: string; filename?: string };
  audio?: { id?: string };
  video?: { caption?: string };
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

function extractBody(message: MetaMessage): string | null {
  switch (message.type) {
    case "text":
      return message.text?.body?.trim() || null;
    case "button":
      return message.button?.text?.trim() || null;
    case "interactive":
      return (
        message.interactive?.button_reply?.title?.trim() ||
        message.interactive?.list_reply?.title?.trim() ||
        null
      );
    case "image":
      return message.image?.caption?.trim() || "[imagen]";
    case "document":
      return (
        message.document?.caption?.trim() ||
        message.document?.filename?.trim() ||
        "[documento]"
      );
    case "audio":
      return "[audio]";
    case "video":
      return message.video?.caption?.trim() || "[video]";
    default:
      return message.type ? `[${message.type}]` : null;
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
        const text = extractBody(message);
        if (!text) continue;

        out.push({
          waPhone: `+${message.from.replace(/\D/g, "")}`,
          body: text,
          waMessageId: message.id,
          customerName: contactName,
          phoneNumberId: value.metadata?.phone_number_id,
          timestamp: message.timestamp,
          type: message.type ?? "text",
        });
      }
    }
  }

  return out;
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
