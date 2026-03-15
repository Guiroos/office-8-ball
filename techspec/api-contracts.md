# Tech Spec - API Contracts

## Objetivo

Documentar os contratos publicos atuais das APIs internas usadas pela UI, preservando compatibilidade com o dashboard e com o fluxo de auth.

## Regras gerais

- Todos os contratos seguem os tipos compartilhados em `src/lib/types.ts`
- Os ids validos de time continuam limitados a `frontend` e `backend`
- O placar continua derivado de `matches`
- Com auth disponivel, as APIs do placar exigem sessao autenticada

## `GET /api/scoreboard`

Sucesso:

- retorna `200`
- body:

```json
{
  "scoreboard": {
    "teams": [],
    "leaderTeamId": "frontend",
    "leadBy": 1,
    "totalMatches": 3,
    "currentStreak": {
      "teamId": "frontend",
      "teamName": "Frontend",
      "count": 2
    }
  }
}
```

Erro:

- sem sessao valida retorna `401`
- body:

```json
{
  "error": "Autenticacao obrigatoria."
}
```

## `GET /api/matches`

Sucesso:

- retorna `200`
- body:

```json
{
  "matches": []
}
```

Comportamento:

- retorna historico recente em ordem do mais novo para o mais antigo
- cada item inclui `id`, `winnerTeamId`, `winnerName`, `winnerRoster`, `playedAt` e `note`

Erro:

- sem sessao valida retorna `401`

## `POST /api/matches`

Payload:

```json
{
  "winnerTeamId": "frontend",
  "note": "optional"
}
```

Regras:

- `winnerTeamId` deve ser `frontend` ou `backend`
- `note` e opcional
- `note`, quando enviado, deve ser string com no maximo 140 caracteres
- `note` e normalizado com trim e vazio vira `null` na persistencia

Sucesso:

- retorna `201`
- body segue `CreateMatchResponse`
- inclui `match` criado e `message`

Erros:

- sem sessao valida retorna `401`
- payload invalido retorna `400`

## `POST /api/auth/register`

Payload:

```json
{
  "username": "gui",
  "email": "gui@example.com",
  "password": "12345678"
}
```

Regras:

- validacao usa os schemas compartilhados de `src/lib/auth-validation.ts`
- email e username devem ser unicos

Sucesso:

- retorna `201`
- body:

```json
{
  "user": {
    "id": "uuid",
    "username": "gui",
    "email": "gui@example.com"
  }
}
```

Erros:

- payload invalido retorna `400` com `fieldErrors` quando aplicavel
- conflito de email ou username retorna `409`
- auth indisponivel retorna `503` sem `DATABASE_URL`
- auth configurado de forma invalida retorna `500` quando falta `NEXTAUTH_SECRET`

## Compatibilidade com a UI atual

- O dashboard busca `/api/scoreboard` e `/api/matches` separadamente
- Apos registrar vitoria, a UI reconsulta ambos os endpoints
- A UI atual ainda nao envia `note`, embora a API aceite esse campo
- Mudancas de wire shape exigem atualizacao coordenada entre API e dashboard
