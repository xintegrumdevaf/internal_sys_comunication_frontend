import { createFileRoute } from "@tanstack/react-router";
import { Inbox } from "lucide-react";
import { AppShell } from "@/app/shell/AppShell";
import { OperationalInbox } from "@/modules/conversations/ui/OperationalInbox";

type BandejaSearch = {
  conversationId?: string;
  departmentId?: string;
  status?: string;
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
      typeof search.status === "string" && search.status.length > 0
        ? search.status
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
        initialStatus={status as any}
      />
    </AppShell>
  );
}
