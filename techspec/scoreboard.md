# Tech Spec - Scoreboard

## Objetivo

Documentar o dominio do placar, os contratos atuais e as invariantes que nao devem ser quebradas em mudancas futuras.

## Dominio atual

Os times validos em v1 sao fixos:

- `frontend`
- `backend`

Os dados persistidos relevantes hoje sao:

- `teams`
- `matches`

O placar exibido na UI e sempre derivado de `matches`.

## Invariantes de negocio

- `winnerTeamId` deve ser `frontend` ou `backend`
- `note`, quando presente, deve ter no maximo 140 caracteres
- `note` deve ser normalizado com trim e vazio deve virar `null`
- `leaderTeamId` deve ser `null` em empate
- `leadBy` deve ser a diferenca absoluta entre as vitorias
- `currentStreak` deve refletir as vitorias consecutivas mais recentes do ultimo vencedor
- Historico recente deve ser retornado do mais novo para o mais antigo

## APIs atuais

### `GET /api/scoreboard`

Retorna o agregado do placar, incluindo:

- total de vitorias por time
- lider atual
- streak atual
- diferenca de vitorias

### `GET /api/matches`

Retorna partidas recentes em ordem decrescente por data.

### `POST /api/matches`

Payload:

```json
{
  "winnerTeamId": "frontend",
  "note": "optional"
}
```

Comportamento:

- valida `winnerTeamId`
- aceita `note` opcional
- persiste a partida
- retorna erro claro em caso de falha

## Fluxo atual da UI

- A dashboard faz fetch de `/api/scoreboard` e `/api/matches`
- Ao registrar uma vitoria, a UI reconsulta ambos os endpoints
- Nao existe update otimista antes da persistencia concluir
- A UI atual expõe um campo opcional de `note` em cada card de time no fluxo de registrar vitoria
- A UI atual renderiza `note` no historico recente quando esse dado existe

## Persistencia

- Com `DATABASE_URL`:
  - leitura e escrita via Prisma/Postgres
- Sem `DATABASE_URL`:
  - fallback em memoria, apenas para desenvolvimento local

## Gaps conhecidos

- Nao ha testes com banco real cobrindo o fluxo completo de scoreboard
- O modelo segue fixo em dois times globais

## Proximos passos relacionados

- Refinar a UX de `note` no registro apenas se isso trouxer ganho real de uso
- Preservar compatibilidade entre API e dashboard em qualquer mudanca de contrato
- Continuar tratando o placar como derivado, nao como estado salvo separadamente
