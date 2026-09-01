import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { analyticsApi } from "./analytics.api";

describe("analytics.api", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_API_BASE_URL", "http://localhost:3000");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("getOverview llama a /api/analytics/overview con query params", async () => {
    const mockOverview = {
      totalCases: 120,
      activeCases: 15,
      completedCases: 105,
      botContainmentRate: 68.5,
      avgResolutionTimeMinutes: 14.2,
      avgQueueWaitTimeSeconds: 45.0,
      escalationRate: 31.5,
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "",
      text: () => Promise.resolve(JSON.stringify({ data: mockOverview })),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await analyticsApi.getOverview({
      from: "2026-08-01T00:00:00Z",
      to: "2026-08-31T23:59:59Z",
      departmentId: "dept-123",
    });

    const [url] = fetchMock.mock.calls[0] as [string];
    const parsed = new URL(url);
    expect(parsed.pathname).toBe("/api/analytics/overview");
    expect(parsed.searchParams.get("from")).toBe("2026-08-01T00:00:00Z");
    expect(parsed.searchParams.get("to")).toBe("2026-08-31T23:59:59Z");
    expect(parsed.searchParams.get("departmentId")).toBe("dept-123");
    expect(result).toEqual(mockOverview);
  });

  it("getInfrastructureAlerts consume /api/analytics/infrastructure-alerts", async () => {
    const mockAlerts = [
      {
        sector: "Sector Norte",
        oltName: "OLT-01",
        activeCasesCount: 18,
        isHighVolumeAlert: true,
      },
    ];

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "",
      text: () => Promise.resolve(JSON.stringify({ data: mockAlerts })),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await analyticsApi.getInfrastructureAlerts();
    const [url] = fetchMock.mock.calls[0] as [string];
    const parsed = new URL(url);
    expect(parsed.pathname).toBe("/api/analytics/infrastructure-alerts");
    expect(result).toEqual(mockAlerts);
  });
});
