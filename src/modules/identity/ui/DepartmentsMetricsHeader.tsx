import React from "react";
import { Building2, CheckCircle2, Sparkles, Bot } from "lucide-react";
import type { Department, DepartmentCase } from "@/modules/identity/domain/department";

interface DepartmentsMetricsHeaderProps {
  departments: Department[];
  casesCache: Record<string, DepartmentCase[]>;
}

export function DepartmentsMetricsHeader({
  departments,
  casesCache,
}: DepartmentsMetricsHeaderProps) {
  const totalDepts = departments.length;
  const activeDepts = departments.filter((d) => d.active).length;
  const totalCases = departments.reduce(
    (acc, d) => acc + (d.cases?.length ?? casesCache[d.id]?.length ?? 0),
    0,
  );
  const totalCapacity = departments
    .filter((d) => d.active)
    .reduce((acc, d) => acc + (d.maxConcurrentCases ?? 6), 0);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full">
      <div className="p-3.5 sm:p-4 rounded-xl border border-border/80 bg-card/70 backdrop-blur-xs flex items-center justify-between shadow-xs">
        <div className="space-y-0.5">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
            Áreas Operativas
          </span>
          <div className="text-lg sm:text-xl font-extrabold text-foreground">
            {activeDepts}{" "}
            <span className="text-xs font-normal text-muted-foreground">
              / {totalDepts} activas
            </span>
          </div>
        </div>
        <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
          <Building2 className="size-4 sm:size-5" />
        </div>
      </div>

      <div className="p-3.5 sm:p-4 rounded-xl border border-border/80 bg-card/70 backdrop-blur-xs flex items-center justify-between shadow-xs">
        <div className="space-y-0.5">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
            Casos Catalogados
          </span>
          <div className="text-lg sm:text-xl font-extrabold text-foreground">
            {totalCases}{" "}
            <span className="text-xs font-normal text-muted-foreground">motivos IA/Humano</span>
          </div>
        </div>
        <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
          <Sparkles className="size-4 sm:size-5" />
        </div>
      </div>

      <div className="p-3.5 sm:p-4 rounded-xl border border-border/80 bg-card/70 backdrop-blur-xs flex items-center justify-between shadow-xs">
        <div className="space-y-0.5">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
            Capacidad Instalada
          </span>
          <div className="text-lg sm:text-xl font-extrabold text-foreground">
            {totalCapacity}{" "}
            <span className="text-xs font-normal text-muted-foreground">chats simultáneos</span>
          </div>
        </div>
        <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
          <CheckCircle2 className="size-4 sm:size-5" />
        </div>
      </div>

      <div className="p-3.5 sm:p-4 rounded-xl border border-border/80 bg-card/70 backdrop-blur-xs flex items-center justify-between shadow-xs">
        <div className="space-y-0.5">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
            Clasificación IA
          </span>
          <div className="text-lg sm:text-xl font-extrabold text-foreground">
            Activa{" "}
            <span className="text-xs font-normal text-muted-foreground">enrutamiento n8n</span>
          </div>
        </div>
        <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
          <Bot className="size-4 sm:size-5" />
        </div>
      </div>
    </div>
  );
}

