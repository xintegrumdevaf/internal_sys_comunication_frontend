import { createFileRoute } from "@tanstack/react-router";
import { Megaphone } from "lucide-react";
import { AppShell } from "@/app/shell/AppShell";

export const Route = createFileRoute("/campanas")({
  component: CampanasPage,
});

function CampanasPage() {
  return (
    <AppShell title="Campañas Masivas" icon={Megaphone}>
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-card border border-border rounded-xl space-y-4 my-auto">
        <div className="size-16 rounded-2xl bg-primary/10 text-primary grid place-items-center">
          <Megaphone className="size-8" />
        </div>
        <div className="max-w-md space-y-1">
          <h3 className="text-base font-bold">Módulo de Campañas Masivas</h3>
          <p className="text-xs text-muted-foreground">
            Este módulo se encuentra desactivado temporalmente.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
