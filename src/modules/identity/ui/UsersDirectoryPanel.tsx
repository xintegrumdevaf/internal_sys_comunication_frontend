import { useMemo, useState } from "react";
import { AlertTriangle, Plus, ShieldAlert } from "lucide-react";
import { useDepartmentsQuery, useDirectoryUsers } from "@/modules/identity/application/use-session";
import type { AgentRole } from "@/modules/identity/domain/session";

/**
 * Directorio real de agentes (GET /api/agents) + formulario de crear/editar
 * DESHABILITADO: el backend todavia no expone POST/PUT/DELETE /api/agents
 * (docs/spec/06_BACKEND_GAPS.md §1). No simulamos una persistencia que no
 * existe - el formulario se conserva visualmente para no perder el trabajo de
 * UI, pero no guarda nada hasta que ese endpoint exista.
 */

type FormState = {
  name: string;
  email: string;
  primaryDepartmentId: string;
  role: AgentRole;
  active: boolean;
};

const emptyForm = (departmentId: string): FormState => ({
  name: "",
  email: "",
  primaryDepartmentId: departmentId,
  role: "agent",
  active: true,
});

function roleText(role: AgentRole): string {
  if (role === "admin") return "Admin";
  if (role === "manager") return "Jefe de área";
  return "Agente";
}

export function UsersDirectoryPanel() {
  const users = useDirectoryUsers();
  const { data: departments = [] } = useDepartmentsQuery();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(() => emptyForm(departments[0]?.id ?? ""));

  const departmentName = useMemo(
    () => (id: string | null) => departments.find((d) => d.id === id)?.name ?? "—",
    [departments],
  );

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm(departments[0]?.id ?? ""));
    setFormOpen(true);
  };

  const openEdit = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;
    setEditingId(userId);
    setForm({
      name: user.name,
      email: user.email,
      primaryDepartmentId: user.primaryDepartmentId ?? "",
      role: user.role,
      active: user.active,
    });
    setFormOpen(true);
  };

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold">Agentes del sistema</h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Datos reales de <code className="font-mono">GET /api/agents</code>. La sesión se elige
            en /login sobre estos mismos agentes.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-md bg-foreground text-background px-3 py-2 text-[11px] font-bold uppercase"
        >
          <Plus className="size-3.5" />
          Nuevo agente
        </button>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-[11px] text-amber-900">
        <AlertTriangle className="size-4 shrink-0 mt-0.5" />
        <p>
          <span className="font-bold">Pendiente de backend:</span> crear/editar/desactivar
          agentes todavía no tiene endpoint en <code className="font-mono">isp-customer-service-api</code>{" "}
          (solo existe <code className="font-mono">GET /api/agents</code>). El formulario de abajo
          queda deshabilitado hasta que se implemente — ver{" "}
          <code className="font-mono">docs/spec/06_BACKEND_GAPS.md</code> §1.
        </p>
      </div>

      {formOpen && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3 opacity-90">
          <h3 className="text-xs font-extrabold uppercase tracking-widest flex items-center gap-2">
            <ShieldAlert className="size-3.5 text-amber-600" />
            {editingId ? "Editar agente (deshabilitado)" : "Nuevo agente (deshabilitado)"}
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="text-[11px] space-y-1">
              <span className="font-bold uppercase tracking-wide text-muted-foreground">
                Nombre
              </span>
              <input
                disabled
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 rounded-md border border-border bg-muted/40 text-sm disabled:cursor-not-allowed"
              />
            </label>
            <label className="text-[11px] space-y-1">
              <span className="font-bold uppercase tracking-wide text-muted-foreground">
                Email
              </span>
              <input
                disabled
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full px-3 py-2 rounded-md border border-border bg-muted/40 text-sm disabled:cursor-not-allowed"
              />
            </label>
            <label className="text-[11px] space-y-1">
              <span className="font-bold uppercase tracking-wide text-muted-foreground">
                Departamento
              </span>
              <select
                disabled
                value={form.primaryDepartmentId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, primaryDepartmentId: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-md border border-border bg-muted/40 text-sm disabled:cursor-not-allowed"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-[11px] space-y-1">
              <span className="font-bold uppercase tracking-wide text-muted-foreground">Rol</span>
              <select
                disabled
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as AgentRole }))}
                className="w-full px-3 py-2 rounded-md border border-border bg-muted/40 text-sm disabled:cursor-not-allowed"
              >
                <option value="agent">Agente</option>
                <option value="manager">Jefe de área</option>
                <option value="admin">Admin</option>
              </select>
            </label>
          </div>
          <label className="inline-flex items-center gap-2 text-xs opacity-70">
            <input type="checkbox" disabled checked={form.active} readOnly />
            Activo (puede iniciar sesión)
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              disabled
              title="Pendiente: requiere POST/PUT /api/agents en el backend"
              className="px-3 py-2 rounded-md bg-primary text-primary-foreground text-[11px] font-bold uppercase opacity-40 cursor-not-allowed"
            >
              Guardar (pendiente)
            </button>
            <button
              type="button"
              onClick={() => {
                setFormOpen(false);
                setEditingId(null);
              }}
              className="px-3 py-2 rounded-md border border-border text-[11px] font-bold uppercase"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-background/60 border-b border-border text-[10px] uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-extrabold">Nombre</th>
                <th className="px-4 py-3 font-extrabold">Email</th>
                <th className="px-4 py-3 font-extrabold">Departamento</th>
                <th className="px-4 py-3 font-extrabold">Rol</th>
                <th className="px-4 py-3 font-extrabold">Estado</th>
                <th className="px-4 py-3 font-extrabold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="size-7 rounded-full bg-primary/15 text-primary grid place-items-center text-[10px] font-bold">
                        {u.initials}
                      </span>
                      <span className="font-semibold">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px]">{u.email}</td>
                  <td className="px-4 py-3">{departmentName(u.primaryDepartmentId)}</td>
                  <td className="px-4 py-3 capitalize">{roleText(u.role)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        u.active
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {u.active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(u.id)}
                        className="px-2 py-1 rounded border border-border text-[10px] font-bold uppercase hover:bg-muted"
                        title="Ver (edición pendiente de backend)"
                      >
                        Ver
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                    Sin agentes — verifica que el backend tenga seed aplicado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
