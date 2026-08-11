# solid-principles-frontend.md

SOLID aplicado a componentes/hooks de React, con ejemplos reales de este repo (no genéricos).

## S — Single Responsibility

Cada capa de un módulo tiene una única razón para cambiar:

- `modules/cases/infrastructure/case.gateway.ts` cambia solo si cambia la URL/forma HTTP de `/api/cases/*`.
- `modules/cases/application/use-case-actions.ts` cambia solo si cambia la lógica de negocio de "qué pasa cuando reclamo/asigno/completo un caso" (ej. qué toast mostrar, qué se refresca después).
- `modules/cases/ui/CasePanel.tsx` cambia solo si cambia cómo se ve el panel.

Antipatrón que evitamos: mezclar `fetch` + JSX en el mismo componente (como estaba `OperationalInbox.tsx` antes de esta reestructuración, con `listConversationsFn` llamado directo desde el componente).

## O — Open/Closed

`modules/cases/ui/CasePanel.tsx` renderiza el contexto del caso con un `switch` sobre `workflowType` (`SUPPORT_INTERNET`, `BILLING_BALANCE`, `SALES_PACKAGES`, fallback genérico). Agregar un workflow nuevo del backend (ej. `TECHNICAL_VISIT`) significa **agregar una rama**, no reescribir el componente ni tocar `use-operational-inbox.ts`. El fallback (`JSON.stringify` legible) garantiza que un workflow no contemplado todavía no rompe la UI.

## L — Liskov (aplicado a gateways)

Todo gateway de un módulo (`conversation.gateway.ts`, `case.gateway.ts`, `escalation.gateway.ts`...) expone funciones puras `(args) => Promise<Dto>` sin efectos secundarios de UI (nada de `toast`, nada de `useState`). Esto permite que `application/` los use indistintamente y, en tests, sustituirlos por una función fake con la misma firma sin que el hook que los consume note la diferencia.

## I — Interface Segregation

`useCaseActions(session, onChanged)` (`modules/cases/application/use-case-actions.ts`) expone **solo** las acciones de caso (`claim/assign/reassign/complete/cancel/transfer/automation`) — no expone el estado completo de la bandeja. `use-operational-inbox.ts`, `use-escalations.ts` y `use-assignment-board.ts` lo consumen sin arrastrar nada de conversación/hilo/mensajes que no necesitan. Evita el "hook gigante" que fuerza a todo consumidor a re-renderizar por cambios que no le importan.

## D — Dependency Inversion

`conversations` (módulo de más "alto nivel", orquesta la bandeja) depende de `cases` (más "bajo nivel", dueño del concepto Caso) a través de `useCaseActions` — nunca al revés. `cases` no sabe que `conversations` existe. Esto refleja la misma dirección de dependencia que el backend (`02_STATE_MACHINE.md` del backend: el motor de casos no conoce conversaciones específicas, solo `conversationId`).

## DRY (acompaña a SOLID en este proyecto)

Antes de esta reestructuración, `claim`/`assign`/`reassign` estaban duplicados en tres lugares (bandeja, escalaciones, asignación), cada uno con su propio `try/catch` + `toast`. Ahora viven una sola vez en `use-case-actions.ts` y los tres módulos lo reutilizan — un cambio en el mensaje de error o en qué se refresca después se hace en un solo archivo.
