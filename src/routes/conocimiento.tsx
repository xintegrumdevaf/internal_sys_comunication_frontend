import { createFileRoute } from "@tanstack/react-router";
import { KnowledgeBasePage } from "@/modules/knowledge-base/pages/KnowledgeBasePage";

export const Route = createFileRoute("/conocimiento")({
  component: ConocimientoRoute,
});

function ConocimientoRoute() {
  return <KnowledgeBasePage />;
}
