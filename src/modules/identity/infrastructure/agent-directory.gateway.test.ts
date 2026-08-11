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
    const fetchMock = mockFetchOnce({ agent: { id: "a1", name: "Ana" }, temporaryPassword: "abc123" });
    const result = await createAgent({ name: "Ana", email: "ana@isp.local" });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit | undefined];
    expect(url).toBe("http://localhost:3000/api/agents");
    expect(init?.method).toBe("POST");
    expect(init?.credentials).toBe("include");
    expect(JSON.parse(init?.body as string)).toEqual({ name: "Ana", email: "ana@isp.local" });
    expect(result).toEqual({ agent: { id: "a1", name: "Ana" }, temporaryPassword: "abc123" });
  });

  it("updateAgent hace PUT a /api/agents/:id con el patch", async () => {
    const fetchMock = mockFetchOnce({ id: "a1", name: "Ana Torres" });
    await updateAgent("a1", { name: "Ana Torres" });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit | undefined];
    expect(url).toBe("http://localhost:3000/api/agents/a1");
    expect(init?.method).toBe("PUT");
  });

  it("deactivateAgent hace DELETE a /api/agents/:id", async () => {
    const fetchMock = mockFetchOnce({ id: "a1", active: false });
    await deactivateAgent("a1");

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit | undefined];
    expect(url).toBe("http://localhost:3000/api/agents/a1");
    expect(init?.method).toBe("DELETE");
  });

  it("resetAgentPassword hace POST a /api/agents/:id/reset-password", async () => {
    const fetchMock = mockFetchOnce({ agent: { id: "a1" }, temporaryPassword: "xyz789" });
    const result = await resetAgentPassword("a1");

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit | undefined];
    expect(url).toBe("http://localhost:3000/api/agents/a1/reset-password");
    expect(init?.method).toBe("POST");
    expect(result.temporaryPassword).toBe("xyz789");
  });
});
