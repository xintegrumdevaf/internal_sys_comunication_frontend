import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Users, ChevronRight, Search, ChevronLeft } from "lucide-react";
import type { AgentPerformanceDto } from "@/modules/analytics/domain/analytics.types";
import type { DepartmentDto } from "@/modules/identity/domain/department";
import { normalizeSearchQuery } from "@/modules/conversations/domain/conversation";
import { AgentWorkloadTableRow } from "./AgentWorkloadTableRow";

export type FilterStatus = "all" | "onShift" | "saturated" | "available";

interface AgentWorkloadMonitorProps {
  agentsPerformance: AgentPerformanceDto[];
  departments: DepartmentDto[];
  isLoading?: boolean;
  initialStatusFilter?: FilterStatus;
  initialSearch?: string;
  initialPage?: number;
  initialPageSize?: number;
  onFilterChange?: (filters: {
    status?: FilterStatus;
    search?: string;
    page?: number;
    pageSize?: number;
  }) => void;
}

const STORAGE_KEY_STATUS = "dashboard_agent_status_filter";
const STORAGE_KEY_PAGE_SIZE = "dashboard_agent_pagesize";

export function AgentWorkloadMonitor({
  agentsPerformance,
  departments,
  isLoading,
  initialStatusFilter,
  initialSearch,
  initialPage,
  initialPageSize,
  onFilterChange,
}: AgentWorkloadMonitorProps) {
  // Inicialización con prioridad: URL param > localStorage > default
  const [statusFilter, setStatusFilter] = useState<FilterStatus>(() => {
    if (initialStatusFilter) return initialStatusFilter;
    const saved = localStorage.getItem(STORAGE_KEY_STATUS);
    if (saved === "all" || saved === "onShift" || saved === "saturated" || saved === "available") {
      return saved;
    }
    return "all";
  });

  const [search, setSearch] = useState(() => initialSearch ?? "");
  const [currentPage, setCurrentPage] = useState(() => initialPage ?? 1);
  const [pageSize, setPageSize] = useState(() => {
    if (initialPageSize) return initialPageSize;
    const saved = localStorage.getItem(STORAGE_KEY_PAGE_SIZE);
    return saved ? Number(saved) : 6;
  });

  // Notificar cambios y persistir en localStorage para conservar estado tras recarga (F5)
  const updateFilter = (newStatus: FilterStatus) => {
    setStatusFilter(newStatus);
    setCurrentPage(1);
    localStorage.setItem(STORAGE_KEY_STATUS, newStatus);
    onFilterChange?.({
      status: newStatus,
      search: search || undefined,
      page: 1,
      pageSize,
    });
  };

  const updateSearch = (newSearch: string) => {
    setSearch(newSearch);
    setCurrentPage(1);
    onFilterChange?.({
      status: statusFilter,
      search: newSearch || undefined,
      page: 1,
      pageSize,
    });
  };

  const updatePageSize = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
    localStorage.setItem(STORAGE_KEY_PAGE_SIZE, String(newPageSize));
    onFilterChange?.({
      status: statusFilter,
      search: search || undefined,
      page: 1,
      pageSize: newPageSize,
    });
  };

  const updatePage = (newPage: number) => {
    setCurrentPage(newPage);
    onFilterChange?.({
      status: statusFilter,
      search: search || undefined,
      page: newPage,
      pageSize,
    });
  };

  // Sincronizar si cambian los props externos (navegación o back/forward)
  useEffect(() => {
    if (initialStatusFilter && initialStatusFilter !== statusFilter) {
      setStatusFilter(initialStatusFilter);
    }
  }, [initialStatusFilter, statusFilter]);

  // Contadores para los tabs de filtro
  const { onShiftCount, saturatedCount, availableCount } = useMemo(() => {
    let onShift = 0;
    let saturated = 0;
    let available = 0;

    for (const ag of agentsPerformance) {
      if (ag.autoAssignEnabled) {
        onShift++;
        const maxCap = ag.maxCapacityThreshold || 6;
        const active = ag.activeCasesNow || 0;
        if (active >= maxCap) saturated++;
        else if (active === 0) available++;
      }
    }

    return { onShiftCount: onShift, saturatedCount: saturated, availableCount: available };
  }, [agentsPerformance]);

  // Filtrado y ordenamiento de asesores
  const filteredAgents = useMemo(() => {
    const q = normalizeSearchQuery(search);

    return agentsPerformance
      .filter((ag) => {
        if (statusFilter === "onShift" && !ag.autoAssignEnabled) return false;
        const maxCap = ag.maxCapacityThreshold || 6;
        const active = ag.activeCasesNow || 0;
        if (statusFilter === "saturated" && (!ag.autoAssignEnabled || active < maxCap))
          return false;
        if (statusFilter === "available" && (!ag.autoAssignEnabled || active > 0)) return false;

        if (!q) return true;
        const nameNorm = normalizeSearchQuery(ag.agentName || "");
        const deptNorm = normalizeSearchQuery(
          ag.primaryDepartmentName ||
            departments.find((d) => d.id === ag.primaryDepartmentId)?.name ||
            "",
        );
        return nameNorm.includes(q) || deptNorm.includes(q);
      })
      .sort((a, b) => {
        if (a.autoAssignEnabled !== b.autoAssignEnabled) {
          return a.autoAssignEnabled ? -1 : 1;
        }
        const capA = a.maxCapacityThreshold || 6;
        const capB = b.maxCapacityThreshold || 6;
        const ratioA = (a.activeCasesNow || 0) / capA;
        const ratioB = (b.activeCasesNow || 0) / capB;
        return ratioB - ratioA;
      });
  }, [agentsPerformance, departments, search, statusFilter]);

  // Cálculos de paginación
  const totalPages = Math.max(1, Math.ceil(filteredAgents.length / pageSize));
  const effectivePage = Math.min(currentPage, totalPages);
  const startIndex = (effectivePage - 1) * pageSize;
  const pageAgents = filteredAgents.slice(startIndex, startIndex + pageSize);

  const formatFrt = (ms?: number | null) => {
    if (ms == null || ms <= 0) return "—";
    if (ms < 60000) return `${Math.round(ms / 1000)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-5 shadow-xs animate-pulse">
        <div className="h-6 w-48 bg-muted rounded-md mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 bg-muted/50 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
      {/* Cabecera Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
        <div>
          <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-foreground flex items-center gap-2">
            <Users className="size-4 text-primary" /> Monitor de Carga y Disponibilidad de Asesores
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Ocupación individual en tiempo real, productividad de hoy y atajos directos a la
            bandeja.
          </p>
        </div>
        <Link
          to="/usuarios"
          className="text-xs text-primary hover:underline font-semibold flex items-center gap-1 self-start sm:self-auto shrink-0"
        >
          <span>Directorio completo</span>
          <ChevronRight className="size-3.5" />
        </Link>
      </div>

      {/* Barra de Filtros Rápidos y Buscador */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Pills de Estado con persistencia */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => updateFilter("all")}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === "all"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted/70 text-muted-foreground hover:bg-muted"
            }`}
          >
            Todos ({agentsPerformance.length})
          </button>

          <button
            type="button"
            onClick={() => updateFilter("onShift")}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === "onShift"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted/70 text-muted-foreground hover:bg-muted"
            }`}
          >
            En turno ({onShiftCount})
          </button>

          <button
            type="button"
            onClick={() => updateFilter("saturated")}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
              statusFilter === "saturated"
                ? "bg-rose-600 text-white shadow-xs"
                : "bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20"
            }`}
          >
            <span>Saturados ({saturatedCount})</span>
          </button>

          <button
            type="button"
            onClick={() => updateFilter("available")}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
              statusFilter === "available"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
            }`}
          >
            <span>Disponibles ({availableCount})</span>
          </button>
        </div>

        {/* Buscador de Asesor */}
        <div className="relative min-w-[220px] sm:min-w-[280px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => updateSearch(e.target.value)}
            placeholder="Buscar asesor o departamento..."
            className="w-full pl-9 pr-3 py-1.5 bg-background border border-border rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60 transition-all"
          />
        </div>
      </div>

      {/* Tabla Paginada de Asesores */}
      <div className="overflow-x-auto border border-border/60 rounded-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-muted/40">
            <tr className="border-b border-border text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider">
              <th className="py-2.5 px-3.5 font-bold">Asesor</th>
              <th className="py-2.5 px-3 font-bold">Área Principal</th>
              <th className="py-2.5 px-3 font-bold">Turno</th>
              <th className="py-2.5 px-3 font-bold min-w-[160px]">Ocupación (Activos / Cupo)</th>
              <th className="py-2.5 px-3 font-bold text-center">Cerrados Hoy</th>
              <th className="py-2.5 px-3 font-bold text-center">Velocidad (FRT)</th>
              <th className="py-2.5 px-3 font-bold text-center">Alerta / Estado</th>
              <th className="py-2.5 px-3.5 font-bold text-right">Atajo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {pageAgents.map((ag) => (
              <AgentWorkloadTableRow
                key={ag.agentId}
                ag={ag}
                departments={departments}
                formatFrt={formatFrt}
              />
            ))}

            {pageAgents.length === 0 && (
              <tr>
                <td colSpan={8} className="py-12 text-center text-xs text-muted-foreground">
                  No se encontraron asesores que coincidan con el filtro o búsqueda seleccionada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Controles de Paginación */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>
            Mostrando{" "}
            <span className="font-bold text-foreground">
              {filteredAgents.length === 0 ? 0 : startIndex + 1}
            </span>{" "}
            a{" "}
            <span className="font-bold text-foreground">
              {Math.min(startIndex + pageSize, filteredAgents.length)}
            </span>{" "}
            de <span className="font-bold text-foreground">{filteredAgents.length}</span> asesores
          </span>

          <select
            value={pageSize}
            onChange={(e) => updatePageSize(Number(e.target.value))}
            className="ml-2 px-2 py-1 rounded-lg border border-border bg-background text-xs font-mono outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value={5}>5 por pág.</option>
            <option value={6}>6 por pág.</option>
            <option value={10}>10 por pág.</option>
            <option value={20}>20 por pág.</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={effectivePage <= 1}
            onClick={() => updatePage(Math.max(1, effectivePage - 1))}
            className="p-1.5 rounded-lg border border-border bg-background hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            title="Página anterior"
          >
            <ChevronLeft className="size-4" />
          </button>

          <span className="px-2 font-mono text-[11px] font-bold">
            Página {effectivePage} de {totalPages}
          </span>

          <button
            type="button"
            disabled={effectivePage >= totalPages}
            onClick={() => updatePage(Math.min(totalPages, effectivePage + 1))}
            className="p-1.5 rounded-lg border border-border bg-background hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            title="Página siguiente"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
