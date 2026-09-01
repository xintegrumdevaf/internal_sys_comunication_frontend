import { describe, expect, it } from "vitest";
import { normalizeAgent } from "./normalize-agent";

describe("normalizeAgent", () => {
  const base = {
    id: "a1",
    name: "Ana",
    email: "ana@isp.local",
    role: "agent" as const,
    primaryDepartmentId: "d1",
    active: true,
    createdAt: "2026-01-01T00:00:00.000Z",
  };

  it("trata autoAssignEnabled ausente como false", () => {
    expect(normalizeAgent(base).autoAssignEnabled).toBe(false);
  });

  it("preserva autoAssignEnabled true", () => {
    expect(normalizeAgent({ ...base, autoAssignEnabled: true }).autoAssignEnabled).toBe(true);
  });

  it("trata null/undefined como false", () => {
    expect(normalizeAgent({ ...base, autoAssignEnabled: null }).autoAssignEnabled).toBe(false);
    expect(normalizeAgent({ ...base, autoAssignEnabled: undefined }).autoAssignEnabled).toBe(false);
  });

  it("normaliza mustChangePassword adecuadamente", () => {
    expect(normalizeAgent(base).mustChangePassword).toBe(false);
    expect(normalizeAgent({ ...base, mustChangePassword: true }).mustChangePassword).toBe(true);
    expect(normalizeAgent({ ...base, mustChangePassword: null }).mustChangePassword).toBe(false);
  });

  it("normaliza departmentIds con fallback a primaryDepartmentId", () => {
    expect(normalizeAgent(base).departmentIds).toEqual(["d1"]);
    expect(normalizeAgent({ ...base, departmentIds: ["d1", "d2"] }).departmentIds).toEqual(["d1", "d2"]);
    expect(normalizeAgent({ ...base, primaryDepartmentId: null, departmentIds: null }).departmentIds).toEqual([]);
  });
});

