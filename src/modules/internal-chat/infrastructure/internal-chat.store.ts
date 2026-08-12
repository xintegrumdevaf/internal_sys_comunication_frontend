import type {
  InternalChatState,
  InternalMessage,
  InternalThread,
  Mention,
  RecentMentionEntry,
} from "@/modules/internal-chat/domain/internal-chat";

/**
 * Persistencia local (localStorage) del chat interno - es un feature sin
 * equivalente en isp-customer-service-api por diseno (docs/spec/02_MODULES.md).
 */

const KEY = "netops.internalChat.v1";
const listeners = new Set<() => void>();

let cacheEpoch = 0;
let cachedEpoch = -1;
let cachedState: InternalChatState | null = null;

function emptyState(): InternalChatState {
  return { threads: [], messages: [] };
}

function notify() {
  cacheEpoch += 1;
  listeners.forEach((l) => l());
}

function readState(): InternalChatState {
  if (typeof window === "undefined") return emptyState();
  if (cachedEpoch === cacheEpoch && cachedState) return cachedState;
  cachedEpoch = cacheEpoch;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) {
      cachedState = emptyState();
      return cachedState;
    }
    const parsed = JSON.parse(raw) as InternalChatState;
    cachedState = {
      threads: Array.isArray(parsed.threads) ? parsed.threads : [],
      messages: Array.isArray(parsed.messages) ? parsed.messages : [],
    };
  } catch {
    cachedState = emptyState();
  }
  return cachedState;
}

function writeState(next: InternalChatState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(next));
  cachedState = next;
  notify();
}

export function pairKey(userAId: string, userBId: string): string {
  return [userAId, userBId].sort().join(":");
}

function newId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

export function subscribeInternalChat(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY || e.key === null) {
      cacheEpoch += 1;
      cb();
    }
  };
  if (typeof window !== "undefined") {
    window.addEventListener("storage", onStorage);
  }
  return () => {
    listeners.delete(cb);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", onStorage);
    }
  };
}

export function getInternalChatSnapshot(): InternalChatState {
  return readState();
}

export function getOrCreateThread(userAId: string, userBId: string): InternalThread {
  if (userAId === userBId) {
    throw new Error("No se puede crear un chat consigo mismo");
  }
  const state = readState();
  const key = pairKey(userAId, userBId);
  const existing = state.threads.find((t) => pairKey(t.userAId, t.userBId) === key);
  if (existing) return existing;

  const [a, b] = [userAId, userBId].sort();
  const thread: InternalThread = {
    id: `ith_${key.replace(":", "_")}`,
    userAId: a!,
    userBId: b!,
    updatedAt: new Date().toISOString(),
  };
  writeState({ ...state, threads: [thread, ...state.threads] });
  return thread;
}

export function listThreadsForUser(userId: string): InternalThread[] {
  return readState()
    .threads.filter((t) => t.userAId === userId || t.userBId === userId)
    .slice()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function listMessages(threadId: string): InternalMessage[] {
  return readState()
    .messages.filter((m) => m.threadId === threadId)
    .slice()
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function sendInternalMessage(input: {
  threadId: string;
  authorId: string;
  body: string;
  mentions: Mention[];
}): InternalMessage {
  const state = readState();
  const thread = state.threads.find((t) => t.id === input.threadId);
  if (!thread) throw new Error("Hilo interno no encontrado");
  if (thread.userAId !== input.authorId && thread.userBId !== input.authorId) {
    throw new Error("No eres participante de este hilo");
  }

  const now = new Date().toISOString();
  const message: InternalMessage = {
    id: newId("im"),
    threadId: input.threadId,
    authorId: input.authorId,
    body: input.body.trim(),
    mentions: input.mentions,
    createdAt: now,
  };

  writeState({
    threads: state.threads.map((t) => (t.id === thread.id ? { ...t, updatedAt: now } : t)),
    messages: [...state.messages, message],
  });

  return message;
}

export function listRecentMentionsByAuthor(authorId: string): RecentMentionEntry[] {
  const state = readState();
  const entries: RecentMentionEntry[] = [];
  for (const message of state.messages) {
    if (message.authorId !== authorId) continue;
    for (const mention of message.mentions) {
      entries.push({
        id: `${message.id}:${mention.type}:${mention.targetId}`,
        messageId: message.id,
        threadId: message.threadId,
        mention,
        authorId: message.authorId,
        createdAt: message.createdAt,
      });
    }
  }
  return entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function peerIdOfThread(thread: InternalThread, selfId: string): string {
  return thread.userAId === selfId ? thread.userBId : thread.userAId;
}

export function lastMessagePreview(threadId: string): string {
  const msgs = listMessages(threadId);
  const last = msgs[msgs.length - 1];
  if (!last) return "Sin mensajes";
  if (last.body.includes("[[quality-review:")) {
    return "Briefing de calidad";
  }
  return last.body.replace(/@\[[^\]]+\]\([^)]+\)/g, (m) => {
    const label = m.match(/@\[([^\]]+)\]/)?.[1];
    return label ? `@${label}` : m;
  });
}
