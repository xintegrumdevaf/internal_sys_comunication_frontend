import { MessageSquare, ShieldCheck, Building2, Sparkles } from "lucide-react";
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
    <div className="space-y-6 animate-fade-up">
      {/* Banner de Bienvenida */}
      <section className="p-4 sm:p-5 rounded-xl border border-border bg-card text-xs sm:text-sm text-muted-foreground flex items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-full bg-primary/10 text-primary grid place-items-center shrink-0">
            <Sparkles className="size-4" />
          </div>
          <div>
            <p className="font-semibold text-foreground">
              ¡Hola, {session?.name}!
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Este es tu resumen operativo del día como <span className="font-medium text-foreground">{session?.roleLabel}</span>. Datos actualizados en tiempo real.
            </p>
          </div>
        </div>
      </section>

      {/* Indicadores Principales */}
      <section className="space-y-3">
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
          Mis Indicadores
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Conversaciones abiertas"
            value={String(dashboard?.openConversations ?? "—")}
            hint="En atención activa"
          />
          <StatCard
            label="Mis casos asignados"
            value={String(dashboard?.myAssignedCases ?? "—")}
            tone="success"
            hint="Bajo tu responsabilidad"
          />
          <StatCard
            label="Escalados pendientes"
            value={String(dashboard?.escalatedPending ?? "—")}
            tone="warning"
            hint="Requieren atención humana"
          />
          <StatCard
            label="Esperando cliente"
            value={String(dashboard?.waitingUser ?? "—")}
            hint="Pendientes de respuesta"
          />
        </div>
      </section>

      {/* Paneles Informativos */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 min-h-[420px]">
        {/* Conversaciones Abiertas */}
        <div className="col-span-1 lg:col-span-5 bg-card border border-border rounded-xl flex flex-col overflow-hidden shadow-xs">
          <div className="p-4 sm:p-5 border-b border-border bg-background/60 flex items-center gap-2.5">
            <MessageSquare className="size-4 text-primary" />
            <h3 className="text-xs font-extrabold uppercase tracking-widest">
              Conversaciones Abiertas
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-border max-h-[380px]">
            {conversations.slice(0, 20).map((c) => (
              <div key={c.id} className="p-4 hover:bg-foreground/5 transition-colors">
                <div className="flex justify-between items-center mb-1 gap-2">
                  <span className="text-xs font-bold truncate">{conversationDisplayName(c)}</span>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {relativeTime(c.lastActivityAt)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {c.lastMessagePreview?.body ?? "Sin mensajes"}
                </p>
              </div>
            ))}
            {conversations.length === 0 && (
              <div className="p-8 text-center text-xs text-muted-foreground">
                Sin conversaciones abiertas en este momento.
              </div>
            )}
          </div>
        </div>

        {/* Departamentos */}
        <div className="col-span-1 lg:col-span-4 bg-card border border-border rounded-xl p-4 sm:p-5 shadow-xs flex flex-col">
          <h3 className="text-xs font-extrabold uppercase tracking-widest mb-4 flex items-center gap-2.5">
            <Building2 className="size-4 text-primary" /> Departamentos
          </h3>
          <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[380px]">
            {departments.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-background/50 hover:bg-background transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">{d.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {departmentVisibilityLabel(d.visibility)}
                  </p>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${
                    d.active
                      ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                      : "bg-foreground/5 text-muted-foreground ring-1 ring-border"
                  }`}
                >
                  {d.active ? "Activa" : "Inactiva"}
                </span>
              </div>
            ))}
            {departments.length === 0 && (
              <p className="p-4 text-xs text-center text-muted-foreground">No hay departamentos cargados.</p>
            )}
          </div>
        </div>

        {/* Auditoría Reciente */}
        <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-card border border-border rounded-xl p-4 sm:p-5 shadow-xs flex flex-col">
          <h3 className="text-xs font-extrabold uppercase tracking-widest mb-4 flex items-center gap-2.5">
            <ShieldCheck className="size-4 text-primary" /> Auditoría Reciente
          </h3>
          <div className="space-y-2 text-xs flex-1 overflow-y-auto max-h-[380px]">
            {audit.map((e) => (
              <div
                key={e.id}
                className="flex justify-between items-center py-1.5 border-b border-border/60 gap-2 last:border-0"
              >
                <span className="text-muted-foreground truncate text-[11px]">
                  {auditActionLabel(e.action)}
                </span>
                <span className="text-primary font-bold text-[10px] shrink-0">
                  {relativeTime(e.occurredAt || e.createdAt || new Date().toISOString())}
                </span>
              </div>
            ))}
            {audit.length === 0 && <p className="text-xs text-muted-foreground">Sin eventos registrados.</p>}
          </div>
        </div>
      </section>
    </div>
  );
}
