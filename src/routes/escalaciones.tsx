import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRightLeft, AlertOctagon } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell, StatCard } from "../components/AppShell";
import { CaseSummaryDialog } from "@/components/cases/CaseSummaryDialog";
import {
  claimCaseFn,
  getCaseSummaryFn,
  getCaseTimelineFn,
  listEscalationsFn,
} from "@/adapters/http/server-fns";
import type {
  CaseSummaryDto,
  CaseTimelineEntryDto,
  EscalationDto,
  EscalationStatus,
} from "@/adapters/http/dto";
import { relativeTime } from "@/hooks/use-operational-inbox";
import { useDepartmentsQuery, useSession } from "../lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/escalaciones")({
  component: EscalacionesPage,
});

const priorityTone: Record<string, string> = {
  urgent: "bg-danger/10 text-danger ring-danger/30",
  high: "bg-warning/10 text-warning ring-warning/30",
  normal: "bg-primary/10 text-primary ring-primary/30",
  low: "bg-foreground/5 text-muted-foreground ring-border",
};

function EscalacionesPage() {
  const session = useSession();
  const navigate = useNavigate();
  const { data: departments = [] } = useDepartmentsQuery();
  const [departmentId, setDepartmentId] = useState<string>("");
  const [triage, setTriage] = useState(false);
  const [status, setStatus] = useState<EscalationStatus | "">("");
  const [escalations, setEscalations] = useState<EscalationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [summary, setSummary] = useState<CaseSummaryDto | null>(null);
  const [timeline, setTimeline] = useState<CaseTimelineEntryDto[]>([]);
  const [summaryFor, setSummaryFor] = useState<EscalationDto | null>(null);

  const isSupervisor = session?.role === "manager" || session?.role === "admin";

  const reload = async () => {
    if (!session) return;
    setLoading(true);
    try {
      const data = await listEscalationsFn({
        data: {
          agentUserId: session.id,
          departmentId: departmentId || undefined,
          status: status || undefined,
          triage,
        },
      });
      setEscalations(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo cargar escalaciones");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id, departmentId, status, triage]);

  const openSummary = async (escalation: EscalationDto) => {
    setSummaryFor(escalation);
    setSummary(null);
    setTimeline([]);
    try {
      const [s, t] = await Promise.all([
        getCaseSummaryFn({ data: { caseId: escalation.caseId } }),
        getCaseTimelineFn({ data: { caseId: escalation.caseId } }),
      ]);
      setSummary(s);
      setTimeline(t);
    } catch {
      setSummary(escalation.summary);
    }
  };

  const claim = async (escalation: EscalationDto) => {
    if (!session) return;
    setBusyId(escalation.id);
    try {
      await claimCaseFn({ data: { caseId: escalation.caseId, agentUserId: session.id } });
      toast.success("Caso reclamado");
      setSummaryFor(null);
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo reclamar");
    } finally {
      setBusyId(null);
    }
  };

  const pending = escalations.filter((e) => e.status === "PENDING").length;
  const assigned = escalations.filter((e) => e.status === "ASSIGNED").length;

  return (
    <AppShell title="Escalaciones" icon={ArrowRightLeft}>
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
                        disabled={busyId === e.id}
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
        onClaim={
          summaryFor && !summaryFor.assignedAgentId ? () => void claim(summaryFor) : undefined
        }
        claimDisabled={Boolean(busyId)}
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
    </AppShell>
  );
}
