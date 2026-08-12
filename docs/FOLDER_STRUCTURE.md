# FOLDER_STRUCTURE.md

Estructura de `src/` tras la reestructuración hexagonal (ver `docs/skills/frontend-hexagonal-architecture.md` para el razonamiento completo).

```
src/
├── app/
│   └── shell/
│       └── AppShell.tsx           ← composition root de UI (identity + realtime + nav)
│
├── shared/                        ← kernel técnico transversal, sin dueño de negocio
│   ├── datetime.ts                ← relativeTime/messageClock (+ datetime.test.ts)
│   ├── http/
│   │   ├── http-client.ts         ← cliente HTTP genérico ({data}/{error}, x-agent-id)
│   │   └── api-base.ts            ← getApiBaseUrl/resolveApiUrl (+ api-base.test.ts)
│   └── server/
│       ├── error-capture.ts       ← bootstrap SSR (usado por server.ts)
│       └── error-page.ts
│
├── lib/                           ← ÚNICA excepción: convenciones externas de shadcn CLI
│   └── utils.ts                   ← cn(), shadcn siempre genera imports a "@/lib/utils"
│
├── components/
│   └── ui/                        ← shadcn (design system, sin lógica de negocio)
│
├── modules/                       ← todo el negocio, organizado hexagonalmente
│   ├── identity/
│   │   ├── domain/                agent.ts, department.ts, session.ts
│   │   ├── application/           use-session.ts, access-control.ts
│   │   ├── infrastructure/        agent-directory.gateway.ts
│   │   └── ui/                    UsersDirectoryPanel.tsx
│   │
│   ├── conversations/
│   │   ├── domain/                conversation.ts
│   │   ├── application/           use-operational-inbox.ts
│   │   ├── infrastructure/        conversation.gateway.ts
│   │   └── ui/                    OperationalInbox.tsx, MessageMediaBody.tsx
│   │
│   ├── cases/
│   │   ├── domain/                case.ts (CaseContext tipado por workflow)
│   │   ├── application/           use-case-actions.ts (compartido con escalations/assignment)
│   │   ├── infrastructure/        case.gateway.ts
│   │   └── ui/                    CasePanel.tsx, CaseSummaryDialog.tsx
│   │
│   ├── escalations/
│   │   ├── domain/                escalation.ts
│   │   ├── application/           use-escalations.ts
│   │   ├── infrastructure/        escalation.gateway.ts
│   │   └── ui/                    EscalationsBoard.tsx
│   │
│   ├── assignment/
│   │   ├── application/           use-assignment-board.ts
│   │   └── ui/                    AssignmentBoard.tsx
│   │
│   ├── realtime/
│   │   ├── domain/                realtime-event.ts, notification.ts
│   │   ├── application/           use-realtime.ts, notifications.state.ts
│   │   ├── infrastructure/        realtime.gateway.ts (SSE), realtime-bus.ts
│   │   └── ui/                    NotificationBell.tsx
│   │
│   ├── audit/
│   │   ├── domain/                audit-event.ts
│   │   ├── infrastructure/        audit.gateway.ts
│   │   └── ui/                    AuditLogView.tsx
│   │
│   ├── admin-n8n/
│   │   ├── domain/                n8n-workflow.ts
│   │   ├── infrastructure/        n8n-workflow.gateway.ts
│   │   └── ui/                    N8nWorkflowCatalog.tsx
│   │
│   ├── dashboard/
│   │   ├── domain/                dashboard.ts
│   │   ├── infrastructure/        dashboard.gateway.ts
│   │   └── ui/                    DashboardOverview.tsx
│   │
│   ├── quality/                   ← Etapa 9 UI (07_QUALITY_SUPERVISION.md); requiere backend Etapa 10
│   │   ├── domain/                quality-review.ts (DTOs §8 de 01_DATA_MODEL.md)
│   │   ├── application/           use-quality-board.ts, use-quality-review-detail.ts
│   │   ├── infrastructure/        quality.gateway.ts
│   │   └── ui/                    QualityBoard.tsx, QualityReviewDetail.tsx, CordialityBadge.tsx
│   │
│   └── internal-chat/             feature local (sin backend, ver docs/spec/02_MODULES.md); deep-link desde /calidad
│       ├── domain/                internal-chat.ts, mention-parser.ts
│       ├── application/           use-internal-chat.ts, build-mention-targets.ts
│       ├── infrastructure/        internal-chat.store.ts (localStorage)
│       └── ui/                    InternalChatShell.tsx, MentionsPanel.tsx, MentionPicker.tsx,
│                                   MessageBodyWithMentions.tsx, InboxInternalNoteComposer.tsx
│
├── routes/                        ← TanStack Start (file-based routing, URLs en español, siempre delgadas)
│   ├── __root.tsx
│   ├── index.tsx                  → DashboardOverview
│   ├── login.tsx                  → selector de perfil real
│   ├── bandeja.tsx                → OperationalInbox
│   ├── escalaciones.tsx           → EscalationsBoard
│   ├── asignaciones.tsx           → AssignmentBoard
│   ├── calidad.tsx                → QualityBoard / detalle (manager|admin)
│   ├── usuarios.tsx               → UsersDirectoryPanel
│   ├── auditoria.tsx              → AuditLogView
│   ├── flujos.tsx                 → N8nWorkflowCatalog
│   ├── chat-interno.tsx           → InternalChatShell
│   └── campanas.tsx               → fuera de alcance del backend (maqueta desconectada, marcada)
│
├── hooks/
│   └── use-mobile.tsx              ← utilidad de UI genérica (no es de un módulo)
│
├── router.tsx, server.ts, start.ts, styles.css   ← bootstrap de la app (TanStack Start)
└── routeTree.gen.ts                ← autogenerado, no editar
```

## Convención de tests

`*.test.ts`/`*.test.tsx` vive **junto al archivo que prueba**, no en una carpeta `__tests__/` separada (ver `docs/skills/testing-strategy-frontend.md`). Ejemplo real ya presente en el árbol de arriba:

```
src/modules/cases/domain/case.ts
src/modules/cases/domain/case.test.ts
src/modules/cases/infrastructure/case.gateway.ts
src/modules/cases/infrastructure/case.gateway.test.ts
src/modules/cases/application/use-case-actions.ts
src/modules/cases/application/use-case-actions.test.ts
```

Correr con `npm test` (una corrida) o `npm run test:watch` (desarrollo). Configuración en `vitest.config.ts` + `vitest.setup.ts` (raíz del repo, junto a `vite.config.ts`).

## Reglas de import (repetidas de `docs/skills/frontend-hexagonal-architecture.md`, por si solo lees este archivo)

1. `ui/` de un módulo nunca importa un `*.gateway.ts` directo — siempre a través de `application/`.
2. Ningún módulo importa `infrastructure/` de otro módulo — solo `application/` o `domain/` de otro módulo (ej. `escalations` puede usar `cases/domain/case.ts`, pero no `cases/infrastructure/case.gateway.ts` directo si ya existe una función de aplicación equivalente).
3. `src/routes/*.tsx` solo importa `AppShell` + el/los componente(s) `ui/` del módulo — nunca gateways ni hooks de `application/` directamente (si una página necesita orquestar varios módulos, como el dashboard, esa orquestación vive en el componente `ui/` del módulo dueño de la página, no en el archivo de ruta).
