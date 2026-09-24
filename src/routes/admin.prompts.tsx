import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/prompts")({
  component: AdminPromptsRedirect,
});

function AdminPromptsRedirect() {
  return <Navigate to="/prompts" replace />;
}
