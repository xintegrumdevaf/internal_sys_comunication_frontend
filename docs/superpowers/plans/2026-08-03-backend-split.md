# Backend Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Separar el Express de `backend/` al repo `internal_sys_comunication_backend` (historial vía subtree), eliminar rutas API TanStack del frontend, y hacer que la UI consuma el REST remoto con `VITE_API_BASE_URL`, con ngrok apuntando al backend.

**Architecture:** Extraer historial de `backend/` con `git subtree split`, publicarlo en el repo backend vacío, independizar dependencias/env/README/ngrok allí. En el frontend, reemplazar `createServerFn`+contenedor local por un cliente HTTP con la misma superficie de llamada (`listConversationsFn({ data })`), borrar rutas `/api/*` y el core de negocio local (dejar solo seeds de auth UI), y resolver `mediaUrl` relativas contra la base del API.

**Tech Stack:** Express + tsx (backend), Vite/TanStack Start (frontend), ngrok, `VITE_API_BASE_URL`, `APP_PUBLIC_URL`.

## Global Constraints

- Historial: `git subtree split -P backend` (no copia limpia).
- Frontend → backend: solo `VITE_API_BASE_URL` (URLs absolutas; sin proxy Vite).
- Rutas TanStack `/api/*`: eliminar; todo `/api/*` vive en Express.
- Puertos: backend `3000`, frontend `8080`, `CORS_ORIGIN=http://localhost:8080`.
- ngrok: `ngrok http 3000`; `APP_PUBLIC_URL` = URL pública del túnel.
- Secretos WhatsApp/n8n solo en backend.
- Fuente de verdad: contenedor en memoria del Express.
- Spec: `docs/superpowers/specs/2026-08-03-backend-split-design.md`.

## File map

| Path | Responsibility |
|------|----------------|
| Backend repo root (`internal_sys_comunication_backend/`) | Express app migrada (contenido actual de `backend/`) |
| Backend `package.json` | Sin `file:..`; scripts `dev`/`build`/`start` |
| Backend `.env.example` + `README.md` | PORT, CORS, APP_PUBLIC_URL, WhatsApp, n8n, ngrok |
| Frontend `src/lib/api-base.ts` | `getApiBaseUrl()`, `resolveApiUrl(path)` |
| Frontend `src/lib/api-client.ts` | `apiGet` / `apiPost` genéricos |
| Frontend `src/adapters/http/dto.ts` | Solo tipos DTO (sin mappers de dominio) |
| Frontend `src/adapters/http/server-fns.ts` | Wrappers HTTP con misma API de llamada |
| Frontend `src/lib/auth-seed.ts` | SEED_USERS / SEED_DEPARTMENTS para login mock |
| Frontend `src/lib/ops-types.ts` | Tipos `PaymentCase` / `WorkOrder` para UI |
| Eliminar | `backend/`, `src/routes/api/**`, core/adapters de negocio no usados por auth |

---

### Task 1: Extraer historial con subtree y poblar el repo backend

**Files:**
- Modify: repo `C:\Users\Usuario\Documents\xGO\Sistem_comunication\internal_sys_comunication_backend` (git history)
- Create: branch temporal `backend-split` en el frontend

**Interfaces:**
- Consumes: carpeta `backend/` versionada en `internal_sys_comunication_frontend`
- Produces: `origin/main` del backend con el árbol de `backend/` en la raíz del repo

- [ ] **Step 1: Crear la rama split en el frontend**

Desde `internal_sys_comunication_frontend` (PowerShell):

```powershell
cd "C:\Users\Usuario\Documents\xGO\Sistem_comunication\internal_sys_comunication_frontend"
git subtree split -P backend -b backend-split
```

Expected: crea rama `backend-split` con commits cuyo root es el contenido de `backend/`.

- [ ] **Step 2: Verificar que la rama split tiene `package.json` en la raíz**

```powershell
git show backend-split:package.json | Select-Object -First 15
```

Expected: JSON con `"name": "internal_system_backend"` y script `"dev": "tsx watch src/index.ts"`.

- [ ] **Step 3: Incorporar el historial en el repo backend vacío**

```powershell
cd "C:\Users\Usuario\Documents\xGO\Sistem_comunication\internal_sys_comunication_backend"
git checkout -b main
git pull "C:\Users\Usuario\Documents\xGO\Sistem_comunication\internal_sys_comunication_frontend" backend-split --allow-unrelated-histories
```

Si `main` aún no tiene commits, alternativa equivalente:

```powershell
git fetch "C:\Users\Usuario\Documents\xGO\Sistem_comunication\internal_sys_comunication_frontend" backend-split
git checkout -b main FETCH_HEAD
```

Expected: working tree con `src/`, `package.json`, `.env.example`, `tsconfig.json` en la raíz.

- [ ] **Step 4: Push al remoto backend**

```powershell
git push -u origin main
```

Expected: `https://github.com/xintegrumdevaf/internal_sys_comunication_backend.git` tiene `main` con el código.

- [ ] **Step 5: Commit de tracking en frontend (opcional nota local)**

No borrar `backend/` todavía (Task 6). Borrar solo la rama temporal cuando el push haya sido verificado:

```powershell
cd "C:\Users\Usuario\Documents\xGO\Sistem_comunication\internal_sys_comunication_frontend"
git branch -D backend-split
```

No requiere commit en el frontend en esta task.

---

### Task 2: Independizar el backend (deps, env, README, health)

**Files:**
- Modify: `internal_sys_comunication_backend/package.json`
- Modify: `internal_sys_comunication_backend/.env.example`
- Create: `internal_sys_comunication_backend/README.md`
- Create: `internal_sys_comunication_backend/.gitignore` (si falta: `node_modules`, `dist`, `.env`)

**Interfaces:**
- Consumes: código Express ya en la raíz del repo backend
- Produces: backend instalable sin el frontend; `.env.example` con CORS/ngrok correctos

- [ ] **Step 1: Quitar dependencia fantasma del frontend**

En `package.json` del backend, eliminar por completo:

```json
"tanstack_start_ts": "file:.."
```

Dejar dependencies:

```json
{
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.4.7",
    "express": "^4.21.2",
    "zod": "^3.24.2"
  }
}
```

- [ ] **Step 2: Actualizar `.env.example`**

Reemplazar el contenido por:

```env
PORT=3000
CORS_ORIGIN=http://localhost:8080

# Public base URL (ngrok / prod). Used for hub_media_url sent to n8n.
# Example: https://scalping-snagged-scabbed.ngrok-free.dev
APP_PUBLIC_URL=

# Meta WhatsApp Cloud API
WHATSAPP_ACCESS_TOKEN=your_access_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
WHATSAPP_VERIFY_TOKEN=netops_verify_change_me
WHATSAPP_APP_SECRET=your_app_secret_here
WHATSAPP_GRAPH_VERSION=v25.0
WHATSAPP_DEFAULT_DEPARTMENT_SLUG=soporte

# n8n Outbound Integration
N8N_INBOUND_WEBHOOK_URL=https://your-n8n-instance.com/webhook/example
N8N_WEBHOOK_MAX_ATTEMPTS=3
N8N_WEBHOOK_TIMEOUT_MS=8000
```

- [ ] **Step 3: Crear README con ngrok**

Crear `README.md`:

```markdown
# internal_sys_comunication_backend

API Express para webhooks WhatsApp/n8n, media proxy y REST de la bandeja.

## Dev

```bash
cp .env.example .env
# completar secretos + APP_PUBLIC_URL
npm install
npm run dev
```

Health: `http://localhost:3000/health`

## ngrok (Meta / n8n)

```bash
ngrok http 3000
```

Pon la URL HTTPS de ngrok en `APP_PUBLIC_URL` y en Meta:

- Callback: `{APP_PUBLIC_URL}/api/webhooks/whatsapp`
- Verify token: mismo valor que `WHATSAPP_VERIFY_TOKEN`

Otros endpoints:

- `POST {APP_PUBLIC_URL}/api/webhooks/n8n/reply`
- `POST {APP_PUBLIC_URL}/api/webhooks/n8n/inbound`
- `GET  {APP_PUBLIC_URL}/api/media/:messageId`

CORS del frontend local: `CORS_ORIGIN=http://localhost:8080`.
```

- [ ] **Step 4: Asegurar `.gitignore`**

Si no existe, crear:

```gitignore
node_modules/
dist/
.env
*.log
```

- [ ] **Step 5: Instalar y verificar health**

```powershell
cd "C:\Users\Usuario\Documents\xGO\Sistem_comunication\internal_sys_comunication_backend"
npm install
npm run dev
```

En otra terminal:

```powershell
Invoke-RestMethod http://localhost:3000/health
```

Expected: `status` = `ok`, `service` = `internal-system-backend`.

- [ ] **Step 6: Commit y push en el repo backend**

```powershell
git add package.json package-lock.json .env.example README.md .gitignore
git commit -m "Independiza el backend del monorepo frontend y documenta ngrok."
git push
```

Detener el proceso `npm run dev` cuando termines la verificación (o dejarlo si vas a Task 7).

---

### Task 3: Cliente HTTP base en el frontend (`api-base` + `api-client`)

**Files:**
- Create: `src/lib/api-base.ts`
- Create: `src/lib/api-client.ts`
- Create: `src/lib/api-base.check.ts` (script de verificación con assert)
- Modify: `.env.example`

**Interfaces:**
- Consumes: `import.meta.env.VITE_API_BASE_URL`
- Produces:
  - `getApiBaseUrl(): string`
  - `resolveApiUrl(path: string): string`
  - `apiGet<T>(path: string, query?: Record<string, string | number | undefined>): Promise<T>`
  - `apiPost<T>(path: string, body?: unknown): Promise<T>`

- [ ] **Step 1: Escribir script de verificación que falle sin implementación**

Crear `src/lib/api-base.check.ts`:

```ts
import assert from "node:assert/strict";

// Will be imported after implementation; for red phase, inline expected contract:
function expectedResolve(base: string, path: string): string {
  const normalizedBase = base.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

assert.equal(
  expectedResolve("http://localhost:3000", "/api/departments"),
  "http://localhost:3000/api/departments",
);
assert.equal(
  expectedResolve("http://localhost:3000/", "api/media/m1"),
  "http://localhost:3000/api/media/m1",
);
console.log("api-base contract examples ok — implement getApiBaseUrl/resolveApiUrl next");
```

Run:

```powershell
npx tsx src/lib/api-base.check.ts
```

Expected: imprime el mensaje (contrato documentado). Luego implementar funciones reales y actualizar el check para importarlas.

- [ ] **Step 2: Implementar `src/lib/api-base.ts`**

```ts
export function getApiBaseUrl(): string {
  const base = import.meta.env.VITE_API_BASE_URL?.trim();
  if (!base) {
    throw new Error("VITE_API_BASE_URL is not set");
  }
  return base.replace(/\/$/, "");
}

/** Join API base with a path that may be absolute URL, absolute path, or relative. */
export function resolveApiUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${getApiBaseUrl()}${path}`;
}
```

- [ ] **Step 3: Implementar `src/lib/api-client.ts`**

```ts
import { getApiBaseUrl, resolveApiUrl } from "@/lib/api-base";

function buildUrl(path: string, query?: Record<string, string | number | undefined>): string {
  const url = new URL(resolveApiUrl(path));
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  return (await res.json()) as T;
}

export async function apiGet<T>(
  path: string,
  query?: Record<string, string | number | undefined>,
): Promise<T> {
  void getApiBaseUrl(); // fail fast if unset
  const res = await fetch(buildUrl(path, query));
  return parseJson<T>(res);
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  void getApiBaseUrl();
  const res = await fetch(resolveApiUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return parseJson<T>(res);
}
```

- [ ] **Step 4: Actualizar el check para importar implementación**

Reemplazar `src/lib/api-base.check.ts` por:

```ts
import assert from "node:assert/strict";

// Node/tsx no tiene import.meta.env de Vite: stub mínimo
(import.meta as ImportMeta & { env: Record<string, string> }).env = {
  VITE_API_BASE_URL: "http://localhost:3000/",
};

const { getApiBaseUrl, resolveApiUrl } = await import("./api-base.ts");

assert.equal(getApiBaseUrl(), "http://localhost:3000");
assert.equal(resolveApiUrl("/api/media/m1"), "http://localhost:3000/api/media/m1");
assert.equal(resolveApiUrl("api/departments"), "http://localhost:3000/api/departments");
assert.equal(resolveApiUrl("https://cdn.example/x"), "https://cdn.example/x");
console.log("api-base checks passed");
```

Run:

```powershell
npx tsx src/lib/api-base.check.ts
```

Expected: `api-base checks passed`.

- [ ] **Step 5: Actualizar `.env.example` del frontend**

Reemplazar por:

```env
# Backend Express base URL (no trailing slash required)
VITE_API_BASE_URL=http://localhost:3000
```

Eliminar del example: `WHATSAPP_*`, `APP_PUBLIC_URL`, `N8N_*`.

- [ ] **Step 6: Commit**

```powershell
git add src/lib/api-base.ts src/lib/api-client.ts src/lib/api-base.check.ts .env.example
git commit -m "Añade cliente HTTP base hacia el backend Express."
```

---

### Task 4: Reemplazar `server-fns` por wrappers HTTP (misma superficie)

**Files:**
- Modify: `src/adapters/http/server-fns.ts` (reescribir completo)
- Modify: `src/adapters/http/dto.ts` (dejar solo tipos exportados; quitar `to*Dto` y schemas de webhook si ya no se usan en frontend)
- Create: `src/lib/ops-types.ts`

**Interfaces:**
- Consumes: `apiGet` / `apiPost` de Task 3; endpoints del `api.router.ts` del backend
- Produces: mismas exports usadas por la UI:
  - `listDepartmentsFn()`, `listUsersFn()`
  - `listConversationsFn({ data? })`
  - `listMessagesFn({ data: { conversationId } })`
  - `getConversationContextFn({ data: { conversationId } })`
  - `takeControlFn({ data })`, `transferConversationFn({ data })`
  - `listAuditEventsFn({ data? })`, `getDepartmentBoardFn({ data })`
  - `getDashboardFn({ data: { userId } })`
  - `simulateInboundMessageFn({ data })`
  - `getWhatsAppCloudStatusFn()`, `sendWhatsAppReplyFn({ data })`

Convención de llamada TanStack a preservar: funciones invocables como `fn()` o `fn({ data: {...} })` que retornan `Promise<T>`.

- [ ] **Step 1: Crear tipos operativos mínimos**

Crear `src/lib/ops-types.ts` con los tipos exactos actuales:

```ts
export type PaymentCase = {
  conversationId: string;
  contrato: string;
  cliente: string;
  monto: number;
  fecha: string;
  metodo: string;
  estado: "VALIDADO" | "OCR PENDIENTE" | "RECHAZADO";
};

export type WorkOrder = {
  conversationId: string;
  id: string;
  tipo: string;
  direccion: string;
  tecnico: string;
  ventana: string;
  estado: string;
};
```

- [ ] **Step 2: Slim `dto.ts` a solo tipos**

Dejar en `src/adapters/http/dto.ts` únicamente los `export type` de `ConversationDto`, `MessageDto`, `DepartmentDto`, `UserDto`, `AuditEventDto` (y cualquier otro tipo que importen las pantallas). Eliminar imports de dominio y funciones `to*Dto` / schemas zod de webhooks si ningún archivo del frontend los importa tras Task 5.

- [ ] **Step 3: Reescribir `server-fns.ts` como wrappers HTTP**

Implementación de referencia (mantener nombres de export):

```ts
import { apiGet, apiPost } from "@/lib/api-client";
import type {
  AuditEventDto,
  ConversationDto,
  DepartmentDto,
  MessageDto,
  UserDto,
} from "@/adapters/http/dto";
import type { PaymentCase, WorkOrder } from "@/lib/ops-types";
import { resolveApiUrl } from "@/lib/api-base";

type DataArg<T> = { data: T };
type OptionalDataArg<T> = { data?: T };

function withMediaUrls(messages: MessageDto[]): MessageDto[] {
  return messages.map((m) =>
    m.mediaUrl ? { ...m, mediaUrl: resolveApiUrl(m.mediaUrl) } : m,
  );
}

export async function listDepartmentsFn(): Promise<DepartmentDto[]> {
  return apiGet<DepartmentDto[]>("/api/departments");
}

export async function listUsersFn(): Promise<UserDto[]> {
  return apiGet<UserDto[]>("/api/users");
}

export async function listConversationsFn(
  arg?: OptionalDataArg<{
    departmentId?: string;
    departmentSlug?: string;
    userId?: string;
  }>,
): Promise<ConversationDto[]> {
  return apiGet<ConversationDto[]>("/api/conversations", arg?.data);
}

export async function listMessagesFn(
  arg: DataArg<{ conversationId: string }>,
): Promise<MessageDto[]> {
  const items = await apiGet<MessageDto[]>(
    `/api/conversations/${arg.data.conversationId}/messages`,
  );
  return withMediaUrls(items);
}

export async function getConversationContextFn(
  arg: DataArg<{ conversationId: string }>,
) {
  return apiGet<{
    conversation: ConversationDto;
    department: DepartmentDto | null;
    customer: unknown;
    payment: PaymentCase | null;
    workOrder: WorkOrder | null;
    transferTargets: DepartmentDto[];
  }>(`/api/conversations/${arg.data.conversationId}/context`);
}

export async function takeControlFn(
  arg: DataArg<{ conversationId: string; agentUserId: string }>,
): Promise<ConversationDto> {
  return apiPost<ConversationDto>("/api/conversations/take-control", arg.data);
}

export async function transferConversationFn(
  arg: DataArg<{
    conversationId: string;
    toDepartmentSlug: string;
    requestedByUserId: string;
    reason: string;
  }>,
): Promise<{ conversation: ConversationDto; transferId: string }> {
  return apiPost("/api/conversations/transfer", arg.data);
}

export async function listAuditEventsFn(
  arg?: OptionalDataArg<{ limit?: number }>,
): Promise<AuditEventDto[]> {
  return apiGet<AuditEventDto[]>("/api/audit", { limit: arg?.data?.limit });
}

export async function getDepartmentBoardFn(
  arg: DataArg<{ departmentSlug: string; userId: string }>,
) {
  return apiGet<{
    department: DepartmentDto | null;
    conversations: ConversationDto[];
    payments: PaymentCase[];
    workOrders: WorkOrder[];
    users: UserDto[];
    denied: boolean;
  }>("/api/departments/board", arg.data);
}

export async function getDashboardFn(arg: DataArg<{ userId: string }>) {
  return apiGet("/api/dashboard", arg.data);
}

export async function simulateInboundMessageFn(
  arg: DataArg<{ userId: string; body: string; waPhone?: string }>,
) {
  return apiPost("/api/simulate-inbound", arg.data);
}

export async function getWhatsAppCloudStatusFn() {
  return apiGet<{
    configured: boolean;
    phoneNumberId: string | null;
    graphVersion: string | null;
    defaultDepartmentSlug: string | null;
    webhookPath: string;
    hasAppSecret: boolean;
  }>("/api/whatsapp/status");
}

export async function sendWhatsAppReplyFn(
  arg: DataArg<{ conversationId: string; agentUserId: string; body: string }>,
) {
  const result = await apiPost<{
    conversation: ConversationDto;
    message: MessageDto;
    externalId?: string;
  }>("/api/whatsapp/reply", arg.data);
  return {
    ...result,
    message: withMediaUrls([result.message])[0]!,
  };
}
```

- [ ] **Step 4: Actualizar imports de tipos en rutas UI**

En `src/routes/cartera.tsx` y `src/routes/utga.tsx`, cambiar:

```ts
import type { PaymentCase } from "@/lib/ops-types";
// o WorkOrder
```

en lugar de `@/adapters/persistence/memory/seed-operations`.

- [ ] **Step 5: Verificación con backend arriba**

Con backend en `:3000` y `VITE_API_BASE_URL=http://localhost:3000` en `.env` local:

```powershell
Invoke-RestMethod "http://localhost:3000/api/departments"
```

Expected: array JSON de departamentos seed.

Luego `npm run dev` en frontend y abrir dashboard: no debe haber errores de `getContainer` en consola del server Vite.

- [ ] **Step 6: Commit**

```powershell
git add src/adapters/http/server-fns.ts src/adapters/http/dto.ts src/lib/ops-types.ts src/routes/cartera.tsx src/routes/utga.tsx
git commit -m "Conecta server-fns al REST del backend Express."
```

---

### Task 5: Eliminar rutas API TanStack y regenerar `routeTree`

**Files:**
- Delete: `src/routes/api/webhooks/whatsapp.ts`
- Delete: `src/routes/api/webhooks/n8n.reply.ts`
- Delete: `src/routes/api/webhooks/n8n.inbound.ts`
- Delete: `src/routes/api/media.$messageId.ts`
- Modify: `src/routeTree.gen.ts` (regenerado por el plugin al correr Vite, o a mano si hace falta)
- Modify: `src/routes/whatsapp.tsx` (texto de ayuda si menciona path local del frontend)

**Interfaces:**
- Consumes: webhooks solo en Express
- Produces: frontend sin rutas `/api/*`

- [ ] **Step 1: Borrar los cuatro archivos de ruta API**

```powershell
Remove-Item -Recurse -Force src/routes/api
```

- [ ] **Step 2: Regenerar route tree**

```powershell
npm run dev
```

Dejar arrancar Vite hasta que reescriba `src/routeTree.gen.ts`, luego detener. Verificar que el archivo ya no referencia `/api/webhooks` ni `/api/media`.

Si no regenera solo, editar `src/routeTree.gen.ts` eliminando imports/entradas de esas rutas (mismo patrón que otras rutas restantes).

- [ ] **Step 3: Ajustar copy en `whatsapp.tsx` si apunta al origen del UI**

Cualquier mención de callback debe indicar la URL del backend/ngrok (`APP_PUBLIC_URL` / Express), no `localhost:8080`.

- [ ] **Step 4: Commit**

```powershell
git add -A src/routes src/routeTree.gen.ts
git commit -m "Elimina rutas API TanStack; webhooks solo en Express."
```

---

### Task 6: Quitar `backend/` del frontend y podar core/adapters locales

**Files:**
- Delete: carpeta `backend/` del frontend
- Create: `src/lib/auth-seed.ts` (seeds + tipos mínimos para auth)
- Modify: `src/lib/auth.ts` (importar desde `auth-seed`)
- Delete: todo `src/core/**` excepto lo que `auth-seed` necesite — preferible mover tipos User/Department a `auth-seed` / `src/lib/identity.ts` y borrar `src/core` entero
- Delete: `src/adapters/whatsapp-cloud/**`, `src/adapters/n8n/**`, `src/adapters/persistence/**`, `src/adapters/http/error-mapper.ts` si quedan huérfanos
- Modify: `src/routes/auditoria.tsx` (SEED_DEPARTMENTS desde `auth-seed`)

**Interfaces:**
- Consumes: seeds solo para sesión mock
- Produces: frontend sin contenedor en memoria de negocio

- [ ] **Step 1: Crear `src/lib/identity.ts` con tipos User/Department mínimos**

Copiar desde los domain actuales:

- `User`, `Membership`, `MembershipRole`, `isGlobalAdmin` desde `src/core/modules/identity/domain/user.ts`
- Tipo `Department` + helper `createDepartment` si el seed lo usa, o inlinear objetos Department en el seed sin branded ids:

```ts
export type DepartmentId = string;
export type UserId = string;

export type Department = {
  id: DepartmentId;
  slug: string;
  name: string;
  description: string;
  landingPath: string;
  active: boolean;
};

export type MembershipRole = "agent" | "lead" | "admin";
export type Membership = {
  userId: UserId;
  departmentId: DepartmentId;
  role: MembershipRole;
};
export type User = {
  id: UserId;
  name: string;
  initials: string;
  email: string;
  primaryDepartmentId: DepartmentId;
  memberships: Membership[];
  active: boolean;
};

export function isGlobalAdmin(user: User): boolean {
  return user.memberships.some(
    (m) => m.role === "admin" && m.departmentId === "dept_ti",
  );
}
```

- [ ] **Step 2: Crear `src/lib/auth-seed.ts`**

Mover el contenido de datos de `SEED_DEPARTMENTS` / `SEED_USERS` (valores actuales de `seed.ts`) usando los tipos de `identity.ts`, sin branded casts.

- [ ] **Step 3: Actualizar `auth.ts` y `auditoria.tsx`**

```ts
import { SEED_DEPARTMENTS, SEED_USERS } from "@/lib/auth-seed";
import type { User } from "@/lib/identity";
import { isGlobalAdmin } from "@/lib/identity";
```

- [ ] **Step 4: Borrar código de negocio local y carpeta backend**

```powershell
Remove-Item -Recurse -Force backend
Remove-Item -Recurse -Force src/core
Remove-Item -Recurse -Force src/adapters/whatsapp-cloud
Remove-Item -Recurse -Force src/adapters/n8n
Remove-Item -Recurse -Force src/adapters/persistence
Remove-Item -Force src/adapters/http/error-mapper.ts -ErrorAction SilentlyContinue
```

Mantener `src/adapters/http/dto.ts` y `src/adapters/http/server-fns.ts`.

- [ ] **Step 5: Compilar / lint de humo**

```powershell
npm run build
```

Expected: build OK. Si fallan imports rotos, corregir solo esos imports (no reintroducir core).

- [ ] **Step 6: Commit**

```powershell
git add -A
git commit -m "Elimina backend embebido y core local; auth mock independiente."
```

---

### Task 7: Verificación end-to-end (ngrok + Meta + bandeja)

**Files:**
- Modify: `.env` local frontend (`VITE_API_BASE_URL`)
- Modify: `.env` local backend (`APP_PUBLIC_URL`, secretos, `CORS_ORIGIN`)

**Interfaces:**
- Consumes: Tasks 1–6 completas
- Produces: checklist verde del spec

- [ ] **Step 1: Arrancar backend + ngrok**

```powershell
cd "C:\Users\Usuario\Documents\xGO\Sistem_comunication\internal_sys_comunication_backend"
# .env: PORT=3000, CORS_ORIGIN=http://localhost:8080, APP_PUBLIC_URL=<url ngrok actual>, WHATSAPP_*
npm run dev
```

```powershell
ngrok http 3000
```

Confirmar que Meta sigue en `{APP_PUBLIC_URL}/api/webhooks/whatsapp` (ej. `https://scalping-snagged-scabbed.ngrok-free.dev/api/webhooks/whatsapp`). Si el dominio cambió, actualizar Meta + `APP_PUBLIC_URL`.

- [ ] **Step 2: Verificar challenge / health vía ngrok**

```powershell
Invoke-RestMethod "http://localhost:3000/health"
# challenge Meta (hub.mode=subscribe) — o re-verificar en consola Meta
```

Expected: health ok; Meta verification verde.

- [ ] **Step 3: Arrancar frontend**

```powershell
cd "C:\Users\Usuario\Documents\xGO\Sistem_comunication\internal_sys_comunication_frontend"
# .env: VITE_API_BASE_URL=http://localhost:3000
npm run dev
```

Expected: UI en `http://localhost:8080`.

- [ ] **Step 4: Probar bandeja**

1. Login con usuario seed.
2. Enviar mensaje WhatsApp de prueba al número configurado.
3. Confirmar que la conversación aparece en la bandeja (poll ~2.5s).
4. Abrir un mensaje con media: la URL debe ir a `http://localhost:3000/api/media/...` (o ngrok si se usó en `mediaUrl` absoluto desde backend).

- [ ] **Step 5: Commit final de docs si hubo ajustes**

Si durante la verificación se corrigió el plan/spec o README:

```powershell
git add docs/superpowers
git commit -m "Ajusta docs tras verificación del split backend."
```

Solo si hubo cambios reales.

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| subtree split + push backend | Task 1 |
| Quitar `file:..`, env/CORS/README ngrok | Task 2 |
| `VITE_API_BASE_URL` cliente HTTP | Task 3–4 |
| Eliminar rutas TanStack `/api` | Task 5 |
| Eliminar `backend/` del frontend | Task 6 |
| Fuente de verdad Express; UI vía REST | Task 4 + 6 |
| ngrok → :3000; Meta webhook | Task 2 + 7 |
| Secretos solo backend | Task 2 + 3 (.env.example FE) |
| Checklist verificación | Task 7 |
| mediaUrl relativa → base API | Task 4 `withMediaUrls` |
