# Guía para agentes de IA (y humanos)

Este repo es un **starter para levantar un MVP en un VPS** con Docker Compose:
Next.js (web) + NestJS (api) + Prisma + PostgreSQL + Caddy. Lo usan
emprendedores que le describen a una IA lo que quieren construir. Tu trabajo es
construirlo encima **sin romper la simplicidad ni la arquitectura**.

Antes de tocar `apps/web`, lee `apps/web/AGENTS.md`: la versión de Next.js
incluida tiene cambios respecto a versiones anteriores.

## Principios

1. **Simple antes que sofisticado.** Un VPS y un `docker-compose.yml`. No
   agregues servicios, colas, microservicios ni Kubernetes salvo que
   `docs/scaling.md` lo justifique y el usuario lo pida.
2. **Todo corre con `docker compose up -d --build`.** Si algo necesita un paso
   manual en producción, está mal resuelto.
3. **Sin secretos en el código.** Van en `.env` (ignorado por git) y se
   declaran en `.env.example` y en `docker-compose.yml`.
4. **Documentación en español**, práctica, sin asumir experiencia DevOps.
   Si cambias el stack, actualiza `README.md` y `docs/`.

## Mapa del repo

| Ruta                     | Qué es                                          |
| ------------------------ | ----------------------------------------------- |
| `apps/web`               | Frontend Next.js (App Router, Tailwind)         |
| `apps/api`               | Backend NestJS + Prisma                         |
| `apps/api/prisma`        | `schema.prisma` + migraciones                   |
| `docker-compose.yml`     | Todos los servicios de producción               |
| `infra/caddy/Caddyfile`  | Reverse proxy + HTTPS automático                |
| `scripts/`               | Preparar el VPS, desplegar, respaldar           |
| `docs/`                  | Arquitectura, stack, deploy, escalamiento       |

## Backend (`apps/api`)

**Dónde va cada cosa**

- `src/modules/<feature>/`: una carpeta por funcionalidad de negocio
  (`products`, `orders`...). Dentro: `<feature>.module.ts`,
  `<feature>.controller.ts` (rutas HTTP y validación de entrada),
  `<feature>.service.ts` (lógica y acceso a datos) y `dto/` si hace falta.
  Registra el módulo en `src/app.module.ts`.
- `src/infra/`: solo piezas técnicas (Prisma hoy; colas, storage o email
  mañana). Nada de negocio aquí.
- Los controladores no tocan Prisma directamente: llaman a un servicio.

**Base de datos**

- Inyecta `PrismaService` (`src/infra/prisma`). Nunca hagas `new PrismaClient()`.
- Cambios de esquema: edita `prisma/schema.prisma` y corre
  `npm run db:migrate -- --name <descripcion>`. Commitea `prisma/migrations`;
  producción las aplica sola al arrancar (`entrypoint.sh`).
- No edites una migración ya aplicada: crea una nueva.

**Convenciones**

- Código y nombres en inglés; comentarios y documentación en español.
- Valida la entrada en el controlador con DTOs. Si necesitas una librería,
  `class-validator` + `ValidationPipe` es la opción estándar de Nest.
- Variable de entorno nueva: léela con `process.env` y declárala en
  `docker-compose.yml` (servicio `api`), en `.env.example` de la raíz y en
  `apps/api/.env.example`.
- `GET /health` debe seguir respondiendo: lo usa el monitoreo.

## Frontend (`apps/web`)

- App Router en `src/app/`. Componentes reutilizables en `src/components/`,
  utilidades en `src/lib/`. El alias `@/` apunta a `src/`.
- Para llamar al API usa `apiUrl()` de `src/lib/api.ts`. Elige sola la URL
  correcta: `API_URL` (red interna de Docker) en el servidor y
  `NEXT_PUBLIC_API_URL` en el navegador.
- Las variables `NEXT_PUBLIC_*` se fijan en el **build**. Si agregas una,
  pásala como `args` del servicio `web` en `docker-compose.yml` y como
  `ARG`/`ENV` en `apps/web/Dockerfile`.
- Prefiere Server Components para leer datos; Client Components solo donde
  hay interacción.

## Infraestructura

- Servicio nuevo en `docker-compose.yml` (por ejemplo Redis): sin `ports`
  públicos, volumen con nombre si guarda datos, `healthcheck`, y `depends_on`
  desde quien lo use. Documéntalo en `docs/stack.md`.
- Subdominio nuevo: bloque en `infra/caddy/Caddyfile` y registro DNS en
  `docs/deployment.md`.
- Los scripts corren en Linux: fin de línea LF (`.gitattributes` ya lo fuerza).

## Antes de dar algo por terminado

```bash
cd apps/api && npm run lint && npm test && npm run build
cd apps/web && npm run lint && npm run build
docker compose build        # si tocaste Dockerfiles o docker-compose.yml
```

Si agregaste modelos, `npm run db:migrate` corrió y la migración está en git.
