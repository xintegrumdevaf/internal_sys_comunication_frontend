import { createFileRoute } from "@tanstack/react-router";
import { PromptsManagerPage } from "@/modules/prompts/ui/PromptsManagerPage";

export const Route = createFileRoute("/prompts")({
  component: PromptsRoute,
});

function PromptsRoute() {
  return <PromptsManagerPage />;
}
