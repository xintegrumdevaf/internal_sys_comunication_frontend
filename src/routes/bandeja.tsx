import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";
import { Inbox } from "lucide-react";
import { AppShell } from "@/app/shell/AppShell";
import { OperationalInbox, type InboxTab } from "@/modules/conversations/ui/OperationalInbox";
import type { ConversationStatus } from "@/modules/conversations/domain/conversation";

type BandejaSearch = {
  conversationId?: string;
  departmentId?: string;
  status?: ConversationStatus;
  tab?: InboxTab;
  filter?: "unassigned" | "unattended";
};

const VALID_TABS: readonly InboxTab[] = [
  "open",
  "unassigned",
  "unattended",
  "pending",
  "resolved",
  "closed",
] as const;

export const Route = createFileRoute("/bandeja")({
  validateSearch: (search: Record<string, unknown>): BandejaSearch => {
    const rawTab = typeof search.tab === "string" ? search.tab : undefined;
    const rawFilter = typeof search.filter === "string" ? search.filter : undefined;
    const resolvedTab: InboxTab | undefined =
      rawTab && (VALID_TABS as readonly string[]).includes(rawTab)
        ? (rawTab as InboxTab)
        : rawFilter === "unassigned"
          ? "unassigned"
          : rawFilter === "unattended"
            ? "unattended"
            : undefined;

    return {
      conversationId:
        typeof search.conversationId === "string" && search.conversationId.length > 0
          ? search.conversationId
          : undefined,
      departmentId:
        typeof search.departmentId === "string" && search.departmentId.length > 0
          ? search.departmentId
          : undefined,
      status: typeof search.status === "string" ? (search.status as ConversationStatus) : undefined,
      tab: resolvedTab,
      filter: rawFilter === "unassigned" || rawFilter === "unattended" ? rawFilter : undefined,
    };
  },
  component: BandejaPage,
});

function BandejaPage() {
  const navigate = useNavigate();
  const { conversationId, departmentId, status, tab } = Route.useSearch();
  const initialTab: InboxTab = tab ?? (status as InboxTab) ?? "open";

  const handleClearInitialConversation = useCallback(() => {
    if (!conversationId) return;
    void navigate({
      to: "/bandeja",
      search: (prev) => ({
        ...prev,
        conversationId: undefined,
      }),
      replace: true,
    });
  }, [conversationId, navigate]);

  return (
    <AppShell title="Bandeja de conversaciones" icon={Inbox}>
      <OperationalInbox
        initialDepartmentId={departmentId}
        initialConversationId={conversationId}
        initialTab={initialTab}
        onClearInitialConversation={handleClearInitialConversation}
      />
    </AppShell>
  );
}
