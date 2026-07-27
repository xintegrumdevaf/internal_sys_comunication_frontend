import { createFileRoute } from "@tanstack/react-router";
import { Megaphone, CheckCircle2 } from "lucide-react";
import { AppShell, StatCard } from "../components/AppShell";

export const Route = createFileRoute("/campanas")({
  component: CampanasPage,
});

const campaigns = [
  { nombre: "recordatorio_pago_v3", area: "Cartera", enviados: 4820, entregados: 4732, fallidos: 88, progreso: 98, estado: "En curso" },
  { nombre: "corte_programado_v2", area: "Soporte", enviados: 2140, entregados: 2098, fallidos: 42, progreso: 100, estado: "Completada" },
  { nombre: "confirmacion_visita_v4", area: "UTGA", enviados: 148, entregados: 141, fallidos: 7, progreso: 100, estado: "Completada" },
  { nombre: "encuesta_nps_v1", area: "Retención", enviados: 0, entregados: 0, fallidos: 0, progreso: 0, estado: "Meta aprobación" },
];

function CampanasPage() {
  return (
    <AppShell title="Campañas Masivas · Meta Templates" icon={Megaphone}>
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-up">
        <StatCard label="Enviados hoy" value="7,108" hint="4 campañas" />
        <StatCard label="Entregabilidad" value="98.2" unit="%" hint="Meta ≥ 95%" tone="success" />
        <StatCard label="Fallidos" value="137" hint="Reintentos automáticos" tone="warning" />
        <StatCard label="Opt-out" value="0.4" unit="%" hint="Bajo la norma" tone="success" />
      </section>

      <section className="grid grid-cols-12 gap-6 animate-fade-up">
        <div className="col-span-12 lg:col-span-8 space-y-4">
          {campaigns.map((c) => (
            <div key={c.nombre} className="bg-card border border-border rounded-xl p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-mono font-bold text-sm">{c.nombre}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">Área · {c.area}</p>
                </div>
                <span className={`px-2 py-0.5 rounded font-bold text-[10px] ring-1 ${
                  c.estado === "En curso" ? "bg-info/10 text-info ring-info/30"
                  : c.estado === "Completada" ? "bg-primary/10 text-primary ring-primary/30"
                  : "bg-warning/10 text-warning ring-warning/30"
                }`}>{c.estado}</span>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 bg-background border border-border h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-primary transition-all" style={{ width: `${c.progreso}%` }} />
                </div>
                <span className="text-xs font-bold font-mono">{c.progreso}%</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[10px] font-mono">
                <div className="p-2 bg-background rounded border border-border">
                  <p className="text-muted-foreground text-[9px] uppercase">Enviados</p>
                  <p className="font-bold">{c.enviados.toLocaleString()}</p>
                </div>
                <div className="p-2 bg-background rounded border border-border">
                  <p className="text-muted-foreground text-[9px] uppercase">Entregados</p>
                  <p className="font-bold text-primary">{c.entregados.toLocaleString()}</p>
                </div>
                <div className="p-2 bg-background rounded border border-border">
                  <p className="text-muted-foreground text-[9px] uppercase">Fallidos</p>
                  <p className="font-bold text-danger">{c.fallidos.toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-xs font-extrabold uppercase tracking-widest mb-3">Plantillas Meta</h3>
            <div className="space-y-2 text-[11px]">
              {["recordatorio_pago_v3", "corte_programado_v2", "confirmacion_visita_v4", "encuesta_nps_v1"].map((t, i) => (
                <div key={t} className="flex items-center justify-between p-2 rounded border border-border">
                  <span className="font-mono">{t}</span>
                  <span className={`text-[9px] font-bold uppercase flex items-center gap-1 ${i === 3 ? "text-warning" : "text-primary"}`}>
                    {i === 3 ? "PENDIENTE" : <><CheckCircle2 className="size-3" /> APROBADA</>}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-primary mb-2">Segmentación</h3>
            <p className="text-[11px] text-muted-foreground leading-snug">
              Motor de audiencia por contrato, mora, sector y estado técnico. Última segmentación: <span className="font-bold text-foreground font-mono">4,908 contactos</span>.
            </p>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
