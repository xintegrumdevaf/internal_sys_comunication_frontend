import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { AppShell } from "@/app/shell/AppShell";
import { AssignmentBoard } from "@/modules/assignment/ui/AssignmentBoard";

export const Route = createFileRoute("/asignaciones")({
  component: AsignacionesPage,
});

function AsignacionesPage() {
  return (
    <AppShell title="Gestión de Asignación" icon={Users}>
      <AssignmentBoard />
    </AppShell>
  );
}
