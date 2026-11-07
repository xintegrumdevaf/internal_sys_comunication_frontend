import React, { memo } from "react";
import { Bot, Trash2, UserCheck } from "lucide-react";
import type { DepartmentHandlingMode } from "@/modules/identity/domain/department";

export type CaseItemForm = {
  id?: string;
  label: string;
  description: string;
  handlingMode: DepartmentHandlingMode;
  workflowType?: string;
  active?: boolean;
};

interface DepartmentCaseFormCardProps {
  index: number;
  caseItem: CaseItemForm;
  onUpdate: (index: number, patch: Partial<CaseItemForm>) => void;
  onRemove: (index: number) => void;
}

export const DepartmentCaseFormCard = memo(function DepartmentCaseFormCard({
  index,
  caseItem,
  onUpdate,
  onRemove,
}: DepartmentCaseFormCardProps) {
  return (
    <div className="p-3 sm:p-4 rounded-xl border border-border/80 bg-card/60 space-y-3 shadow-xs transition-colors">
      <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2">
        <div className="flex items-center gap-2">
          <span className="size-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold grid place-items-center">
            {index + 1}
          </span>
          <span className="text-xs font-bold text-foreground">
            {caseItem.label.trim() || `Caso #${index + 1}`}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="p-1 rounded-md text-muted-foreground hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
          title="Eliminar este caso"
          aria-label="Eliminar este caso"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>

      <div className="grid sm:grid-cols-12 gap-3">
        {/* Nombre del caso */}
        <div className="sm:col-span-5 space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
            Nombre del Caso
          </label>
          <input
            value={caseItem.label}
            onChange={(e) => onUpdate(index, { label: e.target.value })}
            placeholder="Ej: Cancelación de Contrato"
            className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-xs outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Tipo de atención */}
        <div className="sm:col-span-7 space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            <span>Tipo de Atención</span>
            <span className="text-[9px] lowercase text-muted-foreground font-normal">
              {caseItem.handlingMode === "ai_assisted"
                ? "IA responde primero"
                : "Pasa directo a humano"}
            </span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onUpdate(index, { handlingMode: "ai_assisted" })}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-left text-[11px] font-medium transition-all cursor-pointer ${
                caseItem.handlingMode === "ai_assisted"
                  ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                  : "border-border bg-background text-muted-foreground hover:bg-muted/40"
              }`}
            >
              <Bot className="size-3.5 shrink-0" />
              <span className="truncate">🤖 Asistido por IA</span>
            </button>
            <button
              type="button"
              onClick={() => onUpdate(index, { handlingMode: "human_direct" })}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-left text-[11px] font-medium transition-all cursor-pointer ${
                caseItem.handlingMode === "human_direct"
                  ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold shadow-xs"
                  : "border-border bg-background text-muted-foreground hover:bg-muted/40"
              }`}
            >
              <UserCheck className="size-3.5 shrink-0" />
              <span className="truncate">👤 Directo a Humano</span>
            </button>
          </div>
        </div>

        {/* Descripción / Frases del cliente */}
        <div className="sm:col-span-12 space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            <span>¿Cómo lo dice el cliente?</span>
            <span className="text-[10px] text-primary/80 font-normal">
              (Entrenamiento directo para el modelo de IA)
            </span>
          </label>
          <textarea
            rows={2}
            value={caseItem.description}
            onChange={(e) => onUpdate(index, { description: e.target.value })}
            placeholder="Ej: cuando el cliente pide darse de baja, devolver los equipos o cancelar el servicio"
            className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-xs outline-none focus:ring-2 focus:ring-primary/20 resize-y"
          />
        </div>
      </div>
    </div>
  );
});
