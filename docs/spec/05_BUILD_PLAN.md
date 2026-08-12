# 05_BUILD_PLAN.md

Orden de construcción, una etapa a la vez — no se avanza a la siguiente si la anterior deja el sistema inconsistente (misma disciplina que el backend). Requiere `isp-customer-service-api` corriendo localmente (`docker compose up -d` + `npm run migrate` + `npm run seed` + `npm run dev`) y `VITE_API_BASE_URL` apuntando a esa instancia.

**Prerrequisito de backend (no negociable para probar en navegador):** `isp-customer-service-api` necesita CORS habilitado (`CORS_ALLOWED_ORIGINS` en su `.env`, o dejar vacío en `NODE_ENV=development` para reflejar cualquier origin). Sin esto, `curl`/Postman funcionan perfecto (no aplican CORS) pero el navegador bloquea **todas** las llamadas silenciosamente — se manifiesta como listas vacías sin ningún error visible ("no hay agentes activos" con agentes reales en la base). Este hueco se detectó y se corrigió durante la Etapa 8 (`src/shared/http/middlewares/cors.middleware.ts` en el backend).

Cada etapa lista, además de qué construir, su **criterio de aprobación verificable** (no solo "se ve bien"): comandos exactos que deben pasar. Ver `docs/skills/testing-strategy-frontend.md` para el detalle del runner (Vitest + Testing Library) y los patrones de test usados.

**Criterio de aprobación transversal (aplica a todas las etapas, no se repite en cada una):**

```bash
npm run typecheck   # tsc --noEmit, sin errores
npm test            # vitest run, sin fallos
npm run lint        # sin errores nuevos (el ruido prettier/prettier de fin de línea CRLF es preexistente del entorno Windows, no bloquea)
npm run build       # vite build (client + ssr), sin errores
```

## Etapa 0 — Cliente HTTP y DTOs reales

- `src/shared/http/http-client.ts` + `src/shared/http/api-base.ts`: envelope `{data}`/`{error}`, inyección de `x-agent-id`.
- Un gateway por módulo en `src/modules/<feature>/infrastructure/*.gateway.ts`, cada uno con sus tipos en `domain/`.
- `src/modules/realtime/infrastructure/realtime.gateway.ts` (SSE, `03_REALTIME_NOTIFICATIONS.md` §1).
- Eliminado: `ops-types.ts`, `whatsapp-webhook-url*.ts`, `components/whatsapp/*`, `routes/whatsapp.tsx`, `adapters/http/*` (no existen equivalentes en el backend nuevo).

**Aprobación:**
- Automatizado: `shared/http/api-base.test.ts`, `modules/cases/infrastructure/case.gateway.test.ts`, `modules/conversations/infrastructure/conversation.gateway.test.ts`, `modules/escalations/infrastructure/escalation.gateway.test.ts` (URL/método/headers/body exactos contra el contrato).
- Manual: `GET /api/departments` y `GET /api/agents` responden datos reales desde la UI (verificable en Network tab).

## Etapa 1 — Identidad real

- `modules/identity/domain/{agent,department,session}.ts`, `modules/identity/application/{use-session,access-control}.ts`, `modules/identity/infrastructure/agent-directory.gateway.ts`, `modules/identity/ui/UsersDirectoryPanel.tsx`.
- `routes/login.tsx`, `routes/usuarios.tsx` según `02_MODULES.md` §2 y `00_OVERVIEW.md` §2.
- Navegación por departamento dinámica desde `GET /api/departments` (`02_MODULES.md` §3).

**Aprobación:**
- Automatizado: `modules/identity/domain/session.test.ts` (cálculo de `SessionUser`, landing por rol), `modules/identity/application/access-control.test.ts` (`canAccessPath`/`canAccessDepartment`/`modulesForSession` para los 3 roles), `modules/identity/infrastructure/agent-directory.gateway.test.ts`.
- Manual: el selector de perfil solo ofrece agentes que existen en la base de datos real; `/usuarios` muestra el aviso de pendiente y no persiste nada; un agente sin `role=admin` no ve `/flujos`.

## Etapa 2 — Bandeja de conversaciones + tiempo real

- `modules/conversations/{domain,infrastructure,application,ui}` — `use-operational-inbox.ts` sobre SSE (sin polling) y el contrato real de conversaciones/mensajes.

**Aprobación:**
- Automatizado: `modules/conversations/infrastructure/conversation.gateway.test.ts` (filtros de query, resolución de `mediaUrl`).
- Manual: un mensaje nuevo (probado con un mensaje real vía WhatsApp o simulando el webhook) aparece sin refrescar la página.

## Etapa 3 — Panel de Caso

- `modules/cases/{domain,infrastructure,application,ui}` — `CasePanel` + `CaseSummaryDialog` (`03_REALTIME_NOTIFICATIONS.md` §4) + `use-case-actions.ts` (acción reutilizable, ver `docs/skills/solid-principles-frontend.md` §DIP).

**Aprobación:**
- Automatizado: `modules/cases/domain/case.test.ts` (labels/estado/extracción de cliente), `modules/cases/application/use-case-actions.test.ts` (claim/assign disparan el gateway correcto, `busy`, manejo de error).
- Manual: reclamar/asignar/completar/cancelar/transferir/activar-desactivar automatización funcionan de punta a punta contra el backend real y se reflejan sin recargar.

## Etapa 4 — Escalaciones/Triage + notificaciones

- `modules/escalations/{domain,infrastructure,application,ui}` + `modules/realtime/ui/NotificationBell.tsx` en `app/shell/AppShell.tsx` (`03_REALTIME_NOTIFICATIONS.md` §2-3).

**Aprobación:**
- Automatizado: `modules/escalations/infrastructure/escalation.gateway.test.ts` (mapeo de `triage`/`departmentId`).
- Manual: al escalar un caso, los agentes/managers con visibilidad reciben notificación; al asignar, el agente asignado recibe notificación aunque esté en otra pantalla.

## Etapa 5 — Gestión de asignación

- `modules/assignment/{application,ui}` (`04_ASSIGNMENT_MANAGEMENT.md`), reutiliza `cases/application/use-case-actions.ts`.
- `06_BACKEND_GAPS.md` §2 (algoritmo automático) queda registrado y enlazado desde aquí — no se implementa en este trabajo.

**Aprobación:**
- Automatizado: `modules/assignment/application/use-assignment-board.test.ts` (selección de depto. por defecto, filtrado de agentes, `assignCase`/`reassignCase` delegan con el actor real, un `getCase` fallido no rompe el tablero).
- Manual: un manager ve la carga por agente de su departamento y puede reasignar manualmente (verificado contra el backend real, incluyendo CORS — ver `06_BACKEND_GAPS.md`).

## Etapa 6 — Dashboard, auditoría, admin n8n

- `modules/dashboard/ui/DashboardOverview.tsx`, `modules/audit/ui/AuditLogView.tsx`, `modules/admin-n8n/ui/N8nWorkflowCatalog.tsx` contra endpoints reales.

**Aprobación:**
- Automatizado: `modules/dashboard/infrastructure/dashboard.gateway.test.ts`, `modules/audit/infrastructure/audit.gateway.test.ts`, `modules/admin-n8n/infrastructure/n8n-workflow.gateway.test.ts` (incluye el caso de error 403 sin rol admin).
- Manual: las tres pantallas reflejan datos reales del backend local (verificado con CORS habilitado — sin esto, las tres fallaban silenciosamente en el navegador, ver `06_BACKEND_GAPS.md`).

## Etapa 7 — Limpieza y pulido de mensajería

- Quitar rutas/componentes obsoletos de WhatsApp Cloud (hecho en Etapa 0).
- `modules/internal-chat/*` con la identidad real.
- Pulido UX: estados de envío, indicador de conexión SSE, medios ya soportados.

**Aprobación:**
- Automatizado: `modules/internal-chat/domain/mention-parser.test.ts` (parseo/inserción de menciones, casos límite de `@`).
- Manual: chat interno funciona con agentes reales del directorio; menciones abren el caso correcto en `/bandeja`.

## Etapa 8 — Endurecimiento y reestructuración arquitectónica

- Reestructuración completa de `src/lib`/`src/hooks`/`src/components`/`src/adapters` (estructura plana original) a `src/modules/<feature>/{domain,application,infrastructure,ui}` — ver `docs/FOLDER_STRUCTURE.md` y `docs/skills/frontend-hexagonal-architecture.md`.
- Consolidación de infraestructura compartida en `src/shared/{http,server}`, dejando `src/lib/` reducido a la única excepción real (`utils.ts`, convención de shadcn CLI).
- Configuración del runner de tests (Vitest + Testing Library) y suite inicial cubriendo `domain`/`infrastructure`/`application` de los módulos más críticos/reutilizados (`cases`, `identity`, `internal-chat`, `shared`).
- Eliminación de todo archivo que quedó sin referencias tras la reestructuración (verificado por `tsc --noEmit` + búsqueda de imports rotos).

**Aprobación:** los 4 comandos del criterio transversal (arriba) limpios, más: `git status` sin archivos huérfanos de la estructura anterior; ninguna ruta (`src/routes/*.tsx`) importa directamente desde `src/lib/*` salvo `utils.ts`, ni desde `src/adapters/*` (ya no existe esa carpeta).

## Huecos de backend detectados durante esta construcción

Ver `06_BACKEND_GAPS.md` — se agregan ahí a medida que se detectan, no se dejan sueltos en comentarios de código.

## Desviación documentada: reestructuración hexagonal (Etapa 8)

Las Etapas 0-7 se construyeron inicialmente con una estructura plana (`src/lib`, `src/hooks`, `src/components`, `src/adapters/http`) que funcionaba pero no reflejaba límites de módulo explícitos ni el mismo tratamiento arquitectónico que `isp-customer-service-api` (hexagonal, SOLID, `docs/skills/*`, tests por capa). En la Etapa 8 se migró todo el código de negocio a `src/modules/<feature>/{domain,application,infrastructure,ui}`, se consolidó la infraestructura compartida en `src/shared/`, y se agregó un runner de tests real (antes solo había scripts de verificación manual tipo `*.check.ts`). Motivo: pedido explícito de mantener el mismo nivel de rigor arquitectónico que el backend, con nombres de archivo/carpeta en inglés, principios SOLID/DRY aplicados de forma verificable (tests, no solo declarados en docs), y ningún archivo de la arquitectura anterior sobreviviendo sin justificación documentada.

## Etapa 9 — Supervisión de calidad (`/calidad`)

**Prerrequisito:** backend Etapa 10 (`/api/quality/*`) según `isp-customer-service-api/docs/spec/07_QUALITY_SUPERVISION.md` y `05_BUILD_PLAN.md` Etapa 10. Normativo UI: `docs/spec/07_QUALITY_SUPERVISION.md`.

- Módulo `src/modules/quality/{domain,application,infrastructure,ui}` + ruta `routes/calidad.tsx`.
- Access control: solo `manager`/`admin` en `access-control.ts` / nav.
- Ranking (`GET /api/quality/agents`), lista y detalle de reviews, highlight de `finding.messageId`, coaching notes, mark reviewed, on-demand.
- Deep-link a `/chat-interno?peerId=&qualityReviewId=` (chat sigue local).
- Empty state honesto si el backend aún no expone los endpoints — **sin scores mock**.

**Aprobación:**
- Automatizado: access-control para `/calidad`; gateway quality (URLs/métodos); highlight de finding en detalle; parseo deep-link chat.
- Manual: manager ve solo su alcance (backend); admin ve ranking global; detalle remarca mensajes; CTA chat abre peer correcto.
- Los 4 comandos del criterio transversal limpios.

## Etapa futura (no Etapa 9) — Chat interno staff persistente

Cuando el backend exponga hilos/mensajes staff (documentado en backend `07` §8), migrar `internal-chat` de `localStorage` a API + realtime y enriquecer el deep-link desde calidad. Hasta entonces no inventar endpoints en el frontend.
