import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/asignaciones")({
  component: () => <Navigate to="/" replace />,
});
