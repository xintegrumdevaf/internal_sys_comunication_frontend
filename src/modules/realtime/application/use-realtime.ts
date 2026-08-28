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
import {
  incrementUnreadTotal,
  setTotalUnread,
  getActiveChatId,
} from "@/modules/realtime/application/unread.state";
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

let titleFlashTimer: ReturnType<typeof setInterval> | null = null;
function flashDocumentTitle(text: string): void {
  if (typeof document === "undefined") return;
  if (titleFlashTimer) clearInterval(titleFlashTimer);

  const originalTitle = document.title;
  let toggle = false;
  titleFlashTimer = setInterval(() => {
    if (!document.hidden && document.hasFocus()) {
      if (titleFlashTimer) clearInterval(titleFlashTimer);
      titleFlashTimer = null;
      document.title = originalTitle;
      return;
    }
    document.title = toggle ? `🔔 ${text}` : `💬 NetOps AI`;
    toggle = !toggle;
  }, 1000);
}

export async function requestDesktopNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }
  try {
    const perm = await Notification.requestPermission();
    if (perm === "granted") {
      toast.success("Notificaciones del navegador activadas");
    } else if (perm === "denied") {
      toast.error("Las notificaciones fueron bloqueadas en la configuración de tu navegador");
    }
    return perm;
  } catch {
    return Notification.permission;
  }
}

export type AppNotificationOptions = NotificationOptions & {
  renotify?: boolean;
};

export function sendDesktopNotification(title: string, options?: AppNotificationOptions): void {
  if (typeof window === "undefined" || !("Notification" in window)) return;

  const showNotification = () => {
    try {
      const notification = new Notification(title, {
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        ...options,
      } as NotificationOptions);
      notification.onclick = (e) => {
        e.preventDefault();
        window.focus();
        if (typeof window.focus === "function") {
          window.focus();
        }
        notification.close();
      };
    } catch {
      // Fallback si la API de Notification no soporta ciertos parámetros
      try {
        new Notification(title, { body: options?.body });
      } catch {
        // Silencioso
      }
    }
  };

  if (Notification.permission === "granted") {
    showNotification();
  } else if (Notification.permission === "default") {
    void Notification.requestPermission().then((perm) => {
      if (perm === "granted") {
        showNotification();
      }
    });
  }
}

export function sendTestDesktopNotification(): void {
  if (typeof window === "undefined" || !("Notification" in window)) {
    toast.error("Este navegador no soporta notificaciones de escritorio");
    return;
  }

  if (Notification.permission === "granted") {
    playNotificationSound();
    sendDesktopNotification("Notificación de prueba — NetOps AI", {
      body: "¡Las notificaciones del navegador están funcionando correctamente incluso al minimizar!",
      tag: `test-notification-${Date.now()}`,
      renotify: true,
    });
    toast.success(
      "Notificación enviada. Revisa la esquina de tu pantalla o centro de notificaciones.",
    );
  } else {
    void requestDesktopNotificationPermission().then((perm) => {
      if (perm === "granted") {
        sendTestDesktopNotification();
      }
    });
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
    ensureRealtimeConnection(userId);
    wireNotifications(userId);

    if (userId) {
      if (typeof window !== "undefined" && "Notification" in window) {
        if (Notification.permission === "default") {
          void Notification.requestPermission().catch(() => {});
        }
      }

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
          flashDocumentTitle("¡Caso escalado!");
          sendDesktopNotification("Caso escalado a humano", {
            body: "Una conversación requiere atención urgente en la plataforma.",
            tag: `escalation-${event.conversationId}`,
            renotify: true,
          });
        }
      } else if (event.type === "HUMAN_ASSIGNED" && event.agentUserId === userId) {
        toast.success("Se te asignó un caso", {
          description: `Caso ${event.caseId.slice(0, 8)}… ahora es tuyo`,
        });
        if (isAppInBackground()) {
          playNotificationSound();
          flashDocumentTitle("¡Nuevo caso asignado!");
          sendDesktopNotification("Se te asignó un nuevo caso", {
            body: "Tienes un caso asignado listo para atender.",
            tag: `assigned-${event.caseId}`,
            renotify: true,
          });
        }
      } else if (event.type === "MESSAGE_RECEIVED") {
        const isCurrentActiveChat = getActiveChatId() === event.conversationId;
        const inBackground = isAppInBackground();

        if (!isCurrentActiveChat) {
          incrementUnreadTotal();
        }
        if (inBackground || !isCurrentActiveChat) {
          playNotificationSound();
          const author = event.authorName || "Cliente";
          const body = event.bodyPreview || "Tienes un nuevo mensaje";
          if (inBackground) {
            flashDocumentTitle(`Nuevo mensaje de ${author}`);
          }
          sendDesktopNotification(`Nuevo mensaje de ${author}`, {
            body: body,
            tag: `msg-${event.conversationId}-${Date.now()}`,
            renotify: true,
          });
        }
      } else if (event.type === "INTERNAL_MESSAGE_SENT") {
        if (event.senderAgentId && event.senderAgentId !== userId) {
          playNotificationSound();
          const author = (event.senderAgentName as string) || "Compañero";
          const isQualityQuote = event.messageType === "quality_quote";
          const title = isQualityQuote
            ? `Observación de calidad de ${author}`
            : `Mensaje interno de ${author}`;
          const body =
            (event.body as string) ||
            (event.bodyPreview as string) ||
            "Nuevo mensaje en chat interno";
          toast.info(title, { description: body });
          if (isAppInBackground()) {
            flashDocumentTitle(title);
            sendDesktopNotification(title, {
              body,
              tag: `internal-msg-${event.threadId}-${Date.now()}`,
              renotify: true,
            });
          }
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
