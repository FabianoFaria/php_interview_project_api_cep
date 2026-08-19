<?php

namespace App\Exceptions;

use InvalidArgumentException;

class CepInvalidoException extends InvalidArgumentException
{
    public function __construct(string $cep)
    {
        parent::__construct("O CEP informado \"{$cep}\" e invalido. Informe 8 digitos, com ou sem hifen.");
    }
}
