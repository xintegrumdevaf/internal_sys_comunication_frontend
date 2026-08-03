import { InMemoryAuditLog } from "@/adapters/persistence/memory/audit-log";
import {
  InMemoryConversationRepository,
  InMemoryMessageRepository,
  InMemoryTransferRepository,
} from "@/adapters/persistence/memory/conversation-repository";
import { InMemoryDepartmentRepository } from "@/adapters/persistence/memory/department-repository";
import { InMemoryUserRepository } from "@/adapters/persistence/memory/user-repository";
import {
  SEED_AUDIT,
  SEED_CONVERSATIONS,
  SEED_MESSAGES,
  SEED_TRANSFERS,
} from "@/adapters/persistence/memory/seed-operations";
import { ConsoleOutboundNotifier } from "@/adapters/n8n/outbound-notifier";
import {
  WhatsAppAwareOutboundNotifier,
  WhatsAppCloudMessenger,
} from "@/adapters/whatsapp-cloud/messenger";
import { ListDepartmentsUseCase } from "@/core/modules/departments/application/list-departments";
import { ListUsersUseCase } from "@/core/modules/identity/application/list-users";
import { ListConversationsUseCase } from "@/core/modules/conversations/application/list-conversations";
import { ListInboxForUserUseCase } from "@/core/modules/conversations/application/list-inbox-for-user";
import { ListMessagesUseCase } from "@/core/modules/conversations/application/list-messages";
import { ReceiveInboundMessageUseCase } from "@/core/modules/conversations/application/receive-inbound-message";
import { SendAiOutboundReplyUseCase } from "@/core/modules/conversations/application/send-ai-outbound-reply";
import { SendOutboundReplyUseCase } from "@/core/modules/conversations/application/send-outbound-reply";
import { TakeControlUseCase } from "@/core/modules/conversations/application/take-control";
import { TransferConversationUseCase } from "@/core/modules/conversations/application/transfer-conversation";

function createContainer() {
  const departments = new InMemoryDepartmentRepository();
  const users = new InMemoryUserRepository();
  const conversations = new InMemoryConversationRepository(SEED_CONVERSATIONS);
  const messages = new InMemoryMessageRepository(SEED_MESSAGES);
  const transfers = new InMemoryTransferRepository(SEED_TRANSFERS);
  const audit = new InMemoryAuditLog(SEED_AUDIT);
  const messenger = new WhatsAppCloudMessenger();
  const notifier = new WhatsAppAwareOutboundNotifier(
    messenger,
    new ConsoleOutboundNotifier(),
  );

  return {
    departments,
    users,
    conversations,
    messages,
    transfers,
    audit,
    messenger,
    useCases: {
      listDepartments: new ListDepartmentsUseCase(departments),
      listUsers: new ListUsersUseCase(users),
      listConversations: new ListConversationsUseCase(conversations),
      listInboxForUser: new ListInboxForUserUseCase(conversations, users),
      listMessages: new ListMessagesUseCase(messages),
      receiveInboundMessage: new ReceiveInboundMessageUseCase(
        conversations,
        messages,
        departments,
        audit,
      ),
      sendOutboundReply: new SendOutboundReplyUseCase(
        conversations,
        messages,
        users,
        messenger,
        audit,
      ),
      sendAiOutboundReply: new SendAiOutboundReplyUseCase(
        conversations,
        messages,
        departments,
        messenger,
        audit,
      ),
      takeControl: new TakeControlUseCase(conversations, users, audit),
      transferConversation: new TransferConversationUseCase(
        conversations,
        transfers,
        departments,
        users,
        audit,
        notifier,
      ),
    },
  };
}

export type AppContainer = ReturnType<typeof createContainer>;

declare global {
  // eslint-disable-next-line no-var
  var __netopsContainer: AppContainer | undefined;
}

export function getContainer(): AppContainer {
  if (!globalThis.__netopsContainer) {
    globalThis.__netopsContainer = createContainer();
  }
  return globalThis.__netopsContainer;
}

export function resetContainer(): AppContainer {
  globalThis.__netopsContainer = createContainer();
  return globalThis.__netopsContainer;
}
