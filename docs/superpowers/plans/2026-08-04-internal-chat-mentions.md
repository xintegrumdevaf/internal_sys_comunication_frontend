# Chat interno 1:1 con menciones (mock) — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (preferred) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar un chat interno 1:1 entre agentes (mock en `localStorage`) con menciones `@` de conversación/cliente, panel **Menciones** para supervisores, deep-link a bandeja, y aislamiento total respecto al hilo del cliente.

**Architecture:** Store mock aislado (`netops.internalChat.v1`) + hook de UI + ruta `/chat-interno`. Las menciones son metadata en mensajes internos; el clic solo navega a la bandeja del staff. No se llama a `sendWhatsAppReplyFn` ni se mezclan stores con `MessageDto` del cliente.

**Tech Stack:** React 19, TanStack Router/Start, Tailwind/shadcn (`Command`, `HoverCard`), `localStorage`, sonner, usuarios seed en `auth-seed.ts`.

**Spec:** `docs/superpowers/specs/2026-08-04-internal-chat-mentions-design.md`

---

## File map

| Archivo | Rol |
|---|---|
| `src/lib/internal-chat-types.ts` | Tipos Mention / Thread / Message |
| `src/lib/internal-chat-store.ts` | Persistencia mock + API del store |
| `src/lib/internal-chat-seed.ts` | Targets demo si no hay conversaciones API |
| `src/lib/auth.ts` | Path `/chat-interno`, nav, helper `isSupervisor` |
| `src/hooks/use-internal-chat.ts` | Estado UI del chat |
| `src/components/internal-chat/MentionPicker.tsx` | Autocomplete `@` |
| `src/components/internal-chat/MessageBodyWithMentions.tsx` | Chips + hover |
| `src/components/internal-chat/MentionsPanel.tsx` | Panel supervisor |
| `src/components/internal-chat/InternalChatShell.tsx` | Layout lista + hilo |
| `src/routes/chat-interno.tsx` | Ruta |
| `src/routes/bandeja.tsx` + hook/inbox | Deep-link `?conversationId=` |
| `src/adapters/http/server-fns.ts` | **No tocar** para envío interno |

---

### Task 1: Tipos y store mock

**Files:**
- Create: `src/lib/internal-chat-types.ts`
- Create: `src/lib/internal-chat-store.ts`

- [ ] **Step 1:** Definir tipos según el spec (`Mention`, `InternalThread`, `InternalMessage`, `RecentMentionEntry`, estado raíz `{ threads, messages }`).

- [ ] **Step 2:** Implementar store con:
  - `loadState` / `saveState` en `localStorage` clave `netops.internalChat.v1`
  - `pairKey(a, b)` → ordenar ids para thread único
  - `getOrCreateThread(userAId, userBId)`
  - `listThreadsForUser(userId)`
  - `listMessages(threadId)`
  - `sendMessage({ threadId, authorId, body, mentions })` → actualiza `updatedAt`, deriva entradas recent
  - `listRecentMentionsByAuthor(authorId)`
  - listeners `subscribe` / `useSyncExternalStore`-friendly (mismo patrón que `auth.ts`)

- [ ] **Step 3:** Verificar en consola del navegador (o import temporal): crear thread, enviar mensaje con mention, recargar página y confirmar persistencia. No debe existir import desde `server-fns` de WhatsApp.

- [ ] **Step 4:** Commit: `feat(internal-chat): store mock de DMs y menciones`

---

### Task 2: Seed de targets y helper de supervisor

**Files:**
- Create: `src/lib/internal-chat-seed.ts`
- Modify: `src/lib/auth.ts`
- Modify: `src/lib/identity.ts` (solo si conviene exportar helper de rol)

- [ ] **Step 1:** Seed de `MentionTarget[]` demo (conversaciones + clientes) para cuando `listConversationsFn` falle o esté vacío. Incluir `conversationId`, `contractId`, `customerName`, `department`, `status`.

- [ ] **Step 2:** En `auth.ts`:
  - Añadir `"/chat-interno": null` a `PATH_DEPARTMENT`
  - Permitir acceso en `canAccessPath` igual que `/bandeja`
  - Añadir `{ label: "Chat interno", to: "/chat-interno" }` en `modulesForSession` (todos los autenticados)
  - Exportar `isSupervisorSession(session)`: `isAdmin` o alguna membership `lead`/`admin` (leer desde `SEED_USERS` por `session.id`)

- [ ] **Step 3:** Commit: `feat(internal-chat): nav, permisos y seed de menciones`

---

### Task 3: Hook `use-internal-chat`

**Files:**
- Create: `src/hooks/use-internal-chat.ts`

- [ ] **Step 1:** Hook que expone: `threads`, `selectedThreadId`, `setSelectedThreadId`, `messages`, `peers` (SEED_USERS menos current), `openThreadWith(peerId)`, `send(body, mentions)`, `recentMentions` (si supervisor).

- [ ] **Step 2:** Suscribirse al store; al cambiar sesión, filtrar threads del `session.id`.

- [ ] **Step 3:** Commit: `feat(internal-chat): hook de estado del chat interno`

---

### Task 4: MentionPicker + MessageBodyWithMentions

**Files:**
- Create: `src/components/internal-chat/MentionPicker.tsx`
- Create: `src/components/internal-chat/MessageBodyWithMentions.tsx`
- Use: `src/components/ui/command.tsx`, `src/components/ui/hover-card.tsx`

- [ ] **Step 1:** `MentionPicker`: props `query`, `targets`, `onSelect`, `open`. Grupos Conversaciones / Clientes. Filtrar por nombre/contrato/id.

- [ ] **Step 2:** Composer detecta `@` (último token); abre picker; al seleccionar, inserta placeholder en `body` tipo `@[label](conversation:id)` o `customer:contractId` **y** acumula `Mention[]` en estado del draft. Preferir array de mentions + body con markers estables.

- [ ] **Step 3:** `MessageBodyWithMentions`: renderiza texto + chips; `HoverCard` con resumen; `onOpen` callback con `conversationId` resuelto (si mention es `customer`, buscar conversación por `contractId` en targets; si no hay, chip disabled “Caso no disponible”).

- [ ] **Step 4:** Commit: `feat(internal-chat): picker @ y chips con hover`

---

### Task 5: InternalChatShell + MentionsPanel + ruta

**Files:**
- Create: `src/components/internal-chat/InternalChatShell.tsx`
- Create: `src/components/internal-chat/MentionsPanel.tsx`
- Create: `src/routes/chat-interno.tsx`

- [ ] **Step 1:** Shell: lista izquierda (peers/threads), hilo derecha, composer con picker. Estilo alineado a bandeja/WhatsApp existentes (sin rediseñar el design system).

- [ ] **Step 2:** `MentionsPanel` (Sheet/Dialog): visible solo si `isSupervisorSession`. Secciones “Mencionar caso” + “Recientes”. Acciones: insertar mención en thread activo / abrir DM con peer / “Abrir caso”.

- [ ] **Step 3:** Ruta `createFileRoute("/chat-interno")` con `AppShell`, título “Chat interno”, botón Menciones en header si supervisor.

- [ ] **Step 4:** Cargar targets: intentar `listConversationsFn` con `session.id`; merge/fallback a seed. **Nunca** enviar mensajes internos por APIs de WhatsApp.

- [ ] **Step 5:** Manual: login como Laura (`lead`) → Chat interno → DM con Andrés → `@` mención → ver chip. Login como Andrés → ver mensaje. Confirmar que WhatsApp/bandeja del cliente no muestra ese texto.

- [ ] **Step 6:** Commit: `feat(internal-chat): UI de DMs, panel Menciones y ruta`

---

### Task 6: Deep-link a bandeja

**Files:**
- Modify: `src/routes/bandeja.tsx`
- Modify: `src/hooks/use-operational-inbox.ts` y/o `src/components/OperationalInbox.tsx`

- [ ] **Step 1:** Validar search params en ruta bandeja: `conversationId?: string` (TanStack Router `validateSearch`).

- [ ] **Step 2:** Al montar inbox, si hay `conversationId` y existe en lista, `setSelectedId(conversationId)`. No añadir mensajes internos al thread del cliente.

- [ ] **Step 3:** Desde chip / panel, `navigate({ to: "/bandeja", search: { conversationId } })`.

- [ ] **Step 4:** Manual: clic en chip → bandeja abre esa conversación; hilo del cliente sin mensajes del chat interno.

- [ ] **Step 5:** Commit: `feat(bandeja): deep-link conversationId desde menciones internas`

---

### Task 7: Verificación de privacidad y criterios de aceptación

**Files:** none (checklist)

- [ ] **Step 1:** Recorrer criterios del spec:
  - `/chat-interno` funciona
  - DM 1:1 entre seeds
  - `@` conversación + cliente
  - hover + clic
  - botón Menciones solo supervisor (`u_soporte`, `u_admin`, `u_utga`, `u_admin_ops`; **no** `u_cartera` agent)
  - persistencia reload
  - hilo cliente limpio de internos

- [ ] **Step 2:** Grep de seguridad: en `src/components/internal-chat` y `src/lib/internal-chat*` no debe aparecer `sendWhatsAppReplyFn` ni escritura a stores de mensajes de cliente.

- [ ] **Step 3:** Commit final si hubo ajustes: `fix(internal-chat): ajustes demo y privacidad`

---

## Notas de implementación

- **Sin Vitest en el repo hoy:** verificación principal manual + TypeScript (`npm run build`). No añadir runner salvo que se pida.
- **Privacidad:** requisito duro; cualquier “reenviar al cliente” queda fuera.
- **Backend:** no implementar endpoints; el store es el límite de v1.
- **No** modificar `.env` ni tocar cambios ajenos (`.gitignore`, deletes previos) en estos commits.
