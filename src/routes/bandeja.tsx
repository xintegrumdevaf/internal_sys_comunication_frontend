import { createFileRoute } from "@tanstack/react-router";
import { Inbox } from "lucide-react";
import { AppShell } from "@/app/shell/AppShell";
import { OperationalInbox } from "@/modules/conversations/ui/OperationalInbox";

type BandejaSearch = {
  conversationId?: string;
  departmentId?: string;
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
  }),
  component: BandejaPage,
});

function BandejaPage() {
  const { conversationId, departmentId } = Route.useSearch();

  return (
    <AppShell title="Bandeja de conversaciones" icon={Inbox}>
      <OperationalInbox initialDepartmentId={departmentId} initialConversationId={conversationId} />
    </AppShell>
  );
}
