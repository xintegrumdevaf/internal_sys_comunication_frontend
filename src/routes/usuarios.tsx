import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { AppShell } from "@/app/shell/AppShell";
import { UsersDirectoryPanel } from "@/modules/identity/ui/UsersDirectoryPanel";

export const Route = createFileRoute("/usuarios")({
  component: UsuariosPage,
});

function UsuariosPage() {
  return (
    <AppShell title="Usuarios · Agentes" icon={Users}>
      <div className="mb-4 p-3 rounded-lg border border-border bg-card text-[11px] text-muted-foreground animate-fade-up">
        Administración exclusiva de <span className="font-bold text-foreground">Admin</span>.
        Lista real de agentes desde <code className="font-mono">isp-customer-service-api</code>.
        Crear/editar queda pendiente hasta que el backend lo soporte.
      </div>
      <UsersDirectoryPanel />
    </AppShell>
  );
}
