<?php

namespace App\Exceptions;

use RuntimeException;

class CepNaoEncontradoException extends RuntimeException
{
    public function __construct(string $cep)
    {
        parent::__construct("CEP \"{$cep}\" nao foi encontrado.");
    }
}
