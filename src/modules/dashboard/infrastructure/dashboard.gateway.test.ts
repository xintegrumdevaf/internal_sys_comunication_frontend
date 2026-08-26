import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getDashboard } from "./dashboard.gateway";

describe("dashboard.gateway", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_API_BASE_URL", "http://localhost:3000");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("getDashboard manda el userId como query param (no como header)", async () => {
    const dto = {
      userId: "agent_1",
      openConversations: 2,
      myAssignedCases: 1,
      escalatedPending: 0,
      waitingUser: 0,
    };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "",
      text: () => Promise.resolve(JSON.stringify({ data: dto })),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await getDashboard("agent_1");

    const [url] = fetchMock.mock.calls[0] as [string];
    const parsed = new URL(url);
    expect(parsed.pathname).toBe("/api/dashboard");
    expect(parsed.searchParams.get("userId")).toBe("agent_1");
    expect(result).toEqual(dto);
  });
});
