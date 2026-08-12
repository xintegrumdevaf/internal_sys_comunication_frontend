import { describe, expect, it } from "vitest";
import { canAccessDepartment, canAccessPath, modulesForSession } from "./access-control";
import type { DepartmentDto } from "@/modules/identity/domain/department";
import type { SessionUser } from "@/modules/identity/domain/session";

function makeSession(overrides: Partial<SessionUser> = {}): SessionUser {
  return {
    id: "agent_1",
    name: "Laura Mendoza",
    initials: "LM",
    email: "laura@isp.local",
    role: "agent",
    active: true,
    primaryDepartmentId: "dept_support",
    departmentSlug: "support",
    departmentName: "Soporte técnico",
    roleLabel: "Agente · Soporte técnico",
    landing: "/bandeja",
    ...overrides,
  };
}

const sharedDept: DepartmentDto = {
  id: "dept_support",
  slug: "support",
  name: "Soporte técnico",
  visibility: "shared",
  active: true,
  createdAt: new Date().toISOString(),
};

const restrictedDept: DepartmentDto = {
  id: "dept_billing",
  slug: "billing",
  name: "Facturación",
  visibility: "restricted",
  active: true,
  createdAt: new Date().toISOString(),
};

describe("canAccessDepartment", () => {
  it("cualquier agente activo lee un depto shared (01_DATA_MODEL.md §7 del backend)", () => {
    expect(canAccessDepartment(makeSession(), sharedDept)).toBe(true);
  });

  it("un agente sin membership no puede leer un depto restricted que no es el suyo", () => {
    const session = makeSession({ primaryDepartmentId: "dept_support" });
    expect(canAccessDepartment(session, restrictedDept)).toBe(false);
  });

  it("un agente sí puede leer un depto restricted que es el suyo", () => {
    const session = makeSession({ primaryDepartmentId: "dept_billing" });
    expect(canAccessDepartment(session, restrictedDept)).toBe(true);
  });

  it("admin siempre puede, incluso en restricted ajeno", () => {
    const session = makeSession({ role: "admin", primaryDepartmentId: "dept_support" });
    expect(canAccessDepartment(session, restrictedDept)).toBe(true);
  });

  it("sin sesión, no hay acceso", () => {
    expect(canAccessDepartment(null, sharedDept)).toBe(false);
  });
});

describe("canAccessPath", () => {
  it("sin sesión solo se permite /login", () => {
    expect(canAccessPath(null, "/login")).toBe(true);
    expect(canAccessPath(null, "/bandeja")).toBe(false);
  });

  it("un agent no ve pantallas admin-only", () => {
    const session = makeSession({ role: "agent" });
    expect(canAccessPath(session, "/usuarios")).toBe(false);
    expect(canAccessPath(session, "/flujos")).toBe(false);
    expect(canAccessPath(session, "/auditoria")).toBe(false);
  });

  it("un agent no ve pantallas de supervisor (escalaciones/asignaciones/calidad)", () => {
    const session = makeSession({ role: "agent" });
    expect(canAccessPath(session, "/escalaciones")).toBe(false);
    expect(canAccessPath(session, "/asignaciones")).toBe(false);
    expect(canAccessPath(session, "/calidad")).toBe(false);
  });

  it("un manager sí ve escalaciones/asignaciones/calidad pero no admin-only", () => {
    const session = makeSession({ role: "manager" });
    expect(canAccessPath(session, "/escalaciones")).toBe(true);
    expect(canAccessPath(session, "/asignaciones")).toBe(true);
    expect(canAccessPath(session, "/calidad")).toBe(true);
    expect(canAccessPath(session, "/usuarios")).toBe(false);
  });

  it("admin ve todo", () => {
    const session = makeSession({ role: "admin" });
    expect(canAccessPath(session, "/usuarios")).toBe(true);
    expect(canAccessPath(session, "/flujos")).toBe(true);
    expect(canAccessPath(session, "/escalaciones")).toBe(true);
    expect(canAccessPath(session, "/calidad")).toBe(true);
  });

  it("bandeja/chat-interno/dashboard son accesibles para cualquier rol autenticado", () => {
    const session = makeSession({ role: "agent" });
    expect(canAccessPath(session, "/")).toBe(true);
    expect(canAccessPath(session, "/bandeja")).toBe(true);
    expect(canAccessPath(session, "/chat-interno")).toBe(true);
  });
});

describe("modulesForSession", () => {
  it("agent ve inicio, bandeja y chat interno", () => {
    const items = modulesForSession(makeSession({ role: "agent" })).map((m) => m.to);
    expect(items).toEqual(["/", "/bandeja", "/chat-interno"]);
  });

  it("manager suma escalaciones, asignaciones y calidad", () => {
    const items = modulesForSession(makeSession({ role: "manager" })).map((m) => m.to);
    expect(items).toContain("/escalaciones");
    expect(items).toContain("/asignaciones");
    expect(items).toContain("/calidad");
    expect(items).not.toContain("/usuarios");
  });

  it("admin suma las pantallas exclusivas de administración", () => {
    const items = modulesForSession(makeSession({ role: "admin" })).map((m) => m.to);
    expect(items).toContain("/usuarios");
    expect(items).toContain("/flujos");
    expect(items).toContain("/auditoria");
  });

  it("sin sesión no hay módulos", () => {
    expect(modulesForSession(null)).toEqual([]);
  });
});
