import { createFileRoute } from "@tanstack/react-router";
import { Wrench, Activity, Zap, AlertTriangle } from "lucide-react";
import { AppShell, StatCard } from "../components/AppShell";

export const Route = createFileRoute("/soporte")({
  component: SoportePage,
});

const tickets = [
  { id: "T-9921", cliente: "Contrato 4521 · María Peña", motivo: "ONU sin señal (-27.4 dBm)", nivel: "N2", estado: "Diagnóstico IA", tono: "warning" },
  { id: "T-9920", cliente: "Contrato 3187 · Luis Ramírez", motivo: "Velocidad degradada intermitente", nivel: "N1", estado: "IA Activa", tono: "info" },
  { id: "T-9918", cliente: "Contrato 5502 · Ana Vargas", motivo: "Reinicio remoto solicitado", nivel: "N1", estado: "Resuelto", tono: "success" },
  { id: "T-9915", cliente: "Contrato 2210 · Jorge Peláez", motivo: "Cable dañado — visita técnica", nivel: "N3", estado: "UTGA asignada", tono: "danger" },
  { id: "T-9914", cliente: "Contrato 6741 · Sofía Ortiz", motivo: "Wi-Fi débil, requiere repetidor", nivel: "N2", estado: "En cola", tono: "muted" },
];

const toneMap: Record<string, string> = {
  warning: "bg-warning/10 text-warning ring-warning/30",
  info: "bg-blue-100 text-blue-700 ring-blue-200",
  success: "bg-primary/10 text-primary ring-primary/30",
  danger: "bg-danger/10 text-danger ring-danger/30",
  muted: "bg-foreground/5 text-muted-foreground ring-border",
};

function SoportePage() {
  return (
    <AppShell title="Soporte Técnico · Nivel 1-3" icon={Wrench}>
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-up">
        <StatCard label="Tickets Activos" value="24" hint="7 críticos" />
        <StatCard label="Resueltos IA" value="81.2" unit="%" hint="Sin intervención" tone="success" />
        <StatCard label="ONU en Alerta" value="09" hint="Potencia < -25 dBm" tone="danger" />
        <StatCard label="TMR Promedio" value="4.8" unit="min" hint="Meta: 6m" tone="success" />
      </section>

      <section className="grid grid-cols-12 gap-6 animate-fade-up">
        <div className="col-span-12 lg:col-span-8 bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border flex justify-between items-center">
            <h3 className="text-xs font-extrabold uppercase tracking-widest">Cola de Tickets</h3>
            <span className="text-[10px] font-mono text-muted-foreground">Actualizado hace 3s</span>
          </div>
          <table className="w-full text-xs">
            <thead className="bg-background/60 text-[10px] uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2">Ticket</th>
                <th className="text-left px-4 py-2">Cliente</th>
                <th className="text-left px-4 py-2">Motivo</th>
                <th className="text-left px-4 py-2">Nivel</th>
                <th className="text-left px-4 py-2">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tickets.map((t) => (
                <tr key={t.id} className="hover:bg-foreground/5 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold">{t.id}</td>
                  <td className="px-4 py-3">{t.cliente}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t.motivo}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-foreground/5 ring-1 ring-border">{t.nivel}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] ring-1 ${toneMap[t.tono]}`}>{t.estado}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-xs font-extrabold uppercase tracking-widest mb-3 flex items-center gap-2">
              <Activity className="size-3.5 text-primary" /> Diagnóstico Remoto
            </h3>
            <div className="space-y-2 text-[11px] font-mono">
              <div className="flex justify-between"><span className="text-muted-foreground">Ping OLT</span><span className="text-primary font-bold">OK · 12ms</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">SNMP Query</span><span className="text-primary font-bold">200</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Potencia RX</span><span className="text-danger font-bold">-27.4 dBm</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Uptime ONU</span><span className="text-warning font-bold">00:04:18</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">FEC Errors</span><span className="text-danger font-bold">1,204</span></div>
            </div>
            <button className="mt-4 w-full py-2 bg-primary text-primary-foreground text-[10px] font-bold uppercase rounded hover:bg-primary/90 transition-colors">
              <Zap className="inline size-3 mr-1" /> Ejecutar Reboot Remoto
            </button>
          </div>

          <div className="bg-danger/5 border border-danger/20 rounded-xl p-4">
            <h3 className="text-xs font-extrabold uppercase tracking-widest mb-2 text-danger flex items-center gap-2">
              <AlertTriangle className="size-3.5" /> Escalamiento N3
            </h3>
            <p className="text-[11px] text-muted-foreground leading-snug">
              3 casos requieren visita física. Se generó orden UTGA automática por umbral de potencia crítico.
            </p>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
