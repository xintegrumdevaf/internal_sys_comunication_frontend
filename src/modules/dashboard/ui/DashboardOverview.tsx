import { MessageSquare, ShieldCheck, Building2 } from "lucide-react";
import { useEffect, useState } from "react";
import { StatCard } from "@/app/shell/AppShell";
import { getDashboard } from "@/modules/dashboard/infrastructure/dashboard.gateway";
import { listConversations } from "@/modules/conversations/infrastructure/conversation.gateway";
import { listAuditEvents } from "@/modules/audit/infrastructure/audit.gateway";
import { relativeTime } from "@/shared/datetime";
import type { AuditEventDto } from "@/modules/audit/domain/audit-event";
import { auditActionLabel } from "@/modules/audit/domain/audit-event";
import { conversationDisplayName } from "@/modules/conversations/domain/conversation";
import type { ConversationDto } from "@/modules/conversations/domain/conversation";
import type { DashboardDto } from "@/modules/dashboard/domain/dashboard";
import { departmentVisibilityLabel } from "@/modules/identity/domain/department";
import { useDepartmentsQuery, useSession } from "@/modules/identity/application/use-session";

export function DashboardOverview() {
  const session = useSession();
  const { data: departments = [] } = useDepartmentsQuery();
  const [dashboard, setDashboard] = useState<DashboardDto | null>(null);
  const [conversations, setConversations] = useState<ConversationDto[]>([]);
  const [audit, setAudit] = useState<AuditEventDto[]>([]);

  useEffect(() => {
    if (!session?.id) return;
    void getDashboard(session.id).then(setDashboard);
    void listConversations({ status: "open" }).then(setConversations);
    void listAuditEvents(15).then(setAudit);
  }, [session?.id]);

  return (
    <>
      <section className="animate-fade-up mb-2 p-3 rounded-lg border border-border bg-card text-[11px] text-muted-foreground">
        Hola <span className="font-bold text-foreground">{session?.name}</span>, este es tu
        resumen del día como {session?.roleLabel?.toLowerCase()}. Todo lo que ves aquí se
        actualiza en tiempo real.
      </section>

      <section className="animate-fade-up">
        <div className="flex items-baseline justify-between mb-3">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
            Mis indicadores
          </h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Conversaciones abiertas"
            value={String(dashboard?.openConversations ?? "—")}
          />
          <StatCard
            label="Mis casos asignados"
            value={String(dashboard?.myAssignedCases ?? "—")}
            tone="success"
          />
          <StatCard
            label="Escalados pendientes"
            value={String(dashboard?.escalatedPending ?? "—")}
            tone="warning"
          />
          <StatCard label="Esperando cliente" value={String(dashboard?.waitingUser ?? "—")} />
        </div>
      </section>

      <section className="grid grid-cols-12 gap-6 min-h-[420px]">
        <div className="col-span-12 lg:col-span-5 bg-card border border-border rounded-xl flex flex-col overflow-hidden animate-fade-up">
          <div className="p-4 border-b border-border bg-background/60 flex items-center gap-2">
            <MessageSquare className="size-4 text-primary" />
            <h3 className="text-xs font-extrabold uppercase tracking-widest">
              Conversaciones abiertas
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {conversations.slice(0, 20).map((c) => (
              <div key={c.id} className="p-4">
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-bold">{conversationDisplayName(c)}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {relativeTime(c.lastActivityAt)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {c.lastMessagePreview?.body ?? "Sin mensajes"}
                </p>
              </div>
            ))}
            {conversations.length === 0 && (
              <p className="p-4 text-xs text-muted-foreground">Sin conversaciones abiertas.</p>
            )}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 bg-card border border-border rounded-xl p-4 animate-fade-up">
          <h3 className="text-xs font-extrabold uppercase tracking-widest mb-4 flex items-center gap-2">
            <Building2 className="size-3.5 text-primary" /> Departamentos
          </h3>
          <div className="space-y-2">
            {departments.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border bg-background/40"
              >
                <div>
                  <p className="text-xs font-bold">{d.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {departmentVisibilityLabel(d.visibility)}
                  </p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                    d.active ? "bg-primary/10 text-primary" : "bg-foreground/5 text-muted-foreground"
                  }`}
                >
                  {d.active ? "Activa" : "Inactiva"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-3 space-y-4 animate-fade-up">
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-xs font-extrabold uppercase tracking-widest mb-3 flex items-center gap-2">
              <ShieldCheck className="size-3.5 text-primary" /> Auditoría reciente
            </h3>
            <div className="space-y-1.5 text-[10px]">
              {audit.map((e) => (
                <div key={e.id} className="flex justify-between py-1 border-b border-border/60 gap-2">
                  <span className="text-muted-foreground truncate">{auditActionLabel(e.action)}</span>
                  <span className="text-primary font-bold shrink-0">
                    {relativeTime(e.createdAt)}
                  </span>
                </div>
              ))}
              {audit.length === 0 && <p className="text-muted-foreground">Sin eventos todavía.</p>}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
