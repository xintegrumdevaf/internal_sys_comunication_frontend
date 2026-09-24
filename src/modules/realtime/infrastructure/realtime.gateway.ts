import { resolveApiUrl } from "@/shared/http/api-base";
import type { RealtimeEvent } from "@/modules/realtime/domain/realtime-event";

/**
 * Cliente SSE sobre GET /api/realtime (isp-customer-service-api).
 * Ver docs/spec/03_REALTIME_NOTIFICATIONS.md §1. La identidad viene de la
 * sesion real (cookie httpOnly, docs/spec/06_BACKEND_GAPS.md §1.b);
 * `EventSource` no puede mandar headers propios, pero `withCredentials:
 * true` si hace que el navegador adjunte la cookie en la conexion SSE.
 */
const KNOWN_EVENT_TYPES = [
  "MESSAGE_RECEIVED",
  "MESSAGE_SENT",
  "MESSAGE_EDITED",
  "MESSAGE_STATUS_UPDATED",
  "CASE_ESCALATED",
  "CASE_CLAIMED",
  "HUMAN_ASSIGNED",
  "AUTOMATION_ENABLED",
  "AUTOMATION_DISABLED",
  "CASE_SCHEDULED_REMINDER",
  "INTERNAL_MESSAGE_SENT",
  "INTERNAL_THREAD_READ",
] as const;

export function connectRealtime(
  userId: string,
  handlers: {
    onEvent: (event: RealtimeEvent) => void;
    onConnectedChange?: (connected: boolean) => void;
  },
): () => void {
  const es = new EventSource(resolveApiUrl(`/api/realtime?userId=${encodeURIComponent(userId)}`), {
    withCredentials: true,
  });

  const handleRawData = (dataStr: string, eventTypeOverride?: string) => {
    if (!dataStr) return;
    try {
      const parsed = JSON.parse(dataStr) as RealtimeEvent;
      if (eventTypeOverride && !parsed.type) {
        (parsed as Record<string, unknown>).type = eventTypeOverride;
      }
      handlers.onEvent(parsed);
    } catch {
      // línea de keep-alive/comentario SSE (": ping", ": connected ..."), no es JSON — se ignora.
    }
  };

  es.onopen = () => handlers.onConnectedChange?.(true);
  es.onerror = () => {
    // El navegador reintenta automáticamente con backoff nativo de EventSource.
    handlers.onConnectedChange?.(false);
  };
  es.onmessage = (ev) => handleRawData(ev.data);

  // Registra listeners para eventos nominados SSE (cuando el servidor envía `event: CASE_SCHEDULED_REMINDER`)
  const eventListeners: Array<{ type: string; listener: (ev: MessageEvent) => void }> = [];
  KNOWN_EVENT_TYPES.forEach((type) => {
    const listener = (ev: MessageEvent) => handleRawData(ev.data, type);
    es.addEventListener(type, listener as EventListener);
    eventListeners.push({ type, listener: listener as EventListener });
  });

  return () => {
    eventListeners.forEach(({ type, listener }) => {
      es.removeEventListener(type, listener as EventListener);
    });
    es.close();
  };
}
