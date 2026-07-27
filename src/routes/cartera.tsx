import { createFileRoute } from "@tanstack/react-router";
import { Wallet, CheckCircle2, XCircle, Clock } from "lucide-react";
import { AppShell, StatCard } from "../components/AppShell";

export const Route = createFileRoute("/cartera")({
  component: CarteraPage,
});

const pagos = [
  { contrato: "4521", cliente: "María Peña", monto: 85000, fecha: "14 Jul 2026", metodo: "Bancolombia", estado: "VALIDADO", tono: "success" },
  { contrato: "3187", cliente: "Luis Ramírez", monto: 62000, fecha: "14 Jul 2026", metodo: "Nequi", estado: "OCR PENDIENTE", tono: "warning" },
  { contrato: "5502", cliente: "Ana Vargas", monto: 120000, fecha: "13 Jul 2026", metodo: "Daviplata", estado: "VALIDADO", tono: "success" },
  { contrato: "6741", cliente: "Sofía Ortiz", monto: 45000, fecha: "13 Jul 2026", metodo: "PSE", estado: "RECHAZADO", tono: "danger" },
  { contrato: "2210", cliente: "Jorge Peláez", monto: 98000, fecha: "12 Jul 2026", metodo: "Bancolombia", estado: "VALIDADO", tono: "success" },
];

const toneMap: Record<string, string> = {
  success: "bg-primary/10 text-primary ring-primary/30",
  warning: "bg-warning/10 text-warning ring-warning/30",
  danger: "bg-danger/10 text-danger ring-danger/30",
};

const fmt = (n: number) => n.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

function CarteraPage() {
  return (
    <AppShell title="Cartera y Cobros" icon={Wallet}>
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-up">
        <StatCard label="Recaudo Hoy" value="$4.2M" hint="+18% vs ayer" tone="success" />
        <StatCard label="Vouchers OCR" value="312" hint="Procesados hoy" />
        <StatCard label="Tasa Validación" value="94.6" unit="%" hint="Auto-aprobados" tone="success" />
        <StatCard label="Vencidos" value="187" hint="Contratos en mora" tone="danger" />
      </section>

      <section className="grid grid-cols-12 gap-6 animate-fade-up">
        <div className="col-span-12 lg:col-span-8 bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border flex justify-between items-center">
            <h3 className="text-xs font-extrabold uppercase tracking-widest">Validación de Boucher</h3>
            <span className="text-[10px] font-mono text-muted-foreground">OCR + Regex bancario</span>
          </div>
          <table className="w-full text-xs">
            <thead className="bg-background/60 text-[10px] uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2">Contrato</th>
                <th className="text-left px-4 py-2">Cliente</th>
                <th className="text-right px-4 py-2">Monto</th>
                <th className="text-left px-4 py-2">Método</th>
                <th className="text-left px-4 py-2">Fecha</th>
                <th className="text-left px-4 py-2">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pagos.map((p) => (
                <tr key={p.contrato} className="hover:bg-foreground/5 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold">#{p.contrato}</td>
                  <td className="px-4 py-3">{p.cliente}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold">{fmt(p.monto)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.metodo}</td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-[11px]">{p.fecha}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] ring-1 ${toneMap[p.tono]}`}>{p.estado}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-xs font-extrabold uppercase tracking-widest mb-3">Regla Semántica</h3>
            <p className="text-[11px] text-muted-foreground leading-snug mb-3">
              Monto dentro del rango esperado; fecha de compromiso ≤ día <span className="font-bold text-foreground">25</span> del mes.
            </p>
            <div className="space-y-2 text-[11px]">
              <div className="flex items-center gap-2 text-primary"><CheckCircle2 className="size-4" /> Monto validado</div>
              <div className="flex items-center gap-2 text-primary"><CheckCircle2 className="size-4" /> Fecha en rango</div>
              <div className="flex items-center gap-2 text-warning"><Clock className="size-4" /> OCR pendiente (2)</div>
              <div className="flex items-center gap-2 text-danger"><XCircle className="size-4" /> Rechazados (1)</div>
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
            <h3 className="text-xs font-extrabold uppercase tracking-widest mb-2 text-primary">Acuerdo de Pago</h3>
            <p className="text-[11px] text-muted-foreground leading-snug">
              El agente IA de Cartera generó <span className="font-bold text-foreground">42 acuerdos</span> hoy dentro del día 25 de cierre.
            </p>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
