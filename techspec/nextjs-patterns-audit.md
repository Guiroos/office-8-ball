# Next.js Patterns Audit

Auditoria das páginas e rotas de API da aplicação em relação às melhores práticas do Next.js 16 App Router.

**Data:** 2026-04-03
**Nota geral:** 8/10

---

## Como está construído

### Páginas (`src/app/(authenticated)/`)

Todas as páginas seguem o padrão Server Component com async data fetching direto:

```
page.tsx (async Server Component)
  ├── hasDatabaseUrl() guard → 503
  ├── getAuthenticatedUser() guard → 401/redirect
  ├── await data (Prisma via lib/)
  └── <Suspense> para seções pesadas (onde aplicado)
```

| Página | Suspense | Metadata | Guard DB | Guard Auth |
|--------|----------|----------|----------|------------|
| `/dashboard` | — | ✅ | ✅ | ✅ |
| `/times` | — | ✅ | ✅ | ✅ |
| `/times/[id]` | ✅ (2x) | ✅ | ✅ | ✅ |
| `/ranking` | — | ✅ | ✅ | ✅ |
| `/head-to-head` | — | ✅ | ✅ | ✅ |
| `/profile` | ✅ (2x) | ✅ | ✅ | ✅ |

### APIs (`src/app/api/`)

Todas as rotas autenticadas seguem o padrão:

```
route.ts
  ├── hasDatabaseUrl() → 503
  ├── getAuthenticatedUser() → 401
  ├── Zod.parse(body) → 422
  ├── Prisma query
  └── revalidatePath() (nas mutations)
```

| Rota | Métodos | Zod | revalidatePath | Membership-first |
|------|---------|-----|----------------|-----------------|
| `/api/matches` | GET, POST | ✅ | ✅ | — |
| `/api/scoreboard` | GET | — | — | — |
| `/api/teams` | GET, POST | ✅ | — | — |
| `/api/teams/[id]` | GET, PATCH, DELETE | ✅ | ✅ | ✅ |
| `/api/teams/[id]/members` | POST, DELETE | ✅ | ✅ | ✅ |
| `/api/profile` | GET, PUT | ✅ | — | — |
| `/api/auth/register` | POST | ✅ | — | — |

### Serialização Server → Client

Nenhum problema encontrado. Apenas primitivos (`string`, `boolean`, `number`) e arrays serializáveis são passados de Server Components para Client Components.

---

## O que está correto

- **Server Components por padrão** — nenhuma página usa `use client` desnecessariamente
- **`searchParams` tipado como `Promise<>`** — padrão correto do Next.js 16
- **Suspense com skeletons customizados** — `/times/[id]` e `/profile` têm 2 boundaries cada
- **Sem `useEffect` para busca de dados** — tudo server-driven
- **`revalidatePath()` nas mutations** — cache invalidado corretamente após POST/PATCH/DELETE
- **`await params`** — todos os segmentos dinâmicos aguardam o objeto de params
- **Membership-first em rotas de time** — evita enumeração de recursos de outros usuários
- **Rate limiting** em `/api/auth/register`

---

## Problemas e melhorias

### 1. Lógica de negócio dentro de page component

**Arquivo:** `src/app/(authenticated)/times/page.tsx`
**Problema:** ~20 linhas de agregação de parceiros vivem diretamente no componente de página, misturando responsabilidades.
**Impacto:** Manutenibilidade — lógica não reutilizável e não testável isoladamente.

```ts
// Mover para src/lib/teams.ts
export function buildPartnerMap(teams: TeamWithPartners[]): Map<string, string> {
  // lógica que hoje está na page
}
```

---

### 2. Chamada direta ao Prisma em Server Component

**Arquivo:** `src/components/profile/profile-hero-section.tsx`
**Problema:** O componente chama `prisma.user.findUnique()` diretamente, enquanto o restante da aplicação acessa o banco sempre via `src/lib/`.
**Impacto:** Inconsistência na camada de domínio.

```ts
// Criar src/lib/profile.ts
export async function getUserProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, username: true, image: true },
  })
}
```

---

### 3. Estratégia de cache não declarada

**Arquivos:** todas as páginas
**Problema:** Nenhuma página exporta `revalidate`, deixando o comportamento de cache implícito.
**Impacto:** Dificulta entender se a página é dinâmica ou estática ao ler o código.

```ts
// Páginas totalmente dinâmicas (autenticadas)
export const revalidate = 0

// Ou páginas que podem ser cacheadas por período
export const revalidate = 3600
```

---

### 4. Sem Error Boundaries ao redor de Suspense

**Arquivos:** `src/app/(authenticated)/times/[id]/page.tsx`, `src/app/(authenticated)/profile/page.tsx`
**Problema:** Se um Server Component assíncrono dentro de `<Suspense>` lançar um erro, o Next.js cai no `error.tsx` global sem fallback granular.
**Impacto:** UX — um erro em uma seção quebra a página inteira.

```tsx
// Adicionar error.tsx por segmento ou usar ErrorBoundary client-side
// src/app/(authenticated)/times/[id]/error.tsx
'use client'
export default function Error({ error, reset }) { ... }
```

---

### 5. Sem `generateStaticParams` para rotas dinâmicas

**Arquivo:** `src/app/(authenticated)/times/[id]/page.tsx`
**Problema:** Cada acesso a `/times/[id]` faz uma query ao banco. Com ISR, times conhecidos poderiam ser pré-renderizados.
**Impacto:** Performance em escala.

```ts
export async function generateStaticParams() {
  const teams = await prisma.team.findMany({ select: { id: true } })
  return teams.map((t) => ({ id: t.id }))
}

export const revalidate = 3600
```

> **Nota:** Só aplicar se os times forem públicos ou se a autenticação permitir ISR.

---

## Checklist de melhorias

### Alta prioridade
- [x] Extrair lógica de parceiros de `/times/page.tsx` → `src/lib/teams.ts` (`buildPartnerOptions`)
- [x] Mover query do Prisma de `profile-hero-section.tsx` → `src/lib/profile.ts` (`getUserProfile`)

### Média prioridade
- [x] Adicionar `export const revalidate = 0` em todas as páginas autenticadas
- [x] Criar `src/app/(authenticated)/times/[id]/error.tsx` para fallback granular
- [x] Criar `src/app/(authenticated)/profile/error.tsx` para fallback granular

### Baixa prioridade (polish)
- [ ] Avaliar `generateStaticParams` em `/times/[id]` para ISR
- [ ] Adicionar JSDoc em Server Components assíncronos (`/** Server Component — fetches X */`)
- [ ] Adicionar `<section>` semântico como wrapper dos filhos de `<Suspense>`

---

## Referências

- [Next.js — Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Next.js — Suspense e Streaming](https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming)
- [Next.js — Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Next.js — generateStaticParams](https://nextjs.org/docs/app/api-reference/functions/generate-static-params)
