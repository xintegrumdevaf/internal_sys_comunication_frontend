import { createFileRoute } from "@tanstack/react-router";
import { Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell, StatCard } from "../components/AppShell";
import { OperationalInbox } from "../components/OperationalInbox";
import { useSession } from "../lib/auth";
import { getDepartmentBoardFn } from "@/adapters/http/server-fns";
import type { PaymentCase } from "@/adapters/persistence/memory/seed-operations";

export const Route = createFileRoute("/cartera")({
  component: CarteraPage,
});

const toneMap: Record<string, string> = {
  VALIDADO: "bg-primary/10 text-primary ring-primary/30",
  "OCR PENDIENTE": "bg-warning/10 text-warning ring-warning/30",
  RECHAZADO: "bg-danger/10 text-danger ring-danger/30",
};

const fmt = (n: number) =>
  n.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

function CarteraPage() {
  const session = useSession();
  const [payments, setPayments] = useState<PaymentCase[]>([]);
  const [convCount, setConvCount] = useState(0);

  useEffect(() => {
    if (!session) return;
    void getDepartmentBoardFn({
      data: { departmentSlug: "cartera", userId: session.id },
    }).then((board) => {
      setPayments(board.payments);
      setConvCount(board.conversations.length);
    });
  }, [session]);

  const validated = payments.filter((p) => p.estado === "VALIDADO");
  const pending = payments.filter((p) => p.estado === "OCR PENDIENTE");
  const total = payments.reduce((acc, p) => acc + (p.estado === "VALIDADO" ? p.monto : 0), 0);

  return (
    <AppShell title="Cartera y Cobros" icon={Wallet}>
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-up">
        <StatCard label="Recaudo mock" value={fmt(total)} hint="Validados seed" tone="success" />
        <StatCard label="Vouchers" value={String(payments.length)} hint="Casos en cola" />
        <StatCard
          label="Pendientes OCR"
          value={String(pending.length)}
          hint="Requieren humano"
          tone="warning"
        />
        <StatCard
          label="Chats cartera"
          value={String(convCount)}
          hint={`${validated.length} validados`}
          tone="success"
        />
      </section>

      <section className="grid grid-cols-12 gap-6 animate-fade-up mb-8">
        <div className="col-span-12 bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border flex justify-between items-center">
            <h3 className="text-xs font-extrabold uppercase tracking-widest">
              Validación de Boucher
            </h3>
            <span className="text-[10px] font-mono text-muted-foreground">
              Perfil demo: Andrés Peña
            </span>
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
              {payments.map((p) => (
                <tr key={p.conversationId} className="hover:bg-foreground/5">
                  <td className="px-4 py-3 font-mono font-bold">{p.contrato}</td>
                  <td className="px-4 py-3">{p.cliente}</td>
                  <td className="px-4 py-3 text-right font-mono">{fmt(p.monto)}</td>
                  <td className="px-4 py-3">{p.metodo}</td>
                  <td className="px-4 py-3">{p.fecha}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded font-bold text-[10px] ring-1 ${toneMap[p.estado]}`}
                    >
                      {p.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <OperationalInbox departmentSlug="cartera" subtitle="Cola Cartera · filtrada" />
    </AppShell>
  );
}
