import { createFileRoute } from "@tanstack/react-router";
import { Zap } from "lucide-react";
import { AppShell } from "@/app/shell/AppShell";
import { QuickRepliesManagementView } from "@/modules/quick-replies/ui/QuickRepliesManagementView";

export const Route = createFileRoute("/respuestas-rapidas")({
  component: RespuestasRapidasPage,
});

function RespuestasRapidasPage() {
  return (
    <AppShell title="Respuestas Rápidas (Atajos /)" icon={Zap}>
      <div className="mb-4 p-3 rounded-xl border border-border bg-card text-xs text-muted-foreground animate-fade-up flex items-center justify-between">
        <div>
          <span className="font-bold text-foreground">Respuestas Rápidas estilo Whaticket:</span>{" "}
          Atajos que los operadores activan escribiendo{" "}
          <code className="font-mono bg-muted px-1 py-0.5 rounded text-primary">/</code> en el chat.
          Los administradores pueden crear respuestas Globales y los managers para sus
          departamentos.
        </div>
      </div>
      <QuickRepliesManagementView />
    </AppShell>
  );
}
