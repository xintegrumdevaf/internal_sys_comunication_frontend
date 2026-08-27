import { createFileRoute } from "@tanstack/react-router";
import { LayoutTemplate } from "lucide-react";
import { AppShell } from "@/app/shell/AppShell";
import { MessageTemplatesCatalog } from "@/modules/message-templates/ui/MessageTemplatesCatalog";

export const Route = createFileRoute("/plantillas")({
  component: PlantillasPage,
});

function PlantillasPage() {
  return (
    <AppShell title="Plantillas de Mensajes WhatsApp (Meta)" icon={LayoutTemplate}>
      <MessageTemplatesCatalog />
    </AppShell>
  );
}
