import type {
  Department,
  DepartmentCase,
  DepartmentHandlingMode,
  CreateDepartmentPayload,
  UpdateDepartmentPayload,
} from "@/types/department";

export type {
  Department,
  DepartmentCase,
  DepartmentHandlingMode,
  CreateDepartmentPayload,
  UpdateDepartmentPayload,
};

/** Entidad Department real del backend (isp-customer-service-api). */
export type DepartmentVisibility = "shared" | "restricted";

export type DepartmentDto = Department;

/**
 * Explicacion en lenguaje simple de la visibilidad del departamento — nunca
 * se muestra "shared"/"restricted" crudo a un usuario no tecnico.
 */
export function departmentVisibilityLabel(visibility: DepartmentVisibility): string {
  return visibility === "restricted"
    ? "Solo agentes de esta área"
    : "Visible para todos los agentes";
}

/**
 * Etiqueta amigable del modo de atención del caso.
 */
export function departmentHandlingModeLabel(mode: DepartmentHandlingMode): string {
  return mode === "human_direct" ? "Transferencia Directa a Humano" : "Asistido por IA";
}
