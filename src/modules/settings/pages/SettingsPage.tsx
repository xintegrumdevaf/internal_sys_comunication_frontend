import { Settings } from "lucide-react";
import { AppShell } from "@/app/shell/AppShell";
import { SettingsView } from "../ui/SettingsView";

export function SettingsPage() {
  return (
    <AppShell title="Configuración del Sistema" icon={Settings}>
      <div className="p-6 max-w-6xl mx-auto">
        <SettingsView />
      </div>
    </AppShell>
  );
}
