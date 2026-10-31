import { describe, expect, it } from "vitest";
import type { MessageDto } from "@/modules/conversations/domain/conversation";
import { reconcileThread } from "./optimistic-messages";

function message(partial: Partial<MessageDto> & Pick<MessageDto, "id" | "body">): MessageDto {
  return {
    conversationId: "conv-1",
    caseId: null,
    direction: "outbound",
    author: "agent",
    agentId: "agent-1",
    type: "text",
    createdAt: "2026-10-31T18:00:00.000Z",
    ...partial,
  };
}

describe("reconcileThread", () => {
  it("conserva el mensaje local si el servidor todavía no lo tiene", () => {
    const local = message({ id: "local:1", body: "Hola", createdAt: "2026-10-31T18:00:05.000Z" });
    const server = [message({ id: "m-old", body: "antes", createdAt: "2026-10-31T17:00:00.000Z" })];
    const result = reconcileThread(server, server, [local], "conv-1");
    expect(result.messages.map((item) => item.id)).toEqual(["m-old", "local:1"]);
    expect(result.consumedPendingIds).toEqual([]);
  });

  it("quita el local cuando el servidor ya devolvió ese envío", () => {
    const local = message({ id: "local:1", body: "Hola", createdAt: "2026-10-31T18:00:05.000Z" });
    const saved = message({ id: "m-new", body: "Hola", createdAt: "2026-10-31T18:00:06.000Z" });
    const previous = [message({ id: "m-old", body: "antes" }), local];
    const result = reconcileThread(
      previous,
      [message({ id: "m-old", body: "antes" }), saved],
      [local],
      "conv-1",
    );
    expect(result.messages.map((item) => item.id)).toEqual(["m-old", "m-new"]);
    expect(result.consumedPendingIds).toEqual(["local:1"]);
  });

  it("no confunde un texto igual más antiguo con el envío en curso", () => {
    const local = message({ id: "local:2", body: "ok", createdAt: "2026-10-31T18:00:10.000Z" });
    const oldOk = message({ id: "m-old", body: "ok", createdAt: "2026-10-31T12:00:00.000Z" });
    const result = reconcileThread([], [oldOk], [local], "conv-1");
    expect(result.messages.map((item) => item.id)).toEqual(["m-old", "local:2"]);
  });
});
