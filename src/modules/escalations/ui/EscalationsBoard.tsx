import { useNavigate } from "@tanstack/react-router";
import { AlertOctagon } from "lucide-react";
import { StatCard } from "@/app/shell/AppShell";
import { CaseSummaryDialog } from "@/modules/cases/ui/CaseSummaryDialog";
import type { EscalationDto, EscalationStatus } from "@/modules/escalations/domain/escalation";
import { useEscalations } from "@/modules/escalations/application/use-escalations";
import { relativeTime } from "@/shared/datetime";
import { useDepartmentsQuery } from "@/modules/identity/application/use-session";

const priorityTone: Record<string, string> = {
  urgent: "bg-danger/10 text-danger ring-danger/30",
  high: "bg-warning/10 text-warning ring-warning/30",
  normal: "bg-primary/10 text-primary ring-primary/30",
  low: "bg-foreground/5 text-muted-foreground ring-border",
};

/** UI de la bandeja de escalaciones/triage (docs/spec/03_REALTIME_NOTIFICATIONS.md). */
export function EscalationsBoard() {
  const navigate = useNavigate();
  const { data: departments = [] } = useDepartmentsQuery();
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

  return (
    <>
      <div className="mb-4 p-3 rounded-lg border border-border bg-card text-[11px] text-muted-foreground animate-fade-up">
        Bandeja real de <code className="font-mono">GET /api/escalations</code>. El pool de triage
        (sin departamento) solo es visible para jefes de área/admin.
      </div>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-up">
        <StatCard label="Total" value={String(escalations.length)} />
        <StatCard label="Pendientes" value={String(pending)} tone="warning" />
        <StatCard label="Asignadas" value={String(assigned)} tone="success" />
        <StatCard label="Modo" value={triage ? "Triage" : "Depto."} />
      </section>

      <section className="flex flex-wrap gap-2 items-center animate-fade-up">
        {!triage && (
          <select
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            className="text-xs px-3 py-2 border border-border rounded-md bg-card"
          >
            <option value="">Todos los departamentos</option>
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
          <option value="PENDING">Pendiente</option>
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
          >
            <AlertOctagon className="size-3.5" />
            Pool de triage
          </button>
        )}
      </section>

      <section className="bg-card border border-border rounded-xl overflow-hidden animate-fade-up">
        <table className="w-full text-xs">
          <thead className="bg-background/60 text-[10px] uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-2">Razón</th>
              <th className="text-left px-4 py-2">Prioridad</th>
              <th className="text-left px-4 py-2">Estado</th>
              <th className="text-left px-4 py-2">Asignado</th>
              <th className="text-left px-4 py-2">Creado</th>
              <th className="text-right px-4 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {escalations.map((e) => (
              <tr key={e.id} className="hover:bg-foreground/5 transition-colors">
                <td className="px-4 py-3 max-w-[240px] truncate">{e.reason}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-0.5 rounded font-bold text-[10px] ring-1 ${priorityTone[e.priority]}`}
                  >
                    {e.priority}
                  </span>
                </td>
                <td className="px-4 py-3 uppercase font-bold text-[10px]">{e.status}</td>
                <td className="px-4 py-3 font-mono text-[10px]">
                  {e.assignedAgentId ? e.assignedAgentId.slice(0, 8) : "Sin asignar"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{relativeTime(e.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => void openSummary(e)}
                      className="text-[10px] px-2 py-1 rounded border border-border font-bold uppercase hover:bg-foreground/5"
                    >
                      Resumen
                    </button>
                    {!e.assignedAgentId && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void claim(e)}
                        className="text-[10px] px-2 py-1 rounded bg-primary text-primary-foreground font-bold uppercase disabled:opacity-40"
                      >
                        Reclamar
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!loading && escalations.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                  Sin escalaciones para este filtro.
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
        onClaim={summaryFor && !summaryFor.assignedAgentId ? () => void claim(summaryFor) : undefined}
        claimDisabled={busy}
      />

      {escalations.some((e) => e.assignedAgentId === session?.id) && (
        <button
          type="button"
          onClick={() => void navigate({ to: "/bandeja" })}
          className="text-[11px] font-bold text-primary hover:underline"
        >
          Ir a la bandeja para atender mis casos reclamados →
        </button>
      )}
    </>
  );
}
