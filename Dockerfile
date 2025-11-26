# Etapa 1: Construcción
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY tsconfig.json ./

# Instalar todas las dependencias (incluyendo devDependencies para el build)
RUN npm ci

# Copiar el código fuente
COPY . .

# Construir la aplicación
RUN npm run build

# Etapa 2: Producción
FROM node:18-alpine AS production

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar solo dependencias de producción
RUN npm ci --only=production && npm cache clean --force

# Copiar el código compilado desde la etapa de construcción
COPY --from=builder /app/dist ./dist

# Exponer el puerto
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["node", "dist/main"]

