import { resolveApiUrl } from "@/shared/http/api-base";
import type { RealtimeEvent } from "@/modules/realtime/domain/realtime-event";

/**
 * Cliente SSE sobre GET /api/realtime (isp-customer-service-api).
 * Ver docs/spec/03_REALTIME_NOTIFICATIONS.md §1. La identidad viene de la
 * sesion real (cookie httpOnly, docs/spec/06_BACKEND_GAPS.md §1.b);
 * `EventSource` no puede mandar headers propios, pero `withCredentials:
 * true` si hace que el navegador adjunte la cookie en la conexion SSE.
 */
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

  es.onopen = () => handlers.onConnectedChange?.(true);
  es.onerror = () => {
    // El navegador reintenta automáticamente con backoff nativo de EventSource.
    handlers.onConnectedChange?.(false);
  };
  es.onmessage = (ev) => {
    if (!ev.data) return;
    try {
      const parsed = JSON.parse(ev.data) as RealtimeEvent;
      handlers.onEvent(parsed);
    } catch {
      // línea de keep-alive/comentario SSE (": ping", ": connected ..."), no es JSON — se ignora.
    }
  };

  return () => es.close();
}
