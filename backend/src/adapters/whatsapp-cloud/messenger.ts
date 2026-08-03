import type { OutboundNotifierPort } from "@/core/modules/conversations/application/ports";
import type { ConversationId } from "@/core/shared/domain/ids";
import { WhatsAppCloudClient } from "@/adapters/whatsapp-cloud/client";
import { isWhatsAppCloudConfigured } from "@/adapters/whatsapp-cloud/config";

export interface WhatsAppMessengerPort {
  isConfigured(): boolean;
  sendText(to: string, body: string): Promise<{ messageId: string }>;
}

export class WhatsAppCloudMessenger implements WhatsAppMessengerPort {
  private readonly client = new WhatsAppCloudClient();

  isConfigured(): boolean {
    return isWhatsAppCloudConfigured();
  }

  sendText(to: string, body: string): Promise<{ messageId: string }> {
    return this.client.sendText(to, body);
  }
}

/** Notifica transferencias intentando avisar al cliente por WhatsApp si hay Cloud API. */
export class WhatsAppAwareOutboundNotifier implements OutboundNotifierPort {
  constructor(
    private readonly messenger: WhatsAppMessengerPort,
    private readonly fallback?: OutboundNotifierPort,
  ) {}

  async notifyTransfer(input: {
    conversationId: ConversationId;
    toDepartmentSlug: string;
    waPhone: string;
    reason: string;
  }): Promise<void> {
    if (this.messenger.isConfigured()) {
      try {
        await this.messenger.sendText(
          input.waPhone,
          `Tu caso fue transferido al área de ${input.toDepartmentSlug}. Motivo: ${input.reason}`,
        );
      } catch (error) {
        console.error("[whatsapp] transfer notify failed", error);
      }
    }
    await this.fallback?.notifyTransfer(input);
  }
}
