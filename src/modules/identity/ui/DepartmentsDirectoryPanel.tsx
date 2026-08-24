import { useMemo, useState, useEffect } from "react";
import { Plus, Search, Building2, ShieldCheck, LayoutDashboard } from "lucide-react";
import { useDepartmentsQuery } from "@/modules/identity/application/use-session";
import { useDepartmentsAdmin } from "@/modules/identity/application/use-departments-admin";
import type { DepartmentVisibility } from "@/modules/identity/domain/department";
import { departmentVisibilityLabel } from "@/modules/identity/domain/department";

type FormState = {
  name: string;
  slug: string;
  visibility: DepartmentVisibility;
};

const emptyForm: FormState = { name: "", slug: "", visibility: "shared" };

function toAutoSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function DepartmentsDirectoryPanel() {
  const { data: departments = [] } = useDepartmentsQuery();
  const { busy, createDepartment, updateDepartment, deactivateDepartment, reactivateDepartment } =
    useDepartmentsAdmin();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [search, setSearch] = useState("");
  const [autoSlugEnabled, setAutoSlugEnabled] = useState(true);

  useEffect(() => {
    if (autoSlugEnabled && form.name) {
      setForm((prev) => ({ ...prev, slug: toAutoSlug(prev.name) }));
    }
  }, [form.name, autoSlugEnabled]);

  const filteredDepartments = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return departments;
    return departments.filter(
      (d) => d.name.toLowerCase().includes(q) || d.slug.toLowerCase().includes(q),
    );
  }, [departments, search]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setAutoSlugEnabled(true);
    setFormOpen(true);
  };

  const openEdit = (deptId: string) => {
    const dept = departments.find((d) => d.id === deptId);
    if (!dept) return;
    setEditingId(deptId);
    setForm({
      name: dept.name,
      slug: dept.slug,
      visibility: dept.visibility,
    });
    setAutoSlugEnabled(false); // Do not auto-change slug on edit by default
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
  };

  const handleSubmit = async () => {
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      visibility: form.visibility,
    };
    if (editingId) {
      const ok = await updateDepartment(editingId, payload);
      if (ok) closeForm();
      return;
    }
    const ok = await createDepartment(payload);
    if (ok) closeForm();
  };

  const toggleActive = async (deptId: string, currentlyActive: boolean) => {
    if (currentlyActive) {
      await deactivateDepartment(deptId);
    } else {
      await reactivateDepartment(deptId);
    }
  };

  const canSubmit = form.name.trim().length >= 2 && form.slug.trim().length >= 2;

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold">Departamentos</h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Áreas o equipos dentro del sistema. La visibilidad indica si los casos asignados aquí
            pueden ser vistos por agentes de otros departamentos.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-md bg-foreground text-background px-3 py-2 text-[11px] font-bold uppercase hover:opacity-90"
        >
          <Plus className="size-3.5" />
          Nuevo departamento
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar departamento"
          className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {formOpen && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <h3 className="text-xs font-extrabold uppercase tracking-widest flex items-center gap-2">
            <Building2 className="size-3.5 text-primary" />
            {editingId ? "Editar departamento" : "Nuevo departamento"}
          </h3>
          <div className="grid sm:grid-cols-3 gap-3">
            <label className="text-[11px] space-y-1">
              <span className="font-bold uppercase tracking-wide text-muted-foreground">
                Nombre del área
              </span>
              <input
                autoFocus
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ej: Soporte Técnico"
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <label className="text-[11px] space-y-1">
              <span className="font-bold uppercase tracking-wide text-muted-foreground">
                Slug (identificador corto)
              </span>
              <input
                value={form.slug}
                onChange={(e) => {
                  setAutoSlugEnabled(false);
                  setForm((f) => ({ ...f, slug: e.target.value }));
                }}
                placeholder="soporte-tecnico"
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <label className="text-[11px] space-y-1">
              <span className="font-bold uppercase tracking-wide text-muted-foreground">
                Visibilidad de casos
              </span>
              <select
                value={form.visibility}
                onChange={(e) =>
                  setForm((f) => ({ ...f, visibility: e.target.value as DepartmentVisibility }))
                }
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm"
              >
                <option value="shared">Compartida (Visible para todos)</option>
                <option value="restricted">Restringida (Solo agentes de esta área)</option>
              </select>
            </label>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy || !canSubmit}
              onClick={() => void handleSubmit()}
              className="px-3 py-2 rounded-md bg-primary text-primary-foreground text-[11px] font-bold uppercase disabled:opacity-40"
            >
              {editingId ? "Guardar cambios" : "Crear departamento"}
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

      {departments.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
          Sin departamentos — crea el primero con el botón "Nuevo departamento".
        </div>
      ) : filteredDepartments.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
          Ningún departamento coincide con la búsqueda.
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-background/60 text-[10px] uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-extrabold">Nombre</th>
                  <th className="px-4 py-3 font-extrabold">Slug</th>
                  <th className="px-4 py-3 font-extrabold">Visibilidad</th>
                  <th className="px-4 py-3 font-extrabold">Estado</th>
                  <th className="px-4 py-3 font-extrabold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredDepartments.map((d) => (
                  <tr key={d.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-semibold">{d.name}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
                      {d.slug}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1">
                        {d.visibility === "restricted" ? (
                          <ShieldCheck className="size-3.5 text-danger" />
                        ) : (
                          <LayoutDashboard className="size-3.5 text-muted-foreground" />
                        )}
                        {departmentVisibilityLabel(d.visibility)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          d.active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {d.active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEdit(d.id)}
                          className="px-2 py-1 rounded border border-border text-[10px] font-bold uppercase hover:bg-muted"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void toggleActive(d.id, d.active)}
                          title={
                            d.active
                              ? "Desactivar departamento. Ya no aparecerá al asignar agentes o casos."
                              : "Reactivar departamento"
                          }
                          className={`px-2 py-1 rounded border text-[10px] font-bold uppercase disabled:opacity-40 ${
                            d.active
                              ? "border-danger/30 text-danger hover:bg-danger/10"
                              : "border-primary/30 text-primary hover:bg-primary/10"
                          }`}
                        >
                          {d.active ? "Desactivar" : "Reactivar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
