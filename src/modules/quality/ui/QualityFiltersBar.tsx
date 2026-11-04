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
  const activeSemaforo: "ALL" | "CORDIAL" | "ATTENTION" | "CRITICAL" =
    filters.maxScore === "39"
      ? "CRITICAL"
      : filters.minScore === "70"
        ? "CORDIAL"
        : filters.minScore === "40" && filters.maxScore === "69"
          ? "ATTENTION"
          : "ALL";

  const handleSemaforoSelect = (mode: "ALL" | "CORDIAL" | "ATTENTION" | "CRITICAL") => {
    switch (mode) {
      case "CORDIAL":
        setFilters((prev) => ({ ...prev, minScore: "70", maxScore: "" }));
        break;
      case "ATTENTION":
        setFilters((prev) => ({ ...prev, minScore: "40", maxScore: "69" }));
        break;
      case "CRITICAL":
        setFilters((prev) => ({ ...prev, minScore: "", maxScore: "39" }));
        break;
      case "ALL":
      default:
        setFilters((prev) => ({ ...prev, minScore: "", maxScore: "" }));
        break;
    }
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

        {/* Filtro Semáforo */}
        <div className="flex items-center p-0.5 rounded-lg border border-border bg-background/80 shadow-2xs">
          <button
            type="button"
            onClick={() => handleSemaforoSelect("ALL")}
            className={`h-8 px-2.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
              activeSemaforo === "ALL"
                ? "bg-card text-foreground shadow-2xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Todos
          </button>
          <button
            type="button"
            onClick={() => handleSemaforoSelect("CORDIAL")}
            className={`h-8 px-2.5 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSemaforo === "CORDIAL"
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Valoración cordial (≥ 70)"
          >
            <span className="size-2 rounded-full bg-emerald-500 inline-block" />
            <span>≥70 Cordiales</span>
          </button>
          <button
            type="button"
            onClick={() => handleSemaforoSelect("ATTENTION")}
            className={`h-8 px-2.5 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSemaforo === "ATTENTION"
                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Requiere atención (40 a 69)"
          >
            <span className="size-2 rounded-full bg-amber-500 inline-block" />
            <span>40–69 Atención</span>
          </button>
          <button
            type="button"
            onClick={() => handleSemaforoSelect("CRITICAL")}
            className={`h-8 px-2.5 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSemaforo === "CRITICAL"
                ? "bg-danger/15 text-danger border border-danger/30 font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Valoración crítica (< 40)"
          >
            <span className="size-2 rounded-full bg-danger inline-block" />
            <span>&lt;40 Críticos</span>
            {criticalCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-danger text-white">
                {criticalCount}
              </span>
            )}
          </button>
        </div>

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

