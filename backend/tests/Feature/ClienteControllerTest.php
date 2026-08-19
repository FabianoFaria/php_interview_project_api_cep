<?php

namespace Tests\Feature;

use App\Models\Cliente;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ClienteControllerTest extends TestCase
{
    use RefreshDatabase;

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'nome' => 'Joao Silva',
            'email' => 'joao@example.com',
            'cep' => '01310-100',
            'logradouro' => 'Avenida Paulista',
            'numero' => '1000',
            'complemento' => 'Ap 12',
            'bairro' => 'Bela Vista',
            'cidade' => 'Sao Paulo',
            'uf' => 'SP',
        ], $overrides);
    }

    public function test_lista_clientes_paginados(): void
    {
        Cliente::factory()->count(3)->create();

        $this->getJson('/api/clientes')
            ->assertStatus(200)
            ->assertJsonCount(3, 'data')
            ->assertJsonStructure(['data', 'links', 'meta']);
    }

    public function test_cria_cliente_com_sucesso(): void
    {
        $this->postJson('/api/clientes', $this->payload())
            ->assertStatus(201)
            ->assertJsonPath('data.nome', 'Joao Silva')
            ->assertJsonPath('data.email', 'joao@example.com');

        $this->assertDatabaseHas('clientes', ['email' => 'joao@example.com']);
    }

    public function test_nao_cria_cliente_com_dados_invalidos(): void
    {
        $this->postJson('/api/clientes', $this->payload(['nome' => '', 'email' => 'invalido']))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['nome', 'email']);
    }

    public function test_nao_cria_cliente_com_email_duplicado(): void
    {
        Cliente::factory()->create(['email' => 'duplicado@example.com']);

        $this->postJson('/api/clientes', $this->payload(['email' => 'duplicado@example.com']))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_atualiza_cliente_existente(): void
    {
        $cliente = Cliente::factory()->create();

        $this->putJson("/api/clientes/{$cliente->id}", $this->payload(['nome' => 'Nome Atualizado']))
            ->assertStatus(200)
            ->assertJsonPath('data.nome', 'Nome Atualizado');

        $this->assertDatabaseHas('clientes', ['id' => $cliente->id, 'nome' => 'Nome Atualizado']);
    }

    public function test_retorna_404_ao_atualizar_cliente_inexistente(): void
    {
        $this->putJson('/api/clientes/999', $this->payload())
            ->assertStatus(404);
    }

    public function test_remove_cliente_existente(): void
    {
        $cliente = Cliente::factory()->create();

        $this->deleteJson("/api/clientes/{$cliente->id}")
            ->assertStatus(204);

        $this->assertDatabaseMissing('clientes', ['id' => $cliente->id]);
    }

    public function test_retorna_404_ao_remover_cliente_inexistente(): void
    {
        $this->deleteJson('/api/clientes/999')
            ->assertStatus(404);
    }
}
