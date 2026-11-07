import React from "react";
import {
  ChevronRight,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { Department, DepartmentCase } from "@/modules/identity/domain/department";
import { departmentVisibilityLabel } from "@/modules/identity/domain/department";

interface DepartmentsTableProps {
  departments: Department[];
  casesCache: Record<string, DepartmentCase[]>;
  busy: boolean;
  selectedDeptId: string | null;
  onViewCases: (dept: Department) => void;
  onEdit: (deptId: string) => void;
  onToggleActive: (deptId: string, currentActive: boolean) => void;
}

export function DepartmentsTable({
  departments,
  casesCache,
  busy,
  selectedDeptId,
  onViewCases,
  onEdit,
  onToggleActive,
}: DepartmentsTableProps) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-border bg-background/70 text-[10px] uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-3 py-3 font-extrabold w-8"></th>
              <th className="px-4 py-3 font-extrabold">Nombre</th>
              <th className="px-4 py-3 font-extrabold">Slug</th>
              <th className="px-4 py-3 font-extrabold">Visibilidad</th>
              <th className="px-4 py-3 font-extrabold">Casos Atendidos</th>
              <th className="px-4 py-3 font-extrabold">Capacidad</th>
              <th className="px-4 py-3 font-extrabold">Estado</th>
              <th className="px-4 py-3 font-extrabold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {departments.map((d) => {
              const cases = d.cases ?? casesCache[d.id] ?? [];
              const casesCount = cases.length;
              const isSelected = selectedDeptId === d.id;

              return (
                <tr
                  key={d.id}
                  className={`group transition-colors hover:bg-muted/40 ${
                    isSelected ? "bg-primary/5" : ""
                  }`}
                >
                  {/* Botón de inspeccionar casos */}
                  <td className="px-3 py-3 w-8 shrink-0">
                    <button
                      type="button"
                      onClick={() => onViewCases(d)}
                      className="p-1 rounded hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      title="Ver casos atendidos"
                      aria-label="Ver casos atendidos"
                    >
                      <ChevronRight
                        className={`size-3.5 transition-transform duration-200 ${
                          isSelected ? "rotate-90 text-primary" : "group-hover:translate-x-0.5"
                        }`}
                      />
                    </button>
                  </td>

                  {/* Nombre y descripción */}
                  <td className="px-4 py-3 font-semibold text-foreground min-w-[160px]">
                    <div className="flex items-center gap-2">
                      <span>{d.name}</span>
                    </div>
                    {d.description && (
                      <div className="text-[11px] text-muted-foreground font-normal truncate max-w-sm">
                        {d.description}
                      </div>
                    )}
                  </td>

                  {/* Slug */}
                  <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground w-36 shrink-0">
                    {d.slug}
                  </td>

                  {/* Visibilidad */}
                  <td className="px-4 py-3 w-48 shrink-0">
                    <span className="inline-flex items-center gap-1.5 text-xs text-foreground">
                      {d.visibility === "restricted" ? (
                        <ShieldCheck className="size-3.5 text-danger shrink-0" />
                      ) : (
                        <LayoutDashboard className="size-3.5 text-muted-foreground shrink-0" />
                      )}
                      <span>{departmentVisibilityLabel(d.visibility)}</span>
                    </span>
                  </td>

                  {/* Badge interactivo de casos atendidos */}
                  <td className="px-4 py-3 w-40 shrink-0">
                    <button
                      type="button"
                      onClick={() => onViewCases(d)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                        casesCount > 0
                          ? "bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
                          : "bg-muted text-muted-foreground hover:bg-muted/80 border border-border"
                      }`}
                      title={casesCount > 0 ? `Ver catálogo de ${casesCount} casos` : "Sin casos"}
                    >
                      <Sparkles className="size-3" />
                      <span>
                        {casesCount > 0
                          ? `${casesCount} ${casesCount === 1 ? "caso" : "casos"}`
                          : "0 casos"}
                      </span>
                    </button>
                  </td>

                  {/* Capacidad máxima */}
                  <td className="px-4 py-3 w-32 shrink-0">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-foreground">
                      {d.maxConcurrentCases ?? 6} chats/asesor
                    </span>
                  </td>

                  {/* Estado */}
                  <td className="px-4 py-3 w-28 shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        d.active
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "bg-muted text-muted-foreground border border-border"
                      }`}
                    >
                      {d.active ? "Activo" : "Inactivo"}
                    </span>
                  </td>

                  {/* Acciones */}
                  <td className="px-4 py-3 text-right w-44 shrink-0">
                    <div className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onEdit(d.id)}
                        className="px-2.5 py-1 rounded-lg border border-border bg-background hover:bg-muted text-[10px] font-bold uppercase text-foreground transition-colors cursor-pointer"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => onToggleActive(d.id, d.active)}
                        title={
                          d.active
                            ? "Desactivar departamento. Ya no aparecerá al asignar agentes o casos."
                            : "Reactivar departamento"
                        }
                        className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase disabled:opacity-40 transition-colors cursor-pointer ${
                          d.active
                            ? "border-danger/30 text-danger hover:bg-danger/10"
                            : "border-primary/30 text-primary hover:bg-primary/10"
                        }`}
                      >
                        {d.active ? "Desactivar" : "Reactivar"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
