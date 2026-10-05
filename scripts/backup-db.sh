#!/usr/bin/env bash
# Respalda la base de datos a backups/backup-FECHA.sql.gz
# Uso:  bash scripts/backup-db.sh
# Tip:  agregalo a cron para respaldos diarios:
#       0 3 * * * cd /ruta/al/repo && bash scripts/backup-db.sh
set -euo pipefail
cd "$(dirname "$0")/.."

set -a
source .env
set +a

mkdir -p backups
FILE="backups/backup-$(date +%Y%m%d-%H%M%S).sql.gz"

echo "==> Respaldando ${POSTGRES_DB} en ${FILE}..."
docker compose exec -T db pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "$FILE"

echo "==> Eliminando respaldos de mas de 14 dias..."
find backups -name "backup-*.sql.gz" -mtime +14 -delete

echo "Listo: $FILE"
