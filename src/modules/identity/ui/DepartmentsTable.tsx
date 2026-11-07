import React from "react";
import {
  ChevronRight,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { Department, DepartmentCase } from "@/modules/identity/domain/department";
import { departmentVisibilityLabel } from "@/modules/identity/domain/department";
import { MOCK_FACTURACION_CASES } from "@/modules/identity/domain/department-mocks";

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
    <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs w-full">
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left text-xs table-auto">
          <thead className="border-b border-border/80 bg-muted/30 text-[10px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-3.5 font-extrabold w-10 text-center"></th>
              <th className="px-4 py-3.5 font-extrabold min-w-[240px]">Área / Departamento</th>
              <th className="px-4 py-3.5 font-extrabold w-44">Slug Técnico</th>
              <th className="px-4 py-3.5 font-extrabold w-52">Visibilidad de Casos</th>
              <th className="px-4 py-3.5 font-extrabold w-44">Casos Atendidos</th>
              <th className="px-4 py-3.5 font-extrabold w-40">Capacidad Base</th>
              <th className="px-4 py-3.5 font-extrabold w-32">Estado</th>
              <th className="px-4 py-3.5 font-extrabold text-right w-44">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {departments.map((d) => {
              const isBilling = d.slug === "billing" || d.name.toLowerCase().includes("factur");
              const cases = casesCache[d.id] ?? (isBilling ? MOCK_FACTURACION_CASES : d.cases ?? []);
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
                  <td className="px-3 py-4 w-10 text-center shrink-0">
                    <button
                      type="button"
                      onClick={() => onViewCases(d)}
                      className="p-1 rounded-md hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      title="Ver casos atendidos"
                      aria-label="Ver casos atendidos"
                    >
                      <ChevronRight
                        className={`size-4 transition-transform duration-200 ${
                          isSelected ? "rotate-90 text-primary" : "group-hover:translate-x-0.5"
                        }`}
                      />
                    </button>
                  </td>

                  {/* Nombre y descripción amplia */}
                  <td className="px-4 py-4 min-w-[240px]">
                    <div className="text-sm font-bold text-foreground flex items-center gap-2">
                      <span>{d.name}</span>
                    </div>
                    {d.description && (
                      <p className="text-xs text-muted-foreground font-normal mt-0.5 line-clamp-2 leading-relaxed">
                        {d.description}
                      </p>
                    )}
                  </td>

                  {/* Slug */}
                  <td className="px-4 py-4 w-44">
                    <span className="px-2 py-1 rounded-md bg-muted/60 border border-border/60 font-mono text-[11px] text-muted-foreground inline-block">
                      {d.slug}
                    </span>
                  </td>

                  {/* Visibilidad */}
                  <td className="px-4 py-4 w-52">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background border border-border text-xs text-foreground font-medium">
                      {d.visibility === "restricted" ? (
                        <ShieldCheck className="size-3.5 text-danger shrink-0" />
                      ) : (
                        <LayoutDashboard className="size-3.5 text-muted-foreground shrink-0" />
                      )}
                      <span>{departmentVisibilityLabel(d.visibility)}</span>
                    </span>
                  </td>

                  {/* Badge interactivo de casos atendidos */}
                  <td className="px-4 py-4 w-44">
                    <button
                      type="button"
                      onClick={() => onViewCases(d)}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        casesCount > 0
                          ? "bg-primary/10 text-primary hover:bg-primary/20 border border-primary/25 shadow-2xs"
                          : "bg-muted text-muted-foreground hover:bg-muted/80 border border-border"
                      }`}
                      title={casesCount > 0 ? `Ver catálogo de ${casesCount} casos` : "Sin casos"}
                    >
                      <Sparkles className="size-3.5 text-primary" />
                      <span>
                        {casesCount > 0
                          ? `${casesCount} ${casesCount === 1 ? "caso" : "casos"}`
                          : "0 casos"}
                      </span>
                    </button>
                  </td>

                  {/* Capacidad máxima */}
                  <td className="px-4 py-4 w-40">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      <span className="font-mono text-sm">{d.maxConcurrentCases ?? 6}</span>{" "}
                      <span className="text-muted-foreground font-normal">chats/asesor</span>
                    </span>
                  </td>

                  {/* Estado */}
                  <td className="px-4 py-4 w-32">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        d.active
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : "bg-muted text-muted-foreground border border-border"
                      }`}
                    >
                      <span
                        className={`size-1.5 rounded-full ${
                          d.active ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"
                        }`}
                      />
                      {d.active ? "Activo" : "Inactivo"}
                    </span>
                  </td>

                  {/* Acciones */}
                  <td className="px-4 py-4 text-right w-44">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(d.id)}
                        className="px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-xs font-semibold text-foreground transition-colors cursor-pointer shadow-2xs"
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
                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold disabled:opacity-40 transition-colors cursor-pointer shadow-2xs ${
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
