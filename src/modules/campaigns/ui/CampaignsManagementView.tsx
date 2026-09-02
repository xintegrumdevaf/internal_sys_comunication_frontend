import React, { useState } from "react";
import { CampaignsCatalog } from "./CampaignsCatalog";
import { CampaignWizardDialog } from "./CampaignWizardDialog";
import { useCampaignsList } from "../application/use-campaigns";

export const CampaignsManagementView: React.FC = () => {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const { campaigns, isLoading, refetch } = useCampaignsList();

  return (
    <div className="flex-1 space-y-4">
      <CampaignsCatalog
        campaigns={campaigns}
        isLoading={isLoading}
        onNewCampaignClick={() => setIsWizardOpen(true)}
        onRefresh={refetch}
      />
      <CampaignWizardDialog
        open={isWizardOpen}
        onOpenChange={setIsWizardOpen}
        onCampaignCreated={refetch}
      />
    </div>
  );
};

export default CampaignsManagementView;
