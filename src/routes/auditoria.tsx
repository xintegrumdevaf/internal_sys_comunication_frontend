import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, Lock, KeyRound } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell, StatCard } from "../components/AppShell";
import { listAuditEventsFn, listUsersFn } from "@/adapters/http/server-fns";
import type { AuditEventDto, UserDto } from "@/adapters/http/dto";
import { SEED_DEPARTMENTS } from "@/adapters/persistence/memory/seed";

export const Route = createFileRoute("/auditoria")({
  component: AuditoriaPage,
});

const actionTone: Record<string, string> = {
  AUTH_OK: "text-info",
  MESSAGE_RECEIVED: "text-info",
  CONVERSATION_OPENED: "text-primary",
  TRANSFER: "text-warning",
  TAKE_CONTROL: "text-warning",
  HANDOVER: "text-danger",
};

function AuditoriaPage() {
  const [logs, setLogs] = useState<AuditEventDto[]>([]);
  const [users, setUsers] = useState<UserDto[]>([]);

  useEffect(() => {
    void Promise.all([
      listAuditEventsFn({ data: { limit: 40 } }),
      listUsersFn(),
    ]).then(([a, u]) => {
      setLogs(a);
      setUsers(u);
    });
  }, []);

  const roleCounts = SEED_DEPARTMENTS.map((d) => ({
    slug: d.slug,
    name: d.name,
    n: users.filter((u) => u.memberships.some((m) => m.departmentId === d.id)).length,
  }));

  return (
    <AppShell title="Auditoría & Logs · Core" icon={ShieldCheck}>
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-up">
        <StatCard label="Eventos seed" value={String(logs.length)} hint="AuditLog Core" />
        <StatCard label="Usuarios" value={String(users.length)} hint="Identity module" tone="success" />
        <StatCard
          label="Transfers"
          value={String(logs.filter((l) => l.action === "TRANSFER").length)}
          hint="Entre departamentos"
          tone="warning"
        />
        <StatCard
          label="Take control"
          value={String(logs.filter((l) => l.action === "TAKE_CONTROL").length)}
          hint="Handover humano"
          tone="success"
        />
      </section>

      <section className="grid grid-cols-12 gap-6 animate-fade-up">
        <div className="col-span-12 lg:col-span-8 bg-canvas rounded-xl border-2 border-canvas-border shadow-2xl overflow-hidden">
          <div className="p-4 border-b border-canvas-border bg-black/20 flex justify-between items-center">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-canvas-foreground">
              audit.log · Core
            </h3>
            <span className="text-[10px] font-mono text-white/50">InMemoryAuditLog</span>
          </div>
          <div className="divide-y divide-canvas-border font-mono text-[11px] max-h-[520px] overflow-y-auto">
            {logs.map((l) => (
              <div key={l.id} className="flex items-start gap-4 px-4 py-2.5 hover:bg-white/5">
                <span className="text-white/40 shrink-0 w-24">
                  {new Date(l.createdAt).toLocaleTimeString("es-CO", { hour12: false })}
                </span>
                <span
                  className={`font-bold uppercase shrink-0 w-36 ${actionTone[l.action] ?? "text-white/70"}`}
                >
                  {l.action}
                </span>
                <span className="text-white/50 shrink-0 w-28 truncate">
                  {l.actorUserId ?? "system"}
                </span>
                <span className="text-canvas-foreground flex-1 truncate">
                  {l.resourceType}/{l.resourceId}
                  {l.metadata ? ` · ${JSON.stringify(l.metadata)}` : ""}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-xs font-extrabold uppercase tracking-widest mb-3 flex items-center gap-2">
              <Lock className="size-3.5 text-primary" /> Cifrado (mock)
            </h3>
            <div className="space-y-2 text-[11px] font-mono">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Canal</span>
                <span className="text-primary font-bold">TLS 1.3</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Persistencia</span>
                <span>In-memory demo</span>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-xs font-extrabold uppercase tracking-widest mb-3 flex items-center gap-2">
              <KeyRound className="size-3.5 text-primary" /> Membresías por depto
            </h3>
            <div className="space-y-1.5 text-[11px]">
              {roleCounts.map((r) => (
                <div key={r.slug} className="flex justify-between py-1 border-b border-border/60">
                  <span className="font-mono">{r.slug}</span>
                  <span className="font-bold">{r.n}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
