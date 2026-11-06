import { useState, useMemo } from "react";
import { Users, ChevronLeft, ChevronRight, ArrowUpDown, Search, X } from "lucide-react";
import type { AgentPerformanceDto } from "../domain/analytics.types";
import { AgentPerformanceTableRow } from "./AgentPerformanceTableRow";

interface AgentPerformanceTableProps {
  agents: AgentPerformanceDto[];
  isLoading?: boolean;
}

type SortField =
  | "agentName"
  | "activeCasesNow"
  | "casesAssigned"
  | "unattendedActiveCases"
  | "avgFirstResponseTimeMs"
  | "avgHandlingTimeMinutes"
  | "fcrRatePercentage"
  | "avgCordialityScore";

export function AgentPerformanceTable({ agents, isLoading }: AgentPerformanceTableProps) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("activeCasesNow");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder(field === "agentName" ? "asc" : "desc");
    }
    setPage(1);
  };

  // Filtrado y ordenamiento de agentes
  const filteredAndSortedAgents = useMemo(() => {
    let result = [...agents];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.agentName.toLowerCase().includes(q) ||
          (a.primaryDepartmentName && a.primaryDepartmentName.toLowerCase().includes(q)),
      );
    }
    result.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      if (aVal === null || aVal === undefined) aVal = sortOrder === "asc" ? Infinity : -Infinity;
      if (bVal === null || bVal === undefined) bVal = sortOrder === "asc" ? Infinity : -Infinity;
      if (typeof aVal === "string") {
        return sortOrder === "asc"
          ? aVal.localeCompare(String(bVal))
          : String(bVal).localeCompare(aVal);
      }
      return sortOrder === "asc" ? Number(aVal) - Number(bVal) : Number(bVal) - Number(aVal);
    });
    return result;
  }, [agents, search, sortBy, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedAgents.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedAgents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedAgents.slice(start, start + pageSize);
  }, [filteredAndSortedAgents, currentPage, pageSize]);

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-5 shadow-xs animate-pulse">
        <div className="h-6 w-48 bg-muted rounded-md mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-muted/60 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const startEntry = filteredAndSortedAgents.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endEntry = Math.min(currentPage * pageSize, filteredAndSortedAgents.length);

  return (
    <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs overflow-hidden flex flex-col">
      {/* Cabecera y Barra de Filtro/Búsqueda */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Users className="size-4 text-primary" />
          <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-foreground">
            Rendimiento y Saturación del Equipo ({agents.length} agentes)
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {/* Input de Búsqueda Rápida */}
          <div className="relative w-full sm:w-56">
            <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar agente o área..."
              className="w-full pl-8 pr-7 py-1 text-xs rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-3" />
              </button>
            )}
          </div>

          {/* Selector de Tamaño de Página */}
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="px-2 py-1 text-xs font-semibold rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shrink-0"
            title="Filas por página"
          >
            <option value={5}>5 / pág</option>
            <option value={8}>8 / pág</option>
            <option value={15}>15 / pág</option>
            <option value={30}>30 / pág</option>
          </select>
        </div>
      </div>

      {/* Tabla con Headers Ordenables */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border bg-background/80 text-[10px] font-bold uppercase tracking-wider text-muted-foreground select-none">
              <th
                className="py-2.5 px-3 cursor-pointer hover:text-foreground"
                onClick={() => handleSort("agentName")}
              >
                <div className="flex items-center gap-1">
                  <span>Agente</span>
                  <ArrowUpDown className="size-3 opacity-60" />
                </div>
              </th>
              <th className="py-2.5 px-3">Rol</th>
              <th
                className="py-2.5 px-3 cursor-pointer hover:text-foreground"
                onClick={() => handleSort("activeCasesNow")}
              >
                <div className="flex items-center gap-1">
                  <span>Carga en Vivo</span>
                  <ArrowUpDown className="size-3 opacity-60" />
                </div>
              </th>
              <th
                className="py-2.5 px-3 cursor-pointer hover:text-foreground"
                title="Casos asignados en el período"
                onClick={() => handleSort("casesAssigned")}
              >
                <div className="flex items-center gap-1">
                  <span>Asignados</span>
                  <ArrowUpDown className="size-3 opacity-60" />
                </div>
              </th>
              <th
                className="py-2.5 px-3 cursor-pointer hover:text-foreground"
                title="Casos asignados activos donde el cliente espera respuesta"
                onClick={() => handleSort("unattendedActiveCases")}
              >
                <div className="flex items-center gap-1">
                  <span>Desatendidos</span>
                  <ArrowUpDown className="size-3 opacity-60" />
                </div>
              </th>
              <th
                className="py-2.5 px-3 cursor-pointer hover:text-foreground"
                title="Tiempo de Primera Respuesta: cuánto demora el asesor en enviar el primer mensaje al cliente"
                onClick={() => handleSort("avgFirstResponseTimeMs")}
              >
                <div className="flex items-center gap-1">
                  <span>1ª Respuesta</span>
                  <ArrowUpDown className="size-3 opacity-60" />
                </div>
              </th>
              <th
                className="py-2.5 px-3 cursor-pointer hover:text-foreground"
                title="Tiempo Medio de Atención: duración promedio para atender y resolver cada caso"
                onClick={() => handleSort("avgHandlingTimeMinutes")}
              >
                <div className="flex items-center gap-1">
                  <span>Duración Media</span>
                  <ArrowUpDown className="size-3 opacity-60" />
                </div>
              </th>
              <th
                className="py-2.5 px-3 cursor-pointer hover:text-foreground"
                title="Efectividad en 48 horas: porcentaje de casos resueltos sin que el cliente vuelva a reiterar su queja"
                onClick={() => handleSort("fcrRatePercentage")}
              >
                <div className="flex items-center gap-1">
                  <span>Efectividad (48h)</span>
                  <ArrowUpDown className="size-3 opacity-60" />
                </div>
              </th>
              <th
                className="py-2.5 px-3 cursor-pointer hover:text-foreground"
                title="Score de cordialidad y empatía auditado por supervisión (0 a 100 puntos)"
                onClick={() => handleSort("avgCordialityScore")}
              >
                <div className="flex items-center gap-1">
                  <span>Cordialidad</span>
                  <ArrowUpDown className="size-3 opacity-60" />
                </div>
              </th>
              <th className="py-2.5 px-3 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginatedAgents.map((agent) => (
              <AgentPerformanceTableRow key={agent.agentId} agent={agent} />
            ))}

            {paginatedAgents.length === 0 && (
              <tr>
                <td colSpan={10} className="py-8 text-center text-xs text-muted-foreground">
                  {search
                    ? `No se encontraron agentes que coincidan con "${search}".`
                    : "No hay datos de rendimiento para los filtros seleccionados."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Controles de Paginación */}
      <div className="mt-3 pt-3 border-t border-border flex flex-wrap items-center justify-between gap-3 text-xs">
        <p className="text-muted-foreground">
          Mostrando <span className="font-bold text-foreground">{startEntry}</span> a{" "}
          <span className="font-bold text-foreground">{endEntry}</span> de{" "}
          <span className="font-bold text-foreground">{filteredAndSortedAgents.length}</span>{" "}
          asesores
        </p>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border bg-background hover:bg-foreground/5 text-muted-foreground hover:text-foreground font-semibold disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
          >
            <ChevronLeft className="size-3.5" />
            <span className="hidden sm:inline">Anterior</span>
          </button>

          <span className="px-2 py-1 text-xs font-mono font-bold text-foreground">
            {currentPage} / {totalPages}
          </span>

          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border bg-background hover:bg-foreground/5 text-muted-foreground hover:text-foreground font-semibold disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
          >
            <span className="hidden sm:inline">Siguiente</span>
            <ChevronRight className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
