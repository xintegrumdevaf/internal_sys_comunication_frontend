# 02_MODULES.md

Mapeo módulo → ruta → endpoints reales, y qué pasa con cada pantalla actual.

## 1. Rutas nuevas/actualizadas

| Ruta | Módulo | Endpoints reales |
|---|---|---|
| `/login` | Selector de perfil | `GET /api/agents` |
| `/` (dashboard) | KPIs del agente | `GET /api/dashboard?userId=` |
| `/bandeja` | Bandeja unificada de conversaciones + panel de caso | `GET /api/conversations`, `GET /api/conversations/:id/messages`, `GET /api/conversations/:id/cases`, `GET /api/conversations/:id/automation`, `POST /api/conversations/:id/reply`, `POST /api/conversations/:id/take-control`, `GET /api/cases/:id[/summary,/timeline]`, acciones de caso (§3 de `04_ASSIGNMENT_MANAGEMENT.md`) |
| `/escalaciones` | Bandeja de escalaciones + pool de triage | `GET /api/escalations?departmentId=&status=`, `?triage=true` |
| `/asignaciones` | Gestión/monitoreo de carga por agente | `GET /api/conversations` + `GET /api/cases/:id` agregados client-side, `POST /api/cases/:id/assign\|reassign` |
| `/auditoria` | Auditoría | `GET /api/audit?limit=` |
| `/flujos` | Catálogo n8n (solo `role=admin`) | `GET/PUT/DELETE /api/admin/n8n-workflows[/:action]` |
| `/usuarios` | Directorio de agentes (lectura real) + formulario deshabilitado | `GET /api/agents`, `GET /api/departments` — crear/editar sin endpoint (ver `06_BACKEND_GAPS.md`) |
| `/chat-interno` | Chat interno 1:1 con menciones (feature local, sin backend) | Sin cambios de fondo — peers = agentes activos reales |

## 2. Qué pasa con cada pantalla actual

Nota: tras la reestructuración hexagonal, la lógica de cada pantalla vive en `src/modules/<feature>/` (ver `docs/FOLDER_STRUCTURE.md`); las rutas de abajo son solo la cáscara delgada que arma `<AppShell>` + el componente `ui/` del módulo.

| Pantalla actual | Acción |
|---|---|
| `src/routes/bandeja.tsx` → `modules/conversations/ui/OperationalInbox.tsx` | **Reescrita** sobre el contrato real + SSE (Etapa 2/3) |
| `src/routes/soporte.tsx`, `cartera.tsx`, `utga.tsx` | **Eliminadas** — dependían de `PaymentCase`/`WorkOrder` (`ops-types.ts`), que no existen en el backend nuevo. Reemplazadas por `/bandeja` filtrada por departamento + `/asignaciones` |
| `src/routes/campanas.tsx` | **Fuera de alcance** de esta entrega (no hay endpoint de campañas masivas en el backend nuevo); placeholder claramente marcado, no se borra la ruta para no romper navegación existente sin decisión explícita |
| `src/routes/index.tsx` → `modules/dashboard/ui/DashboardOverview.tsx` | **Reescrita** sobre `DashboardDto` real (Etapa 6) |
| `src/routes/auditoria.tsx` → `modules/audit/ui/AuditLogView.tsx` | **Adaptada** — el shape es casi idéntico (Etapa 6) |
| `src/routes/flujos.tsx` → `modules/admin-n8n/ui/N8nWorkflowCatalog.tsx` | **Reescrita** contra `/api/admin/n8n-workflows` real (Etapa 6) |
| `src/routes/usuarios.tsx` → `modules/identity/ui/UsersDirectoryPanel.tsx` | **Adaptada**: lectura real de agentes, formulario deshabilitado (Etapa 1) |
| `src/routes/whatsapp.tsx` + `src/components/whatsapp/*` | **Eliminadas** — sin equivalente en el backend nuevo (`/api/whatsapp/status` no existe) |
| `src/routes/chat-interno.tsx` → `modules/internal-chat/ui/InternalChatShell.tsx` | **Se mantiene** (feature local, no depende del backend) |
| `src/routes/login.tsx` | **Adaptada**: quita el password falso, selector de perfil real (Etapa 1) |

## 3. Navegación dinámica por departamento

`AppShell` deja de usar `SEED_DEPARTMENTS`/rutas fijas (`ti`, `soporte`, `cartera`, `traslados`, `administracion`). El bloque "Mi área" se genera desde `GET /api/departments` (seed real: `support`, `billing`, `sales`), enlazando a `/bandeja?departmentId=` filtrado. El pool de triage (`departmentId=null`) se expone como entrada adicional solo para `manager`/`admin`, enlazando a `/escalaciones?triage=true`.

## 4. Roles y accesos

| Regla | Backend | Frontend |
|---|---|---|
| Lectura de depto `shared` | Cualquier agente | `canAccessDepartment` ya no depende de memberships locales — cualquier agente autenticado lee |
| Lectura de depto `restricted` | Solo `agent_membership` | Requiere membership (si el backend expone memberships por agente; si no, se trata como hueco — ver `06_BACKEND_GAPS.md`) |
| Pool de triage | Solo `manager`/`admin` | Oculto para `role=agent` |
| Admin n8n (`/flujos`) | Solo `role=admin` | Oculto para `agent`/`manager` |
| Escribir sobre un caso | `assignedAgentId=self`, sin asignar, o `manager/admin` | Botones de acción deshabilitados según esta regla, nunca solo ocultos (para que el agente entienda por qué no puede actuar) |
