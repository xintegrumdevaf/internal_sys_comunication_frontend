import { createFileRoute } from "@tanstack/react-router";
import { LayoutDashboard } from "lucide-react";
import { AppShell } from "@/app/shell/AppShell";
import { DashboardOverview } from "@/modules/dashboard/ui/DashboardOverview";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

function Dashboard() {
  return (
    <AppShell title="Dashboard" icon={LayoutDashboard}>
      <DashboardOverview />
    </AppShell>
  );
}
