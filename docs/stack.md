# Stack

Cada pieza fue elegida con el mismo criterio: **lo más simple que funciona en
producción** y que no te estorba cuando el MVP crece.

## Next.js (frontend) — `apps/web`

- React con App Router, TypeScript y Tailwind CSS.
- Server components y SSR incluidos: bueno para SEO de tu landing y rapidez.
- Compila a modo `standalone`, así la imagen Docker pesa poco.

**Desarrollo local:** `cd apps/web && npm run dev` → http://localhost:3000

## NestJS (backend) — `apps/api`

- Framework Node con TypeScript, estructura clara (módulos, controladores,
  servicios) que escala bien cuando el equipo crece.
- Incluye endpoint `GET /health` para monitoreo.
- CORS configurado por la variable `CORS_ORIGIN`.

**Desarrollo local:** `cd apps/api && npm run start:dev` → http://localhost:4000

> El API no trae ORM para no imponerte uno. Opciones recomendadas:
> **Prisma** (el más popular) o **TypeORM** (integración clásica con Nest).
> La variable `DATABASE_URL` ya llega lista al contenedor.

## PostgreSQL (base de datos)

- La base relacional por defecto de la industria: confiable, gratuita y con
  JSON si necesitas flexibilidad.
- Corre en un contenedor con volumen persistente (`pg_data`).
- Respaldo con un comando: `bash scripts/backup-db.sh`.

## Caddy (reverse proxy)

- HTTPS automático con Let's Encrypt: certificados emitidos y renovados solos.
- Configuración de ~15 líneas ([infra/caddy/Caddyfile](../infra/caddy/Caddyfile))
  frente a las decenas que pide nginx + certbot.

## Docker Compose (orquestación)

- Un archivo ([docker-compose.yml](../docker-compose.yml)) describe todo el
  sistema. `docker compose up -d` lo levanta igual en cualquier VPS.
- Sin Kubernetes: para un MVP es complejidad que no paga renta
  (ver [scaling.md](scaling.md)).

## ¿Por qué un VPS y no serverless/PaaS?

| Criterio    | VPS (este starter)       | PaaS (Vercel, Railway...)   |
| ----------- | ------------------------ | --------------------------- |
| Costo fijo  | ~$5–10/mes todo incluido | Crece con el uso, sorpresas |
| Control     | Total (DB, cron, colas)  | Limitado al proveedor       |
| Vendor lock | Ninguno                  | Alto                        |
| Esfuerzo    | Un poco más al inicio    | Mínimo al inicio            |

Para un MVP que quiere validar sin quemar presupuesto, un VPS de $6 aguanta
miles de usuarios diarios con esta arquitectura.
