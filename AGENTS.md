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

| Ruta                       | Qué es                                            |
| -------------------------- | ------------------------------------------------- |
| `apps/web/src/app`         | Solo rutas de Next.js (páginas delgadas)          |
| `apps/web/src/features`    | Pantallas y su lógica, una carpeta por feature    |
| `apps/web/src/components`  | UI compartida (AppShell, formularios, botones)    |
| `apps/web/src/lib`         | Utilidades: llamadas al API, sesión               |
| `apps/api/src/modules`     | Un módulo por dominio de negocio                  |
| `apps/api/src/infra`       | Técnico: Prisma, Better Auth                      |
| `apps/api/src/common`      | Pipes, guards, decoradores y utilidades sin negocio |
| `apps/api/prisma`          | `schema.prisma` + migraciones                     |
| `docker-compose.yml`       | Todos los servicios de producción                 |
| `infra/caddy/Caddyfile`    | Reverse proxy + HTTPS automático                  |
| `scripts/`                 | Preparar la máquina o el VPS, desplegar, respaldar |
| `docs/`                    | Arquitectura, stack, deploy, escalamiento         |

## Arquitectura: features en la web, módulos en el API

No es atomic design ni clean architecture por capas: el código se agrupa por
**funcionalidad de negocio**, igual en los dos lados.

- **Web:** `src/app` solo enruta; cada página es delgada, lee datos en el
  servidor y renderiza un componente de `src/features/<feature>`. Lo que se
  comparte entre features vive en `src/components`, `src/lib` y `src/hooks`.
- **API:** `src/modules/<dominio>` con controller (HTTP), service (lógica y
  Prisma) y schemas (Zod). `src/infra` para piezas técnicas y `src/common`
  para lo transversal sin negocio.
- **El ejemplo completo es Notas:** `apps/api/src/modules/notes`,
  `apps/web/src/features/notes` y `apps/web/src/app/(app)/notes`. Copia ese
  patrón para cada funcionalidad nueva y borra Notas cuando ya no haga falta.

## Backend (`apps/api`)

**Dónde va cada cosa**

- `src/modules/<feature>/`: `<feature>.module.ts`, `<feature>.controller.ts`
  (rutas HTTP: valida la entrada, saca el usuario de la sesión y delega),
  `<feature>.service.ts` (lógica y acceso a datos con Prisma) y
  `<feature>.schemas.ts` (esquemas Zod de entrada y sus tipos). Registra el
  módulo en `src/app.module.ts`.
- `src/infra/`: solo piezas técnicas (Prisma y Better Auth hoy; colas,
  storage o email mañana). Nada de negocio aquí.
- `src/common/`: `pipes/` (ZodValidationPipe), y cuando hagan falta `guards/`,
  `decorators/` y `utils/`. Nada que conozca un dominio concreto.
- Los controladores no tocan Prisma directamente: llaman a un service.

**Reglas de una ruta**

- Valida el body con `@Body(new ZodValidationPipe(schema))`. El pipe responde
  400 con `{ message, errors: [{ path, message }] }`; no valides a mano.
- Lee el usuario con `@Session() session: UserSession` y pásale
  `session.user.id` al service. Toda consulta de negocio filtra por el
  usuario. Para editar o borrar usa `updateMany`/`deleteMany` con
  `{ id, userId }` y responde 404 si no afectó filas (ver `NotesService.remove`).
- Errores: lanza excepciones de Nest (`NotFoundException`,
  `BadRequestException`...). Nunca devuelvas 200 con un "error" dentro.
- Respuestas: el JSON del modelo tal cual. POST responde 201 (Nest por
  defecto) y DELETE 204 (`@HttpCode(204)`).

**Base de datos**

- Inyecta `PrismaService` (`src/infra/prisma`). La única instancia vive ahí y
  la comparte Better Auth; nunca hagas `new PrismaClient()`.
- Modelos nuevos: `userId` + relación con `User` + `@@index([userId])`, como
  `Note`. Las tablas de auth (`User`, `Session`, `Account`, `Verification`)
  no se tocan salvo para agregar campos a `User`.
- Cambios de esquema: edita `prisma/schema.prisma` y corre, desde la raíz,
  `npm run db:migrate -- --name <descripcion>`. Commitea `prisma/migrations`.
  Aplicarlas es automático: `npm run dev` en local y `entrypoint.sh` en
  producción. Nunca le pidas al usuario que migre a mano.
- No edites una migración ya aplicada: crea una nueva.

**Convenciones**

- Código y nombres en inglés; comentarios, mensajes y documentación en español.
- Variable de entorno nueva: léela con `process.env` y declárala en
  `docker-compose.yml` (servicio `api`), en `.env.example` de la raíz y en
  `apps/api/.env.example`.
- `GET /health` debe seguir respondiendo: lo usa el monitoreo.

**Tests**

- Unitarios junto al archivo (`*.spec.ts`) con Prisma simulado por `useValue`
  (ver `notes.service.spec.ts`). End-to-end en `test/` contra la base local
  (ver `test/app.e2e-spec.ts`); ahí Better Auth está simulado (ver abajo).

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

**Dónde va cada cosa**

- `src/app/`: solo rutas. Una página es delgada: lee datos en el servidor y
  renderiza un componente de `features`. Las páginas privadas van dentro del
  grupo `src/app/(app)/`, cuyo layout verifica la sesión y pone el `AppShell`
  (navegación y usuario). Cada ruta privada nueva se agrega a `src/proxy.ts`
  y a la navegación en `src/components/app-nav.tsx`.
- `src/features/<feature>/`: la pantalla y su lógica (componentes, `types.ts`
  con la forma de los datos del API). Nada de rutas aquí.
- `src/components/`: UI compartida entre features (AppShell, formulario de
  auth, botones). `src/lib/`: utilidades (API, sesión). `src/hooks/`: hooks
  compartidos, cuando existan.
- El alias `@/` apunta a `src/`.

**Datos**

- Leer: en server components con `apiFetchServer()` de `src/lib/api-server.ts`.
  Reenvía la cookie de sesión por la red interna y manda al login si el API
  responde 401.
- Escribir: desde client components con `apiFetch()` de `src/lib/api.ts` y
  después `router.refresh()`, para que el servidor vuelva a leer. No
  dupliques la lista en estado local ni la "actualices a mano".
- Los errores del API llegan como `ApiError` (`status`, `message`, `errors`).
  Muéstralos junto al formulario, en español, diciendo qué corregir.
- Para llamar al API se usa `apiUrl()`: elige sola `API_URL` (red interna de
  Docker) en el servidor y `NEXT_PUBLIC_API_URL` en el navegador. Las
  variables `NEXT_PUBLIC_*` se fijan en el **build**: si agregas una, pásala
  como `args` del servicio `web` en `docker-compose.yml` y como `ARG`/`ENV`
  en `apps/web/Dockerfile`.

**Pantallas**

- Server Components por defecto; `"use client"` solo donde hay interacción
  (formularios, botones, hooks).
- Toda ruta que lee datos tiene `loading.tsx`; el grupo `(app)` ya tiene un
  `error.tsx` con reintento. Un vacío es una invitación a actuar ("Todavía no
  hay notas. Escribe la primera arriba.").
- Estilo: Tailwind con los tokens de `globals.css` (`text-accent`,
  `bg-accent`, `text-danger`, `text-foreground`). Un solo acento, sin tarjetas
  con sombra ni gradientes. Textos en español, en frases, sin mayúsculas
  sostenidas.

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

Si agregaste una funcionalidad, repasa que tenga las piezas de Notas: módulo
con schema Zod y service filtrado por usuario, migración en git, página
delgada dentro de `(app)` con `loading.tsx`, y su entrada en `proxy.ts` y en
la navegación.
