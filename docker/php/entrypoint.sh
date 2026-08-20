#!/bin/sh
set -e

# O composer baixa 100+ pacotes em paralelo durante o install; sob rede
# instavel isso pode causar falha intermitente em um download especifico
# ("corrupted zip archive (0 bytes)") mesmo quando a mesma URL, baixada
# isoladamente, funciona sem problema. Tenta algumas vezes antes de desistir.
install_dependencies() {
    tentativa=1
    max_tentativas=3

    while [ "$tentativa" -le "$max_tentativas" ]; do
        if composer install --no-interaction --prefer-dist; then
            return 0
        fi

        echo "composer install falhou (tentativa $tentativa/$max_tentativas), tentando novamente..." >&2
        tentativa=$((tentativa + 1))
        sleep 3
    done

    return 1
}

# Checa vendor/autoload.php (nao so a pasta vendor/) porque o composer cria
# a pasta vendor/ logo no inicio da instalacao, antes de baixar os pacotes.
# Se a instalacao falhar no meio (ex: download corrompido), a pasta fica
# incompleta e o autoload.php nunca chega a ser gerado - sem essa checagem,
# o proximo boot do container pularia a instalacao e subiria com
# dependencias faltando.
if [ -f "composer.json" ] && [ ! -f "vendor/autoload.php" ]; then
    install_dependencies || exit 1
fi

mkdir -p storage/framework/{cache,sessions,testing,views} storage/logs bootstrap/cache
chmod -R ugo+rwX storage bootstrap/cache

exec "$@"
