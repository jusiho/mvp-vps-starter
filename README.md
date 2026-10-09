# mvp-vps-starter 🚀

Starter para emprendedores que quieren **levantar su MVP en producción sin
quemar presupuesto**: frontend, API, base de datos y HTTPS corriendo en un
VPS de ~$6/mes con Docker Compose.

## ¿Qué incluye?

- **[Next.js](apps/web)** — frontend con TypeScript y Tailwind CSS
- **[NestJS](apps/api)** — API con TypeScript y endpoint `/health`
- **Prisma** — ORM tipado: defines tus tablas en un archivo y las migraciones
  se aplican solas en cada deploy
- **Better Auth** — registro e inicio de sesión listos (email y contraseña),
  con sesiones seguras en la base de datos y todo el API protegido por defecto
- **PostgreSQL** — base de datos con volumen persistente y script de respaldo
- **Caddy** — HTTPS automático con Let's Encrypt (cero config de certificados)
- **Docker Compose** — todo el sistema descrito en un archivo
- **Scripts** — preparar tu máquina o el VPS, desplegar y respaldar, cada uno
  con un comando
- **Un ejemplo completo (Notas)** — módulo en el API, pantalla en la web y
  tests, para que la IA copie el patrón en cada funcionalidad nueva
- **Guía para la IA** — [AGENTS.md](AGENTS.md) le explica la arquitectura a
  Claude Code, Cursor o Codex para que construyan encima sin romperla

## Estructura

```
mvp-vps-starter/
├── README.md
├── AGENTS.md               # arquitectura y convenciones (para ti y para la IA)
├── package.json            # npm run setup · npm run dev
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
    ├── setup.mjs           # prepara tu máquina para desarrollar (una vez)
    ├── dev.mjs             # arranca web + api en local
    ├── setup-vps.sh        # prepara un VPS recién creado
    ├── deploy.sh           # actualiza producción
    └── backup-db.sh        # respalda la base de datos
```

## Desarrollo local

Requisitos: [Node.js 22+](https://nodejs.org) y
[Docker Desktop](https://www.docker.com/products/docker-desktop/) abierto.

```bash
npm run setup   # una sola vez: crea los .env, levanta Postgres, instala y migra
npm run dev     # cada vez: arranca todo → http://localhost:3000
```

Y ya. Crea tu cuenta en `http://localhost:3000/register` y entra a tu panel.
A partir de aquí pídele a la IA lo que quieras construir (Claude Code,
Cursor, Codex...): [AGENTS.md](AGENTS.md) le explica la arquitectura y las
reglas. Cada `npm run dev` aplica solo los cambios pendientes en la base de
datos; en producción el deploy hace lo mismo.

> `npm run setup` se puede relanzar cuando quieras: no pisa tu `.env`. Si el
> puerto 5432 ya está ocupado en tu máquina, elige otro automáticamente.

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
