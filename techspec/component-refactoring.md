# Component Refactoring Backlog

Levantamento de padrões duplicados e candidatos a extração como componentes/utilitários globais.
Cada item é independente e pode ser atacado separadamente.

---

## Item 1 — Utilitários de Formatação (`lib/format.ts`) 🔴 Alta

### Problema
Funções de formatação de data e string espalhadas por múltiplos arquivos de feature:

| Função | Arquivo atual |
|--------|--------------|
| `formatLastPlayedAt()` | `src/components/teams/team-card.tsx` |
| `formatDate()` | `src/components/teams/recent-matches-list.tsx` |
| `formatMatchDate()` | `src/components/dashboard/dashboard-utils.tsx` |
| `getInitials(name)` | `src/components/teams/team-card.tsx` (implementação A) |
| `getInitials(name)` | `src/components/profile/profile-page.tsx` (implementação B) |
| `formatTeamType(type)` | inline em 4 componentes: `"solo" ? "Solo" : "Duplas"` |

### Proposta
Criar `src/lib/format.ts` com todas as funções centralizadas:

```ts
export function formatMatchDate(date: string | Date): string
export function formatLastPlayedAt(date: string | Date | null): string
export function getInitials(name: string): string
export function formatTeamType(type: "solo" | "duo"): string
```

### Arquivos a alterar após extração
- `src/components/teams/team-card.tsx`
- `src/components/teams/recent-matches-list.tsx`
- `src/components/dashboard/dashboard-utils.tsx`
- `src/components/profile/profile-page.tsx`
- `src/components/ranking/standings-row.tsx`
- `src/components/ranking/podium-card.tsx`
- `src/components/teams/team-detail-view.tsx`

### Critério de conclusão
- [x] `lib/format.ts` criado com todas as funções exportadas
- [x] Nenhuma função de formatação de data ou string duplicada em componentes
- [x] Testes unitários para cada função em `src/lib/format.test.ts`

---

## Item 2 — `RecentResultsDots` (`primitives/recent-results-dots.tsx`) 🔴 Alta

### Problema
Componente visual idêntico (5 dots coloridos indicando vitória/derrota) implementado duas vezes:

| Arquivo | Linhas aprox. |
|---------|--------------|
| `src/components/teams/team-card.tsx` | ~30 linhas |
| `src/components/ranking/standings-row.tsx` | ~30 linhas |

### Proposta
Criar `src/components/primitives/recent-results-dots.tsx`:

```tsx
interface RecentResultsDotsProps {
  results: Array<"win" | "loss" | null>  // array de até 5 resultados
  className?: string
}

export function RecentResultsDots({ results, className }: RecentResultsDotsProps)
```

### Arquivos a alterar após extração
- `src/components/teams/team-card.tsx`
- `src/components/ranking/standings-row.tsx`

### Critério de conclusão
- [x] Componente criado em `primitives/`
- [x] Ambos os usos substituídos pela importação do primitivo
- [x] Visual idêntico ao atual em ambas as páginas

---

## Item 3 — `EmptyState` (`primitives/empty-state.tsx`) 🟡 Média

### Problema
Padrão de estado vazio (box com borda arredondada, título em negrito, descrição em muted) repetido inline em 3+ lugares com pequenas variações visuais:

| Arquivo | Variação |
|---------|---------|
| `src/components/dashboard/recent-matches-card.tsx` | sem ícone |
| `src/components/ranking/ranking-view.tsx` | sem ícone |
| `src/components/profile/profile-page.tsx` | usa `IconCallout` como alternativa |

### Proposta
Criar `src/components/primitives/empty-state.tsx`:

```tsx
interface EmptyStateProps {
  title: string
  description?: string
  icon?: React.ReactNode
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ title, description, icon, action, className }: EmptyStateProps)
```

### Arquivos a alterar após extração
- `src/components/dashboard/recent-matches-card.tsx`
- `src/components/ranking/ranking-view.tsx`
- Avaliar se `profile-page.tsx` migra de `IconCallout` para `EmptyState`

### Critério de conclusão
- [x] Componente criado em `primitives/`
- [x] Todos os empty states inline substituídos
- [x] Consistência visual garantida entre as páginas

---

## Item 4 — `TeamTypeBadge` (`primitives/team-type-badge.tsx`) 🟡 Média

### Problema
Ternário de tipo de time repetido em 4 arquivos:

```tsx
// Aparece assim em todos:
<Badge>{team.type === "solo" ? "Solo" : "Duplas"}</Badge>
```

| Arquivo |
|---------|
| `src/components/teams/team-card.tsx` |
| `src/components/ranking/standings-row.tsx` |
| `src/components/ranking/podium-card.tsx` |
| `src/components/teams/team-detail-view.tsx` |

### Proposta
Pode ser resolvido de duas formas (escolher uma):

**Opção A — Componente (recomendado se houver estilo específico por tipo):**
```tsx
// src/components/primitives/team-type-badge.tsx
export function TeamTypeBadge({ type }: { type: "solo" | "duo" })
```

**Opção B — Utilitário (se o Badge já é suficiente):**
```ts
// Adicionar em src/lib/format.ts
export function formatTeamType(type: "solo" | "duo"): string
```

### Critério de conclusão
- [x] Lógica centralizada em um único lugar (`formatTeamType` em `src/lib/format.ts`)
- [x] Os 4 arquivos atualizados para usar a nova abstração

---

## Item 5 — `MatchResultRow` (`primitives/match-result-row.tsx`) 🟢 Baixa

### Problema
Estrutura visual de uma linha de partida (badge de resultado, nome do adversário, data, nota) duplicada com pequenas variações:

| Arquivo | Contexto |
|---------|---------|
| `src/components/dashboard/recent-matches-card.tsx` | dentro de scroll area |
| `src/components/teams/recent-matches-list.tsx` | lista compacta no detalhe do time |

### Proposta
Criar `src/components/primitives/match-result-row.tsx`:

```tsx
interface MatchResultRowProps {
  result: "win" | "loss"
  opponentName: string
  date: string | Date
  note?: string
  variant?: "default" | "compact"
}

export function MatchResultRow({ result, opponentName, date, note, variant }: MatchResultRowProps)
```

### Critério de conclusão
- [ ] Componente criado em `primitives/`
- [ ] Ambos os usos migrados
- [ ] Variante `compact` cobre o layout de `recent-matches-list`

---

## Item 6 — Adotar `SectionHeader` consistentemente 🟢 Baixa

### Problema
Dois componentes constroem headers de página manualmente em vez de usar o primitivo `SectionHeader` já existente:

| Arquivo | Padrão atual |
|---------|-------------|
| `src/components/ranking/ranking-view.tsx` | `<h1>` + caption manualmente |
| `src/components/head-to-head/head-to-head-view.tsx` | `<h1>` + caption manualmente |

### Proposta
Substituir o markup inline pelo `SectionHeader` importado de `@/components/primitives/section-header`:

```tsx
<SectionHeader
  eyebrow="Ranking"
  title="Classificação"
  description="..."
/>
```

### Critério de conclusão
- [ ] `ranking-view.tsx` usa `SectionHeader`
- [ ] `head-to-head-view.tsx` usa `SectionHeader`
- [ ] Visual idêntico ao atual confirmado

---

## Ordem de execução sugerida

| # | Item | Esforço | Impacto |
|---|------|---------|---------|
| 1 | `lib/format.ts` | Pequeno | Alto — elimina mais duplicação |
| 2 | `RecentResultsDots` | Pequeno | Alto — mesmo componente em 2 lugares |
| 3 | `EmptyState` | Médio | Médio — melhora consistência visual |
| 4 | `TeamTypeBadge` | Pequeno | Médio — lógica de negócio centralizada |
| 5 | `MatchResultRow` | Médio | Baixo — variações são sutis |
| 6 | Adotar `SectionHeader` | Pequeno | Baixo — cosmético |
