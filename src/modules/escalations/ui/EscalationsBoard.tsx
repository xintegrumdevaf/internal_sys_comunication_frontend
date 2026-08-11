import { useNavigate } from "@tanstack/react-router";
import { AlertOctagon } from "lucide-react";
import { StatCard } from "@/app/shell/AppShell";
import { CaseSummaryDialog } from "@/modules/cases/ui/CaseSummaryDialog";
import type { EscalationDto, EscalationStatus } from "@/modules/escalations/domain/escalation";
import { escalationPriorityLabel, escalationStatusLabel } from "@/modules/escalations/domain/escalation";
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
    <>
      <div className="mb-4 p-3 rounded-lg border border-border bg-card text-[11px] text-muted-foreground animate-fade-up">
        Casos que el asistente no pudo resolver solo y quedaron esperando a un agente humano.
        {isSupervisor &&
          " Los casos \"sin clasificar\" son de clientes cuya solicitud todavía no se pudo identificar a qué área pertenece — solo tú puedes revisarlos y asignarlos."}
      </div>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-up">
        <StatCard label="Total" value={String(escalations.length)} />
        <StatCard label="Sin atender" value={String(pending)} tone="warning" />
        <StatCard label="Ya asignados" value={String(assigned)} tone="success" />
        <StatCard label="Viendo" value={triage ? "Sin clasificar" : "Por área"} />
      </section>

      <section className="flex flex-wrap gap-2 items-center animate-fade-up">
        {!triage && (
          <select
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            className="text-xs px-3 py-2 border border-border rounded-md bg-card"
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
          className="text-xs px-3 py-2 border border-border rounded-md bg-card"
        >
          <option value="">Cualquier estado</option>
          <option value="PENDING">Sin atender</option>
          <option value="ASSIGNED">Asignada</option>
          <option value="RESOLVED">Resuelta</option>
        </select>
        {isSupervisor && (
          <button
            type="button"
            onClick={() => setTriage((v) => !v)}
            className={`inline-flex items-center gap-1.5 text-[11px] px-3 py-2 rounded-md font-bold uppercase ${
              triage
                ? "bg-danger text-danger-foreground"
                : "border border-border hover:bg-foreground/5"
            }`}
            title="Casos que no se pudieron clasificar en ninguna área"
          >
            <AlertOctagon className="size-3.5" />
            Ver sin clasificar
          </button>
        )}
      </section>

      <section className="bg-card border border-border rounded-xl overflow-hidden animate-fade-up">
        <table className="w-full text-xs">
          <thead className="bg-background/60 text-[10px] uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-2">Motivo</th>
              <th className="text-left px-4 py-2">Prioridad</th>
              <th className="text-left px-4 py-2">Estado</th>
              <th className="text-left px-4 py-2">Agente</th>
              <th className="text-left px-4 py-2">Hace</th>
              <th className="text-right px-4 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {escalations.map((e) => {
              const priority = escalationPriorityLabel(e.priority);
              return (
                <tr key={e.id} className="hover:bg-foreground/5 transition-colors">
                  <td className="px-4 py-3 max-w-[240px] truncate">{e.reason}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] ring-1 ${priority.cls}`}>
                      {priority.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold text-[10px]">{escalationStatusLabel(e.status)}</td>
                  <td className="px-4 py-3 text-[11px]">{agentName(e.assignedAgentId)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{relativeTime(e.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => void openSummary(e)}
                        className="text-[10px] px-2 py-1 rounded border border-border font-bold uppercase hover:bg-foreground/5"
                      >
                        Ver resumen
                      </button>
                      {!e.assignedAgentId && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void claim(e)}
                          className="text-[10px] px-2 py-1 rounded bg-primary text-primary-foreground font-bold uppercase disabled:opacity-40"
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
                <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                  No hay casos esperando atención con este filtro. ¡Buen trabajo!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <CaseSummaryDialog
        open={Boolean(summaryFor)}
        onOpenChange={(open) => !open && setSummaryFor(null)}
        summary={summary}
        timeline={timeline}
        departments={departments}
        onClaim={summaryFor && !summaryFor.assignedAgentId ? () => void claim(summaryFor) : undefined}
        claimDisabled={busy}
        claimLabel="Atender yo este caso"
      />

      {escalations.some((e) => e.assignedAgentId === session?.id) && (
        <button
          type="button"
          onClick={() => void navigate({ to: "/bandeja" })}
          className="text-[11px] font-bold text-primary hover:underline"
        >
          Ir a mis conversaciones para atenderlos →
        </button>
      )}
    </>
  );
}
