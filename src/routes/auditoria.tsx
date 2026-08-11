import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { AppShell } from "@/app/shell/AppShell";
import { AuditLogView } from "@/modules/audit/ui/AuditLogView";

export const Route = createFileRoute("/auditoria")({
  component: AuditoriaPage,
});

function AuditoriaPage() {
  return (
    <AppShell title="Auditoría & Logs" icon={ShieldCheck}>
      <AuditLogView />
    </AppShell>
  );
}
