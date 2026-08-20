#!/bin/sh
set -e

# Checa vendor/autoload.php (nao so a pasta vendor/) porque o composer cria
# a pasta vendor/ logo no inicio da instalacao, antes de baixar os pacotes.
# Se a instalacao falhar no meio (ex: download corrompido), a pasta fica
# incompleta e o autoload.php nunca chega a ser gerado - sem essa checagem,
# o proximo boot do container pularia a instalacao e subiria com
# dependencias faltando.
if [ -f "composer.json" ] && [ ! -f "vendor/autoload.php" ]; then
    composer install --no-interaction --prefer-dist
fi

mkdir -p storage/framework/{cache,sessions,testing,views} storage/logs bootstrap/cache
chmod -R ugo+rwX storage bootstrap/cache

exec "$@"
