import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "@/modules/settings/pages/SettingsPage";

export const Route = createFileRoute("/configuracion")({
  component: ConfiguracionRoute,
});

function ConfiguracionRoute() {
  return <SettingsPage />;
}
