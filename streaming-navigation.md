# Streaming Navigation com Suspense

Documentação técnica sobre o problema de delay de navegação, as soluções aplicadas e como implementar Suspense Streaming nas páginas do projeto.

---

## O Problema

Ao clicar em um link para trocar de rota, a URL muda imediatamente no browser — mas o conteúdo da nova página demora para aparecer. Em produção (especialmente no deploy Cloudflare) o delay é mais evidente.

### Por que acontece

Todas as páginas autenticadas são **React Server Components** com `await` bloqueante no topo:

```tsx
// times/[id]/page.tsx — fluxo atual
export default async function TeamDetailPage({ params }) {
  const { id } = await params;
  const user = await getAuthenticatedUser();
  const detail = await getTeamDetailData(id, user.id); // ← bloqueia tudo aqui

  return <TeamDetailView {...detail.data} />;
}
```

O servidor só envia **qualquer** HTML para o browser após todos os `await` completarem. O resultado percebido pelo usuário:

```
click → URL muda → [silêncio enquanto o servidor busca dados] → página aparece
```

No Cloudflare Workers, o efeito é amplificado porque a query ao Postgres tem latência de rede maior (Workers rodam no edge, distantes do banco).

---

## Solução 1 — `loading.tsx` por rota (já implementado)

A solução mais simples: Next.js App Router trata `loading.tsx` como um fallback de Suspense automático para o segmento de rota. Quando existe um `loading.tsx` na pasta da rota, o framework exibe esse skeleton imediatamente enquanto o servidor ainda processa os dados.

**Arquivos criados:**

```
src/app/(authenticated)/
  times/loading.tsx
  times/[id]/loading.tsx
  ranking/loading.tsx
  head-to-head/loading.tsx
  profile/loading.tsx
  partida/loading.tsx
```

**Resultado:**

```
click → URL muda → skeleton aparece imediatamente → página aparece
```

O delay do servidor não some — o skeleton só mascara o tempo de espera com feedback visual.

**Quando é suficiente:** quando todas as seções da página dependem dos mesmos dados e não há ganho em carregá-las independentemente.

---

## Solução 2 — Suspense Streaming

Streaming é a solução para eliminar o delay percebido nas seções individuais da página. Em vez de bloquear o render até todos os dados chegarem, o servidor envia o HTML em pedaços conforme cada `await` completa.

### Como funciona

O React transmite HTML parcial via stream HTTP. O browser renderiza cada parte conforme recebe, sem esperar o documento completo.

```
Servidor recebe request
  ↓
Envia shell da página (header, layout) → browser renderiza imediatamente
  ↓
Envia HTML da seção A quando pronta  → browser insere no DOM
  ↓
Envia HTML da seção B quando pronta  → browser insere no DOM
```

Cada `<Suspense>` delimita uma "fatia" do stream. O fallback é exibido até o conteúdo real chegar.

### Diferença visual

| Abordagem | O que o usuário vê |
|-----------|-------------------|
| Await bloqueante | Branco → página completa |
| `loading.tsx` | Skeleton genérico → página completa |
| Suspense Streaming | Header real → seções aparecem progressivamente |

---

## Como implementar — guia passo a passo

### Passo 1 — Quebrar a função de dados em funções menores

O `getTeamDetailData` hoje retorna tudo de uma vez. Para streaming, cada seção precisa de sua própria função de fetch.

**Localização:** `src/lib/team-details.ts`

```ts
// Antes: uma função que busca tudo
export async function getTeamDetailData(teamId: string, userId: string) { ... }

// Depois: funções por domínio
export async function getTeamBasicInfo(teamId: string, userId: string) {
  // só nome, tipo, membros — query leve
}

export async function getTeamStats(teamId: string, userId: string) {
  // wins, losses, winRate, currentStreak, rankingPosition
}

export async function getTeamRecentMatches(teamId: string, userId: string, limit = 5) {
  // últimas N partidas
}

export async function getTeamH2HSummary(teamId: string, userId: string) {
  // confrontos diretos por adversário
}
```

### Passo 2 — Criar Server Components por seção

Cada componente faz seu próprio `await` e pode ser suspenso independentemente.

**Criar `src/components/teams/team-header-section.tsx`:**

```tsx
import { notFound } from "next/navigation";
import { getTeamBasicInfo } from "@/lib/team-details";
// importar sub-componentes do TeamDetailView que renderizam o header

export async function TeamHeaderSection({
  teamId,
  userId,
}: {
  teamId: string;
  userId: string;
}) {
  const data = await getTeamBasicInfo(teamId, userId);
  if (!data) notFound();
  return <TeamHeaderCard {...data} />;
}
```

**Criar `src/components/teams/team-stats-section.tsx`:**

```tsx
import { getTeamStats } from "@/lib/team-details";
import { StatTile } from "@/components/primitives/stat-tile";

export async function TeamStatsSection({
  teamId,
  userId,
}: {
  teamId: string;
  userId: string;
}) {
  const stats = await getTeamStats(teamId, userId);
  return (
    <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      <StatTile label="Vitórias" value={stats.wins} />
      <StatTile label="Derrotas" value={stats.losses} />
      {/* ... */}
    </section>
  );
}
```

Repetir o padrão para `TeamMembersSection`, `TeamRecentMatchesSection`, `TeamH2HSection`.

### Passo 3 — Compor a página com `<Suspense>`

**`src/app/(authenticated)/times/[id]/page.tsx`:**

```tsx
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getAuthenticatedUser, hasDatabaseUrl } from "@/lib/auth";
import { TeamHeaderSection } from "@/components/teams/team-header-section";
import { TeamStatsSection } from "@/components/teams/team-stats-section";
import { TeamMembersSection } from "@/components/teams/team-members-section";
import { TeamRecentMatchesSection } from "@/components/teams/team-recent-matches-section";
import { TeamH2HSection } from "@/components/teams/team-h2h-section";

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!hasDatabaseUrl()) { /* ... */ }

  const user = await getAuthenticatedUser();
  if (!user) notFound();

  const { id } = await params;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">

      {/* Header: query leve, aparece primeiro */}
      <Suspense fallback={<TeamHeaderSkeleton />}>
        <TeamHeaderSection teamId={id} userId={user.id} />
      </Suspense>

      {/* Stats: aparece quando a query de stats completar */}
      <Suspense fallback={<StatsGridSkeleton />}>
        <TeamStatsSection teamId={id} userId={user.id} />
      </Suspense>

      {/* Membros e partidas recentes em paralelo */}
      <section className="grid gap-6 lg:grid-cols-2">
        <Suspense fallback={<CardSkeleton />}>
          <TeamMembersSection teamId={id} userId={user.id} />
        </Suspense>
        <Suspense fallback={<CardSkeleton />}>
          <TeamRecentMatchesSection teamId={id} userId={user.id} />
        </Suspense>
      </section>

      {/* H2H: pode ser a query mais pesada, carrega por último */}
      <Suspense fallback={<H2HSkeleton />}>
        <TeamH2HSection teamId={id} userId={user.id} />
      </Suspense>

    </main>
  );
}
```

Os skeletons inline (`TeamHeaderSkeleton`, `StatsGridSkeleton` etc.) podem ser extraídos para um arquivo `team-detail-skeletons.tsx` na pasta `src/components/teams/` ou definidos inline no `page.tsx` se forem simples.

### Passo 4 — Remover o `loading.tsx` da rota (opcional)

Com Suspense granular, o `loading.tsx` fica redundante para essa rota porque cada seção já tem seu próprio fallback. Pode ser removido ou mantido como fallback de segurança para casos de erro de navegação.

---

## Quando cada solução é a certa

| Cenário | Solução recomendada |
|---------|-------------------|
| Página simples, dados rápidos | `loading.tsx` |
| Seções com latências diferentes | Suspense por seção |
| Dados vindos de APIs externas lentas | Suspense por seção (isola a lentidão) |
| Cloudflare Workers + Postgres remoto | Suspense por seção (reduz TTFB percebido) |
| Página com dados interdependentes | Await bloqueante + `loading.tsx` |

---

## Regras para este projeto

- Server Components podem usar `await` livremente — não precisam de `useEffect` ou fetch client-side.
- `"use client"` só deve aparecer em componentes que precisam de estado, eventos ou APIs do browser.
- Nunca importar Prisma em Client Components.
- Cada Server Component de seção deve repetir o guard `hasDatabaseUrl()` ou receber os dados como props já validados do `page.tsx`.
- Suspense boundaries não substituem tratamento de erros — usar `error.tsx` por rota para capturar falhas de fetch.

---

## Referências

- [Next.js Streaming and Suspense](https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming)
- [Next.js Data Fetching Patterns](https://nextjs.org/docs/app/building-your-application/data-fetching/patterns)
- [React `<Suspense>` reference](https://react.dev/reference/react/Suspense)
