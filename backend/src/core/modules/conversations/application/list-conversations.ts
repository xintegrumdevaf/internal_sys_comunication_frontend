import type { ConversationRepository } from "@/core/modules/conversations/application/ports";
import type { Conversation } from "@/core/modules/conversations/domain/conversation";
import type { DepartmentId } from "@/core/shared/domain/ids";

export type ListConversationsInput = {
  departmentId?: DepartmentId;
};

export class ListConversationsUseCase {
  constructor(private readonly conversations: ConversationRepository) {}

  execute(input: ListConversationsInput = {}): Promise<Conversation[]> {
    if (input.departmentId) {
      return this.conversations.listByDepartment(input.departmentId);
    }
    return this.conversations.listAll();
  }
}
