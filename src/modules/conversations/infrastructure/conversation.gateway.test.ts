import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { listConversations, listMessages } from "./conversation.gateway";

function mockFetchOnce(body: unknown) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    statusText: "",
    text: () => Promise.resolve(JSON.stringify({ data: body })),
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("conversation.gateway", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_API_BASE_URL", "http://localhost:3000");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("listConversations omite filtros undefined en la query string", async () => {
    const fetchMock = mockFetchOnce([]);
    await listConversations({ status: "open" });

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toBe("http://localhost:3000/api/conversations?status=open");
  });

  it("listConversations incluye departmentId/userId cuando se pasan (filtro de assignedAgentId en el backend)", async () => {
    const fetchMock = mockFetchOnce([]);
    await listConversations({ departmentId: "dept_1", userId: "agent_1" });

    const [url] = fetchMock.mock.calls[0] as [string];
    const parsed = new URL(url);
    expect(parsed.searchParams.get("departmentId")).toBe("dept_1");
    expect(parsed.searchParams.get("userId")).toBe("agent_1");
  });

  it("listMessages resuelve mediaUrl relativo contra la base de la API", async () => {
    mockFetchOnce([
      {
        id: "msg_1",
        conversationId: "conv_1",
        caseId: null,
        direction: "inbound",
        author: "customer",
        body: "foto",
        type: "image",
        createdAt: new Date().toISOString(),
        mediaUrl: "/api/media/abc",
      },
    ]);

    const messages = await listMessages("conv_1");
    expect(messages[0]!.mediaUrl).toBe("http://localhost:3000/api/media/abc");
  });

  it("listMessages deja mediaUrl absolutas intactas", async () => {
    mockFetchOnce([
      {
        id: "msg_1",
        conversationId: "conv_1",
        caseId: null,
        direction: "inbound",
        author: "customer",
        body: "foto",
        type: "image",
        createdAt: new Date().toISOString(),
        mediaUrl: "https://cdn.example/x.png",
      },
    ]);

    const messages = await listMessages("conv_1");
    expect(messages[0]!.mediaUrl).toBe("https://cdn.example/x.png");
  });
});
