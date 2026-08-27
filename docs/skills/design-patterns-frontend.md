# design-patterns-frontend.md

Patrones concretos usados en este frontend, con el archivo real donde viven — no un catálogo genérico de GoF.

## Gateway (Adapter)

`modules/*/infrastructure/*.gateway.ts` — cada uno traduce el contrato REST real de `isp-customer-service-api` a tipos de dominio TypeScript. Si el backend cambiara de forma (`{data}` → `{result}`, por ejemplo), solo `src/shared/http/http-client.ts` (el cliente HTTP compartido) necesita cambiar; los gateways de cada módulo no.

## Custom Hook como Use Case

`modules/*/application/use-*.ts` es el equivalente frontend de un "use case" de arquitectura limpia: recibe intención del usuario (click, submit), orquesta uno o más gateways, actualiza estado de React, y expone una API mínima al componente. Ejemplos: `useOperationalInbox`, `useEscalations`, `useAssignmentBoard`, `useCaseActions`.

## Store con `useSyncExternalStore` (Observer)

Dos estados globales viven fuera de React (para sobrevivir a remounts de ruta y no depender de un provider):

- `modules/realtime/infrastructure/realtime-bus.ts` — conexión SSE única compartida.
- `modules/realtime/application/notifications.state.ts` — notificaciones in-app.

Ambos siguen el mismo patrón: estado module-level + `Set` de listeners + `subscribe`/`snapshot`, consumidos con `useSyncExternalStore`. El chat interno (`src/services/internalChatApi.ts` + `useInternalChat.ts`) se sincroniza directamente con el backend persistente (`/api/internal/*`) y reacciona a los eventos en tiempo real recibidos por el bus SSE (`INTERNAL_MESSAGE_SENT`, `INTERNAL_THREAD_READ`).

## Composition Root

`src/app/shell/AppShell.tsx` es el único lugar que conecta `identity` (sesión) con `realtime` (conexión/notificaciones) y con la navegación. Ningún otro módulo hace ese cruce — evita que, por ejemplo, `escalations` termine importando algo de `realtime` solo para mostrar el estado de conexión.

## Estrategia por `workflowType` (Strategy, sin clases)

`modules/cases/ui/CasePanel.tsx` (`CaseContextBody`) y `modules/cases/domain/case.ts` (`workflowLabel`) implementan Strategy con funciones + `switch`/lookup por `workflowType`, en vez de una jerarquía de clases — más idiomático en React/TS para este caso de uso (no hay estado propio por estrategia, solo mapeo de datos a UI).

## Facade de acciones reutilizable

`useCaseActions` (`modules/cases/application/use-case-actions.ts`) es una fachada sobre 8 llamadas HTTP distintas (`claim/assign/reassign/complete/cancel/transfer/disable/reactivate`), con manejo uniforme de `busy`/`toast`/error. Tres módulos (`conversations`, `escalations`, `assignment`) la consumen sin conocer el detalle HTTP de cada acción.

## Qué NO se usó (y por qué)

- **Redux/Zustand**: el estado global real de este proyecto (sesión, conexión SSE, notificaciones) cabe en 3 stores pequeños con `useSyncExternalStore`; agregar una librería de estado global habría sido complejidad sin beneficio medible (YAGNI).
- **Clases de dominio**: los DTOs son tipos + funciones puras (`caseStatusLabel`, `workflowLabel`), no clases con métodos — TypeScript + funciones alcanza sin la ceremonia de OOP que no aporta nada en un dominio sin comportamiento complejo propio (la lógica de negocio real vive en el backend).
