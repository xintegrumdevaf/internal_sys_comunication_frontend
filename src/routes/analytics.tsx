import { createFileRoute } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";
import { AppShell } from "@/app/shell/AppShell";
import { AnalyticsDashboard } from "@/modules/analytics/ui/AnalyticsDashboard";
import { AgentAnalyticsView } from "@/modules/analytics/ui/AgentAnalyticsView";
import { useSession } from "@/modules/identity/application/use-session";

export const Route = createFileRoute("/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const session = useSession();
  const isManagerOrAdmin = session?.role === "admin" || session?.role === "manager";

  const title = isManagerOrAdmin
    ? "Analíticas Operativas y Gerenciales"
    : "Mi Rendimiento · Analítica Personal";

  return (
    <AppShell title={title} icon={BarChart3}>
      {isManagerOrAdmin ? <AnalyticsDashboard /> : <AgentAnalyticsView />}
    </AppShell>
  );
}
