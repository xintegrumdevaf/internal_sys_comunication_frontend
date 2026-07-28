import type { MessageRepository } from "@/core/modules/conversations/application/ports";
import type { ConversationRepository } from "@/core/modules/conversations/application/ports";
import type { WhatsAppMessengerPort } from "@/adapters/whatsapp-cloud/messenger";
import type { UserRepository } from "@/core/modules/identity/application/ports";
import { userBelongsToDepartment } from "@/core/modules/identity/domain/user";
import type { Message } from "@/core/modules/conversations/domain/message";
import type { Conversation } from "@/core/modules/conversations/domain/conversation";
import { appendPreview } from "@/core/modules/conversations/domain/conversation";
import {
  asMessageId,
  createId,
  type ConversationId,
  type UserId,
} from "@/core/shared/domain/ids";
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/core/shared/domain/errors";
import { createAuditEvent } from "@/core/modules/auditing/domain/audit-event";
import type { AuditLogPort } from "@/core/modules/auditing/application/ports";
import { asAuditEventId } from "@/core/shared/domain/ids";

export type SendOutboundReplyInput = {
  conversationId: ConversationId;
  agentUserId: UserId;
  body: string;
};

export type SendOutboundReplyResult = {
  conversation: Conversation;
  message: Message;
  externalId?: string;
};

export class SendOutboundReplyUseCase {
  constructor(
    private readonly conversations: ConversationRepository,
    private readonly messages: MessageRepository,
    private readonly users: UserRepository,
    private readonly messenger: WhatsAppMessengerPort,
    private readonly audit: AuditLogPort,
  ) {}

  async execute(input: SendOutboundReplyInput): Promise<SendOutboundReplyResult> {
    if (!input.body.trim()) throw new ValidationError("Message body is required");

    const user = await this.users.findById(input.agentUserId);
    if (!user) throw new NotFoundError("User", input.agentUserId);

    const conversation = await this.conversations.findById(input.conversationId);
    if (!conversation) throw new NotFoundError("Conversation", input.conversationId);

    if (!userBelongsToDepartment(user, conversation.departmentId)) {
      throw new ForbiddenError("Agent cannot reply to this conversation");
    }

    if (!this.messenger.isConfigured()) {
      throw new ValidationError(
        "WhatsApp Cloud API is not configured (WHATSAPP_ACCESS_TOKEN / PHONE_NUMBER_ID)",
      );
    }

    const sent = await this.messenger.sendText(conversation.waPhone, input.body.trim());

    const message: Message = {
      id: asMessageId(createId("msg")),
      conversationId: conversation.id,
      direction: "outbound",
      author: "agent",
      body: input.body.trim(),
      externalId: sent.messageId,
      createdAt: new Date(),
    };

    await this.messages.save(message);
    const updated = await this.conversations.save(
      appendPreview(conversation, input.body.trim()),
    );

    await this.audit.append(
      createAuditEvent({
        id: asAuditEventId(createId("aud")),
        action: "HANDOVER",
        actorUserId: user.id,
        resourceType: "message",
        resourceId: message.id,
        metadata: { externalId: sent.messageId, conversationId: conversation.id },
      }),
    );

    return { conversation: updated, message, externalId: sent.messageId };
  }
}
