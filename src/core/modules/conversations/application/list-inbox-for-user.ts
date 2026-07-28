import type { ConversationRepository } from "@/core/modules/conversations/application/ports";
import type { Conversation } from "@/core/modules/conversations/domain/conversation";
import type { UserRepository } from "@/core/modules/identity/application/ports";
import {
  isGlobalAdmin,
  userDepartmentIds,
} from "@/core/modules/identity/domain/user";
import { NotFoundError } from "@/core/shared/domain/errors";
import type { UserId } from "@/core/shared/domain/ids";

export class ListInboxForUserUseCase {
  constructor(
    private readonly conversations: ConversationRepository,
    private readonly users: UserRepository,
  ) {}

  async execute(userId: UserId): Promise<Conversation[]> {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundError("User", userId);

    const all = await this.conversations.listAll();
    if (isGlobalAdmin(user)) return all;

    const allowed = new Set(userDepartmentIds(user));
    return all.filter((c) => allowed.has(c.departmentId));
  }
}
