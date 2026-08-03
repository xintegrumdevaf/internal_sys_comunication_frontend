import type { Department } from "@/core/modules/departments/domain/department";
import type { DepartmentId } from "@/core/shared/domain/ids";
import type { DepartmentSlug } from "@/core/modules/departments/domain/department";

export interface DepartmentRepository {
  listActive(): Promise<Department[]>;
  findById(id: DepartmentId): Promise<Department | null>;
  findBySlug(slug: DepartmentSlug): Promise<Department | null>;
}
