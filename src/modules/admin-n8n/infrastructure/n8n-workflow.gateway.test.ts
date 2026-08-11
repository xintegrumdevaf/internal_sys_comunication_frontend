import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { deactivateN8nWorkflow, listN8nWorkflows, upsertN8nWorkflow } from "./n8n-workflow.gateway";

function mockFetchOnce(status: number, body: unknown) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: "",
    text: () => Promise.resolve(body === undefined ? "" : JSON.stringify(body)),
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("n8n-workflow.gateway", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_API_BASE_URL", "http://localhost:3000");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("listN8nWorkflows exige x-agent-id (solo role=admin puede leer el catálogo)", async () => {
    const fetchMock = mockFetchOnce(200, { data: [] });
    await listN8nWorkflows("admin_1", "case_action");

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const parsed = new URL(url);
    expect(parsed.searchParams.get("category")).toBe("case_action");
    expect((init.headers as Record<string, string>)["x-agent-id"]).toBe("admin_1");
  });

  it("upsertN8nWorkflow hace PUT a /api/admin/n8n-workflows/:action con el body dado", async () => {
    const entry = { action: "CHECK_BALANCE", url: "http://n8n/webhook/check-balance" };
    const fetchMock = mockFetchOnce(200, entry);

    const result = await upsertN8nWorkflow("admin_1", "CHECK_BALANCE", {
      url: "http://n8n/webhook/check-balance",
      timeoutMs: 15000,
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:3000/api/admin/n8n-workflows/CHECK_BALANCE");
    expect(init.method).toBe("PUT");
    expect(JSON.parse(init.body as string)).toEqual({
      url: "http://n8n/webhook/check-balance",
      timeoutMs: 15000,
    });
    expect(result).toEqual(entry);
  });

  it("deactivateN8nWorkflow hace DELETE a /api/admin/n8n-workflows/:action", async () => {
    const fetchMock = mockFetchOnce(200, { action: "CHECK_BALANCE", active: false });
    await deactivateN8nWorkflow("admin_1", "CHECK_BALANCE");

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:3000/api/admin/n8n-workflows/CHECK_BALANCE");
    expect(init.method).toBe("DELETE");
  });

  it("propaga un error de autorización legible si no es admin", async () => {
    mockFetchOnce(403, {
      error: { type: "FORBIDDEN", message: "Se requiere rol admin para administrar el catálogo de n8n" },
    });
    await expect(listN8nWorkflows("agent_1")).rejects.toThrow(/rol admin/);
  });
});
