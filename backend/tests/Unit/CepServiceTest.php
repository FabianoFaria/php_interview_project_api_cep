<?php

namespace Tests\Unit;

use App\Exceptions\CepInvalidoException;
use App\Exceptions\CepNaoEncontradoException;
use App\Exceptions\CepProviderIndisponivelException;
use App\Services\CepProviders\CorreiosCepProvider;
use App\Services\CepProviders\ViaCepProvider;
use App\Services\CepService;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class CepServiceTest extends TestCase
{
    private function makeService(?string $correiosUsuario = null, ?string $correiosCartao = null): CepService
    {
        return new CepService(
            providers: [
                new CorreiosCepProvider($correiosUsuario, $correiosCartao),
                new ViaCepProvider,
            ],
            cacheTtlHours: 24,
        );
    }

    private function fakeViaCepResponse(): array
    {
        return [
            'cep' => '01310-100',
            'logradouro' => 'Avenida Paulista',
            'bairro' => 'Bela Vista',
            'localidade' => 'Sao Paulo',
            'uf' => 'SP',
        ];
    }

    public function test_cep_com_formato_invalido_lanca_excecao_sem_chamar_http(): void
    {
        Http::fake();

        $this->expectException(CepInvalidoException::class);

        try {
            $this->makeService()->buscar('123');
        } finally {
            Http::assertNothingSent();
        }
    }

    public function test_busca_com_sucesso_via_viacep_quando_correios_nao_esta_configurado(): void
    {
        Http::fake([
            'viacep.com.br/*' => Http::response($this->fakeViaCepResponse()),
        ]);

        $resultado = $this->makeService()->buscar('01310100');

        $this->assertSame([
            'cep' => '01310-100',
            'logradouro' => 'Avenida Paulista',
            'bairro' => 'Bela Vista',
            'cidade' => 'Sao Paulo',
            'uf' => 'SP',
        ], $resultado);

        Http::assertSentCount(1);
    }

    public function test_resultado_e_cacheado_e_nao_repete_chamada_http_para_o_mesmo_cep(): void
    {
        Http::fake([
            'viacep.com.br/*' => Http::response($this->fakeViaCepResponse()),
        ]);

        $service = $this->makeService();

        $service->buscar('01310-100');
        $service->buscar('01310100');

        Http::assertSentCount(1);
    }

    public function test_faz_fallback_para_viacep_quando_correios_falha(): void
    {
        Http::fake([
            'api.correios.com.br/token/*' => Http::response(null, 500),
            'viacep.com.br/*' => Http::response($this->fakeViaCepResponse()),
        ]);

        $resultado = $this->makeService('usuario-teste', 'cartao-teste')->buscar('01310100');

        $this->assertSame('SP', $resultado['uf']);

        Http::assertSent(fn ($request) => str_contains($request->url(), 'api.correios.com.br'));
        Http::assertSent(fn ($request) => str_contains($request->url(), 'viacep.com.br'));
    }

    public function test_cep_nao_encontrado_quando_provedor_confirma_inexistencia(): void
    {
        Http::fake([
            'viacep.com.br/*' => Http::response(['erro' => 'true']),
        ]);

        $this->expectException(CepNaoEncontradoException::class);

        $this->makeService()->buscar('99999999');
    }

    public function test_lanca_indisponibilidade_quando_todos_os_provedores_falham(): void
    {
        Http::fake([
            'viacep.com.br/*' => Http::response(null, 500),
        ]);

        $this->expectException(CepProviderIndisponivelException::class);

        $this->makeService()->buscar('01310100');
    }
}
