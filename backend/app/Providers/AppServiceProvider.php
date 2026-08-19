<?php

namespace App\Providers;

use App\Services\CepProviders\CorreiosCepProvider;
use App\Services\CepProviders\ViaCepProvider;
use App\Services\CepService;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(CepService::class, function ($app) {
            return new CepService(
                providers: [
                    new CorreiosCepProvider(
                        config('cep.correios.usuario'),
                        config('cep.correios.cartao_postagem'),
                    ),
                    $app->make(ViaCepProvider::class),
                ],
                cacheTtlHours: config('cep.cache_ttl_hours'),
            );
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
