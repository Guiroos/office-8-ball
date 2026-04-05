# Tech Spec - API Contracts

## Objetivo

Documentar os contratos publicos atuais das APIs internas usadas pela UI, preservando compatibilidade com o fluxo autenticado e com os tipos compartilhados em `src/lib/types.ts`.

## Regras gerais

- todos os contratos seguem os tipos compartilhados em `src/lib/types.ts`
- o placar continua derivado de `matches`
- rotas protegidas dependentes de banco retornam `503` quando `DATABASE_URL` nao existe
- rotas protegidas retornam `401` quando nao ha sessao valida
- `POST /api/auth/register` retorna `500` quando `DATABASE_URL` existe mas `BETTER_AUTH_SECRET` esta ausente
- nao existe fallback em memoria para o contrato HTTP autenticado

## `GET /api/scoreboard`

Sucesso:

- retorna `200`
- body:

```json
{
  "scoreboard": {
    "teams": [
      {
        "id": "team-a",
        "wins": 3,
        "losses": 1
      }
    ],
    "leaderTeamId": "team-a",
    "leadBy": 1,
    "totalMatches": 4
  }
}
```

Erros:

- sem `DATABASE_URL` retorna `503`
- sem sessao valida retorna `401`

## `GET /api/matches`

Sucesso:

- retorna `200`
- body:

```json
{
  "matches": [
    {
      "id": "match-1",
      "teamAId": "team-a",
      "teamBId": "team-b",
      "winnerTeamId": "team-a",
      "loserTeamId": "team-b",
      "playedAt": "2026-04-05T18:30:00.000Z",
      "note": "Partida equilibrada"
    }
  ]
}
```

Comportamento:

- retorna historico em ordem do mais novo para o mais antigo
- so inclui partidas dos times aos quais o usuario pertence

Erros:

- sem `DATABASE_URL` retorna `503`
- sem sessao valida retorna `401`

## `POST /api/matches`

Payload:

```json
{
  "teamAId": "team-a",
  "teamBId": "team-b",
  "winnerTeamId": "team-a",
  "note": "optional"
}
```

Regras:

- `teamAId` e `teamBId` sao obrigatorios
- `winnerTeamId` e obrigatorio e deve ser um dos dois times informados
- `teamAId` e `teamBId` nao podem ser iguais
- `note` e opcional e deve ter no maximo 140 caracteres
- os dois times precisam existir
- os dois times precisam estar ativos
- o usuario autenticado precisa ser membro de pelo menos um dos dois times

Sucesso:

- retorna `201`
- body segue `CreateMatchResponse`

```json
{
  "match": {
    "id": "match-1",
    "teamAId": "team-a",
    "teamBId": "team-b",
    "winnerTeamId": "team-a",
    "loserTeamId": "team-b",
    "playedAt": "2026-04-05T18:30:00.000Z",
    "note": "optional"
  }
}
```

Erros:

- sem `DATABASE_URL` retorna `503`
- sem sessao valida retorna `401`
- payload invalido retorna `400`
- usuario fora dos times retorna `403`
- time inexistente retorna `404`
- time inativo retorna `422`

## `POST /api/auth/register`

Payload:

```json
{
  "username": "gui",
  "password": "12345678"
}
```

Regras:

- validacao usa os schemas compartilhados de `src/lib/auth-validation.ts`
- `username` deve ser unico
- `password` precisa atender as regras compartilhadas de validacao
- falhas repetidas usam rate limit por `action + username + ip`

Sucesso:

- retorna `201`
- body:

```json
{
  "user": {
    "id": "uuid",
    "username": "gui",
    "displayName": null,
    "avatarUrl": null
  }
}
```

Erros:

- payload invalido retorna `400` com `fieldErrors` quando aplicavel
- conflito de username retorna `409`
- bloqueio temporario por rate limit retorna `429` com `retryAfterSeconds`
- auth indisponivel retorna `503` sem `DATABASE_URL`
- auth configurado de forma invalida retorna `500` quando falta `BETTER_AUTH_SECRET`

## `GET /api/profile`

Requer sessao autenticada. Retorna os dados do perfil do usuario logado.

Sucesso:

- retorna `200`
- body:

```json
{
  "id": "uuid",
  "username": "gui",
  "email": "gui@example.com",
  "displayName": "Gui",
  "avatarUrl": "https://example.com/avatar.png",
  "bio": "Desenvolvedor full-stack.",
  "createdAt": "2026-03-22T00:00:00.000Z"
}
```

Os campos `email`, `displayName`, `avatarUrl` e `bio` podem ser `null`.

Erros:

- sem `DATABASE_URL` retorna `503`
- sem sessao valida retorna `401`
- usuario sem perfil correspondente retorna `404`

## `PUT /api/profile`

Requer sessao autenticada. Atualiza parcialmente o perfil do usuario logado.

Payload (todos os campos sao opcionais):

```json
{
  "displayName": "Gui",
  "email": "gui@example.com",
  "avatarUrl": "https://example.com/avatar.png",
  "bio": "Desenvolvedor full-stack."
}
```

Regras:

- `displayName`: quando enviado, deve ter entre 2 e 50 caracteres; aceita `null`
- `email`: quando enviado, deve ser email valido; aceita `null` para remover
- `avatarUrl`: quando enviado, deve ser URL valida; aceita `null` para remover
- `bio`: quando enviado, deve ter no maximo 200 caracteres; aceita `null`
- email duplicado de outro usuario retorna conflito
- campos ausentes no payload nao sao alterados

Sucesso:

- retorna `200` com o `ProfileResponse` completo atualizado

Erros:

- sem `DATABASE_URL` retorna `503`
- sem sessao valida retorna `401`
- payload invalido retorna `400`
- email em uso retorna `409`

## Compatibilidade com a UI atual

- a UI autenticada busca `/api/scoreboard` e `/api/matches`
- apos registrar partida, a UI reconsulta os endpoints afetados
- a UI atual pode enviar `note` opcional em `POST /api/matches`
- mudancas de wire shape exigem atualizacao coordenada entre API e consumidores
