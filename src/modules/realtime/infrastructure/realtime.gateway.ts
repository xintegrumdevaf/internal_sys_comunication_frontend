import { resolveApiUrl } from "@/lib/api-base";
import type { RealtimeEvent } from "@/modules/realtime/domain/realtime-event";

/**
 * Cliente SSE sobre GET /api/realtime?userId= (isp-customer-service-api).
 * Ver docs/spec/03_REALTIME_NOTIFICATIONS.md §1.
 */
export function connectRealtime(
  userId: string,
  handlers: {
    onEvent: (event: RealtimeEvent) => void;
    onConnectedChange?: (connected: boolean) => void;
  },
): () => void {
  const es = new EventSource(resolveApiUrl(`/api/realtime?userId=${encodeURIComponent(userId)}`));

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
