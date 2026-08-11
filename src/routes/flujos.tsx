import { createFileRoute } from "@tanstack/react-router";
import { GitBranch } from "lucide-react";
import { AppShell } from "@/app/shell/AppShell";
import { N8nWorkflowCatalog } from "@/modules/admin-n8n/ui/N8nWorkflowCatalog";

export const Route = createFileRoute("/flujos")({
  component: FlujosPage,
});

function FlujosPage() {
  return (
    <AppShell title="Flujos n8n · Catálogo de acciones" icon={GitBranch}>
      <N8nWorkflowCatalog />
    </AppShell>
  );
}
