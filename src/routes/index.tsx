import { createFileRoute } from "@tanstack/react-router";
import { LayoutDashboard } from "lucide-react";
import { AppShell } from "@/app/shell/AppShell";
import { DashboardOverview, type DashboardFilters } from "@/modules/dashboard/ui/DashboardOverview";
import type { FilterStatus } from "@/modules/dashboard/ui/AgentWorkloadMonitor";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): DashboardFilters => {
    const rawStatus = typeof search.agentStatus === "string" ? search.agentStatus : undefined;
    const validStatus: FilterStatus | undefined =
      rawStatus === "all" ||
      rawStatus === "onShift" ||
      rawStatus === "saturated" ||
      rawStatus === "available"
        ? (rawStatus as FilterStatus)
        : undefined;

    const rawOperational = search.deptOperational;
    const deptOperational =
      typeof rawOperational === "boolean"
        ? rawOperational
        : rawOperational === "true"
          ? true
          : rawOperational === "false"
            ? false
            : undefined;

    const rawPage = search.page;
    const page =
      typeof rawPage === "number" && rawPage > 0
        ? rawPage
        : typeof rawPage === "string" && !isNaN(Number(rawPage)) && Number(rawPage) > 0
          ? Number(rawPage)
          : undefined;

    const rawPageSize = search.pageSize;
    const pageSize =
      typeof rawPageSize === "number" && rawPageSize > 0
        ? rawPageSize
        : typeof rawPageSize === "string" && !isNaN(Number(rawPageSize)) && Number(rawPageSize) > 0
          ? Number(rawPageSize)
          : undefined;

    return {
      agentStatus: validStatus,
      agentSearch:
        typeof search.agentSearch === "string" && search.agentSearch.length > 0
          ? search.agentSearch
          : undefined,
      deptOperational,
      page,
      pageSize,
    };
  },
  component: Dashboard,
});

function Dashboard() {
  const search = Route.useSearch();

  return (
    <AppShell title="Dashboard" icon={LayoutDashboard}>
      <DashboardOverview initialFilters={search} />
    </AppShell>
  );
}
