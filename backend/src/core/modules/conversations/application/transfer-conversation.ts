import { createAuditEvent } from "@/core/modules/auditing/domain/audit-event";
import type { AuditLogPort } from "@/core/modules/auditing/application/ports";
import type { DepartmentRepository } from "@/core/modules/departments/application/ports";
import type { UserRepository } from "@/core/modules/identity/application/ports";
import {
  userBelongsToDepartment,
  userCanTransfer,
} from "@/core/modules/identity/domain/user";
import type {
  ConversationRepository,
  OutboundNotifierPort,
  TransferRepository,
} from "@/core/modules/conversations/application/ports";
import { transferDepartment } from "@/core/modules/conversations/domain/conversation";
import { createTransfer } from "@/core/modules/conversations/domain/transfer";
import {
  asAuditEventId,
  asTransferId,
  createId,
  type ConversationId,
  type UserId,
} from "@/core/shared/domain/ids";
import { ForbiddenError, NotFoundError, ValidationError } from "@/core/shared/domain/errors";
import type { Conversation } from "@/core/modules/conversations/domain/conversation";
import type { Transfer } from "@/core/modules/conversations/domain/transfer";

export type TransferConversationInput = {
  conversationId: ConversationId;
  toDepartmentSlug: string;
  requestedByUserId: UserId;
  reason: string;
};

export type TransferConversationResult = {
  conversation: Conversation;
  transfer: Transfer;
};

export class TransferConversationUseCase {
  constructor(
    private readonly conversations: ConversationRepository,
    private readonly transfers: TransferRepository,
    private readonly departments: DepartmentRepository,
    private readonly users: UserRepository,
    private readonly audit: AuditLogPort,
    private readonly notifier: OutboundNotifierPort,
  ) {}

  async execute(input: TransferConversationInput): Promise<TransferConversationResult> {
    if (!input.reason?.trim()) {
      throw new ValidationError("Transfer reason is required");
    }

    const user = await this.users.findById(input.requestedByUserId);
    if (!user) throw new NotFoundError("User", input.requestedByUserId);

    const conversation = await this.conversations.findById(input.conversationId);
    if (!conversation) throw new NotFoundError("Conversation", input.conversationId);

    if (!userBelongsToDepartment(user, conversation.departmentId) && !userCanTransfer(user)) {
      throw new ForbiddenError("User cannot transfer conversations outside their departments");
    }

    const toDepartment = await this.departments.findBySlug(input.toDepartmentSlug);
    if (!toDepartment) {
      throw new ValidationError(`Unknown department slug: ${input.toDepartmentSlug}`);
    }

    const fromDepartmentId = conversation.departmentId;
    const updated = await this.conversations.save(
      transferDepartment(conversation, toDepartment.id),
    );

    const transfer = await this.transfers.save(
      createTransfer({
        id: asTransferId(createId("trf")),
        conversationId: updated.id,
        fromDepartmentId,
        toDepartmentId: toDepartment.id,
        requestedByUserId: user.id,
        reason: input.reason.trim(),
      }),
    );

    await this.audit.append(
      createAuditEvent({
        id: asAuditEventId(createId("aud")),
        action: "TRANSFER",
        actorUserId: user.id,
        resourceType: "conversation",
        resourceId: updated.id,
        metadata: {
          fromDepartmentId,
          toDepartmentId: toDepartment.id,
          reason: transfer.reason,
        },
      }),
    );

    await this.notifier.notifyTransfer({
      conversationId: updated.id,
      toDepartmentSlug: toDepartment.slug,
      waPhone: updated.waPhone,
      reason: transfer.reason,
    });

    return { conversation: updated, transfer };
  }
}
