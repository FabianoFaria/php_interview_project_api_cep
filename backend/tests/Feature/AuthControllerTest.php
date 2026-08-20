<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_registra_usuario_com_sucesso(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Joao Silva',
            'email' => 'joao@example.com',
            'password' => 'senha123',
            'password_confirmation' => 'senha123',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('user.email', 'joao@example.com')
            ->assertJsonStructure(['user' => ['id', 'name', 'email'], 'token']);

        $this->assertDatabaseHas('users', ['email' => 'joao@example.com']);
    }

    public function test_nao_registra_usuario_com_email_duplicado(): void
    {
        User::factory()->create(['email' => 'duplicado@example.com']);

        $this->postJson('/api/register', [
            'name' => 'Outro',
            'email' => 'duplicado@example.com',
            'password' => 'senha123',
            'password_confirmation' => 'senha123',
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_nao_registra_usuario_com_senha_fraca_ou_confirmacao_incorreta(): void
    {
        $this->postJson('/api/register', [
            'name' => 'Joao Silva',
            'email' => 'joao@example.com',
            'password' => '123',
            'password_confirmation' => '456',
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }

    public function test_login_com_sucesso_retorna_token(): void
    {
        $user = User::factory()->create(['password' => Hash::make('senha123')]);

        $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'senha123',
        ])
            ->assertStatus(200)
            ->assertJsonStructure(['user' => ['id', 'name', 'email'], 'token']);
    }

    public function test_login_com_credenciais_invalidas_nao_revela_se_email_existe(): void
    {
        $user = User::factory()->create(['password' => Hash::make('senha123')]);

        $comSenhaErrada = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'senha-errada',
        ]);

        $comEmailInexistente = $this->postJson('/api/login', [
            'email' => 'nao-existe@example.com',
            'password' => 'qualquer-senha',
        ]);

        $comSenhaErrada->assertStatus(422)->assertJsonValidationErrors(['email']);
        $comEmailInexistente->assertStatus(422)->assertJsonValidationErrors(['email']);
        $this->assertSame(
            $comSenhaErrada->json('message'),
            $comEmailInexistente->json('message')
        );
    }

    public function test_logout_revoga_o_token_atual(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('api-token')->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/logout')
            ->assertStatus(204);

        $this->assertDatabaseCount('personal_access_tokens', 0);

        // O guard "sanctum" memoriza o usuario resolvido na primeira chamada
        // (Illuminate\Auth\RequestGuard::user() cacheia em $this->user). Como
        // os testes reutilizam a mesma aplicacao/container entre chamadas
        // simuladas (diferente de producao, onde cada requisicao PHP-FPM e
        // um processo novo), e preciso forcar o guard a resolver de novo
        // para validar que o token revogado de fato deixa de autenticar.
        Auth::forgetGuards();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/me')
            ->assertStatus(401);
    }

    public function test_rota_protegida_sem_token_retorna_401(): void
    {
        $this->getJson('/api/me')->assertStatus(401);
    }

    public function test_rota_protegida_com_token_valido_retorna_200(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('api-token')->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/me')
            ->assertStatus(200)
            ->assertJsonPath('user.id', $user->id);
    }
}
