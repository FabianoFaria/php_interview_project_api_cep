<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class CepControllerTest extends TestCase
{
    public function test_retorna_400_para_cep_com_formato_invalido(): void
    {
        $this->getJson('/api/cep/123')
            ->assertStatus(400)
            ->assertJsonStructure(['message']);
    }

    public function test_retorna_endereco_para_cep_valido(): void
    {
        Http::fake([
            'viacep.com.br/*' => Http::response([
                'cep' => '80010-000',
                'logradouro' => 'Praca Tiradentes',
                'bairro' => 'Centro',
                'localidade' => 'Curitiba',
                'uf' => 'PR',
            ]),
        ]);

        $this->getJson('/api/cep/80010000')
            ->assertStatus(200)
            ->assertJson([
                'cep' => '80010-000',
                'logradouro' => 'Praca Tiradentes',
                'bairro' => 'Centro',
                'cidade' => 'Curitiba',
                'uf' => 'PR',
            ]);
    }

    public function test_aceita_cep_com_hifen(): void
    {
        Http::fake([
            'viacep.com.br/*' => Http::response([
                'cep' => '80010-000',
                'logradouro' => 'Praca Tiradentes',
                'bairro' => 'Centro',
                'localidade' => 'Curitiba',
                'uf' => 'PR',
            ]),
        ]);

        $this->getJson('/api/cep/80010-000')->assertStatus(200);
    }

    public function test_retorna_404_quando_cep_nao_existe(): void
    {
        Http::fake([
            'viacep.com.br/*' => Http::response(['erro' => 'true']),
        ]);

        $this->getJson('/api/cep/99999999')
            ->assertStatus(404)
            ->assertJsonStructure(['message']);
    }

    public function test_retorna_502_quando_todos_os_provedores_estao_indisponiveis(): void
    {
        Http::fake([
            'viacep.com.br/*' => Http::response(null, 500),
        ]);

        $this->getJson('/api/cep/80010000')
            ->assertStatus(502)
            ->assertJsonStructure(['message']);
    }
}
