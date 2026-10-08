#!/bin/sh
# Arranque del contenedor del API:
#   1. Aplica las migraciones pendientes (prisma/migrations) a la base de datos.
#   2. Inicia el servidor.
# Asi cada deploy deja la base de datos al dia sin pasos manuales.
set -e

echo "[api] Aplicando migraciones de base de datos..."
node_modules/.bin/prisma migrate deploy

echo "[api] Iniciando servidor..."
exec node dist/main.js
