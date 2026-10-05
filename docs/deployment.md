# Deploy a un VPS

De cero a producción con HTTPS en ~30 minutos.

## 1. Consigue un VPS

Cualquier proveedor sirve. Opciones probadas y baratas:

- [Hetzner](https://www.hetzner.com/cloud) — desde ~€4/mes, excelente precio/rendimiento
- [DigitalOcean](https://www.digitalocean.com) — desde $6/mes, muy buena documentación
- [Vultr](https://www.vultr.com) — desde $6/mes

Elige **Ubuntu 24.04 LTS**, mínimo **2 GB de RAM** (los builds de Next.js
sufren con menos). Agrega tu llave SSH al crearlo.

## 2. Apunta tu dominio

En tu proveedor de DNS crea dos registros **A** hacia la IP del VPS:

| Tipo | Nombre | Valor       |
| ---- | ------ | ----------- |
| A    | `@`    | IP del VPS  |
| A    | `api`  | IP del VPS  |

La propagación suele tomar minutos. Verifica con `nslookup tudominio.com`.

## 3. Prepara el servidor

```bash
ssh root@IP-DEL-VPS

# Clona tu repo y corre el script de preparación
git clone https://github.com/TU-USUARIO/TU-REPO.git app && cd app
bash scripts/setup-vps.sh   # instala Docker y configura el firewall
```

## 4. Configura las variables

```bash
cp .env.example .env
nano .env
```

Completa `DOMAIN`, `EMAIL` y una `POSTGRES_PASSWORD` fuerte
(genera una con `openssl rand -base64 24`).

## 5. Levanta todo

```bash
docker compose up -d --build
```

El primer build toma varios minutos. Caddy pedirá los certificados TLS
automáticamente en cuanto el DNS resuelva.

**Verifica:**

```bash
docker compose ps                      # todos los servicios "Up"
curl https://api.tudominio.com/health  # {"status":"ok"}
```

Y abre `https://tudominio.com` en el navegador. 🎉

## Actualizar (deploys siguientes)

Cada vez que hagas push a tu repo:

```bash
ssh root@IP-DEL-VPS
cd app && bash scripts/deploy.sh
```

## Comandos útiles

```bash
docker compose logs -f           # logs de todo en vivo
docker compose logs -f api      # logs solo del API
docker compose restart web      # reiniciar un servicio
docker compose exec db psql -U app app   # consola de Postgres
bash scripts/backup-db.sh       # respaldo de la base de datos
```

## Problemas comunes

- **Caddy no obtiene el certificado** → el DNS aún no propaga o los puertos
  80/443 están cerrados. Revisa `docker compose logs caddy` y `ufw status`.
- **El build de web falla por memoria** → VPS con 1 GB de RAM. Agrega swap:
  `fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile`
- **El frontend no llega al API** → recuerda que `NEXT_PUBLIC_API_URL` se fija
  al **compilar**. Si cambiaste el dominio: `docker compose build web && docker compose up -d web`.
