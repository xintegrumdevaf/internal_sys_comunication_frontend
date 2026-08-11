# 04_ASSIGNMENT_MANAGEMENT.md

Gestión y monitoreo de la asignación de casos a agentes humanos, construida enteramente sobre los endpoints reales que **ya existen** en el backend (`claim`, `assign`, `reassign`). El algoritmo de asignación **automática** por departamento no existe todavía en el backend — su diseño se deja documentado en `06_BACKEND_GAPS.md`, no se implementa en este trabajo.

## 1. Ruta `/asignaciones`

Visible para `role IN (manager, admin)`. Muestra, por departamento (o el pool de triage si `admin`):

- **Carga por agente**: para cada `AgentDto` con `primaryDepartmentId` = departamento seleccionado (o `agent_membership`, si se expone), cuenta de casos `HUMAN_ACTIVE` con `assignedAgentId = agent.id` — derivado client-side agregando `GET /api/conversations?departmentId=&status=open` + `GET /api/cases/:id` de cada `activeCaseId` (no existe un endpoint agregado en el backend todavía; se documenta como posible mejora en `06_BACKEND_GAPS.md` §3 si el volumen lo justifica).
- **Casos sin dueño** (`assignedAgentId = null`, `status IN (ESCALATED, HUMAN_ACTIVE)`): lista con botón "Asignar" → `POST /api/cases/:id/assign { agentUserId }`.
- **Casos asignados**: botón "Reasignar" → `POST /api/cases/:id/reassign { agentUserId }`.

## 2. Autorización de escritura

`assign`/`reassign` requieren header `x-agent-id` del actor y solo tienen efecto si el actor es `manager`/`admin` del departamento del caso (validado por el backend — el frontend refleja el resultado, nunca decide localmente si está permitido más allá de ocultar el botón para roles obviamente no autorizados).

## 3. Ideas para instrumentar mejor esta pantalla (no bloqueante para esta entrega)

- Si el volumen de conversaciones por departamento crece, el agregado client-side (§1) se vuelve costoso — candidato a pedirle al backend un endpoint `GET /api/departments/:id/workload` en el futuro (anotado también en `06_BACKEND_GAPS.md`).
- Métricas de tiempo de primera respuesta / tiempo de resolución por agente — hoy no hay datos suficientes en `03_API_CONTRACT.md` para calcularlas sin un endpoint nuevo.

## 4. Alcance explícito

Este documento **no** incluye el diseño del algoritmo de auto-asignación (round-robin/menor carga) — eso vive en `06_BACKEND_GAPS.md` §2, como trabajo pendiente de backend. Aquí solo se cubre la gestión **manual** que el backend ya soporta hoy.
