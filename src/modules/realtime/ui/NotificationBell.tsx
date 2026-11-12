import { Bell, Volume2, AlertTriangle, UserCheck, Clock, Phone } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { relativeTime } from "@/shared/datetime";
import { formatWaPhone } from "@/modules/conversations/domain/conversation";
import { formatEscalationReason } from "@/modules/realtime/domain/realtime-event";
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
        <div className="absolute right-0 mt-2 w-88 sm:w-96 bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-30 animate-fade-in">
          <div className="p-3 border-b border-border text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center justify-between bg-muted/20">
            Centro de notificaciones
            {connected ? (
              <span className="text-primary normal-case font-semibold text-[11px] flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-primary animate-pulse" /> Conectado
              </span>
            ) : (
              <span className="text-warning normal-case font-semibold text-[11px]">
                Reconectando…
              </span>
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
            {notifications.map((n) => {
              const isEsc = n.kind === "CASE_ESCALATED";
              const isAsg = n.kind === "HUMAN_ASSIGNED";
              const isRem = n.kind === "CASE_SCHEDULED_REMINDER";
              const isSlaBreach = n.kind === "UNASSIGNED_SLA_BREACH";

              const Icon = isSlaBreach ? AlertTriangle : isEsc ? AlertTriangle : isAsg ? UserCheck : Clock;
              const iconColor = isSlaBreach
                ? "bg-red-500/15 text-red-600 dark:text-red-400 ring-1 ring-red-500/30"
                : isEsc
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  : isAsg
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-sky-500/10 text-sky-600 dark:text-sky-400";

              const title = isSlaBreach
                ? `Caso sin asignar demorado (${n.waitMinutes ?? ""}m)`
                : isRem
                  ? `Recordatorio [${n.scheduleTag ?? "AGENDADO"}]`
                  : isEsc
                    ? "Caso escalado a humano"
                    : n.isMine
                      ? "Caso asignado a ti"
                      : "Caso asignado";

              const customer =
                n.customerName || (n.customerPhone ? formatWaPhone(n.customerPhone) : null);
              const reasonText =
                n.reason || n.reminderReason
                  ? formatEscalationReason(n.reason || n.reminderReason)
                  : null;

              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    const targetStatus = isRem ? "pending" : undefined;
                    void navigate({
                      to: "/bandeja",
                      search: { conversationId: n.conversationId, status: targetStatus },
                    });
                  }}
                  className={`w-full text-left p-3 hover:bg-foreground/5 transition-colors flex items-start gap-2.5 text-xs cursor-pointer ${
                    !n.read ? "bg-primary/5" : ""
                  }`}
                >
                  <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${iconColor}`}>
                    <Icon className="size-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1.5">
                      <p className="font-bold text-foreground text-xs truncate">{title}</p>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {relativeTime(n.createdAt)}
                      </span>
                    </div>

                    {customer && (
                      <p className="text-[11px] font-semibold text-foreground/90 mt-0.5 truncate">
                        {customer}
                        {n.customerName && n.customerPhone && (
                          <span className="font-mono text-[10px] text-muted-foreground ml-1 font-normal">
                            ({formatWaPhone(n.customerPhone)})
                          </span>
                        )}
                      </p>
                    )}

                    {reasonText && (
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/50 truncate max-w-[240px]">
                          {reasonText}
                        </span>
                      </div>
                    )}
                  </div>
                  {!n.read && (
                    <span className="size-2 rounded-full bg-primary shrink-0 self-center" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
