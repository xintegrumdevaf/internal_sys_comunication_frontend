import type { Conversation } from "@/core/modules/conversations/domain/conversation";
import type { Message } from "@/core/modules/conversations/domain/message";
import type { Transfer } from "@/core/modules/conversations/domain/transfer";
import type { ConversationId, DepartmentId } from "@/core/shared/domain/ids";

export interface ConversationRepository {
  save(conversation: Conversation): Promise<Conversation>;
  findById(id: ConversationId): Promise<Conversation | null>;
  findOpenByWaPhone(waPhone: string): Promise<Conversation | null>;
  listByDepartment(departmentId: DepartmentId): Promise<Conversation[]>;
  listAll(): Promise<Conversation[]>;
}

export interface MessageRepository {
  save(message: Message): Promise<Message>;
  listByConversation(conversationId: ConversationId): Promise<Message[]>;
}

export interface TransferRepository {
  save(transfer: Transfer): Promise<Transfer>;
  listByConversation(conversationId: ConversationId): Promise<Transfer[]>;
}

/** Outbound port: notify external systems (n8n / Meta) when Core needs to reply or sync. */
export interface OutboundNotifierPort {
  notifyTransfer(input: {
    conversationId: ConversationId;
    toDepartmentSlug: string;
    waPhone: string;
    reason: string;
  }): Promise<void>;
}
