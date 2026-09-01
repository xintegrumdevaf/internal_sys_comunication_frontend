import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard-gerencial")({
  component: DashboardGerencialRedirect,
});

function DashboardGerencialRedirect() {
  return <Navigate to="/analytics" replace />;
}
