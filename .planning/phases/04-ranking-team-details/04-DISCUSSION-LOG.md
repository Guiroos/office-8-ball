# Phase 4: Ranking & Team Details - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions captured in CONTEXT.md — this log preserves the discussion.

**Date:** 2026-03-25
**Phase:** 04-ranking-team-details
**Mode:** discuss
**Areas analyzed:** Ranking visual style, Team detail structure, H2H comparison, Data freshness

---

## Assumptions Presented

| Area | Gray area identified |
|------|---------------------|
| Ranking visual style | Tabela vs cards; sort criteria; stats exibidos |
| Team detail structure | Rota separada vs inline; seções da página; stats do card |
| H2H comparison | Automático vs seletor; dados exibidos |
| Data freshness | RSC + revalidatePath vs client hook |

---

## Discussion

### Ranking visual style

**Q: Como o ranking deve apresentar os times?**
User: Referenciou design Stitch "Rankings & Leaderboards" (ID: 1dda9f2e9eed48e4ab029cf8ee648ae9, projeto 8575820399758307798) — podium top 3 no topo + lista para os demais + filtro por tipo (solo/duplas).

**Q: O que determina o ranking (ordem das posições)?**
User: Vitórias (W) — primário. (Empate desempata por win rate % — decisão do Claude)

**Q: Qual stat principal exibir?**
User: Mostrar tudo — V + L + WR% + Streak.

---

### Team detail structure

User forneceu design Stitch "Gestão de Times" (ID: a05194f414d74221a432b6f797a80e98, projeto 8575820399758307798) descrevendo: aba "Meus Times" / "Criar Novo Time", card do time com avatar + stats, lista de membros, histórico recente das últimas 3 partidas, botão "Ver histórico completo".

**Q: A página de detalhe do time é uma rota separada ou inline?**
User: `/times/[id]` — rota dedicada.

**Q: Quais stats no card do time?**
User: Total Wins + Win Rate + Posição no ranking.

---

### H2H comparison

**Q: Como funciona a comparação H2H?**
User: Seletor de adversário, mas pré-carregado com o principal rival (top adversary por número de confrontos).

**Q: Que dados mostrar no H2H?**
User: W/L + win rate + última partida.

---

### Data freshness

**Q: Como o ranking e detalhes buscam dados?**
User: RSC + revalidatePath.

---

## Corrections Made

None — all selections confirmed.

---

## Design References Captured

| Screen | ID | Usage |
|--------|----|-------|
| Rankings & Leaderboards | 1dda9f2e9eed48e4ab029cf8ee648ae9 | Layout do ranking (podium + lista + filtro) |
| Gestão de Times | a05194f414d74221a432b6f797a80e98 | Layout do detalhe do time (card + members + history) |

Projeto Stitch: 8575820399758307798 (Dashboard do Jogador)
