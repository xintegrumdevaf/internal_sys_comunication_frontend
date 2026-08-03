# Backend split: migración a repo independiente

**Fecha:** 2026-08-03  
**Estado:** aprobado en diseño (pendiente plan de implementación)  
**Repos:** `internal_sys_comunication_frontend`, `internal_sys_comunication_backend`

## Objetivo

Separar el backend Express de la carpeta `backend/` del frontend hacia el repositorio `internal_sys_comunication_backend`, preservando historial git, eliminando las rutas API de TanStack Start del frontend, y dejando al frontend como UI que consume el API remoto vía variable de entorno. Los webhooks de Meta/n8n y la URL pública (ngrok) viven por completo en el backend.

## Decisiones tomadas

| Tema | Decisión |
|------|----------|
| Alcance | Migración completa: mover, eliminar `backend/` del frontend, cablear consumo remoto |
| Rutas API frontend | Eliminar; todo `/api/*` en Express |
| Conexión frontend→backend | `VITE_API_BASE_URL` (URLs absolutas) |
| Historial git | Preservar con `git subtree split` |
| Exposición pública | ngrok tunela el puerto del backend |

## Arquitectura objetivo

```text
Meta / n8n ──► ngrok ──► Backend Express (:3000)
                              │
                              ├── /api/webhooks/*
                              ├── /api/media/*
                              ├── /api/* (REST)
                              └── APP_PUBLIC_URL = URL ngrok

Frontend Vite (:8080)
  └── fetch(`${VITE_API_BASE_URL}/api/...`) ──► Backend
```

**Fuente de verdad única:** el contenedor en memoria del backend Express. El frontend deja de ejecutar use cases locales (`server-fns` + `src/core` para datos de negocio) y consume el REST del Express.

**Fuera de alcance:** base de datos real, auth de producción, despliegue cloud. Solo split de repos + cableado local/ngrok.

## Migración del repositorio (subtree)

1. En el frontend: `git subtree split -P backend -b backend-split`
2. En `internal_sys_comunication_backend` (hoy vacío, sin commits): incorporar esa rama como historial inicial y push a `origin/main`
3. En el frontend: eliminar la carpeta `backend/` en un commit de cleanup posterior al split
4. En el backend independiente: quitar la dependencia fantasma `"tanstack_start_ts": "file:.."` del `package.json`

**Estructura raíz del repo backend:**

- `package.json`, `tsconfig.json`, `.env.example`, `src/`
- Scripts: `dev`, `build`, `start`
- README: levantar Express + ngrok y URLs de webhook

**Puertos / CORS:**

- Backend: `PORT=3000`
- Frontend: `8080` (Vite actual)
- `CORS_ORIGIN=http://localhost:8080`

## ngrok y variables de entorno

ngrok apunta **solo** al backend:

```bash
ngrok http 3000
```

### Backend `.env`

- `PORT=3000`
- `CORS_ORIGIN=http://localhost:8080`
- `APP_PUBLIC_URL=https://<subdominio>.ngrok-free.dev` (o `.ngrok-free.app`)
- Secretos WhatsApp (`WHATSAPP_*`) y n8n (`N8N_*`) únicamente aquí
- Header `ngrok-skip-browser-warning` se mantiene en el cliente n8n del backend

### Frontend `.env`

- `VITE_API_BASE_URL=http://localhost:3000`
- Eliminar del frontend: secretos WhatsApp/n8n y `APP_PUBLIC_URL`

### Callbacks (Meta / n8n)

Con el webhook ya configurado en Meta, el patrón es:

- WhatsApp: `{APP_PUBLIC_URL}/api/webhooks/whatsapp`
- n8n reply: `{APP_PUBLIC_URL}/api/webhooks/n8n/reply`
- n8n inbound: `{APP_PUBLIC_URL}/api/webhooks/n8n/inbound`
- Media: `{APP_PUBLIC_URL}/api/media/:messageId`

Ejemplo operativo actual: `https://scalping-snagged-scabbed.ngrok-free.dev/api/webhooks/whatsapp`. Si ngrok regenera el dominio, actualizar Meta y `APP_PUBLIC_URL`.

`allowedHosts` de Vite para dominios ngrok puede permanecer por si se expone el UI; no es requerido para webhooks.

## Cambios en el frontend

### Eliminar

- Rutas TanStack API: `src/routes/api/webhooks/*`, `src/routes/api/media.$messageId.ts`
- Carpeta `backend/` (tras subtree)
- Secretos server-only del `.env.example` del frontend

### Reemplazar acceso a datos

- Hoy: `createServerFn` + `getContainer()` local (`src/adapters/http/server-fns.ts`)
- Destino: cliente HTTP (`src/lib/api-client.ts` o equivalente) contra `${VITE_API_BASE_URL}/api/...`
- Conservar DTOs existentes para minimizar cambios de UI
- Wrappers con la misma superficie de API (o renombre mecánico) sobre `fetch`

### Código que deja de ser fuente de verdad

- `src/core/**` y adapters de persistencia/WhatsApp/n8n usados solo por server-fns y rutas API: eliminar o reducir a lo que la UI mock aún necesite (p. ej. seeds de auth local)
- Si `lib/auth.ts` depende de seeds, mantener solo esos o leer usuarios/depts vía API

## Verificación post-migración

1. Backend en `:3000` con el mismo `WHATSAPP_VERIFY_TOKEN` que Meta
2. `APP_PUBLIC_URL` igual a la URL pública ngrok activa
3. ngrok tunela el backend (`ngrok http 3000`), no Vite
4. `GET /health` y challenge de verificación Meta responden 200
5. Frontend con `VITE_API_BASE_URL=http://localhost:3000` lista conversaciones/mensajes del Express
6. Un mensaje de prueba WhatsApp aparece en la bandeja del frontend

## Riesgos

- Dominio ngrok efímero: hay que actualizar Meta + `APP_PUBLIC_URL` al regenerarse
- Estado en memoria único en Express: mensajes que antes entraban por rutas TanStack al contenedor del frontend ya no existirán ahí
- Hits a `http://localhost:8080/api/...` fallarán a propósito; el tráfico debe ir al backend/ngrok

## Enfoque de extracción git

Usar **`git subtree split -P backend`**, no copia limpia ni cherry-pick manual. El repo backend recibe ese historial como base de `main`.
