import { createFileRoute } from "@tanstack/react-router";
import { GitBranch, Play, Pause } from "lucide-react";
import { AppShell, StatCard } from "../components/AppShell";

export const Route = createFileRoute("/flujos")({
  component: FlujosPage,
});

const flows = [
  { id: "isp-diag-001", nombre: "Soporte Nivel 1 — Diagnóstico ONU", ejec: "1,284", exito: 96.3, estado: "Activo" },
  { id: "isp-pay-014", nombre: "Cartera — Validación de Boucher", ejec: "312", exito: 94.6, estado: "Activo" },
  { id: "isp-utga-007", nombre: "UTGA — Viabilidad y Agenda", ejec: "148", exito: 91.2, estado: "Activo" },
  { id: "isp-camp-021", nombre: "Campañas — Recordatorio Pago", ejec: "4,820", exito: 98.2, estado: "Activo" },
  { id: "isp-onb-003", nombre: "Onboarding cliente nuevo", ejec: "42", exito: 88.7, estado: "Pausado" },
];

function FlujosPage() {
  return (
    <AppShell title="Flujos n8n · Orquestación IA" icon={GitBranch}>
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-up">
        <StatCard label="Flujos activos" value="12" hint="4 áreas" />
        <StatCard label="Ejec. 24h" value="6,918" hint="Sin errores críticos" tone="success" />
        <StatCard label="Éxito Global" value="95.4" unit="%" hint="SLA cumplido" tone="success" />
        <StatCard label="Reintentos" value="184" hint="Cola dead-letter" tone="warning" />
      </section>

      <section className="bg-card border border-border rounded-xl overflow-hidden animate-fade-up">
        <div className="p-4 border-b border-border flex justify-between items-center">
          <h3 className="text-xs font-extrabold uppercase tracking-widest">Catálogo de Flujos</h3>
          <button className="text-[10px] px-3 py-1.5 rounded bg-foreground text-background font-bold uppercase">+ Nuevo Flujo</button>
        </div>
        <table className="w-full text-xs">
          <thead className="bg-background/60 text-[10px] uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-2">ID</th>
              <th className="text-left px-4 py-2">Nombre</th>
              <th className="text-right px-4 py-2">Ejec / día</th>
              <th className="text-left px-4 py-2">Éxito</th>
              <th className="text-left px-4 py-2">Estado</th>
              <th className="text-right px-4 py-2"> </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {flows.map((f) => (
              <tr key={f.id} className="hover:bg-foreground/5 transition-colors">
                <td className="px-4 py-3 font-mono font-bold">{f.id}</td>
                <td className="px-4 py-3">{f.nombre}</td>
                <td className="px-4 py-3 text-right font-mono">{f.ejec}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-24 rounded-full bg-background border border-border overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${f.exito}%` }} />
                    </div>
                    <span className="font-mono font-bold">{f.exito}%</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded font-bold text-[10px] ring-1 ${f.estado === "Activo" ? "bg-primary/10 text-primary ring-primary/30" : "bg-foreground/5 text-muted-foreground ring-border"}`}>
                    {f.estado}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button className="text-muted-foreground hover:text-foreground">
                    {f.estado === "Activo" ? <Pause className="size-4" /> : <Play className="size-4" />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="bg-canvas rounded-xl relative overflow-hidden animate-fade-up border-2 border-canvas-border shadow-2xl p-6 text-canvas-foreground">
        <h3 className="text-xs font-extrabold uppercase tracking-widest mb-6">Vista previa: isp-diag-001</h3>
        <div className="flex items-center gap-4 flex-wrap">
          {["WhatsApp Router", "Intent Classifier", "Validar Contrato", "Lectura OLT", "Decisión Umbral", "Orden UTGA"].map((n, i) => (
            <div key={n} className="flex items-center gap-4">
              <div className={`w-40 p-3 rounded-lg text-center border shadow-lg ${i === 1 || i === 5 ? "bg-primary/10 border-primary/40 ring-1 ring-primary/30" : "bg-canvas-border/40 border-canvas-border"}`}>
                <span className={`text-[9px] uppercase block mb-1 font-bold tracking-widest ${i === 1 || i === 5 ? "text-primary" : "text-white/50"}`}>Nodo {i + 1}</span>
                <span className="text-[11px] font-medium">{n}</span>
              </div>
              {i < 5 && <div className="w-8 h-px bg-canvas-border" />}
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
