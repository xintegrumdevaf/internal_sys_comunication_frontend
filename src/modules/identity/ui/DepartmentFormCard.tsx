import React, { useMemo, useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Plus,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import type { DepartmentVisibility } from "@/modules/identity/domain/department";
import {
  DepartmentCaseFormCard,
  type CaseItemForm,
} from "./DepartmentCaseFormCard";

export type DepartmentFormState = {
  name: string;
  slug: string;
  description: string;
  visibility: DepartmentVisibility;
  maxConcurrentCases: number;
  cases: CaseItemForm[];
};

interface DepartmentFormCardProps {
  editingId: string | null;
  form: DepartmentFormState;
  busy: boolean;
  canSubmit: boolean;
  autoSlugEnabled: boolean;
  onFormChange: (updater: (prev: DepartmentFormState) => DepartmentFormState) => void;
  onToggleAutoSlug: (enabled: boolean) => void;
  onSubmit: () => void;
  onCancel: () => void;
  onOpenBulkImport: () => void;
  onAddCase: () => void;
  onUpdateCase: (index: number, patch: Partial<CaseItemForm>) => void;
  onRemoveCase: (index: number) => void;
}

const CASES_PAGE_SIZE = 8;

export function DepartmentFormCard({
  editingId,
  form,
  busy,
  canSubmit,
  autoSlugEnabled,
  onFormChange,
  onToggleAutoSlug,
  onSubmit,
  onCancel,
  onOpenBulkImport,
  onAddCase,
  onUpdateCase,
  onRemoveCase,
}: DepartmentFormCardProps) {
  const [caseSearch, setCaseSearch] = useState("");
  const [casePage, setCasePage] = useState(1);

  // Filtrado de casos en el formulario para navegación ágil
  const filteredCaseIndices = useMemo(() => {
    const q = caseSearch.trim().toLowerCase();
    return form.cases
      .map((caseItem, originalIndex) => ({ caseItem, originalIndex }))
      .filter(({ caseItem }) => {
        if (!q) return true;
        return (
          caseItem.label.toLowerCase().includes(q) ||
          (caseItem.description && caseItem.description.toLowerCase().includes(q))
        );
      });
  }, [form.cases, caseSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredCaseIndices.length / CASES_PAGE_SIZE));
  const currentPage = Math.min(casePage, totalPages);

  const pagedCaseIndices = useMemo(() => {
    const start = (currentPage - 1) * CASES_PAGE_SIZE;
    return filteredCaseIndices.slice(start, start + CASES_PAGE_SIZE);
  }, [filteredCaseIndices, currentPage]);

  const handleAddCaseAndFocus = () => {
    onAddCase();
    setCaseSearch("");
    // Navegar a la página donde se añade el nuevo caso
    setCasePage(Math.max(1, Math.ceil((form.cases.length + 1) / CASES_PAGE_SIZE)));
  };

  return (
    <div className="rounded-2xl border border-border/80 bg-card/95 backdrop-blur-md p-5 sm:p-6 shadow-xl space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-foreground">
            {editingId ? "Editar Departamento" : "Nuevo Departamento"}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Define el rol operativo y los motivos/casos que resuelve esta área para el enrutamiento
            inteligente.
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          title="Cerrar formulario"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Datos Principales del Departamento */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <label className="text-xs space-y-1.5">
          <span className="font-bold uppercase tracking-wider text-muted-foreground block text-[11px]">
            Nombre del Área
          </span>
          <input
            value={form.name}
            onChange={(e) => onFormChange((f) => ({ ...f, name: e.target.value }))}
            placeholder="Ej: Soporte Técnico"
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
          />
        </label>

        <label className="text-xs space-y-1.5">
          <span className="font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between text-[11px]">
            <span>Slug (identificador)</span>
            {autoSlugEnabled ? (
              <span className="text-[10px] text-primary/80 font-normal">auto</span>
            ) : (
              <button
                type="button"
                onClick={() => onToggleAutoSlug(true)}
                className="text-[10px] text-muted-foreground hover:text-primary underline cursor-pointer"
              >
                auto
              </button>
            )}
          </span>
          <input
            value={form.slug}
            onChange={(e) => {
              onToggleAutoSlug(false);
              onFormChange((f) => ({ ...f, slug: e.target.value }));
            }}
            placeholder="soporte-tecnico"
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono outline-none focus:ring-2 focus:ring-primary/20"
          />
        </label>

        <label className="text-xs space-y-1.5">
          <span className="font-bold uppercase tracking-wider text-muted-foreground block text-[11px]">
            Visibilidad de casos
          </span>
          <select
            value={form.visibility}
            onChange={(e) =>
              onFormChange((f) => ({ ...f, visibility: e.target.value as DepartmentVisibility }))
            }
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
          >
            <option value="shared">Compartida (Visible para todos)</option>
            <option value="restricted">Restringida (Solo agentes de esta área)</option>
          </select>
        </label>

        <label className="text-xs space-y-1.5">
          <span className="font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 text-[11px]">
            Límite Casos / Asesor
          </span>
          <input
            type="number"
            min={1}
            max={50}
            value={form.maxConcurrentCases}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              onFormChange((f) => ({
                ...f,
                maxConcurrentCases: isNaN(val) ? 1 : Math.max(1, Math.min(50, val)),
              }));
            }}
            placeholder="6"
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
          />
        </label>

        {/* Descripción general */}
        <label className="text-xs space-y-1.5 sm:col-span-2 lg:col-span-4">
          <span className="font-bold uppercase tracking-wider text-muted-foreground block text-[11px]">
            Descripción o Rol del Departamento
          </span>
          <textarea
            rows={2}
            value={form.description}
            onChange={(e) => onFormChange((f) => ({ ...f, description: e.target.value }))}
            placeholder="Ej: Área técnica encargada de atender caídas de enlace, lentitud o incidencias de fibra óptica."
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs outline-none focus:ring-2 focus:ring-primary/20 resize-y"
          />
        </label>
      </div>

      {/* Sección de Casos y Solicitudes */}
      <div className="pt-4 border-t border-border/80 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-primary" />
              <span>Casos y Solicitudes que Atiende</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                {form.cases.length}
              </span>
            </h4>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Entrena a la IA para clasificar y enrutar las conversaciones automáticamente a esta
              área según la intención del cliente.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenBulkImport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase hover:bg-emerald-500/20 transition-colors shadow-xs cursor-pointer"
            >
              <FileSpreadsheet className="size-3.5" />
              Carga masiva Excel
            </button>
            <button
              type="button"
              onClick={handleAddCaseAndFocus}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/10 text-primary text-xs font-bold uppercase hover:bg-primary/20 transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="size-3.5" />
              Agregar Motivo/Caso
            </button>
          </div>
        </div>

        {/* Buscador interno de casos en el formulario si hay más de 5 casos */}
        {form.cases.length > 5 && (
          <div className="relative max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
            <input
              type="text"
              value={caseSearch}
              onChange={(e) => {
                setCaseSearch(e.target.value);
                setCasePage(1);
              }}
              placeholder={`Buscar entre los ${form.cases.length} casos...`}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border bg-background text-xs outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        )}

        {form.cases.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center text-xs text-muted-foreground space-y-2">
            <p className="font-semibold text-foreground">Sin casos configurados aún</p>
            <p className="text-[11px] max-w-md mx-auto">
              Agrega al menos un caso (ej. <em>Cancelación de Contrato</em>,{" "}
              <em>Lentitud de Internet</em>) o realiza una carga masiva desde un archivo Excel.
            </p>
            <button
              type="button"
              onClick={onOpenBulkImport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase hover:bg-emerald-500/20 transition-colors shadow-xs cursor-pointer mt-2"
            >
              <FileSpreadsheet className="size-3.5" />
              Importar casos desde Excel
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-3">
              {pagedCaseIndices.map(({ caseItem, originalIndex }) => (
                <DepartmentCaseFormCard
                  key={caseItem.id ?? originalIndex}
                  index={originalIndex}
                  caseItem={caseItem}
                  onUpdate={onUpdateCase}
                  onRemove={onRemoveCase}
                />
              ))}
            </div>

            {/* Paginador interno para no ahogar el DOM */}
            {totalPages > 1 && (
              <div className="pt-2 flex items-center justify-between border-t border-border/40 text-xs text-muted-foreground">
                <span>
                  Mostrando página {currentPage} de {totalPages} ({form.cases.length} casos totales)
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setCasePage((p) => Math.max(1, p - 1))}
                    className="p-1 rounded-md border border-border hover:bg-muted disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft className="size-3.5" />
                  </button>
                  <span className="px-2 font-mono text-[11px]">{currentPage}</span>
                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCasePage((p) => Math.min(totalPages, p + 1))}
                    className="p-1 rounded-md border border-border hover:bg-muted disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronRight className="size-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Botones de acción */}
      <div className="flex items-center gap-2 pt-4 border-t border-border/60">
        <button
          type="button"
          disabled={busy || !canSubmit}
          onClick={onSubmit}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold uppercase disabled:opacity-40 hover:bg-primary/90 transition-colors shadow-xs cursor-pointer"
        >
          {editingId ? "Guardar cambios" : "Crear departamento"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-border text-xs font-bold uppercase hover:bg-foreground/5 transition-colors cursor-pointer"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
