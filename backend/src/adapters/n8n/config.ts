export type N8nConfig = {
  inboundWebhookUrl: string;
  maxAttempts: number;
  timeoutMs: number;
};

export function getN8nConfig(): N8nConfig | null {
  const inboundWebhookUrl = process.env.N8N_INBOUND_WEBHOOK_URL?.trim();
  if (!inboundWebhookUrl) return null;

  const maxAttempts = Number(process.env.N8N_WEBHOOK_MAX_ATTEMPTS ?? "3");
  const timeoutMs = Number(process.env.N8N_WEBHOOK_TIMEOUT_MS ?? "8000");

  return {
    inboundWebhookUrl,
    maxAttempts: Number.isFinite(maxAttempts) && maxAttempts > 0 ? maxAttempts : 3,
    timeoutMs: Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 8000,
  };
}

export function isN8nConfigured(): boolean {
  return getN8nConfig() !== null;
}
