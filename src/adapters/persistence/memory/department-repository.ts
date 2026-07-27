import type { DepartmentRepository } from "@/core/modules/departments/application/ports";
import type { Department, DepartmentSlug } from "@/core/modules/departments/domain/department";
import type { DepartmentId } from "@/core/shared/domain/ids";
import { SEED_DEPARTMENTS } from "./seed";

export class InMemoryDepartmentRepository implements DepartmentRepository {
  private readonly byId = new Map<string, Department>();

  constructor(seed: Department[] = SEED_DEPARTMENTS) {
    for (const d of seed) this.byId.set(d.id, d);
  }

  async listActive(): Promise<Department[]> {
    return [...this.byId.values()].filter((d) => d.active);
  }

  async findById(id: DepartmentId): Promise<Department | null> {
    return this.byId.get(id) ?? null;
  }

  async findBySlug(slug: DepartmentSlug): Promise<Department | null> {
    return [...this.byId.values()].find((d) => d.slug === slug) ?? null;
  }
}
