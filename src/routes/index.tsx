import { createFileRoute } from "@tanstack/react-router";
import {
  LayoutDashboard,
  AlertTriangle,
  MessageSquare,
  Megaphone,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell, StatCard } from "../components/AppShell";
import { getDashboardFn } from "@/adapters/http/server-fns";
import { intentLabel, relativeTime } from "@/hooks/use-operational-inbox";
import type { AuditEventDto, ConversationDto, DepartmentDto, UserDto } from "@/adapters/http/dto";
import { useSession } from "../lib/auth";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

function Dashboard() {
  const session = useSession();
  const [data, setData] = useState<Awaited<ReturnType<typeof getDashboardFn>> | null>(null);

  useEffect(() => {
    if (!session?.id) return;
    void getDashboardFn({ data: { userId: session.id } }).then(setData);
  }, [session?.id]);
  const kpis = data?.kpis;
  const conversations = data?.conversations ?? [];
  const audit = data?.audit ?? [];
  const byDepartment = data?.byDepartment ?? [];
  const users = data?.users ?? [];

  return (
    <AppShell title="Dashboard Global · Mock Core" icon={LayoutDashboard}>
      <section className="animate-fade-up mb-2 p-3 rounded-lg border border-border bg-card text-[11px] text-muted-foreground">
        Datos vivos del Core hexagonal (seed in-memory). Cambia de perfil abajo a la izquierda
        para evaluar roles: TI, Soporte, Cartera, Traslados, Administración.
      </section>

      <section className="animate-fade-up">
        <div className="flex items-baseline justify-between mb-3">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
            Indicadores mock
          </h3>
          <span className="text-[10px] font-mono text-muted-foreground">Core seed</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <StatCard label="Conversaciones" value={String(kpis?.conversations ?? "—")} hint="Total seed" />
          <StatCard label="Abiertas" value={String(kpis?.open ?? "—")} hint="open + pending" tone="warning" />
          <StatCard label="% IA" value={String(kpis?.aiPercent ?? "—")} unit="%" hint="Handler AI" tone="success" />
          <StatCard label="Humanos" value={String(kpis?.human ?? "—")} hint="En control" />
          <StatCard label="Departamentos" value={String(kpis?.departments ?? "—")} />
          <StatCard label="Usuarios" value={String(kpis?.agents ?? "—")} tone="success" />
        </div>
      </section>

      <section className="grid grid-cols-12 gap-6 min-h-[520px]">
        <div className="col-span-12 lg:col-span-4 bg-card border border-border rounded-xl flex flex-col overflow-hidden animate-fade-up">
          <div className="p-4 border-b border-border bg-background/60 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <MessageSquare className="size-4 text-primary" />
              <h3 className="text-xs font-extrabold uppercase tracking-widest">Bandeja reciente</h3>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground">
              {users.length} agentes
            </span>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {conversations.map((c: ConversationDto) => {
              const tag = intentLabel(c.intent);
              return (
                <div key={c.id} className="p-4">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-bold">{c.customerName ?? c.waPhone}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {relativeTime(c.updatedAt)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{c.lastMessagePreview}</p>
                  <div className="mt-2 flex gap-1.5 flex-wrap">
                    <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded ${tag.cls}`}>
                      {tag.label}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded ${
                        c.handlerMode === "ai"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-purple-100 text-purple-700"
                      }`}
                    >
                      {c.handlerMode === "ai" ? "IA" : "Humano"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-5 bg-card border border-border rounded-xl p-4 animate-fade-up">
          <h3 className="text-xs font-extrabold uppercase tracking-widest mb-4 flex items-center gap-2">
            <Megaphone className="size-3.5 text-primary" /> Cola por departamento
          </h3>
          <div className="space-y-2">
            {byDepartment.map((d: DepartmentDto & { count: number }) => (
              <div
                key={d.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border bg-background/40"
              >
                <div>
                  <p className="text-xs font-bold">{d.name}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">{d.slug}</p>
                </div>
                <span className="text-lg font-extrabold font-mono">{d.count}</span>
              </div>
            ))}
          </div>

          <h3 className="text-xs font-extrabold uppercase tracking-widest mt-6 mb-3">
            Usuarios demo
          </h3>
          <div className="space-y-2">
            {users.map((u: UserDto) => (
              <div
                key={u.id}
                className="flex items-center gap-2 p-2 rounded border border-border text-[11px]"
              >
                <div className="size-7 rounded-full bg-primary/15 text-primary grid place-items-center text-[10px] font-bold">
                  {u.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold truncate">{u.name}</p>
                  <p className="text-muted-foreground truncate font-mono">{u.email}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-3 space-y-4 animate-fade-up">
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-xs font-extrabold uppercase tracking-widest mb-4 flex items-center gap-2">
              <AlertTriangle className="size-3.5 text-danger" /> Atención
            </h3>
            <p className="text-[11px] text-muted-foreground leading-snug mb-3">
              Usa la bandeja unificada para tomar control o transferir. Los cambios persisten en
              memoria del servidor hasta reiniciar.
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-xs font-extrabold uppercase tracking-widest mb-3 flex items-center gap-2">
              <ShieldCheck className="size-3.5 text-primary" /> Auditoría reciente
            </h3>
            <div className="space-y-1.5 text-[10px] font-mono">
              {audit.map((e: AuditEventDto) => (
                <div key={e.id} className="flex justify-between py-1 border-b border-border/60 gap-2">
                  <span className="text-muted-foreground truncate">{e.action}</span>
                  <span className="text-primary font-bold shrink-0">
                    {relativeTime(e.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
