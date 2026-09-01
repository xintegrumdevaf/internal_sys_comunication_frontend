import { describe, it, expect, vi, beforeEach } from "vitest";
import { internalChatApi } from "./internalChatApi";

describe("internalChatApi", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("getThreads fetches internal threads", async () => {
    const mockThreads = [
      {
        id: "ith_1",
        type: "direct",
        referenceId: null,
        participants: [],
        unreadCount: 2,
        lastMessage: null,
        createdAt: "2026-08-27T00:00:00Z",
        updatedAt: "2026-08-27T00:00:00Z",
      },
    ];

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: "OK",
      text: async () => JSON.stringify({ data: mockThreads }),
    } as Response);

    const result = await internalChatApi.getThreads();
    expect(result).toEqual(mockThreads);
  });

  it("getOrCreateDirectThread posts peerAgentId", async () => {
    const mockThread = {
      id: "ith_direct_1",
      type: "direct",
      referenceId: "rev_1",
      participants: [],
      unreadCount: 0,
      lastMessage: null,
      createdAt: "2026-08-27T00:00:00Z",
      updatedAt: "2026-08-27T00:00:00Z",
    };

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: "OK",
      text: async () => JSON.stringify({ data: mockThread }),
    } as Response);

    const result = await internalChatApi.getOrCreateDirectThread("agent_2", "rev_1");
    expect(result).toEqual(mockThread);
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("/api/internal/threads/direct"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ peerAgentId: "agent_2", referenceId: "rev_1" }),
      }),
    );
  });

  it("getMessages fetches messages with query parameters", async () => {
    const mockMessages = [
      {
        id: "msg_1",
        threadId: "ith_1",
        senderAgentId: "agent_1",
        senderAgentName: "Agent 1",
        type: "text",
        body: "Hello",
        contextData: {},
        createdAt: "2026-08-27T00:00:00Z",
      },
    ];

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: "OK",
      text: async () =>
        JSON.stringify({ data: mockMessages, pagination: { nextCursor: "cursor_2" } }),
    } as Response);

    const result = await internalChatApi.getMessages("ith_1", { limit: 20, cursor: "cursor_1" });
    expect(result.messages).toEqual(mockMessages);
    expect(result.nextCursor).toBe("cursor_2");
  });

  it("sendMessage posts message payload", async () => {
    const mockMsg = {
      id: "msg_2",
      threadId: "ith_1",
      senderAgentId: "agent_1",
      senderAgentName: "Agent 1",
      type: "quality_quote",
      body: "Observación",
      contextData: { category: "disrespect", severity: "high" },
      createdAt: "2026-08-27T00:00:00Z",
    };

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: "OK",
      text: async () => JSON.stringify({ data: mockMsg }),
    } as Response);

    const result = await internalChatApi.sendMessage("ith_1", {
      body: "Observación",
      type: "quality_quote",
      contextData: { category: "disrespect", severity: "high" },
    });

    expect(result).toEqual(mockMsg);
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("/api/internal/threads/ith_1/messages"),
      expect.objectContaining({
        method: "POST",
      }),
    );
  });

  it("markAsRead sends POST to read endpoint", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 204,
      statusText: "No Content",
      text: async () => "",
    } as Response);

    await internalChatApi.markAsRead("ith_1");
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("/api/internal/threads/ith_1/read"),
      expect.objectContaining({
        method: "POST",
      }),
    );
  });
});
