import { createFileRoute } from "@tanstack/react-router";
import { CampaignsManagementView } from "@/modules/campaigns/ui/CampaignsManagementView";

export const Route = createFileRoute("/campanas")({
  component: CampanasPage,
});

function CampanasPage() {
  return <CampaignsManagementView />;
}

