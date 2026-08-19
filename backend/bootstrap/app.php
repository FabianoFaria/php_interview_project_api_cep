<?php

use App\Exceptions\CepInvalidoException;
use App\Exceptions\CepNaoEncontradoException;
use App\Exceptions\CepProviderIndisponivelException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        //
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        $exceptions->render(function (CepInvalidoException $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        });

        $exceptions->render(function (CepNaoEncontradoException $e) {
            return response()->json(['message' => $e->getMessage()], 404);
        });

        $exceptions->render(function (CepProviderIndisponivelException $e) {
            return response()->json([
                'message' => 'Nao foi possivel consultar o CEP no momento. Tente novamente mais tarde.',
            ], 502);
        });

        $exceptions->render(function (NotFoundHttpException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json(['message' => 'Recurso nao encontrado.'], 404);
            }
        });
    })->create();
