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
}
