# WhatsApp inbound media — proxy temporal (diseño)

**Fecha:** 2026-07-29  
**Estado:** aprobado en diálogo; pendiente revisión del archivo  
**Objetivo:** mostrar audio/imagen/video en el chat y dar a n8n una URL usable sin token de Meta.

## Contexto

Hoy `extractBody()` convierte media sin caption en literales `[audio]`, `[imagen]`, `[video]`. Ese string se guarda en `Message.body` y la UI solo renderiza `{m.body}`. El dominio no tiene campos de media; `WhatsAppCloudClient` no descarga adjuntos.

n8n ya recibe el payload Meta crudo (con `audio.id`, `mime_type`, `url`), pero la URL de Meta caduca y suele requerir Bearer. El hub debe exponer un proxy propio.

## Enfoque elegido

**Proxy bajo demanda (enfoque 1):** persistir `mediaId` + metadatos en el mensaje; servir `GET /api/media/:messageId` descargando desde Graph con el token del hub. Sin disco ni S3 (prueba).

### Alternativas descartadas

| Enfoque | Motivo de no elegirlo ahora |
|---------|------------------------------|
| Caché eager en RAM | Más RAM y complejidad; no necesario para prueba |
| Solo enriquecer n8n / token en n8n | No cumple mostrar media en el front |

## Alcance

**Incluye**
- Parseo de image / audio / video / document (`id`, `mime_type`, `caption`, `filename`, `voice`)
- Extensión de `Message` + `MessageDto`
- `WhatsAppCloudClient.getMediaUrl` + `downloadMedia`
- Ruta `GET /api/media/$messageId`
- Enriquecer forward a n8n con `hub_media_url` y `hub_message_id`
- Render condicional en `WhatsAppChatShell` y `OperationalInbox`
- Previews legibles en lista de conversaciones

**Fuera de alcance (v1)**
- Storage permanente (disco/S3)
- Envío outbound de media
- Stickers, lightbox, auth fuerte del proxy
- Recuperar media de mensajes históricos que solo tienen `body = "[audio]"`

## Modelo de datos

```ts
type MessageType = "text" | "image" | "audio" | "video" | "document" | "other";

// campos nuevos en Message
type?: MessageType;
mediaId?: string;
mimeType?: string;
caption?: string;
filename?: string;
mediaUrl?: string; // relativa: /api/media/{messageId}
```

- `body`: caption si existe; si no, preview legible (`Audio`, `Imagen`, `Video`, `Documento`). Deja de ser la única fuente de verdad para media.
- `mediaUrl` se calcula al crear el mensaje (path relativo). El DTO lo expone tal cual; el front puede usarlo relativo al origin. Para n8n se prefija con `APP_PUBLIC_URL`.

## Flujo

```
Meta POST /api/webhooks/whatsapp
  → parseInbound: type + mediaId + mimeType + caption/filename + body preview
  → receiveInboundMessage: guarda Message con media*
  → mediaUrl = /api/media/{messageId}
  → scheduleForwardInbound: Meta changes + hub_media_url / hub_message_id por mensaje con media
  → UI listMessages → MessageDto con type/mediaUrl/...
  → GET /api/media/:id → getMediaUrl(mediaId) → downloadMedia(url) → stream binario
```

## API y adaptadores

### WhatsAppCloudClient

- `getMediaUrl(mediaId)`: `GET {apiBase}/{mediaId}` + Bearer → `{ url, mime_type }`
- `downloadMedia(url)`: `GET` a URL Meta + Bearer → bytes + content-type

Usar siempre el `mediaId` de Graph (no depender de la `url` del webhook, que puede variar o caducar antes).

### GET /api/media/$messageId

1. Resolver mensaje por id; sin `mediaId` → 404  
2. Descargar vía cliente WhatsApp  
3. Responder binario con `Content-Type` del mensaje o el de Meta  
4. Errores de Graph → 502/404 con mensaje corto  

Auth del endpoint: abierta en v1 de prueba; documentar endurecer en producción.

### Config

- `APP_PUBLIC_URL` (ej. `http://localhost:3000` o URL ngrok): base absoluta para `hub_media_url` hacia n8n. Si falta, enviar solo path relativo y loguear warning.

### Payload n8n

Mantener el array Meta actual (`extractMetaChangesForN8n`).

**Cuándo enriquecer:** después de guardar cada inbound (cuando ya existe el id interno del hub). Construir un mapa `waMessageId → hubMessageId` durante el loop de ingest; luego clonar los changes y, en cada objeto dentro de `messages[]` que tenga media (`image`/`audio`/`video`/`document` con `id`), añadir:

- `hub_message_id`: id interno del hub
- `hub_media_url`: `{APP_PUBLIC_URL}/api/media/{hubMessageId}` (si falta `APP_PUBLIC_URL`, path relativo `/api/media/...` + warning en log)

Campos extra van **en el mismo objeto mensaje Meta** (no en un wrapper aparte), para que n8n siga leyendo `messages[0].audio` igual que ahora y además use `messages[0].hub_media_url`.

n8n descarga con HTTP Request al proxy **sin** token de Meta.

## UI

| `type` | Render |
|--------|--------|
| `image` | `<img src={mediaUrl} />` + caption |
| `audio` | `<audio controls src={mediaUrl} />` |
| `video` | `<video controls src={mediaUrl} />` |
| `document` | link + `filename` |
| resto | `{body}` |

Lista lateral: preview corto por tipo (`Audio`, `Imagen`, …), no literales entre corchetes.

## Manejo de errores

- Media Meta expirada / id inválido: proxy 404/502; bubble muestra caption/`body` y estado de error al cargar el media element.
- Mensajes legacy sin `mediaId`: solo texto `body`.
- Fallo al forward n8n: igual que hoy (retries, no bloquea 200 a Meta).

## Testing (mínimo v1)

- Unit: `extractBody` / parse con fixture audio (como el JSON real con `mime_type`, `id`, `voice`) produce `type=audio` + `mediaId`.
- Unit/integration ligera: `toMessageDto` incluye campos media.
- Manual: enviar audio/imagen por WhatsApp → bubble reproduce; n8n recibe `hub_media_url` y puede GET.

## Archivos principales a tocar

- `src/adapters/whatsapp-cloud/webhook.ts`
- `src/adapters/whatsapp-cloud/client.ts`
- `src/routes/api/webhooks/whatsapp.ts`
- `src/routes/api/media.$messageId.ts` (o ruta equivalente TanStack)
- `src/core/modules/conversations/domain/message.ts`
- `src/core/modules/conversations/application/receive-inbound-message.ts`
- `src/adapters/http/dto.ts`
- `src/adapters/n8n/client.ts` (+ enriquecimiento en webhook)
- `src/components/whatsapp/WhatsAppChatShell.tsx`
- `src/components/OperationalInbox.tsx`
- `.env.example` (`APP_PUBLIC_URL`)
