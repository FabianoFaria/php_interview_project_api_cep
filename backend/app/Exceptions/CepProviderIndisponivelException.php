<?php

namespace App\Exceptions;

use RuntimeException;
use Throwable;

/**
 * Lancada quando um provedor de CEP falha por motivo tecnico (timeout,
 * conexao, erro HTTP 5xx, resposta invalida). Diferente de
 * CepNaoEncontradoException, que representa uma resposta explicita de
 * "CEP inexistente" por parte do provedor.
 */
class CepProviderIndisponivelException extends RuntimeException
{
    public function __construct(string $provider, string $motivo, ?Throwable $previous = null)
    {
        parent::__construct("Provedor de CEP \"{$provider}\" indisponivel: {$motivo}", previous: $previous);
    }
}
