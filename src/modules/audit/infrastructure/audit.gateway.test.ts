import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { listAuditEvents } from "./audit.gateway";

describe("audit.gateway", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_API_BASE_URL", "http://localhost:3000");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("listAuditEvents omite el query param limit si no se pasa", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "",
      text: () => Promise.resolve(JSON.stringify({ data: [] })),
    });
    vi.stubGlobal("fetch", fetchMock);

    await listAuditEvents();

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toBe("http://localhost:3000/api/audit");
  });

  it("listAuditEvents incluye limit cuando se pasa", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "",
      text: () => Promise.resolve(JSON.stringify({ data: [] })),
    });
    vi.stubGlobal("fetch", fetchMock);

    await listAuditEvents(50);

    const [url] = fetchMock.mock.calls[0] as [string];
    const parsed = new URL(url);
    expect(parsed.searchParams.get("limit")).toBe("50");
  });
});
