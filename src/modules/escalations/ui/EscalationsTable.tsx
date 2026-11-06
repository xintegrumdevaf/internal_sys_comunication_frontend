import { useMemo, useState } from "react";
import { Search, ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import type { EscalationDto } from "@/modules/escalations/domain/escalation";
import { EscalationRowItem } from "./EscalationRowItem";

export type EscalationsTableProps = {
  escalations: EscalationDto[];
  loading: boolean;
  busy: boolean;
  directory: Array<{ id: string; name: string }>;
  departments: Array<{ id: string; name: string }>;
  onOpenSummary: (escalation: EscalationDto) => void;
  onClaim: (escalation: EscalationDto) => void;
};

export function EscalationsTable({
  escalations,
  loading,
  busy,
  directory,
  departments,
  onOpenSummary,
  onClaim,
}: EscalationsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const deptMap = useMemo(() => new Map(departments.map((d) => [d.id, d.name])), [departments]);
  const agentMap = useMemo(() => new Map(directory.map((a) => [a.id, a.name])), [directory]);

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return escalations;
    const term = searchTerm.toLowerCase();
    return escalations.filter((e) => {
      const name = (e.customerName || "").toLowerCase();
      const phone = (e.customerPhone || "").toLowerCase();
      const reason = (e.reason || "").toLowerCase();
      return name.includes(term) || phone.includes(term) || reason.includes(term);
    });
  }, [escalations, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  return (
    <div className="space-y-3">
      {/* Search and table controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar por cliente, teléfono o motivo..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-muted-foreground">
          <span>Mostrando {filtered.length} casos</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground font-medium outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value={10}>10 por pág.</option>
            <option value={20}>20 por pág.</option>
            <option value={50}>50 por pág.</option>
          </select>
        </div>
      </div>

      {/* Tabla responsiva */}
      <section className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-background/80 border-b border-border text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
              <tr>
                <th className="px-4 sm:px-6 py-3">Cliente / Caso</th>
                <th className="px-4 sm:px-6 py-3">Motivo</th>
                <th className="px-4 sm:px-6 py-3">Prioridad & SLA</th>
                <th className="px-4 sm:px-6 py-3">Asignación</th>
                <th className="px-4 sm:px-6 py-3">Antigüedad</th>
                <th className="px-4 sm:px-6 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginated.map((e) => (
                <EscalationRowItem
                  key={e.id}
                  escalation={e}
                  agentName={
                    e.assignedAgentId ? agentMap.get(e.assignedAgentId) || "Agente" : "Sin asignar"
                  }
                  departmentName={
                    e.departmentId ? deptMap.get(e.departmentId) || "Área" : "Sin clasificar"
                  }
                  busy={busy}
                  onOpenSummary={onOpenSummary}
                  onClaim={onClaim}
                />
              ))}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    <div className="max-w-xs mx-auto flex flex-col items-center gap-2">
                      <Inbox className="size-8 text-muted-foreground/50" />
                      <p className="text-sm font-semibold text-foreground">
                        {searchTerm ? "No se encontraron coincidencias" : "Cola despejada"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {searchTerm
                          ? "Intenta con otro término de búsqueda o limpia el filtro."
                          : "No hay casos escalados pendientes con los criterios actuales."}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="px-4 sm:px-6 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground bg-background/50">
            <span>
              Página {currentPage} de {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-border disabled:opacity-40 hover:bg-foreground/5 transition-colors"
                title="Página anterior"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-border disabled:opacity-40 hover:bg-foreground/5 transition-colors"
                title="Página siguiente"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
