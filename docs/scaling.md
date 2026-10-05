# Escalamiento

La regla de oro: **no escales antes de tiempo**. Esta arquitectura en un VPS
de $10 aguanta miles de usuarios diarios. Escala cuando las métricas lo pidan,
no cuando la ansiedad lo pida.

## Señales de que toca escalar

- CPU sostenida arriba del 80 % (`htop` o `docker stats`)
- Respuestas del API consistentemente lentas (> 500 ms en endpoints simples)
- La base de datos es el cuello de botella (queries lentas, conexiones agotadas)

## Escalera de escalamiento (en orden)

### 1. Optimiza antes de pagar más

- Índices en las columnas que filtras/ordenas en Postgres.
- Cachea lo que no cambia (headers `Cache-Control`, ISR de Next.js).
- Busca queries N+1 en el API.

Esto suele comprar 10x de capacidad gratis.

### 2. Escala vertical (el botón fácil)

Sube el plan del VPS (2 → 4 → 8 GB de RAM). En Hetzner/DO toma minutos y un
reinicio. **Para la mayoría de MVPs, nunca pasarás de aquí.**

### 3. Saca la base de datos

Cuando la DB compita por recursos con las apps, muévela a:

- otro VPS solo para Postgres, o
- una DB administrada (Hetzner/DO/Supabase/Neon): respaldos y réplicas
  incluidos a cambio de unos dólares más.

Solo cambias `DATABASE_URL` en el compose y eliminas el servicio `db`.

### 4. Varios servidores de aplicación

Si un solo nodo ya no da:

- 2+ VPS corriendo `web` y `api`.
- Un load balancer delante (el del proveedor, ~$6/mes, o un VPS con Caddy).
- Requisito: que tu API sea *stateless* (sesiones en DB o Redis, archivos en
  S3-compatible como Cloudflare R2).

### 5. CDN para estáticos

Cloudflare gratis delante del dominio descarga a tu VPS de servir assets
y te da capa anti-DDoS.

## ¿Y Kubernetes?

Cuando tengas un equipo de plataforma y decenas de servicios, hablamos.
Para un MVP, Kubernetes es pagar complejidad de Google con tráfico de
cafetería. Docker Compose + este camino de escalamiento te lleva muy,
muy lejos.

## Mientras tanto: mide

- `docker stats` y `htop` para recursos.
- Uptime: [UptimeRobot](https://uptimerobot.com) (gratis) apuntando a
  `https://api.tudominio.com/health`.
- Errores: [Sentry](https://sentry.io) tiene plan gratuito generoso.
