# ---- Build ----
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Genera el cliente tipado de Prisma (queda en node_modules/.prisma) y compila
RUN npx prisma generate
RUN npm run build
# Quita las dependencias de desarrollo. `prisma` (CLI) esta en dependencies,
# no en devDependencies, porque el contenedor lo necesita para migrar al arrancar.
RUN npm prune --omit=dev

# ---- Runtime ----
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Sin telemetria ni chequeo de version de Prisma al arrancar
ENV CHECKPOINT_DISABLE=1
RUN addgroup -S nodejs && adduser -S nestjs -G nodejs
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./
COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh
USER nestjs
ENV PORT=4000
EXPOSE 4000
# Aplica las migraciones pendientes y arranca el servidor (ver entrypoint.sh)
ENTRYPOINT ["./entrypoint.sh"]
