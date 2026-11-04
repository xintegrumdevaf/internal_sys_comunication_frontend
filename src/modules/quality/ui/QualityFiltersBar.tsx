import { Clock, Filter, Loader2, ShieldAlert, Sparkles } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { QualityBoardFilters } from "@/modules/quality/application/use-quality-board";
import type { QualityReviewStatus } from "@/modules/quality/domain/quality-review";

interface QualityFiltersBarProps {
  filters: QualityBoardFilters;
  setFilters: React.Dispatch<React.SetStateAction<QualityBoardFilters>>;
  agentOptions: Array<{ id: string; name: string }>;
  departments: Array<{ id: string; name: string }>;
  isAdmin: boolean;
  slaMinutes: number;
  onOpenSlaModal: () => void;
  batchBusy: boolean;
  isAnalyzingAny: boolean;
  onAnalyzePendingChats: () => void;
  analyzeBtnLabel: string;
  criticalCount: number;
}

export function QualityFiltersBar({
  filters,
  setFilters,
  agentOptions,
  departments,
  isAdmin,
  slaMinutes,
  onOpenSlaModal,
  batchBusy,
  isAnalyzingAny,
  onAnalyzePendingChats,
  analyzeBtnLabel,
  criticalCount,
}: QualityFiltersBarProps) {
  const isOnlyCritical = filters.maxScore === "39";

  const toggleOnlyCritical = () => {
    setFilters((prev) => ({
      ...prev,
      maxScore: isOnlyCritical ? "" : "39",
      minScore: "",
    }));
  };

  return (
    <section className="p-3.5 sm:p-4 rounded-xl border border-border bg-card flex flex-wrap gap-3 items-center justify-between shadow-xs">
      <div className="flex flex-wrap gap-2.5 items-center w-full lg:w-auto">
        {/* Selector de Agentes */}
        <div className="w-full sm:w-auto min-w-[170px]">
          <Select
            value={filters.agentId || "ALL"}
            onValueChange={(val) =>
              setFilters((p) => ({ ...p, agentId: val === "ALL" ? "" : val }))
            }
          >
            <SelectTrigger className="h-9 text-xs border-border bg-background">
              <SelectValue placeholder="Todos los agentes" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              <SelectItem value="ALL" className="text-xs">
                Todos los agentes
              </SelectItem>
              {agentOptions.map((a) => (
                <SelectItem key={a.id} value={a.id} className="text-xs">
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Rango Desde */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <span className="text-[10px] font-bold uppercase text-muted-foreground shrink-0">
            Desde:
          </span>
          <input
            type="date"
            value={filters.from}
            onChange={(e) => setFilters((p) => ({ ...p, from: e.target.value }))}
            className="text-xs h-9 px-2.5 border border-border rounded-lg bg-background outline-none focus:ring-2 focus:ring-primary/20 flex-1 sm:flex-initial"
          />
        </div>

        {/* Rango Hasta */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <span className="text-[10px] font-bold uppercase text-muted-foreground shrink-0">
            Hasta:
          </span>
          <input
            type="date"
            value={filters.to}
            onChange={(e) => setFilters((p) => ({ ...p, to: e.target.value }))}
            className="text-xs h-9 px-2.5 border border-border rounded-lg bg-background outline-none focus:ring-2 focus:ring-primary/20 flex-1 sm:flex-initial"
          />
        </div>

        {/* Selector de Áreas (Admin) */}
        {isAdmin && (
          <div className="w-full sm:w-auto min-w-[150px]">
            <Select
              value={filters.departmentId || "ALL"}
              onValueChange={(val) =>
                setFilters((p) => ({ ...p, departmentId: val === "ALL" ? "" : val }))
              }
            >
              <SelectTrigger className="h-9 text-xs border-border bg-background">
                <SelectValue placeholder="Todas las áreas" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <SelectItem value="ALL" className="text-xs">
                  Todas las áreas
                </SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id} className="text-xs">
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Selector de Estado */}
        <div className="w-full sm:w-auto min-w-[150px]">
          <Select
            value={filters.status || "ALL"}
            onValueChange={(val) =>
              setFilters((p) => ({
                ...p,
                status: val === "ALL" ? "" : (val as QualityReviewStatus),
              }))
            }
          >
            <SelectTrigger className="h-9 text-xs border-border bg-background">
              <SelectValue placeholder="Todos los estados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">
                Todos los estados
              </SelectItem>
              <SelectItem value="pending" className="text-xs">
                En curso
              </SelectItem>
              <SelectItem value="ready" className="text-xs">
                Listas para revisar
              </SelectItem>
              <SelectItem value="reviewed" className="text-xs">
                Revisadas
              </SelectItem>
              <SelectItem value="failed" className="text-xs">
                Fallidas
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Toggle Filtro Rápido Críticos */}
        <button
          type="button"
          onClick={toggleOnlyCritical}
          className={`h-9 px-3 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            isOnlyCritical
              ? "border-danger bg-danger/15 text-danger ring-2 ring-danger/20"
              : "border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground"
          }`}
          title="Filtrar únicamente conversaciones con valoración crítica (< 40)"
        >
          <ShieldAlert className="size-3.5 text-danger" />
          <span>Solo críticos</span>
          {criticalCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-danger text-white">
              {criticalCount}
            </span>
          )}
        </button>

        {/* Botón SLA */}
        <button
          type="button"
          onClick={onOpenSlaModal}
          className="h-9 text-xs px-3 rounded-lg border border-primary/30 bg-primary/10 text-primary font-bold hover:bg-primary/20 transition-all flex items-center gap-1.5 cursor-pointer"
          title="Configurar el tiempo límite de respuesta (SLA) para asesores"
        >
          <Clock className="size-3.5" />
          <span>SLA ({slaMinutes}m)</span>
        </button>
      </div>

      {/* Botón Analizar */}
      <button
        type="button"
        disabled={batchBusy || isAnalyzingAny}
        onClick={onAnalyzePendingChats}
        title="Encola hasta 5 casos cerrados recientes sin score (Ollama, uno a uno)"
        className="inline-flex items-center justify-center gap-2 h-9 text-xs px-3.5 rounded-lg border border-primary/40 bg-primary/10 font-bold uppercase hover:bg-primary/20 text-primary transition-colors disabled:opacity-50 w-full lg:w-auto shadow-xs cursor-pointer"
      >
        {batchBusy ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Sparkles className="size-3.5" />
        )}
        <span>{analyzeBtnLabel}</span>
      </button>
    </section>
  );
}
