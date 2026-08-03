import type {
  ConversationRepository,
  MessageRepository,
} from "@/core/modules/conversations/application/ports";
import type { DepartmentRepository } from "@/core/modules/departments/application/ports";
import type { WhatsAppMessengerPort } from "@/adapters/whatsapp-cloud/messenger";
import type { AuditLogPort } from "@/core/modules/auditing/application/ports";
import { createAuditEvent } from "@/core/modules/auditing/domain/audit-event";
import {
  appendPreview,
  type Conversation,
} from "@/core/modules/conversations/domain/conversation";
import type { Message } from "@/core/modules/conversations/domain/message";
import {
  asAuditEventId,
  asConversationId,
  asMessageId,
  createId,
} from "@/core/shared/domain/ids";
import { NotFoundError, ValidationError } from "@/core/shared/domain/errors";

export type SendAiOutboundReplyInput = {
  body: string;
  conversationId?: string;
  waPhone?: string;
  intent?: string;
  departmentSlug?: string;
};

export type SendAiOutboundReplyResult = {
  conversation: Conversation;
  message: Message;
  externalId?: string;
};

/**
 * Automated reply from n8n / AI flows — no human agent membership check.
 */
export class SendAiOutboundReplyUseCase {
  constructor(
    private readonly conversations: ConversationRepository,
    private readonly messages: MessageRepository,
    private readonly departments: DepartmentRepository,
    private readonly messenger: WhatsAppMessengerPort,
    private readonly audit: AuditLogPort,
  ) {}

  async execute(input: SendAiOutboundReplyInput): Promise<SendAiOutboundReplyResult> {
    const body = input.body?.trim();
    if (!body) throw new ValidationError("Message body is required");
    if (!input.conversationId && !input.waPhone?.trim()) {
      throw new ValidationError("conversationId or waPhone is required");
    }

    if (!this.messenger.isConfigured()) {
      throw new ValidationError(
        "WhatsApp Cloud API is not configured (WHATSAPP_ACCESS_TOKEN / PHONE_NUMBER_ID)",
      );
    }

    let conversation = await this.resolveConversation(input);
    if (!conversation) {
      throw new NotFoundError(
        "Conversation",
        input.conversationId ?? input.waPhone ?? "unknown",
      );
    }

    if (input.intent) {
      conversation = { ...conversation, intent: input.intent, updatedAt: new Date() };
    }

    if (input.departmentSlug && conversation.handlerMode === "ai") {
      const department = await this.departments.findBySlug(input.departmentSlug);
      if (!department) {
        throw new ValidationError(`Unknown department slug: ${input.departmentSlug}`);
      }
      if (conversation.departmentId !== department.id) {
        conversation = {
          ...conversation,
          departmentId: department.id,
          updatedAt: new Date(),
        };
      }
    }

    const sent = await this.messenger.sendText(conversation.waPhone, body);

    const message: Message = {
      id: asMessageId(createId("msg")),
      conversationId: conversation.id,
      direction: "outbound",
      author: "ai",
      body,
      externalId: sent.messageId,
      createdAt: new Date(),
    };

    await this.messages.save(message);
    const updated = await this.conversations.save(appendPreview(conversation, body));

    await this.audit.append(
      createAuditEvent({
        id: asAuditEventId(createId("aud")),
        action: "HANDOVER",
        resourceType: "message",
        resourceId: message.id,
        metadata: {
          source: "n8n",
          author: "ai",
          externalId: sent.messageId,
          conversationId: conversation.id,
        },
      }),
    );

    return { conversation: updated, message, externalId: sent.messageId };
  }

  private async resolveConversation(
    input: SendAiOutboundReplyInput,
  ): Promise<Conversation | null> {
    if (input.conversationId) {
      return this.conversations.findById(asConversationId(input.conversationId));
    }

    const phone = input.waPhone!.trim();
    const normalized = phone.startsWith("+")
      ? phone
      : `+${phone.replace(/\D/g, "")}`;
    return this.conversations.findOpenByWaPhone(normalized);
  }
}
