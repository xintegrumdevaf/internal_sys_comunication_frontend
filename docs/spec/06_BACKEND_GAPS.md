# 06_BACKEND_GAPS.md

Huecos detectados en `isp-customer-service-api` durante la construcción del frontend. Se documentan aquí para que se implementen en una sesión dedicada al backend — **no se implementan como parte de este trabajo de frontend**, pero tampoco se descartan: son requisitos reales del negocio (ISP con agentes por departamento) que el backend actual no cubre todavía.

## 1. CRUD de agentes (`POST` / `PUT` / `DELETE /api/agents`) — resuelto

**Problema (histórico)**: solo existía `GET /api/agents` (lista). No había forma de crear, editar o desactivar un agente vía API — solo por seed/migración (`scripts/seed.ts`, `AgentRepositoryPg`).

**Solución implementada** en `isp-customer-service-api` (sesión de backend dedicada):

```http
POST /api/agents
{ "name": "...", "email": "...", "role"?: "agent" | "manager" | "admin", "primaryDepartmentId"?: "uuid" | null }
→ 201 { "data": AgentDto }

PUT /api/agents/:id
{ "name"?, "email"?, "role"?, "primaryDepartmentId"?, "active"? }
→ 200 { "data": AgentDto }

DELETE /api/agents/:id   (soft delete: pone active=false, nunca borra la fila)
→ 200 { "data": AgentDto }
```

Reglas de negocio implementadas (coherentes con `01_DATA_MODEL.md` §7 del backend):

- Email único, comparado y almacenado siempre en minúsculas (case-insensitive).
- No permite desactivar al único `role=admin` activo, ni quitarle el rol admin si es el único activo (`agent-guardrails.ts`).
- `primaryDepartmentId` se valida contra `department` antes de escribir (nunca se deja que el error llegue como violación de FK cruda de Postgres).
- Requiere `x-agent-id` de un actor `role=admin` — mismo patrón que `n8n-workflows.router.ts` (todavía no hay JWT/sesiones, ver hueco nuevo más abajo).
- Toda escritura queda en `audit_event` (`AGENT_CREATED` / `AGENT_UPDATED` / `AGENT_DEACTIVATED`).

Archivos clave (arquitectura hexagonal, mismo patrón que el catálogo n8n):
`src/core/modules/departments/application/use-cases/{create,update,deactivate}-agent.use-case.ts`,
`.../agent-guardrails.ts`, `.../presentation/admin/agents.router.ts`.
Tests: `test/departments/use-cases/*.test.ts` (16 casos, incluye las reglas del "último admin").

**Estado**: resuelto — ver `docs/spec/03_API_CONTRACT.md` §C.1 y `docs/API_ENDPOINTS.md` del backend.

### 1.b Login con credenciales reales — resuelto

**Solución implementada** en `isp-customer-service-api`:

```http
POST /api/auth/login          { email, password } → 200 { data: AgentDto } + cookie httpOnly `sid`
POST /api/auth/logout         → 204, revoca la sesion en Redis y limpia la cookie
GET  /api/auth/me             → 200 { data: AgentDto } | 403 si no hay sesion
POST /api/auth/change-password { currentPassword, newPassword } → 204

POST /api/agents/:id/reset-password → 200 { data: { agent: AgentDto, temporaryPassword } }
```

Decisiones de diseño (confirmadas con el equipo antes de implementar):

- **Sesión**: cookie `httpOnly` (`sid`) + token opaco aleatorio guardado en Redis (`session:<token>` → `{ agentId, createdAt }`), **no JWT** — permite revocar una sesión al instante borrando la clave, cosa que un JWT firmado no permite hasta que expira.
- **Expiración deslizante de 12h**: cada request autenticado renueva el TTL en Redis y el `Max-Age` de la cookie (`session.middleware.ts`).
- **Hashing**: `argon2id` (`shared/security/password-hasher.ts`).
- **`SameSite=Lax`** alcanza para CSRF en este proyecto (todos los `GET` son de solo lectura, sin efectos secundarios) — no se agregó un token CSRF aparte para no sobre-ingenierizar.
- **Provisión de contraseña inicial**: el backend genera una contraseña temporal aleatoria (12 caracteres, sin ambiguos) al crear un agente o al restablecer su contraseña — se muestra **una única vez** en la respuesta; no hay infraestructura de correo para invitar al agente todavía.
- **Endurecimiento completo** (no solo la puerta de entrada): se reemplazó la confianza en el header `x-agent-id` / `agentUserId`/`actorId` del body en **todos** los routers existentes (`cases`, `conversations`, `escalations`, `departments`, `audit`, `admin/n8n-workflows`, `admin/agents`, `realtime`) — la identidad de quien actúa siempre se resuelve desde `req.agent` (poblado por la cookie real), nunca desde algo que el cliente declare. Los campos `agentUserId` que siguen existiendo en algunos bodies (`assign`/`reassign`) son el **destino** de la acción ("a quién asignar"), no una afirmación de identidad.
- El atajo de frontend "cambiar de perfil sin contraseña" (útil mientras no había login real) se eliminó — con credenciales reales, mantenerlo sería un hueco de seguridad.

Archivos clave: `src/core/modules/auth/**` (dominio/sesión/use-cases/router/middleware), `shared/security/password-hasher.ts`, `shared/http/{cookies,require-auth,express.d}.ts`. Tests: `test/auth/use-cases/*.test.ts`, `test/departments/use-cases/reset-agent-password.use-case.test.ts`, `test/shared/password-hasher.test.ts`, más el flujo end-to-end verificado en `test/cases/n8n-workflows.router.test.ts` (login real → cookie → endpoint protegido).

**Estado**: resuelto. Agentes ya existentes antes de esta migración no tienen contraseña — un admin debe usar "Restablecer contraseña" en `/usuarios` para poder loguearlos (o, en desarrollo, `scripts/seed.ts` ya deja una contraseña de prueba conocida).

## 2. Algoritmo de asignación automática de casos por departamento — resuelto

**Solución implementada** en `isp-customer-service-api`:

1. **Disparador**: al persistirse una fila `escalation` con `departmentId` resuelto (`EscalationService.persistEscalation`, cubre los 3 caminos: motor de workflow, `REQUEST_HUMAN`, y — deliberadamente NO — el pool de triage, que sigue requiriendo clasificación humana por `manager`/`admin`).
2. **Selección de agente** (`AutoAssignAgentService.pickAgentForDepartment`): entre los agentes `active=true` con rol `agent` o `manager` (los `admin` no reciben carga operativa automática) cuyo `primaryDepartmentId` coincide o tienen `agent_membership` explícita:
   - Se excluyen los que ya alcanzaron `AUTO_ASSIGN_MAX_ACTIVE_CASES_PER_AGENT` casos `HUMAN_ACTIVE` (env var, default `6`).
   - Entre los elegibles, se elige el de **menor carga activa**; el empate se resuelve por nombre (orden simple y determinista — no hay todavía un registro de "última asignación" para un round-robin más fino, documentado como simplificación consciente).
   - Si nadie es elegible, el caso queda `ESCALATED` sin asignar en el pool de escalaciones para asignación manual — nunca se fuerza una asignación a alguien sobrecargado.
3. **Efecto**: mismo resultado que `POST /api/cases/:id/assign`, pero registra `actorId: null` (sistema) en `audit_event` con la acción `CASE_AUTO_ASSIGNED`.
4. **Reasignación manual sigue disponible siempre**: un `manager`/`admin` puede reasignar con `POST /api/cases/:id/reassign` en cualquier momento — el algoritmo automático es el asignador **inicial**, no un candado.
5. **Notificación**: reutiliza el evento `HUMAN_ASSIGNED` ya existente en el catálogo SSE — el frontend reacciona sin cambios adicionales (`03_REALTIME_NOTIFICATIONS.md`).
6. **Solo lectura para agentes no asignados**: se cerró un hueco existente — `POST /api/conversations/:id/reply` y `POST /api/cases/:id/complete` ahora exigen que quien actúa sea el agente asignado (o `manager`/`admin` con alcance) cuando el caso ya está `HUMAN_ACTIVA`/`ESCALATED`, reutilizando `assertCanWriteCase` (`agent-case-auth.ts`) que ya aplicaba esta regla en `claim`/`disable-automation`/`reactivate-automation`. El resto de agentes pueden seguir **viendo** la conversación (lectura), pero el backend rechaza sus intentos de escribir con `403 AUTHORIZATION_ERROR`.

**Frontend**: la bandeja (`OperationalInbox.tsx`) muestra una etiqueta "Asignado a ti" / nombre del agente en el encabezado del chat, deshabilita el compositor de respuesta con un aviso claro para quien no es el dueño del caso, y oculta las acciones de `CasePanel` para agentes sin permiso de escritura.

Archivos clave: `src/core/modules/escalation/application/services/auto-assign-agent.service.ts`, cambios en `escalation.service.ts`, `case.repository.port.ts` (`countActiveCasesByAgent`), `reply-as-human.use-case.ts`, `complete-case.use-case.ts`. Tests: `test/escalation/services/auto-assign-agent.service.test.ts`, `test/escalation/auto-assign-on-escalate.test.ts`, `test/conversations/reply-as-human-authorization.test.ts`, `test/cases/use-cases/complete-case-authorization.test.ts`.

**Estado**: resuelto.

## 3. (Opcional, no bloqueante) Endpoint agregado de carga por departamento

**Problema**: `/asignaciones` calcula la carga por agente agregando `GET /api/conversations` + `GET /api/cases/:id` en el cliente, lo que no escala bien con mucho volumen.

**Propuesta**: `GET /api/departments/:id/workload` → `{ agentId, activeCases, waitingUser }[]`.

**Estado**: pendiente — mejora de rendimiento, no requisito funcional inmediato.

## 4. CORS (resuelto — no es un hueco pendiente, se documenta por trazabilidad)

**Problema detectado**: `isp-customer-service-api` no tenía ningún middleware CORS. Los endpoints funcionaban perfecto por `curl`/Postman (CORS es una restricción exclusiva del navegador), pero **todas** las llamadas desde el frontend real fallaban silenciosamente en el navegador — sin ningún error visible más allá de listas vacías ("no hay agentes activos" con agentes reales en la base de datos).

**Solución aplicada** (directamente en el backend, dado que bloqueaba cualquier prueba real del frontend): `src/shared/http/middlewares/cors.middleware.ts` + variable `CORS_ALLOWED_ORIGINS` en `src/shared/config/env.ts`. En `NODE_ENV=development` con la variable vacía, refleja cualquier `Origin` (conveniente porque el puerto de Vite cambia seguido); en producción exige una lista explícita.

**Estado**: resuelto en esta sesión — no requiere seguimiento, pero queda documentado porque el hueco no estaba contemplado en el contrato original (`03_API_CONTRACT.md` no menciona CORS) y cualquier frontend nuevo que se conecte a este backend en otro origin necesita esto configurado.

## 5. Nombre de perfil de WhatsApp — resuelto; foto de perfil — limitación permanente de Meta (no un hueco)

**Contexto**: se preguntó si el backend podía devolver "el nombre o nick del usuario en WhatsApp, y la imagen que tiene". Investigado a fondo antes de implementar, porque son dos casos muy distintos:

- **Nombre de perfil — SÍ está disponible, y ya se implementó**: cada webhook entrante de WhatsApp Cloud API trae `entry[].changes[].value.contacts[].profile.name` — el nombre que la persona configuró en su WhatsApp, sin ninguna llamada extra a la API de Meta. Se captura en `parse-whatsapp-webhook.ts` (ACL), se persiste en `conversation.wa_profile_name` (migración `0010_conversation_wa_profile_name.sql`) y se expone como `ConversationDto.waProfileName`. Es un dato **distinto** de `customer.full_name` (ese es el nombre validado por cédula tras `VALIDATE_CLIENT`) — nunca se mezclan.
- **Foto de perfil — NO es posible, y no es un hueco que se pueda cerrar más adelante**: Meta no expone ningún endpoint en la API oficial de WhatsApp Business (Cloud API) para obtener la foto de perfil de un cliente — es una restricción de privacidad que aplica a **cualquier** negocio con esta API, confirmado en la documentación oficial de Meta y en reportes de otros proveedores (Chatwoot, respond.io) que tienen el mismo pedido abierto desde 2022 sin solución. La única forma de conseguirla es con librerías no oficiales que simulan WhatsApp Web (ej. Baileys/whapi.cloud) — desaconsejado para un negocio real porque Meta puede banear el número por usar un cliente no autorizado. **No se implementa por esta razón**, no por falta de tiempo.

**Frontend**: la bandeja, el dashboard y el tablero de asignación ya muestran el nombre real (`conversationDisplayName()`) en vez del teléfono crudo, con el teléfono como referencia secundaria; el avatar muestra las iniciales del nombre real cuando ya se conoce (nunca una foto/silueta genérica disfrazada de "foto de perfil").

**Estado**: nombre — resuelto. Foto — cerrado permanentemente, documentado para no volver a investigarlo.

## 6. Chat interno staff persistente — pendiente (etapa futura)

**Problema**: `/chat-interno` persiste solo en `localStorage` del navegador. No sincroniza entre dispositivos, no audita en servidor y no sirve como canal formal de coaching entre supervisor y agente.

**Contexto de producto**: el panel de calidad (`07_QUALITY_SUPERVISION.md`) usa coaching híbrido MVP — notas estructuradas en API (`quality_coaching_note`) + deep-link al chat local. El chat persistente queda explícitamente **fuera** del MVP de calidad (backend Etapa 10 / front Etapa 9).

**Propuesta (cuando se priorice)**: tablas `internal_thread` / `internal_message`, REST + realtime, deep-link desde `/calidad` abriendo hilo real con contexto `qualityReviewId`. Normativo backend: `07_QUALITY_SUPERVISION.md` §8.

**Estado**: pendiente — no bloquea Etapa 9 del frontend ni Etapa 10 del backend de calidad.

## 7. Endpoints de supervisión de calidad — contrato documentado (implementar en backend Etapa 10)

**Problema**: el frontend Etapa 9 necesita `/api/quality/*` (agents ranking, reviews, notes). Hasta que el backend complete su Etapa 10, la UI debe mostrar empty state honesto.

**Contrato**: ver backend `docs/spec/03_API_CONTRACT.md` §C y `07_QUALITY_SUPERVISION.md`.

**Estado**: pendiente de implementación en backend; specs ya alineados en ambos repos.

## 8. Registro de cambios

| Fecha      | Hueco agregado                                                                                                                  | Motivo                                                                                                                                                |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-11 | CRUD de agentes, algoritmo de auto-asignación, endpoint de carga agregada                                                       | Detectados al diseñar el frontend real sobre `isp-customer-service-api`                                                                               |
| 2026-08-11 | CORS ausente en el backend (§4) — **resuelto**, no pendiente                                                                    | Detectado al probar el login real desde el navegador; sin esto el frontend no puede operar en absoluto                                                |
| 2026-08-11 | CRUD de agentes (§1) — **resuelto**                                                                                             | Implementado en sesión dedicada de backend, siguiendo el mismo patrón hexagonal que el catálogo n8n                                                   |
| 2026-08-11 | Login con credenciales reales (§1.b) — **resuelto**: cookie httpOnly + Redis + argon2, hardening completo de todos los routers  | Cierra el hueco de seguridad de fondo (cualquiera podía declararse cualquier agente por header)                                                       |
| 2026-08-11 | Algoritmo de auto-asignación por departamento (§2) — **resuelto**, incluye cierre del hueco de "solo lectura" en reply/complete | Repartir automáticamente los casos escalados entre agentes disponibles, con posibilidad de reasignación manual siempre                                |
| 2026-08-11 | Nombre de perfil de WhatsApp (§5) — **resuelto**; foto de perfil — limitación permanente de Meta, no implementable              | Evitar mostrar solo el teléfono crudo en la bandeja; investigado a fondo antes de implementar para no prometer algo que la API de WhatsApp no permite |
| 2026-08-12 | Chat interno persistente (§6) + endpoints quality (§7)                                                                          | Requisito de supervisión de calidad / coaching; MVP usa notes API + chat local                                                                        |
| 2026-08-20 | CRUD de departamentos (§9)                                                                                                      | Requisito de administración para gestionar áreas dinámicamente desde el frontend                                                                      |

## 9. CRUD de departamentos (`POST` / `PUT` / `DELETE /api/departments`) — pendiente

**Problema**: El frontend ahora cuenta con la interfaz (`/departamentos`) para gestionar la creación, edición y desactivación de departamentos. Sin embargo, el backend actualmente solo expone `GET /api/departments`.

**Solución requerida en backend**:
Implementar los siguientes endpoints exigiendo `role=admin`:

```http
POST /api/departments
{ "name": "Soporte Técnico", "slug": "soporte-tecnico", "visibility": "shared" | "restricted" }
→ 201 { "data": DepartmentDto }

PUT /api/departments/:id
{ "name"?, "slug"?, "visibility"?, "active"? }
→ 200 { "data": DepartmentDto }

DELETE /api/departments/:id
→ 200 { "data": DepartmentDto } (Soft delete: active = false)
```

**Consideraciones**:

- `slug` debe ser único.
- El rol `admin` es el único autorizado para efectuar estas mutaciones.
- Se debe validar que no rompa integraciones existentes al desactivar un departamento (ej. casos huérfanos o agentes sin departamento).
