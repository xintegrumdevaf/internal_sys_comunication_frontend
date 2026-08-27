# 07_QUALITY_SUPERVISION.md

## Panel de supervisión de calidad (UI)

> Normativo de frontend para `/calidad`. El dominio y contrato REST viven en el backend: `isp-customer-service-api/docs/spec/07_QUALITY_SUPERVISION.md` y `03_API_CONTRACT.md` §C. Este documento no inventa endpoints ni scores.

**Prerrequisito:** backend Etapa 10 desplegada (endpoints `/api/quality/*`). Si faltan, empty state honesto — **nunca** mockear scores.

## 1. Objetivo UI

Dar a `admin` y `manager` (jefe de área) un lugar para:

1. Ver **eficiencia** por agente (casos cerrados, avg cordialidad, críticos, primera respuesta) — solo sobre reviews ya persistidas (sin llamar a la IA al cargar).
2. Listar y filtrar **reviews** de conversaciones humano↔cliente.
3. Abrir el **detalle** con timeline y mensajes problemáticos remarcados (poll si `pending`).
4. Dejar una **nota de coaching** y abrir chat interno con panel de hallazgos a justificar.

**Tokens:** cargar `/calidad` **no** llama a la IA. Auto = al cerrar caso (backend). Fresco = «Analizar de nuevo» (detalle) o batch acotado («Analizar sin score» / «Analizar este agente», max 15). Ver política en backend `07_QUALITY_SUPERVISION.md` §4.

El rol `agent` **no** ve esta ruta.

## 2. Ruta y acceso

| Item    | Valor                                                                               |
| ------- | ----------------------------------------------------------------------------------- |
| Ruta    | `/calidad`                                                                          |
| Módulo  | `src/modules/quality/`                                                              |
| Roles   | `manager` \| `admin` (`canAccessPath` / `modulesForSession`)                        |
| Landing | No cambia la landing actual; entrada en nav de supervisores junto a `/asignaciones` |

Manager: el gateway envía filtros; si el backend filtra por membership, la UI no inventa depto ajenos. Admin puede filtrar `departmentId` opcional.

## 3. Pantallas

### 3.1 Ranking / eficiencia (vista default)

- Filtros: rango `from`/`to` (default últimos 7 o 30 días), `departmentId` (admin; manager pre-acotado).
- Tabla: agente, casos completados, avg cordialidad (semáforo §4), #reviews críticos, avg primera respuesta humana (o “—” si null).
- Click en agente → filtra la lista de reviews de ese agente (misma página o subvista).
- **Indicador de análisis en curso:** StatCard / banner con `GET /api/quality/pending-count`; poll del board mientras `pendingCount > 0`. Filas `pending` muestran spinner.
- **Filtro de agente** (select) + lista de **chats** (no batch masivo):
  - Con agente filtrado: filas muestran **cliente + teléfono** (nunca el agente repetido).
  - Columnas: score, estado, críticos, resumen, fecha, acción «Reintentar» si falló.
  - Sin filtro: columna Agente visible.
  - Poll ligero solo `pending-count` (~15s) mientras haya cola.

Datos: `GET /api/quality/agents?from=&to=&departmentId=`.

### 3.2 Lista de reviews

- Filtros: `agentId`, `minScore`/`maxScore`, `status`, fechas.
- Columnas: fecha, agente, score, status, #hallazgos high, trigger.
- Click → detalle.

Datos: `GET /api/quality/reviews?...`.

### 3.3 Detalle de review

Layout denso tipo Whaticket (ver `docs/skills/ui-ux-design-principles.md`):

- **Centro:** timeline de mensajes del caso (`GET /api/conversations/:id/messages` filtrado al caso, o mensajes ya incluidos si el detalle los trae por id). Mensajes cuyo `id` ∈ `findings[].messageId` se **remarcan** (borde/fondo de severidad; no emoji).
- **Lateral:** score + semáforo, `summary`, `efficiencyNotes`, lista de findings (click scroll al mensaje), status.
- **Acciones:**
  - Formulario nota → `POST /api/quality/reviews/:id/notes` `{ body }`.
  - “Marcar revisada” → `PATCH ... { status: "reviewed" }` si estaba `ready`.
  - “Analizar de nuevo” (on-demand) → `POST /api/quality/reviews` `{ caseId }` cuando tenga sentido (caso cerrado, status failed, o pedido explícito).
  - “Abrir chat interno” → `/chat-interno?peerId={agentId}&qualityReviewId={id}` (§5).

Estados: `pending` (spinner / “análisis en curso”), `failed` (mensaje de reintento), `ready`/`reviewed` (contenido completo).

## 4. Semáforo de cordialidad

Alineado al backend (`07` §5):

| Score   | Clase visual          | Label     |
| ------- | --------------------- | --------- |
| ≥ 70    | ok / neutro positivo  | Cordial   |
| 40–69   | atención / warning    | Revisar   |
| &lt; 40 | crítico / destructive | Crítico   |
| `null`  | muted                 | Sin score |

No inventar colores fuera del design system existente (Radix/Tailwind del repo).

## 5. Integración con Chat Interno y Objeción de Hallazgos

El módulo de calidad se integra bidireccionalmente con el chat interno persistente:

1. **Acción "Objetar al agente en Chat"**:
   - En la lista de hallazgos de `QualityReviewDetail.tsx`, cada ítem cuenta con un botón **Objetar**.
   - Al pulsarlo, se obtiene/crea el hilo 1:1 con el agente (`internalChatApi.getOrCreateDirectThread(agentId, reviewId)`), se envía automáticamente el mensaje estructurado con `type: 'quality_quote'` y `contextData` (categoría, severidad, extracto, score, `qualityReviewId`), y se navega a `/chat-interno?threadId={thread.id}&peerId={agentId}&qualityReviewId={id}`.
2. **Tarjeta interactiva `QualityQuoteCard`**:
   - En `/chat-interno`, los mensajes con `type === 'quality_quote'` renderizan la tarjeta estilizada por severidad, con cita del fragmento y botón `Ver conversación auditada ↗` que redirige de vuelta al detalle de la revisión en `/calidad`.
3. **Query params soportados en `/chat-interno`**:
   - `threadId`: ID del hilo persistente activo.
   - `peerId`: UUID del agente supervisado.
   - `qualityReviewId`: ID de la auditoría asociada.

## 6. Contratos consumidos (paridad)

DTOs en `01_DATA_MODEL.md` §8 — idénticos a backend `03` §C.4:

- `AgentQualityStatsDto`
- `QualityReviewDto` / `QualityFindingDto` / `QualityCoachingNoteDto`
- `MessageDto.agentId` (nullable)

Gateway: `modules/quality/infrastructure/quality.gateway.ts`.

## 7. Empty / error states (obligatorio)

- 403 / rol agent: la ruta ni aparece en nav; si se navega directo → redirect a landing.
- Endpoints 404/no implementados: empty state “Supervisión de calidad pendiente de backend (Etapa 10)” — no scores fake.
- Lista vacía con backend OK: “No hay revisiones en este rango”.
- Review `failed`: CTA on-demand si el usuario tiene permiso.

## 8. Tests mínimos (Etapa 9 front)

- `access-control`: `/calidad` solo manager/admin.
- Gateway: URLs/métodos/query exactos.
- UI detalle: finding `messageId` aplica clase de highlight al mensaje correspondiente (test de componente).
- Deep-link: parseo de `peerId`/`qualityReviewId` en domain o shell (test unitario).
