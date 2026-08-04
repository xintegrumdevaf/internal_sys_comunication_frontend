# Chat interno 1:1 con menciones de casos (mock frontend)

Fecha: 2026-08-04  
Estado: aprobado para plan de implementación (mock)

## Problema

Cuando un caso está abierto y un agente no responde bien al cliente, el supervisor necesita referenciar esa conversación o ese cliente en un chat interno con el agente, explicar el error y poder volver al caso para continuar el trabajo.

Hoy el frontend solo tiene chat con el cliente (WhatsApp / bandeja). No hay mensajería entre agentes ni referencias estructuradas a casos.

## Objetivos

1. Chat interno **1:1** entre agentes (incluye supervisor ↔ agente).
2. Mencionar **conversación** o **cliente/contrato** con `@` dentro de ese chat.
3. Hover en la mención → resumen; clic → abrir la conversación en la bandeja.
4. Botón **Menciones** para el supervisor: acceso rápido a mencionar casos y a reabrir menciones recientes.
5. **v1 solo mock en frontend** (memoria + `localStorage`) para validar la UX antes del backend.

## Fuera de alcance (v1)

- Salas por departamento.
- Mencionar agentes con `@nombre` (solo conversación / cliente).
- Envío de estas menciones al cliente por WhatsApp.
- API real de mensajes internos (se documenta como evolución).
- Persistencia entre navegadores o usuarios reales en servidor.

## Roles

| Rol en producto | Roles actuales en identity | Capacidad |
|---|---|---|
| Agente | `agent` | Chat 1:1, ver chips, abrir caso |
| Supervisor | `lead`, `admin` (incl. Admin TI) | Todo lo anterior + botón **Menciones** y flujo de corrección |

El “administrador” del requisito se trata como **supervisor**: quien realiza las menciones para orientar el trabajo.

## Flujo principal

1. Supervisor abre **Chat interno** y selecciona (o crea) un DM con el agente.
2. Escribe el feedback y usa `@` para elegir conversación o cliente/contrato.
3. Se inserta un chip en el mensaje; al enviar, queda guardado en el mock local.
4. El agente (u otro supervisor) ve el chip: hover muestra resumen; clic abre la bandeja con esa conversación.
5. Desde el botón **Menciones**, el supervisor ve menciones recientes que él hizo, puede reabrir el caso o iniciar una mención nueva hacia el agente asignado / chat activo.

## UI

### Ruta `/chat-interno`

- Columna izquierda: lista de threads DM (contraparte, preview, hora).
- Columna derecha: hilo + composer.
- Entrada en navegación de módulos (junto a Bandeja / WhatsApp) para usuarios autenticados.

### Composer y picker `@`

- Al escribir `@`, popup de búsqueda (cmdk / Command) con dos grupos:
  - **Conversaciones**: nombre cliente, preview, departamento, estado.
  - **Clientes/contratos**: nombre, `contractId`.
- Selección → chip en el draft (label legible, p. ej. `@Ana — Contrato #123`).
- Enter envía el mensaje (sin disparar el picker si está cerrado).

### Chip en mensaje

- Estilo destacado e interactivo.
- Hover: tarjeta corta (nombre, contrato, estado, departamento) desde datos mock / lista de conversaciones cargada.
- Clic: navegar a `/bandeja?conversationId=<id>` (o deep-link equivalente) y seleccionar esa conversación.
- Si el target ya no está en los datos locales: chip deshabilitado + texto “Caso no disponible”.

### Botón Menciones (supervisor)

Visible si el usuario tiene rol `lead` o `admin` (o `session.isAdmin`).

Abre panel/vista con:

1. **Mencionar caso**: búsqueda de conversación/cliente; al elegir, abre o enfoca el DM con el agente asignado si se conoce, o inserta la mención en el thread activo.
2. **Recientes**: lista de menciones hechas por el supervisor (mensaje excerpt, target, destinatario del DM, timestamp) con acción “Abrir caso”.

## Modelo de datos (mock)

Persistencia: `localStorage` (clave sugerida `netops.internalChat.v1`).

```ts
type MentionType = "conversation" | "customer";

type Mention = {
  type: MentionType;
  /** conversationId o contractId según type */
  targetId: string;
  label: string;
};

type InternalThread = {
  id: string;
  userAId: string;
  userBId: string;
  updatedAt: string;
};

type InternalMessage = {
  id: string;
  threadId: string;
  authorId: string;
  body: string;
  mentions: Mention[];
  createdAt: string;
};

type RecentMentionEntry = {
  id: string;
  messageId: string;
  threadId: string;
  mention: Mention;
  authorId: string;
  createdAt: string;
};
```

### Fuentes del picker

1. Preferir conversaciones ya disponibles vía `listConversationsFn` / estado de bandeja si la sesión las tiene.
2. Si no hay datos remotos, seed mock de conversaciones/clientes para demo.
3. Clientes derivados de `customerName` + `contractId` de conversaciones, o seed dedicado.

### Usuarios del DM

Lista de contrapartes desde `auth-seed` / usuarios demo (excluir al usuario actual). Crear thread al primer mensaje o al elegir “Nuevo chat”.

## Arquitectura frontend

Unidades con una responsabilidad cada una:

| Unidad | Responsabilidad |
|---|---|
| `internal-chat-store` | CRUD mock threads/messages/mentions + `localStorage` |
| `use-internal-chat` | Estado UI del hilo activo, envío, lista |
| `MentionPicker` | Autocomplete `@` sobre targets |
| `MessageBodyWithMentions` | Parse/render chips + hover card |
| `MentionsPanel` | UI del botón Menciones (solo supervisor) |
| Ruta `chat-interno` | Composición de lista + hilo + panel |

Deep-link bandeja: extender `OperationalInbox` / ruta `/bandeja` para leer `conversationId` de search params y seleccionar al montar.

No se modifican payloads de WhatsApp (`body` plano al cliente). Las menciones viven solo en mensajes internos mock.

## Errores y bordes

- Envío: fallo de persistencia local → toast, conservar draft.
- Target inexistente al abrir → toast “Caso no disponible”.
- Thread duplicado 1:1: normalizar par `(minId, maxId)` para no crear dos DMs entre los mismos usuarios.
- Picker vacío: mensaje “Sin resultados” + hint de seed/demo.

## Evolución a backend (no v1)

Contrato previsto para reemplazar el store mock sin rehacer UI:

- `GET/POST /api/internal/threads`
- `GET/POST /api/internal/threads/:id/messages` con `{ body, mentions }`
- `GET /api/internal/mention-targets?q=`
- `GET /api/internal/mentions/recent`
- Resumen hover: reutilizar `GET /api/conversations/:id/context`

## Criterios de aceptación (demo mock)

- [ ] Existe `/chat-interno` con lista de DMs y composer.
- [ ] Se puede chatear 1:1 entre dos usuarios demo (cambiando sesión o con dos seeds).
- [ ] `@` lista conversaciones y clientes; inserta chip.
- [ ] Hover muestra resumen; clic abre bandeja en esa conversación.
- [ ] Supervisor ve botón **Menciones** con recientes y atajo para mencionar.
- [ ] Agente sin rol lead/admin no ve el botón **Menciones**, pero sí ve chips.
- [ ] Datos sobreviven recarga de página (`localStorage`).

## Testing

- Unitario del store mock: crear thread idempotente, append mensaje con mentions, recent mentions filtradas por author.
- Unitario de parseo de body/chips (si se usa markup en `body` además del array `mentions`).
- Smoke manual: flujo supervisor → mención → abrir caso en bandeja.
