<?php

return [

    'accepted' => 'O campo :attribute deve ser aceito.',
    'active_url' => 'O campo :attribute nao e uma URL valida.',
    'after' => 'O campo :attribute deve ser uma data posterior a :date.',
    'after_or_equal' => 'O campo :attribute deve ser uma data posterior ou igual a :date.',
    'alpha' => 'O campo :attribute deve conter apenas letras.',
    'alpha_dash' => 'O campo :attribute deve conter apenas letras, numeros, tracos e sublinhados.',
    'alpha_num' => 'O campo :attribute deve conter apenas letras e numeros.',
    'array' => 'O campo :attribute deve ser uma lista.',
    'before' => 'O campo :attribute deve ser uma data anterior a :date.',
    'before_or_equal' => 'O campo :attribute deve ser uma data anterior ou igual a :date.',
    'between' => [
        'array' => 'O campo :attribute deve ter entre :min e :max itens.',
        'file' => 'O campo :attribute deve ter entre :min e :max kilobytes.',
        'numeric' => 'O campo :attribute deve estar entre :min e :max.',
        'string' => 'O campo :attribute deve ter entre :min e :max caracteres.',
    ],
    'boolean' => 'O campo :attribute deve ser verdadeiro ou falso.',
    'confirmed' => 'A confirmacao do campo :attribute nao corresponde.',
    'date' => 'O campo :attribute nao e uma data valida.',
    'date_format' => 'O campo :attribute nao corresponde ao formato :format.',
    'different' => 'Os campos :attribute e :other devem ser diferentes.',
    'digits' => 'O campo :attribute deve ter :digits digitos.',
    'digits_between' => 'O campo :attribute deve ter entre :min e :max digitos.',
    'email' => 'O campo :attribute deve ser um endereco de e-mail valido.',
    'exists' => 'O valor selecionado para :attribute e invalido.',
    'image' => 'O campo :attribute deve ser uma imagem.',
    'in' => 'O valor selecionado para :attribute e invalido.',
    'integer' => 'O campo :attribute deve ser um numero inteiro.',
    'ip' => 'O campo :attribute deve ser um endereco IP valido.',
    'json' => 'O campo :attribute deve ser um JSON valido.',
    'max' => [
        'array' => 'O campo :attribute nao pode ter mais que :max itens.',
        'file' => 'O campo :attribute nao pode ser maior que :max kilobytes.',
        'numeric' => 'O campo :attribute nao pode ser maior que :max.',
        'string' => 'O campo :attribute nao pode ter mais que :max caracteres.',
    ],
    'mimes' => 'O campo :attribute deve ser um arquivo do tipo: :values.',
    'min' => [
        'array' => 'O campo :attribute deve ter pelo menos :min itens.',
        'file' => 'O campo :attribute deve ter pelo menos :min kilobytes.',
        'numeric' => 'O campo :attribute deve ser pelo menos :min.',
        'string' => 'O campo :attribute deve ter pelo menos :min caracteres.',
    ],
    'not_in' => 'O valor selecionado para :attribute e invalido.',
    'numeric' => 'O campo :attribute deve ser um numero.',
    'regex' => 'O formato do campo :attribute e invalido.',
    'required' => 'O campo :attribute e obrigatorio.',
    'required_if' => 'O campo :attribute e obrigatorio quando :other e :value.',
    'same' => 'Os campos :attribute e :other devem ser iguais.',
    'size' => [
        'array' => 'O campo :attribute deve conter :size itens.',
        'file' => 'O campo :attribute deve ter :size kilobytes.',
        'numeric' => 'O campo :attribute deve ser :size.',
        'string' => 'O campo :attribute deve ter :size caracteres.',
    ],
    'string' => 'O campo :attribute deve ser um texto.',
    'unique' => 'O :attribute informado ja esta em uso.',
    'url' => 'O campo :attribute deve ser uma URL valida.',

    /*
    |--------------------------------------------------------------------------
    | Custom Validation Attributes
    |--------------------------------------------------------------------------
    */
    'attributes' => [
        'nome' => 'nome',
        'email' => 'e-mail',
        'cep' => 'CEP',
        'logradouro' => 'logradouro',
        'numero' => 'numero',
        'complemento' => 'complemento',
        'bairro' => 'bairro',
        'cidade' => 'cidade',
        'uf' => 'UF',
    ],

];
