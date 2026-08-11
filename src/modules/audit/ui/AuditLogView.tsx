import { Lock, KeyRound } from "lucide-react";
import { useEffect, useState } from "react";
import { StatCard } from "@/app/shell/AppShell";
import { listAuditEvents } from "@/modules/audit/infrastructure/audit.gateway";
import type { AuditEventDto } from "@/modules/audit/domain/audit-event";
import { auditActionLabel } from "@/modules/audit/domain/audit-event";
import { useDepartmentsQuery, useDirectoryUsers } from "@/modules/identity/application/use-session";

const actionTone: Record<string, string> = {
  CASE_TRANSFERRED: "text-warning",
  CASE_REASSIGNED: "text-warning",
  CASE_ASSIGNED: "text-primary",
  CASE_CLAIMED: "text-primary",
  CASE_COMPLETED: "text-info",
  AUTOMATION_DISABLED: "text-warning",
  AUTOMATION_ENABLED: "text-info",
  CONVERSATION_REPLY: "text-info",
};

/**
 * Registro de auditoría — solo lo ve un administrador. Cada línea explica en
 * español qué pasó, quién lo hizo y cuándo (nunca el enum crudo del backend).
 */
export function AuditLogView() {
  const [logs, setLogs] = useState<AuditEventDto[]>([]);
  const users = useDirectoryUsers();
  const { data: departments = [] } = useDepartmentsQuery();

  useEffect(() => {
    void listAuditEvents(100).then(setLogs);
  }, []);

  const agentName = (userId?: string | null) =>
    userId ? (users.find((u) => u.id === userId)?.name ?? "Un agente") : "El sistema";

  const roleCounts = departments.map((d) => ({
    id: d.id,
    name: d.name,
    n: users.filter((u) => u.primaryDepartmentId === d.id).length,
  }));

  return (
    <>
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-up">
        <StatCard label="Eventos registrados" value={String(logs.length)} />
        <StatCard label="Agentes en el sistema" value={String(users.length)} tone="success" />
        <StatCard
          label="Casos transferidos"
          value={String(logs.filter((l) => l.action === "CASE_TRANSFERRED").length)}
          hint="Entre áreas"
          tone="warning"
        />
        <StatCard
          label="Casos reclamados"
          value={String(logs.filter((l) => l.action === "CASE_CLAIMED").length)}
          hint="Un agente tomó el caso"
          tone="success"
        />
      </section>

      <section className="grid grid-cols-12 gap-6 animate-fade-up">
        <div className="col-span-12 lg:col-span-8 bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border bg-background/60">
            <h3 className="text-xs font-extrabold uppercase tracking-widest">
              Historial de acciones
            </h3>
          </div>
          <div className="divide-y divide-border text-[12px] max-h-[520px] overflow-y-auto">
            {logs.map((l) => (
              <div key={l.id} className="flex items-start gap-4 px-4 py-2.5 hover:bg-foreground/5">
                <span className="text-muted-foreground shrink-0 w-16 tabular-nums">
                  {new Date(l.createdAt).toLocaleTimeString("es-CO", { hour12: false })}
                </span>
                <span
                  className={`font-semibold shrink-0 w-48 truncate ${actionTone[l.action] ?? "text-foreground"}`}
                >
                  {auditActionLabel(l.action)}
                </span>
                <span className="text-muted-foreground flex-1 truncate">
                  {agentName(l.actorUserId)}
                </span>
              </div>
            ))}
            {logs.length === 0 && (
              <p className="p-6 text-center text-muted-foreground">Sin eventos todavía.</p>
            )}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-xs font-extrabold uppercase tracking-widest mb-3 flex items-center gap-2">
              <Lock className="size-3.5 text-primary" /> Seguridad de la información
            </h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Toda la información viaja cifrada y cada acción importante (transferir, reclamar o
              resolver un caso) queda registrada de forma permanente con la fecha y el agente
              responsable.
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-xs font-extrabold uppercase tracking-widest mb-3 flex items-center gap-2">
              <KeyRound className="size-3.5 text-primary" /> Agentes por área
            </h3>
            <div className="space-y-1.5 text-[11px]">
              {roleCounts.map((r) => (
                <div key={r.id} className="flex justify-between py-1 border-b border-border/60">
                  <span>{r.name}</span>
                  <span className="font-bold">{r.n}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
