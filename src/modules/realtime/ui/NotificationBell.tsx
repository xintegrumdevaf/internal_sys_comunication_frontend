import { Bell } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { relativeTime } from "@/shared/datetime";
import { useNotifications, useRealtimeConnected } from "@/modules/realtime/application/use-realtime";

/** Campana de notificaciones global (docs/spec/03_REALTIME_NOTIFICATIONS.md §3). */
export function NotificationBell() {
  const navigate = useNavigate();
  const connected = useRealtimeConnected();
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);

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
              <span className="text-primary normal-case font-normal">En vivo</span>
            ) : (
              <span className="text-warning normal-case font-normal">Reconectando…</span>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-border">
            {notifications.length === 0 && (
              <p className="p-4 text-xs text-muted-foreground">Sin novedades por ahora.</p>
            )}
            {notifications.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => {
                  setOpen(false);
                  void navigate({ to: "/bandeja" });
                }}
                className="w-full text-left p-3 hover:bg-foreground/5 text-xs"
              >
                <p className="font-bold">
                  {n.kind === "CASE_ESCALATED"
                    ? "Caso escalado a humano"
                    : n.isMine
                      ? "Se te asignó un caso"
                      : "Caso asignado a otro agente"}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Caso {n.caseId.slice(0, 8)}… · {relativeTime(n.createdAt)}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
