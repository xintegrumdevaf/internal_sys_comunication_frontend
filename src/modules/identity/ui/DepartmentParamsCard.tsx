import React from "react";
import { Bot, Building2, UserCheck } from "lucide-react";
import type { DepartmentVisibility } from "@/modules/identity/domain/department";
import type { CaseItemForm } from "./DepartmentCaseFormCard";

export interface DepartmentFormState {
  name: string;
  slug: string;
  description: string;
  visibility: DepartmentVisibility;
  maxConcurrentCases: number;
  cases: CaseItemForm[];
}

interface DepartmentParamsCardProps {
  form: DepartmentFormState;
  autoSlugEnabled: boolean;
  aiCount: number;
  humanCount: number;
  onFormChange: (updater: (prev: DepartmentFormState) => DepartmentFormState) => void;
  onToggleAutoSlug: (enabled: boolean) => void;
}

export function DepartmentParamsCard({
  form,
  autoSlugEnabled,
  aiCount,
  humanCount,
  onFormChange,
  onToggleAutoSlug,
}: DepartmentParamsCardProps) {
  return (
    <div className="space-y-4">
      <div className="p-4 sm:p-5 rounded-2xl border border-border/80 bg-card/70 backdrop-blur-xs space-y-4 shadow-xs">
        <div className="flex items-center gap-2 pb-3 border-b border-border/60">
          <Building2 className="size-4 text-primary" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Parámetros del Área
          </h3>
        </div>

        <div className="space-y-3.5">
          <label className="text-xs space-y-1 block">
            <span className="font-bold uppercase tracking-wider text-muted-foreground block text-[10px]">
              Nombre del Área
            </span>
            <input
              value={form.name}
              onChange={(e) => onFormChange((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ej: Soporte Técnico"
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>

          <label className="text-xs space-y-1 block">
            <span className="font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between text-[10px]">
              <span>Slug Técnico</span>
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
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-mono outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>

          <label className="text-xs space-y-1 block">
            <span className="font-bold uppercase tracking-wider text-muted-foreground block text-[10px]">
              Visibilidad de Casos
            </span>
            <select
              value={form.visibility}
              onChange={(e) =>
                onFormChange((f) => ({ ...f, visibility: e.target.value as DepartmentVisibility }))
              }
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option value="shared">Compartida (Visible para todos)</option>
              <option value="restricted">Restringida (Solo agentes del área)</option>
            </select>
          </label>

          <label className="text-xs space-y-1 block">
            <span className="font-bold uppercase tracking-wider text-muted-foreground block text-[10px]">
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
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>

          <label className="text-xs space-y-1 block">
            <span className="font-bold uppercase tracking-wider text-muted-foreground block text-[10px]">
              Descripción o Rol Operativo
            </span>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => onFormChange((f) => ({ ...f, description: e.target.value }))}
              placeholder="Ej: Área técnica encargada de atender caídas de enlace, lentitud o incidencias de fibra óptica."
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs outline-none focus:ring-2 focus:ring-primary/20 resize-y leading-relaxed"
            />
          </label>
        </div>
      </div>

      <div className="p-4 rounded-2xl border border-border/80 bg-card/60 backdrop-blur-xs space-y-2 text-xs shadow-xs">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
          Distribución de Casos
        </span>
        <div className="flex items-center justify-between text-muted-foreground pt-1">
          <span>Total Motivos:</span>
          <span className="font-bold text-foreground font-mono">{form.cases.length}</span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Bot className="size-3 text-primary" /> Asistido por IA:
          </span>
          <span className="font-bold text-primary font-mono">{aiCount}</span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <UserCheck className="size-3 text-amber-500" /> Directo a Humano:
          </span>
          <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">
            {humanCount}
          </span>
        </div>
      </div>
    </div>
  );
}

