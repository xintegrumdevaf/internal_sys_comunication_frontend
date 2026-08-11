import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { assignCase, claimCase, getCaseSummary } from "./case.gateway";

/**
 * Verifica que el gateway arme exactamente la URL/método/headers/body que
 * espera isp-customer-service-api (docs/API_ENDPOINTS.md §5) — sin depender
 * de un backend real levantado (eso lo cubre la verificación manual de
 * docs/skills/testing-strategy-frontend.md §3).
 */
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

describe("case.gateway", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_API_BASE_URL", "http://localhost:3000");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("claimCase hace POST a /api/cases/:id/claim con { agentUserId } y sin header x-agent-id", async () => {
    const fetchMock = mockFetchOnce(204, undefined);
    await claimCase("case_1", "agent_1");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:3000/api/cases/case_1/claim");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({ agentUserId: "agent_1" });
    expect((init.headers as Record<string, string>)["x-agent-id"]).toBeUndefined();
  });

  it("assignCase envía x-agent-id del actor (requerido por el backend para autorizar)", async () => {
    const fetchMock = mockFetchOnce(204, undefined);
    await assignCase("case_1", "agent_target", "agent_manager", "dept_support");

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:3000/api/cases/case_1/assign");
    expect((init.headers as Record<string, string>)["x-agent-id"]).toBe("agent_manager");
    expect(JSON.parse(init.body as string)).toEqual({
      agentUserId: "agent_target",
      departmentId: "dept_support",
    });
  });

  it("getCaseSummary hace GET y desenvuelve el envelope {data}", async () => {
    const summary = { problem: "x", workflow: "SUPPORT_INTERNET" };
    const fetchMock = mockFetchOnce(200, { data: summary });

    const result = await getCaseSummary("case_1");

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit | undefined];
    expect(url).toBe("http://localhost:3000/api/cases/case_1/summary");
    expect(init?.method ?? "GET").toBe("GET");
    expect(result).toEqual(summary);
  });

  it("propaga un ApiError legible cuando el backend responde error", async () => {
    mockFetchOnce(404, { error: { type: "NOT_FOUND", message: "Caso no encontrado" } });
    await expect(getCaseSummary("missing")).rejects.toThrow("Caso no encontrado");
  });
});
