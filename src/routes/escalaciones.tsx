import { createFileRoute } from "@tanstack/react-router";
import { ArrowRightLeft } from "lucide-react";
import { AppShell } from "@/app/shell/AppShell";
import { EscalationsBoard } from "@/modules/escalations/ui/EscalationsBoard";

export const Route = createFileRoute("/escalaciones")({
  component: EscalacionesPage,
});

function EscalacionesPage() {
  return (
    <AppShell title="Escalaciones" icon={ArrowRightLeft}>
      <EscalationsBoard />
    </AppShell>
  );
}
