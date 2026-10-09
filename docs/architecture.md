# Arquitectura

Todo corre en **un solo VPS** con Docker Compose. Es la arquitectura más simple
que te lleva a producción con HTTPS, base de datos y deploys repetibles.

```
                        Internet
                           │
                 ┌─────────▼─────────┐
                 │   Caddy (:80/:443)│   TLS automático (Let's Encrypt)
                 └────┬─────────┬────┘
        tudominio.com │         │ api.tudominio.com
                 ┌────▼───┐ ┌───▼────┐
                 │  web   │ │  api   │
                 │ Next.js│ │ NestJS │
                 │  :3000 │ │  :4000 │
                 └────────┘ └───┬────┘
                                │
                           ┌────▼────┐
                           │   db    │
                           │Postgres │
                           │  :5432  │
                           └─────────┘
```

## Servicios

| Servicio | Imagen / Build        | Puerto interno | Expuesto a internet |
| -------- | --------------------- | -------------- | ------------------- |
| `caddy`  | `caddy:2-alpine`      | 80 / 443       | Sí (único expuesto) |
| `web`    | `apps/web/Dockerfile` | 3000           | No (vía Caddy)      |
| `api`    | `apps/api/Dockerfile` | 4000           | No (vía Caddy)      |
| `db`     | `postgres:16-alpine`  | 5432           | No (solo localhost) |

## Decisiones clave

- **Caddy como reverse proxy**: obtiene y renueva certificados TLS solo.
  Cero configuración de HTTPS.
- **Un contenedor por responsabilidad**: frontend, backend y base de datos
  separados. Puedes reiniciar o escalar cada uno sin tocar el resto.
- **La red interna de Docker** conecta los servicios por nombre
  (`web`, `api`, `db`). Solo Caddy publica puertos al exterior; Postgres
  solo escucha en `127.0.0.1` de la máquina.
- **Migraciones al arrancar**: el contenedor del API corre
  `prisma migrate deploy` antes de iniciar el servidor, así la base de datos
  siempre coincide con el código desplegado.
- **Sesiones en el API**: Better Auth corre dentro de NestJS y emite una
  cookie httpOnly para `.tudominio.com`, válida tanto en la web como en el API.
- **Datos persistentes en volúmenes**: `pg_data` (base de datos) y
  `caddy_data` (certificados). Un `docker compose down` no los borra.

## Cómo se organiza el código

Por funcionalidad de negocio, en los dos lados: `apps/api/src/modules/<dominio>`
y `apps/web/src/features/<feature>`. No es atomic design ni capas genéricas:
cada feature tiene junto todo lo suyo. [AGENTS.md](../AGENTS.md) lo detalla y
`notes` es el ejemplo completo de punta a punta.

## Flujo de una petición

1. El navegador pide `https://tudominio.com` → Caddy termina TLS y pasa a `web:3000`.
2. El frontend llama al API. Desde el navegador va a
   `https://api.tudominio.com` (`NEXT_PUBLIC_API_URL`) y Caddy enruta ese
   subdominio a `api:4000`.
3. Desde el servidor de Next (server components, route handlers) va directo
   por la red interna a `http://api:4000` (`API_URL`), sin salir a internet.
   Si hay sesión, la cookie viaja en ambas llamadas y el API la valida.
4. El API habla con Postgres por la red interna usando `DATABASE_URL`
   (a través de Prisma).

Más detalle de cada tecnología en [stack.md](stack.md). Para subirlo a un VPS,
sigue [deployment.md](deployment.md).
