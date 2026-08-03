import { createAuditEvent } from "@/core/modules/auditing/domain/audit-event";
import type { AuditLogPort } from "@/core/modules/auditing/application/ports";
import type { UserRepository } from "@/core/modules/identity/application/ports";
import { userBelongsToDepartment } from "@/core/modules/identity/domain/user";
import type { ConversationRepository } from "@/core/modules/conversations/application/ports";
import { assignToHuman } from "@/core/modules/conversations/domain/conversation";
import {
  asAuditEventId,
  createId,
  type ConversationId,
  type UserId,
} from "@/core/shared/domain/ids";
import { ForbiddenError, NotFoundError } from "@/core/shared/domain/errors";
import type { Conversation } from "@/core/modules/conversations/domain/conversation";

export type TakeControlInput = {
  conversationId: ConversationId;
  agentUserId: UserId;
};

export class TakeControlUseCase {
  constructor(
    private readonly conversations: ConversationRepository,
    private readonly users: UserRepository,
    private readonly audit: AuditLogPort,
  ) {}

  async execute(input: TakeControlInput): Promise<Conversation> {
    const user = await this.users.findById(input.agentUserId);
    if (!user) throw new NotFoundError("User", input.agentUserId);

    const conversation = await this.conversations.findById(input.conversationId);
    if (!conversation) throw new NotFoundError("Conversation", input.conversationId);

    if (!userBelongsToDepartment(user, conversation.departmentId)) {
      throw new ForbiddenError("Agent does not belong to conversation department");
    }

    const updated = await this.conversations.save(assignToHuman(conversation, user.id));

    await this.audit.append(
      createAuditEvent({
        id: asAuditEventId(createId("aud")),
        action: "TAKE_CONTROL",
        actorUserId: user.id,
        resourceType: "conversation",
        resourceId: updated.id,
      }),
    );

    return updated;
  }
}
