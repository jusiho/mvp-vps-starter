# mvp-vps-starter 🚀

Starter para emprendedores que quieren **levantar su MVP en producción sin
quemar presupuesto**: frontend, API, base de datos y HTTPS corriendo en un
VPS de ~$6/mes con Docker Compose.

## ¿Qué incluye?

- **[Next.js](apps/web)** — frontend con TypeScript y Tailwind CSS
- **[NestJS](apps/api)** — API con TypeScript y endpoint `/health`
- **Prisma** — ORM tipado: defines tus tablas en un archivo y las migraciones
  se aplican solas en cada deploy
- **PostgreSQL** — base de datos con volumen persistente y script de respaldo
- **Caddy** — HTTPS automático con Let's Encrypt (cero config de certificados)
- **Docker Compose** — todo el sistema descrito en un archivo
- **Scripts** — preparar el VPS, desplegar y respaldar con un comando
- **Guía para la IA** — [AGENTS.md](AGENTS.md) le explica la arquitectura a
  Claude Code, Cursor o Codex para que construyan encima sin romperla

## Estructura

```
mvp-vps-starter/
├── README.md
├── AGENTS.md               # arquitectura y convenciones (para ti y para la IA)
├── docker-compose.yml      # describe todos los servicios
├── .env.example            # variables de entorno (copiar a .env)
│
├── apps/
│   ├── web/                # Next.js (frontend)
│   └── api/                # NestJS (backend)
│       └── prisma/         # schema de la base de datos + migraciones
│
├── docs/
│   ├── architecture.md     # cómo encajan las piezas
│   ├── stack.md            # qué es cada tecnología y por qué
│   ├── deployment.md       # deploy a un VPS paso a paso
│   └── scaling.md          # qué hacer cuando crezcas
│
├── infra/
│   └── caddy/              # Caddyfile (reverse proxy + TLS)
│
└── scripts/
    ├── setup-vps.sh        # prepara un VPS recién creado
    ├── deploy.sh           # actualiza producción
    └── backup-db.sh        # respalda la base de datos
```

## Desarrollo local

Requisitos: Node.js 20+ y Docker (para Postgres).

```bash
# 1. Base de datos (desde la raíz del repo)
cp .env.example .env
docker compose up -d db                   # Postgres en localhost:5432

# 2. Backend
cd apps/api
cp .env.example .env                      # DATABASE_URL apunta al Postgres de arriba
npm install
npm run db:migrate                        # crea las tablas y genera el cliente de Prisma
npm run start:dev                         # http://localhost:4000/health

# 3. Frontend (en otra terminal)
cd apps/web && npm install && npm run dev # http://localhost:3000
```

Para cambiar la base de datos edita `apps/api/prisma/schema.prisma` y vuelve a
correr `npm run db:migrate`. Con `npm run db:studio` ves tus datos en el navegador.

> ¿El puerto 5432 ya está ocupado en tu máquina (un Postgres instalado)? Cambia
> `127.0.0.1:5432:5432` por `127.0.0.1:5433:5432` en `docker-compose.yml` y usa
> `localhost:5433` en `apps/api/.env`.

## Deploy a producción

Resumen (la guía completa está en [docs/deployment.md](docs/deployment.md)):

1. Crea un VPS con Ubuntu (Hetzner/DigitalOcean, 2 GB RAM).
2. Apunta tu dominio: registros A para `@` y `api`.
3. En el VPS: clona el repo y corre `bash scripts/setup-vps.sh`.
4. `cp .env.example .env` y completa dominio, email y clave de DB.
5. `docker compose up -d --build` — Caddy consigue el HTTPS solo.

Para actualizar después: `bash scripts/deploy.sh`.

## Documentación

| Doc                                      | Qué responde                        |
| ---------------------------------------- | ----------------------------------- |
| [architecture.md](docs/architecture.md)  | ¿Cómo encajan las piezas?           |
| [stack.md](docs/stack.md)                | ¿Qué es cada tecnología y por qué?  |
| [deployment.md](docs/deployment.md)      | ¿Cómo lo subo a internet?           |
| [scaling.md](docs/scaling.md)            | ¿Qué hago cuando crezca?            |

## Filosofía

1. **Simple antes que sofisticado** — un VPS y Compose llegan lejísimos.
2. **Costo fijo y predecible** — sin sorpresas de facturación serverless.
3. **Sin vendor lock-in** — todo corre en cualquier máquina Linux.
4. **Valida primero, escala después** — [docs/scaling.md](docs/scaling.md)
   te dice cuándo y cómo.
5. **Pensado para construir con IA** — describe lo que quieres y
   [AGENTS.md](AGENTS.md) se encarga de que salga con buena arquitectura.
