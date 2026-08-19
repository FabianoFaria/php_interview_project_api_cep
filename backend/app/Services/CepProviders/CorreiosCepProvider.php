<?php

namespace App\Services\CepProviders;

use App\Exceptions\CepNaoEncontradoException;
use App\Exceptions\CepProviderIndisponivelException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Throwable;

/**
 * Integra com a API oficial dos Correios (api.correios.com.br/cep/v2).
 *
 * Essa API exige um contrato ativo (cartao de postagem) para autenticacao
 * via token, algo que nao e possivel obter no prazo de um teste tecnico.
 * Sem as credenciais em CORREIOS_API_USUARIO / CORREIOS_API_CARTAO_POSTAGEM,
 * este provider falha de forma controlada e o CepService faz fallback
 * automatico para o ViaCepProvider — comportamento explicitamente
 * autorizado pelo enunciado do teste (ver decisao documentada no README).
 */
class CorreiosCepProvider implements CepProviderInterface
{
    private const AUTH_URL = 'https://api.correios.com.br/token/v1/autentica/cartaopostagem';

    private const CEP_URL = 'https://api.correios.com.br/cep/v2/enderecos/';

    public function __construct(
        private readonly ?string $usuario,
        private readonly ?string $cartaoPostagem,
    ) {
    }

    public function find(string $cep): array
    {
        if (blank($this->usuario) || blank($this->cartaoPostagem)) {
            throw new CepProviderIndisponivelException(
                $this->nome(),
                'credenciais nao configuradas (CORREIOS_API_USUARIO / CORREIOS_API_CARTAO_POSTAGEM)'
            );
        }

        try {
            $token = $this->autenticar();

            $response = Http::timeout(5)
                ->withToken($token)
                ->acceptJson()
                ->get(self::CEP_URL.$cep);
        } catch (CepProviderIndisponivelException $e) {
            throw $e;
        } catch (Throwable $e) {
            throw new CepProviderIndisponivelException($this->nome(), $e->getMessage(), $e);
        }

        if ($response->status() === 404) {
            throw new CepNaoEncontradoException($cep);
        }

        if ($response->failed()) {
            throw new CepProviderIndisponivelException($this->nome(), "HTTP {$response->status()}");
        }

        $data = $response->json();

        if (! is_array($data) || empty($data['cep'])) {
            throw new CepNaoEncontradoException($cep);
        }

        return [
            'cep' => $this->formatarCep($data['cep']),
            'logradouro' => $data['logradouroDNEC'] ?? $data['logradouro'] ?? '',
            'bairro' => $data['bairro'] ?? '',
            'cidade' => $data['localidade'] ?? '',
            'uf' => $data['uf'] ?? '',
        ];
    }

    public function nome(): string
    {
        return 'Correios';
    }

    private function autenticar(): string
    {
        return Cache::remember('correios:token', now()->addMinutes(50), function () {
            $response = Http::timeout(5)
                ->withBasicAuth($this->usuario, $this->cartaoPostagem)
                ->acceptJson()
                ->post(self::AUTH_URL, [
                    'numero' => $this->cartaoPostagem,
                ]);

            if ($response->failed()) {
                throw new CepProviderIndisponivelException($this->nome(), "falha na autenticacao (HTTP {$response->status()})");
            }

            $token = $response->json('token');

            if (blank($token)) {
                throw new CepProviderIndisponivelException($this->nome(), 'resposta de autenticacao sem token');
            }

            return $token;
        });
    }

    private function formatarCep(string $cep): string
    {
        $digitos = preg_replace('/\D/', '', $cep);

        return substr($digitos, 0, 5).'-'.substr($digitos, 5, 3);
    }
}
