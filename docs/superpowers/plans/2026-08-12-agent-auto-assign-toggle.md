# Asignación automática por agente — Plan de implementación

> **For agentic workers:** implementar task-by-task. Steps usan checkbox (`- [ ]`) para tracking.

**Goal:** En `/usuarios`, agrupar agentes por departamento y permitir activar/desactivar `autoAssignEnabled` por agente (default off), listo para cuando el backend persista el campo.

**Architecture:** Extender `AgentDto` + normalización en gateway; mutación vía `useAgentDirectoryAdmin`; UI en `UsersDirectoryPanel` con secciones por `primaryDepartmentId` y `Switch` de shadcn. Sin cambios al algoritmo de auto-asignación (backend).

**Tech Stack:** React, TanStack Query, shadcn `Switch`, sonner, módulo hexagonal `identity`.

**Spec:** `docs/superpowers/specs/2026-08-12-agent-auto-assign-toggle-design.md`

---

## File map

| Archivo                                                          | Rol                                              |
| ---------------------------------------------------------------- | ------------------------------------------------ |
| `src/modules/identity/domain/agent.ts`                           | Campo `autoAssignEnabled`                        |
| `src/modules/identity/domain/session.ts`                         | Propagar flag en `SessionUser` / `toSessionUser` |
| `src/modules/identity/domain/session.test.ts`                    | Fixtures + test default false                    |
| `src/modules/identity/infrastructure/agent-directory.gateway.ts` | Payload update + `normalizeAgent`                |
| `src/modules/identity/application/use-agent-directory-admin.ts`  | Helper `setAutoAssign` + toast específico        |
| `src/modules/identity/ui/UsersDirectoryPanel.tsx`                | Secciones + Switch + búsqueda opcional           |
| `docs/spec/06_BACKEND_GAPS.md` (si aplica)                       | Nota del contrato FE → BE                        |
| Tests mock de agentes en assignment/cases/escalations            | Añadir `autoAssignEnabled: false` a fixtures     |

---

### Task 1: Dominio — `autoAssignEnabled`

**Files:**

- Modify: `src/modules/identity/domain/agent.ts`
- Modify: `src/modules/identity/domain/session.ts`
- Modify: `src/modules/identity/domain/session.test.ts`

- [ ] **Step 1:** En `AgentDto` añadir `autoAssignEnabled: boolean`.

- [ ] **Step 2:** En `SessionUser` añadir `autoAssignEnabled: boolean` y mapearlo en `toSessionUser` desde `agent.autoAssignEnabled`.

- [ ] **Step 3:** Actualizar `makeAgent` en `session.test.ts` con `autoAssignEnabled: false`. Añadir test: si el agente viene con el flag `true`, `toSessionUser` lo preserva.

- [ ] **Step 4:** Actualizar fixtures de tests que construyen `AgentDto` / session parciales si TypeScript falla (`use-assignment-board.test.ts`, `use-case-actions.test.ts`, `use-escalations.test.ts`, `access-control.test.ts`, etc.) con `autoAssignEnabled: false` donde haga falta el tipo completo.

- [ ] **Step 5:** Commit: `feat(identity): añade autoAssignEnabled al dominio de agentes`

---

### Task 2: Gateway — normalización y payload

**Files:**

- Modify: `src/modules/identity/infrastructure/agent-directory.gateway.ts`
- Create (opcional): `src/modules/identity/infrastructure/agent-directory.gateway.test.ts` si el módulo ya tiene patrón de tests de gateway; si no, cubrir normalización en un test de dominio/helpers junto al gateway.

- [ ] **Step 1:** Extender `UpdateAgentPayload` con `autoAssignEnabled?: boolean`.

- [ ] **Step 2:** Añadir `normalizeAgent(raw: Partial<AgentDto> & { id: string }): AgentDto` (o equivalente) que haga:
  - `autoAssignEnabled: Boolean(raw.autoAssignEnabled)` → `undefined`/`null` → `false`
  - resto de campos tipados como hoy

- [ ] **Step 3:** Aplicar normalización en `listAgents` (map del array), y en respuestas de `createAgent` / `updateAgent` / `deactivateAgent` sobre el `agent` devuelto (sin romper el shape `{ agent, temporaryPassword }`).

- [ ] **Step 4:** Test unitario: input sin `autoAssignEnabled` → `false`; con `true` → `true`.

- [ ] **Step 5:** Commit: `feat(identity): normaliza autoAssignEnabled en el gateway de agentes`

---

### Task 3: Hook admin — `setAutoAssign`

**Files:**

- Modify: `src/modules/identity/application/use-agent-directory-admin.ts`

- [ ] **Step 1:** Añadir `setAutoAssign(agentId: string, enabled: boolean)` que llame a `updateAgent` con `{ autoAssignEnabled: enabled }` y toast:
  - éxito: `Asignación automática activada` / `Asignación automática desactivada`
  - error: mensaje del error (mismo patrón `run`)

- [ ] **Step 2:** Exportar `setAutoAssign` en el return del hook. Mantener `updateAgent` genérico para el formulario (sin incluir el flag en create/edit form).

- [ ] **Step 3:** Commit: `feat(identity): mutación setAutoAssign para el directorio de agentes`

---

### Task 4: UI — secciones por departamento + Switch

**Files:**

- Modify: `src/modules/identity/ui/UsersDirectoryPanel.tsx`
- Use: `src/components/ui/switch.tsx`

- [ ] **Step 1:** Estado local `search` (input “Buscar agente”) y `pendingAutoAssignId: string | null` para deshabilitar el switch de la fila en vuelo.

- [ ] **Step 2:** Derivar lista filtrada por nombre/email (case-insensitive). Agrupar:
  - Por cada departamento (orden alfabético por `name`) que tenga ≥1 agente filtrado con ese `primaryDepartmentId`
  - Bloque final `Sin área` si hay agentes con `primaryDepartmentId == null`
  - No crear secciones vacías

- [ ] **Step 3:** Reemplazar la tabla plana por secciones: encabezado de departamento (nombre + conteo) + tabla por sección. Columnas: Nombre, Correo, Acceso, Estado, **Asignación automática**, Acciones. Quitar columna “Área” (ya está implícita en la sección).

- [ ] **Step 4:** Columna Switch:
  - `checked={u.autoAssignEnabled === true}`
  - `disabled={!u.active || !u.primaryDepartmentId || busy || pendingAutoAssignId === u.id}`
  - `onCheckedChange`: set pending → `setAutoAssign(u.id, checked)` → clear pending (el valor visual vuelve del query invalidate; si falla, queda el valor anterior tras refetch)

- [ ] **Step 5:** Copy de ayuda breve bajo el título: que el switch controla si el agente entra al pool automático de su área (efectivo cuando el backend soporte el campo).

- [ ] **Step 6:** Verificar manualmente en `/usuarios` (admin): secciones, switch off por defecto, deshabilitado sin área / inactivo.

- [ ] **Step 7:** Commit: `feat(usuarios): secciones por departamento y toggle de asignación automática`

---

### Task 5: Documentación de contrato backend

**Files:**

- Modify: `docs/spec/06_BACKEND_GAPS.md` (o sección equivalente de API si es el lugar canónico)
- Modify: `docs/superpowers/specs/2026-08-12-agent-auto-assign-toggle-design.md` → Estado: aprobado / plan listo

- [ ] **Step 1:** Añadir gap o nota: FE envía/lee `autoAssignEnabled`; BE debe persistirlo y filtrar el pool de `AutoAssignAgentService`. Default `false`.

- [ ] **Step 2:** Actualizar estado del design doc.

- [ ] **Step 3:** Commit: `docs: contrato autoAssignEnabled para backend`

---

### Task 6: Verificación final

- [ ] **Step 1:** `npx tsc --noEmit` (o script del repo) sin errores de tipo por el nuevo campo.

- [ ] **Step 2:** Correr tests del módulo identity (y los que tocan fixtures de agentes).

- [ ] **Step 3:** Smoke manual: crear agente → aparece en sección de su área con switch off; activar switch → toast; con backend viejo, error controlado + switch vuelve off tras invalidate/error.

---

## Criterios de done

- [ ] Agentes agrupados por departamento en `/usuarios`
- [ ] Switch Asignación automática por agente (solo área principal)
- [ ] Default off; sin área / inactivo → switch disabled
- [ ] Dominio + gateway + mutación listos para el API
- [ ] Docs de contrato para el trabajo de backend posterior
