# Requirements: Office Sinuca Tracker

**Defined:** 2026-03-23
**Core Value:** O ranking de times sempre atualizado — qualquer colega abre o app e vê imediatamente quem está ganhando.

## v1 Requirements

### Times

- [x] **TEAM-01**: Usuário pode criar time do tipo solo (1 jogador, `type: solo`) com nome único
- [x] **TEAM-02**: Usuário pode ver página de detalhes do time (membros, stats e histórico de partidas)

### Dashboard

- [x] **DASH-01**: Dashboard exibe times buscados dinamicamente de `/api/teams` (sem hardcode de `frontend`/`backend`)
- [x] **DASH-02**: API `/api/scoreboard` retorna W/L agregado por time (reimplementada para times dinâmicos)

### Ranking

- [x] **RANK-01**: Página de ranking exibe todos os times ordenados por vitórias
- [x] **RANK-02**: Ranking mostra W/L e win rate % por time
- [x] **RANK-03**: Ranking mostra streak atual (sequência de vitórias/derrotas) por time
- [x] **RANK-04**: Ranking mostra total de partidas por time
- [x] **RANK-05**: Ranking suporta filtros por período (semana / mês / geral)

### Perfil

- [x] **PROF-01**: Perfil do usuário mostra seus times com stats agregados
- [x] **PROF-02**: Perfil mostra win rate geral do jogador (across all teams)
- [x] **PROF-03**: Perfil mostra total de partidas jogadas pelo usuário

## v2 Requirements

### Head-to-Head

- **H2H-01**: Usuário pode ver confrontos diretos entre dois times específicos (W/L entre eles)
- **H2H-02**: Head-to-head acessível na página de detalhes do time

### Times Avançado

- **TEAM-03**: Times suportam customização (avatar / emoji / descrição)
- **TEAM-04**: Filtros de ranking separados por tipo de time (solo vs duo)

### Perfil Avançado

- **PROF-04**: Histórico cronológico de todas as partidas no perfil do jogador

## Out of Scope

| Feature | Reason |
|---------|--------|
| App mobile | Web-first; mobile pode vir depois se houver demanda |
| Sistema ELO / pontuação dinâmica | Complexidade desnecessária para contexto de escritório informal |
| Tournament brackets | Fora do escopo de rastreamento contínuo |
| Notificações em tempo real (WebSocket/push) | Não necessário na escala de escritório |
| Painel de moderação / admin | Contexto de confiança entre colegas — desnecessário |
| OAuth login (Google, GitHub) | Email/senha suficiente para v1 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| TEAM-01 | Phase 6 | Complete |
| TEAM-02 | Phase 7 | Complete |
| DASH-01 | Phase 2 | Complete |
| DASH-02 | Phase 2 | Complete |
| RANK-01 | Phase 8 | Complete |
| RANK-02 | Phase 8 | Complete |
| RANK-03 | Phase 8 | Complete |
| RANK-04 | Phase 8 | Complete |
| RANK-05 | Phase 5 | Complete |
| PROF-01 | Phase 5 | Complete |
| PROF-02 | Phase 5 | Complete |
| PROF-03 | Phase 5 | Complete |

**Coverage:**
- v1 requirements: 12 total
- Mapped to phases: 12
- Unmapped: 0 ✓

---

*Requirements defined: 2026-03-23*
*Traceability populated: 2026-03-23 (roadmap creation)*
