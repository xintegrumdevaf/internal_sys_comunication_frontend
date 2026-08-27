import { useNavigate } from "@tanstack/react-router";
import { AlertOctagon, ArrowRight, ShieldAlert } from "lucide-react";
import { StatCard } from "@/app/shell/AppShell";
import { CaseSummaryDialog } from "@/modules/cases/ui/CaseSummaryDialog";
import type { EscalationDto, EscalationStatus } from "@/modules/escalations/domain/escalation";
import {
  escalationPriorityLabel,
  escalationStatusLabel,
} from "@/modules/escalations/domain/escalation";
import { useEscalations } from "@/modules/escalations/application/use-escalations";
import { relativeTime } from "@/shared/datetime";
import { useDepartmentsQuery, useDirectoryUsers } from "@/modules/identity/application/use-session";

/**
 * Casos que el asistente no pudo resolver solo y necesitan un agente humano
 * (docs/spec/03_REALTIME_NOTIFICATIONS.md). "Sin clasificar" agrupa los que
 * ni siquiera se pudo determinar a qué área pertenecen.
 */
export function EscalationsBoard() {
  const navigate = useNavigate();
  const { data: departments = [] } = useDepartmentsQuery();
  const directory = useDirectoryUsers();
  const {
    session,
    departmentId,
    setDepartmentId,
    triage,
    setTriage,
    status,
    setStatus,
    escalations,
    loading,
    busy,
    summary,
    timeline,
    summaryFor,
    setSummaryFor,
    openSummary,
    claim,
  } = useEscalations();

  const isSupervisor = session?.role === "manager" || session?.role === "admin";
  const pending = escalations.filter((e) => e.status === "PENDING").length;
  const assigned = escalations.filter((e) => e.status === "ASSIGNED").length;

  const agentName = (agentId: string | null) =>
    agentId ? (directory.find((a) => a.id === agentId)?.name ?? "Agente") : "Sin asignar";

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Banner explicativo */}
      <div className="p-4 sm:p-5 rounded-xl border border-border bg-card text-xs sm:text-sm text-muted-foreground flex items-start gap-3 shadow-xs">
        <ShieldAlert className="size-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-foreground">Bandeja de Escalaciones</p>
          <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
            Casos que el asistente no pudo resolver automáticamente y quedaron esperando a un agente humano.
            {isSupervisor &&
              ' Los casos "sin clasificar" pertenecen a clientes cuya solicitud todavía no se pudo identificar a qué área pertenece — puedes revisarlos y asignarlos.'}
          </p>
        </div>
      </div>

      {/* Métricas */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total escalaciones" value={String(escalations.length)} />
        <StatCard label="Sin atender" value={String(pending)} tone="warning" hint="Requieren acción inmediata" />
        <StatCard label="Ya asignados" value={String(assigned)} tone="success" hint="En seguimiento activo" />
        <StatCard label="Modo actual" value={triage ? "Sin clasificar" : "Por área"} />
      </section>

      {/* Barra de Filtros */}
      <section className="p-3 sm:p-4 rounded-xl border border-border bg-card flex flex-wrap gap-3 items-center justify-between shadow-xs">
        <div className="flex flex-wrap gap-2.5 items-center w-full sm:w-auto">
          {!triage && (
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="text-xs px-3 py-2 border border-border rounded-lg bg-background font-medium outline-none focus:ring-2 focus:ring-primary/20 w-full sm:w-auto"
            >
              <option value="">Todas las áreas</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          )}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as EscalationStatus | "")}
            className="text-xs px-3 py-2 border border-border rounded-lg bg-background font-medium outline-none focus:ring-2 focus:ring-primary/20 w-full sm:w-auto"
          >
            <option value="">Cualquier estado</option>
            <option value="PENDING">Sin atender</option>
            <option value="ASSIGNED">Asignada</option>
            <option value="RESOLVED">Resuelta</option>
          </select>
        </div>

        {isSupervisor && (
          <button
            type="button"
            onClick={() => setTriage((v) => !v)}
            className={`inline-flex items-center justify-center gap-2 text-xs px-3.5 py-2 rounded-lg font-bold uppercase transition-colors w-full sm:w-auto ${
              triage
                ? "bg-danger text-danger-foreground shadow-xs hover:bg-danger/90"
                : "border border-border bg-background hover:bg-foreground/5"
            }`}
            title="Casos que no se pudieron clasificar en ninguna área"
          >
            <AlertOctagon className="size-4" />
            {triage ? "Viendo Sin clasificar" : "Ver sin clasificar"}
          </button>
        )}
      </section>

      {/* Tabla responsiva */}
      <section className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-background/80 border-b border-border text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
              <tr>
                <th className="px-4 sm:px-6 py-3">Motivo</th>
                <th className="px-4 sm:px-6 py-3">Prioridad</th>
                <th className="px-4 sm:px-6 py-3">Estado</th>
                <th className="px-4 sm:px-6 py-3">Agente asignado</th>
                <th className="px-4 sm:px-6 py-3">Antigüedad</th>
                <th className="px-4 sm:px-6 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {escalations.map((e) => {
                const priority = escalationPriorityLabel(e.priority);
                return (
                  <tr key={e.id} className="hover:bg-foreground/5 transition-colors">
                    <td className="px-4 sm:px-6 py-4 font-medium max-w-[240px] truncate">
                      {e.reason}
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full font-bold text-[10px] ring-1 ${priority.cls}`}
                      >
                        {priority.label}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 font-bold text-[10px]">
                      {escalationStatusLabel(e.status)}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-muted-foreground">
                      {agentName(e.assignedAgentId)}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-muted-foreground">
                      {relativeTime(e.createdAt)}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => void openSummary(e)}
                          className="text-[11px] px-2.5 py-1.5 rounded-lg border border-border font-bold uppercase hover:bg-foreground/5 transition-colors"
                        >
                          Ver resumen
                        </button>
                        {!e.assignedAgentId && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void claim(e)}
                            className="text-[11px] px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-bold uppercase disabled:opacity-40 hover:bg-primary/90 transition-colors shadow-xs"
                          >
                            Atenderlo yo
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loading && escalations.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-muted-foreground">
                    No hay casos esperando atención con los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Acceso rápido a mis conversaciones */}
      {escalations.some((e) => e.assignedAgentId === session?.id) && (
        <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between gap-4">
          <p className="text-xs sm:text-sm font-medium text-foreground">
            Tienes casos asignados listos para ser atendidos.
          </p>
          <button
            type="button"
            onClick={() => void navigate({ to: "/bandeja" })}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline shrink-0"
          >
            Ir a mis conversaciones <ArrowRight className="size-3.5" />
          </button>
        </div>
      )}

      <CaseSummaryDialog
        open={Boolean(summaryFor)}
        onOpenChange={(open) => !open && setSummaryFor(null)}
        summary={summary}
        timeline={timeline}
        departments={departments}
        onClaim={
          summaryFor && !summaryFor.assignedAgentId ? () => void claim(summaryFor) : undefined
        }
        claimDisabled={busy}
        claimLabel="Atender yo este caso"
      />
    </div>
  );
}
