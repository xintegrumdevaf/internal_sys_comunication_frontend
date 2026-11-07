import { useMemo, useState, useEffect, useCallback } from "react";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { useDepartmentsQuery } from "@/modules/identity/application/use-session";
import { useDepartmentsAdmin } from "@/modules/identity/application/use-departments-admin";
import type {
  Department,
  DepartmentCase,
  DepartmentHandlingMode,
} from "@/modules/identity/domain/department";
import { DepartmentCasesBulkImportModal } from "./DepartmentCasesBulkImportModal";
import { DepartmentsTable } from "./DepartmentsTable";
import { DepartmentWorkspace, type DepartmentFormState } from "./DepartmentWorkspace";
import { DepartmentsMetricsHeader } from "./DepartmentsMetricsHeader";
import { MOCK_FACTURACION_CASES } from "@/modules/identity/domain/department-mocks";
import type { CaseItemForm } from "./DepartmentCaseFormCard";

const emptyForm: DepartmentFormState = {
  name: "",
  slug: "",
  description: "",
  visibility: "shared",
  maxConcurrentCases: 6,
  cases: [],
};

function toAutoSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function toCaseItemForms(cases: DepartmentCase[]): CaseItemForm[] {
  return cases.map((c) => ({
    id: c.id,
    label: c.label,
    description: c.description,
    handlingMode: c.handlingMode,
    workflowType: c.workflowType,
    active: c.active,
  }));
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
  const [form, setForm] = useState<DepartmentFormState>(emptyForm);
  const [deletedCaseIds, setDeletedCaseIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [autoSlugEnabled, setAutoSlugEnabled] = useState(true);

  const [casesCache, setCasesCache] = useState<Record<string, DepartmentCase[]>>({});

  const [bulkImportTarget, setBulkImportTarget] = useState<{
    targetType: "department" | "form";
    deptId?: string;
    deptName?: string;
    deptSlug?: string;
    existingCasesCount?: number;
  } | null>(null);

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

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDeletedCaseIds([]);
    setAutoSlugEnabled(true);
    setFormOpen(true);
  };

  const openEdit = useCallback(
    (deptId: string) => {
      const dept = departments.find((d) => d.id === deptId);
      if (!dept) return;
      setEditingId(deptId);
      setDeletedCaseIds([]);

      const isBilling = dept.slug === "billing" || dept.name.toLowerCase().includes("factur");
      let initialCases: CaseItemForm[] = casesCache[deptId]
        ? toCaseItemForms(casesCache[deptId])
        : isBilling
          ? toCaseItemForms(MOCK_FACTURACION_CASES)
          : dept.cases && dept.cases.length > 0
            ? toCaseItemForms(dept.cases)
            : [];

      setForm({
        name: dept.name,
        slug: dept.slug,
        description: dept.description ?? "",
        visibility: dept.visibility,
        maxConcurrentCases: dept.maxConcurrentCases ?? 6,
        cases: initialCases,
      });
      setAutoSlugEnabled(false);
      setFormOpen(true);

      // Si no tiene casos cacheados y no es billing, consultar en background
      if (initialCases.length === 0 && !isBilling) {
        void getDepartmentCases(deptId).then((fetched) => {
          if (fetched && fetched.length > 0) {
            setCasesCache((prev) => ({ ...prev, [deptId]: fetched }));
            setForm((prev) => (prev.name === dept.name ? { ...prev, cases: toCaseItemForms(fetched) } : prev));
          }
        });
      }
    },
    [departments, casesCache, getDepartmentCases],
  );

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setDeletedCaseIds([]);
    setForm(emptyForm);
  };

  const openBulkImportForForm = () => {
    setBulkImportTarget({
      targetType: "form",
      deptId: editingId ?? undefined,
      deptName: form.name.trim() || (editingId ? "Departamento actual" : "Nuevo Departamento"),
      deptSlug: form.slug.trim(),
      existingCasesCount: form.cases.length,
    });
  };

  const handleImportCases = async (
    newCases: Array<{
      label: string;
      description: string;
      handlingMode: DepartmentHandlingMode;
      workflowType?: string;
      active?: boolean;
    }>,
    strategy: "append" | "replace",
  ) => {
    if (!bulkImportTarget) return;

    if (bulkImportTarget.targetType === "form") {
      if (strategy === "replace") {
        const ids = form.cases.filter((c) => c.id).map((c) => c.id!);
        if (ids.length > 0) setDeletedCaseIds((prev) => [...prev, ...ids]);
        setForm((prev) => ({
          ...prev,
          cases: newCases.map((c) => ({ ...c, active: c.active ?? true })),
        }));
      } else {
        setForm((prev) => ({
          ...prev,
          cases: [...prev.cases, ...newCases.map((c) => ({ ...c, active: c.active ?? true }))],
        }));
      }
      toast.success(`${newCases.length} casos importados al formulario. Guarda para confirmar.`);
      setBulkImportTarget(null);
    }
  };

  const handleAddCase = useCallback(() => {
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
  }, []);

  const handleUpdateCase = useCallback((index: number, patch: Partial<CaseItemForm>) => {
    setForm((prev) => {
      const nextCases = [...prev.cases];
      nextCases[index] = { ...nextCases[index], ...patch };
      return { ...prev, cases: nextCases };
    });
  }, []);

  const handleRemoveCase = useCallback((index: number) => {
    setForm((prev) => {
      const target = prev.cases[index];
      if (target?.id) setDeletedCaseIds((ids) => [...ids, target.id!]);
      return { ...prev, cases: prev.cases.filter((_, i) => i !== index) };
    });
  }, []);

  const canSubmit = form.name.trim().length > 0 && form.slug.trim().length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    const payloadCases = form.cases.map((c) => ({
      id: c.id,
      label: c.label.trim() || "Sin nombre",
      description: c.description.trim(),
      handlingMode: c.handlingMode,
      workflowType: c.workflowType || "GENERAL_INQUIRY",
      active: c.active ?? true,
    }));

    if (editingId) {
      const ok = await updateDepartment(editingId, {
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim(),
        visibility: form.visibility,
        maxConcurrentCases: form.maxConcurrentCases,
        cases: payloadCases,
      });
      if (ok) {
        try {
          const refreshed = await getDepartmentCases(editingId);
          setCasesCache((prev) => ({ ...prev, [editingId]: refreshed || [] }));
        } catch {
          // Ignorar
        }
        closeForm();
      }
    } else {
      const ok = await createDepartment({
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim(),
        visibility: form.visibility,
        maxConcurrentCases: form.maxConcurrentCases,
        cases: payloadCases,
      });
      if (ok) closeForm();
    }
  };

  const toggleActive = async (deptId: string, currentActive: boolean) => {
    if (currentActive) await deactivateDepartment(deptId);
    else await reactivateDepartment(deptId);
  };

  return (
    <div className="space-y-5 w-full">
      {/* Vista de Workspace Unificado a pantalla completa */}
      {formOpen ? (
        <DepartmentWorkspace
          editingId={editingId}
          form={form}
          busy={busy}
          canSubmit={canSubmit}
          autoSlugEnabled={autoSlugEnabled}
          onFormChange={setForm}
          onToggleAutoSlug={setAutoSlugEnabled}
          onSubmit={() => void handleSubmit()}
          onCancel={closeForm}
          onOpenBulkImport={openBulkImportForForm}
          onAddCase={handleAddCase}
          onUpdateCase={handleUpdateCase}
          onRemoveCase={handleRemoveCase}
          onLoadMockCases={() => {
            setForm((prev) => ({
              ...prev,
              cases: toCaseItemForms(MOCK_FACTURACION_CASES),
            }));
            toast.success("33 casos de prueba cargados en el workspace.");
          }}
        />
      ) : (
        /* Vista de Directorio y Métricas */
        <div className="space-y-5 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-foreground">
                Departamentos y Áreas
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Estructura operativa de la organización. Configura los motivos que atiende cada área
                para el enrutamiento inteligente con IA o transferencia directa.
              </p>
            </div>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-all shadow-xs cursor-pointer self-start sm:self-auto shrink-0"
            >
              <Plus className="size-4" />
              Nuevo departamento
            </button>
          </div>

          {departments.length > 0 && (
            <DepartmentsMetricsHeader departments={departments} casesCache={casesCache} />
          )}

          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar departamento por nombre, slug o descripción..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-card text-xs outline-none focus:ring-2 focus:ring-primary/20 shadow-xs"
            />
          </div>

          {departments.length === 0 ? (
            <div className="rounded-xl border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
              Sin departamentos — crea el primero con el botón "Nuevo departamento".
            </div>
          ) : filteredDepartments.length === 0 ? (
            <div className="rounded-xl border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
              Ningún departamento coincide con la búsqueda.
            </div>
          ) : (
            <DepartmentsTable
              departments={filteredDepartments}
              casesCache={casesCache}
              busy={busy}
              selectedDeptId={editingId}
              onViewCases={(dept) => openEdit(dept.id)}
              onEdit={(id) => openEdit(id)}
              onToggleActive={(id, act) => void toggleActive(id, act)}
            />
          )}
        </div>
      )}

      <DepartmentCasesBulkImportModal
        open={Boolean(bulkImportTarget)}
        onClose={() => setBulkImportTarget(null)}
        departmentName={bulkImportTarget?.deptName}
        departmentSlug={bulkImportTarget?.deptSlug}
        existingCasesCount={bulkImportTarget?.existingCasesCount ?? 0}
        onImport={handleImportCases}
      />
    </div>
  );
}
