import { useMemo, useState, useEffect } from "react";
import {
  Plus,
  Search,
  Building2,
  ShieldCheck,
  LayoutDashboard,
  Bot,
  UserCheck,
  Trash2,
  ChevronDown,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import { useDepartmentsQuery } from "@/modules/identity/application/use-session";
import { useDepartmentsAdmin } from "@/modules/identity/application/use-departments-admin";
import type {
  DepartmentCase,
  DepartmentHandlingMode,
  DepartmentVisibility,
} from "@/modules/identity/domain/department";
import {
  departmentVisibilityLabel,
  departmentHandlingModeLabel,
} from "@/modules/identity/domain/department";

type CaseItemForm = {
  id?: string;
  label: string;
  description: string;
  handlingMode: DepartmentHandlingMode;
  workflowType?: string;
  active?: boolean;
};

type FormState = {
  name: string;
  slug: string;
  description: string;
  visibility: DepartmentVisibility;
  cases: CaseItemForm[];
};

const emptyForm: FormState = {
  name: "",
  slug: "",
  description: "",
  visibility: "shared",
  cases: [],
};

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
  const {
    busy,
    createDepartment,
    updateDepartment,
    deactivateDepartment,
    reactivateDepartment,
    getDepartmentCases,
  } = useDepartmentsAdmin();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [search, setSearch] = useState("");
  const [autoSlugEnabled, setAutoSlugEnabled] = useState(true);

  // Cache de casos cargados bajo demanda para la vista expandible
  const [casesCache, setCasesCache] = useState<Record<string, DepartmentCase[]>>({});
  const [expandedDeptId, setExpandedDeptId] = useState<string | null>(null);
  const [loadingCasesFor, setLoadingCasesFor] = useState<string | null>(null);

  useEffect(() => {
    if (autoSlugEnabled && form.name) {
      setForm((prev) => ({ ...prev, slug: toAutoSlug(prev.name) }));
    }
  }, [form.name, autoSlugEnabled]);

  const filteredDepartments = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return departments;
    return departments.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.slug.toLowerCase().includes(q) ||
        (d.description && d.description.toLowerCase().includes(q)),
    );
  }, [departments, search]);

  const toggleExpand = async (deptId: string) => {
    if (expandedDeptId === deptId) {
      setExpandedDeptId(null);
      return;
    }
    setExpandedDeptId(deptId);
    const dept = departments.find((d) => d.id === deptId);
    if (dept?.cases && dept.cases.length > 0) {
      setCasesCache((prev) => ({ ...prev, [deptId]: dept.cases! }));
      return;
    }
    if (!casesCache[deptId]) {
      setLoadingCasesFor(deptId);
      try {
        const fetched = await getDepartmentCases(deptId);
        setCasesCache((prev) => ({ ...prev, [deptId]: fetched || [] }));
      } catch {
        setCasesCache((prev) => ({ ...prev, [deptId]: [] }));
      } finally {
        setLoadingCasesFor(null);
      }
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setAutoSlugEnabled(true);
    setFormOpen(true);
  };

  const openEdit = async (deptId: string) => {
    const dept = departments.find((d) => d.id === deptId);
    if (!dept) return;
    setEditingId(deptId);

    let initialCases: CaseItemForm[] = dept.cases
      ? dept.cases.map((c) => ({
          id: c.id,
          label: c.label,
          description: c.description,
          handlingMode: c.handlingMode,
          workflowType: c.workflowType,
          active: c.active,
        }))
      : [];

    if (initialCases.length === 0 && casesCache[deptId]) {
      initialCases = casesCache[deptId].map((c) => ({
        id: c.id,
        label: c.label,
        description: c.description,
        handlingMode: c.handlingMode,
        workflowType: c.workflowType,
        active: c.active,
      }));
    } else if (initialCases.length === 0) {
      try {
        const fetched = await getDepartmentCases(deptId);
        if (fetched && fetched.length > 0) {
          initialCases = fetched.map((c) => ({
            id: c.id,
            label: c.label,
            description: c.description,
            handlingMode: c.handlingMode,
            workflowType: c.workflowType,
            active: c.active,
          }));
          setCasesCache((prev) => ({ ...prev, [deptId]: fetched }));
        }
      } catch {
        // Ignorar error al pre-cargar casos
      }
    }

    setForm({
      name: dept.name,
      slug: dept.slug,
      description: dept.description ?? "",
      visibility: dept.visibility,
      cases: initialCases,
    });
    setAutoSlugEnabled(false);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleAddCase = () => {
    setForm((prev) => ({
      ...prev,
      cases: [
        ...prev.cases,
        {
          label: "",
          description: "",
          handlingMode: "ai_assisted",
          workflowType: "GENERAL_INQUIRY",
          active: true,
        },
      ],
    }));
  };

  const handleRemoveCase = (index: number) => {
    setForm((prev) => ({
      ...prev,
      cases: prev.cases.filter((_, idx) => idx !== index),
    }));
  };

  const handleUpdateCase = (index: number, patch: Partial<CaseItemForm>) => {
    setForm((prev) => ({
      ...prev,
      cases: prev.cases.map((c, idx) => (idx === index ? { ...c, ...patch } : c)),
    }));
  };

  const handleSubmit = async () => {
    const validCases = form.cases
      .map((c) => ({
        id: c.id,
        label: c.label.trim(),
        description: c.description.trim(),
        handlingMode: c.handlingMode,
        workflowType: c.workflowType || "GENERAL_INQUIRY",
        active: c.active ?? true,
      }))
      .filter((c) => c.label.length > 0);

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description.trim() || undefined,
      visibility: form.visibility,
      cases: validCases,
    };

    if (editingId) {
      const ok = await updateDepartment(editingId, payload);
      if (ok) {
        closeForm();
      }
      return;
    }
    const ok = await createDepartment(payload);
    if (ok) {
      closeForm();
    }
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
    <div className="space-y-6 animate-fade-up">
      <div className="p-4 sm:p-5 rounded-xl border border-border bg-card flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="text-sm font-bold text-foreground">Departamentos y Áreas</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Estructura operativa de la organización. Configura los motivos que atiende cada área
            para el enrutamiento inteligente con IA o transferencia directa.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-xs font-bold uppercase hover:bg-primary/90 transition-colors shadow-xs"
        >
          <Plus className="size-4" />
          Nuevo departamento
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar departamento por nombre, slug o descripción..."
          className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-xs outline-none focus:ring-2 focus:ring-primary/20 shadow-xs"
        />
      </div>

      {formOpen && (
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5 space-y-4 shadow-sm animate-fade-in">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-xs font-extrabold uppercase tracking-widest flex items-center gap-2">
              <Building2 className="size-4 text-primary" />
              {editingId ? "Editar departamento" : "Nuevo departamento"}
            </h3>
            <span className="text-[11px] text-muted-foreground">
              Define el rol y los casos que este departamento resuelve
            </span>
          </div>

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

            {/* Campo Descripción General */}
            <label className="text-[11px] space-y-1 sm:col-span-3">
              <span className="font-bold uppercase tracking-wide text-muted-foreground">
                Descripción o Rol del Departamento
              </span>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Ej: Área técnica encargada de atender caídas de enlace, lentitud o incidencias de fibra óptica."
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-xs outline-none focus:ring-2 focus:ring-primary/20 resize-y"
              />
            </label>
          </div>

          {/* Sección Dinámica: Casos y Solicitudes que Atiende */}
          <div className="pt-3 border-t border-border space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-primary" />
                  Casos y Solicitudes que Atiende
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                    {form.cases.length}
                  </span>
                </h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Entrena a la IA para clasificar y enrutar las conversaciones automáticamente a
                  esta área según la intención del cliente.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddCase}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/10 text-primary text-xs font-bold uppercase hover:bg-primary/20 transition-colors shadow-xs cursor-pointer"
              >
                <Plus className="size-3.5" />
                Agregar Motivo/Caso
              </button>
            </div>

            {form.cases.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-center text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">Sin casos configurados aún</p>
                <p className="text-[11px]">
                  Agrega al menos un caso (ej. <em>Cancelación de Contrato</em>,{" "}
                  <em>Lentitud de Internet</em>) para que el modelo de IA aprenda cuándo transferir a
                  esta área.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {form.cases.map((caseItem, idx) => (
                  <div
                    key={idx}
                    className="p-3 sm:p-4 rounded-xl border border-border bg-background/60 space-y-3 shadow-xs"
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="size-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold grid place-items-center">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-foreground">
                          {caseItem.label.trim() || `Caso #${idx + 1}`}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCase(idx)}
                        className="p-1 rounded-md text-muted-foreground hover:text-danger hover:bg-danger/10 transition-colors"
                        title="Eliminar este caso"
                        aria-label="Eliminar este caso"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>

                    <div className="grid sm:grid-cols-12 gap-3">
                      <div className="sm:col-span-5 space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                          Nombre del Caso
                        </label>
                        <input
                          value={caseItem.label}
                          onChange={(e) => handleUpdateCase(idx, { label: e.target.value })}
                          placeholder="Ej: Cancelación de Contrato"
                          className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-xs outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>

                      <div className="sm:col-span-7 space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                          <span>Tipo de Atención</span>
                          <span className="text-[9px] lowercase text-muted-foreground font-normal">
                            {caseItem.handlingMode === "ai_assisted"
                              ? "IA responde primero"
                              : "Pasa directo a humano"}
                          </span>
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateCase(idx, { handlingMode: "ai_assisted" })}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-left text-[11px] font-medium transition-all ${
                              caseItem.handlingMode === "ai_assisted"
                                ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                                : "border-border bg-background text-muted-foreground hover:bg-muted/40"
                            }`}
                          >
                            <Bot className="size-3.5 shrink-0" />
                            <span className="truncate">🤖 Asistido por IA</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateCase(idx, { handlingMode: "human_direct" })}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-left text-[11px] font-medium transition-all ${
                              caseItem.handlingMode === "human_direct"
                                ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold shadow-xs"
                                : "border-border bg-background text-muted-foreground hover:bg-muted/40"
                            }`}
                          >
                            <UserCheck className="size-3.5 shrink-0" />
                            <span className="truncate">👤 Directo a Humano</span>
                          </button>
                        </div>
                      </div>

                      <div className="sm:col-span-12 space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                          <span>¿Cómo lo dice el cliente?</span>
                          <span className="text-[10px] text-primary/80 font-normal">
                            (Entrenamiento directo para el modelo de IA)
                          </span>
                        </label>
                        <textarea
                          rows={2}
                          value={caseItem.description}
                          onChange={(e) => handleUpdateCase(idx, { description: e.target.value })}
                          placeholder="Ej: cuando el cliente pide darse de baja, devolver los equipos o cancelar el servicio"
                          className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-xs outline-none focus:ring-2 focus:ring-primary/20 resize-y"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-border">
            <button
              type="button"
              disabled={busy || !canSubmit}
              onClick={() => void handleSubmit()}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-xs font-bold uppercase disabled:opacity-40 hover:bg-primary/90 transition-colors shadow-xs cursor-pointer"
            >
              {editingId ? "Guardar cambios" : "Crear departamento"}
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="px-4 py-2 rounded-md border border-border text-xs font-bold uppercase hover:bg-foreground/5 transition-colors cursor-pointer"
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
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-background/60 text-[10px] uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-extrabold w-8"></th>
                  <th className="px-4 py-3 font-extrabold">Nombre</th>
                  <th className="px-4 py-3 font-extrabold">Slug</th>
                  <th className="px-4 py-3 font-extrabold">Visibilidad</th>
                  <th className="px-4 py-3 font-extrabold">Casos Atendidos</th>
                  <th className="px-4 py-3 font-extrabold">Estado</th>
                  <th className="px-4 py-3 font-extrabold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredDepartments.map((d) => {
                  const cases = d.cases ?? casesCache[d.id] ?? [];
                  const casesCount = cases.length;
                  const isExpanded = expandedDeptId === d.id;

                  return (
                    <tr key={d.id} className="group">
                      <td colSpan={7} className="p-0">
                        <div
                          className={`flex items-center hover:bg-muted/30 transition-colors ${
                            isExpanded ? "bg-muted/20" : ""
                          }`}
                        >
                          <div className="px-3 py-3 w-8 shrink-0">
                            <button
                              type="button"
                              onClick={() => void toggleExpand(d.id)}
                              className="p-1 rounded hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-colors"
                              title={isExpanded ? "Ocultar casos" : "Ver casos atendidos"}
                              aria-label={isExpanded ? "Ocultar casos" : "Ver casos atendidos"}
                            >
                              <ChevronDown
                                className={`size-3.5 transition-transform duration-200 ${
                                  isExpanded ? "rotate-180 text-primary" : ""
                                }`}
                              />
                            </button>
                          </div>

                          <div className="px-4 py-3 font-semibold text-foreground flex-1 min-w-[140px]">
                            <div>{d.name}</div>
                            {d.description && (
                              <div className="text-[11px] text-muted-foreground font-normal truncate max-w-sm">
                                {d.description}
                              </div>
                            )}
                          </div>

                          <div className="px-4 py-3 font-mono text-[11px] text-muted-foreground w-36 shrink-0">
                            {d.slug}
                          </div>

                          <div className="px-4 py-3 w-48 shrink-0">
                            <span className="inline-flex items-center gap-1">
                              {d.visibility === "restricted" ? (
                                <ShieldCheck className="size-3.5 text-danger" />
                              ) : (
                                <LayoutDashboard className="size-3.5 text-muted-foreground" />
                              )}
                              {departmentVisibilityLabel(d.visibility)}
                            </span>
                          </div>

                          {/* Badge de contador de casos */}
                          <div className="px-4 py-3 w-36 shrink-0">
                            <button
                              type="button"
                              onClick={() => void toggleExpand(d.id)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors cursor-pointer ${
                                casesCount > 0
                                  ? "bg-primary/10 text-primary hover:bg-primary/20"
                                  : "bg-muted text-muted-foreground hover:bg-muted/80"
                              }`}
                            >
                              <Sparkles className="size-3" />
                              <span>
                                {casesCount > 0
                                  ? `${casesCount} ${casesCount === 1 ? "caso" : "casos"}`
                                  : "0 casos"}
                              </span>
                            </button>
                          </div>

                          <div className="px-4 py-3 w-28 shrink-0">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                d.active
                                  ? "bg-primary/10 text-primary"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {d.active ? "Activo" : "Inactivo"}
                            </span>
                          </div>

                          <div className="px-4 py-3 text-right w-44 shrink-0">
                            <div className="flex justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => openEdit(d.id)}
                                className="px-2 py-1 rounded border border-border text-[10px] font-bold uppercase hover:bg-muted transition-colors cursor-pointer"
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
                                className={`px-2 py-1 rounded border text-[10px] font-bold uppercase disabled:opacity-40 transition-colors cursor-pointer ${
                                  d.active
                                    ? "border-danger/30 text-danger hover:bg-danger/10"
                                    : "border-primary/30 text-primary hover:bg-primary/10"
                                }`}
                              >
                                {d.active ? "Desactivar" : "Reactivar"}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Vista Expandible de Casos y Solicitudes */}
                        {isExpanded && (
                          <div className="border-t border-border/70 bg-muted/15 px-6 py-4 animate-fade-in">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Sparkles className="size-3.5 text-primary" />
                                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                                  Motivos y Casos que Resuelve ({casesCount})
                                </h4>
                              </div>
                              <button
                                type="button"
                                onClick={() => openEdit(d.id)}
                                className="text-[11px] text-primary hover:underline font-bold"
                              >
                                Administrar casos en formulario
                              </button>
                            </div>

                            {loadingCasesFor === d.id ? (
                              <div className="p-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                                <div className="size-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                                <span>Cargando motivos atendidos...</span>
                              </div>
                            ) : casesCount === 0 ? (
                              <div className="p-4 rounded-lg border border-dashed border-border text-center text-xs text-muted-foreground">
                                Este departamento aún no tiene casos configurados. Puedes hacer clic
                                en "Editar" para agregarlos y entrenar a la IA.
                              </div>
                            ) : (
                              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                {cases.map((c, i) => (
                                  <div
                                    key={c.id ?? i}
                                    className="p-3 rounded-lg border border-border bg-card shadow-xs space-y-1.5"
                                  >
                                    <div className="flex items-center justify-between gap-1.5">
                                      <span className="font-bold text-xs text-foreground truncate">
                                        {c.label}
                                      </span>
                                      <span
                                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 ${
                                          c.handlingMode === "human_direct"
                                            ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                                            : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                                        }`}
                                      >
                                        {c.handlingMode === "human_direct" ? (
                                          <>
                                            <UserCheck className="size-2.5" /> Directo
                                          </>
                                        ) : (
                                          <>
                                            <Bot className="size-2.5" /> IA
                                          </>
                                        )}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground line-clamp-2">
                                      {c.description || "Sin descripción"}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

