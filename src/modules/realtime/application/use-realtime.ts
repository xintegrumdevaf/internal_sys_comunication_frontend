import { useEffect, useSyncExternalStore } from "react";
import { toast } from "sonner";
import type { RealtimeEvent } from "@/modules/realtime/domain/realtime-event";
import {
  ensureRealtimeConnection,
  isRealtimeConnected,
  subscribeRealtimeConnection,
  subscribeRealtimeEvents,
} from "@/modules/realtime/infrastructure/realtime-bus";
import {
  getNotificationsSnapshot,
  markAllNotificationsRead,
  subscribeNotifications,
  wireNotifications,
} from "@/modules/realtime/application/notifications.state";
import { incrementUnreadTotal, setTotalUnread, getActiveChatId } from "@/modules/realtime/application/unread.state";
import { listConversations } from "@/modules/conversations/infrastructure/conversation.gateway";

import { useUnreadBadge } from "@/modules/realtime/application/unread.state";

function isAppInBackground(): boolean {
  if (typeof document === "undefined") return false;
  return document.hidden || document.visibilityState === "hidden" || !document.hasFocus();
}

function playNotificationSound(): void {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch {
    // Silently ignore if audio context is blocked
  }
}

function sendDesktopNotification(title: string, options?: NotificationOptions): void {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "granted") {
    try {
      const notification = new Notification(title, {
        icon: "/favicon.ico",
        ...options,
      });
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch {
      // Fallback
    }
  }
}

/**
 * Monta la conexión SSE global + el listener de notificaciones para el agente
 * en sesión, y muestra toasts prominentes para CASE_ESCALATED / HUMAN_ASSIGNED
 * propio (docs/spec/03_REALTIME_NOTIFICATIONS.md §2-3). Se llama una sola vez
 * desde AppShell.
 */
export function useRealtimeSession(userId: string | null): void {
  const unreadCount = useUnreadBadge();

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (unreadCount > 0) {
      document.title = `(${unreadCount}) NetOps AI`;
    } else {
      document.title = "NetOps AI";
    }
  }, [unreadCount]);

  useEffect(() => {
    if (userId && "Notification" in window && Notification.permission === "default") {
      void Notification.requestPermission();
    }
    ensureRealtimeConnection(userId);
    wireNotifications(userId);

    if (userId) {
      void listConversations()
        .then((conversations) => {
          const total = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
          setTotalUnread(total);
        })
        .catch(() => {});
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    return subscribeRealtimeEvents((event: RealtimeEvent) => {
      if (event.type === "CASE_ESCALATED") {
        toast.warning("Caso escalado a humano", {
          description: `Conversación ${event.conversationId.slice(0, 8)}… requiere atención`,
        });
        if (isAppInBackground()) {
          playNotificationSound();
          sendDesktopNotification("Caso escalado a humano", {
            body: "Una conversación requiere atención urgente en la plataforma.",
            tag: `escalation-${event.conversationId}`,
          });
        }
      } else if (event.type === "HUMAN_ASSIGNED" && event.agentUserId === userId) {
        toast.success("Se te asignó un caso", {
          description: `Caso ${event.caseId.slice(0, 8)}… ahora es tuyo`,
        });
        if (isAppInBackground()) {
          playNotificationSound();
          sendDesktopNotification("Se te asignó un nuevo caso", {
            body: "Tienes un caso asignado listo para atender.",
            tag: `assigned-${event.caseId}`,
          });
        }
      } else if (event.type === "MESSAGE_RECEIVED") {
        if (getActiveChatId() !== event.conversationId) {
          incrementUnreadTotal();
        }
        if (isAppInBackground() || getActiveChatId() !== event.conversationId) {
          playNotificationSound();
          const author = event.authorName || "Cliente";
          const body = event.bodyPreview || "Tienes un nuevo mensaje";
          sendDesktopNotification(`Nuevo mensaje de ${author}`, {
            body: body,
            tag: event.conversationId,
          });
        }
      }
    });
  }, [userId]);
}

export function useRealtimeConnected(): boolean {
  return useSyncExternalStore(subscribeRealtimeConnection, isRealtimeConnected, () => false);
}

export function useNotifications() {
  const notifications = useSyncExternalStore(
    subscribeNotifications,
    getNotificationsSnapshot,
    () => [],
  );
  const unreadCount = notifications.filter((n) => !n.read).length;
  return { notifications, unreadCount, markAllRead: markAllNotificationsRead };
}
