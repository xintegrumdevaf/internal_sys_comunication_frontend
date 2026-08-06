import { useMemo, useState } from "react";
import { Pencil, Plus, UserCheck, UserX } from "lucide-react";
import { SEED_DEPARTMENTS } from "@/lib/auth-seed";
import { useDirectoryUsers, useSession } from "@/lib/auth";
import type { MembershipRole, User } from "@/lib/identity";
import { isGlobalAdmin } from "@/lib/identity";
import {
  createUser,
  setUserActive,
  updateUser,
  type UserWriteInput,
} from "@/lib/users-store";
import { toast } from "sonner";

const DEPARTMENTS = SEED_DEPARTMENTS.filter((d) => d.active);

function deptName(id: string) {
  return DEPARTMENTS.find((d) => d.id === id)?.name ?? id;
}

function primaryRole(user: User): MembershipRole {
  return (
    user.memberships.find((m) => m.departmentId === user.primaryDepartmentId)?.role ??
    user.memberships[0]?.role ??
    "agent"
  );
}

type FormState = {
  name: string;
  email: string;
  primaryDepartmentId: string;
  role: Exclude<MembershipRole, "admin">;
  active: boolean;
};

const emptyForm = (): FormState => ({
  name: "",
  email: "",
  primaryDepartmentId: DEPARTMENTS.find((d) => d.slug === "soporte")?.id ?? DEPARTMENTS[0].id,
  role: "agent",
  active: true,
});

export function UsersAdminPanel() {
  const session = useSession();
  const users = useDirectoryUsers();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);

  const editingUser = useMemo(
    () => users.find((u) => u.id === editingId) ?? null,
    [users, editingId],
  );
  const editingIsAdmin = editingUser ? isGlobalAdmin(editingUser) : false;

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setFormOpen(true);
  };

  const openEdit = (user: User) => {
    setEditingId(user.id);
    const role = primaryRole(user);
    setForm({
      name: user.name,
      email: user.email,
      primaryDepartmentId: user.primaryDepartmentId,
      role: role === "admin" ? "lead" : role,
      active: user.active,
    });
    setFormOpen(true);
  };

  const submit = () => {
    const payload: UserWriteInput = {
      name: form.name,
      email: form.email,
      primaryDepartmentId: form.primaryDepartmentId,
      role: form.role,
      active: form.active,
    };
    try {
      if (editingId) {
        updateUser(editingId, payload);
        toast.success("Usuario actualizado");
      } else {
        createUser(payload);
        toast.success("Agente creado — puede entrar con su email (password mock ≥ 6)");
      }
      setFormOpen(false);
      setEditingId(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar");
    }
  };

  const toggleActive = (user: User) => {
    if (user.id === session?.id && user.active) {
      toast.error("No puedes desactivar tu propia sesión de Admin TI");
      return;
    }
    try {
      setUserActive(user.id, !user.active);
      toast.success(user.active ? "Usuario desactivado" : "Usuario activado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo cambiar el estado");
    }
  };

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold">Agentes del sistema</h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Login mock: email del agente + cualquier contraseña de 6+ caracteres. El enrutamiento
            de casos lo hace la IA.
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

      {formOpen && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <h3 className="text-xs font-extrabold uppercase tracking-widest">
            {editingId ? "Editar usuario" : "Nuevo agente"}
          </h3>
          {editingIsAdmin && (
            <p className="text-[11px] text-amber-800 bg-amber-500/10 border border-amber-500/20 rounded-md px-3 py-2">
              Admin TI: se conservan memberships de administración; puedes actualizar nombre,
              email, depto de landing y estado.
            </p>
          )}
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="text-[11px] space-y-1">
              <span className="font-bold uppercase tracking-wide text-muted-foreground">
                Nombre
              </span>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm"
              />
            </label>
            <label className="text-[11px] space-y-1">
              <span className="font-bold uppercase tracking-wide text-muted-foreground">
                Email
              </span>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm"
              />
            </label>
            <label className="text-[11px] space-y-1">
              <span className="font-bold uppercase tracking-wide text-muted-foreground">
                Departamento
              </span>
              <select
                value={form.primaryDepartmentId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, primaryDepartmentId: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-[11px] space-y-1">
              <span className="font-bold uppercase tracking-wide text-muted-foreground">
                Rol
              </span>
              <select
                value={form.role}
                disabled={editingIsAdmin}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    role: e.target.value as Exclude<MembershipRole, "admin">,
                  }))
                }
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm disabled:opacity-50"
              >
                <option value="agent">Agente</option>
                <option value="lead">Líder</option>
              </select>
            </label>
          </div>
          <label className="inline-flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
            />
            Activo (puede iniciar sesión)
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={submit}
              className="px-3 py-2 rounded-md bg-primary text-primary-foreground text-[11px] font-bold uppercase"
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={() => {
                setFormOpen(false);
                setEditingId(null);
              }}
              className="px-3 py-2 rounded-md border border-border text-[11px] font-bold uppercase"
            >
              Cancelar
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
              {users.map((u) => {
                const role = primaryRole(u);
                return (
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
                    <td className="px-4 py-3">{deptName(u.primaryDepartmentId)}</td>
                    <td className="px-4 py-3 capitalize">
                      {isGlobalAdmin(u) ? "Admin TI" : role === "lead" ? "Líder" : "Agente"}
                    </td>
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
                          onClick={() => openEdit(u)}
                          className="p-1.5 rounded border border-border hover:bg-muted"
                          title="Editar"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleActive(u)}
                          className="p-1.5 rounded border border-border hover:bg-muted"
                          title={u.active ? "Desactivar" : "Activar"}
                        >
                          {u.active ? (
                            <UserX className="size-3.5" />
                          ) : (
                            <UserCheck className="size-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
