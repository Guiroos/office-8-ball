# Tech Spec - Scoreboard

## Objetivo

Documentar o dominio de partidas e placar, os contratos atuais e as invariantes que nao devem ser quebradas em mudancas futuras.

## Dominio atual

Os times sao dinamicos e criados pelos usuarios. Nao existem IDs fixos de time no codigo.

Os dados persistidos relevantes hoje sao:

- `teams`
- `team_members`
- `matches`

O placar exibido na UI continua sendo derivado de `matches`.

## Invariantes de negocio

- `winnerTeamId` deve ser um dos dois times da partida
- `teamAId` e `teamBId` devem ser diferentes
- os dois times precisam existir
- os dois times precisam estar com status `active` para registrar uma partida
- o usuario autenticado precisa ser membro de pelo menos um dos dois times
- `note`, quando presente, deve ter no maximo 140 caracteres
- `note` deve ser normalizado com `trim()` e vazio deve virar `null`
- `leaderTeamId` deve ser `null` em empate
- `leadBy` deve ser a diferenca absoluta entre as vitorias
- o historico exibido deve vir do mais novo para o mais antigo
- `getScoreboard()` precisa buscar todas as partidas relevantes; nao pode limitar o calculo do placar para a UI

## APIs atuais

### `GET /api/scoreboard`

Retorna o agregado do placar do usuario autenticado, incluindo:

- total de vitorias por time
- total de derrotas por time
- lider atual
- diferenca de vitorias
- total de partidas consideradas

Comportamento atual:

- sem `DATABASE_URL`, retorna `503`
- sem sessao valida, retorna `401`
- com sessao valida, retorna `200`

### `GET /api/matches`

Retorna o historico de partidas visivel para o usuario autenticado em ordem decrescente por data.

Cada item atual inclui:

- `id`
- `teamAId`
- `teamBId`
- `winnerTeamId`
- `loserTeamId`
- `playedAt`
- `note`

Comportamento atual:

- sem `DATABASE_URL`, retorna `503`
- sem sessao valida, retorna `401`
- com sessao valida, retorna `200`

### `POST /api/matches`

Payload atual:

```json
{
  "teamAId": "team-a",
  "teamBId": "team-b",
  "winnerTeamId": "team-a",
  "note": "optional"
}
```

Comportamento atual:

- valida shape com Zod
- garante que `teamAId` e `teamBId` sejam diferentes
- garante que `winnerTeamId` seja um dos dois times informados
- garante que os dois times existam
- garante que os dois times estejam ativos
- exige que o usuario autenticado seja membro de pelo menos um dos times
- persiste a partida
- revalida `/ranking` e `/times`

## Fluxo atual da UI

- a area autenticada consome `/api/scoreboard` e `/api/matches`
- o fluxo de registrar partida vive em `/partida`
- `note` e opcional no registro de partida
- `note` aparece no historico quando presente
- nao existe desfazer/exclusao de partida no estado atual

## Persistencia

- Com `DATABASE_URL`:
  - leitura e escrita via Prisma/Postgres
- Sem `DATABASE_URL`:
  - o runtime autenticado fica indisponivel
  - nao existe fallback em memoria para persistencia compartilhada de partidas

## Gaps conhecidos

- `POST /api/matches` ainda nao tem rate limit proprio
- nao existe undo/exclusao curta para o ultimo registro
- a exibicao do historico ainda nao tem paginacao
- a cobertura integrada com banco real ainda pode aumentar

## Proximos cuidados

- preservar compatibilidade entre API e UI em qualquer mudanca de contrato
- continuar tratando o placar como derivado, nao como estado salvo separadamente
- nao reintroduzir times hardcoded no dominio
