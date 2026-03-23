# Tech Spec - API Contracts

## Objetivo

Documentar os contratos publicos atuais das APIs internas usadas pela UI, preservando compatibilidade com o dashboard e com o fluxo de auth.

## Regras gerais

- Todos os contratos seguem os tipos compartilhados em `src/lib/types.ts`
- Os ids validos de time continuam limitados a `frontend` e `backend`
- O placar continua derivado de `matches`
- As APIs do placar exigem sessao autenticada no estado atual do codigo
- Sem sessao valida, `GET /api/scoreboard`, `GET /api/matches` e `POST /api/matches` retornam `401`
- O fallback em memoria de `src/lib/data.ts` continua existindo para o dominio, mas nao muda esse contrato HTTP protegido

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
  "password": "12345678"
}
```

Regras:

- validacao usa os schemas compartilhados de `src/lib/auth-validation.ts`
- `username` deve ser unico; `password` precisa ter no minimo 8 caracteres
- quando auth esta habilitado, falhas repetidas usam rate limit por `username + ip`

Sucesso:

- retorna `201`
- body:

```json
{
  "user": {
    "id": "uuid",
    "username": "gui"
  }
}
```

Erros:

- payload invalido retorna `400` com `fieldErrors` quando aplicavel
- conflito de username retorna `409`
- bloqueio temporario por rate limit retorna `429` com `retryAfterSeconds`
- auth indisponivel retorna `503` sem `DATABASE_URL`
- auth configurado de forma invalida retorna `500` quando falta `NEXTAUTH_SECRET`

Exemplo de bloqueio:

```json
{
  "error": "Muitas tentativas seguidas. Aguarde um pouco antes de tentar novamente.",
  "retryAfterSeconds": 900
}
```

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

- sem sessao valida retorna `401`

## `PUT /api/profile`

Requer sessao autenticada. Atualiza parcialmente o perfil do usuario logado (patch — apenas os campos enviados sao alterados).

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

- `displayName`: quando enviado, deve ter entre 2 e 50 caracteres
- `email`: quando enviado, deve ser email valido; aceita `null` para remover
- `avatarUrl`: quando enviado, deve ser URL valida (max 500 chars); aceita `null` para remover
- `bio`: quando enviado, max 200 chars; aceita `null` para remover
- campos ausentes no payload nao sao alterados

Sucesso:

- retorna `200` com o `ProfileResponse` completo atualizado

Erros:

- sem sessao valida retorna `401`
- payload invalido retorna `400` com `fieldErrors`

## Compatibilidade com a UI atual

- O dashboard busca `/api/scoreboard` e `/api/matches` separadamente
- Apos registrar vitoria, a UI reconsulta ambos os endpoints
- A UI atual pode enviar `note` opcional no `POST /api/matches`
- A UI atual renderiza `note` no historico quando esse dado ja existe
- Mudancas de wire shape exigem atualizacao coordenada entre API e dashboard
