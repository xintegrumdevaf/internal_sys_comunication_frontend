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
  setUnreadConversations,
  markConversationUnread,
  markConversationRead,
  getActiveChatId,
} from "@/modules/realtime/application/unread.state";
import { listConversations } from "@/modules/conversations/infrastructure/conversation.gateway";
import { formatWaPhone } from "@/modules/conversations/domain/conversation";
import { RealtimeToastCard } from "@/modules/realtime/ui/RealtimeToastCard";
import type { SessionUser } from "@/modules/identity/domain/session";

import { useUnreadBadge } from "@/modules/realtime/application/unread.state";

function isAppInBackground(): boolean {
  if (typeof document === "undefined") return false;
  return document.hidden || document.visibilityState === "hidden" || !document.hasFocus();
}

let notificationAudioCtx: AudioContext | null = null;

function getNotificationAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (notificationAudioCtx && notificationAudioCtx.state !== "closed") {
    return notificationAudioCtx;
  }
  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;
  notificationAudioCtx = new AudioContextClass();
  return notificationAudioCtx;
}

function playNotificationSound(): void {
  try {
    const ctx = getNotificationAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      void ctx.resume().catch(() => {});
    }
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
    document.title = toggle ? `🔔 ${text}` : `💬 GoTicket`;
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
        if (
          options &&
          "data" in options &&
          options.data &&
          typeof options.data === "object" &&
          "url" in options.data
        ) {
          window.location.href = String((options.data as { url: string }).url);
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
    sendDesktopNotification("Notificación de prueba — GoTicket", {
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
export function useRealtimeSession(sessionOrUserId: SessionUser | string | null): void {
  const userId =
    typeof sessionOrUserId === "string" ? sessionOrUserId : (sessionOrUserId?.id ?? null);
  const userRole = typeof sessionOrUserId === "object" ? sessionOrUserId?.role : undefined;
  const userDepartmentIds =
    typeof sessionOrUserId === "object" && sessionOrUserId
      ? sessionOrUserId.activeDepartmentIds && sessionOrUserId.activeDepartmentIds.length > 0
        ? sessionOrUserId.activeDepartmentIds
        : sessionOrUserId.departmentIds
      : [];
  const unreadCount = useUnreadBadge();

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (unreadCount > 0) {
      document.title = `(${unreadCount}) GoTicket`;
    } else {
      document.title = "GoTicket";
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

      void listConversations({ status: "open" })
        .then((conversations) => {
          const unreadIds = conversations
            .filter((c) => {
              if ((c.unreadCount || 0) <= 0) return false;
              // Para agentes: el badge se acota a sus casos asignados o en la cola de su área
              if (userRole === "agent") {
                const isAssignedToMe = c.activeCase?.assignedAgentId === userId;
                const isMyDeptUnassigned = Boolean(
                  c.activeCase?.departmentId &&
                  userDepartmentIds.includes(c.activeCase.departmentId) &&
                  !c.activeCase.assignedAgentId,
                );
                return isAssignedToMe || isMyDeptUnassigned;
              }
              // Para managers y admins: se conserva la visión general de la empresa
              return true;
            })
            .map((c) => c.id);
          setUnreadConversations(unreadIds);
        })
        .catch(() => {});
    }
  }, [userId, userRole, userDepartmentIds]);

  useEffect(() => {
    if (!userId) return;
    return subscribeRealtimeEvents((event: RealtimeEvent) => {
      if (event.type === "CASE_ESCALATED") {
        const targetUrl = `/bandeja?conversationId=${encodeURIComponent(event.conversationId)}&status=open`;
        toast.custom(
          (t) => (
            <RealtimeToastCard
              type="escalated"
              title="Caso escalado a humano"
              customerName={event.customerName}
              customerPhone={event.customerPhone}
              reason={event.reason}
              actionLabel="Atender conversación"
              onAction={() => {
                toast.dismiss(t);
                window.location.href = targetUrl;
              }}
              onDismiss={() => toast.dismiss(t)}
            />
          ),
          { duration: 10000 },
        );
        if (isAppInBackground()) {
          playNotificationSound();
          flashDocumentTitle("¡Caso escalado!");
          const customerLabel =
            event.customerName ||
            (event.customerPhone ? formatWaPhone(event.customerPhone) : "Cliente");
          sendDesktopNotification("🚨 Caso escalado a humano", {
            body: `${customerLabel} requiere atención inmediata en la bandeja de entrada.`,
            tag: `escalation-${event.conversationId}`,
            renotify: true,
            data: { url: targetUrl },
          });
        }
      } else if (event.type === "HUMAN_ASSIGNED") {
        // Si el caso fue asignado a otro asesor y el usuario actual es agente, removerlo de sus no leídos
        if (event.agentUserId !== userId && userRole === "agent" && event.conversationId) {
          markConversationRead(event.conversationId);
        }

        if (event.agentUserId === userId) {
          const targetUrl = event.conversationId
            ? `/bandeja?conversationId=${encodeURIComponent(event.conversationId)}&status=open`
            : `/bandeja`;

          toast.custom(
            (t) => (
              <RealtimeToastCard
                type="assigned"
                title="Se te asignó un caso"
                customerName={event.customerName}
                customerPhone={event.customerPhone}
                actionLabel="Atender caso"
                onAction={() => {
                  toast.dismiss(t);
                  window.location.href = targetUrl;
                }}
                onDismiss={() => toast.dismiss(t)}
              />
            ),
            { duration: 10000 },
          );
          if (isAppInBackground()) {
            playNotificationSound();
            flashDocumentTitle("¡Nuevo caso asignado!");
            const customerLabel =
              event.customerName ||
              (event.customerPhone ? formatWaPhone(event.customerPhone) : "Nuevo cliente");
            sendDesktopNotification("🎯 Se te asignó un nuevo caso", {
              body: `${customerLabel} ha sido asignado a tu bandeja listo para atender.`,
              tag: `assigned-${event.caseId}`,
              renotify: true,
              data: { url: targetUrl },
            });
          }
        }
      } else if (event.type === "CASE_SCHEDULED_REMINDER") {
        const isAssignedToMe = Boolean(event.assignedAgentId && event.assignedAgentId === userId);
        const isMyDept = Boolean(
          event.departmentId && userDepartmentIds.includes(event.departmentId),
        );
        const isPrivilegedSupervisor = userRole === "manager" || userRole === "admin";

        // Solo alertar si el caso está asignado al usuario actual, o está en la cola de su área, o si es supervisor
        if (isAssignedToMe || (!event.assignedAgentId && isMyDept) || isPrivilegedSupervisor) {
          const targetUrl = event.conversationId
            ? `/bandeja?conversationId=${encodeURIComponent(event.conversationId)}&status=pending`
            : `/bandeja`;

          toast.custom(
            (t) => (
              <RealtimeToastCard
                type="reminder"
                title="Recordatorio de caso agendado"
                scheduleTag={event.scheduleTag}
                reminderReason={event.reminderReason}
                actionLabel="Ver caso agendado"
                onAction={() => {
                  toast.dismiss(t);
                  window.location.href = targetUrl;
                }}
                onDismiss={() => toast.dismiss(t)}
              />
            ),
            { duration: 12000 },
          );
          playNotificationSound();
          if (isAppInBackground()) {
            flashDocumentTitle("⏰ Recordatorio de caso");
            sendDesktopNotification("⏰ Recordatorio de caso agendado", {
              body: event.reminderReason || "Es momento de verificar el caso agendado.",
              tag: `reminder-${event.caseId}-${Date.now()}`,
              renotify: true,
              data: { url: targetUrl },
            });
          }
        }
      } else if (event.type === "MESSAGE_RECEIVED") {
        const isCurrentActiveChat = getActiveChatId() === event.conversationId;
        const inBackground = isAppInBackground();

        const isAssignedToOther = Boolean(
          event.assignedAgentId && event.assignedAgentId !== userId,
        );
        const isAssignedToMe = Boolean(event.assignedAgentId && event.assignedAgentId === userId);
        const isMyDepartmentQueue = Boolean(
          event.departmentId &&
          userDepartmentIds.includes(event.departmentId) &&
          !event.assignedAgentId,
        );
        const isPrivilegedSupervisor = userRole === "manager" || userRole === "admin";

        // Filtro del badge de no leídos:
        // - Para managers y admins: se mantiene general para cualquier conversación
        // - Para agentes: solo cuentan mensajes de sus casos asignados o en cola de su área
        const shouldCountUnread = isPrivilegedSupervisor || isAssignedToMe || isMyDepartmentQueue;

        if (!isCurrentActiveChat && shouldCountUnread) {
          markConversationUnread(event.conversationId);
        }

        // Filtro estricto de notificación sonora y alerta de escritorio:
        // - NUNCA sonar si el mensaje está siendo atendido automáticamente por el bot de IA (!isHumanActive).
        // - NUNCA sonar si el caso está delegado a otro asesor específico.
        // - SÍ sonar si el caso está asignado a este asesor, o si es un caso humano en cola de su área, o si es supervisor.
        const isBotHandling = event.isHumanActive === false;
        const shouldNotifySound =
          !isBotHandling &&
          !isAssignedToOther &&
          (isAssignedToMe || isMyDepartmentQueue || isPrivilegedSupervisor);

        if (shouldNotifySound && (inBackground || !isCurrentActiveChat)) {
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
