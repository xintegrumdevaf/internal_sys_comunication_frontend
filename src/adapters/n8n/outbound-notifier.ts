import type { OutboundNotifierPort } from "@/core/modules/conversations/application/ports";
import type { ConversationId } from "@/core/shared/domain/ids";

/**
 * Adapter stub: in production this POSTs to an n8n webhook so Meta/WhatsApp
 * (or downstream workflows) stay in sync after Core mutations.
 */
export class ConsoleOutboundNotifier implements OutboundNotifierPort {
  async notifyTransfer(input: {
    conversationId: ConversationId;
    toDepartmentSlug: string;
    waPhone: string;
    reason: string;
  }): Promise<void> {
    console.info("[outbound:n8n] transfer", input);
  }
}
