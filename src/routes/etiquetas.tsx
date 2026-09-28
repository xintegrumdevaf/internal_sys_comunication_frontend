import { createFileRoute } from "@tanstack/react-router";
import { Tag } from "lucide-react";
import { AppShell } from "@/app/shell/AppShell";
import { TagsManagementView } from "@/modules/tags/ui/TagsManagementView";

export const Route = createFileRoute("/etiquetas")({
  component: EtiquetasPage,
});

function EtiquetasPage() {
  return (
    <AppShell title="Etiquetas" icon={Tag}>
      <TagsManagementView />
    </AppShell>
  );
}
