# Cadastro de Clientes com Preenchimento Automatico de Endereco via CEP

Aplicacao fullstack para cadastro de clientes com preenchimento automatico de
endereco a partir do CEP. Projeto desenvolvido como teste tecnico de
desenvolvedor fullstack.

- **Backend:** Laravel 13 (PHP 8.3), API REST
- **Frontend:** React + Vite + TypeScript
- **Banco de dados:** MySQL 8
- **Infraestrutura:** Docker + Docker Compose

## Visao geral e decisoes de arquitetura

### Consulta de CEP: Correios com fallback para ViaCEP

O endpoint `GET /api/cep/{cep}` foi desenhado com o padrao **Strategy**: existe
uma interface `CepProviderInterface` (`backend/app/Services/CepProviders/`)
implementada por dois provedores, `CorreiosCepProvider` e `ViaCepProvider`. O
`CepService` recebe os provedores em ordem de prioridade e, ao consultar um
CEP, tenta cada um deles ate obter uma resposta - se um provedor falha por
motivo tecnico (timeout, HTTP 5xx, credenciais ausentes), o servico
automaticamente tenta o proximo.

**Por que o ViaCEP acaba sendo usado na pratica:** a API oficial dos Correios
(`api.correios.com.br`) exige um contrato ativo (cartao de postagem) para
autenticar via token - algo que nao e possivel obter no prazo de um teste
tecnico. O `CorreiosCepProvider` foi implementado seguindo o contrato real
dessa API (autenticacao via `POST /token/v1/autentica/cartaopostagem` e
consulta em `GET /cep/v2/enderecos/{cep}`), pronto para funcionar caso as
credenciais sejam configuradas via `CORREIOS_API_USUARIO` e
`CORREIOS_API_CARTAO_POSTAGEM`. Sem elas, o provedor falha de forma
controlada (sem sequer tentar a chamada HTTP) e o `CepService` cai
automaticamente para o `ViaCepProvider` - comportamento explicitamente
autorizado pelo enunciado do teste. Isso foi validado na pratica: o endpoint
publico de busca de CEP do site dos Correios esta atras de um WAF que exige
cookies de sessao de navegador, confirmando que nao ha uma via publica e
estavel para essa integracao sem contrato.

Essa arquitetura tambem faz uma escolha deliberada na desambiguacao de
respostas: se um provedor falha tecnicamente mas outro confirma
explicitamente que o CEP nao existe, o resultado final e "CEP nao
encontrado" (404) - a confirmacao positiva de um provedor que respondeu tem
prioridade sobre a falha tecnica de outro.

### Cache de consultas de CEP

Resultados de consultas bem-sucedidas sao armazenados via `Cache::remember`
por um TTL configuravel (`CEP_CACHE_TTL_HOURS`, padrao 24h), evitando
chamadas repetidas aos provedores externos para o mesmo CEP. Falhas nunca sao
cacheadas.

### Camadas do backend

`Controller` (fino, so orquestra) -> `Service` (regra de negocio) ->
`Model` (persistencia), com `Form Requests` para validacao e
`API Resources` para formatar respostas. Um exception handler customizado em
`bootstrap/app.php` garante que toda resposta de erro da API segue o mesmo
formato JSON (`{"message": "...", "errors": {...}}`), com o codigo HTTP
correto para cada tipo de erro.

### Frontend

Componentizacao simples (formulario, lista, item de lista, campo de
formulario reutilizavel), com uma camada de servicos isolada (`services/`)
para toda chamada HTTP - nenhum componente chama `axios` diretamente. Estado
gerenciado com `useState`/hooks locais e Contexts leves (toast, autenticacao)
em vez de uma biblioteca de estado global (Redux seria over-engineering para
o escopo deste projeto). A busca de CEP e feita por um hook dedicado
(`useCepLookup`) com debounce, e os campos preenchidos automaticamente
permanecem editaveis manualmente.

### Autenticacao: Sanctum com Bearer token, nao SPA/cookie

A API usa [Laravel Sanctum](https://laravel.com/docs/sanctum) no modo de
**tokens de API** (Bearer token no header `Authorization`), e nao no modo
SPA/cookie que o pacote tambem oferece. Essa escolha evita a complexidade de
CORS com `credentials: include` entre origens diferentes
(`localhost:5173` para o frontend, `localhost:8000` para a API) - nao ha
cookies de sessao envolvidos, nao ha CSRF token para gerenciar, e
`config/cors.php` fica com `supports_credentials => false`.

O token e devolvido pelo backend em `POST /api/register` e `POST /api/login`
e o frontend o guarda em `localStorage` (ver decisao de seguranca na secao
[Frontend](#autenticacao-no-frontend) abaixo). Todas as rotas de `clientes`
exigem o middleware `auth:sanctum`. A rota `GET /api/cep/{cep}` continua
**publica** de proposito: e apenas uma consulta de CEP, nao expoe dado
sensivel nem esta vinculada a um usuario, entao exigir login ali so
adicionaria atrito sem ganho de seguranca real.

Como a aplicacao e uma API pura (sem tela de login web), foi preciso
desabilitar explicitamente o redirecionamento padrao do Laravel para uma
rota `login` inexistente quando um convidado nao autenticado acessa uma rota
protegida sem enviar `Accept: application/json` (`bootstrap/app.php`,
`redirectGuestsTo`) - sem isso, esse cenario especifico resultava em erro
500 em vez de 401.

#### Autenticacao no frontend

O token fica em `localStorage` (`useAuth`/`AuthContext`,
`services/tokenStorage.ts`) e e anexado a toda requisicao por um interceptor
do Axios (`services/api.ts`). **Troca de seguranca consciente:**
`localStorage` e vulneravel a XSS (qualquer script injetado na pagina
consegue ler o token), mas e uma escolha aceitavel para o escopo deste
teste tecnico. Em uma aplicacao real, a alternativa mais segura seria um
cookie `httpOnly` emitido pelo backend (o que, por sua vez, exigiria voltar
ao modo SPA/cookie do Sanctum e lidar com CORS+credentials). Uma resposta
`401` de qualquer requisicao limpa o token automaticamente e redireciona
para `/login` (tratamento global no interceptor).

## Diferenciais implementados

- Cache de consultas de CEP (Laravel Cache, TTL configuravel).
- Fallback automatico entre dois provedores de CEP (Strategy pattern).
- Paginacao na listagem de clientes (backend e frontend).
- Testes automatizados: 27 testes (feature de CEP, clientes e autenticacao +
  unitarios do `CepService` mockando as chamadas HTTP com `Http::fake()`).
- Exception handler customizado com respostas JSON padronizadas.
- Mensagens de validacao traduzidas para portugues (`lang/pt_BR`).
- Autenticacao via Laravel Sanctum (Bearer token) protegendo as rotas de
  clientes, com registro, login, logout e sessao persistida no frontend.
- Coleção Postman pronta para uso (`postman/collection.json`).
- Script `setup.sh` para subir o ambiente completo com um unico comando.
- Instalacao do backend resiliente: `vendor/` isolado em volume Docker
  nomeado (fora do bind mount) e retry automatico do `composer install` no
  `entrypoint.sh`, evitando que uma falha de rede transiente deixe o
  container preso num loop de reinicio (ver [Problemas comuns](#problemas-comuns)).
- Pipeline de CI (GitHub Actions) rodando testes de backend e lint/typecheck/build
  do frontend a cada push/PR (ver secao [CI/CD](#cicd)).

## Pre-requisitos

- Docker
- Docker Compose (v2, `docker compose`)

Nenhuma dependencia adicional precisa ser instalada localmente - PHP, Node,
Composer e as dependencias do projeto rodam dentro dos containers.

## Como rodar

### Opcao 1: script automatizado

```bash
./setup.sh
```

O script copia os arquivos `.env` de exemplo (se ainda nao existirem), sobe
os containers, aguarda o MySQL ficar disponivel, instala as dependencias PHP,
gera a `APP_KEY` e roda as migrations.

### Opcao 2: passo a passo manual

```bash
# 1. Copiar os arquivos de ambiente
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 2. Subir os containers. O backend instala as dependencias PHP sozinho no
#    boot (composer install roda dentro do entrypoint.sh, com retry
#    automatico). Nao rode "composer install" manualmente depois deste
#    comando - dois processos do composer escrevendo em vendor/ ao mesmo
#    tempo pode corromper a instalacao.
docker compose up -d --build

# 3. Gerar a chave da aplicacao (espere o backend acabar de instalar as
#    dependencias; acompanhe com "docker compose logs -f backend" ate ver
#    "ready to handle connections" se o comando abaixo falhar de primeira)
docker compose exec backend php artisan key:generate

# 4. Rodar as migrations
docker compose exec backend php artisan migrate
```

### Acessando a aplicacao

| Servico  | URL                          |
| -------- | ----------------------------- |
| Frontend | http://localhost:5173         |
| API      | http://localhost:8000/api     |
| MySQL    | localhost:3306                |

As portas podem ser alteradas no `.env` da raiz (`NGINX_PORT`,
`FRONTEND_PORT`, `MYSQL_PORT`).

### Problemas comuns

- **Bad Gateway (502) logo apos subir os containers pela primeira vez**: o
  backend instala as dependencias PHP automaticamente no boot, o que leva
  alguns segundos. Espere e tente de novo, ou acompanhe com
  `docker compose logs -f backend` ate ver "ready to handle connections".
- **Erro do Composer durante a instalacao** (ex: `corrupted zip archive`,
  comum sob rede instavel): o `entrypoint.sh` tenta a instalacao novamente
  de forma automatica (ate 3 vezes) sem precisar de nenhuma acao manual. Se
  mesmo assim o container continuar reiniciando, force uma reinstalacao
  limpa removendo o volume de dependencias do backend:
  ```bash
  docker compose down
  docker volume ls | grep backend_vendor   # confirme o nome exato do volume
  docker volume rm <nome_do_volume_backend_vendor>
  docker compose up -d --build
  ```

## Endpoints da API

Todas as respostas de erro seguem o formato:

```json
{ "message": "Descricao do erro", "errors": { "campo": ["mensagem"] } }
```

(`errors` so aparece em erros de validacao, 422.)

### `GET /api/cep/{cep}`

Aceita CEP com ou sem hifen (`80010000` ou `80010-000`).

```bash
curl http://localhost:8000/api/cep/80010000
```

```json
{
  "cep": "80010-000",
  "logradouro": "Praca Tiradentes",
  "bairro": "Centro",
  "cidade": "Curitiba",
  "uf": "PR"
}
```

Erros: `400` (formato invalido), `404` (CEP nao encontrado), `502` (todos os
provedores indisponiveis). Rota publica - nao exige autenticacao (ver
decisao acima).

### Autenticacao

Todos os endpoints de `/api/clientes` abaixo exigem um Bearer token valido
no header `Authorization: Bearer {token}`, obtido em `/api/register` ou
`/api/login`.

#### `POST /api/register`

```bash
curl -X POST http://localhost:8000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Joao Silva",
    "email": "joao@example.com",
    "password": "senha123",
    "password_confirmation": "senha123"
  }'
```

Retorna `201`:

```json
{
  "user": { "id": 1, "name": "Joao Silva", "email": "joao@example.com" },
  "token": "1|abcdef123456..."
}
```

`422` em caso de validacao (nome obrigatorio, e-mail unico e valido, senha
com no minimo 8 caracteres e confirmada em `password_confirmation`).

#### `POST /api/login`

```bash
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{ "email": "joao@example.com", "password": "senha123" }'
```

Retorna `200` com o mesmo formato de `/register` (`{"user": {...}, "token": "..."}`).
Credenciais invalidas retornam `422` com uma mensagem generica
("As credenciais informadas nao conferem.") - a mesma mensagem tanto para
e-mail inexistente quanto para senha errada, para nao revelar se um e-mail
esta cadastrado. Limitado a 6 tentativas por minuto por IP (`throttle:6,1`);
excedendo isso, retorna `429`.

#### `POST /api/logout` (protegida)

```bash
curl -X POST http://localhost:8000/api/logout \
  -H "Authorization: Bearer {token}"
```

Revoga o token usado na propria requisicao. Retorna `204`.

#### `GET /api/me` (protegida)

```bash
curl http://localhost:8000/api/me -H "Authorization: Bearer {token}"
```

Retorna `200` com `{"user": {...}}` do usuario autenticado, ou `401` se o
token for invalido, ausente ou ja revogado.

### `GET /api/clientes` (protegida)

Lista paginada (15 por pagina). Aceita `?page=N`.

```bash
curl "http://localhost:8000/api/clientes?page=1" \
  -H "Authorization: Bearer {token}"
```

```json
{
  "data": [
    { "id": 1, "nome": "Joao Silva", "email": "joao@example.com", "cep": "01310-100", "...": "..." }
  ],
  "links": { "first": "...", "last": "...", "prev": null, "next": null },
  "meta": { "current_page": 1, "last_page": 1, "per_page": 15, "total": 1 }
}
```

### `POST /api/clientes` (protegida)

```bash
curl -X POST http://localhost:8000/api/clientes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "nome": "Joao Silva",
    "email": "joao@example.com",
    "cep": "01310-100",
    "logradouro": "Avenida Paulista",
    "numero": "1000",
    "complemento": "Ap 12",
    "bairro": "Bela Vista",
    "cidade": "Sao Paulo",
    "uf": "SP"
  }'
```

Retorna `201` com `{"data": {...}}`. Retorna `422` em caso de validacao
(campos obrigatorios: `nome`, `email`, `cep`, `logradouro`, `numero`,
`bairro`, `cidade`, `uf`; `complemento` e opcional; `email` deve ser unico).

### `PUT /api/clientes/{id}` (protegida)

Mesmo payload do `POST`. Retorna `200` com `{"data": {...}}`, `404` se o
cliente nao existir, `422` em caso de validacao.

### `DELETE /api/clientes/{id}` (protegida)

Retorna `204` sem corpo, ou `404` se o cliente nao existir.

Qualquer um dos 4 endpoints acima retorna `401` sem o header `Authorization`
ou com um token invalido/revogado.

Uma coleção pronta com todos os endpoints esta disponivel em
[`postman/collection.json`](postman/collection.json).

## Variaveis de ambiente

### Raiz (`.env`, usado pelo `docker-compose.yml`)

| Variavel             | Descricao                          | Padrao       |
| --------------------- | ----------------------------------- | ------------ |
| `NGINX_PORT`          | Porta do backend (via Nginx)        | `8000`       |
| `FRONTEND_PORT`       | Porta do frontend (Vite)            | `5173`       |
| `MYSQL_PORT`          | Porta do MySQL                      | `3306`       |
| `MYSQL_DATABASE`      | Nome do banco                       | `clientes_cep` |
| `MYSQL_USER`          | Usuario do banco                    | `laravel`    |
| `MYSQL_PASSWORD`      | Senha do usuario                    | `laravel`    |
| `MYSQL_ROOT_PASSWORD` | Senha do root                       | `root`       |

### Backend (`backend/.env`)

Alem das variaveis padrao do Laravel (`DB_*`, `APP_*`), destacam-se:

| Variavel                       | Descricao                                                   |
| ------------------------------- | ------------------------------------------------------------ |
| `CEP_CACHE_TTL_HOURS`           | TTL do cache de consultas de CEP, em horas (padrao `24`)     |
| `CORREIOS_API_USUARIO`          | Usuario da API dos Correios (opcional, ver decisao acima)    |
| `CORREIOS_API_CARTAO_POSTAGEM`  | Cartao de postagem da API dos Correios (opcional)            |
| `CORS_ALLOWED_ORIGINS`          | Origens autorizadas a consumir a API, separadas por virgula (padrao `http://localhost:5173`) |

### Frontend (`frontend/.env`)

| Variavel        | Descricao                  | Padrao                        |
| ---------------- | --------------------------- | ------------------------------ |
| `VITE_API_URL`   | URL base da API consumida   | `http://localhost:8000/api`   |

## Testes automatizados

```bash
docker compose exec backend php artisan test
```

Cobertura:

- `tests/Feature/CepControllerTest.php` - formato invalido, sucesso, CEP com
  hifen, nao encontrado, provedores indisponiveis.
- `tests/Feature/ClienteControllerTest.php` - listagem paginada, criacao,
  validacao, email duplicado, atualizacao, remocao, casos de 404. Autentica
  um usuario de teste (`Sanctum::actingAs`) antes de cada chamada, ja que as
  rotas exigem login.
- `tests/Feature/AuthControllerTest.php` - registro (sucesso, email
  duplicado, senha fraca/confirmacao incorreta), login (sucesso, credenciais
  invalidas sem revelar se o e-mail existe), logout revoga o token, rota
  protegida com/sem token.
- `tests/Unit/CepServiceTest.php` - validacao de formato, sucesso via
  ViaCEP, cache (nao repete chamada HTTP), fallback entre provedores, CEP
  nao encontrado, indisponibilidade de todos os provedores. Todas as
  chamadas HTTP externas sao mockadas com `Http::fake()`.

## CI/CD

### CI (implementado)

Workflow em [`.github/workflows/ci.yml`](.github/workflows/ci.yml), disparado em
todo push e pull request para `main`, com dois jobs independentes:

- **`backend`** - PHP 8.3, `composer install`, `php artisan test`. Nao depende de
  um servico MySQL no CI: os testes usam SQLite em memoria (configurado em
  `phpunit.xml`), entao rodam isolados e rapidos.
- **`frontend`** - Node 20, `npm ci`, lint (`oxlint`), type-check
  (`tsc -b --noEmit`) e build de producao (`vite build`), garantindo que o
  frontend compila sem erros antes de qualquer merge.

Nenhum desses arquivos entra em build de imagem Docker nem afeta o fluxo local
descrito em [Como rodar](#como-rodar) - o CI roda isolado nos runners do GitHub.

### CD (planejado, ainda nao implementado)

O plano e portar a aplicacao para uma VPS propria apos a entrega. Para isso,
ainda faltam:

1. Imagem de producao do backend com o codigo copiado e `composer install
   --no-dev` executado no build (hoje o Dockerfile depende de bind mount +
   `entrypoint.sh` para instalar dependencias no boot - correto para dev,
   errado para producao).
2. Build do frontend (`npm run build`, ja validado no CI) servido como
   estatico via Nginx, em vez do dev server do Vite usado hoje.
3. Uma variante de producao do `docker-compose.yml` (sem bind mounts,
   `APP_ENV=production`, `APP_DEBUG=false`, MySQL sem porta exposta
   publicamente).
4. Gestao de segredos (credenciais da VPS, `APP_KEY`, senhas de banco) como
   *secrets* do GitHub Actions, nunca em arquivo versionado.
5. HTTPS (Nginx + Let's Encrypt/Certbot, ou um proxy como Traefik/Caddy).
6. Um job `deploy` no workflow, condicionado aos jobs `backend`/`frontend`
   passarem, conectando via SSH e atualizando os containers na VPS.
7. Decisao sobre como rodar `php artisan migrate --force` em producao
   (automatico no deploy vs. passo manual).

## Estrutura de pastas

```
├── .github/workflows/ci.yml # Pipeline de CI (testes backend + build frontend)
├── docker-compose.yml       # Orquestra backend, nginx, frontend e mysql
├── docker/
│   ├── php/                 # Dockerfile do PHP-FPM + entrypoint
│   └── nginx/                # Configuracao do Nginx
├── backend/                  # API Laravel
│   ├── app/
│   │   ├── Http/Controllers/Api/   # Controllers finos (Auth, Cep, Cliente)
│   │   ├── Http/Requests/          # Form Requests (validacao, incl. Register/Login)
│   │   ├── Http/Resources/         # API Resources (formatacao de resposta)
│   │   ├── Services/                # CepService + providers (Strategy pattern)
│   │   ├── Models/                  # Eloquent models (Cliente, User)
│   │   └── Exceptions/              # Excecoes de dominio (CEP invalido/nao encontrado/indisponivel)
│   ├── database/migrations/
│   ├── lang/pt_BR/                  # Mensagens de validacao em portugues
│   └── tests/                       # Feature + Unit
├── frontend/                 # React + Vite + TypeScript
│   └── src/
│       ├── components/        # ClienteForm, ClienteList, FormField, Toast, ProtectedRoute
│       ├── contexts/           # AuthContext (usuario, token, login/logout)
│       ├── pages/              # CadastroPage, ListagemPage, EditarClientePage, Login, Register
│       ├── services/           # api.ts (interceptor Bearer), cepService.ts, clienteService.ts, authService.ts
│       ├── hooks/               # useCepLookup (busca com debounce)
│       └── types/                # Cliente, EnderecoCep, Pagination, Auth
├── postman/collection.json   # Colecao com os endpoints da API
└── setup.sh                  # Script de setup automatizado
```
