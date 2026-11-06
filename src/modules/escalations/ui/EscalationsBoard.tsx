import { useNavigate } from "@tanstack/react-router";
import { AlertOctagon, ArrowRight, LifeBuoy, RefreshCw, Zap } from "lucide-react";
import { CaseSummaryDialog } from "@/modules/cases/ui/CaseSummaryDialog";
import type { EscalationStatus } from "@/modules/escalations/domain/escalation";
import { useEscalations } from "@/modules/escalations/application/use-escalations";
import { useDepartmentsQuery, useDirectoryUsers } from "@/modules/identity/application/use-session";
import { EscalationsMetrics } from "./EscalationsMetrics";
import { EscalationsTable } from "./EscalationsTable";

export function EscalationsBoard({ initialDepartmentId }: { initialDepartmentId?: string } = {}) {
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
    draining,
    busy,
    drainQueue,
    summary,
    timeline,
    summaryFor,
    setSummaryFor,
    openSummary,
    claim,
  } = useEscalations(initialDepartmentId);

  const isSupervisor = session?.role === "manager" || session?.role === "admin";
  const pendingCount = escalations.filter((e) => e.status === "PENDING").length;

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Banner de Operaciones */}
      <div className="p-4 sm:p-5 rounded-xl border border-border bg-card text-xs sm:text-sm text-muted-foreground flex items-start gap-3 shadow-xs">
        <LifeBuoy className="size-5 text-primary shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-semibold text-foreground">Mesa de Triaje y Rescate SLA</p>
          <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
            Centro de monitoreo en tiempo real para rescate de tickets estancados, balanceo
            automático de colas hacia asesores libres y triaje manual de consultas no reconocidas
            por la IA.
          </p>
        </div>
      </div>

      {/* Métricas macro */}
      <EscalationsMetrics escalations={escalations} />

      {/* Barra de Controles y Despacho */}
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

          {isSupervisor && (
            <button
              type="button"
              onClick={() => setTriage((v) => !v)}
              className={`inline-flex items-center justify-center gap-2 text-xs px-3.5 py-2 rounded-lg font-bold uppercase transition-colors w-full sm:w-auto ${
                triage
                  ? "bg-danger text-danger-foreground shadow-xs hover:bg-danger/90"
                  : "border border-border bg-background hover:bg-foreground/5 text-foreground"
              }`}
              title="Casos donde la IA no pudo clasificar el área"
            >
              <AlertOctagon className="size-4" />
              {triage ? "Viendo Sin clasificar" : "Ver sin clasificar (IA)"}
            </button>
          )}
        </div>

        {/* Botón de Auto-Distribución / Drenaje de Cola */}
        {isSupervisor && (
          <button
            type="button"
            disabled={draining || busy || pendingCount === 0}
            onClick={() => void drainQueue()}
            className="inline-flex items-center justify-center gap-2 text-xs px-4 py-2 rounded-lg bg-primary text-primary-foreground font-bold uppercase disabled:opacity-40 hover:bg-primary/90 transition-all shadow-xs cursor-pointer disabled:cursor-not-allowed w-full sm:w-auto"
            title="Asigna equitativamente los casos en espera a los asesores activos con cupos disponibles (Paced Dispatch)"
          >
            {draining ? (
              <RefreshCw className="size-4 animate-spin" />
            ) : (
              <Zap className="size-4 text-amber-300 fill-amber-300" />
            )}
            <span>{draining ? "Distribuyendo..." : "⚡ Auto-distribuir cola"}</span>
          </button>
        )}
      </section>

      {/* Tabla con Búsqueda y Paginación */}
      <EscalationsTable
        escalations={escalations}
        loading={loading}
        busy={busy}
        directory={directory}
        departments={departments}
        onOpenSummary={openSummary}
        onClaim={claim}
      />

      {/* Acceso rápido a mis conversaciones */}
      {escalations.some((e) => e.assignedAgentId === session?.id) && (
        <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between gap-4">
          <p className="text-xs sm:text-sm font-medium text-foreground">
            Tienes casos asignados listos para ser atendidos.
          </p>
          <button
            type="button"
            onClick={() => void navigate({ to: "/bandeja" })}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline shrink-0 cursor-pointer"
          >
            Ir a mis conversaciones <ArrowRight className="size-3.5" />
          </button>
        </div>
      )}

      {/* Diálogo de Resumen y Diagnóstico IA */}
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
