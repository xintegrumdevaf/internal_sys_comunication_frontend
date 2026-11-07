import React, { useMemo, useState } from "react";
import {
  Bot,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Layers,
  Search,
  Sparkles,
  UserCheck,
  X,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Department, DepartmentCase } from "@/modules/identity/domain/department";

interface DepartmentCasesDrawerProps {
  open: boolean;
  onClose: () => void;
  department: Department | null;
  cases: DepartmentCase[];
  loading?: boolean;
  onEditDepartment: (deptId: string) => void;
  onBulkImport: (dept: Department) => void;
}

const PAGE_SIZE = 12;

export function DepartmentCasesDrawer({
  open,
  onClose,
  department,
  cases,
  loading = false,
  onEditDepartment,
  onBulkImport,
}: DepartmentCasesDrawerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [modeFilter, setModeFilter] = useState<"all" | "ai_assisted" | "human_direct">("all");
  const [page, setPage] = useState(1);

  // Reset page when filter or search changes
  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setPage(1);
  };

  const handleFilterChange = (filter: "all" | "ai_assisted" | "human_direct") => {
    setModeFilter(filter);
    setPage(1);
  };

  const filteredCases = useMemo(() => {
    let result = cases;
    if (modeFilter !== "all") {
      result = result.filter((c) => c.handlingMode === modeFilter);
    }
    const q = searchTerm.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (c) =>
          c.label.toLowerCase().includes(q) ||
          (c.description && c.description.toLowerCase().includes(q)),
      );
    }
    return result;
  }, [cases, modeFilter, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredCases.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedCases = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredCases.slice(start, start + PAGE_SIZE);
  }, [filteredCases, currentPage]);

  const aiCount = useMemo(() => cases.filter((c) => c.handlingMode === "ai_assisted").length, [cases]);
  const humanCount = useMemo(
    () => cases.filter((c) => c.handlingMode === "human_direct").length,
    [cases],
  );

  if (!department) return null;

  return (
    <Sheet open={open} onOpenChange={(val) => !val && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl md:max-w-3xl p-0 flex flex-col bg-card border-l border-border shadow-2xl h-full"
      >
        {/* Header con título y acciones rápidas */}
        <SheetHeader className="p-4 sm:p-5 border-b border-border bg-background/80 backdrop-blur-md space-y-2.5 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <Sparkles className="size-4" />
              </span>
              <div>
                <SheetTitle className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                  <span>Motivos y Casos que Resuelve ({cases.length})</span>
                </SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground font-mono">
                  Área: <span className="font-semibold text-foreground">{department.name}</span>{" "}
                  ({department.slug})
                </SheetDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onBulkImport(department)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase hover:bg-emerald-500/20 transition-colors shadow-xs cursor-pointer"
                title="Carga masiva Excel"
              >
                <FileSpreadsheet className="size-3.5" />
                <span className="hidden sm:inline">Carga masiva Excel</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditDepartment(department.id);
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-xs font-semibold text-foreground transition-colors cursor-pointer"
              >
                Administrar casos en formulario
              </button>
            </div>
          </div>

          {/* Buscador interno y filtros de modo */}
          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Buscar por motivo, frase o síntoma del cliente..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border bg-background text-xs outline-none focus:ring-2 focus:ring-primary/20"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => handleSearchChange("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 bg-muted/40 p-0.5 rounded-lg border border-border/60 shrink-0">
              <button
                type="button"
                onClick={() => handleFilterChange("all")}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                  modeFilter === "all"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Todos ({cases.length})
              </button>
              <button
                type="button"
                onClick={() => handleFilterChange("ai_assisted")}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
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
                onClick={() => handleFilterChange("human_direct")}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
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
        </SheetHeader>

        {/* Lista de casos paginada y optimizada */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {loading ? (
            <div className="py-16 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
              <div className="size-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <span>Cargando motivos atendidos...</span>
            </div>
          ) : cases.length === 0 ? (
            <div className="p-8 rounded-xl border border-dashed border-border text-center text-xs text-muted-foreground space-y-3">
              <Layers className="size-8 text-muted-foreground/50 mx-auto" />
              <p className="font-semibold text-foreground">
                Este departamento aún no tiene casos configurados.
              </p>
              <p className="max-w-md mx-auto text-[11px]">
                Podés agregarlos manualmente en el formulario de edición o importar un catálogo
                completo desde una plantilla Excel.
              </p>
              <button
                type="button"
                onClick={() => onBulkImport(department)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase hover:bg-emerald-500/20 transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="size-3.5" />
                Carga masiva desde Excel
              </button>
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              No se encontraron casos que coincidan con la búsqueda actual.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-2.5">
              {pagedCases.map((c, i) => (
                <div
                  key={c.id ?? i}
                  className="p-3 rounded-xl border border-border bg-background/70 shadow-xs hover:border-primary/40 transition-colors flex flex-col justify-between gap-2"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="font-bold text-xs text-foreground truncate" title={c.label}>
                        {c.label}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 ${
                          c.handlingMode === "human_direct"
                            ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30"
                            : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
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

                    <p className="text-[11px] text-muted-foreground line-clamp-3 leading-relaxed">
                      {c.description || "Sin descripción configurada."}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer con paginación y botón de cierre */}
        <div className="p-3 sm:p-4 border-t border-border bg-background/80 backdrop-blur-md flex items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-muted-foreground">
            {filteredCases.length > 0 && (
              <span>
                Mostrando{" "}
                <span className="font-semibold text-foreground">
                  {(currentPage - 1) * PAGE_SIZE + 1}
                </span>{" "}
                -{" "}
                <span className="font-semibold text-foreground">
                  {Math.min(currentPage * PAGE_SIZE, filteredCases.length)}
                </span>{" "}
                de <span className="font-semibold text-foreground">{filteredCases.length}</span>{" "}
                casos
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-md border border-border text-foreground hover:bg-muted disabled:opacity-40 transition-colors cursor-pointer"
                  title="Página anterior"
                >
                  <ChevronLeft className="size-3.5" />
                </button>
                <span className="text-xs px-2 font-mono text-muted-foreground">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-md border border-border text-foreground hover:bg-muted disabled:opacity-40 transition-colors cursor-pointer"
                  title="Página siguiente"
                >
                  <ChevronRight className="size-3.5" />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-xs font-semibold text-foreground transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
