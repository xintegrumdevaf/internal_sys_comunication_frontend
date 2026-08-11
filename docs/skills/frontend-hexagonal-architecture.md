# frontend-hexagonal-architecture.md

Cómo se traduce arquitectura hexagonal (puertos y adaptadores) a una SPA de React/TanStack, y por qué. Complementa `docs/FOLDER_STRUCTURE.md`.

## 1. Principio

El dominio (qué es una `Conversation`, un `Case`, cómo se etiqueta un `workflowType`) **no debe saber** que existe React, TanStack Query, `fetch`, `localStorage` o SSE. Esas son piezas de infraestructura intercambiables. Si mañana el transporte cambia (REST → GraphQL, SSE → WebSocket), el dominio no debería tocarse.

```
domain          → "¿Qué es esto?"                    → tipos + funciones puras, cero I/O
infrastructure  → "¿Cómo lo traigo/guardo?"           → fetch/SSE/localStorage, implementa el contrato que domain/application necesitan
application     → "¿Qué hago con esto en la UI?"      → hooks de React que orquestan domain + infrastructure
ui              → "¿Cómo se ve?"                       → componentes React, reciben datos/callbacks, sin fetch directo
```

## 2. Estructura por módulo (`src/modules/<feature>/`)

```
src/modules/<feature>/
  domain/           tipos (DTOs) + helpers puros (ej. workflowLabel, caseStatusLabel)
  infrastructure/   *.gateway.ts — únicas funciones que llaman fetch/SSE/localStorage
  application/      use-*.ts — hooks de React (estado, efectos, orquestación)
  ui/               componentes .tsx — presentación
```

Regla dura: **un componente de `ui/` nunca importa un `gateway.ts` directamente** — siempre pasa por un hook de `application/`. Esto es lo que permite testear la UI con datos falsos sin tocar la red, y cambiar de gateway sin tocar la UI.

## 3. Módulos de este proyecto y sus límites

| Módulo | Dueño de | Depende de |
|---|---|---|
| `identity` | Sesión, agentes, departamentos, control de acceso | — (módulo base) |
| `conversations` | Conversación, mensajes, hilo de chat | `cases` (para acciones de caso), `identity` |
| `cases` | Caso, contexto tipado por workflow, acciones (claim/assign/...) | `identity` |
| `escalations` | Bandeja de escalaciones/triage | `cases`, `identity` |
| `assignment` | Gestión de carga/reasignación manual | `cases`, `conversations`, `identity` |
| `realtime` | Conexión SSE única + notificaciones in-app | `identity` (solo para saber qué userId conectar) |
| `audit` | Auditoría | `identity` (conteos por depto) |
| `admin-n8n` | Catálogo n8n (solo admin) | `identity` |
| `dashboard` | KPIs del agente (compone otros módulos en la UI) | `conversations`, `audit`, `identity` |
| `internal-chat` | Chat interno 1:1 con menciones (feature local, sin backend) | `identity`, `conversations` (solo para construir targets de mención) |

**Nunca** debe existir un ciclo (ej. `cases` importando algo de `conversations`). Si un módulo "de más abajo" necesita algo de "más arriba", es señal de que el límite está mal puesto — se resuelve subiendo la lógica compartida a un módulo común o a `shared/`, no importando en el sentido incorrecto.

## 4. `shared/` vs `modules/`

`src/lib/` (utils de shadcn, cliente HTTP genérico, bootstrap de servidor) y `src/components/ui/` (shadcn) son **kernel técnico transversal**: no conocen "Conversation" ni "Case", siguen convenciones externas (shadcn CLI espera `@/lib/utils`), y por eso **no se movieron** a `modules/` — moverlos sería reetiquetar carpetas sin ganar aislamiento real, y rompería la convención de shadcn para futuros `npx shadcn add`.

`src/shared/datetime.ts` sí es nuevo: formato de fecha puro, usado por varios módulos (`conversations`, `cases`, `escalations`, `audit`, `internal-chat`) — vive en `shared/` en vez de en un módulo porque ningún módulo de negocio es "dueño" de formatear una fecha (evita que todos dependan de `conversations` solo por `relativeTime`).

## 5. `src/routes/*.tsx` — la única excepción de nombres

TanStack Start usa file-based routing: el nombre del archivo bajo `src/routes/` **es** la URL (`bandeja.tsx` → `/bandeja`). Como las URLs son en español (uso de negocio para agentes ISP LATAM), los archivos de rutas se quedan en español — son la capa de presentación más externa, exigida por el framework, y **siempre delgados**: solo arman el `<AppShell>` y renderizan el componente de `ui/` del módulo correspondiente. Toda la lógica real vive en inglés dentro de `modules/`.

## 6. `app/shell/AppShell.tsx` — composition root de UI

Es la única pieza que conoce **identity** (sesión, navegación) y **realtime** (conexión, notificaciones) al mismo tiempo — el resto de módulos nunca se importan entre sí salvo a través de `application/`. Actúa como el "composition root" del lado de presentación, análogo a `core/composition/container.ts` del backend.
