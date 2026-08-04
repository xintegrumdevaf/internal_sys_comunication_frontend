import { createFileRoute } from "@tanstack/react-router";
import { Inbox } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { OperationalInbox } from "../components/OperationalInbox";
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
    <AppShell title="Bandeja Unificada · Core Mock" icon={Inbox}>
      <div className="mb-4 p-3 rounded-lg border border-border bg-card text-[11px] text-muted-foreground animate-fade-up">
        Vista filtrada por membresías de{" "}
        <span className="font-bold text-foreground">{session?.name ?? "…"}</span> (
        {session?.roleLabel}). Admin TI ve todas las colas; el resto solo su departamento.
        Prueba <span className="font-bold text-foreground">Tomar Control</span> y{" "}
        <span className="font-bold text-foreground">Transferir</span>.
      </div>
      <OperationalInbox
        userScope
        subtitle="Inbox por rol · Core hexagonal"
        initialConversationId={conversationId}
      />
    </AppShell>
  );
}
