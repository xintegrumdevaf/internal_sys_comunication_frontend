# 02_MODULES.md

Mapeo módulo → ruta → endpoints reales, y qué pasa con cada pantalla actual.

## 1. Rutas nuevas/actualizadas

| Ruta                  | Módulo                                                                | Endpoints reales                                                                                                                                                                                                                                                                                                                |
| --------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/login`              | Login real (correo + contraseña)                                      | `POST /api/auth/login`                                                                                                                                                                                                                                                                                                          |
| `/` (dashboard)       | KPIs del agente                                                       | `GET /api/dashboard?userId=`                                                                                                                                                                                                                                                                                                    |
| `/bandeja`            | Bandeja unificada de conversaciones + panel de caso                   | `GET /api/conversations`, `GET /api/conversations/:id/messages`, `GET /api/conversations/:id/cases`, `GET /api/conversations/:id/automation`, `POST /api/conversations/:id/reply`, `POST /api/conversations/:id/take-control`, `GET /api/cases/:id[/summary,/timeline]`, acciones de caso (§3 de `04_ASSIGNMENT_MANAGEMENT.md`) |
| `/escalaciones`       | Bandeja de escalaciones + pool de triage                              | `GET /api/escalations?departmentId=&status=`, `?triage=true`                                                                                                                                                                                                                                                                    |
| `/asignaciones`       | Gestión/monitoreo de carga por agente                                 | `GET /api/conversations` + `GET /api/cases/:id` agregados client-side, `POST /api/cases/:id/assign\|reassign`                                                                                                                                                                                                                   |
| `/calidad`            | Supervisión de calidad / eficiencia de agentes humanos                | `GET /api/quality/agents`, `GET/POST /api/quality/reviews`, `GET /api/quality/reviews/:id`, `POST .../notes`, `PATCH .../:id` (`07_QUALITY_SUPERVISION.md`)                                                                                                                                                                     |
| `/auditoria`          | Auditoría                                                             | `GET /api/audit?limit=`                                                                                                                                                                                                                                                                                                         |
| `/flujos`             | Catálogo n8n (solo `role=admin`)                                      | `GET/PUT/DELETE /api/admin/n8n-workflows[/:action]`                                                                                                                                                                                                                                                                             |
| `/usuarios`           | Directorio de agentes: crear/editar/desactivar/restablecer contraseña | `GET/POST/PUT/DELETE /api/agents`, `POST /api/agents/:id/reset-password`, `GET /api/departments`                                                                                                                                                                                                                                |
| `/chat-interno`       | Chat interno 1:1 y coaching de calidad sincronizado por backend       | `GET /api/internal/threads`, `POST /api/internal/threads/direct`, `GET/POST /api/internal/threads/:id/messages`, `POST /api/internal/threads/:id/read`, SSE `INTERNAL_MESSAGE_SENT`/`INTERNAL_THREAD_READ`                                                                                                                      |
| `/respuestas-rapidas` | Catálogo y configuración de respuestas rápidas (`/atajo`)             | `GET/POST/PUT/DELETE /api/quick-replies[/:id]`, `GET /api/quick-replies/resolve`, `POST /api/quick-replies/refine-tone` (refinamiento de tono con IA)                                                                                                                                                                           |

## 2. Qué pasa con cada pantalla actual

Nota: tras la reestructuración hexagonal, la lógica de cada pantalla vive en `src/modules/<feature>/` (ver `docs/FOLDER_STRUCTURE.md`); las rutas de abajo son solo la cáscara delgada que arma `<AppShell>` + el componente `ui/` del módulo.

| Pantalla actual                                                                                 | Acción                                                                                                                                                                                                            |
| ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/routes/bandeja.tsx` → `modules/conversations/ui/OperationalInbox.tsx`                      | **Reescrita** sobre el contrato real + SSE (Etapa 2/3), autocompletado `/` de respuestas rápidas, selector universal de emojis y edición de mensajes en tiempo real                                               |
| `src/routes/soporte.tsx`, `cartera.tsx`, `utga.tsx`                                             | **Eliminadas** — dependían de `PaymentCase`/`WorkOrder` (`ops-types.ts`), que no existen en el backend nuevo. Reemplazadas por `/bandeja` filtrada por departamento + `/asignaciones`                             |
| `src/routes/campanas.tsx`                                                                       | **Fuera de alcance** de esta entrega (no hay endpoint de campañas masivas en el backend nuevo); placeholder claramente marcado, no se borra la ruta para no romper navegación existente sin decisión explícita    |
| `src/routes/index.tsx` → `modules/dashboard/ui/DashboardOverview.tsx`                           | **Reescrita** sobre `DashboardDto` real (Etapa 6)                                                                                                                                                                 |
| `src/routes/auditoria.tsx` → `modules/audit/ui/AuditLogView.tsx`                                | **Adaptada** — el shape es casi idéntico (Etapa 6)                                                                                                                                                                |
| `src/routes/flujos.tsx` → `modules/admin-n8n/ui/N8nWorkflowCatalog.tsx`                         | **Reescrita** contra `/api/admin/n8n-workflows` real (Etapa 6)                                                                                                                                                    |
| `src/routes/usuarios.tsx` → `modules/identity/ui/UsersDirectoryPanel.tsx`                       | **CRUD real completo** (crear/editar/desactivar/restablecer contraseña, `06_BACKEND_GAPS.md` §1)                                                                                                                  |
| `src/routes/whatsapp.tsx` + `src/components/whatsapp/*`                                         | **Eliminadas** — sin equivalente en el backend nuevo (`/api/whatsapp/status` no existe)                                                                                                                           |
| `src/routes/chat-interno.tsx` → `modules/internal-chat/ui/InternalChatShell.tsx`                | **Migrada a backend persistente**: sincronización en tiempo real vía SSE, selector de emojis, tarjetas `QualityQuoteCard`, badges de no leídos y deep-link `?threadId=&peerId=&qualityReviewId=` desde `/calidad` |
| `src/routes/calidad.tsx` → `modules/quality/ui/...`                                             | **Nueva** — ranking + reviews + detalle con highlight (`07_QUALITY_SUPERVISION.md`) y badges de mensajes editados                                                                                                 |
| `src/routes/login.tsx`                                                                          | **Reescrita**: login real con correo + contraseña sobre `POST /api/auth/login` (`06_BACKEND_GAPS.md` §1.b)                                                                                                        |
| `src/routes/respuestas-rapidas.tsx` → `modules/quick-replies/ui/QuickRepliesManagementView.tsx` | **Nueva** — CRUD de plantillas reutilizables, refinamiento empático de tono on-demand con IA (`POST /api/quick-replies/refine-tone`) y selector universal de emojis                                               |

## 3. Navegación dinámica por departamento

`AppShell` deja de usar `SEED_DEPARTMENTS`/rutas fijas (`ti`, `soporte`, `cartera`, `traslados`, `administracion`). El bloque "Mi área" se genera desde `GET /api/departments` (seed real: `support`, `billing`, `sales`), enlazando a `/bandeja?departmentId=` filtrado. El pool de triage (`departmentId=null`) se expone como entrada adicional solo para `manager`/`admin`, enlazando a `/escalaciones?triage=true`.

## 4. Roles y accesos

| Regla                         | Backend                                                       | Frontend                                                                                                                    |
| ----------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Lectura de depto `shared`     | Cualquier agente                                              | `canAccessDepartment` ya no depende de memberships locales — cualquier agente autenticado lee                               |
| Lectura de depto `restricted` | Solo `agent_membership`                                       | Requiere membership (si el backend expone memberships por agente; si no, se trata como hueco — ver `06_BACKEND_GAPS.md`)    |
| Pool de triage                | Solo `manager`/`admin`                                        | Oculto para `role=agent`                                                                                                    |
| Admin n8n (`/flujos`)         | Solo `role=admin`                                             | Oculto para `agent`/`manager`                                                                                               |
| Calidad (`/calidad`)          | Solo `role IN (manager, admin)`; manager acotado a sus deptos | Oculto para `role=agent`; empty state honesto si falta backend Etapa 10                                                     |
| Escribir sobre un caso        | `assignedAgentId=self`, sin asignar, o `manager/admin`        | Botones de acción deshabilitados según esta regla, nunca solo ocultos (para que el agente entienda por qué no puede actuar) |

## 5. Notas de voz en la bandeja (`WhatsAppAudioPlayer.tsx`)

`MessageMediaBody` sigue resolviendo la nota contra `GET /api/media` (cookie de sesión, otro origen). Quien reproduce ese archivo es `WhatsAppAudioPlayer`, no un `<audio src={mediaUrl}>`.

**Qué se cambió (2026-11-05).** El reproductor descarga la nota con `fetch` (`credentials: "include"`, `cache: "no-store"`), construye un `Blob` con el `Content-Type` de audio (si no viene, `audio/ogg`) y asigna al elemento un `blob:` local. Se quitó `crossOrigin="use-credentials"` y `preload="metadata"` sobre la URL del API. La forma de onda se calcula con ese mismo blob, no con un segundo `fetch` a la URL. Un clic extra mientras hay un `play()` en curso ya no llama a `load()`.

**Por qué.** El API responde el archivo completo como `206 Partial Content` (`Content-Range: bytes 0-…/…`, `Content-Type: audio/ogg`) y lo marca `Cache-Control: public, max-age=31536000, immutable`. Las cabeceras CORS son correctas (`Access-Control-Allow-Credentials: true` y el origen del frontend). Chrome pide ese recurso con `Range`, guarda el 206 y, al pulsar play, reutiliza la copia cacheada. El elemento queda sin fuente válida (`NotSupportedError: The element has no supported sources`) y no vuelve a salir a la red: el clic parece muerto. Abrir la consola desactiva la caché HTTP, la misma URL se pide de nuevo, aparece el 206 en Red y ahí sí suena. El reintento anterior (`load()` y `play()` en el mismo instante) empeoraba el caso: cada clic cancelaba la recarga que todavía no tenía fuente.

**Qué no revertir.** No volver a poner `/api/media` en el `src` del `<audio>`, ni disparar un `fetch` paralelo sin cookie contra la misma URL: esa combinación es la que deja el 206 inservible en caché durante un año. El test de regresión está en `src/modules/conversations/ui/WhatsAppAudioPlayer.test.tsx`. Registro del cambio: `CHANGELOG.md` `[0.2.7]`.

## 6. Ancho de la columna de chat en la bandeja

La bandeja (`OperationalInbox`) es una grilla de 12 columnas: lista, hilo y, si está abierto, el panel de detalles (`lg:col-span-3`). El hilo pasa de `lg:col-span-8` a `lg:col-span-5`. En un portátil esa columna queda en unos 300–450px aunque la ventana siga en breakpoint `sm` o `md`.

**Qué se cambió (2026-11-05).**

- La columna del hilo es un contenedor con nombre (`@container/chat`) y, junto con la lista, el panel de detalles y el área principal de `AppShell`, usa `min-w-0` para poder encogerse a su pista. El scroll de mensajes es `overflow-x-hidden`.
- `ChatHeader` deja de decidir las etiquetas con `sm:` / `md:` (ancho de la ventana). Usa el ancho de la columna: en una columna estrecha el agente se muestra en corto, "Editar contacto" queda solo con el ícono y las acciones bajan de línea en lugar de montarse sobre el nombre.
- `ChatMessageItem`, `MessageMediaBody` y `ChatComposer` limitan burbujas, archivos, iframes y el textarea a `min-w-0` / `max-w-full`. El texto largo parte (`break-words`).
- `WhatsAppAudioPlayer` ya no reserva `min-w-[140px]` ni barras fijas de `w-[3px]`. La onda es una grilla de 34 columnas `minmax(0, 1fr)`, cada barra como máximo 3px, y el reproductor no pasa de `min(100%, 260px)`.

**Por qué.** Las etiquetas largas ("Editar contacto", "Atendido por {agente}") y el reproductor de audio imponían un ancho mínimo mayor que la columna. Los ítems de grilla y flex tienen `min-width: auto`, así que la columna crecía con ese contenido y se salía de la tarjeta: burbujas, forma de onda, el control `1x` y los avatares cruzaban el borde derecho, y el botón de editar contacto se superponía a la pastilla del agente.

**Qué no revertir.** No devolver las etiquetas de la cabecera a breakpoints de viewport (`sm:`, `md:`): el ancho que importa es el de la columna, no el de la ventana. No restaurar `min-w-[140px]` ni `w-[3px]` en la onda, ni quitar `min-w-0` de la columna del hilo. Registro del cambio: `CHANGELOG.md` `[0.2.8]`.

## 7. Scroll de la lista al entrar un chat nuevo

La columna izquierda de la bandeja es la que hace scroll (`overflow-y-auto`), no la página. Cada `MESSAGE_RECEIVED` recarga la lista y la reordena con el chat más reciente arriba.

**Qué se cambió (2026-11-05).** `usePreservedListScroll` recuerda la primera fila visible (`data-conversation-id`) y, después de la recarga, la deja en el mismo sitio. Si el agente ya estaba en el tope (`scrollTop` ≤ 8px), no se corrige nada: el chat nuevo sigue viéndose. El contenedor lleva `[overflow-anchor:none]` para que el anclaje del navegador no compita con esa corrección.

**Por qué.** Sin eso el navegador pone el scroll en 0. El hilo abierto no cambia, pero la lista vuelve al inicio y hay que buscar de nuevo la conversación en la que se estaba.

**Qué no revertir.** No quitar `data-conversation-id` de `ConversationListItem` ni el `overflow-anchor: none` del scroller. No forzar `scrollTop = 0` ni `scrollIntoView` de la fila activa en cada recarga: eso es justo el salto que se está evitando. El test está en `use-preserved-list-scroll.test.tsx`. Registro del cambio: `CHANGELOG.md` `[0.2.9]`.
