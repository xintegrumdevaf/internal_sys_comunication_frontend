import { connectRealtime } from "@/modules/realtime/infrastructure/realtime.gateway";
import type { RealtimeEvent } from "@/modules/realtime/domain/realtime-event";

/**
 * Conexión SSE única compartida por toda la app (docs/spec/03_REALTIME_NOTIFICATIONS.md §1).
 * Se monta una sola vez desde AppShell; cualquier hook/componente se suscribe
 * aquí en vez de abrir su propio EventSource.
 */

type EventListener = (event: RealtimeEvent) => void;
type ConnListener = (connected: boolean) => void;

let activeUserId: string | null = null;
let disconnectFn: (() => void) | null = null;
let connected = false;

const eventListeners = new Set<EventListener>();
const connListeners = new Set<ConnListener>();

function setConnected(next: boolean) {
  if (connected === next) return;
  connected = next;
  connListeners.forEach((l) => l(next));
}

export function ensureRealtimeConnection(userId: string | null): void {
  if (userId === activeUserId) return;
  disconnectFn?.();
  disconnectFn = null;
  activeUserId = userId;

  if (!userId) {
    setConnected(false);
    return;
  }

  disconnectFn = connectRealtime(userId, {
    onEvent: (event) => eventListeners.forEach((l) => l(event)),
    onConnectedChange: setConnected,
  });
}

export function subscribeRealtimeEvents(listener: EventListener): () => void {
  eventListeners.add(listener);
  return () => eventListeners.delete(listener);
}

export function subscribeRealtimeConnection(listener: ConnListener): () => void {
  connListeners.add(listener);
  listener(connected);
  return () => connListeners.delete(listener);
}

export function isRealtimeConnected(): boolean {
  return connected;
}
