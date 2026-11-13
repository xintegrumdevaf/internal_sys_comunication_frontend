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
| `/configuracion`      | Configuración global del sistema, IA, Red MikroTik/OLT y Telegram Ops | `GET/PUT /api/admin/settings[/channels,/ai,/telegram]`, `POST /api/admin/settings/telegram/{detect-chat,test,test-topic,send-digest,check-alerts,test-alert,set-webhook}`, `/api/admin/settings/network/*`                                                                                                                      |

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

## 8. Resolución de caso activo en conversaciones reabiertas (`use-operational-inbox.ts`, `OperationalInbox.tsx`, `ChatHeader.tsx`, `ConversationListItem.tsx`)

Una conversación de WhatsApp reabierta por un nuevo mensaje inbound del cliente tras haber sido resuelta o cerrada no debe heredar el caso histórico completado como si estuviera activo.

**Qué se cambió (2026-11-06).**

- En `use-operational-inbox.ts`: el selector memoizado `activeCase` ahora solo evalúa casos con estados vigentes (`WAITING_USER`, `ACTIVE`, `ESCALATED`, `HUMAN_ACTIVE`, `NEW`, `PAUSED`). Si el caso explícito o los casos asociados son terminales (`COMPLETED`, `EXPIRED`, `CANCELLED`), retorna `null` para conversaciones abiertas (`status: "open"`). Solo si la conversación está en pestañas resueltas/cerradas (`status === "resolved" || status === "closed"`), recurre al caso completado (`cases[0]`) para permitir la inspección histórica.
- En `OperationalInbox.tsx`: `assignedAgentName` restringe el uso de `lastAttendedBy` exclusivamente a conversaciones resueltas o cerradas. En conversaciones abiertas sin caso activo en curso, retorna `null`. La variable `isAutomationActive` detecta si tanto `activeCase` como `selected.activeCase` son nulos o terminales, apagando la bandera de IA para permitir escritura directa.
- En `ChatHeader.tsx`: la condición de "Atención directa" y la visibilidad del botón "Cerrar conversación" ahora contemplan casos terminales, permitiendo al asesor cerrar la conversación directamente con un clic si no requiere atención operativa.
- En `CasePanel.tsx`: al ser `activeCase = null` en conversaciones abiertas sin ticket, se activa la vista honesta ("Esta conversación no tiene un caso"), ofreciendo los botones "Derivar a un área" y "Cerrar conversación" en lugar de un bloque bloqueado de caso completado.
- En `ConversationListItem.tsx`: la etiqueta de caso vivo en la lista se condiciona estrictamente a estados no terminales (`liveCase = c.activeCase && !isTerminalCase(...)`).

**Por qué.** Al llegar un mensaje de un cliente en un chat previamente cerrado, el backend reabre la conversación (`status = "open"`). Si el mensaje entrante no dispara un nuevo ticket formal, la conversación queda abierta pero sin caso activo (`activeCaseId = null`). El fallback anterior `cases[0]` tomaba el caso cerrado previo de Aracely o de cualquier otro asesor, provocando que la cabecera y el panel derecho mostraran "Caso finalizado (Completado)" y "Atendido por {agente_anterior}", bloqueando los botones de cerrar y agendar e imposibilitando cerrar o derivar la conversación reabierta.

**Qué no revertir.** No volver a colocar `cases[0] ?? null` de forma incondicional en `use-operational-inbox.ts`. No usar `lastAttendedBy` como agente activo en conversaciones con `status === "open"`. No suprimir el botón "Cerrar" en `ChatHeader` cuando no existe un caso vivo en curso. Registro del cambio: `CHANGELOG.md` `[0.2.13]`.

## 9. Panel de Telegram Ops y modularización SRP (`TelegramSettingsCard`)

El módulo de administración de Telegram en `/configuracion` sigue separación hexagonal estricta: constantes en `domain/telegram-settings.defaults.ts`, estado y acciones API en `application/use-telegram-settings.ts`, y subcomponentes presentacionales en `ui/telegram/*`, manteniendo cada archivo bajo el límite `max-lines` (`400`) y respetando `react-refresh/only-export-components`.

**Qué no revertir.** No volver a concentrar toda la vista en `TelegramSettingsCard.tsx` ni exportar constantes/hooks desde archivos `.tsx` de UI. Mantener la barra flotante única `TelegramSaveFooter` para cambios sin guardar, la sanitización de tokens enmascarados (`•` / `*`) antes de pruebas en vivo y la actualización reactiva de `defaultChatId` cuando `test` o `send-digest` retornan `migratedToChatId`. Registro del cambio: `CHANGELOG.md` `[0.2.25]`.

## 10. Recepción y Envío Nativo de Stickers Estilo WhatsApp (`MessageMediaBody.tsx`, `ChatComposer.tsx`, `outbound-media.ts`)

**Qué se cambió (2026-11-13).**

- En `outbound-media.ts`: se agregó `sticker` a `OutboundMediaKind` y se definieron sus reglas en `OUTBOUND_MEDIA_RULES` (máx. 500 KB, formatos `webp`, `png`, `jpg`). Se implementó `convertImageToWebpSticker(file)` que rasteriza cualquier imagen adjunta a un Canvas HTML5 cuadrado de 512x512 y la exporta como WebP transparente compatible con WhatsApp Cloud API.
- En `ChatComposer.tsx` y `OperationalInbox.tsx`: se habilitó el atajo directo en el popover de adjuntos y la conversión automática al subir archivos de tipo sticker.
- En `MessageMediaBody.tsx`: los mensajes con `type === "sticker"` o `body === "[sticker]"` se renderizan como stickers limpios sin el marco rectangular de foto, con drop-shadow, escalado suave interactivo (`hover:scale-105`), click para abrir en tamaño original y fallback accesible con badge de alerta.
- En `conversation.ts`: `formatQuotedMessageSnippet` formatea mensajes citados que contengan stickers como `"💟 Sticker"`.

**Por qué.** En el soporte de telecomunicaciones e ISP, los clientes y operadores se comunican ampliamente mediante stickers para confirmar acuerdos o cerrar interacciones de forma empática. Anteriormente, estos mensajes se mostraban como cadenas crudas `[sticker]` o fallaban como imágenes rotas, y la plataforma carecía de soporte para enviarlos.

**Qué no revertir.** No quitar la conversión cliente en `convertImageToWebpSticker`; WhatsApp Cloud API rechaza envíos de stickers que no sean WebP exacto de 512x512. No forzar un fondo rectangular blanco a los stickers en la burbuja. Registro del cambio: `CHANGELOG.md` `[0.2.27]`.

## 11. Detección de Enlaces y Botón Directo para Google Maps (`LinkifiedText.tsx`, `MessageMediaBody.tsx`)

**Qué se cambió (2026-11-13).**

- Creación de `LinkifiedText.tsx`: componente que tokeniza texto plano mediante `URL_REGEX`, convirtiendo enlaces `http://`, `https://` y `www.` en etiquetas `<a>` accesibles y seguras (`rel="noopener noreferrer"`, `target="_blank"`).
- Detección especializada de Google Maps y Waze (`isGoogleMapsUrl`), reconociendo URLs completas, enlaces acortados (`maps.app.goo.gl`, `goo.gl/maps`) y coordenadas GPS.
- Si el texto contiene enlaces de mapas, renderiza un botón interactivo _"Abrir ubicación en Google Maps"_ con iconos `MapPin` y `ExternalLink`, permitiendo acceso inmediato sin copiar texto.
- Integrado universalmente en `MessageMediaBody.tsx` en el cuerpo de texto, respuestas interactivas y subtítulos de imágenes, videos y audios.

**Por qué.** Cuando los suscriptores enviaban su ubicación para revisiones técnicas o instalaciones mediante enlaces de Google Maps o WhatsApp, los asesores debían seleccionar y copiar manualmente URLs largas para pegarlas en otra ventana del navegador.

**Qué no revertir.** No reemplazar `LinkifiedText` con `dangerouslySetInnerHTML` para parsear enlaces (riesgo XSS). Mantener siempre `target="_blank"` y `rel="noopener noreferrer"`. Registro del cambio: `CHANGELOG.md` `[0.2.27]`.

## 12. Pausa Operativa de Cronómetro de SLA en Casos Pendientes y Agendados (`sla-config.ts`, `OperationalInbox.tsx`)

**Qué se cambió (2026-11-13).**

- En `sla-config.ts`: se añadió el estado `"paused"` e indicador booleano `isPaused: true` a `calculateConversationSla`.
- Se evalúan las siguientes condiciones de pausa estándar ITIL Service Desk:
  1. La conversación está en estado `"pending"` (esperando respuesta o acción del cliente).
  2. El caso activo tiene estado `"WAITING_USER"` o `"PAUSED"`.
  3. El caso tiene un agendamiento técnico o llamada futura (`scheduledAt > Date.now()`).
- Al estar pausado, `minutesWaiting` se fija en 0, no se contabiliza como incumplido (`isBreached: false`) y muestra la etiqueta _"En espera"_.
- En `OperationalInbox.tsx`: el filtro de la pestaña _"Desatendidas"_ (`unattended`) y el contador numérico de cola excluyen explícitamente los casos con SLA pausado.

**Por qué.** El reloj de SLA penalizaba injustamente a los asesores cuando un suscriptor no respondía en días o cuando un caso de soporte se agendaba formalmente para una visita técnica en fecha posterior, generando alertas falsas de SLA vencido y distorsionando las estadísticas gerenciales de tiempo de atención.

**Qué no revertir.** No eliminar la verificación `!calculateConversationSla(c, slaConfig).isPaused` en el filtro de casos desatendidos. Registro del cambio: `CHANGELOG.md` `[0.2.27]`.

## 13. Alertas en Tiempo Real de SLA Sin Asignar y Botón 'Atender yo' (`use-realtime.tsx`, `NotificationBell.tsx`, `ChatHeader.tsx`, `OperationalInbox.tsx`)

**Qué se cambió (2026-11-13).**

- En `realtime-event.ts`, `realtime.gateway.ts` y `use-realtime.tsx`: soporte para el evento SSE `UNASSIGNED_SLA_BREACH`, que notifica cuando un caso escalado a cola humana supera el tiempo de espera sin ser atendido.
- Disparo de sonido de alerta, notificación nativa del navegador (`Notification`) con redirección a `/bandeja?conversationId=` y badge en rojo de alta prioridad en `NotificationBell.tsx` con los minutos de retraso.
- En `OperationalInbox.tsx`: banner animado persistente en el tope de la bandeja cuando hay casos en espera en la cola humana sin asignar.
- En `ChatHeader.tsx`: botón _"Atender yo"_ (`onClaim`) con estado visual destacado en ámbar/naranja para que cualquier asesor disponible tome el caso con un clic.

**Por qué.** Casos escalados por fallas críticas de red o solicitudes comerciales quedaban desatendidos en la cola si ningún supervisor los asignaba manualmente, incrementando el tiempo de abandono del cliente.

**Qué no revertir.** No suprimir el control `isConversationHumanUnassigned` que evita alertar sobre casos cerrados o en automatización activa del bot de IA. Registro del cambio: `CHANGELOG.md` `[0.2.27]`.

## 14. Diagnóstico Preciso de Errores de Entrega y Ventana de Atención (`customer-service-window.ts`, `delivery-error.ts`)

**Qué se cambió (2026-11-13).**

- En `customer-service-window.ts`:
  - Se refinó la función `isWhatsAppSessionWindowError(errorMessage)`. Anteriormente, evaluaba si la cadena contenía simplemente `"template"` o `"plantilla"`. Se restringió para exigir que `"template"` o `"plantilla"` esté acompañado de términos contextuales de expiración o ciclo de vida de sesión (`"24"`, `"window"`, `"ventana"`, `"expire"`, `"expir"`, `"reopen"`, `"reabrir"`, `"re-engage"`).
- En `delivery-error.ts`:
  - En `formatDeliveryError(errorMessage)`, se incorporó detección dedicada para errores de tipo `TEMPLATE_REQUIRED` y `"must start with an approved template"`.
  - Retorna `is24h: false`, indicador corto `"Plantilla requerida"` y detalle descriptivo que aclara la necesidad de iniciar con una plantilla oficial aprobada o revisar la indexación de la conversación en Zernio.
- En pruebas unitarias:
  - Adición de suite de validación `delivery-error.test.ts` y ampliación de `customer-service-window.test.ts` cubriendo ambos escenarios.

**Por qué.**
Al iniciar conversaciones salientes hacia números nuevos o clientes que no han iniciado chat previamente, la API de WhatsApp Cloud rechaza los mensajes de texto libre con el código de error `TEMPLATE_REQUIRED` ("WhatsApp messages to this user must start with an approved template"). Como la lógica anterior consideraba cualquier mención a "template" como el error 131047 (ventana de 24 horas expirada), el asesor recibía una alerta confusa indicando "Han pasado más de 24 horas desde el último mensaje del cliente", lo cual era falso para contactos que nunca habían escrito antes.

**Qué no revertir.**
No volver a usar coincidencias abiertas sobre la palabra aislada `"template"` o `"plantilla"` en `isWhatsAppSessionWindowError` sin validar la presencia de términos de ventana temporal. No marcar `is24h: true` en errores de `TEMPLATE_REQUIRED`. Registro del cambio: `CHANGELOG.md` `[0.2.27]`.

## 15. Estabilización de Pipeline CI/CD y Limpieza de Dependencias de Auditoría (`delivery-error.test.ts`, `AuditLogView.tsx`)

**Qué se cambió (2026-11-13).**

- En `delivery-error.test.ts`:
  - Se normalizó el fin de línea (EOF) del archivo de pruebas eliminando un salto de línea adicional que provocaba la falla de la regla `prettier/prettier` en el runner Ubuntu de GitHub Actions (`Delete ⏎`).
- En `AuditLogView.tsx`:
  - Se removieron 8 importaciones en desuso (`Lock`, `KeyRound`, `Layers`, `Filter`, `Bot`, `Laptop`, `useMemo`, `auditCategoryLabel`), dejando la vista de bitácora de auditoría sin advertencias de variables huérfanas en ESLint.

**Por qué.**
El pipeline de integración continua (`deploy.yml`) ejecuta `pnpm lint` con tolerancia cero a errores de formato de Prettier. Un salto de línea extra interrumpió el proceso de despliegue automatizado hacia Coolify. La depuración de imports huérfanos elimina el ruido en las inspecciones de código y asegura consistencia con el estándar de calidad del repositorio.

**Qué no revertir.**
Mantener la estructura formateada con `prettier --write` y evitar introducir saltos de línea dobles al final de los archivos `.ts` y `.tsx`. Registro del cambio: `CHANGELOG.md` `[0.2.27]`.
