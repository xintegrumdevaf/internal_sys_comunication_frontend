import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { settingsApi } from "./settings.api";

describe("settingsApi", () => {
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

  it("getSettings realiza GET a /api/admin/settings", async () => {
    const mockData = {
      channels: { provider: "meta", phoneNumberId: "123" },
      ai: { provider: "gemini", geminiModel: "gemini-2.5-flash" },
    };
    const fetchMock = mockFetchOnce(mockData);

    const res = await settingsApi.getSettings();
    expect(res).toEqual(mockData);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/admin/settings"),
      expect.anything(),
    );
  });

  it("updateChannels realiza PUT a /api/admin/settings/channels", async () => {
    const mockUpdated = { provider: "zernio", zernioAccountId: "acc-1" };
    const fetchMock = mockFetchOnce(mockUpdated);

    const res = await settingsApi.updateChannels({ provider: "zernio" });
    expect(res).toEqual(mockUpdated);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/admin/settings/channels"),
      expect.objectContaining({ method: "PUT" }),
    );
  });

  it("updateAi realiza PUT a /api/admin/settings/ai", async () => {
    const mockUpdated = { provider: "ollama", ollamaModel: "qwen3.5:4b" };
    const fetchMock = mockFetchOnce(mockUpdated);

    const res = await settingsApi.updateAi({ provider: "ollama" });
    expect(res).toEqual(mockUpdated);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/admin/settings/ai"),
      expect.objectContaining({ method: "PUT" }),
    );
  });

  it("testAi realiza POST a /api/admin/settings/test-ai", async () => {
    const mockResult = { ok: true, latencyMs: 120, message: "Conexión exitosa" };
    const fetchMock = mockFetchOnce(mockResult);

    const res = await settingsApi.testAi({ provider: "gemini" });
    expect(res).toEqual(mockResult);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/admin/settings/test-ai"),
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("testChannels realiza POST a /api/admin/settings/test-channels", async () => {
    const mockResult = { ok: true, latencyMs: 85, message: "Meta conectado" };
    const fetchMock = mockFetchOnce(mockResult);

    const res = await settingsApi.testChannels({ provider: "meta" });
    expect(res).toEqual(mockResult);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/admin/settings/test-channels"),
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("getSetupStatus realiza GET a /api/admin/settings/setup-status", async () => {
    const mockStatus = { isChannelConfigured: true, isAiConfigured: true };
    const fetchMock = mockFetchOnce(mockStatus);

    const res = await settingsApi.getSetupStatus();
    expect(res).toEqual(mockStatus);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/admin/settings/setup-status"),
      expect.anything(),
    );
  });
});
