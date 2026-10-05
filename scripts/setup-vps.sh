#!/usr/bin/env bash
# Prepara un VPS Ubuntu/Debian recien creado: Docker + firewall basico.
# Uso (como root o con sudo):  bash scripts/setup-vps.sh
set -euo pipefail

echo "==> Actualizando el sistema..."
apt-get update && apt-get upgrade -y

echo "==> Instalando Docker..."
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
else
  echo "    Docker ya esta instalado, se omite."
fi

echo "==> Configurando firewall (SSH, HTTP, HTTPS)..."
if command -v ufw >/dev/null 2>&1; then
  ufw allow 22/tcp
  ufw allow 80/tcp
  ufw allow 443/tcp
  ufw --force enable
else
  echo "    ufw no esta disponible, configura el firewall manualmente."
fi

echo ""
echo "Listo. Siguientes pasos:"
echo "  1. git clone <tu-repo> && cd mvp-vps-starter"
echo "  2. cp .env.example .env   (y completa los valores)"
echo "  3. docker compose up -d --build"
