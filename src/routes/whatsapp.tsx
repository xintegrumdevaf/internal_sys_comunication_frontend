import { createFileRoute, redirect } from "@tanstack/react-router";

/** WhatsApp quedó unificado en la Bandeja; se mantiene la ruta por compatibilidad. */
export const Route = createFileRoute("/whatsapp")({
  beforeLoad: () => {
    throw redirect({ to: "/bandeja" });
  },
});
