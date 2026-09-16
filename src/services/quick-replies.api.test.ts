import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { quickRepliesApi } from "./quick-replies.api";
import type { QuickReply } from "@/types/quick-reply";

describe("quickRepliesApi", () => {
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

  const sampleReply: QuickReply = {
    id: "qr-1",
    shortcut: "saludo",
    title: "Saludo Inicial",
    body: "Hola {{nombre}}, ¿cómo estás?",
    departmentId: null,
    category: "general",
    mediaUrl: null,
    createdByAgentId: "agent-1",
    active: true,
    createdAt: "2026-09-14T00:00:00Z",
    updatedAt: "2026-09-14T00:00:00Z",
  };

  it("list hace GET a /api/quick-replies con query params", async () => {
    const fetchMock = mockFetchOnce({ quickReplies: [sampleReply] });

    const result = await quickRepliesApi.list({
      departmentId: null,
      search: "saludo",
      activeOnly: true,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [calledUrl] = fetchMock.mock.calls[0];
    expect(calledUrl).toContain("/api/quick-replies");
    expect(calledUrl).toContain("departmentId=null");
    expect(calledUrl).toContain("search=saludo");
    expect(calledUrl).toContain("activeOnly=true");
    expect(result).toEqual([sampleReply]);
  });

  it("resolve hace GET a /api/quick-replies/resolve", async () => {
    const resolvedPayload = {
      quickReply: sampleReply,
      interpolatedBody: "Hola Juan, ¿cómo estás?",
      contextUsed: { nombre: "Juan" },
    };
    const fetchMock = mockFetchOnce(resolvedPayload);

    const result = await quickRepliesApi.resolve({
      shortcut: "saludo",
      conversationId: "conv-123",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [calledUrl] = fetchMock.mock.calls[0];
    expect(calledUrl).toContain("/api/quick-replies/resolve");
    expect(calledUrl).toContain("shortcut=saludo");
    expect(calledUrl).toContain("conversationId=conv-123");
    expect(result).toEqual(resolvedPayload);
  });

  it("create hace POST a /api/quick-replies", async () => {
    const fetchMock = mockFetchOnce({ quickReply: sampleReply });

    const result = await quickRepliesApi.create({
      shortcut: "saludo",
      title: "Saludo Inicial",
      body: "Hola {{nombre}}",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [calledUrl, options] = fetchMock.mock.calls[0];
    expect(calledUrl).toContain("/api/quick-replies");
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toEqual({
      shortcut: "saludo",
      title: "Saludo Inicial",
      body: "Hola {{nombre}}",
    });
    expect(result).toEqual(sampleReply);
  });

  it("update hace PUT a /api/quick-replies/:id", async () => {
    const updated = { ...sampleReply, title: "Nuevo Título" };
    const fetchMock = mockFetchOnce({ quickReply: updated });

    const result = await quickRepliesApi.update("qr-1", {
      title: "Nuevo Título",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [calledUrl, options] = fetchMock.mock.calls[0];
    expect(calledUrl).toContain("/api/quick-replies/qr-1");
    expect(options.method).toBe("PUT");
    expect(result).toEqual(updated);
  });

  it("delete hace DELETE a /api/quick-replies/:id", async () => {
    const fetchMock = mockFetchOnce(undefined, 204);

    await quickRepliesApi.delete("qr-1");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [calledUrl, options] = fetchMock.mock.calls[0];
    expect(calledUrl).toContain("/api/quick-replies/qr-1");
    expect(options.method).toBe("DELETE");
  });

  it("refineTone hace POST a /api/quick-replies/refine-tone", async () => {
    const fetchMock = mockFetchOnce({
      refinedText: "Hola estimado {{nombre}}, ¿en qué podemos servirle hoy?",
    });

    const result = await quickRepliesApi.refineTone("Hola {{nombre}}");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [calledUrl, options] = fetchMock.mock.calls[0];
    expect(calledUrl).toContain("/api/quick-replies/refine-tone");
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toEqual({ text: "Hola {{nombre}}" });
    expect(result).toBe("Hola estimado {{nombre}}, ¿en qué podemos servirle hoy?");
  });
});
