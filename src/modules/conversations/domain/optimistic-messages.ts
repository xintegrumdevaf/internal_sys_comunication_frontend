import type { MessageDto } from "@/modules/conversations/domain/conversation";

export const LOCAL_MESSAGE_PREFIX = "local:";

export function isLocalMessage(id: string): boolean {
  return id.startsWith(LOCAL_MESSAGE_PREFIX);
}

function sameOutbound(pending: MessageDto, server: MessageDto): boolean {
  if (server.author !== "agent" && server.direction !== "outbound") return false;
  if (pending.type !== "text" && server.type !== pending.type) return false;

  const pendingTime = Date.parse(pending.createdAt);
  const serverTime = Date.parse(server.createdAt);
  if (Number.isFinite(pendingTime) && Number.isFinite(serverTime) && serverTime + 5000 < pendingTime) {
    return false;
  }

  if (pending.type === "text") {
    return server.body.trim() === pending.body.trim();
  }

  if (pending.filename && server.filename && pending.filename === server.filename) return true;
  const pendingCaption = (pending.caption || pending.body || "").trim();
  const serverCaption = (server.caption || server.body || "").trim();
  return Boolean(pendingCaption) && pendingCaption === serverCaption;
}

/**
 * Une el hilo del servidor con los mensajes locales que aún no tienen id real.
 * Si el servidor ya trajo el mismo envío, el local se descarta para no duplicarlo.
 */
export function reconcileThread(
  previous: MessageDto[],
  server: MessageDto[],
  pending: MessageDto[],
  conversationId: string,
): { messages: MessageDto[]; consumedPendingIds: string[] } {
  const confirmedIds = new Set(previous.filter((message) => !isLocalMessage(message.id)).map((message) => message.id));
  const fresh = server.filter((message) => !confirmedIds.has(message.id));
  const pool = [...fresh];
  const consumedPendingIds: string[] = [];

  for (const local of pending) {
    if (local.conversationId !== conversationId) continue;
    const index = pool.findIndex((serverMessage) => sameOutbound(local, serverMessage));
    if (index >= 0) {
      pool.splice(index, 1);
      consumedPendingIds.push(local.id);
    }
  }

  const consumed = new Set(consumedPendingIds);
  const stillPending = pending.filter(
    (message) => message.conversationId === conversationId && !consumed.has(message.id),
  );
  const serverIds = new Set(server.map((message) => message.id));

  return {
    messages: [...server, ...stillPending.filter((message) => !serverIds.has(message.id))],
    consumedPendingIds,
  };
}
