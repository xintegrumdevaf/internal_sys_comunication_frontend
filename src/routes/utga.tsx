import { createFileRoute } from "@tanstack/react-router";
import { HardHat } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell, StatCard } from "../components/AppShell";
import { OperationalInbox } from "../components/OperationalInbox";
import { useSession } from "../lib/auth";
import { getDepartmentBoardFn } from "@/adapters/http/server-fns";
import type { WorkOrder } from "@/lib/ops-types";

export const Route = createFileRoute("/utga")({
  component: UtgaPage,
});

const estadoTono: Record<string, string> = {
  "En ruta": "bg-info/10 text-info ring-info/30",
  Programada: "bg-foreground/5 text-foreground ring-border",
  Confirmada: "bg-primary/10 text-primary ring-primary/30",
  Viabilidad: "bg-warning/10 text-warning ring-warning/30",
};

function UtgaPage() {
  const session = useSession();
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [convCount, setConvCount] = useState(0);

  useEffect(() => {
    if (!session) return;
    void getDepartmentBoardFn({
      data: { departmentSlug: "traslados", userId: session.id },
    }).then((board) => {
      setOrders(board.workOrders);
      setConvCount(board.conversations.length);
    });
  }, [session]);

  return (
    <AppShell title="UTGA · Instalaciones y Traslados" icon={HardHat}>
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-up">
        <StatCard label="OT mock" value={String(orders.length)} hint={`${convCount} chats`} />
        <StatCard
          label="En ruta"
          value={String(orders.filter((o) => o.estado === "En ruta").length)}
          hint="Campo"
          tone="success"
        />
        <StatCard
          label="Viabilidad"
          value={String(orders.filter((o) => o.estado === "Viabilidad").length)}
          hint="Cobertura"
          tone="warning"
        />
        <StatCard label="Perfil demo" value="MR" hint="María Restrepo" tone="success" />
      </section>

      <section className="grid grid-cols-12 gap-6 animate-fade-up mb-8">
        <div className="col-span-12 bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border flex justify-between items-center">
            <h3 className="text-xs font-extrabold uppercase tracking-widest">Órdenes de Trabajo</h3>
            <span className="text-[10px] font-mono text-muted-foreground">Vinculadas a chats</span>
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
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-foreground/5">
                  <td className="px-4 py-3 font-mono font-bold">{o.id}</td>
                  <td className="px-4 py-3">{o.tipo}</td>
                  <td className="px-4 py-3 text-muted-foreground">{o.direccion}</td>
                  <td className="px-4 py-3">{o.tecnico}</td>
                  <td className="px-4 py-3">{o.ventana}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded font-bold text-[10px] ring-1 ${estadoTono[o.estado] ?? ""}`}
                    >
                      {o.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <OperationalInbox departmentSlug="traslados" subtitle="Cola Traslados · filtrada" />
    </AppShell>
  );
}
