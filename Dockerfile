FROM node:22-alpine

# Habilitar pnpm con versión compatible
RUN corepack enable && corepack prepare pnpm@11.22.0 --activate

WORKDIR /app

# Copiar archivos de dependencias
COPY package.json pnpm-lock.yaml ./

# Instalar dependencias
RUN pnpm install --frozen-lockfile

# Copiar el resto del código
COPY . .

# Compilar la aplicación (genera el directorio dist)
RUN pnpm build

# Variables de entorno para producción
ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0

EXPOSE 8080

# Comando para iniciar la aplicación usando vite preview
CMD ["pnpm", "preview", "--port", "8080", "--host", "0.0.0.0"]
