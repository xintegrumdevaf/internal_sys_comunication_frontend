import { Bell, Volume2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { relativeTime } from "@/shared/datetime";
import {
  useNotifications,
  useRealtimeConnected,
  requestDesktopNotificationPermission,
  sendTestDesktopNotification,
} from "@/modules/realtime/application/use-realtime";

/** Campana de notificaciones global (docs/spec/03_REALTIME_NOTIFICATIONS.md §3). */
export function NotificationBell() {
  const navigate = useNavigate();
  const connected = useRealtimeConnected();
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);

  const hasNotificationSupport = typeof window !== "undefined" && "Notification" in window;
  const permissionState = hasNotificationSupport ? Notification.permission : "denied";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) markAllRead();
        }}
        className="relative p-2 rounded-md hover:bg-foreground/5"
        aria-label="Notificaciones"
      >
        <Bell className="size-4 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 size-4 rounded-full bg-danger text-danger-foreground text-[9px] font-bold grid place-items-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-lg shadow-xl overflow-hidden z-30">
          <div className="p-3 border-b border-border text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center justify-between">
            Notificaciones
            {connected ? (
              <span className="text-primary normal-case font-normal">Conectado</span>
            ) : (
              <span className="text-warning normal-case font-normal">Reconectando…</span>
            )}
          </div>

          {hasNotificationSupport && permissionState !== "granted" && (
            <div className="p-2.5 bg-warning/10 border-b border-warning/20 space-y-1.5">
              <p className="text-[11px] text-foreground font-semibold">
                ¿Recibir notificaciones cuando minimices el navegador?
              </p>
              <p className="text-[10px] text-muted-foreground">
                Tu navegador requiere tu autorización para mostrar ventanas de alerta al estar
                minimizado.
              </p>
              <button
                type="button"
                onClick={() => {
                  void requestDesktopNotificationPermission().then(() => setOpen(true));
                }}
                className="w-full py-1.5 bg-primary text-primary-foreground text-[10px] font-bold uppercase rounded shadow-sm hover:brightness-95"
              >
                Activar notificaciones de escritorio
              </button>
            </div>
          )}

          {hasNotificationSupport && permissionState === "granted" && (
            <div className="p-2 border-b border-border bg-background/50 flex items-center justify-between gap-2">
              <span className="text-[10px] text-muted-foreground">Notificaciones activas</span>
              <button
                type="button"
                onClick={() => {
                  sendTestDesktopNotification();
                }}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-foreground/5 hover:bg-foreground/10 text-foreground transition"
              >
                <Volume2 className="size-3 text-primary" />
                Probar notificación
              </button>
            </div>
          )}
          <div className="max-h-80 overflow-y-auto divide-y divide-border">
            {notifications.length === 0 && (
              <p className="p-4 text-xs text-muted-foreground">
                Por ahora no tienes novedades. Aquí verás cuando un cliente necesite un agente
                humano o cuando te asignen un caso.
              </p>
            )}
            {notifications.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => {
                  setOpen(false);
                  void navigate({ to: "/bandeja", search: { conversationId: n.conversationId } });
                }}
                className="w-full text-left p-3 hover:bg-foreground/5 text-xs"
              >
                <p className="font-bold">
                  {n.kind === "CASE_ESCALATED"
                    ? "Un cliente necesita un agente humano"
                    : n.isMine
                      ? "Te asignaron una conversación"
                      : "Se asignó una conversación a otro agente"}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {n.kind === "CASE_ESCALATED"
                    ? "Toca aquí para revisar el resumen y atenderlo"
                    : "Toca aquí para abrir la conversación"}{" "}
                  · {relativeTime(n.createdAt)}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
