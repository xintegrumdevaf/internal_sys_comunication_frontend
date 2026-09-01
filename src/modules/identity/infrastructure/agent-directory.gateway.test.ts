import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createAgent,
  deactivateAgent,
  listAgents,
  listDepartments,
  resetAgentPassword,
  updateAgent,
} from "./agent-directory.gateway";

function mockFetchOnce(body: unknown) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    statusText: "",
    text: () => Promise.resolve(JSON.stringify({ data: body })),
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("agent-directory.gateway", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_API_BASE_URL", "http://localhost:3000");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("listAgents hace GET a /api/agents con credentials include (identidad via cookie, no headers)", async () => {
    const fetchMock = mockFetchOnce([]);
    await listAgents();

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit | undefined];
    expect(url).toBe("http://localhost:3000/api/agents");
    expect(init?.credentials).toBe("include");
  });

  it("listDepartments hace GET a /api/departments y desenvuelve el envelope", async () => {
    const departments = [{ id: "d1", slug: "support", name: "Soporte" }];
    mockFetchOnce(departments);
    const result = await listDepartments();
    expect(result).toEqual(departments);
  });

  it("createAgent hace POST a /api/agents y devuelve el agente + la contrasena temporal", async () => {
    const fetchMock = mockFetchOnce({
      agent: {
        id: "a1",
        name: "Ana",
        email: "ana@isp.local",
        role: "agent",
        primaryDepartmentId: null,
        active: true,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
      temporaryPassword: "abc123",
    });
    const result = await createAgent({ name: "Ana", email: "ana@isp.local" });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit | undefined];
    expect(url).toBe("http://localhost:3000/api/agents");
    expect(init?.method).toBe("POST");
    expect(init?.credentials).toBe("include");
    expect(JSON.parse(init?.body as string)).toEqual({ name: "Ana", email: "ana@isp.local" });
    expect(result.temporaryPassword).toBe("abc123");
    expect(result.agent.id).toBe("a1");
    expect(result.agent.autoAssignEnabled).toBe(false);
  });

  it("updateAgent hace PUT a /api/agents/:id con el patch", async () => {
    const fetchMock = mockFetchOnce({
      id: "a1",
      name: "Ana Torres",
      email: "ana@isp.local",
      role: "agent",
      primaryDepartmentId: null,
      active: true,
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    await updateAgent("a1", { name: "Ana Torres" });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit | undefined];
    expect(url).toBe("http://localhost:3000/api/agents/a1");
    expect(init?.method).toBe("PUT");
  });

  it("updateAgent puede enviar autoAssignEnabled", async () => {
    const fetchMock = mockFetchOnce({
      id: "a1",
      name: "Ana",
      email: "ana@isp.local",
      role: "agent",
      primaryDepartmentId: "d1",
      active: true,
      autoAssignEnabled: true,
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    const result = await updateAgent("a1", { autoAssignEnabled: true });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit | undefined];
    expect(JSON.parse(init?.body as string)).toEqual({ autoAssignEnabled: true });
    expect(result.autoAssignEnabled).toBe(true);
  });

  it("listAgents normaliza autoAssignEnabled ausente a false", async () => {
    mockFetchOnce([
      {
        id: "a1",
        name: "Ana",
        email: "ana@isp.local",
        role: "agent",
        primaryDepartmentId: "d1",
        active: true,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ]);
    const result = await listAgents();
    expect(result[0]?.autoAssignEnabled).toBe(false);
  });

  it("deactivateAgent hace DELETE a /api/agents/:id", async () => {
    const fetchMock = mockFetchOnce({
      id: "a1",
      name: "Ana",
      email: "ana@isp.local",
      role: "agent",
      primaryDepartmentId: null,
      active: false,
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    await deactivateAgent("a1");

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit | undefined];
    expect(url).toBe("http://localhost:3000/api/agents/a1");
    expect(init?.method).toBe("DELETE");
  });

  it("resetAgentPassword hace POST a /api/agents/:id/reset-password", async () => {
    const fetchMock = mockFetchOnce({
      agent: {
        id: "a1",
        name: "Ana",
        email: "ana@isp.local",
        role: "agent",
        primaryDepartmentId: null,
        active: true,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
      temporaryPassword: "xyz789",
    });
    const result = await resetAgentPassword("a1");

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit | undefined];
    expect(url).toBe("http://localhost:3000/api/agents/a1/reset-password");
    expect(init?.method).toBe("POST");
    expect(result.temporaryPassword).toBe("xyz789");
  });

  it("createAgent envía departmentIds y autoAssignEnabled en el payload", async () => {
    const fetchMock = mockFetchOnce({
      agent: {
        id: "a1",
        name: "Carlos Gomez",
        email: "carlos@isp.local",
        role: "agent",
        primaryDepartmentId: "uuid-soporte",
        departmentIds: ["uuid-soporte", "uuid-ventas"],
        autoAssignEnabled: true,
        mustChangePassword: true,
        active: true,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
      temporaryPassword: "temp123",
    });

    const result = await createAgent({
      name: "Carlos Gomez",
      email: "carlos@isp.local",
      role: "agent",
      primaryDepartmentId: "uuid-soporte",
      departmentIds: ["uuid-soporte", "uuid-ventas"],
      autoAssignEnabled: true,
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit | undefined];
    expect(JSON.parse(init?.body as string)).toEqual({
      name: "Carlos Gomez",
      email: "carlos@isp.local",
      role: "agent",
      primaryDepartmentId: "uuid-soporte",
      departmentIds: ["uuid-soporte", "uuid-ventas"],
      autoAssignEnabled: true,
    });
    expect(result.agent.departmentIds).toEqual(["uuid-soporte", "uuid-ventas"]);
    expect(result.agent.autoAssignEnabled).toBe(true);
  });

  it("updateAgent envía departmentIds en el payload", async () => {
    const fetchMock = mockFetchOnce({
      id: "a1",
      name: "Carlos Gomez",
      email: "carlos@isp.local",
      role: "agent",
      primaryDepartmentId: "uuid-soporte",
      departmentIds: ["uuid-soporte", "uuid-ventas"],
      active: true,
      autoAssignEnabled: true,
      mustChangePassword: false,
      createdAt: "2026-01-01T00:00:00.000Z",
    });

    const result = await updateAgent("a1", {
      departmentIds: ["uuid-soporte", "uuid-ventas"],
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit | undefined];
    expect(JSON.parse(init?.body as string)).toEqual({
      departmentIds: ["uuid-soporte", "uuid-ventas"],
    });
    expect(result.departmentIds).toEqual(["uuid-soporte", "uuid-ventas"]);
  });
});
