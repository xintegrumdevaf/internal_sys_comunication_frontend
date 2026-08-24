import { createFileRoute } from "@tanstack/react-router";
import { Building2 } from "lucide-react";
import { AppShell } from "@/app/shell/AppShell";
import { DepartmentsDirectoryPanel } from "@/modules/identity/ui/DepartmentsDirectoryPanel";

export const Route = createFileRoute("/departamentos")({
  component: DepartamentosPage,
});

function DepartamentosPage() {
  return (
    <AppShell title="Departamentos · Áreas" icon={Building2}>
      <div className="mb-4 p-3 rounded-lg border border-border bg-card text-[11px] text-muted-foreground animate-fade-up">
        Administración exclusiva de <span className="font-bold text-foreground">Admin</span>. Lista
        real de departamentos desde <code className="font-mono">isp-customer-service-api</code>. La
        modificación requiere que los endpoints de escritura estén implementados en el backend.
      </div>
      <DepartmentsDirectoryPanel />
    </AppShell>
  );
}
