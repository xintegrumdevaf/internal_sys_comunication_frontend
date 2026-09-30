import { createFileRoute } from "@tanstack/react-router";
import { Inbox } from "lucide-react";
import { AppShell } from "@/app/shell/AppShell";
import { OperationalInbox } from "@/modules/conversations/ui/OperationalInbox";
import type { ConversationStatus } from "@/modules/conversations/domain/conversation";

const VALID_STATUSES: ConversationStatus[] = ["open", "pending", "resolved", "closed"];

type BandejaSearch = {
  conversationId?: string;
  departmentId?: string;
  status?: ConversationStatus;
};

export const Route = createFileRoute("/bandeja")({
  validateSearch: (search: Record<string, unknown>): BandejaSearch => ({
    conversationId:
      typeof search.conversationId === "string" && search.conversationId.length > 0
        ? search.conversationId
        : undefined,
    departmentId:
      typeof search.departmentId === "string" && search.departmentId.length > 0
        ? search.departmentId
        : undefined,
    status:
      typeof search.status === "string" &&
      VALID_STATUSES.includes(search.status as ConversationStatus)
        ? (search.status as ConversationStatus)
        : undefined,
  }),
  component: BandejaPage,
});

function BandejaPage() {
  const { conversationId, departmentId, status } = Route.useSearch();

  return (
    <AppShell title="Bandeja de conversaciones" icon={Inbox}>
      <OperationalInbox
        initialDepartmentId={departmentId}
        initialConversationId={conversationId}
        initialStatus={status}
      />
    </AppShell>
  );
}
