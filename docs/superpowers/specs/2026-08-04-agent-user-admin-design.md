# Administración de agentes / usuarios (mock frontend)

Fecha: 2026-08-04  
Estado: aprobado para plan de implementación (mock)

## Problema

Los mensajes llegan a un número central de WhatsApp; la IA enruta los casos. El Admin TI necesita dar de alta agentes por departamento para que cada uno entre al sistema con sus credenciales (email) y vea solo su área. Hoy los usuarios viven en un seed fijo sin pantalla de administración.

## Objetivos

1. Pantalla de administración de agentes solo para **Admin TI**.
2. Crear / editar / activar / desactivar agentes.
3. Asignar departamento(s) y rol (`agent` | `lead`) para controlar a qué área entra cada uno.
4. Login mock por email + contraseña ≥ 6 (sin auth real de servidor).
5. Persistencia mock en `localStorage`.

## Fuera de alcance

- Enrutamiento de casos (lo hace la IA).
- Gestión del número central de WhatsApp.
- Contraseñas reales por usuario / hashing / backend.
- Roles de líder editando usuarios de su depto (solo Admin TI).

## Roles

| Quién | Capacidad |
|---|---|
| Admin TI (`isAdmin`) | CRUD de usuarios en `/usuarios` |
| Resto | Sin acceso a la pantalla; login si están activos |

## UI

### Ruta `/usuarios`

- Visible en menú módulos solo si `session.isAdmin`.
- `canAccessPath`: Admin TI; otros → redirect a landing.

### Lista

Columnas: nombre, email, departamento(s), rol, estado.  
Acciones: Editar, Activar/Desactivar.  
Botón **Nuevo agente**.

### Formulario crear/editar

- Nombre
- Email (único, case-insensitive)
- Departamento principal (de `SEED_DEPARTMENTS` activos) → define `landing`
- Rol en ese departamento: `Agente` | `Líder` (no crear nuevos Admin TI desde el form salvo edición del seed existente)
- Activo (switch)
- Hint: “Login mock: cualquier contraseña de 6+ caracteres”

### Reglas

- No desactivar al Admin TI en sesión (ni al único `isGlobalAdmin` del store).
- Email duplicado → error.
- Usuario `active: false` → login rechazado.
- Iniciales derivadas del nombre al crear/editar.

## Datos

Clave `localStorage`: `netops.users.v1`.

```ts
// Reutiliza User / Membership de identity.ts
type UsersState = { users: User[] };
```

### Store `users-store`

- Seed inicial: copia de `SEED_USERS` si no hay estado guardado.
- `listUsers()`, `getUserById()`, `getUserByEmail()`
- `createUser(input)`, `updateUser(id, patch)`, `setUserActive(id, active)`
- `subscribe` + snapshot para `useSyncExternalStore`
- Validaciones: email único, departamento válido, no desactivar último/único Admin TI

### Auth

- Login y selector de perfiles leen usuarios del store (no `DEMO_USERS` estático derivado solo del seed).
- `toSessionUser` sigue igual.
- `isSupervisorSession`: memberships `lead`/`admin` desde el store (o `isAdmin`).
- Chat interno / nota interna: peers = usuarios activos del store (excl. self).

## Arquitectura frontend

| Unidad | Responsabilidad |
|---|---|
| `users-store` | Persistencia mock + CRUD |
| `use-users-admin` | Estado UI lista/form |
| `UsersAdminPage` / componentes form+tabla | UI Admin TI |
| Ruta `usuarios.tsx` | Guard Admin TI + shell |
| Ajustes `auth.ts` / `login.tsx` / `AppShell` | Fuente dinámica de usuarios |

Departamentos siguen en `SEED_DEPARTMENTS` (sin CRUD de deptos en v1).

## Criterios de aceptación

- [ ] Admin TI ve “Usuarios” y abre `/usuarios`.
- [ ] Agente/lead no Admin TI no accede a `/usuarios`.
- [ ] Crear agente con email + depto + rol; persiste tras reload.
- [ ] Ese email puede hacer login mock (password ≥ 6) y cae en el landing del depto.
- [ ] Usuario inactivo no puede login.
- [ ] No se puede desactivar el Admin TI actual / último admin global.
- [ ] Email duplicado bloqueado.
- [ ] Chat interno lista peers activos del store (incluye agentes nuevos).

## Testing

- Manual: CRUD + login con usuario nuevo + intento inactivo.
- Build TypeScript (`npm run build`).
