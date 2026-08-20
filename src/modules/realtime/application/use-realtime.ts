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

/**
 * Monta la conexión SSE global + el listener de notificaciones para el agente
 * en sesión, y muestra toasts prominentes para CASE_ESCALATED / HUMAN_ASSIGNED
 * propio (docs/spec/03_REALTIME_NOTIFICATIONS.md §2-3). Se llama una sola vez
 * desde AppShell.
 */
export function useRealtimeSession(userId: string | null): void {
  useEffect(() => {
    if (userId && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    ensureRealtimeConnection(userId);
    wireNotifications(userId);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    return subscribeRealtimeEvents((event: RealtimeEvent) => {
      if (event.type === "CASE_ESCALATED") {
        toast.warning("Caso escalado a humano", {
          description: `Conversación ${event.conversationId.slice(0, 8)}… requiere atención`,
        });
        if (document.visibilityState === "hidden" && Notification.permission === "granted") {
          new Notification("Caso escalado a humano", { body: "Una conversación requiere atención en la plataforma." });
        }
      } else if (event.type === "HUMAN_ASSIGNED" && event.agentUserId === userId) {
        toast.success("Se te asignó un caso", {
          description: `Caso ${event.caseId.slice(0, 8)}… ahora es tuyo`,
        });
        if (document.visibilityState === "hidden" && Notification.permission === "granted") {
          new Notification("Se te asignó un nuevo caso", { body: "Tienes un caso asignado listo para atender." });
        }
      } else if (event.type === "MESSAGE_RECEIVED") {
        if (document.visibilityState === "hidden" && Notification.permission === "granted") {
          const author = event.authorName || "Cliente";
          const body = event.bodyPreview || "Tienes un nuevo mensaje";
          const notification = new Notification(`Nuevo mensaje de ${author}`, {
            body: body,
            tag: event.conversationId, // Agrupa múltiples mensajes del mismo chat
          });
          
          notification.onclick = () => {
            window.focus();
          };
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
