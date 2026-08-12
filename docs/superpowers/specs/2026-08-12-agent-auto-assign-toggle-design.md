# Asignación automática por agente (toggle en `/usuarios`)

Fecha: 2026-08-12  
Estado: aprobado — plan en `docs/superpowers/plans/2026-08-12-agent-auto-assign-toggle.md`  
Alcance: **solo frontend** (contrato documentado para backend posterior)

## Problema

El backend ya puede auto-asignar chats a agentes elegibles de un departamento. Hoy **todos** los agentes activos con área principal entran al pool; no hay forma desde la UI de incluir u omitir a un agente concreto. El administrador necesita controlar, por agente, si participa o no en esa asignación automática.

## Objetivos

1. En `/usuarios`, listar agentes **agrupados por departamento** (área principal).
2. Por cada agente, un switch **Asignación automática** (on/off).
3. Default **desactivado** (`false`) si el campo no viene del API o al crear.
4. Solo aplica al **departamento principal** del agente (sin multi-departamento).
5. Preparar dominio, gateway y mutación para `autoAssignEnabled`; el algoritmo de pool sigue en el backend (fuera de este repo por ahora).

## Fuera de alcance

- Toggle “Miembro” / membership multi-departamento.
- Cambiar `AutoAssignAgentService` u otros servicios del backend (solo contrato).
- UI nueva en `/asignaciones`.
- CRUD de departamentos.
- Checkbox de auto-asignación dentro del formulario crear/editar (se gestiona solo desde la lista).

## Decisiones confirmadas

| Tema | Decisión |
|---|---|
| Ubicación | `/usuarios` (opción A), con secciones por departamento |
| Controles por fila | Solo **Asignación automática** |
| Ámbito | Solo el `primaryDepartmentId` del agente |
| Default | `false` (opt-in explícito) |
| Backend | Frontend-first; persistencia real cuando el API acepte el campo |

## Contrato API (para el backend)

### Campo en agente

```ts
autoAssignEnabled: boolean; // default false
```

### Lectura

- `GET /api/agents` incluye `autoAssignEnabled` por agente.
- Si el campo falta (API antigua), el frontend trata como `false`.

### Escritura

- `PUT /api/agents/:id` acepta `{ autoAssignEnabled: boolean }` (parcial, como el resto de updates).
- `POST /api/agents` puede omitirlo; el backend debe persistir `false`.

### Reglas de elegibilidad (backend, cuando se implemente)

Un agente entra al pool de auto-asignación de un departamento solo si:

1. `active === true`
2. `autoAssignEnabled === true`
3. `primaryDepartmentId` coincide con el departamento del caso (o membership futura; **no** en este diseño FE)
4. Cumple el resto de reglas actuales (rol, carga máxima, etc.)

## Modelo frontend

Extender `AgentDto`:

```ts
export type AgentDto = {
  id: string;
  name: string;
  email: string;
  role: AgentRole;
  primaryDepartmentId: string | null;
  active: boolean;
  autoAssignEnabled: boolean;
  createdAt: string;
};
```

`UpdateAgentPayload` incluye `autoAssignEnabled?: boolean`.

Normalización al mapear respuestas: `autoAssignEnabled: Boolean(raw.autoAssignEnabled)` (undefined → false).

## UI

### Layout de `/usuarios` (`UsersDirectoryPanel`)

1. Cabecera existente (título, crear agente). Opcional: búsqueda “Buscar agente” filtrando por nombre/email dentro de todas las secciones.
2. Secciones ordenadas por nombre de departamento (solo departamentos que tengan al menos un agente **o** todos los departamentos activos con lista vacía — preferencia: **solo secciones con agentes**, más “Sin área” si aplica).
3. Cada sección: título del departamento + número de agentes.
4. Filas: avatar/iniciales + nombre, correo, acceso (rol), estado, **Asignación automática** (`Switch`), acciones existentes.
5. Sección **Sin área** al final para `primaryDepartmentId == null`.

### Comportamiento del switch

| Condición | Comportamiento |
|---|---|
| Agente activo + tiene área | Editable |
| Agente inactivo | Deshabilitado |
| Sin área principal | Deshabilitado |
| Mutación en curso en esa fila | Deshabilitado hasta respuesta |

Al cambiar:

1. Llamar `updateAgent(id, { autoAssignEnabled })`.
2. Toast éxito: “Asignación automática activada” / “desactivada”.
3. Invalidar query `["agents"]`.
4. Si falla: toast de error y el switch vuelve al valor anterior (sin dejar UI desincronizada).

Crear agente: no enviar el flag (queda `false` por contrato/default).

## Flujo de datos

```
UsersDirectoryPanel
  → useDirectoryUsers / useDepartmentsQuery
  → agrupa por primaryDepartmentId
  → Switch onChange
      → useAgentDirectoryAdmin.updateAgent (o setAutoAssign)
          → agent-directory.gateway.updateAgent
              → PUT /api/agents/:id
          → invalidate ["agents"]
```

Piezas a tocar:

| Archivo | Cambio |
|---|---|
| `src/modules/identity/domain/agent.ts` | Campo `autoAssignEnabled` |
| `src/modules/identity/infrastructure/agent-directory.gateway.ts` | Payload + normalización si aplica |
| `src/modules/identity/application/use-agent-directory-admin.ts` | Mutación / toast específico (opcional helper) |
| `src/modules/identity/ui/UsersDirectoryPanel.tsx` | Secciones + Switch |
| Docs de gaps/API si el repo las mantiene para el backend | Nota del contrato |

Componente UI: `src/components/ui/switch.tsx` (ya existe).

## Errores y degradación

- Backend sin campo en GET → UI muestra off.
- Backend rechaza PUT con el campo → toast + revert; resto del CRUD intacto.
- No hay optimistic write obligatorio; preferible estado pending por fila o revert claro tras error.

## Pruebas mínimas

- Normalización: respuesta sin `autoAssignEnabled` → `false`.
- Agrupación: agentes con/sin `primaryDepartmentId` en secciones correctas.
- Switch deshabilitado si inactivo o sin área.
- (Si hay tests de gateway/admin) update envía `{ autoAssignEnabled: true }`.

## Criterios de éxito

- Admin ve agentes por departamento en `/usuarios`.
- Puede activar/desactivar asignación automática por agente (solo su área).
- Default off; sin área o inactivo no permite activar.
- Código listo para cuando el backend persista y respete el flag.
