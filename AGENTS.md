# Guía para agentes de IA (y humanos)

Este repo es un **starter para levantar un MVP en un VPS** con Docker Compose:
Next.js (web) + NestJS (api) + Prisma + Better Auth + PostgreSQL + Caddy. Lo usan
emprendedores que le describen a una IA lo que quieren construir. Tu trabajo es
construirlo encima **sin romper la simplicidad ni la arquitectura**.

**Quién usa esto:** un emprendedor que no programa. Su flujo es `npm run setup`
una vez y `npm run dev` siempre; todo lo demás lo haces tú. No le pidas pasos
manuales: si algo necesita un comando, córrelo tú o automatízalo en `scripts/`.

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

- Inyecta `PrismaService` (`src/infra/prisma`). La única instancia vive ahí y
  la comparte Better Auth; nunca hagas `new PrismaClient()`.
- Cambios de esquema: edita `prisma/schema.prisma` y corre, desde la raíz,
  `npm run db:migrate -- --name <descripcion>`. Commitea `prisma/migrations`.
  Aplicarlas es automático: `npm run dev` en local y `entrypoint.sh` en
  producción. Nunca le pidas al usuario que migre a mano.
- No edites una migración ya aplicada: crea una nueva.

**Convenciones**

- Código y nombres en inglés; comentarios y documentación en español.
- Valida la entrada en el controlador con DTOs. Si necesitas una librería,
  `class-validator` + `ValidationPipe` es la opción estándar de Nest.
- Variable de entorno nueva: léela con `process.env` y declárala en
  `docker-compose.yml` (servicio `api`), en `.env.example` de la raíz y en
  `apps/api/.env.example`.
- `GET /health` debe seguir respondiendo: lo usa el monitoreo.

## Autenticación (Better Auth)

- El API es el dueño: Better Auth corre dentro de NestJS
  (`src/infra/auth/auth.ts`) con sus tablas en Prisma (`User`, `Session`,
  `Account`, `Verification`). La web es solo un cliente.
- Todo el API exige sesión por el guard global. Marca lo público con
  `@AllowAnonymous()` (como `/health`) y lee el usuario con
  `@Session() session: UserSession`. Ejemplo: `src/modules/users/users.controller.ts`.
  Filtra siempre los datos por `session.user.id`.
- En la web: los server components usan `getSession()` de `src/lib/session.ts`
  y hacen `redirect("/login")` si no hay sesión; los client components usan
  `authClient` de `src/lib/auth-client.ts` (`signIn.email`, `signUp.email`,
  `signOut`, `useSession`). Las rutas privadas se listan en `src/proxy.ts`.
- Datos extra del usuario (teléfono, rol...): agrégalos al modelo `User` de
  Prisma y a `user.additionalFields` en `auth.ts`, y crea la migración. No
  crees otra tabla de usuarios.
- En tests (Jest) Better Auth se sustituye por `apps/api/test/mocks`: no hay
  guard y `@Session()` entrega `TEST_USER`. Así se prueban rutas protegidas
  sin login; el login real se prueba en el navegador con `npm run dev`.
- Google, magic links, verificación de email, 2FA u organizaciones son
  opciones o plugins de Better Auth en `auth.ts`: sigue su documentación
  (https://www.better-auth.com/docs) antes de inventar algo propio.

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
npm run check               # lint + tests + build de api y web, desde la raíz
docker compose build        # si tocaste Dockerfiles o docker-compose.yml
```

Si agregaste modelos, `npm run db:migrate` corrió y la migración está en git.
