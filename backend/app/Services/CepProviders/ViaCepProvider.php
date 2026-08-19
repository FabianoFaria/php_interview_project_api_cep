<?php

namespace App\Services\CepProviders;

use App\Exceptions\CepNaoEncontradoException;
use App\Exceptions\CepProviderIndisponivelException;
use Illuminate\Support\Facades\Http;
use Throwable;

class ViaCepProvider implements CepProviderInterface
{
    public function find(string $cep): array
    {
        try {
            $response = Http::timeout(5)->get("https://viacep.com.br/ws/{$cep}/json/");
        } catch (Throwable $e) {
            throw new CepProviderIndisponivelException($this->nome(), $e->getMessage(), $e);
        }

        if ($response->failed()) {
            throw new CepProviderIndisponivelException($this->nome(), "HTTP {$response->status()}");
        }

        $data = $response->json();

        if (! is_array($data) || ! empty($data['erro'])) {
            throw new CepNaoEncontradoException($cep);
        }

        return [
            'cep' => $this->formatarCep($data['cep'] ?? $cep),
            'logradouro' => $data['logradouro'] ?? '',
            'bairro' => $data['bairro'] ?? '',
            'cidade' => $data['localidade'] ?? '',
            'uf' => $data['uf'] ?? '',
        ];
    }

    public function nome(): string
    {
        return 'ViaCEP';
    }

    private function formatarCep(string $cep): string
    {
        $digitos = preg_replace('/\D/', '', $cep);

        return substr($digitos, 0, 5).'-'.substr($digitos, 5, 3);
    }
}
