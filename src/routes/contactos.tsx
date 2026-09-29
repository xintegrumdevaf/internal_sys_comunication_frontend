import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { AppShell } from "@/app/shell/AppShell";
import { ContactsManagementView } from "@/modules/customers/ui/ContactsManagementView";

export const Route = createFileRoute("/contactos")({
  component: ContactosPage,
});

function ContactosPage() {
  return (
    <AppShell title="Contactos" icon={Users}>
      <ContactsManagementView />
    </AppShell>
  );
}
