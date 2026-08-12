import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  analyzeQualityBatch,
  getQualityPendingCount,
  getQualityReview,
  listAgentQualityStats,
  listQualityReviews,
  markQualityReviewReviewed,
  requestOnDemandReview,
  addQualityCoachingNote,
} from "./quality.gateway";

function mockFetchOnce(body: unknown = { data: [] }) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    statusText: "",
    text: () => Promise.resolve(JSON.stringify(body)),
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("quality.gateway", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_API_BASE_URL", "http://localhost:3000");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("GET /api/quality/agents con filtros from/to/departmentId", async () => {
    const fetchMock = mockFetchOnce({ data: [] });
    await listAgentQualityStats({
      from: "2026-01-01T00:00:00.000Z",
      to: "2026-01-31T00:00:00.000Z",
      departmentId: "dept_1",
    });
    const [url] = fetchMock.mock.calls[0] as [string];
    const parsed = new URL(url);
    expect(parsed.pathname).toBe("/api/quality/agents");
    expect(parsed.searchParams.get("from")).toBe("2026-01-01T00:00:00.000Z");
    expect(parsed.searchParams.get("departmentId")).toBe("dept_1");
  });

  it("GET /api/quality/reviews con agentId y status", async () => {
    const fetchMock = mockFetchOnce({ data: [] });
    await listQualityReviews({ agentId: "a1", status: "ready" });
    const [url] = fetchMock.mock.calls[0] as [string];
    const parsed = new URL(url);
    expect(parsed.pathname).toBe("/api/quality/reviews");
    expect(parsed.searchParams.get("agentId")).toBe("a1");
    expect(parsed.searchParams.get("status")).toBe("ready");
  });

  it("GET /api/quality/reviews/:id", async () => {
    const fetchMock = mockFetchOnce({
      data: {
        id: "r1",
        conversationId: "c1",
        caseId: "case1",
        agentId: "a1",
        status: "ready",
        trigger: "auto_case_closed",
        findings: [],
        notes: [],
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    });
    const review = await getQualityReview("r1");
    const [url] = fetchMock.mock.calls[0] as [string];
    expect(new URL(url).pathname).toBe("/api/quality/reviews/r1");
    expect(review.id).toBe("r1");
  });

  it("POST /api/quality/reviews on-demand", async () => {
    const fetchMock = mockFetchOnce({
      data: { id: "r2", caseId: "case9", agentId: "a1", status: "pending", trigger: "on_demand" },
    });
    await requestOnDemandReview("case9");
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(new URL(url).pathname).toBe("/api/quality/reviews");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual({ caseId: "case9" });
  });

  it("POST notes y PATCH reviewed", async () => {
    const fetchMock = mockFetchOnce({ data: { id: "n1", body: "hola" } });
    await addQualityCoachingNote("r1", "pauta");
    let [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(new URL(url).pathname).toBe("/api/quality/reviews/r1/notes");
    expect(init.method).toBe("POST");

    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: "",
      text: () =>
        Promise.resolve(
          JSON.stringify({
            data: { id: "r1", status: "reviewed", findings: [], notes: [] },
          }),
        ),
    });
    await markQualityReviewReviewed("r1");
    [url, init] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(new URL(url).pathname).toBe("/api/quality/reviews/r1");
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(String(init.body))).toEqual({ status: "reviewed" });
  });

  it("GET /api/quality/pending-count", async () => {
    const fetchMock = mockFetchOnce({ data: { pendingCount: 3 } });
    const count = await getQualityPendingCount({ agentId: "a1" });
    const [url] = fetchMock.mock.calls[0] as [string];
    const parsed = new URL(url);
    expect(parsed.pathname).toBe("/api/quality/pending-count");
    expect(parsed.searchParams.get("agentId")).toBe("a1");
    expect(count).toBe(3);
  });

  it("POST /api/quality/analyze-batch", async () => {
    const fetchMock = mockFetchOnce({
      data: { enqueued: 2, pendingTotal: 2, reviews: [] },
    });
    const result = await analyzeQualityBatch({
      from: "2026-01-01T00:00:00.000Z",
      agentId: "a1",
      limit: 5,
    });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(new URL(url).pathname).toBe("/api/quality/analyze-batch");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toMatchObject({
      from: "2026-01-01T00:00:00.000Z",
      agentId: "a1",
      limit: 5,
    });
    expect(result.enqueued).toBe(2);
    expect(result.pendingTotal).toBe(2);
  });
});
