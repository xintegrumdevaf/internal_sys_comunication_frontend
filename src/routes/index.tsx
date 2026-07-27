import { createFileRoute } from "@tanstack/react-router";
import {
  LayoutDashboard,
  AlertTriangle,
  MessageSquare,
  Megaphone,
  ShieldCheck,
} from "lucide-react";
import { AppShell, StatCard } from "../components/AppShell";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

const kpis = [
  { label: "Conversaciones", value: "1,248", hint: "+12% vs ayer", tone: "success" as const },
  { label: "T. Respuesta", value: "42", unit: "seg", hint: "Óptimo", tone: "success" as const },
  { label: "Handover IA", value: "18.4", unit: "%", hint: "Transición humana" },
  { label: "Pagos Hoy", value: "$4.2M", hint: "Validados", tone: "success" as const },
  { label: "Tickets", value: "24", hint: "Pendientes" },
  { label: "Alertas ONU", value: "09", hint: "< -25 dBm", tone: "danger" as const },
  { label: "Campaña", value: "98.2", unit: "%", hint: "Entregado", tone: "success" as const },
];

const conversations = [
  {
    who: "+57 301 445 8890",
    preview: '"No tengo internet, la luz de la ONU parpadea..."',
    time: "2m",
    tags: [
      { label: "Daño", cls: "bg-red-100 text-red-700" },
      { label: "IA Activa", cls: "bg-blue-100 text-blue-700" },
    ],
    active: true,
  },
  {
    who: "Carlos Ruiz",
    preview: "Envío comprobante de pago del mes...",
    time: "10m",
    tags: [
      { label: "Pago", cls: "bg-green-100 text-green-700" },
      { label: "Humano", cls: "bg-purple-100 text-purple-700" },
    ],
  },
  {
    who: "+57 322 890 1122",
    preview: "Quiero saber si hay cobertura en Sector B...",
    time: "15m",
    tags: [{ label: "Instalación", cls: "bg-amber-100 text-amber-700" }],
  },
  {
    who: "María Peña",
    preview: "Adjunto boucher de $85.000 — Contrato 4521",
    time: "22m",
    tags: [
      { label: "Pago", cls: "bg-green-100 text-green-700" },
      { label: "IA Activa", cls: "bg-blue-100 text-blue-700" },
    ],
  },
  {
    who: "+57 318 220 4410",
    preview: "Necesito traslado de mi servicio a nueva dirección",
    time: "34m",
    tags: [{ label: "Traslado", cls: "bg-amber-100 text-amber-700" }],
  },
];

function Dashboard() {
  return (
    <AppShell title="Dashboard Global" icon={LayoutDashboard}>
      <section className="animate-fade-up">
        <div className="flex items-baseline justify-between mb-3">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
            Indicadores en Tiempo Real
          </h3>
          <span className="text-[10px] font-mono text-muted-foreground">Actualizado hace 8s</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {kpis.map((k) => (
            <StatCard key={k.label} {...k} />
          ))}
        </div>
      </section>

      <section className="grid grid-cols-12 gap-6 min-h-[640px]">
        <div className="col-span-12 lg:col-span-4 bg-card border border-border rounded-xl flex flex-col overflow-hidden animate-fade-up">
          <div className="p-4 border-b border-border bg-background/60 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <MessageSquare className="size-4 text-primary" />
              <h3 className="text-xs font-extrabold uppercase tracking-widest">Bandeja Unificada</h3>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground">14 agentes</span>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {conversations.map((c) => (
              <button
                key={c.who}
                className={`w-full text-left p-4 transition-colors ${
                  c.active
                    ? "bg-primary/5 border-l-4 border-primary"
                    : "hover:bg-foreground/5 border-l-4 border-transparent"
                }`}
              >
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-bold">{c.who}</span>
                  <span className="text-[10px] text-muted-foreground">{c.time}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{c.preview}</p>
                <div className="mt-2 flex gap-1.5 flex-wrap">
                  {c.tags.map((t) => (
                    <span
                      key={t.label}
                      className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded ${t.cls}`}
                    >
                      {t.label}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-5 bg-canvas rounded-xl relative overflow-hidden animate-fade-up border-2 border-canvas-border shadow-2xl">
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle, hsl(210 20% 95% / 0.4) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />
          <div className="relative p-6 flex flex-col h-full text-canvas-foreground">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-widest">
                  Flow: Soporte Nivel 1 — Diagnóstico ONU
                </h3>
                <p className="text-[10px] text-white/40 font-mono mt-1">
                  ID: isp-diag-001 · n8n · ejecución en vivo
                </p>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-primary/15 ring-1 ring-primary/30">
                <div className="size-2 rounded-full bg-primary animate-pulse shadow-[0_0_12px_hsl(142_70%_45%)]" />
                <span className="text-[9px] font-bold text-primary uppercase">Ejecutando</span>
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-center items-center gap-10">
              <div className="flex items-center gap-4">
                <FlowNode label="WhatsApp Router" kind="Trigger" tone="neutral" />
                <Connector />
                <FlowNode label="Intent Classifier" kind="IA · GPT-4o mini" tone="primary" />
                <Connector />
                <FlowNode label="Validar Contrato" kind="Postgres" tone="neutral" />
              </div>

              <div className="h-6 w-px bg-canvas-border" />

              <div className="flex items-center gap-6">
                <div className="w-48 p-3 bg-canvas-border/40 border border-canvas-border rounded-lg text-left shadow-lg backdrop-blur">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="size-2 rounded-full bg-warning" />
                    <span className="text-[11px] font-medium">Lectura ONU (OLT)</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mb-2">
                    <div className="h-full bg-primary w-3/4" />
                  </div>
                  <div className="flex justify-between text-[9px] font-mono text-white/60">
                    <span>SN: HG8245H-992…</span>
                    <span className="text-danger font-bold">-27.4 dBm</span>
                  </div>
                </div>
                <Connector />
                <div className="w-48 p-3 bg-canvas-border/40 border border-canvas-border rounded-lg text-left shadow-lg backdrop-blur">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="size-2 rounded-full bg-danger" />
                    <span className="text-[11px] font-medium">Decisión: Umbral</span>
                  </div>
                  <p className="text-[9px] text-white/60 font-mono">
                    potencia &lt; -25 dBm → visita técnica
                  </p>
                </div>
                <Connector />
                <div className="w-48 p-3 bg-primary/15 border border-primary/40 rounded-lg text-left shadow-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="size-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-[11px] font-medium">Orden UTGA</span>
                  </div>
                  <p className="text-[9px] text-primary/90 font-mono">Ticket #9921 generado</p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-canvas-border grid grid-cols-3 gap-4 text-[10px] font-mono text-white/50">
              <div>
                <p className="text-white/40 uppercase tracking-widest text-[9px]">Ejec.</p>
                <p className="text-white font-bold">1,284 / día</p>
              </div>
              <div>
                <p className="text-white/40 uppercase tracking-widest text-[9px]">Éxito</p>
                <p className="text-primary font-bold">96.3%</p>
              </div>
              <div>
                <p className="text-white/40 uppercase tracking-widest text-[9px]">Handover</p>
                <p className="text-warning font-bold">3.7%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-3 space-y-4 animate-fade-up">
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-xs font-extrabold uppercase tracking-widest mb-4 flex items-center gap-2">
              <AlertTriangle className="size-3.5 text-danger" />
              Handover Pendiente
            </h3>
            <div className="space-y-3">
              <div className="p-3 bg-danger/5 rounded-md border border-danger/15">
                <div className="flex justify-between items-start mb-1">
                  <p className="text-xs font-bold">Frustración detectada</p>
                  <span className="text-[8px] bg-danger text-danger-foreground px-1.5 py-0.5 rounded font-bold">
                    ALTA
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-snug">
                  +57 310 · 3er día sin servicio, tono agresivo detectado por IA.
                </p>
                <button className="mt-3 w-full py-1.5 bg-danger text-danger-foreground text-[10px] font-bold uppercase rounded hover:bg-danger/90 transition-colors">
                  Tomar Control
                </button>
              </div>
              <div className="p-3 bg-background rounded-md border border-border">
                <div className="flex justify-between items-start mb-1">
                  <p className="text-xs font-bold">Diagnóstico inviable</p>
                  <span className="text-[8px] bg-warning text-white px-1.5 py-0.5 rounded font-bold">
                    MED
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-snug">
                  Potencia -29.4 dBm. Requiere validación física en terreno.
                </p>
                <button className="mt-3 w-full py-1.5 bg-card border border-border text-foreground text-[10px] font-bold uppercase rounded hover:bg-foreground/5 transition-colors">
                  Asignar a UTGA
                </button>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-xs font-extrabold uppercase tracking-widest mb-3 flex items-center gap-2">
              <Megaphone className="size-3.5 text-primary" />
              Campaña Masiva
            </h3>
            <p className="text-[10px] text-muted-foreground mb-2">
              Plantilla Meta:{" "}
              <span className="font-bold text-foreground font-mono">recordatorio_pago_v3</span>
            </p>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-1 bg-background border border-border h-2 rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[98%] transition-all duration-1000" />
              </div>
              <span className="text-[10px] font-bold font-mono">98%</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono mt-3">
              <div className="p-2 bg-background rounded border border-border">
                <p className="text-muted-foreground text-[9px] uppercase">Enviados</p>
                <p className="font-bold">4,820</p>
              </div>
              <div className="p-2 bg-background rounded border border-border">
                <p className="text-muted-foreground text-[9px] uppercase">Fallidos</p>
                <p className="font-bold text-danger">88</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-xs font-extrabold uppercase tracking-widest mb-3 flex items-center gap-2">
              <ShieldCheck className="size-3.5 text-primary" />
              Auditoría TLS 1.3
            </h3>
            <div className="space-y-1.5 text-[10px] font-mono">
              <div className="flex justify-between py-1 border-b border-border/60">
                <span className="text-muted-foreground">14:02 · AUTH_OK</span>
                <span className="text-primary font-bold">SECURE</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/60">
                <span className="text-muted-foreground">14:05 · PAY_VAL</span>
                <span className="text-warning font-bold">PENDING</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">14:08 · HANDOVER</span>
                <span className="text-info font-bold">HUMAN</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function FlowNode({
  label,
  kind,
  tone,
}: {
  label: string;
  kind: string;
  tone: "primary" | "neutral";
}) {
  return (
    <div
      className={`w-40 p-3 rounded-lg text-center shadow-lg border backdrop-blur ${
        tone === "primary"
          ? "bg-primary/10 border-primary/40 ring-1 ring-primary/30"
          : "bg-canvas-border/40 border-canvas-border"
      }`}
    >
      <span
        className={`text-[9px] uppercase block mb-1 font-bold tracking-widest ${
          tone === "primary" ? "text-primary" : "text-white/50"
        }`}
      >
        {kind}
      </span>
      <span className="text-[11px] font-medium">{label}</span>
    </div>
  );
}

function Connector() {
  return <div className="w-8 h-px bg-canvas-border" />;
}
