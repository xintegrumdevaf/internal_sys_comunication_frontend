import type { DepartmentDto } from "@/modules/identity/domain/department";
import type { SessionUser } from "@/modules/identity/domain/session";

export type DirectorySection = {
  departmentId: string | null;
  title: string;
  users: SessionUser[];
};

/**
 * Agrupa agentes por área principal. Solo secciones con al menos un agente.
 * Orden: departamentos por nombre A→Z, luego "Sin área".
 */
export function groupDirectoryByDepartment(
  users: SessionUser[],
  departments: DepartmentDto[],
): DirectorySection[] {
  const byDept = new Map<string, SessionUser[]>();
  const withoutDept: SessionUser[] = [];

  for (const user of users) {
    const deptId = user.primaryDepartmentId;
    if (!deptId) {
      withoutDept.push(user);
      continue;
    }
    const list = byDept.get(deptId) ?? [];
    list.push(user);
    byDept.set(deptId, list);
  }

  const sections: DirectorySection[] = departments
    .filter((d) => byDept.has(d.id))
    .sort((a, b) => a.name.localeCompare(b.name, "es"))
    .map((d) => ({
      departmentId: d.id,
      title: d.name,
      users: byDept.get(d.id) ?? [],
    }));

  if (withoutDept.length > 0) {
    sections.push({
      departmentId: null,
      title: "Sin área",
      users: withoutDept,
    });
  }

  return sections;
}
