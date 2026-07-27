import { createFileRoute } from "@tanstack/react-router";
import { HardHat, MapPin, Calendar, Users } from "lucide-react";
import { AppShell, StatCard } from "../components/AppShell";

export const Route = createFileRoute("/utga")({
  component: UtgaPage,
});

const ordenes = [
  { id: "OT-4471", tipo: "Instalación nueva", direccion: "Cra 21 #45-12, Sector A", tecnico: "L. Muñoz", ventana: "Hoy 14:00–16:00", estado: "En ruta" },
  { id: "OT-4470", tipo: "Traslado de servicio", direccion: "Cll 9 #12-30, Sector C", tecnico: "P. Cárdenas", ventana: "Hoy 16:30–18:00", estado: "Programada" },
  { id: "OT-4468", tipo: "Reparación (visita)", direccion: "Cra 34 #7-88, Sector B", tecnico: "J. Ruiz", ventana: "Mañana 09:00", estado: "Confirmada" },
  { id: "OT-4465", tipo: "Instalación nueva", direccion: "Cll 44 #22-9, Sector D", tecnico: "—", ventana: "—", estado: "Viabilidad" },
];

const estadoTono: Record<string, string> = {
  "En ruta": "bg-info/10 text-info ring-info/30",
  "Programada": "bg-foreground/5 text-foreground ring-border",
  "Confirmada": "bg-primary/10 text-primary ring-primary/30",
  "Viabilidad": "bg-warning/10 text-warning ring-warning/30",
};

function UtgaPage() {
  return (
    <AppShell title="UTGA · Instalaciones y Traslados" icon={HardHat}>
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-up">
        <StatCard label="OT Hoy" value="38" hint="12 en ruta" />
        <StatCard label="Viabilidad OK" value="86" unit="%" hint="Cobertura confirmada" tone="success" />
        <StatCard label="Sin cobertura" value="04" hint="Requiere baja" tone="danger" />
        <StatCard label="Cuadrillas" value="09" hint="Activas en campo" tone="success" />
      </section>

      <section className="grid grid-cols-12 gap-6 animate-fade-up">
        <div className="col-span-12 lg:col-span-8 bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border flex justify-between items-center">
            <h3 className="text-xs font-extrabold uppercase tracking-widest">Órdenes de Trabajo</h3>
            <span className="text-[10px] font-mono text-muted-foreground">Ruta optimizada por IA</span>
          </div>
          <table className="w-full text-xs">
            <thead className="bg-background/60 text-[10px] uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2">OT</th>
                <th className="text-left px-4 py-2">Tipo</th>
                <th className="text-left px-4 py-2">Dirección</th>
                <th className="text-left px-4 py-2">Técnico</th>
                <th className="text-left px-4 py-2">Ventana</th>
                <th className="text-left px-4 py-2">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ordenes.map((o) => (
                <tr key={o.id} className="hover:bg-foreground/5 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold">{o.id}</td>
                  <td className="px-4 py-3">{o.tipo}</td>
                  <td className="px-4 py-3 text-muted-foreground">{o.direccion}</td>
                  <td className="px-4 py-3">{o.tecnico}</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">{o.ventana}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] ring-1 ${estadoTono[o.estado]}`}>{o.estado}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-xs font-extrabold uppercase tracking-widest mb-3 flex items-center gap-2">
              <MapPin className="size-3.5 text-primary" /> Validación de Viabilidad
            </h3>
            <div className="space-y-2 text-[11px] font-mono">
              <div className="flex justify-between"><span className="text-muted-foreground">Dirección</span><span>Cll 44 #22-9</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Sector</span><span>D-04</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Fibra más cercana</span><span className="text-primary font-bold">82m</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Puertos libres</span><span className="text-primary font-bold">14</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Resultado</span><span className="text-primary font-bold">VIABLE</span></div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-xs font-extrabold uppercase tracking-widest mb-3 flex items-center gap-2">
              <Calendar className="size-3.5 text-primary" /> Agenda del Día
            </h3>
            <div className="space-y-2 text-[11px]">
              <div className="flex items-center gap-2"><Users className="size-3.5 text-muted-foreground" /> 09 cuadrillas · 38 OT</div>
              <div className="text-muted-foreground">Próximo hueco disponible: <span className="font-mono font-bold text-foreground">16 Jul · 10:00</span></div>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
