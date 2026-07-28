import type {
  ConversationRepository,
  MessageRepository,
  TransferRepository,
} from "@/core/modules/conversations/application/ports";
import type { Conversation } from "@/core/modules/conversations/domain/conversation";
import type { Message } from "@/core/modules/conversations/domain/message";
import type { Transfer } from "@/core/modules/conversations/domain/transfer";
import type { ConversationId, DepartmentId } from "@/core/shared/domain/ids";

export class InMemoryConversationRepository implements ConversationRepository {
  private readonly byId = new Map<string, Conversation>();

  constructor(seed: Conversation[] = []) {
    for (const c of seed) this.byId.set(c.id, c);
  }

  async save(conversation: Conversation): Promise<Conversation> {
    this.byId.set(conversation.id, conversation);
    return conversation;
  }

  async findById(id: ConversationId): Promise<Conversation | null> {
    return this.byId.get(id) ?? null;
  }

  async findOpenByWaPhone(waPhone: string): Promise<Conversation | null> {
    const open = [...this.byId.values()].filter(
      (c) => c.waPhone === waPhone && c.status !== "closed" && c.status !== "resolved",
    );
    return open.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0] ?? null;
  }

  async listByDepartment(departmentId: DepartmentId): Promise<Conversation[]> {
    return [...this.byId.values()]
      .filter((c) => c.departmentId === departmentId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async listAll(): Promise<Conversation[]> {
    return [...this.byId.values()].sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
    );
  }
}

export class InMemoryMessageRepository implements MessageRepository {
  private readonly items: Message[] = [];

  constructor(seed: Message[] = []) {
    this.items.push(...seed);
  }

  async save(message: Message): Promise<Message> {
    this.items.push(message);
    return message;
  }

  async listByConversation(conversationId: ConversationId): Promise<Message[]> {
    return this.items
      .filter((m) => m.conversationId === conversationId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
}

export class InMemoryTransferRepository implements TransferRepository {
  private readonly items: Transfer[] = [];

  constructor(seed: Transfer[] = []) {
    this.items.push(...seed);
  }

  async save(transfer: Transfer): Promise<Transfer> {
    this.items.push(transfer);
    return transfer;
  }

  async listByConversation(conversationId: ConversationId): Promise<Transfer[]> {
    return this.items.filter((t) => t.conversationId === conversationId);
  }
}
