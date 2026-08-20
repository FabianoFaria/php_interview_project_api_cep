<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CepController;
use App\Http\Controllers\Api\ClienteController;
use Illuminate\Support\Facades\Route;

// Consulta de CEP e publica de proposito: nao expoe dado sensivel nem
// vinculado a um usuario, entao nao ha motivo para exigir autenticacao aqui.
Route::get('/cep/{cep}', [CepController::class, 'show']);

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:6,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    Route::apiResource('clientes', ClienteController::class)->except(['show']);
});
