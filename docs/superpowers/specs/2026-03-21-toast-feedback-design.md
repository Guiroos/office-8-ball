# Design Spec — Toast Feedback com Sonner

**Data:** 2026-03-21
**Escopo:** Infraestrutura de feedback visual para chamadas de API em todas as rotas autenticadas
**Fora de escopo:** Tela de login (feedback permanece inline)

---

## Contexto

O app não tem infraestrutura de feedback visual para ações do usuário. O mecanismo atual (`flashMessage` no `DashboardSidebar`) foi implementado de forma ad-hoc e não escala para outras telas. `ProfileEditDialog` usa `FieldError` inline para erros de API, o que mistura validação local com feedback de rede.

---

## Decisão

Adotar **Sonner** como infraestrutura global de toast para todas as rotas autenticadas.

**Por que Sonner:**
- Componente oficial do shadcn/ui — integra com o tema existente sem customização
- 2-3 KB gzipped — menor impacto de bundle
- `toast.promise()` elimina gerenciamento manual de loading/success/error
- API stateless: `<Toaster />` uma vez no layout, `toast()` importado diretamente onde precisar

---

## Arquitetura

### Infraestrutura

- Instalar via `npx shadcn@latest add sonner` — gera `src/components/ui/sonner.tsx`
- `<Toaster position="top-right" richColors />` adicionado dentro de `AppShell`
- Cobre todas as rotas autenticadas com uma única declaração

### Regra de separação: toast vs inline

| Tipo de feedback | Canal |
|---|---|
| Validação local (Zod, regras de campo) | `FieldError` inline — permanece |
| Sucesso de chamada de API | `toast.success()` |
| Erro de chamada de API | `toast.error()` |
| Loading de chamada de API | `toast.promise()` (quando aplicável) |

---

## Mudanças por arquivo

### `src/components/authenticated/app-shell.tsx`
- Adicionar `<Toaster position="top-right" richColors />` no JSX

### `src/components/dashboard/use-dashboard-data.ts`
- Remover states `flashMessage` e `error` inteiramente — nenhum dos dois tem consumidor após a migração
- `registerWin`: substituir `setFlashMessage` / `setError` por `toast.promise()`. A promise passada ao `toast.promise()` cobre a sequência completa: POST da partida + `fetchDashboardData()` — o toast de sucesso só aparece após ambos resolverem. Mensagem de sucesso vinda de `payload.message` da API
- Load error no `useEffect`: substituir `setError` por `toast.error(mensagem)`
- Remover `flashMessage` e `status` do objeto retornado pelo hook; `getStatusMessage` deixa de ser chamado

### `src/components/dashboard/dashboard-utils.tsx`
- Remover a função `getStatusMessage` e o tipo `DashboardStatus` — tornam-se código morto após a migração. Manter apenas `getLeaderName` e `getEnvironmentLabel` que permanecem em uso

### `src/components/dashboard/index.tsx`
- Remover `flashMessage` e `status` do destructuring de `useDashboardData`
- Remover repasse de qualquer prop para `DashboardSidebar` (o componente passa a receber zero props)

### `src/components/dashboard/dashboard-sidebar.tsx`
- Remover props `flashMessage` e `status` — assinatura final é `DashboardSidebar()` sem props
- Remover o primeiro `Card` ("Clima da mesa / Leitura oficial") inteiramente — ele continha apenas os blocos de `flashMessage` e `status`, que agora não existem mais
- O componente passa a renderizar apenas o segundo card (brand card "Painel rápido") com os três `IconCallout` informativos estáticos
- Remover import de `DashboardStatus` e qualquer outro import que fica órfão

### `src/components/profile/profile-edit-dialog.tsx`
- Substituir `setError` para casos de erro de API por `toast.error(mensagem)`
- Adicionar `toast.success("Perfil atualizado.")` após save bem-sucedido
- Manter `setError(null)` no início de `handleSubmit` — serve para limpar erros Zod anteriores quando o usuário retenta o submit
- Manter `setError` apenas para erros de validação Zod local (campo inválido)
- `FieldError` inline permanece para validação Zod

---

## O que não muda

- `FieldError` inline no `ProfileEditDialog` para validação Zod — permanece
- Tela de login — fora do escopo desta spec
- Status codes de API (401, 409, 429, 500, 503) — sem alteração
- Lógica de `fetchDashboardData` e `createMatch` — sem alteração
- `getLeaderName` e `getEnvironmentLabel` em `dashboard-utils` — permanecem

---

## Testes afetados

### `src/components/dashboard.test.tsx`
- Remover asserções que dependem de texto renderizado pelo `DashboardSidebar` via `flashMessage` ou `DashboardStatus`:
  - Asserção `screen.getByText("Falha ao sincronizar a mesa.")` e `"Não foi possível carregar o placar."` (estado de erro de carregamento)
  - Asserção `screen.getByText(createMatchResponse.message)` (flash message após registrar vitória)
- Substituir por asserções no mock de `sonner`: mockar `import { toast } from "sonner"` com `vi.mock("sonner")` e verificar `expect(toast.error).toHaveBeenCalledWith(...)` e `expect(toast.promise).toHaveBeenCalled()`
- Não existe arquivo de teste separado para `DashboardSidebar` — todas as asserções relevantes estão em `dashboard.test.tsx`

### `src/components/profile/profile-edit-dialog.test.tsx`
- Mockar `sonner` com `vi.mock("sonner")` e verificar chamadas de `toast.success` e `toast.error`
- Manter testes de validação Zod — esses continuam verificando `FieldError` inline
