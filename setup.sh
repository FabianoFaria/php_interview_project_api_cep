#!/bin/sh
# Sobe o ambiente completo (backend + frontend + mysql) e prepara o banco de dados.
# Uso: ./setup.sh

set -e

echo "==> Preparando arquivos de ambiente..."
[ -f .env ] || cp .env.example .env
[ -f backend/.env ] || cp backend/.env.example backend/.env
[ -f frontend/.env ] || cp frontend/.env.example frontend/.env

echo "==> Subindo containers (build)..."
docker compose up -d --build

echo "==> Aguardando o MySQL aceitar conexoes..."
until docker compose exec -T mysql mysqladmin ping -h 127.0.0.1 --silent >/dev/null 2>&1; do
    printf '.'
    sleep 2
done
echo ""

echo "==> Instalando dependencias PHP (se necessario) e gerando APP_KEY..."
docker compose exec -T backend composer install --no-interaction
docker compose exec -T backend php artisan key:generate --ansi

echo "==> Rodando migrations..."
docker compose exec -T backend php artisan migrate --force

echo ""
echo "Ambiente pronto!"
echo "  API:      http://localhost:8000/api"
echo "  Frontend: http://localhost:5173"
