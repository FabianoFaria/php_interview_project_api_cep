<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cache de consultas de CEP
    |--------------------------------------------------------------------------
    |
    | TTL (em horas) que o resultado de uma consulta de CEP fica em cache,
    | evitando chamadas repetidas aos provedores externos para o mesmo CEP.
    |
    */
    'cache_ttl_hours' => (int) env('CEP_CACHE_TTL_HOURS', 24),

    /*
    |--------------------------------------------------------------------------
    | Credenciais da API oficial dos Correios
    |--------------------------------------------------------------------------
    |
    | A API oficial dos Correios (api.correios.com.br) exige um contrato
    | ativo (cartao de postagem) para gerar token de acesso. Sem essas
    | credenciais, o CorreiosCepProvider falha de forma controlada e o
    | CepService faz fallback automatico para o ViaCepProvider.
    |
    */
    'correios' => [
        'usuario' => env('CORREIOS_API_USUARIO'),
        'cartao_postagem' => env('CORREIOS_API_CARTAO_POSTAGEM'),
    ],

];
