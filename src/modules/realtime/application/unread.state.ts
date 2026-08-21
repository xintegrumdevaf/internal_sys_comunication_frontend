import { useSyncExternalStore } from "react";

const listeners = new Set<() => void>();
let unreadTotal = 0;
let activeChatId: string | null = null;

function notify() {
  listeners.forEach((l) => l());
}

export function setTotalUnread(total: number) {
  unreadTotal = total;
  notify();
}

export function incrementUnreadTotal() {
  unreadTotal += 1;
  notify();
}

export function getActiveChatId() {
  return activeChatId;
}

export function setActiveChatId(id: string | null) {
  activeChatId = id;
}

export function subscribeUnread(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getUnreadSnapshot() {
  return unreadTotal;
}

export function useUnreadBadge() {
  return useSyncExternalStore(subscribeUnread, getUnreadSnapshot, () => 0);
}
