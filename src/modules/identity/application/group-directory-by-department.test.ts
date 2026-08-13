import { describe, expect, it } from "vitest";
import type { DepartmentDto } from "@/modules/identity/domain/department";
import type { SessionUser } from "@/modules/identity/domain/session";
import { groupDirectoryByDepartment } from "./group-directory-by-department";

function user(overrides: Partial<SessionUser> & { id: string; name: string }): SessionUser {
  return {
    initials: "X",
    email: `${overrides.id}@isp.local`,
    role: "agent",
    active: true,
    primaryDepartmentId: null,
    departmentSlug: null,
    departmentName: null,
    roleLabel: "Agente",
    autoAssignEnabled: false,
    landing: "/bandeja",
    ...overrides,
  };
}

const departments: DepartmentDto[] = [
  {
    id: "d_b",
    slug: "billing",
    name: "Facturación",
    visibility: "shared",
    active: true,
    createdAt: "",
  },
  {
    id: "d_a",
    slug: "support",
    name: "Soporte",
    visibility: "shared",
    active: true,
    createdAt: "",
  },
];

describe("groupDirectoryByDepartment", () => {
  it("agrupa por área, ordena secciones por nombre y deja Sin área al final", () => {
    const users = [
      user({ id: "1", name: "Ana", primaryDepartmentId: "d_b" }),
      user({ id: "2", name: "Bea", primaryDepartmentId: null }),
      user({ id: "3", name: "Carlos", primaryDepartmentId: "d_a" }),
      user({ id: "4", name: "Diana", primaryDepartmentId: "d_a" }),
    ];

    const sections = groupDirectoryByDepartment(users, departments);

    expect(sections.map((s) => s.title)).toEqual(["Facturación", "Soporte", "Sin área"]);
    expect(sections[0]?.users.map((u) => u.id)).toEqual(["1"]);
    expect(sections[1]?.users.map((u) => u.id)).toEqual(["3", "4"]);
    expect(sections[2]?.users.map((u) => u.id)).toEqual(["2"]);
    expect(sections[2]?.departmentId).toBeNull();
  });

  it("omite departamentos sin agentes", () => {
    const users = [user({ id: "1", name: "Ana", primaryDepartmentId: "d_a" })];
    const sections = groupDirectoryByDepartment(users, departments);
    expect(sections.map((s) => s.title)).toEqual(["Soporte"]);
  });
});
