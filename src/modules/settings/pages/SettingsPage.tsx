import { Settings } from "lucide-react";
import { AppShell } from "@/app/shell/AppShell";
import { SettingsView } from "../ui/SettingsView";

export function SettingsPage() {
  return (
    <AppShell title="Configuración del Sistema" icon={Settings}>
      <div className="w-full">
        <SettingsView />
      </div>
    </AppShell>
  );
}
