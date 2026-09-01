import { useState } from "react";
import { Calendar, Building2, RefreshCw, Filter } from "lucide-react";
import type { AnalyticsFilterParams, DateRangePreset } from "../domain/analytics.types";
import { calculatePresetDates } from "../domain/analytics.types";
import { useDepartmentsQuery, useSession } from "@/modules/identity/application/use-session";

interface AnalyticsFilterBarProps {
  filters: AnalyticsFilterParams;
  onFilterChange: (newFilters: AnalyticsFilterParams) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function AnalyticsFilterBar({
  filters,
  onFilterChange,
  onRefresh,
  isRefreshing = false,
}: AnalyticsFilterBarProps) {
  const session = useSession();
  const { data: departments = [] } = useDepartmentsQuery();

  const [activePreset, setActivePreset] = useState<DateRangePreset>("30d");
  const [customFrom, setCustomFrom] = useState(filters.from?.slice(0, 16) || "");
  const [customTo, setCustomTo] = useState(filters.to?.slice(0, 16) || "");
  const [showCustomRange, setShowCustomRange] = useState(false);

  // Filtrar departamentos según rol del usuario
  const availableDepartments = departments.filter((d) => {
    if (!d.active) return false;
    if (session?.role === "admin") return true;
    if (session?.role === "manager") {
      const allowedIds = session.departmentIds?.length
        ? session.departmentIds
        : session.primaryDepartmentId
          ? [session.primaryDepartmentId]
          : [];
      return allowedIds.includes(d.id);
    }
    return false;
  });

  const handlePresetClick = (preset: DateRangePreset) => {
    setActivePreset(preset);
    if (preset === "custom") {
      setShowCustomRange(true);
      return;
    }
    setShowCustomRange(false);
    const { from, to } = calculatePresetDates(preset);
    onFilterChange({
      ...filters,
      from,
      to,
    });
  };

  const handleApplyCustomRange = () => {
    if (!customFrom || !customTo) return;
    const fromIso = new Date(customFrom).toISOString();
    const toIso = new Date(customTo).toISOString();
    onFilterChange({
      ...filters,
      from: fromIso,
      to: toIso,
    });
  };

  const handleDepartmentChange = (deptId: string) => {
    onFilterChange({
      ...filters,
      departmentId: deptId === "all" ? undefined : deptId,
    });
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-3.5 sm:p-4 shadow-xs flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Presets de Fecha */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mr-1 flex items-center gap-1.5">
            <Calendar className="size-3.5 text-primary" /> Rango:
          </span>

          <button
            type="button"
            onClick={() => handlePresetClick("today")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activePreset === "today"
                ? "bg-primary text-primary-foreground shadow-xs font-bold ring-1 ring-primary/30"
                : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            Hoy
          </button>

          <button
            type="button"
            onClick={() => handlePresetClick("7d")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activePreset === "7d"
                ? "bg-primary text-primary-foreground shadow-xs font-bold ring-1 ring-primary/30"
                : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            Últimos 7 días
          </button>

          <button
            type="button"
            onClick={() => handlePresetClick("30d")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activePreset === "30d"
                ? "bg-primary text-primary-foreground shadow-xs font-bold ring-1 ring-primary/30"
                : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            Últimos 30 días
          </button>

          <button
            type="button"
            onClick={() => handlePresetClick("custom")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activePreset === "custom"
                ? "bg-primary text-primary-foreground shadow-xs font-bold ring-1 ring-primary/30"
                : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            Personalizado
          </button>
        </div>

        {/* Selector de Departamento y Refrescar */}
        <div className="flex items-center gap-2.5 flex-wrap ml-auto">
          <div className="flex items-center gap-2">
            <Building2 className="size-3.5 text-muted-foreground shrink-0" />
            <select
              value={filters.departmentId || "all"}
              onChange={(e) => handleDepartmentChange(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              {session?.role === "admin" && (
                <option value="all">🏢 Toda la empresa (Global)</option>
              )}
              {availableDepartments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Actualizar métricas"
              className="p-2 rounded-xl border border-border bg-background hover:bg-foreground/5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`size-3.5 ${isRefreshing ? "animate-spin text-primary" : ""}`} />
            </button>
          )}
        </div>
      </div>

      {/* Rango Personalizado desplegable */}
      {showCustomRange && (
        <div className="pt-2 border-t border-border/60 flex flex-wrap items-center gap-3 animate-fade-down text-xs">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground font-medium">Desde:</span>
            <input
              type="datetime-local"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-muted-foreground font-medium">Hasta:</span>
            <input
              type="datetime-local"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs"
            />
          </div>

          <button
            type="button"
            onClick={handleApplyCustomRange}
            disabled={!customFrom || !customTo}
            className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wide hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-40"
          >
            Aplicar Rango
          </button>
        </div>
      )}
    </div>
  );
}
