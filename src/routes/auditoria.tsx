import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, Lock, KeyRound } from "lucide-react";
import { AppShell, StatCard } from "../components/AppShell";

export const Route = createFileRoute("/auditoria")({
  component: AuditoriaPage,
});

const logs = [
  { hora: "14:08:41", evento: "HANDOVER", actor: "IA→Humano", detalle: "Ticket #9921 escalado a agente Andrés G.", nivel: "info" },
  { hora: "14:07:12", evento: "PAY_VAL", actor: "OCR Engine", detalle: "Boucher #4521 aprobado — $85.000 (Bancolombia)", nivel: "info" },
  { hora: "14:05:22", evento: "PAY_REJECT", actor: "Validador Semántico", detalle: "Fecha de compromiso > día 25 · contrato 6741", nivel: "warn" },
  { hora: "14:02:03", evento: "AUTH_OK", actor: "JWT / TLS 1.3", detalle: "Sesión iniciada · Admin TI (Javier Díaz)", nivel: "info" },
  { hora: "13:58:47", evento: "INPUT_BLOCK", actor: "Sanitizer", detalle: "Intento de inyección SQL rechazado en /pago", nivel: "danger" },
  { hora: "13:55:00", evento: "ROLE_GRANT", actor: "Supabase RBAC", detalle: "Rol soporte_n2 asignado a operador#48", nivel: "info" },
  { hora: "13:47:19", evento: "ONU_ALERT", actor: "Poller OLT", detalle: "Potencia crítica -29.4 dBm — SN HG8245H-448", nivel: "danger" },
];

const nivelTono: Record<string, string> = {
  info: "text-info",
  warn: "text-warning",
  danger: "text-danger",
};

function AuditoriaPage() {
  return (
    <AppShell title="Auditoría & Logs · Seguridad" icon={ShieldCheck}>
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-up">
        <StatCard label="Eventos 24h" value="18,204" hint="Firmados TLS 1.3" />
        <StatCard label="Auth OK" value="99.8" unit="%" hint="JWT + RBAC" tone="success" />
        <StatCard label="Bloqueos" value="43" hint="Sanitizer server-side" tone="warning" />
        <StatCard label="Incidentes" value="00" hint="0 críticos" tone="success" />
      </section>

      <section className="grid grid-cols-12 gap-6 animate-fade-up">
        <div className="col-span-12 lg:col-span-8 bg-canvas rounded-xl border-2 border-canvas-border shadow-2xl overflow-hidden">
          <div className="p-4 border-b border-canvas-border bg-black/20 flex justify-between items-center">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-canvas-foreground">audit.log · en vivo</h3>
            <span className="text-[10px] font-mono text-white/50">tail -f · TLS 1.3</span>
          </div>
          <div className="divide-y divide-canvas-border font-mono text-[11px]">
            {logs.map((l) => (
              <div key={l.hora} className="flex items-start gap-4 px-4 py-2.5 hover:bg-white/5">
                <span className="text-white/40 shrink-0 w-20">{l.hora}</span>
                <span className={`font-bold uppercase shrink-0 w-24 ${nivelTono[l.nivel]}`}>{l.evento}</span>
                <span className="text-white/50 shrink-0 w-32">{l.actor}</span>
                <span className="text-canvas-foreground flex-1">{l.detalle}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-xs font-extrabold uppercase tracking-widest mb-3 flex items-center gap-2">
              <Lock className="size-3.5 text-primary" /> Cifrado
            </h3>
            <div className="space-y-2 text-[11px] font-mono">
              <div className="flex justify-between"><span className="text-muted-foreground">Canal</span><span className="text-primary font-bold">TLS 1.3</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">DB en reposo</span><span className="text-primary font-bold">AES-256</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Backups</span><span>Cifrados · 30d</span></div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-xs font-extrabold uppercase tracking-widest mb-3 flex items-center gap-2">
              <KeyRound className="size-3.5 text-primary" /> Roles Activos
            </h3>
            <div className="space-y-1.5 text-[11px]">
              {[
                ["admin_ti", 3],
                ["soporte_n1", 22],
                ["soporte_n2", 8],
                ["cartera", 6],
                ["utga_ops", 5],
                ["auditor", 2],
              ].map(([r, n]) => (
                <div key={r as string} className="flex justify-between py-1 border-b border-border/60">
                  <span className="font-mono">{r}</span>
                  <span className="font-bold">{n}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-danger/5 border border-danger/20 rounded-xl p-4">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-danger mb-2">Política PII</h3>
            <p className="text-[11px] text-muted-foreground leading-snug">
              Cédula y teléfono se enmascaran en pantalla. Logs guardan hash, no valores. Errores muestran mensajes genéricos al cliente.
            </p>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
