# testing-strategy-frontend.md

Estrategia de pruebas para este frontend (aún sin runner de tests configurado — este documento define cómo se haría al agregarlo, siguiendo la misma disciplina que `isp-customer-service-api/docs/skills/testing-strategy.md`).

## 1. Qué probar en cada capa

| Capa | Qué probar | Cómo |
|---|---|---|
| `domain/*.ts` | Funciones puras (`workflowLabel`, `caseStatusLabel`, `clientNameFromCase`, `mention-parser.ts`) | Unit tests puros, sin mocks — son funciones `(input) => output` |
| `infrastructure/*.gateway.ts` | Que la URL/método/headers armados coincidan con el contrato real | Unit test con `fetch` mockeado, o test de integración contra el backend real levantado (preferido para endpoints críticos) |
| `application/use-*.ts` | Orquestación: que la acción correcta dispare el gateway correcto y actualice el estado esperado | `@testing-library/react-hooks` o render de un componente de prueba, con gateways mockeados |
| `ui/*.tsx` | Que se renderice lo esperado dado un estado, y que los callbacks se disparen | `@testing-library/react`, sin red real |

## 2. Prioridad de cobertura (si se agrega en fases)

1. `modules/cases/application/use-case-actions.ts` — es compartido por 3 módulos; un bug aquí se multiplica.
2. `modules/internal-chat/domain/mention-parser.ts` — lógica de parsing con regex, propensa a edge cases (menciones anidadas, texto sin match).
3. `modules/identity/application/access-control.ts` — errores aquí son errores de seguridad/UX (mostrar una pantalla a quien no debería verla).
4. Gateways de `cases`/`conversations`/`escalations` — verificar que los query params opcionales (`departmentId`, `status`, `triage`) se omiten correctamente cuando son `undefined` (evita mandar `?departmentId=undefined` al backend).

## 3. Verificación manual mínima antes de cada PR (mientras no haya CI de tests)

- `npx tsc --noEmit` sin errores.
- `npm run lint` sin errores nuevos (los `prettier/prettier` de fin de línea CRLF son ruido preexistente del entorno Windows, no bloquean).
- `npm run build` sin errores.
- Backend local (`docker compose up -d postgres redis` + `npm run migrate` + `npm run seed` + `npm run dev` en `isp-customer-service-api`) + smoke test manual de: login (selector de perfil), bandeja (mensaje entra por SSE), reclamar un caso, ver resumen de escalación.

## 4. Qué NO testear con esfuerzo desproporcionado

- Componentes de `src/components/ui/` (shadcn) — son terceros, ya probados upstream.
- Estilos/CSS — no hay pruebas visuales automatizadas en este proyecto; los cambios de diseño se revisan manualmente.
