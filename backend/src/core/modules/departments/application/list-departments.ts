import type { DepartmentRepository } from "@/core/modules/departments/application/ports";
import type { Department } from "@/core/modules/departments/domain/department";

export class ListDepartmentsUseCase {
  constructor(private readonly departments: DepartmentRepository) {}

  execute(): Promise<Department[]> {
    return this.departments.listActive();
  }
}
