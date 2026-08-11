# 05_BUILD_PLAN.md

Orden de construcción, una etapa a la vez — no se avanza a la siguiente si la anterior deja el sistema inconsistente (misma disciplina que el backend). Requiere `isp-customer-service-api` corriendo localmente (`docker compose up -d` + `scripts/seed.ts`) y `VITE_API_BASE_URL` apuntando a esa instancia.

## Etapa 0 — Cliente HTTP y DTOs reales

- Reescribir `src/adapters/http/dto.ts` con los DTOs de `01_DATA_MODEL.md`.
- Reescribir `src/adapters/http/server-fns.ts` contra los endpoints reales, desenvolviendo `{ data }` / lanzando en `{ error }`, inyectando `x-agent-id` donde el contrato lo exige.
- Nuevo `src/adapters/http/realtime-client.ts` (`03_REALTIME_NOTIFICATIONS.md` §1).
- Eliminar `src/lib/ops-types.ts`, `src/lib/whatsapp-webhook-url*.ts`, `src/components/whatsapp/*`, `src/routes/whatsapp.tsx`.

**Aceptación**: `npm run build` sin referencias rotas; `GET /api/departments` y `GET /api/agents` responden datos reales desde la UI (verificable en Network tab).

## Etapa 1 — Identidad real

- `src/lib/identity.ts`, `src/lib/auth.ts`, `src/lib/users-store.ts`, `src/routes/usuarios.tsx`, `src/routes/login.tsx` según `02_MODULES.md` §2 y `00_OVERVIEW.md` §2.
- Navegación por departamento dinámica desde `GET /api/departments` (`02_MODULES.md` §3).

**Aceptación**: el selector de perfil solo ofrece agentes que existen en la base de datos real; `/usuarios` muestra el aviso de pendiente y no persiste nada; un agente sin `role=admin` no ve `/flujos`.

## Etapa 2 — Bandeja de conversaciones + tiempo real

- Reescribir `use-operational-inbox.ts` y `OperationalInbox.tsx` sobre SSE (sin polling) y el contrato real de conversaciones/mensajes.

**Aceptación**: un mensaje nuevo (probado con `POST /api/webhooks/whatsapp` simulado o mensaje real) aparece sin refrescar la página.

## Etapa 3 — Panel de Caso

- `CasePanel` + `CaseSummaryDialog` (`03_REALTIME_NOTIFICATIONS.md` §4) + todas las acciones de caso.

**Aceptación**: reclamar/asignar/completar/cancelar/transferir/activar-desactivar automatización funcionan de punta a punta contra el backend real y se reflejan sin recargar.

## Etapa 4 — Escalaciones/Triage + notificaciones

- `/escalaciones` + campana de notificaciones global en `AppShell` (`03_REALTIME_NOTIFICATIONS.md` §2-3).

**Aceptación**: al escalar un caso, los agentes/managers con visibilidad reciben notificación; al asignar, el agente asignado recibe notificación aunque esté en otra pantalla.

## Etapa 5 — Gestión de asignación

- `/asignaciones` (`04_ASSIGNMENT_MANAGEMENT.md`).
- Confirmar que `06_BACKEND_GAPS.md` §2 (algoritmo automático) queda registrado y enlazado desde aquí.

**Aceptación**: un manager ve la carga por agente de su departamento y puede reasignar manualmente.

## Etapa 6 — Dashboard, auditoría, admin n8n

- `index.tsx`, `auditoria.tsx`, `flujos.tsx` contra endpoints reales.

**Aceptación**: las tres pantallas reflejan datos reales del backend local.

## Etapa 7 — Limpieza y pulido de mensajería

- Quitar rutas/componentes obsoletos de WhatsApp Cloud.
- Revisar chat interno con la identidad real.
- Pulido UX: estados de envío, indicador de conexión SSE, medios ya soportados.

## Etapa 8 — Endurecimiento

- `npm run lint` / `npm run build` sin errores.
- Documentar cualquier desviación respecto a este paquete de specs y por qué.
- Un commit por etapa completada.

## Huecos de backend detectados durante esta construcción

Ver `06_BACKEND_GAPS.md` — se agregan ahí a medida que se detectan, no se dejan sueltos en comentarios de código.

## Desviación documentada: reestructuración hexagonal (post Etapa 6)

Las Etapas 0-6 se construyeron inicialmente con una estructura plana (`src/lib`, `src/hooks`, `src/components`, `src/adapters/http`) que funcionaba pero no reflejaba límites de módulo explícitos ni el mismo tratamiento arquitectónico que `isp-customer-service-api` (hexagonal, SOLID, `docs/skills/*`). Se reestructuró todo el código de negocio en `src/modules/<feature>/{domain,application,infrastructure,ui}` (ver `docs/FOLDER_STRUCTURE.md`), dejando en `src/lib`/`src/components/ui` únicamente el kernel técnico transversal (shadcn, cliente HTTP genérico, bootstrap de servidor) que no tiene dueño de negocio. Motivo: pedido explícito de mantener el mismo nivel de rigor arquitectónico que el backend, con nombres de archivo/carpeta en inglés y principios SOLID/DRY aplicados de forma verificable (no solo declarados). Se verificó `tsc --noEmit`, `npm run lint` y `npm run build` limpios después de la reestructuración completa.
