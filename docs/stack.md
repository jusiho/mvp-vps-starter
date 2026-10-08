# Stack

Cada pieza fue elegida con el mismo criterio: **lo más simple que funciona en
producción** y que no te estorba cuando el MVP crece.

## Next.js (frontend) — `apps/web`

- React con App Router, TypeScript y Tailwind CSS.
- Server components y SSR incluidos: bueno para SEO de tu landing y rapidez.
- Compila a modo `standalone`, así la imagen Docker pesa poco.
- Para hablar con el API usa `apiUrl()` de `src/lib/api.ts`: en el servidor
  toma `API_URL` (red interna, `http://api:4000`) y en el navegador
  `NEXT_PUBLIC_API_URL` (`https://api.tudominio.com`, fijada en el build).

**Desarrollo local:** `npm run dev` en la raíz arranca web y api juntos → http://localhost:3000

## NestJS (backend) — `apps/api`

- Framework Node con TypeScript, estructura clara (módulos, controladores,
  servicios) que escala bien cuando el equipo crece.
- Incluye endpoint `GET /health` que también verifica la conexión a la base
  de datos (responde 503 si Postgres no contesta): ideal para monitoreo.
- CORS configurado por la variable `CORS_ORIGIN`.
- Estructura sugerida: `src/infra/` para piezas técnicas (base de datos,
  colas, storage) y `src/modules/` para tu negocio (usuarios, pedidos...).

**Desarrollo local:** `npm run dev` en la raíz arranca web y api juntos → http://localhost:4000/health

## Prisma (ORM) — `apps/api/prisma`

- Defines tus tablas en un solo archivo legible
  ([schema.prisma](../apps/api/prisma/schema.prisma)) y Prisma genera un
  cliente **tipado**: el editor autocompleta campos y detecta errores antes
  de ejecutar nada.
- Migraciones incluidas: cada cambio al schema se convierte en SQL versionado
  en `prisma/migrations`, y el contenedor del API las aplica solo al arrancar
  ([entrypoint.sh](../apps/api/entrypoint.sh)). Deploy = `git push` +
  `deploy.sh`, sin pasos manuales en la base de datos.
- `PrismaService` ya está registrado como módulo global de Nest: inyéctalo
  en cualquier servicio y consulta (`this.prisma.user.findMany()`).

**Flujo de trabajo:**

```bash
# 1. edita apps/api/prisma/schema.prisma (normalmente lo hace la IA)
npm run db:migrate -- --name <que-cambiaste>   # crea la migración y regenera el cliente
npm run db:studio                              # (opcional) explora tus datos en el navegador
```

Lo único que requiere intención es *crear* la migración. Aplicarla es
automático: `npm run dev` en local y el arranque del contenedor en producción.

> ¿Prefieres otro ORM (Drizzle, TypeORM)? Borra `prisma/`, `src/infra/prisma`
> y la línea de migraciones de `entrypoint.sh`. `DATABASE_URL` sigue llegando
> lista al contenedor.

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
