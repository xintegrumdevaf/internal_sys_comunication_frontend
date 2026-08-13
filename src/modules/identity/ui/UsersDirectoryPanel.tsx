import { useMemo, useState } from "react";
import { Copy, KeyRound, Plus, Search, ShieldCheck, UserX } from "lucide-react";
import { toast } from "sonner";
import { useDepartmentsQuery, useDirectoryUsers } from "@/modules/identity/application/use-session";
import { useAgentDirectoryAdmin } from "@/modules/identity/application/use-agent-directory-admin";
import { groupDirectoryByDepartment } from "@/modules/identity/application/group-directory-by-department";
import type { AgentRole, SessionUser } from "@/modules/identity/domain/session";
import { Switch } from "@/components/ui/switch";

/**
 * Alta, edición y baja de agentes reales — conectado a
 * `POST/PUT/DELETE /api/agents` (docs/spec/06_BACKEND_GAPS.md §1, resuelto).
 * Toggle de asignación automática por agente (docs/superpowers/specs/2026-08-12-agent-auto-assign-toggle-design.md).
 * Esta pantalla solo la ve un administrador (access-control.ts).
 */

type FormState = {
  name: string;
  email: string;
  primaryDepartmentId: string;
  role: AgentRole;
};

const emptyForm: FormState = { name: "", email: "", primaryDepartmentId: "", role: "agent" };

function roleText(role: AgentRole): string {
  if (role === "admin") return "Administrador";
  if (role === "manager") return "Jefe de área";
  return "Agente";
}

export function UsersDirectoryPanel() {
  const users = useDirectoryUsers();
  const { data: departments = [] } = useDepartmentsQuery();
  const { busy, createAgent, updateAgent, setAutoAssign, deactivateAgent, reactivateAgent, resetPassword } =
    useAgentDirectoryAdmin();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [search, setSearch] = useState("");
  const [pendingAutoAssignId, setPendingAutoAssignId] = useState<string | null>(null);
  const [temporaryPasswordFor, setTemporaryPasswordFor] = useState<{ name: string; password: string } | null>(
    null,
  );

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    );
  }, [users, search]);

  const sections = useMemo(
    () => groupDirectoryByDepartment(filteredUsers, departments),
    [filteredUsers, departments],
  );

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
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
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
  };

  const handleSubmit = async () => {
    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
      primaryDepartmentId: form.primaryDepartmentId || null,
    };
    if (editingId) {
      const ok = await updateAgent(editingId, payload);
      if (ok) closeForm();
      return;
    }
    const temporaryPassword = await createAgent(payload);
    if (temporaryPassword) {
      closeForm();
      setTemporaryPasswordFor({ name: payload.name, password: temporaryPassword });
    }
  };

  const toggleActive = async (userId: string, currentlyActive: boolean) => {
    if (currentlyActive) {
      await deactivateAgent(userId);
    } else {
      await reactivateAgent(userId);
    }
  };

  const handleResetPassword = async (userId: string, name: string) => {
    const temporaryPassword = await resetPassword(userId);
    if (temporaryPassword) {
      setTemporaryPasswordFor({ name, password: temporaryPassword });
    }
  };

  const handleAutoAssign = async (user: SessionUser, enabled: boolean) => {
    setPendingAutoAssignId(user.id);
    try {
      await setAutoAssign(user.id, enabled);
    } finally {
      setPendingAutoAssignId(null);
    }
  };

  const copyPassword = async (password: string) => {
    try {
      await navigator.clipboard.writeText(password);
      toast.success("Contraseña copiada");
    } catch {
      // clipboard puede no estar disponible (http sin permisos) — la contraseña sigue visible en pantalla
    }
  };

  const canSubmit = form.name.trim().length >= 2 && /\S+@\S+\.\S+/.test(form.email.trim());

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold">Agentes del sistema</h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Agrupados por área. El switch de asignación automática indica si el agente entra al
            pool de chats de su departamento (opt-in; por defecto desactivado).
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-md bg-foreground text-background px-3 py-2 text-[11px] font-bold uppercase hover:opacity-90"
        >
          <Plus className="size-3.5" />
          Nuevo agente
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar agente"
          className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {temporaryPasswordFor && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-primary flex items-center gap-2">
            <KeyRound className="size-3.5" /> Contraseña temporal para {temporaryPasswordFor.name}
          </h3>
          <p className="text-[11px] text-muted-foreground">
            Cópiala y compártela con la persona por un canal seguro (no por WhatsApp del cliente).
            Por seguridad, <strong>no se puede volver a mostrar</strong> — si se pierde, usa
            "Restablecer contraseña".
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 rounded-md bg-card border border-border font-mono text-sm tracking-wide">
              {temporaryPasswordFor.password}
            </code>
            <button
              type="button"
              onClick={() => void copyPassword(temporaryPasswordFor.password)}
              className="p-2 rounded-md border border-border hover:bg-foreground/5"
              title="Copiar"
            >
              <Copy className="size-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => setTemporaryPasswordFor(null)}
            className="text-[11px] font-bold text-muted-foreground hover:text-foreground"
          >
            Ya la copié, cerrar
          </button>
        </div>
      )}

      {formOpen && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <h3 className="text-xs font-extrabold uppercase tracking-widest flex items-center gap-2">
            <ShieldCheck className="size-3.5 text-primary" />
            {editingId ? "Editar agente" : "Nuevo agente"}
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="text-[11px] space-y-1">
              <span className="font-bold uppercase tracking-wide text-muted-foreground">
                Nombre completo
              </span>
              <input
                autoFocus
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ej: Ana Torres"
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <label className="text-[11px] space-y-1">
              <span className="font-bold uppercase tracking-wide text-muted-foreground">
                Correo (para iniciar sesión)
              </span>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="ana.torres@empresa.com"
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <label className="text-[11px] space-y-1">
              <span className="font-bold uppercase tracking-wide text-muted-foreground">
                Área principal
              </span>
              <select
                value={form.primaryDepartmentId}
                onChange={(e) => setForm((f) => ({ ...f, primaryDepartmentId: e.target.value }))}
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm"
              >
                <option value="">Sin área asignada</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-[11px] space-y-1">
              <span className="font-bold uppercase tracking-wide text-muted-foreground">
                Nivel de acceso
              </span>
              <select
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as AgentRole }))}
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm"
              >
                <option value="agent">Agente — atiende conversaciones de su área</option>
                <option value="manager">Jefe de área — además reasigna y ve escalados</option>
                <option value="admin">Administrador — acceso total al sistema</option>
              </select>
            </label>
          </div>
          {!editingId && (
            <p className="text-[11px] text-muted-foreground bg-background rounded-md px-3 py-2">
              El sistema genera una contraseña temporal automáticamente al crear el agente — la
              verás una sola vez justo después de guardar. La asignación automática queda
              desactivada hasta que la actives en la lista.
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy || !canSubmit}
              onClick={() => void handleSubmit()}
              className="px-3 py-2 rounded-md bg-primary text-primary-foreground text-[11px] font-bold uppercase disabled:opacity-40"
            >
              {editingId ? "Guardar cambios" : "Crear agente"}
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="px-3 py-2 rounded-md border border-border text-[11px] font-bold uppercase hover:bg-foreground/5"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {sections.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
          {users.length === 0
            ? 'Sin agentes — crea el primero con el botón "Nuevo agente".'
            : "Ningún agente coincide con la búsqueda."}
        </div>
      ) : (
        <div className="space-y-4">
          {sections.map((section) => (
            <div key={section.departmentId ?? "none"} className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="flex items-center justify-between gap-2 border-b border-border bg-background/60 px-4 py-2.5">
                <h3 className="text-[11px] font-extrabold uppercase tracking-widest">{section.title}</h3>
                <span className="text-[10px] font-bold text-muted-foreground">
                  {section.users.length} {section.users.length === 1 ? "agente" : "agentes"}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-border text-[10px] uppercase tracking-widest text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-extrabold">Nombre</th>
                      <th className="px-4 py-3 font-extrabold">Correo</th>
                      <th className="px-4 py-3 font-extrabold">Acceso</th>
                      <th className="px-4 py-3 font-extrabold">Estado</th>
                      <th className="px-4 py-3 font-extrabold">Asignación automática</th>
                      <th className="px-4 py-3 font-extrabold text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {section.users.map((u) => {
                      const canToggleAutoAssign = Boolean(u.active && u.primaryDepartmentId);
                      const switchBusy = busy || pendingAutoAssignId === u.id;
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
                          <td className="px-4 py-3">{u.email}</td>
                          <td className="px-4 py-3">{roleText(u.role)}</td>
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
                            <Switch
                              checked={u.autoAssignEnabled}
                              disabled={!canToggleAutoAssign || switchBusy}
                              onCheckedChange={(checked) => void handleAutoAssign(u, checked)}
                              aria-label={`Asignación automática para ${u.name}`}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => openEdit(u.id)}
                                className="px-2 py-1 rounded border border-border text-[10px] font-bold uppercase hover:bg-muted"
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => void handleResetPassword(u.id, u.name)}
                                title="Genera una contraseña temporal nueva para esta persona"
                                className="inline-flex items-center gap-1 px-2 py-1 rounded border border-border text-[10px] font-bold uppercase hover:bg-muted disabled:opacity-40"
                              >
                                <KeyRound className="size-3" />
                                Restablecer
                              </button>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => void toggleActive(u.id, u.active)}
                                title={
                                  u.active
                                    ? "La persona ya no podrá iniciar sesión ni recibir conversaciones nuevas"
                                    : "Vuelve a permitir que inicie sesión y reciba conversaciones"
                                }
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded border text-[10px] font-bold uppercase disabled:opacity-40 ${
                                  u.active
                                    ? "border-danger/30 text-danger hover:bg-danger/10"
                                    : "border-primary/30 text-primary hover:bg-primary/10"
                                }`}
                              >
                                <UserX className="size-3" />
                                {u.active ? "Desactivar" : "Reactivar"}
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
          ))}
        </div>
      )}
    </div>
  );
}
