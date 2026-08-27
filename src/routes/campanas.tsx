import { createFileRoute } from '@tanstack/react-router';
import { Megaphone } from 'lucide-react';
import { AppShell } from '@/app/shell/AppShell';
import { CampaignsManagementView } from '@/modules/campaigns/ui/CampaignsManagementView';

export const Route = createFileRoute('/campanas')({
  component: CampanasPage,
});

function CampanasPage() {
  return (
    <AppShell title="Campañas Masivas WhatsApp" icon={Megaphone}>
      <CampaignsManagementView />
    </AppShell>
  );
}
