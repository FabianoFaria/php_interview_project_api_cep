<?php

use App\Http\Controllers\Api\CepController;
use App\Http\Controllers\Api\ClienteController;
use Illuminate\Support\Facades\Route;

Route::get('/cep/{cep}', [CepController::class, 'show']);

Route::apiResource('clientes', ClienteController::class)->except(['show']);
