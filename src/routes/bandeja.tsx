import { createFileRoute } from "@tanstack/react-router";
import { Inbox } from "lucide-react";
import { AppShell } from "@/app/shell/AppShell";
import { OperationalInbox } from "@/modules/conversations/ui/OperationalInbox";
import { useDepartmentsQuery, useSession } from "@/modules/identity/application/use-session";

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
  const session = useSession();
  const { conversationId, departmentId } = Route.useSearch();
  const { data: departments = [] } = useDepartmentsQuery();
  const department = departments.find((d) => d.id === departmentId);

  return (
    <AppShell title="Bandeja Unificada" icon={Inbox}>
      <div className="mb-4 p-3 rounded-lg border border-border bg-card text-[11px] text-muted-foreground animate-fade-up">
        Canal único de comunicación (WhatsApp Cloud API vía isp-customer-service-api). Vista de{" "}
        <span className="font-bold text-foreground">{session?.name ?? "…"}</span> (
        {session?.roleLabel}){department ? ` · ${department.name}` : ""}. Cada mensaje muestra su
        hora; las notas internas del supervisor no las ve el cliente.
      </div>
      <OperationalInbox
        departmentId={departmentId}
        subtitle={department ? `Cola ${department.name}` : "Bandeja unificada"}
        initialConversationId={conversationId}
      />
    </AppShell>
  );
}
