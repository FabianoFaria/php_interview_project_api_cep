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

echo "==> Aguardando o backend instalar as dependencias PHP..."
# O proprio entrypoint.sh do backend ja roda "composer install" sozinho no
# boot do container (com retry automatico em caso de falha de rede). Rodar
# de novo aqui geraria dois processos do composer escrevendo na mesma pasta
# vendor/ ao mesmo tempo - foi exatamente isso que causava downloads
# corrompidos de forma intermitente. Em vez disso, so esperamos o backend
# ficar pronto (artisan funcional = vendor/autoload.php ja existe).
until docker compose exec -T backend php artisan --version >/dev/null 2>&1; do
    printf '.'
    sleep 2
done
echo ""

echo "==> Gerando APP_KEY..."
docker compose exec -T backend php artisan key:generate --ansi

echo "==> Rodando migrations..."
docker compose exec -T backend php artisan migrate --force

echo ""
echo "Ambiente pronto!"
echo "  API:      http://localhost:8000/api"
echo "  Frontend: http://localhost:5173"
