# 03_REALTIME_NOTIFICATIONS.md

## 1. Cliente SSE

`src/adapters/http/realtime-client.ts` — wrapper sobre `EventSource`:

```ts
export function connectRealtime(userId: string, onEvent: (event: RealtimeEvent) => void): () => void {
  const es = new EventSource(resolveApiUrl(`/api/realtime?userId=${encodeURIComponent(userId)}`));
  es.onmessage = (ev) => {
    try {
      onEvent(JSON.parse(ev.data) as RealtimeEvent);
    } catch {
      // línea de keep-alive (": ping") o de conexión — se ignora, no es JSON
    }
  };
  es.onerror = () => {
    // el propio EventSource reintenta con backoff nativo del navegador; no se hace nada especial aquí,
    // solo se expone el estado de conexión al hook consumidor (ver hook abajo).
  };
  return () => es.close();
}
```

`useRealtimeEvents(userId)` (hook) expone `{ connected: boolean, lastEvent: RealtimeEvent | null }` y se monta **una sola vez** a nivel de `AppShell` (no por pantalla) — todas las pantallas se suscriben al mismo stream vía un pequeño event bus en memoria (`src/lib/realtime-bus.ts`), evitando abrir un `EventSource` por componente.

## 2. Catálogo de eventos → reacción UI

| Evento | Quién lo recibe (filtrado por el backend) | Reacción en frontend |
|---|---|---|
| `MESSAGE_RECEIVED` | Agentes con visibilidad del departamento de la conversación | Si la conversación está abierta en `/bandeja`, refrescar el hilo (`GET /api/conversations/:id/messages`); si no, refrescar el badge de la lista |
| `MESSAGE_SENT` | Igual que arriba | Igual, distinguiendo `author: "ai" | "agent"` para el tick visual |
| `CASE_ESCALATED` | Agentes del departamento del caso, o `manager/admin` si `departmentId=null` (triage) | Toast + incremento del contador de la campana de notificaciones; refresca `/escalaciones` si está montada |
| `CASE_CLAIMED` | Todos los que ven ese departamento | Refresca listas de casos "sin dueño" (ya no debe aparecer como reclamable) |
| `HUMAN_ASSIGNED` | Cualquiera con visibilidad, pero con **prioridad especial si `agentUserId === session.id`** | Si es el agente asignado: toast prominente "Se te asignó el caso {id}" + entrada persistente en la campana con acceso directo a `/bandeja?conversationId=`; si es otro agente: solo refresco silencioso |
| `AUTOMATION_ENABLED` | Agentes con esa conversación abierta | Actualiza el indicador de automatización en el panel de caso |

## 3. Campana de notificaciones (AppShell)

- Estado en memoria (no persistido) de `UiNotification[]` (`01_DATA_MODEL.md` §8), poblado por `CASE_ESCALATED` y `HUMAN_ASSIGNED`.
- Ícono de campana con contador de no leídas; al abrir, lista las notificaciones con: tipo, hora relativa, y botón "Ver caso" que navega a `/bandeja?conversationId=` (resuelto desde `caseId` vía `GET /api/cases/:id` para obtener `conversationId`).
- Sonido/():opcional, solo si el usuario lo activa — nunca autoplay bloqueante.

## 4. Ventana de resumen de escalación (satisface el requisito de "resumen cuando se hace un análisis")

Componente `CaseSummaryDialog`, se abre:
- Automáticamente al seleccionar en `/bandeja` o `/escalaciones` un caso en estado `ESCALATED` o `HUMAN_ACTIVE` que el agente aún no ha visto (primera vez que se abre esa conversación en la sesión).
- Manualmente vía botón "Ver resumen" en el panel de caso, en cualquier momento.

Contenido (de `GET /api/cases/:id/summary`, `01_DATA_MODEL.md` §3 `CaseSummaryDto`):

- Encabezado: `problem`, `department`, `status`, badge de `reason`.
- Lista de `completedSteps` (con ícono de check).
- `results` renderizado como pares clave/valor legibles (no JSON crudo).
- Línea de tiempo compacta (`timeline`), con opción "Ver timeline completo" que abre `GET /api/cases/:id/timeline` (todas las `workflow_execution`/`workflow_event`).
- `readableSummary` (si viene) se muestra como texto destacado arriba, dejando claro que es generado por IA y no reemplaza los datos estructurados de abajo.
- Acción principal: "Reclamar caso" (`claim`) si `assignedAgentId` es null, o "Tomar control" si aplica sobre la conversación.

## 5. Estado de conexión visible

Un indicador pequeño (punto verde/gris) en `AppShell` refleja `connected` del hook SSE — si se pierde la conexión, el agente lo nota en vez de pensar que no hay actividad nueva.
