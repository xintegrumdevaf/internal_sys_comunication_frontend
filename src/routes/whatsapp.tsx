import { createFileRoute } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "../components/AppShell";
import { WhatsAppChatShell } from "../components/whatsapp/WhatsAppChatShell";
import { WhatsAppCloudStatusPanel } from "../components/whatsapp/WhatsAppCloudStatusPanel";
import { getWhatsAppCloudStatusFn } from "@/adapters/http/server-fns";

export const Route = createFileRoute("/whatsapp")({
  component: WhatsAppPage,
});

function WhatsAppPage() {
  const [configured, setConfigured] = useState(false);

  useEffect(() => {
    void getWhatsAppCloudStatusFn().then((s) => setConfigured(s.configured));
  }, []);

  const link = {
    status: "linked" as const,
    pairingCode: "CLOUD-API",
    phoneNumber: configured ? "Cloud API" : "No configurado",
    displayName: "WhatsApp Business",
    linkedAt: new Date().toISOString(),
    deviceName: configured ? "Meta Graph API" : "Esperando .env",
  };

  return (
    <AppShell title="WhatsApp Cloud API" icon={MessageCircle}>
      <section className="mb-4 p-3 rounded-lg border border-border bg-card text-[11px] text-muted-foreground animate-fade-up">
        Integración <span className="font-bold text-foreground">oficial Meta WhatsApp Cloud API</span>.
        Los mensajes entrantes llegan a{" "}
        <code className="font-mono text-foreground">/api/webhooks/whatsapp</code> y se enrutan al
        Core. Las respuestas del agente se envían por Graph API cuando hay credenciales.
      </section>

      <div className="space-y-6">
        <WhatsAppCloudStatusPanel />
        <WhatsAppChatShell link={link} cloudMode />
      </div>
    </AppShell>
  );
}
