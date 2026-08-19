#!/bin/sh
set -e

if [ -f "composer.json" ] && [ ! -d "vendor" ]; then
    composer install --no-interaction --prefer-dist
fi

mkdir -p storage/framework/{cache,sessions,testing,views} storage/logs bootstrap/cache
chmod -R ugo+rwX storage bootstrap/cache

exec "$@"
