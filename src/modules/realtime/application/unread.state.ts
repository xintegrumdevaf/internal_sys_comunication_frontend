import { useSyncExternalStore } from "react";

const listeners = new Set<() => void>();
let unreadConversationIds = new Set<string>();
let activeChatId: string | null = null;
let unreadCountOverride: number | null = null;

function notify() {
  listeners.forEach((l) => l());
}

export function setUnreadConversations(ids: string[]) {
  unreadCountOverride = null;
  const filtered = ids.filter((id) => Boolean(id) && id !== activeChatId);
  unreadConversationIds = new Set(filtered);
  notify();
}

export function markConversationUnread(id: string) {
  if (id && id !== activeChatId) {
    if (unreadCountOverride !== null) {
      unreadCountOverride = null;
    }
    if (!unreadConversationIds.has(id)) {
      unreadConversationIds.add(id);
      notify();
    }
  }
}

export function markConversationRead(id: string) {
  let changed = false;
  if (id) {
    if (unreadConversationIds.has(id)) {
      unreadConversationIds.delete(id);
      changed = true;
    }
    if (unreadCountOverride !== null) {
      unreadCountOverride = Math.max(0, unreadCountOverride - 1);
      changed = true;
    }
    if (changed) {
      notify();
    }
  }
}

export function setTotalUnread(total: number) {
  unreadConversationIds.clear();
  unreadCountOverride = Math.max(0, total);
  notify();
}

export function incrementUnreadTotal(conversationId?: string) {
  if (conversationId) {
    markConversationUnread(conversationId);
  } else {
    if (unreadCountOverride !== null) {
      unreadCountOverride += 1;
    } else {
      unreadCountOverride = unreadConversationIds.size + 1;
    }
    notify();
  }
}

export function getActiveChatId() {
  return activeChatId;
}

export function setActiveChatId(id: string | null) {
  activeChatId = id;
  if (id && unreadConversationIds.has(id)) {
    unreadConversationIds.delete(id);
    notify();
  }
}

export function subscribeUnread(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getUnreadSnapshot() {
  return unreadCountOverride !== null ? unreadCountOverride : unreadConversationIds.size;
}

export function useUnreadBadge() {
  return useSyncExternalStore(subscribeUnread, getUnreadSnapshot, () => 0);
}

export function _resetUnreadStateForTesting() {
  unreadConversationIds.clear();
  activeChatId = null;
  unreadCountOverride = null;
  listeners.clear();
}
