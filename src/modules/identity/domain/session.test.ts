import { describe, expect, it } from "vitest";
import { initialsFromName, isAdminRole, isSupervisor, toSessionUser } from "./session";
import type { AgentDto } from "./agent";
import type { DepartmentDto } from "./department";

const departments: DepartmentDto[] = [
  {
    id: "dept_support",
    slug: "support",
    name: "Soporte técnico",
    visibility: "shared",
    active: true,
    createdAt: new Date().toISOString(),
  },
];

function makeAgent(overrides: Partial<AgentDto> = {}): AgentDto {
  return {
    id: "agent_1",
    name: "Laura Mendoza",
    email: "laura@isp.local",
    role: "agent",
    primaryDepartmentId: "dept_support",
    departmentIds: ["dept_support"],
    active: true,
    autoAssignEnabled: false,
    mustChangePassword: false,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("initialsFromName", () => {
  it("toma la primera letra de hasta dos palabras", () => {
    expect(initialsFromName("Laura Mendoza")).toBe("LM");
  });

  it("funciona con un solo nombre", () => {
    expect(initialsFromName("Admin")).toBe("A");
  });

  it("devuelve ? si el nombre está vacío", () => {
    expect(initialsFromName("   ")).toBe("?");
  });
});

describe("toSessionUser", () => {
  it("resuelve el departamento real por primaryDepartmentId", () => {
    const session = toSessionUser(makeAgent(), departments);
    expect(session.departmentSlug).toBe("support");
    expect(session.departmentName).toBe("Soporte técnico");
  });

  it("no rompe si el agente no tiene departamento asignado (pool de triage)", () => {
    const session = toSessionUser(
      makeAgent({ primaryDepartmentId: null, departmentIds: [] }),
      departments,
    );
    expect(session.departmentSlug).toBeNull();
    expect(session.departmentIds).toEqual([]);
  });

  it("el id de sesión es el agent.id real, sin transformación", () => {
    const session = toSessionUser(makeAgent({ id: "real-uuid-123" }), departments);
    expect(session.id).toBe("real-uuid-123");
  });

  it("landing es /bandeja para agent, / para manager/admin", () => {
    expect(toSessionUser(makeAgent({ role: "agent" }), departments).landing).toBe("/bandeja");
    expect(toSessionUser(makeAgent({ role: "manager" }), departments).landing).toBe("/");
    expect(toSessionUser(makeAgent({ role: "admin" }), departments).landing).toBe("/");
  });

  it("preserva autoAssignEnabled desde el agente", () => {
    expect(toSessionUser(makeAgent(), departments).autoAssignEnabled).toBe(false);
    expect(
      toSessionUser(makeAgent({ autoAssignEnabled: true }), departments).autoAssignEnabled,
    ).toBe(true);
  });

  it("preserva mustChangePassword desde el agente", () => {
    expect(toSessionUser(makeAgent(), departments).mustChangePassword).toBe(false);
    expect(
      toSessionUser(makeAgent({ mustChangePassword: true }), departments).mustChangePassword,
    ).toBe(true);
  });

  it("normaliza departmentIds con fallback a primaryDepartmentId", () => {
    const user = toSessionUser(
      makeAgent({ primaryDepartmentId: "dept_support", departmentIds: [] }),
      departments,
    );
    expect(user.departmentIds).toEqual(["dept_support"]);

    const multiUser = toSessionUser(
      makeAgent({
        primaryDepartmentId: "dept_support",
        departmentIds: ["dept_support", "dept_sales"],
      }),
      departments,
    );
    expect(multiUser.departmentIds).toEqual(["dept_support", "dept_sales"]);
  });
});

describe("isSupervisor / isAdminRole", () => {
  it("manager y admin son supervisores; agent no", () => {
    expect(isSupervisor({ role: "manager" })).toBe(true);
    expect(isSupervisor({ role: "admin" })).toBe(true);
    expect(isSupervisor({ role: "agent" })).toBe(false);
  });

  it("solo admin es isAdminRole", () => {
    expect(isAdminRole({ role: "admin" })).toBe(true);
    expect(isAdminRole({ role: "manager" })).toBe(false);
  });

  it("sesión nula/indefinida nunca es supervisor ni admin", () => {
    expect(isSupervisor(null)).toBe(false);
    expect(isSupervisor(undefined)).toBe(false);
    expect(isAdminRole(null)).toBe(false);
  });
});
