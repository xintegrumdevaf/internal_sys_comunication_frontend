/** Entidad Department real del backend (isp-customer-service-api). */
export type DepartmentVisibility = "shared" | "restricted";

export type DepartmentDto = {
  id: string;
  slug: string; // "support" | "billing" | "sales" (seed real, ver scripts/seed.ts del backend)
  name: string;
  visibility: DepartmentVisibility;
  active: boolean;
  createdAt: string;
};

/**
 * Explicacion en lenguaje simple de la visibilidad del departamento — nunca
 * se muestra "shared"/"restricted" crudo a un usuario no tecnico.
 */
export function departmentVisibilityLabel(visibility: DepartmentVisibility): string {
  return visibility === "restricted"
    ? "Solo agentes de esta área"
    : "Visible para todos los agentes";
}
