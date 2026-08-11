# testing-strategy-frontend.md

Estrategia y runner de tests de este frontend (misma disciplina que `isp-customer-service-api/docs/skills/testing-strategy.md`: cada etapa del build plan tiene un criterio de aceptación verificable, no solo "se ve bien en el navegador").

## 0. Runner configurado

- **Vitest** (`vitest.config.ts`, entorno `jsdom`) + **@testing-library/react** para hooks/componentes.
- Comandos: `npm test` (una corrida, usado en CI/aceptación de etapa), `npm run test:watch` (desarrollo), `npm run typecheck` (`tsc --noEmit`).
- Convención de nombre: `*.test.ts`/`*.test.tsx` **junto al archivo que prueban** (no en una carpeta `__tests__/` aparte) — así un módulo se mueve o se borra completo sin dejar tests huérfanos en otro lado.

## 1. Qué probar en cada capa (con ejemplos reales de este repo)

| Capa | Qué probar | Ejemplo real |
|---|---|---|
| `domain/*.ts` | Funciones puras: casos límite, no solo el camino feliz | `modules/cases/domain/case.test.ts`, `modules/identity/domain/session.test.ts`, `modules/internal-chat/domain/mention-parser.test.ts` |
| `application/access-control.ts` | Reglas de autorización cliente por rol/visibilidad — errores aquí son bugs de seguridad/UX | `modules/identity/application/access-control.test.ts` |
| `infrastructure/*.gateway.ts` | Que la URL/método/headers/body armados coincidan exactamente con el contrato REST real (con `fetch` mockeado vía `vi.stubGlobal`) | `modules/cases/infrastructure/case.gateway.test.ts`, `modules/conversations/infrastructure/conversation.gateway.test.ts`, `modules/escalations/infrastructure/escalation.gateway.test.ts` |
| `application/use-*.ts` (hooks) | Orquestación: la acción correcta dispara el gateway correcto, actualiza `busy`, notifica éxito/error — con el gateway mockeado vía `vi.mock` | `modules/cases/application/use-case-actions.test.ts` (cubre los 3 módulos que lo reutilizan: conversations, escalations, assignment) |
| `shared/*.ts` | Utilidades puras compartidas | `shared/datetime.test.ts`, `shared/http/api-base.test.ts` |

## 2. Patrón para mockear `fetch` en tests de gateway

```ts
function mockFetchOnce(status: number, body: unknown) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: "",
    text: () => Promise.resolve(body === undefined ? "" : JSON.stringify(body)),
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}
```

`vi.stubEnv("VITE_API_BASE_URL", "http://localhost:3000")` en `beforeEach` + `vi.unstubAllEnvs()`/`vi.unstubAllGlobals()` en `afterEach` — sin esto, `getApiBaseUrl()` lanza (correcto: nunca debe operar sin base configurada).

## 3. Patrón para testear hooks de `application/`

`renderHook` de `@testing-library/react` + `vi.mock("@/modules/.../*.gateway")` + `vi.mock("sonner")` para no depender de un DOM de toast real. Ver `modules/cases/application/use-case-actions.test.ts` como plantilla — cubre: éxito (llama al gateway con los args correctos + notifica), sin sesión (no llama al gateway), fallo del gateway (se convierte en toast de error, nunca una excepción sin manejar), y el flag `busy` durante la operación.

## 4. Criterio de aceptación por etapa (ver `docs/spec/05_BUILD_PLAN.md`)

Cada etapa del build plan se considera "aprobada" cuando, además de la verificación manual:

1. `npm run typecheck` sin errores.
2. `npm test` sin fallos (incluye los tests nuevos que esa etapa debía agregar).
3. `npm run lint` sin errores nuevos (los `prettier/prettier` de fin de línea CRLF son ruido preexistente del entorno Windows — ver nota en `05_BUILD_PLAN.md`).
4. `npm run build` sin errores.

## 5. Prioridad de cobertura futura (si se agrega en fases)

1. Gateways restantes sin test todavía (`identity/agent-directory.gateway.ts`, `admin-n8n/n8n-workflow.gateway.ts`, `dashboard/dashboard.gateway.ts`, `audit/audit.gateway.ts`) — mismo patrón que los ya cubiertos.
2. `modules/escalations/application/use-escalations.ts` y `modules/assignment/application/use-assignment-board.ts` — orquestación más compleja (múltiples gateways combinados).
3. Componentes `ui/` críticos (`CasePanel`, `CaseSummaryDialog`) con `@testing-library/react` render + `screen`/`userEvent` — verificar que el `switch` por `workflowType` renderiza el bloque correcto y que las acciones deshabilitadas realmente no disparan el callback.

## 6. Qué NO testear con esfuerzo desproporcionado

- Componentes de `src/components/ui/` (shadcn) — son terceros, ya probados upstream.
- Estilos/CSS — no hay pruebas visuales automatizadas en este proyecto; los cambios de diseño se revisan manualmente contra `docs/skills/ui-ux-design-principles.md`.
- SSR completo de TanStack Start — se verifica manualmente (`npm run dev` + requests a cada ruta), no vale la pena montar un entorno de test de servidor completo para un proyecto de este tamaño (YAGNI).
