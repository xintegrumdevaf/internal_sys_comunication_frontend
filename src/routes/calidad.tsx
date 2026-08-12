import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { AppShell } from "@/app/shell/AppShell";
import { QualityBoard } from "@/modules/quality/ui/QualityBoard";

type CalidadSearch = {
  reviewId?: string;
};

export const Route = createFileRoute("/calidad")({
  validateSearch: (search: Record<string, unknown>): CalidadSearch => ({
    reviewId:
      typeof search.reviewId === "string" && search.reviewId.length > 0
        ? search.reviewId
        : undefined,
  }),
  component: CalidadPage,
});

function CalidadPage() {
  const navigate = useNavigate();
  const { reviewId } = Route.useSearch();

  return (
    <AppShell title="Supervisión de calidad" icon={ShieldCheck}>
      <QualityBoard
        reviewId={reviewId}
        onSelectReview={(id) => {
          void navigate({ to: "/calidad", search: { reviewId: id } });
        }}
        onClearReview={() => {
          void navigate({ to: "/calidad", search: {} });
        }}
      />
    </AppShell>
  );
}
