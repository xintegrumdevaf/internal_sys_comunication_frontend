import { getN8nConfig, isN8nConfigured } from "@/adapters/n8n/config";
import type { MetaChangeForN8n } from "@/adapters/whatsapp-cloud/webhook";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * POST Meta-shaped inbound changes to n8n with background retries.
 * Never throws to callers of scheduleForwardInbound — failures are logged.
 */
export class N8nWebhookClient {
  isConfigured(): boolean {
    return isN8nConfigured();
  }

  /** Fire-and-forget: does not block Meta webhook response. */
  scheduleForwardInbound(payload: MetaChangeForN8n[]): void {
    if (!this.isConfigured()) {
      console.info("[n8n] skip forward — N8N_INBOUND_WEBHOOK_URL not set");
      return;
    }
    if (payload.length === 0) {
      console.info("[n8n] skip forward — empty Meta changes payload");
      return;
    }
    void this.forwardInboundWithRetries(payload);
  }

  async forwardInboundWithRetries(payload: MetaChangeForN8n[]): Promise<void> {
    const config = getN8nConfig();
    if (!config) return;

    const messageIds = payload
      .flatMap((change) => change.messages ?? [])
      .map((m) => (m as { id?: string }).id)
      .filter(Boolean)
      .join(",");

    let lastError: unknown;
    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        await this.postJson(config.inboundWebhookUrl, payload, config.timeoutMs);
        console.info(
          "[n8n] forwarded inbound",
          messageIds || `changes=${payload.length}`,
          `attempt=${attempt}`,
        );
        return;
      } catch (error) {
        lastError = error;
        console.warn(
          "[n8n] forward failed",
          messageIds || `changes=${payload.length}`,
          `attempt=${attempt}/${config.maxAttempts}`,
          error instanceof Error ? error.message : error,
        );
        if (attempt < config.maxAttempts) {
          await sleep(2 ** attempt * 200);
        }
      }
    }

    console.error(
      "[n8n] forward exhausted retries",
      messageIds || `changes=${payload.length}`,
      lastError,
    );
  }

  private async postJson(
    url: string,
    body: unknown,
    timeoutMs: number,
  ): Promise<void> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          // ngrok free interstitial bypass
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(
          `n8n webhook HTTP ${response.status}${text ? `: ${text.slice(0, 200)}` : ""}`,
        );
      }
    } finally {
      clearTimeout(timer);
    }
  }
}
