import { createAuditEvent } from "@/core/modules/auditing/domain/audit-event";
import type { AuditLogPort } from "@/core/modules/auditing/application/ports";
import type { DepartmentRepository } from "@/core/modules/departments/application/ports";
import type {
  ConversationRepository,
  MessageRepository,
} from "@/core/modules/conversations/application/ports";
import {
  appendPreview,
  openConversation,
} from "@/core/modules/conversations/domain/conversation";
import { createInboundMessage } from "@/core/modules/conversations/domain/message";
import {
  asAuditEventId,
  asConversationId,
  asMessageId,
  createId,
} from "@/core/shared/domain/ids";
import { ValidationError } from "@/core/shared/domain/errors";
import type { Conversation } from "@/core/modules/conversations/domain/conversation";
import type { Message } from "@/core/modules/conversations/domain/message";

export type ReceiveInboundMessageInput = {
  waPhone: string;
  body: string;
  /** Department slug resolved by n8n classifier */
  departmentSlug: string;
  waMessageId?: string;
  customerName?: string;
  contractId?: string;
  intent?: string;
};

export type ReceiveInboundMessageResult = {
  conversation: Conversation;
  message: Message;
  created: boolean;
};

export class ReceiveInboundMessageUseCase {
  constructor(
    private readonly conversations: ConversationRepository,
    private readonly messages: MessageRepository,
    private readonly departments: DepartmentRepository,
    private readonly audit: AuditLogPort,
  ) {}

  async execute(input: ReceiveInboundMessageInput): Promise<ReceiveInboundMessageResult> {
    if (!input.waPhone?.trim()) {
      throw new ValidationError("waPhone is required");
    }
    if (!input.body?.trim()) {
      throw new ValidationError("body is required");
    }

    const department = await this.departments.findBySlug(input.departmentSlug);
    if (!department) {
      throw new ValidationError(`Unknown department slug: ${input.departmentSlug}`);
    }

    let conversation = await this.conversations.findOpenByWaPhone(input.waPhone);
    let created = false;

    if (!conversation) {
      conversation = openConversation({
        id: asConversationId(createId("conv")),
        waPhone: input.waPhone,
        departmentId: department.id,
        waMessageId: input.waMessageId,
        customerName: input.customerName,
        contractId: input.contractId,
        intent: input.intent,
        lastMessagePreview: input.body,
      });
      created = true;
      await this.audit.append(
        createAuditEvent({
          id: asAuditEventId(createId("aud")),
          action: "CONVERSATION_OPENED",
          resourceType: "conversation",
          resourceId: conversation.id,
          metadata: { departmentSlug: department.slug, waPhone: input.waPhone },
        }),
      );
    } else {
      conversation = appendPreview(conversation, input.body);
      if (input.intent) conversation = { ...conversation, intent: input.intent };
      // Re-route only if still AI-handled and n8n sends a different department
      if (
        conversation.handlerMode === "ai" &&
        conversation.departmentId !== department.id
      ) {
        conversation = {
          ...conversation,
          departmentId: department.id,
          updatedAt: new Date(),
        };
      }
    }

    conversation = await this.conversations.save(conversation);

    const message = await this.messages.save(
      createInboundMessage({
        id: asMessageId(createId("msg")),
        conversationId: conversation.id,
        body: input.body,
        externalId: input.waMessageId,
      }),
    );

    await this.audit.append(
      createAuditEvent({
        id: asAuditEventId(createId("aud")),
        action: "MESSAGE_RECEIVED",
        resourceType: "message",
        resourceId: message.id,
        metadata: {
          conversationId: conversation.id,
          departmentSlug: department.slug,
        },
      }),
    );

    return { conversation, message, created };
  }
}
