import { createFileRoute } from "@tanstack/react-router";
import { Inbox } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { OperationalInbox } from "../components/OperationalInbox";
import { WhatsAppCloudStatusPanel } from "../components/whatsapp/WhatsAppCloudStatusPanel";
import { useSession } from "../lib/auth";

type BandejaSearch = {
  conversationId?: string;
};

export const Route = createFileRoute("/bandeja")({
  validateSearch: (search: Record<string, unknown>): BandejaSearch => ({
    conversationId:
      typeof search.conversationId === "string" && search.conversationId.length > 0
        ? search.conversationId
        : undefined,
  }),
  component: BandejaPage,
});

function BandejaPage() {
  const session = useSession();
  const { conversationId } = Route.useSearch();
  return (
    <AppShell title="Bandeja Unificada" icon={Inbox}>
      <div className="mb-4 p-3 rounded-lg border border-border bg-card text-[11px] text-muted-foreground animate-fade-up">
        Canal único de comunicación (WhatsApp Cloud API). Vista de{" "}
        <span className="font-bold text-foreground">{session?.name ?? "…"}</span> (
        {session?.roleLabel}). Cada mensaje muestra su hora; la respuesta al cliente sale por
        Cloud API. Las notas internas del supervisor no las ve el cliente.
      </div>
      <div className="mb-4">
        <WhatsAppCloudStatusPanel />
      </div>
      <OperationalInbox
        userScope
        subtitle="Bandeja unificada · WhatsApp"
        initialConversationId={conversationId}
      />
    </AppShell>
  );
}
