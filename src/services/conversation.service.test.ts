import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { conversationService } from "./conversation.service";
import type { ZernioSyncStatus } from "@/types/department";

describe("conversationService", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_API_BASE_URL", "http://localhost:3000");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  function mockFetchOnce(body: unknown, status = 200) {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      statusText: "",
      text: () => Promise.resolve(JSON.stringify({ data: body })),
    });
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  }

  describe("startZernioHistorySync", () => {
    it("hace POST a /api/conversations/sync-history con el número de días", async () => {
      const mockResponse = { message: "Sincronización en curso", jobId: "job-123" };
      const fetchMock = mockFetchOnce(mockResponse);

      const result = await conversationService.startZernioHistorySync(15);

      expect(result).toEqual(mockResponse);
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit | undefined];
      expect(url).toBe("http://localhost:3000/api/conversations/sync-history");
      expect(init?.method).toBe("POST");
      expect(JSON.parse(init?.body as string)).toEqual({ days: 15, limit: 100 });
    });

    it("usa 30 días por defecto si no se especifica", async () => {
      const mockResponse = { message: "Sync iniciada", jobId: "job-default" };
      const fetchMock = mockFetchOnce(mockResponse);

      await conversationService.startZernioHistorySync();

      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit | undefined];
      expect(JSON.parse(init?.body as string)).toEqual({ days: 30, limit: 100 });
    });
  });

  describe("getZernioHistorySyncStatus", () => {
    it("hace GET a /api/conversations/sync-history/status", async () => {
      const mockStatus: ZernioSyncStatus = {
        status: "running",
        totalMessagesSynced: 1250,
        startedAt: "2026-09-07T12:00:00Z",
        completedAt: null,
        lastError: null,
      };
      const fetchMock = mockFetchOnce(mockStatus);

      const result = await conversationService.getZernioHistorySyncStatus();

      expect(result).toEqual(mockStatus);
      const [url] = fetchMock.mock.calls[0] as [string, RequestInit | undefined];
      expect(url).toBe("http://localhost:3000/api/conversations/sync-history/status");
    });
  });
});
