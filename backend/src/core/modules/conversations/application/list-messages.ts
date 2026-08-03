import type { MessageRepository } from "@/core/modules/conversations/application/ports";
import type { Message } from "@/core/modules/conversations/domain/message";
import type { ConversationId } from "@/core/shared/domain/ids";

export class ListMessagesUseCase {
  constructor(private readonly messages: MessageRepository) {}

  execute(conversationId: ConversationId): Promise<Message[]> {
    return this.messages.listByConversation(conversationId);
  }
}
