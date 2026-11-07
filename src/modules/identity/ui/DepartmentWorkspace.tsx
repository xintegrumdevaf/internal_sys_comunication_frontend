import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  Bot,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Plus,
  Search,
  Sparkles,
  UserCheck,
  X,
} from "lucide-react";
import { DepartmentCaseFormCard, type CaseItemForm } from "./DepartmentCaseFormCard";
import { DepartmentParamsCard, type DepartmentFormState } from "./DepartmentParamsCard";

export type { DepartmentFormState };

interface DepartmentWorkspaceProps {
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
  onLoadMockCases?: () => void;
}

const CASES_PAGE_SIZE = 10;

export function DepartmentWorkspace({
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
  onLoadMockCases,
}: DepartmentWorkspaceProps) {
  const [caseSearch, setCaseSearch] = useState("");
  const [modeFilter, setModeFilter] = useState<"all" | "ai_assisted" | "human_direct">("all");
  const [casePage, setCasePage] = useState(1);

  const filteredCaseIndices = useMemo(() => {
    const q = caseSearch.trim().toLowerCase();
    return form.cases
      .map((caseItem, originalIndex) => ({ caseItem, originalIndex }))
      .filter(({ caseItem }) => {
        if (modeFilter !== "all" && caseItem.handlingMode !== modeFilter) return false;
        if (!q) return true;
        return (
          caseItem.label.toLowerCase().includes(q) ||
          (caseItem.description && caseItem.description.toLowerCase().includes(q))
        );
      });
  }, [form.cases, caseSearch, modeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredCaseIndices.length / CASES_PAGE_SIZE));
  const currentPage = Math.min(casePage, totalPages);

  const pagedCaseIndices = useMemo(() => {
    const start = (currentPage - 1) * CASES_PAGE_SIZE;
    return filteredCaseIndices.slice(start, start + CASES_PAGE_SIZE);
  }, [filteredCaseIndices, currentPage]);

  const aiCount = useMemo(
    () => form.cases.filter((c) => c.handlingMode === "ai_assisted").length,
    [form.cases],
  );
  const humanCount = useMemo(
    () => form.cases.filter((c) => c.handlingMode === "human_direct").length,
    [form.cases],
  );

  const handleAddCaseAndFocus = () => {
    onAddCase();
    setCaseSearch("");
    setModeFilter("all");
    setCasePage(Math.max(1, Math.ceil((form.cases.length + 1) / CASES_PAGE_SIZE)));
  };

  return (
    <div className="space-y-5 w-full animate-fade-in">
      {/* Barra de Navegación y Acciones del Workspace */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-border/80 bg-card/90 backdrop-blur-md shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-2 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-2xs"
            title="Volver a lista de departamentos"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-foreground">
                {editingId ? (
                  <>
                    <span className="text-muted-foreground font-medium mr-1.5">Área:</span>
                    <span>{form.name || "Sin nombre"}</span>
                  </>
                ) : (
                  "Nuevo Departamento"
                )}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                {editingId ? "Configuración y Casos" : "Creando"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Espacio de trabajo unificado. Modifica los parámetros del área y entrena los motivos
              en tiempo real.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-2 rounded-xl border border-border bg-background hover:bg-muted text-xs font-bold uppercase text-foreground transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={busy || !canSubmit}
            onClick={onSubmit}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider disabled:opacity-40 hover:bg-primary/90 transition-all shadow-xs cursor-pointer"
          >
            {editingId ? "Guardar cambios" : "Crear departamento"}
          </button>
        </div>
      </div>

      {/* Grid de 2 Columnas de Ancho Completo (100% de la pantalla) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full items-start">
        {/* Columna Izquierda: Parámetros del Área (4 de 12 cols / 3 en xl) */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-4 sticky top-4">
          <DepartmentParamsCard
            form={form}
            autoSlugEnabled={autoSlugEnabled}
            aiCount={aiCount}
            humanCount={humanCount}
            onFormChange={onFormChange}
            onToggleAutoSlug={onToggleAutoSlug}
          />
        </div>

        {/* Columna Derecha: Catálogo de Casos y Entrenamiento IA (8 de 12 cols / 9 en xl) */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-4">
          <div className="p-4 sm:p-5 rounded-2xl border border-border/80 bg-card/70 backdrop-blur-xs space-y-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/60">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="size-4 text-primary" />
                  <span>Motivos y Casos que Resuelve ({form.cases.length})</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Entrena a la IA para clasificar y enrutar las conversaciones automáticamente según
                  las frases del cliente.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onOpenBulkImport}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase hover:bg-emerald-500/20 transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="size-3.5" />
                  Carga masiva Excel
                </button>
                <button
                  type="button"
                  onClick={handleAddCaseAndFocus}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-primary/30 bg-primary text-primary-foreground text-xs font-bold uppercase hover:bg-primary/90 transition-all shadow-xs cursor-pointer"
                >
                  <Plus className="size-3.5" />
                  Agregar Motivo/Caso
                </button>
              </div>
            </div>

            {/* Buscador y Filtros Rápidos */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <input
                  type="text"
                  value={caseSearch}
                  onChange={(e) => {
                    setCaseSearch(e.target.value);
                    setCasePage(1);
                  }}
                  placeholder={`Buscar entre los ${form.cases.length} casos por nombre o frase...`}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-background text-xs outline-none focus:ring-2 focus:ring-primary/20"
                />
                {caseSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setCaseSearch("");
                      setCasePage(1);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/60 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setModeFilter("all");
                    setCasePage(1);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    modeFilter === "all"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Todos ({form.cases.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModeFilter("ai_assisted");
                    setCasePage(1);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                    modeFilter === "ai_assisted"
                      ? "bg-primary/15 text-primary font-bold shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Bot className="size-3" />
                  IA ({aiCount})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModeFilter("human_direct");
                    setCasePage(1);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                    modeFilter === "human_direct"
                      ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <UserCheck className="size-3" />
                  Humano ({humanCount})
                </button>
              </div>
            </div>

            {/* Contenido de Casos en Grilla de 2 Columnas */}
            {form.cases.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center text-xs text-muted-foreground space-y-3">
                <Sparkles className="size-8 text-muted-foreground/40 mx-auto" />
                <p className="font-semibold text-foreground text-sm">
                  Sin casos configurados en esta área
                </p>
                <p className="max-w-md mx-auto text-xs leading-relaxed">
                  Agrega motivos de atención manualmente o importa un archivo Excel para entrenar al
                  asistente virtual.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={onOpenBulkImport}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase hover:bg-emerald-500/20 transition-colors cursor-pointer"
                  >
                    <FileSpreadsheet className="size-3.5" />
                    Importar desde Excel
                  </button>
                  {onLoadMockCases && (
                    <button
                      type="button"
                      onClick={onLoadMockCases}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-primary/30 bg-primary/10 text-primary text-xs font-bold uppercase hover:bg-primary/20 transition-colors cursor-pointer"
                    >
                      <Sparkles className="size-3.5" />
                      Cargar 33 casos de prueba (Demo)
                    </button>
                  )}
                </div>
              </div>
            ) : filteredCaseIndices.length === 0 ? (
              <div className="py-16 text-center text-xs text-muted-foreground">
                No se encontraron casos que coincidan con la búsqueda o filtro activo.
              </div>
            ) : (
              <div className="space-y-4">
                {/* Grilla paralela de 2 columnas de casos que aprovecha todo el ancho */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3.5">
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

                {/* Paginador optimizado para navegación veloz */}
                {totalPages > 1 && (
                  <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      Mostrando casos{" "}
                      <span className="font-semibold text-foreground">
                        {(currentPage - 1) * CASES_PAGE_SIZE + 1}
                      </span>{" "}
                      a{" "}
                      <span className="font-semibold text-foreground">
                        {Math.min(currentPage * CASES_PAGE_SIZE, filteredCaseIndices.length)}
                      </span>{" "}
                      de{" "}
                      <span className="font-semibold text-foreground">
                        {filteredCaseIndices.length}
                      </span>{" "}
                      filtrados
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={currentPage <= 1}
                        onClick={() => setCasePage((p) => Math.max(1, p - 1))}
                        className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40 cursor-pointer"
                        title="Página anterior"
                      >
                        <ChevronLeft className="size-3.5" />
                      </button>
                      <span className="px-2 font-mono text-xs font-bold text-foreground">
                        {currentPage} / {totalPages}
                      </span>
                      <button
                        type="button"
                        disabled={currentPage >= totalPages}
                        onClick={() => setCasePage((p) => Math.min(totalPages, p + 1))}
                        className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40 cursor-pointer"
                        title="Página siguiente"
                      >
                        <ChevronRight className="size-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
