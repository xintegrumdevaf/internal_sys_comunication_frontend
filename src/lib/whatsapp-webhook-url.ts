import { resolveApiUrl } from "@/lib/api-base";

type WhatsAppWebhookStatus = {
  publicWebhookUrl?: string | null;
  appPublicUrl?: string | null;
  webhookPath?: string | null;
};

const DEFAULT_WEBHOOK_PATH = "/api/webhooks/whatsapp";

export function resolveWhatsAppWebhookUrl(status?: WhatsAppWebhookStatus | null): string {
  const publicWebhookUrl = status?.publicWebhookUrl?.trim();
  if (publicWebhookUrl) return publicWebhookUrl;

  const webhookPath = status?.webhookPath?.trim() || DEFAULT_WEBHOOK_PATH;
  const appPublicUrl = status?.appPublicUrl?.trim();
  if (appPublicUrl) {
    const base = appPublicUrl.replace(/\/+$/, "");
    const path = webhookPath.startsWith("/") ? webhookPath : `/${webhookPath}`;
    return `${base}${path}`;
  }

  return resolveApiUrl(webhookPath);
}
