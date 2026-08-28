import { RefreshCcw, Users, UserCheck, AlertCircle } from "lucide-react";
import { StatCard } from "@/app/shell/AppShell";
import { caseStatusLabel, workflowLabel } from "@/modules/cases/domain/case";
import { useAssignmentBoard } from "@/modules/assignment/application/use-assignment-board";

/** UI de gestión de carga y reasignación manual por departamento. */
export function AssignmentBoard() {
  const {
    departments,
    departmentId,
    setDepartmentId,
    directory,
    agentsInDept,
    workload,
    unassigned,
    assigned,
    cases,
    customerNameByCaseId,
    loading,
    busy,
    reload,
    assignCase,
    reassignCase,
  } = useAssignmentBoard();

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Banner Informativo */}
      <div className="p-4 sm:p-5 rounded-xl border border-border bg-card text-xs sm:text-sm text-muted-foreground flex items-start gap-3 shadow-xs">
        <Users className="size-5 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-foreground">Gestión y Distribución de Carga</p>
          <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
            Monitorea la carga de trabajo en tiempo real por departamento. Los casos escalados se
            auto-asignan al agente con menor carga. Puedes intervenir y reasignar casos manualmente
            cuando lo requieras.
          </p>
        </div>
      </div>

      {/* Controles de Área y Recarga */}
      <div className="p-3.5 sm:p-4 rounded-xl border border-border bg-card flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider shrink-0">
            Área:
          </label>
          <select
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            className="text-xs px-3 py-2 border border-border rounded-lg bg-background font-medium outline-none focus:ring-2 focus:ring-primary/20 w-full sm:w-auto"
          >
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => void reload()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 text-xs px-3.5 py-2 rounded-lg border border-border bg-background font-bold uppercase hover:bg-foreground/5 transition-colors disabled:opacity-50 w-full sm:w-auto"
        >
          <RefreshCcw className={`size-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Indicadores */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Agentes en área" value={String(agentsInDept.length)} hint="Disponibles" />
        <StatCard
          label="Sin asignar"
          value={String(unassigned.length)}
          tone="warning"
          hint="Pendientes de asignación"
        />
        <StatCard
          label="Asignados"
          value={String(assigned.length)}
          tone="success"
          hint="En curso"
        />
        <StatCard
          label="Total en el área"
          value={String(cases.length)}
          hint="Casos abiertos ahora"
        />
      </section>

      {/* Paneles de Carga y Casos */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[440px]">
        {/* Carga por agente */}
        <div className="col-span-1 lg:col-span-5 bg-card border border-border rounded-xl flex flex-col overflow-hidden shadow-xs">
          <div className="p-4 sm:p-5 border-b border-border bg-background/60 flex items-center gap-2.5">
            <UserCheck className="size-4 text-primary" />
            <h3 className="text-xs font-extrabold uppercase tracking-widest">Carga por Agente</h3>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {workload.map(({ agent, activeCases, waitingUser }) => (
              <div
                key={agent.id}
                className="p-4 flex items-center justify-between gap-3 hover:bg-foreground/5 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-9 rounded-full bg-primary/15 text-primary grid place-items-center text-xs font-bold shrink-0">
                    {agent.initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate">{agent.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{agent.roleLabel}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-extrabold font-mono">{activeCases}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">
                    activos · {waitingUser} esperando
                  </p>
                </div>
              </div>
            ))}
            {agentsInDept.length === 0 && (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No hay agentes asignados a este departamento.
              </div>
            )}
          </div>
        </div>

        {/* Casos sin asignar y asignados */}
        <div className="col-span-1 lg:col-span-7 space-y-6 flex flex-col">
          {/* Sin Asignar */}
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs flex flex-col">
            <div className="p-4 sm:p-5 border-b border-border bg-background/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="size-4 text-amber-500" />
                <h3 className="text-xs font-extrabold uppercase tracking-widest">
                  Casos sin Asignar ({unassigned.length})
                </h3>
              </div>
            </div>
            <div className="divide-y divide-border max-h-[260px] overflow-y-auto">
              {unassigned.map((c) => (
                <div
                  key={c.id}
                  className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-foreground/5 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate">
                      {customerNameByCaseId[c.id] ?? "Cliente"}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                      {workflowLabel(c.workflowType).label} · {caseStatusLabel(c.status)}
                    </p>
                  </div>
                  <select
                    disabled={busy}
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) void assignCase(c.id, e.target.value);
                    }}
                    className="text-xs px-3 py-1.5 border border-border rounded-lg bg-background outline-none focus:ring-2 focus:ring-primary/20 shrink-0 font-medium"
                  >
                    <option value="" disabled>
                      Asignar a…
                    </option>
                    {agentsInDept.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
              {unassigned.length === 0 && !loading && (
                <p className="p-6 text-xs text-center text-muted-foreground">
                  Sin casos pendientes de asignación.
                </p>
              )}
            </div>
          </div>

          {/* Asignados */}
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs flex flex-col">
            <div className="p-4 sm:p-5 border-b border-border bg-background/60 flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-widest">
                Casos Asignados ({assigned.length})
              </h3>
            </div>
            <div className="divide-y divide-border max-h-[260px] overflow-y-auto">
              {assigned.map((c) => (
                <div
                  key={c.id}
                  className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-foreground/5 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate">
                      {customerNameByCaseId[c.id] ?? "Cliente"}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                      {workflowLabel(c.workflowType).label} · Atiende:{" "}
                      <span className="font-semibold text-foreground">
                        {directory.find((a) => a.id === c.assignedAgentId)?.name ?? "—"}
                      </span>
                    </p>
                  </div>
                  <select
                    disabled={busy}
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) void reassignCase(c.id, e.target.value);
                    }}
                    className="text-xs px-3 py-1.5 border border-border rounded-lg bg-background outline-none focus:ring-2 focus:ring-primary/20 shrink-0 font-medium"
                  >
                    <option value="" disabled>
                      Reasignar a…
                    </option>
                    {agentsInDept
                      .filter((a) => a.id !== c.assignedAgentId)
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                  </select>
                </div>
              ))}
              {assigned.length === 0 && !loading && (
                <p className="p-6 text-xs text-center text-muted-foreground">
                  Sin casos asignados activos.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
