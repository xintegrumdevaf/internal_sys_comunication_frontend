import { createFileRoute } from "@tanstack/react-router";
import { Wrench, Activity } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell, StatCard } from "../components/AppShell";
import { OperationalInbox } from "../components/OperationalInbox";
import { useSession } from "../lib/auth";
import { getDepartmentBoardFn } from "@/adapters/http/server-fns";
import { intentLabel, relativeTime } from "@/hooks/use-operational-inbox";
import type { ConversationDto } from "@/adapters/http/dto";

export const Route = createFileRoute("/soporte")({
  component: SoportePage,
});

function SoportePage() {
  const session = useSession();
  const [rows, setRows] = useState<ConversationDto[]>([]);
  const [agents, setAgents] = useState(0);

  useEffect(() => {
    if (!session) return;
    void getDepartmentBoardFn({
      data: { departmentSlug: "soporte", userId: session.id },
    }).then((board) => {
      setRows(board.conversations);
      setAgents(board.users.length);
    });
  }, [session]);

  const open = rows.filter((r) => r.status !== "resolved" && r.status !== "closed");
  const critical = rows.filter((r) => r.intent === "dano" || r.intent === "infra").length;
  const ai = rows.filter((r) => r.handlerMode === "ai").length;

  return (
    <AppShell title="Soporte Técnico · Nivel 1-3" icon={Wrench}>
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-up">
        <StatCard label="Tickets Activos" value={String(open.length)} hint={`${critical} críticos`} />
        <StatCard
          label="Resueltos IA"
          value={rows.length ? String(Math.round((ai / rows.length) * 1000) / 10) : "0"}
          unit="%"
          hint="Sin intervención"
          tone="success"
        />
        <StatCard label="Agentes área" value={String(agents)} hint="Membresías seed" />
        <StatCard label="Cola mock" value={String(rows.length)} hint="Core hexagonal" tone="success" />
      </section>

      <section className="grid grid-cols-12 gap-6 animate-fade-up mb-8">
        <div className="col-span-12 lg:col-span-8 bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border flex justify-between items-center">
            <h3 className="text-xs font-extrabold uppercase tracking-widest">Cola de Tickets</h3>
            <span className="text-[10px] font-mono text-muted-foreground">Desde Core</span>
          </div>
          <table className="w-full text-xs">
            <thead className="bg-background/60 text-[10px] uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2">ID</th>
                <th className="text-left px-4 py-2">Cliente</th>
                <th className="text-left px-4 py-2">Motivo</th>
                <th className="text-left px-4 py-2">Modo</th>
                <th className="text-left px-4 py-2">Estado</th>
                <th className="text-left px-4 py-2">Act.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((t) => {
                const tag = intentLabel(t.intent);
                return (
                  <tr key={t.id} className="hover:bg-foreground/5 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold">{t.id.replace("conv_", "T-")}</td>
                    <td className="px-4 py-3">
                      {t.contractId ? `Contrato ${t.contractId}` : "—"} · {t.customerName ?? t.waPhone}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground truncate max-w-[220px]">
                      {t.lastMessagePreview}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${tag.cls}`}>
                        {tag.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 uppercase font-bold text-[10px]">{t.status}</td>
                    <td className="px-4 py-3 text-muted-foreground">{relativeTime(t.updatedAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-xs font-extrabold uppercase tracking-widest mb-3 flex items-center gap-2">
              <Activity className="size-3.5 text-primary" /> Cómo evaluar
            </h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Entra como <span className="font-bold text-foreground">Laura Mendoza</span> (Soporte).
              En la bandeja inferior verás solo chats de soporte. Transfiere a Traslados o Cartera
              y cambia de perfil para validar la cola destino.
            </p>
          </div>
        </div>
      </section>

      <OperationalInbox departmentSlug="soporte" subtitle="Cola Soporte · filtrada" />
    </AppShell>
  );
}
