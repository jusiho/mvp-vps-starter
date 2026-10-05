#!/usr/bin/env bash
# Despliega la ultima version: trae los cambios, reconstruye y reinicia.
# Uso (en el VPS):  bash scripts/deploy.sh
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> Trayendo los ultimos cambios..."
git pull

echo "==> Reconstruyendo imagenes..."
docker compose build

echo "==> Reiniciando servicios..."
docker compose up -d

echo "==> Limpiando imagenes viejas..."
docker image prune -f

echo ""
docker compose ps
echo ""
echo "Deploy completado. Logs en vivo:  docker compose logs -f"
