import { subscribeRealtimeEvents } from "@/lib/realtime-bus";

/** Notificación in-app derivada de eventos SSE (docs/spec/03_REALTIME_NOTIFICATIONS.md §3). */
export type UiNotification = {
  id: string;
  kind: "CASE_ESCALATED" | "HUMAN_ASSIGNED";
  caseId: string;
  conversationId?: string;
  departmentId?: string | null;
  /** true si HUMAN_ASSIGNED me asignó el caso a mí. */
  isMine?: boolean;
  createdAt: string;
  read: boolean;
};

const MAX_NOTIFICATIONS = 30;
let notifications: UiNotification[] = [];
const listeners = new Set<() => void>();
let wiredForUserId: string | null = null;
let unwireEvents: (() => void) | null = null;

function notify() {
  listeners.forEach((l) => l());
}

function push(n: UiNotification) {
  notifications = [n, ...notifications].slice(0, MAX_NOTIFICATIONS);
  notify();
}

/** Reconecta el listener de eventos cada vez que cambia el agente en sesión. */
export function wireNotifications(userId: string | null): void {
  if (userId === wiredForUserId) return;
  unwireEvents?.();
  unwireEvents = null;
  wiredForUserId = userId;
  notifications = [];
  notify();

  if (!userId) return;

  unwireEvents = subscribeRealtimeEvents((event) => {
    if (event.type === "CASE_ESCALATED") {
      push({
        id: `esc-${event.caseId}-${event.at}`,
        kind: "CASE_ESCALATED",
        caseId: event.caseId,
        conversationId: event.conversationId,
        departmentId: event.departmentId,
        createdAt: event.at,
        read: false,
      });
    } else if (event.type === "HUMAN_ASSIGNED") {
      push({
        id: `asg-${event.caseId}-${Date.now()}`,
        kind: "HUMAN_ASSIGNED",
        caseId: event.caseId,
        isMine: event.agentUserId === userId,
        createdAt: new Date().toISOString(),
        read: false,
      });
    }
  });
}

export function getNotificationsSnapshot(): UiNotification[] {
  return notifications;
}

export function subscribeNotifications(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function markAllNotificationsRead(): void {
  notifications = notifications.map((n) => ({ ...n, read: true }));
  notify();
}
