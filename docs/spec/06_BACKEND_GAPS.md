# 06_BACKEND_GAPS.md

Huecos detectados en `isp-customer-service-api` durante la construcción del frontend. Se documentan aquí para que se implementen en una sesión dedicada al backend — **no se implementan como parte de este trabajo de frontend**, pero tampoco se descartan: son requisitos reales del negocio (ISP con agentes por departamento) que el backend actual no cubre todavía.

## 1. CRUD de agentes (`POST` / `PUT` / `DELETE /api/agents`)

**Problema**: hoy solo existe `GET /api/agents` (lista). No hay forma de crear, editar o desactivar un agente vía API — solo por seed/migración (`scripts/seed.ts`, `AgentRepositoryPg`).

**Impacto en frontend**: la pantalla `/usuarios` conserva su formulario de crear/editar (ver `02_MODULES.md`), pero queda deshabilitado con aviso "pendiente de backend" — no persiste nada hasta que este hueco se cierre.

**Contrato propuesto** (a validar con el equipo de backend antes de implementar):

```http
POST /api/agents
{ "name": "...", "email": "...", "role": "agent" | "manager" | "admin", "primaryDepartmentId": "uuid" }
→ 201 { "data": AgentDto }

PUT /api/agents/:id
{ "name"?, "email"?, "role"?, "primaryDepartmentId"?, "active"? }
→ 200 { "data": AgentDto }

DELETE /api/agents/:id   (o PUT .../deactivate)
→ 204
```

Reglas de negocio sugeridas (coherentes con `01_DATA_MODEL.md` §7 del backend):
- Email único (case-insensitive).
- No permitir desactivar al único `role=admin` activo.
- Requiere `x-agent-id` de un actor `role=admin` (autogestión de agentes es responsabilidad de administración, igual que el catálogo n8n).
- Toda escritura debe quedar en `audit_event` (igual que el resto de acciones del backend).

**Estado**: pendiente — no implementado.

## 2. Algoritmo de asignación automática de casos por departamento

**Problema**: hoy la asignación es 100% manual (`claim`/`assign`/`reassign`, `03_API_CONTRACT.md` §C.2 del backend). El negocio necesita repartir automáticamente los casos escalados entre los agentes humanos disponibles de cada departamento, sin descartar la posibilidad de que un jefe de área o un agente humano reasigne manualmente después (ese flujo manual ya existe y se mantiene sin cambios).

**Diseño propuesto** (punto de partida para la sesión de backend, no vinculante):

1. **Disparador**: al crearse una `Escalation` (`CASE_ESCALATED`) con `departmentId` resuelto (no aplica al pool de triage, que sigue requiriendo clasificación humana por `manager`/`admin`, `02_STATE_MACHINE.md` §10 del backend).
2. **Selección de agente**: entre los agentes `active=true` con `primaryDepartmentId = departmentId` (o `agent_membership` si `visibility=restricted`):
   - Excluir agentes con carga activa por encima de un umbral configurable (`maxActiveCases` por agente, configuración de negocio).
   - De los elegibles, elegir el de **menor carga activa** (`status IN (HUMAN_ACTIVE)` asignados a él); desempate por antigüedad de última asignación (round-robin simple).
3. **Efecto**: equivalente a `POST /api/cases/:id/assign { agentUserId }` pero disparado por el sistema, no por un humano — debe registrar `changedBy = null` (sistema) en `audit_event`, igual que `automation_state.changed_by` nulo cuando el cambio lo hace el sistema (`01_DATA_MODEL.md` §2 del backend).
4. **Reasignación manual sigue disponible siempre**: un `manager`/`admin` (o el propio agente asignado, según la acción) puede reasignar con `POST /api/cases/:id/reassign` en cualquier momento — el algoritmo automático es el asignador **inicial**, no un candado.
5. **Notificación**: reutilizar el evento `HUMAN_ASSIGNED` ya existente en el catálogo SSE (`03_API_CONTRACT.md` §C.3 del backend) — el frontend ya está preparado para reaccionar a este evento sin cambios adicionales (`03_REALTIME_NOTIFICATIONS.md`).
6. **Endpoint opcional** si se prefiere disparo manual/on-demand en vez de automático puro: `POST /api/departments/:id/auto-assign` (dispara una pasada del algoritmo sobre las escalaciones `PENDING` de ese departamento).

**Estado**: pendiente — no implementado. El frontend consume hoy solo las acciones manuales (`04_ASSIGNMENT_MANAGEMENT.md`).

## 3. (Opcional, no bloqueante) Endpoint agregado de carga por departamento

**Problema**: `/asignaciones` calcula la carga por agente agregando `GET /api/conversations` + `GET /api/cases/:id` en el cliente, lo que no escala bien con mucho volumen.

**Propuesta**: `GET /api/departments/:id/workload` → `{ agentId, activeCases, waitingUser }[]`.

**Estado**: pendiente — mejora de rendimiento, no requisito funcional inmediato.

## 4. CORS (resuelto — no es un hueco pendiente, se documenta por trazabilidad)

**Problema detectado**: `isp-customer-service-api` no tenía ningún middleware CORS. Los endpoints funcionaban perfecto por `curl`/Postman (CORS es una restricción exclusiva del navegador), pero **todas** las llamadas desde el frontend real fallaban silenciosamente en el navegador — sin ningún error visible más allá de listas vacías ("no hay agentes activos" con agentes reales en la base de datos).

**Solución aplicada** (directamente en el backend, dado que bloqueaba cualquier prueba real del frontend): `src/shared/http/middlewares/cors.middleware.ts` + variable `CORS_ALLOWED_ORIGINS` en `src/shared/config/env.ts`. En `NODE_ENV=development` con la variable vacía, refleja cualquier `Origin` (conveniente porque el puerto de Vite cambia seguido); en producción exige una lista explícita.

**Estado**: resuelto en esta sesión — no requiere seguimiento, pero queda documentado porque el hueco no estaba contemplado en el contrato original (`03_API_CONTRACT.md` no menciona CORS) y cualquier frontend nuevo que se conecte a este backend en otro origin necesita esto configurado.

## 5. Registro de cambios

| Fecha | Hueco agregado | Motivo |
|---|---|---|
| 2026-08-11 | CRUD de agentes, algoritmo de auto-asignación, endpoint de carga agregada | Detectados al diseñar el frontend real sobre `isp-customer-service-api` |
| 2026-08-11 | CORS ausente en el backend (§4) — **resuelto**, no pendiente | Detectado al probar el login real desde el navegador; sin esto el frontend no puede operar en absoluto |
