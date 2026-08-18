# Build stage
FROM node:20-alpine AS build

# Habilitar pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copiar archivos de dependencias
COPY package.json pnpm-lock.yaml ./

# Instalar dependencias
RUN pnpm install --frozen-lockfile

# Copiar el resto del código
COPY . .

# Compilar la aplicación (genera el directorio .output)
RUN pnpm build

# Runner stage
FROM node:20-alpine AS runner

WORKDIR /app

# Copiar la build de producción generada por TanStack Start / Nitro
COPY --from=build /app/.output ./.output

# Variables de entorno para producción
ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0

EXPOSE 8080

# Comando para iniciar la aplicación usando el entrypoint de Nitro
CMD ["node", ".output/server/index.mjs"]
