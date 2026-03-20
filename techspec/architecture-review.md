# Revisão de Arquitetura — Next.js + Prisma

## Contexto

Auditoria realizada em março de 2026 para verificar aderência aos padrões de mercado do Next.js App Router e Prisma. A base foi avaliada como sólida e acima da média para o escopo do projeto. Os itens abaixo são melhorias identificadas, organizadas por impacto.

---

## Achados e progresso

### Impacto médio

#### 1. Migração Auth.js v4 → v5

- **Status:** `[ ] pendente`
- **Problema:** `next-auth@4.24.13` usa APIs legadas (rota catch-all `[...nextauth]`, config via `getAuthOptions()`). O Auth.js v5 é o padrão recomendado para Next.js 13+ e usa configuração centralizada em `auth.ts` na raiz sem a rota catch-all.
- **Risco de manter v4:** acúmulo de dívida técnica; breaking changes maiores quanto mais tarde migrar.
- **Arquivos afetados:**
  - `src/lib/auth.ts`
  - `src/app/api/auth/[...nextauth]/route.ts`
  - `middleware.ts`
  - `src/lib/auth-rate-limit.ts`
- **Escopo de mudança:** médio — afeta auth inteiro, mas a lógica de negócio permanece a mesma.
- **Referência:** [Auth.js v5 migration guide](https://authjs.dev/getting-started/migrating-to-v5)

---

### Impacto baixo

#### 2. Adicionar `loading.tsx` no dashboard

- **Status:** `[ ] pendente`
- **Problema:** O App Router suporta streaming via Suspense. Sem `loading.tsx`, não há skeleton/loading state durante SSR do layout — usuário pode ver flash em carregamentos lentos.
- **Solução:** Criar `src/app/(authenticated)/dashboard/loading.tsx` com skeleton compatível com o layout atual.
- **Arquivos afetados:**
  - `src/app/(authenticated)/dashboard/loading.tsx` (novo)
- **Escopo de mudança:** pequeno — componente isolado, sem risco de regressão.

#### 3. Adicionar `@@unique` no modelo `AuthRateLimit`

- **Status:** `[ ] pendente`
- **Problema:** O modelo usa `@@index([action, email])` mas o intent é um registro por combinação `action:email:ip`. Sem `@@unique`, upserts concorrentes podem criar registros duplicados em alta concorrência. A lógica no código mitiga isso parcialmente, mas a constraint no DB é a garantia correta.
- **Solução:**
  ```prisma
  model AuthRateLimit {
    // ...campos existentes...
    @@unique([action, email, ip])  // substituir ou adicionar ao @@index atual
    @@map("auth_rate_limits")
  }
  ```
- **Arquivos afetados:**
  - `prisma/schema.prisma`
  - Nova migration necessária
- **Escopo de mudança:** pequeno — uma linha no schema + migration.
- **Requer:** aprovação antes de alterar `schema.prisma` (per CLAUDE.md).

---

### Impacto mínimo (cosmético)

#### 4. Renomear `src/components/primitives/` → `src/components/domain/`

- **Status:** `[ ] pendente`
- **Problema:** O nome `primitives/` é ambíguo — `src/components/ui/` já contém primitivos shadcn. A pasta `primitives/` na verdade contém **reusáveis de domínio** (`StatTile`, `SectionHeader`, `IconCallout`, `FormField`). O nome `domain/` ou `common/` é mais preciso para novos devs.
- **Arquivos afetados:** todos os imports de `@/components/primitives/` no projeto.
- **Escopo de mudança:** renaming puro — sem mudança de lógica.
- **Nota:** atualizar `.claude/rules/architecture.md` e `CLAUDE.md` após a renomeação.

---

## O que está correto e não precisa de ação

| Área | Avaliação |
|------|-----------|
| Estrutura App Router | Excelente — route groups, layouts, error boundaries |
| Prisma schema | Excelente — `@@map`, índices, `Timestamptz(6)` |
| Singleton Prisma client | Excelente — padrão obrigatório para Next.js |
| Separação de camadas UI | Bom — `ui/` → `primitives/` → features |
| Isolamento de testes | Bom — `vi.resetModules()` correto para `memoryState` |
| Headers de segurança | Bom — CSP, HSTS, X-Frame-Options |
| TypeScript strict | Excelente |
| Rate limiting | Bom — progressivo, keyed por `action:email:ip` |
| Dual persistence | Correto para o escopo do projeto |

---

## Regra de uso

Este arquivo rastreia achados de auditoria com estado (`pendente` / `feito` / `descartado`). Quando um item for concluído, atualizar o status e registrar a data. Itens descartados devem ter justificativa.
