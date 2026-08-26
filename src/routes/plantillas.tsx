import { createFileRoute } from "@tanstack/react-router";
import { CampaignsManagementView } from "@/modules/campaigns/ui/CampaignsManagementView";

export const Route = createFileRoute("/plantillas")({
  component: PlantillasPage,
});

function PlantillasPage() {
  return <CampaignsManagementView />;
}
