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
gerenciado com `useState`/hooks locais e um `Context` leve apenas para o
sistema de notificacoes (toast), evitando bibliotecas de estado global
desnecessarias para o escopo do projeto (Redux seria over-engineering aqui).
A busca de CEP e feita por um hook dedicado (`useCepLookup`) com debounce,
que os campos preenchidos automaticamente permanecem editaveis manualmente.

## Diferenciais implementados

- Cache de consultas de CEP (Laravel Cache, TTL configuravel).
- Fallback automatico entre dois provedores de CEP (Strategy pattern).
- Paginacao na listagem de clientes (backend e frontend).
- Testes automatizados: 5 testes de feature para os 5 endpoints + 6 testes
  unitarios do `CepService` mockando as chamadas HTTP com `Http::fake()`.
- Exception handler customizado com respostas JSON padronizadas.
- Mensagens de validacao traduzidas para portugues (`lang/pt_BR`).
- Coleção Postman pronta para uso (`postman/collection.json`).
- Script `setup.sh` para subir o ambiente completo com um unico comando.
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

# 2. Subir os containers
docker compose up -d --build

# 3. Instalar dependencias PHP e gerar a chave da aplicacao
docker compose exec backend composer install
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
provedores indisponiveis).

### `GET /api/clientes`

Lista paginada (15 por pagina). Aceita `?page=N`.

```bash
curl http://localhost:8000/api/clientes?page=1
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

### `POST /api/clientes`

```bash
curl -X POST http://localhost:8000/api/clientes \
  -H "Content-Type: application/json" \
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

### `PUT /api/clientes/{id}`

Mesmo payload do `POST`. Retorna `200` com `{"data": {...}}`, `404` se o
cliente nao existir, `422` em caso de validacao.

### `DELETE /api/clientes/{id}`

Retorna `204` sem corpo, ou `404` se o cliente nao existir.

Uma coleção pronta com os 5 endpoints esta disponivel em
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
  validacao, email duplicado, atualizacao, remocao, casos de 404.
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
│   │   ├── Http/Controllers/Api/   # Controllers finos (CepController, ClienteController)
│   │   ├── Http/Requests/          # Form Requests (validacao)
│   │   ├── Http/Resources/         # API Resources (formatacao de resposta)
│   │   ├── Services/                # CepService + providers (Strategy pattern)
│   │   ├── Models/                  # Eloquent models
│   │   └── Exceptions/              # Excecoes de dominio (CEP invalido/nao encontrado/indisponivel)
│   ├── database/migrations/
│   ├── lang/pt_BR/                  # Mensagens de validacao em portugues
│   └── tests/                       # Feature + Unit
├── frontend/                 # React + Vite + TypeScript
│   └── src/
│       ├── components/        # ClienteForm, ClienteList, FormField, Toast
│       ├── pages/              # CadastroPage, ListagemPage, EditarClientePage
│       ├── services/           # api.ts, cepService.ts, clienteService.ts
│       ├── hooks/               # useCepLookup (busca com debounce)
│       └── types/                # Cliente, EnderecoCep, Pagination
├── postman/collection.json   # Colecao com os 5 endpoints
└── setup.sh                  # Script de setup automatizado
```
