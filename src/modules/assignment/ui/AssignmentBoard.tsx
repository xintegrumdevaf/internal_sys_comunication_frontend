import { RefreshCcw } from "lucide-react";
import { StatCard } from "@/app/shell/AppShell";
import { caseStatusLabel, workflowLabel } from "@/modules/cases/domain/case";
import { useAssignmentBoard } from "@/modules/assignment/application/use-assignment-board";

/** UI de gestion de carga y reasignacion manual por departamento. */
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
    <>
      <div className="mb-4 p-3 rounded-lg border border-border bg-card text-[11px] text-muted-foreground animate-fade-up">
        Aquí puedes ver cuántos casos tiene cada agente. Los casos escalados se asignan
        automáticamente al agente con menos carga del área; si nadie está disponible, o si
        prefieres moverlo tú mismo, puedes asignar o reasignar manualmente en cualquier momento.
      </div>

      <div className="flex items-center gap-2 animate-fade-up">
        <select
          value={departmentId}
          onChange={(e) => setDepartmentId(e.target.value)}
          className="text-xs px-3 py-2 border border-border rounded-md bg-card"
        >
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => void reload()}
          className="inline-flex items-center gap-1.5 text-[11px] px-3 py-2 rounded-md border border-border font-bold uppercase hover:bg-foreground/5"
        >
          <RefreshCcw className="size-3.5" /> Actualizar
        </button>
      </div>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-up">
        <StatCard label="Agentes del área" value={String(agentsInDept.length)} />
        <StatCard label="Sin asignar" value={String(unassigned.length)} tone="warning" />
        <StatCard label="Asignados" value={String(assigned.length)} tone="success" />
        <StatCard label="Total en el área" value={String(cases.length)} hint="Casos abiertos ahora" />
      </section>

      <section className="grid grid-cols-12 gap-6 animate-fade-up">
        <div className="col-span-12 lg:col-span-5 bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="text-xs font-extrabold uppercase tracking-widest">
              Carga por agente
            </h3>
          </div>
          <div className="divide-y divide-border">
            {workload.map(({ agent, activeCases, waitingUser }) => (
              <div key={agent.id} className="p-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="size-8 rounded-full bg-primary/15 text-primary grid place-items-center text-[10px] font-bold shrink-0">
                    {agent.initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate">{agent.name}</p>
                    <p className="text-[10px] text-muted-foreground">{agent.roleLabel}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-extrabold font-mono">{activeCases}</p>
                  <p className="text-[9px] text-muted-foreground uppercase">
                    activos · {waitingUser} esperando
                  </p>
                </div>
              </div>
            ))}
            {agentsInDept.length === 0 && (
              <p className="p-4 text-xs text-muted-foreground">
                Todavía no hay agentes asignados a esta área.
              </p>
            )}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-7 space-y-4">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="text-xs font-extrabold uppercase tracking-widest">
                Casos sin asignar ({unassigned.length})
              </h3>
            </div>
            <div className="divide-y divide-border">
              {unassigned.map((c) => (
                <div key={c.id} className="p-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-bold">{customerNameByCaseId[c.id] ?? "Cliente"}</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {workflowLabel(c.workflowType).label} · {caseStatusLabel(c.status)}
                    </p>
                  </div>
                  <select
                    disabled={busy}
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) void assignCase(c.id, e.target.value);
                    }}
                    className="text-[11px] px-2 py-1.5 border border-border rounded bg-background shrink-0"
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
                <p className="p-4 text-xs text-muted-foreground">Sin casos pendientes de asignar.</p>
              )}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="text-xs font-extrabold uppercase tracking-widest">
                Casos asignados ({assigned.length})
              </h3>
            </div>
            <div className="divide-y divide-border">
              {assigned.map((c) => (
                <div key={c.id} className="p-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-bold">{customerNameByCaseId[c.id] ?? "Cliente"}</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {workflowLabel(c.workflowType).label} · Atiende:{" "}
                      {directory.find((a) => a.id === c.assignedAgentId)?.name ?? "—"}
                    </p>
                  </div>
                  <select
                    disabled={busy}
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) void reassignCase(c.id, e.target.value);
                    }}
                    className="text-[11px] px-2 py-1.5 border border-border rounded bg-background shrink-0"
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
                <p className="p-4 text-xs text-muted-foreground">Sin casos asignados activos.</p>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
