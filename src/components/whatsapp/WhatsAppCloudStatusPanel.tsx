import { useEffect, useState } from "react";
import { CheckCircle2, Copy, Link2, ShieldAlert } from "lucide-react";
import { getWhatsAppCloudStatusFn } from "@/adapters/http/server-fns";
import { toast } from "sonner";

type Status = Awaited<ReturnType<typeof getWhatsAppCloudStatusFn>>;

export function WhatsAppCloudStatusPanel() {
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    void getWhatsAppCloudStatusFn().then(setStatus);
  }, []);

  const webhookUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${status?.webhookPath ?? "/api/webhooks/whatsapp"}`
      : status?.webhookPath ?? "/api/webhooks/whatsapp";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      toast.success("Webhook URL copiada");
    } catch {
      toast.error("No se pudo copiar");
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4 animate-fade-up">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xs font-extrabold uppercase tracking-widest flex items-center gap-2">
            <Link2 className="size-3.5 text-primary" />
            WhatsApp Cloud API
          </h3>
          <p className="text-[11px] text-muted-foreground mt-1">
            Conexión oficial Meta (sin QR de WhatsApp Web).
          </p>
        </div>
        {status?.configured ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase">
            <CheckCircle2 className="size-3.5" /> Configurado
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-warning/10 text-warning text-[10px] font-bold uppercase">
            <ShieldAlert className="size-3.5" /> Sin credenciales
          </span>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-3 text-[11px] font-mono">
        <div className="p-3 rounded-lg border border-border bg-background/50">
          <p className="text-muted-foreground text-[9px] uppercase mb-1">Phone Number ID</p>
          <p className="font-bold">{status?.phoneNumberId ?? "—"}</p>
        </div>
        <div className="p-3 rounded-lg border border-border bg-background/50">
          <p className="text-muted-foreground text-[9px] uppercase mb-1">Depto. default</p>
          <p className="font-bold">{status?.defaultDepartmentSlug ?? "soporte"}</p>
        </div>
        <div className="p-3 rounded-lg border border-border bg-background/50 md:col-span-2">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-muted-foreground text-[9px] uppercase">Webhook Meta</p>
            <button
              type="button"
              onClick={() => void copy()}
              className="inline-flex items-center gap-1 text-[10px] font-bold text-primary"
            >
              <Copy className="size-3" /> Copiar
            </button>
          </div>
          <p className="font-bold break-all">{webhookUrl}</p>
          <p className="text-muted-foreground mt-2 normal-case font-sans">
            En Meta → WhatsApp → Configuration → Callback URL. Verify token ={" "}
            <code className="font-mono">WHATSAPP_VERIFY_TOKEN</code>. Suscribe{" "}
            <code className="font-mono">messages</code>.
          </p>
        </div>
      </div>

      {!status?.configured && (
        <div className="text-[11px] text-muted-foreground leading-relaxed rounded-lg bg-warning/5 border border-warning/20 p-3">
          Copia <code className="font-mono">.env.example</code> a{" "}
          <code className="font-mono">.env</code> y completa{" "}
          <code className="font-mono">WHATSAPP_ACCESS_TOKEN</code>,{" "}
          <code className="font-mono">WHATSAPP_PHONE_NUMBER_ID</code> y{" "}
          <code className="font-mono">WHATSAPP_VERIFY_TOKEN</code>. Reinicia{" "}
          <code className="font-mono">npm run dev</code>. Para pruebas locales usa un túnel
          (ngrok / cloudflared) hacia tu puerto.
        </div>
      )}
    </div>
  );
}
