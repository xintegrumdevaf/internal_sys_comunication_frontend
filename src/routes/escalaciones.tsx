import { createFileRoute } from "@tanstack/react-router";
import { LifeBuoy } from "lucide-react";
import { AppShell } from "@/app/shell/AppShell";
import { EscalationsBoard } from "@/modules/escalations/ui/EscalationsBoard";

type EscalacionesSearch = {
  departmentId?: string;
};

export const Route = createFileRoute("/escalaciones")({
  validateSearch: (search: Record<string, unknown>): EscalacionesSearch => ({
    departmentId:
      typeof search.departmentId === "string" && search.departmentId.length > 0
        ? search.departmentId
        : undefined,
  }),
  component: EscalacionesPage,
});

function EscalacionesPage() {
  const { departmentId } = Route.useSearch();

  return (
    <AppShell title="Mesa de Triaje y Rescate SLA" icon={LifeBuoy}>
      <EscalationsBoard initialDepartmentId={departmentId} />
    </AppShell>
  );
}
