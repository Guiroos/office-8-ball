---
status: diagnosed
phase: 04-ranking-team-details
source:
  - 04-01-SUMMARY.md
  - 04-02-SUMMARY.md
  - 04-03-SUMMARY.md
started: 2026-03-26T01:42:31Z
updated: 2026-03-26T01:56:13Z
---

## Current Test

[testing complete]

## Tests

### 1. Ranking list and podium render with live team metrics
expected: Ao abrir /ranking autenticado, a tela deve mostrar pódio e lista com times ativos, incluindo vitórias/derrotas, win rate, total de partidas e ordem coerente por desempenho.
result: issue
reported: "nesse exato momento so aparece a tela de ranking com todos, solo e suplas mas sem nenhuma data para fazer os testes"
severity: major

### 2. Ranking type filter via URL tabs
expected: Ao alternar abas Solo/Duplas em /ranking (query string), a listagem deve refletir apenas o tipo selecionado e manter navegação via URL.
result: pass

### 3. Ranking team link opens team details page
expected: Ao clicar em um time no ranking, deve abrir /times/{id} com dados do time sem erro 404 para times ativos.
result: issue
reported: "nao existe times para fazer esse teste"
severity: major

### 4. Teams page tabs and create CTA
expected: Em /times deve haver abas Meus Times e Criar Novo Time; na visualização desktop, o CTA lateral Criar Novo Time deve aparecer.
result: pass

### 5. Team detail core information
expected: Em /times/{id}, deve aparecer nome/tipo do time, membros com papel Criador/Membro, e estatísticas (wins, losses, totalMatches, winRate, posição no ranking e sequência).
result: issue
reported: "nao temos times para testar"
severity: major

### 6. H2H rival selector and empty state behavior
expected: Em /times/{id}, a seção Confrontos Diretos deve permitir selecionar rival e mostrar métricas pré-computadas; sem partidas, deve exibir mensagem de estado vazio.
result: issue
reported: "nao temos times para testar"
severity: major

## Summary

total: 6
passed: 2
issues: 4
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "Ao abrir /ranking autenticado, a tela deve mostrar pódio e lista com times ativos, incluindo vitórias/derrotas, win rate, total de partidas e ordem coerente por desempenho."
  status: failed
  reason: "User reported: nesse exato momento so aparece a tela de ranking com todos, solo e suplas mas sem nenhuma data para fazer os testes"
  severity: major
  test: 1
  root_cause: "Ambiente sem times ativos para UAT; ranking depende de times active e o fluxo /times?tab=create ainda está em placeholder sem criar dados."
  artifacts:
    - path: "src/lib/ranking.ts"
      issue: "Consulta retorna vazio sem times ativos."
    - path: "src/app/(authenticated)/times/page.tsx"
      issue: "Aba de criação não executa POST /api/teams."
    - path: "prisma/seed.mjs"
      issue: "Seed não provisiona times para cenário de teste."
  missing:
    - "Conectar aba Criar Novo Time ao POST /api/teams."
    - "Definir bootstrap/fixture mínimo de UAT com times ativos."
  debug_session: ".planning/debug/phase-04-ranking-no-data.md"
- truth: "Ao clicar em um time no ranking, deve abrir /times/{id} com dados do time sem erro 404 para times ativos."
  status: failed
  reason: "User reported: nao existe times para fazer esse teste"
  severity: major
  test: 3
  root_cause: "Não há itens clicáveis no ranking porque o ambiente não possui times ativos; sem dados não existe id para abrir /times/{id}."
  artifacts:
    - path: "src/components/ranking/ranking-view.tsx"
      issue: "Mostra empty state com teams.length===0."
    - path: "src/lib/ranking.ts"
      issue: "Lista somente times ativos."
    - path: "prisma/seed.mjs"
      issue: "Sem bootstrap de times."
  missing:
    - "Criar dados mínimos de times antes do UAT."
    - "Disponibilizar criação de times pela UI de /times."
  debug_session: ".planning/debug/phase-04-ranking-team-404.md"
- truth: "Em /times/{id}, deve aparecer nome/tipo do time, membros com papel Criador/Membro, e estatísticas (wins, losses, totalMatches, winRate, posição no ranking e sequência)."
  status: failed
  reason: "User reported: nao temos times para testar"
  severity: major
  test: 5
  root_cause: "Pré-condição de UAT não atendida: sem times não há rota de detalhe validável para inspecionar métricas e roster."
  artifacts:
    - path: "src/app/(authenticated)/times/[id]/page.tsx"
      issue: "Rota depende de id existente de time."
    - path: "src/lib/team-details.ts"
      issue: "Agregação exige time e dados associados."
    - path: "src/app/(authenticated)/times/page.tsx"
      issue: "Sem criação real de times via aba create."
  missing:
    - "Provisionar ao menos um time ativo para o usuário de teste."
    - "Conectar criação de time no fluxo de /times."
  debug_session: ".planning/debug/phase-04-times-sem-times-uat.md"
- truth: "Em /times/{id}, a seção Confrontos Diretos deve permitir selecionar rival e mostrar métricas pré-computadas; sem partidas, deve exibir mensagem de estado vazio."
  status: failed
  reason: "User reported: nao temos times para testar"
  severity: major
  test: 6
  root_cause: "Sem times (e sem rivais) no ambiente de teste, não é possível validar o fluxo H2H; o componente já trata empty state."
  artifacts:
    - path: "src/components/teams/h2h-section.tsx"
      issue: "Componente depende de rivals/h2hByRival vindos do servidor."
    - path: "src/lib/team-details.ts"
      issue: "Rivais são derivados de times do viewer."
    - path: "prisma/seed.mjs"
      issue: "Sem dados iniciais de times/rivais."
  missing:
    - "Criar 2+ times ativos para usuário testador."
    - "Registrar ao menos 1 confronto para validar métricas H2H além do empty state."
  debug_session: ".planning/debug/phase04-h2h-no-teams-test.md"
