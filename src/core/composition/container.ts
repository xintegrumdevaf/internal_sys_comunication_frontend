import { InMemoryAuditLog } from "@/adapters/persistence/memory/audit-log";
import {
  InMemoryConversationRepository,
  InMemoryMessageRepository,
  InMemoryTransferRepository,
} from "@/adapters/persistence/memory/conversation-repository";
import { InMemoryDepartmentRepository } from "@/adapters/persistence/memory/department-repository";
import { InMemoryUserRepository } from "@/adapters/persistence/memory/user-repository";
import { ConsoleOutboundNotifier } from "@/adapters/n8n/outbound-notifier";
import { ListDepartmentsUseCase } from "@/core/modules/departments/application/list-departments";
import { ListUsersUseCase } from "@/core/modules/identity/application/list-users";
import { ListConversationsUseCase } from "@/core/modules/conversations/application/list-conversations";
import { ReceiveInboundMessageUseCase } from "@/core/modules/conversations/application/receive-inbound-message";
import { TakeControlUseCase } from "@/core/modules/conversations/application/take-control";
import { TransferConversationUseCase } from "@/core/modules/conversations/application/transfer-conversation";

/**
 * Composition root — wires ports to adapters.
 * Swap InMemory* for Postgres adapters without touching use cases.
 */
function createContainer() {
  const departments = new InMemoryDepartmentRepository();
  const users = new InMemoryUserRepository();
  const conversations = new InMemoryConversationRepository();
  const messages = new InMemoryMessageRepository();
  const transfers = new InMemoryTransferRepository();
  const audit = new InMemoryAuditLog();
  const notifier = new ConsoleOutboundNotifier();

  return {
    departments,
    users,
    conversations,
    messages,
    transfers,
    audit,
    useCases: {
      listDepartments: new ListDepartmentsUseCase(departments),
      listUsers: new ListUsersUseCase(users),
      listConversations: new ListConversationsUseCase(conversations),
      receiveInboundMessage: new ReceiveInboundMessageUseCase(
        conversations,
        messages,
        departments,
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

/** Singleton across HMR / serverless warm starts in the same isolate. */
export function getContainer(): AppContainer {
  if (!globalThis.__netopsContainer) {
    globalThis.__netopsContainer = createContainer();
  }
  return globalThis.__netopsContainer;
}
