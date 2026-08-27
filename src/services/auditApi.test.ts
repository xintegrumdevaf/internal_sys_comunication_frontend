import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { auditApi } from "./auditApi";

describe("auditApi", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_API_BASE_URL", "http://localhost:3000");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  describe("listEvents", () => {
    it("llama a GET /api/audit con los filtros especificados", async () => {
      const mockResponse = {
        data: [
          {
            id: "aud-1",
            action: "USER_LOGIN",
            category: "security",
            resourceType: "agent",
            resourceId: "ag-1",
            actor: { id: "ag-1", name: "Admin", email: "admin@test.com", role: "admin", type: "agent" },
            department: null,
            metadata: {},
            beforeState: null,
            afterState: null,
            ipAddress: "192.168.1.100",
            userAgent: "Mozilla/5.0",
            correlationId: "corr-123",
            occurredAt: "2026-08-27T12:00:00Z",
          },
        ],
        pagination: { nextCursor: "cur-2" },
      };

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });
      vi.stubGlobal("fetch", fetchMock);

      const result = await auditApi.listEvents({
        category: "security",
        search: "Admin",
        limit: 20,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0]?.action).toBe("USER_LOGIN");
      expect(result.nextCursor).toBe("cur-2");

      const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
      const parsedUrl = new URL(url);
      expect(parsedUrl.pathname).toBe("/api/audit");
      expect(parsedUrl.searchParams.get("category")).toBe("security");
      expect(parsedUrl.searchParams.get("search")).toBe("Admin");
      expect(parsedUrl.searchParams.get("limit")).toBe("20");
      expect(options.credentials).toBe("include");
    });
  });

  describe("getStats", () => {
    it("llama a GET /api/audit/stats y retorna métricas de auditoría", async () => {
      const mockStats = {
        totalEvents: 42,
        byCategory: {
          security: 10,
          operational: 25,
          data_change: 5,
          system: 2,
        },
        topActions: [{ action: "CASE_CLAIMED", count: 15 }],
        topActors: [{ actorId: "ag-1", actorName: "Admin", count: 20 }],
      };

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: mockStats }),
      });
      vi.stubGlobal("fetch", fetchMock);

      const stats = await auditApi.getStats({ departmentId: "dept-1" });

      expect(stats.totalEvents).toBe(42);
      expect(stats.byCategory.security).toBe(10);

      const [url] = fetchMock.mock.calls[0] as [string];
      const parsedUrl = new URL(url);
      expect(parsedUrl.pathname).toBe("/api/audit/stats");
      expect(parsedUrl.searchParams.get("departmentId")).toBe("dept-1");
    });
  });
});
