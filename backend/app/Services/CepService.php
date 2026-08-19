<?php

namespace App\Services;

use App\Exceptions\CepInvalidoException;
use App\Exceptions\CepNaoEncontradoException;
use App\Exceptions\CepProviderIndisponivelException;
use App\Services\CepProviders\CepProviderInterface;
use Illuminate\Support\Facades\Cache;

class CepService
{
    /**
     * @param  CepProviderInterface[]  $providers  Em ordem de prioridade.
     */
    public function __construct(
        private readonly array $providers,
        private readonly int $cacheTtlHours,
    ) {
    }

    /**
     * @throws CepInvalidoException
     * @throws CepNaoEncontradoException
     * @throws CepProviderIndisponivelException
     */
    public function buscar(string $cep): array
    {
        $cepNormalizado = $this->normalizar($cep);

        return Cache::remember(
            "cep:{$cepNormalizado}",
            now()->addHours($this->cacheTtlHours),
            fn () => $this->consultarProviders($cepNormalizado)
        );
    }

    private function normalizar(string $cep): string
    {
        $digitos = preg_replace('/\D/', '', $cep);

        if (strlen($digitos) !== 8) {
            throw new CepInvalidoException($cep);
        }

        return $digitos;
    }

    /**
     * @throws CepNaoEncontradoException
     * @throws CepProviderIndisponivelException
     */
    private function consultarProviders(string $cep): array
    {
        $ultimaFalhaTecnica = null;
        $confirmadoNaoEncontrado = false;

        foreach ($this->providers as $provider) {
            try {
                return $provider->find($cep);
            } catch (CepNaoEncontradoException $e) {
                // Provedor respondeu com sucesso e confirmou que o CEP nao existe.
                // Ainda assim tentamos os proximos provedores, cuja base pode
                // divergir, mas essa confirmacao tem prioridade sobre uma mera
                // falha tecnica de outro provedor.
                $confirmadoNaoEncontrado = true;

                continue;
            } catch (CepProviderIndisponivelException $e) {
                $ultimaFalhaTecnica = $e;

                continue;
            }
        }

        if ($confirmadoNaoEncontrado) {
            throw new CepNaoEncontradoException($cep);
        }

        if ($ultimaFalhaTecnica !== null) {
            throw $ultimaFalhaTecnica;
        }

        throw new CepNaoEncontradoException($cep);
    }
}
