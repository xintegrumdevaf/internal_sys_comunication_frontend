import { createFileRoute } from "@tanstack/react-router";
import { Megaphone, CheckCircle2 } from "lucide-react";
import { AppShell, StatCard } from "../components/AppShell";
import { OperationalInbox } from "../components/OperationalInbox";

export const Route = createFileRoute("/campanas")({
  component: CampanasPage,
});

const campaigns = [
  {
    nombre: "recordatorio_pago_v3",
    area: "Cartera",
    enviados: 4820,
    entregados: 4732,
    fallidos: 88,
    progreso: 98,
    estado: "En curso",
  },
  {
    nombre: "corte_programado_v2",
    area: "Soporte",
    enviados: 2140,
    entregados: 2098,
    fallidos: 42,
    progreso: 100,
    estado: "Completada",
  },
  {
    nombre: "confirmacion_visita_v4",
    area: "UTGA",
    enviados: 148,
    entregados: 141,
    fallidos: 7,
    progreso: 100,
    estado: "Completada",
  },
  {
    nombre: "encuesta_nps_v1",
    area: "Administración",
    enviados: 0,
    entregados: 0,
    fallidos: 0,
    progreso: 0,
    estado: "Meta aprobación",
  },
];

function CampanasPage() {
  return (
    <AppShell title="Campañas Masivas · Administración" icon={Megaphone}>
      <section className="mb-4 p-3 rounded-lg border border-border bg-card text-[11px] text-muted-foreground animate-fade-up">
        Perfil demo de área: <span className="font-bold text-foreground">Camila Ortiz</span>{" "}
        (Administración). Las campañas siguen siendo mock de UI; la bandeja inferior sí lee el
        Core.
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-up">
        <StatCard label="Enviados hoy" value="7,108" hint="4 campañas" />
        <StatCard label="Entregabilidad" value="98.2" unit="%" hint="Meta ≥ 95%" tone="success" />
        <StatCard label="Fallidos" value="137" hint="Reintentos automáticos" tone="warning" />
        <StatCard label="Opt-out" value="0.4" unit="%" hint="Bajo la norma" tone="success" />
      </section>

      <section className="grid grid-cols-12 gap-6 animate-fade-up mb-8">
        <div className="col-span-12 lg:col-span-8 space-y-4">
          {campaigns.map((c) => (
            <div key={c.nombre} className="bg-card border border-border rounded-xl p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-mono font-bold text-sm">{c.nombre}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
                    Área · {c.area}
                  </p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded font-bold text-[10px] ring-1 ${
                    c.estado === "En curso"
                      ? "bg-info/10 text-info ring-info/30"
                      : c.estado === "Completada"
                        ? "bg-primary/10 text-primary ring-primary/30"
                        : "bg-warning/10 text-warning ring-warning/30"
                  }`}
                >
                  {c.estado}
                </span>
              </div>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex-1 bg-background border border-border h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${c.progreso}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold font-mono">{c.progreso}%</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[10px] font-mono mt-3">
                <div className="p-2 bg-background rounded border border-border">
                  <p className="text-muted-foreground text-[9px] uppercase">Enviados</p>
                  <p className="font-bold">{c.enviados.toLocaleString("es-CO")}</p>
                </div>
                <div className="p-2 bg-background rounded border border-border">
                  <p className="text-muted-foreground text-[9px] uppercase flex items-center gap-1">
                    <CheckCircle2 className="size-3 text-primary" /> Entregados
                  </p>
                  <p className="font-bold">{c.entregados.toLocaleString("es-CO")}</p>
                </div>
                <div className="p-2 bg-background rounded border border-border">
                  <p className="text-muted-foreground text-[9px] uppercase">Fallidos</p>
                  <p className="font-bold text-danger">{c.fallidos}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="col-span-12 lg:col-span-4">
          <div className="bg-card border border-border rounded-xl p-4 text-[11px] text-muted-foreground leading-relaxed">
            Al transferir un chat a{" "}
            <span className="font-bold text-foreground">administracion</span> desde otra área,
            aparecerá aquí en la bandeja del departamento.
          </div>
        </div>
      </section>

      <OperationalInbox departmentSlug="administracion" subtitle="Cola Administración" />
    </AppShell>
  );
}
