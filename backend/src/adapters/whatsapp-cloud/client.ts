import {
  getWhatsAppCloudConfig,
  toWhatsAppDigits,
} from "@/adapters/whatsapp-cloud/config";

export type SendTextResult = {
  messageId: string;
  raw: unknown;
};

export class WhatsAppCloudClient {
  async sendText(to: string, body: string): Promise<SendTextResult> {
    const config = getWhatsAppCloudConfig();
    if (!config) {
      throw new Error("WhatsApp Cloud API is not configured");
    }

    const res = await fetch(
      `${config.apiBase}/${config.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: toWhatsAppDigits(to),
          type: "text",
          text: { preview_url: false, body },
        }),
      },
    );

    const raw = (await res.json()) as {
      messages?: Array<{ id: string }>;
      error?: { message?: string; code?: number };
    };

    if (!res.ok) {
      throw new Error(
        raw.error?.message ?? `WhatsApp send failed (${res.status})`,
      );
    }

    const messageId = raw.messages?.[0]?.id;
    if (!messageId) {
      throw new Error("WhatsApp send succeeded but no message id returned");
    }

    return { messageId, raw };
  }

  async markRead(messageId: string): Promise<void> {
    const config = getWhatsAppCloudConfig();
    if (!config) return;

    await fetch(`${config.apiBase}/${config.phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        status: "read",
        message_id: messageId,
      }),
    }).catch(() => undefined);
  }

  /** Resolve a temporary download URL for a Graph media id. */
  async getMediaUrl(mediaId: string): Promise<{ url: string; mimeType?: string }> {
    const config = getWhatsAppCloudConfig();
    if (!config) {
      throw new Error("WhatsApp Cloud API is not configured");
    }

    const res = await fetch(`${config.apiBase}/${mediaId}`, {
      headers: { Authorization: `Bearer ${config.accessToken}` },
    });

    const raw = (await res.json()) as {
      url?: string;
      mime_type?: string;
      error?: { message?: string };
    };

    if (!res.ok || !raw.url) {
      throw new Error(
        raw.error?.message ?? `WhatsApp media lookup failed (${res.status})`,
      );
    }

    return { url: raw.url, mimeType: raw.mime_type };
  }

  /** Download media bytes from a Meta temporary URL (requires Bearer). */
  async downloadMedia(url: string): Promise<{ bytes: ArrayBuffer; contentType: string }> {
    const config = getWhatsAppCloudConfig();
    if (!config) {
      throw new Error("WhatsApp Cloud API is not configured");
    }

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${config.accessToken}` },
    });

    if (!res.ok) {
      throw new Error(`WhatsApp media download failed (${res.status})`);
    }

    const bytes = await res.arrayBuffer();
    const contentType =
      res.headers.get("content-type") ?? "application/octet-stream";
    return { bytes, contentType };
  }
}
