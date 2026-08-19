<?php

namespace App\Services\CepProviders;

use App\Exceptions\CepNaoEncontradoException;
use App\Exceptions\CepProviderIndisponivelException;

interface CepProviderInterface
{
    /**
     * Consulta o endereco de um CEP (ja normalizado, apenas digitos).
     *
     * @return array{cep: string, logradouro: string, bairro: string, cidade: string, uf: string}
     *
     * @throws CepNaoEncontradoException quando o provedor responde que o CEP nao existe
     * @throws CepProviderIndisponivelException quando o provedor falha por motivo tecnico
     */
    public function find(string $cep): array;

    /**
     * Nome do provedor, usado em logs e mensagens de erro.
     */
    public function nome(): string;
}
