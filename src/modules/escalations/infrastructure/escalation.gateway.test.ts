import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { listEscalations } from "./escalation.gateway";

function mockFetchOnce() {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    statusText: "",
    text: () => Promise.resolve(JSON.stringify({ data: [] })),
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("escalation.gateway", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_API_BASE_URL", "http://localhost:3000");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("envía x-agent-id siempre (el backend lo exige, 03_API_CONTRACT.md §C.1)", async () => {
    const fetchMock = mockFetchOnce();
    await listEscalations({ agentUserId: "agent_1" });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)["x-agent-id"]).toBe("agent_1");
  });

  it("triage=true manda departmentId=null y triage=true (pool de triage, ignora departmentId explícito)", async () => {
    const fetchMock = mockFetchOnce();
    await listEscalations({ agentUserId: "agent_1", departmentId: "dept_support", triage: true });

    const [url] = fetchMock.mock.calls[0] as [string];
    const parsed = new URL(url);
    expect(parsed.searchParams.get("departmentId")).toBe("null");
    expect(parsed.searchParams.get("triage")).toBe("true");
  });

  it("sin triage, filtra por el departmentId dado y no manda el parámetro triage", async () => {
    const fetchMock = mockFetchOnce();
    await listEscalations({ agentUserId: "agent_1", departmentId: "dept_support" });

    const [url] = fetchMock.mock.calls[0] as [string];
    const parsed = new URL(url);
    expect(parsed.searchParams.get("departmentId")).toBe("dept_support");
    expect(parsed.searchParams.has("triage")).toBe(false);
  });
});
