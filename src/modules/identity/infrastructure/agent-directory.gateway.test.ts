import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { listAgents, listDepartments } from "./agent-directory.gateway";

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

  it("listAgents hace GET a /api/agents sin query ni headers extra", async () => {
    const fetchMock = mockFetchOnce([]);
    await listAgents();

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit | undefined];
    expect(url).toBe("http://localhost:3000/api/agents");
    expect((init?.headers as Record<string, string> | undefined)?.["x-agent-id"]).toBeUndefined();
  });

  it("listDepartments hace GET a /api/departments y desenvuelve el envelope", async () => {
    const departments = [{ id: "d1", slug: "support", name: "Soporte" }];
    mockFetchOnce(departments);
    const result = await listDepartments();
    expect(result).toEqual(departments);
  });
});
