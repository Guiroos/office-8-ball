# Toast Feedback com Sonner — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o mecanismo ad-hoc de `flashMessage`/`error` no dashboard e os erros de API inline no perfil por toasts centralizados via Sonner.

**Architecture:** `<Toaster />` declarado uma vez em `AppShell`, `toast()` importado diretamente nos hooks/componentes que precisam de feedback. `toast.promise()` cobre o ciclo completo de loading → success → error no `registerWin`. Erros de API no `ProfileEditDialog` migram de `FieldError` inline para `toast.error()`.

**Tech Stack:** Sonner (via `npx shadcn@latest add sonner`), Vitest + Testing Library, `vi.mock("sonner")` para testes.

**Spec:** `docs/superpowers/specs/2026-03-21-toast-feedback-design.md`

---

## File Map

| Ação | Arquivo |
|------|---------|
| Criar | `src/components/ui/sonner.tsx` (gerado pelo shadcn) |
| Modificar | `src/components/authenticated/app-shell.tsx` |
| Modificar | `src/components/dashboard/dashboard-utils.tsx` |
| Modificar | `src/components/dashboard/use-dashboard-data.ts` |
| Modificar | `src/components/dashboard/index.tsx` |
| Modificar | `src/components/dashboard/dashboard-sidebar.tsx` |
| Modificar | `src/components/profile/profile-edit-dialog.tsx` |
| Modificar (testes) | `src/components/dashboard.test.tsx` |
| Modificar (testes) | `src/components/profile/profile-edit-dialog.test.tsx` |

---

## Task 1: Instalar Sonner e adicionar `<Toaster />` ao AppShell

**Files:**
- Create: `src/components/ui/sonner.tsx`
- Modify: `src/components/authenticated/app-shell.tsx`

- [ ] **Step 1: Instalar o componente Sonner via shadcn**

```bash
npx shadcn@latest add sonner
```

Confirmar que `src/components/ui/sonner.tsx` foi criado e `sonner` foi adicionado em `package.json`.

- [ ] **Step 2: Adicionar `<Toaster />` ao AppShell**

Em `src/components/authenticated/app-shell.tsx`, adicionar o import e o componente no JSX do `AppShell`. O `<Toaster />` deve ser colocado dentro do `<div className="min-h-dvh">` raiz, após o conteúdo existente (mobile sidebar overlay):

```tsx
import { Toaster } from "@/components/ui/sonner";

// Dentro do return de AppShell, após o bloco do mobile sidebar:
export function AppShell({ user, children }: AppShellProps) {
  // ...
  return (
    <div className="min-h-dvh">
      {/* conteúdo existente... */}
      <Toaster position="top-right" richColors />
    </div>
  );
}
```

- [ ] **Step 3: Verificar build sem erros de tipo**

```bash
npm run typecheck
```

Esperado: sem erros.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/sonner.tsx src/components/authenticated/app-shell.tsx package.json package-lock.json
git commit -m "feat: instalar Sonner e adicionar Toaster no AppShell"
```

---

## Task 2: Verificar callsites e preparar remoção de código morto

> `getStatusMessage` e `DashboardStatus` ficam sem consumidor após a migração do dashboard. `getLeadLabel` e `formatMatchDate` precisam ser verificados antes de qualquer remoção — o spec diz que permanecem, mas o plano confirma isso explicitamente.
>
> **Importante:** a remoção de `getStatusMessage`/`DashboardStatus` de `dashboard-utils.tsx` só é commitada junto com as mudanças em `use-dashboard-data.ts` e `dashboard-sidebar.tsx` (Task 3). Não commitar `dashboard-utils.tsx` isoladamente — isso deixaria o TypeScript quebrado.

**Files:**
- Modify: `src/components/dashboard/dashboard-utils.tsx` (sem commit isolado)

- [ ] **Step 1: Confirmar callsites de `formatMatchDate` e `getLeadLabel`** (pré-verificado)

```bash
grep -r "formatMatchDate\|getLeadLabel" src/
```

Esperado (já verificado antes da criação deste plano):
- `formatMatchDate` → usado em `recent-matches-card.tsx` e `profile-page.tsx`
- `getLeadLabel` → usado em `dashboard-hero.tsx`

Ambas permanecem no arquivo. Se o grep retornar resultado diferente, reavaliar antes de continuar.

- [ ] **Step 2: Remover `getStatusMessage`, `DashboardStatus` e imports órfãos**

Em `src/components/dashboard/dashboard-utils.tsx`, remover:
- O tipo `DashboardStatus`
- A função `getStatusMessage`
- O import de `lucide-react` inteiramente (`WifiOff` e `Zap` eram usados exclusivamente por essas duas)

Resultado esperado: o arquivo contém apenas `formatMatchDate`, `getLeadLabel`, `getLeaderName`, `getEnvironmentLabel` e o import de `ScoreboardData`.

**Não commitar ainda.** O TypeScript vai reclamar de `use-dashboard-data.ts` e `dashboard-sidebar.tsx` que ainda importam o código removido — isso é esperado e será corrigido na Task 3.

---

## Task 3: Refatorar feedback do Dashboard para toast (TDD)

**Files:**
- Modify: `src/components/dashboard.test.tsx`
- Modify: `src/components/dashboard/use-dashboard-data.ts`
- Modify: `src/components/dashboard/dashboard-sidebar.tsx`
- Modify: `src/components/dashboard/index.tsx`

> Commitar `dashboard-utils.tsx` junto com esta task para manter o TypeScript válido em todos os commits.

### 3a — Escrever testes falhando

- [ ] **Step 1: Adicionar mock do Sonner e ajustar `beforeEach` no `dashboard.test.tsx`**

No início do arquivo, após os imports existentes, adicionar:

```ts
import { toast } from "sonner";

vi.mock("sonner", () => ({
  toast: {
    promise: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  },
}));
```

No `beforeEach`, manter `vi.restoreAllMocks()` (restaura o spy de `fetch` entre testes) e adicionar `vi.clearAllMocks()` (limpa contadores dos mocks de `vi.mock`):

```ts
beforeEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});
```

- [ ] **Step 2: Atualizar o teste "shows an error state when the initial load fails"**

Substituir as asserções de texto no DOM por verificação no mock do toast:

```ts
it("shows an error state when the initial load fails", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue({
    ok: false,
    status: 500,
    json: async () => ({}),
  } as Response);

  render(<Dashboard />);

  await waitFor(() => {
    expect(toast.error).toHaveBeenCalledWith("Não foi possível carregar o placar.");
  });
});
```

- [ ] **Step 3: Atualizar o teste "posts a win, reloads data and displays the returned message"**

Substituir a asserção de `createMatchResponse.message` no DOM por verificação estruturada no mock do toast. Manter todas as outras asserções (placar, líder, nota limpa):

```ts
// Remover:
await waitFor(() => {
  expect(screen.getByText(createMatchResponse.message)).toBeInTheDocument();
});

// Adicionar no lugar:
await waitFor(() => {
  expect(toast.promise).toHaveBeenCalledWith(
    expect.any(Promise),
    expect.objectContaining({
      loading: "Registrando partida...",
      success: expect.any(Function),
      error: expect.any(Function),
    }),
  );
});
```

- [ ] **Step 4: Atualizar o teste "preserves the note when saving fails"**

Substituir a asserção de texto de erro no DOM por verificação no mock do toast. Manter a asserção do note:

```ts
// Remover:
expect(
  await screen.findByText("Não foi possível salvar a partida."),
).toBeInTheDocument();

// Adicionar:
await waitFor(() => {
  expect(toast.promise).toHaveBeenCalledWith(
    expect.any(Promise),
    expect.objectContaining({
      loading: "Registrando partida...",
      error: expect.any(Function),
    }),
  );
});
// Manter:
expect(backendNote).toHaveValue("quase uma humilhação");
```

- [ ] **Step 5: Rodar testes para confirmar que falham pelo motivo certo**

```bash
npm run test -- src/components/dashboard.test.tsx
```

Esperado: os 3 testes atualizados falham (toast não está implementado no código ainda). Os outros 2 testes ("loads and renders" e "limits each note") passam.

### 3b — Implementar as mudanças

- [ ] **Step 6: Refatorar `use-dashboard-data.ts`**

Substituir o conteúdo completo pelo seguinte:

```ts
import { toast } from "sonner";
import { useEffect, useState } from "react";

import type {
  CreateMatchResponse,
  MatchesResponse,
  MatchRecord,
  ScoreboardData,
  ScoreboardResponse,
  TeamId,
} from "@/lib/types";

type DashboardState = {
  scoreboard: ScoreboardData | null;
  matches: MatchRecord[];
};

type RegisterWinInput = {
  teamId: TeamId;
  note: string;
};

async function fetchDashboardData() {
  const [scoreboardResponse, matchesResponse] = await Promise.all([
    fetch("/api/scoreboard", { cache: "no-store" }),
    fetch("/api/matches", { cache: "no-store" }),
  ]);

  if (!scoreboardResponse.ok || !matchesResponse.ok) {
    throw new Error("Não foi possível carregar o placar.");
  }

  const scoreboardJson = (await scoreboardResponse.json()) as ScoreboardResponse;
  const matchesJson = (await matchesResponse.json()) as MatchesResponse;

  return {
    scoreboard: scoreboardJson.scoreboard,
    matches: matchesJson.matches,
  };
}

export function useDashboardData() {
  const [state, setState] = useState<DashboardState>({
    scoreboard: null,
    matches: [],
  });
  const [loading, setLoading] = useState(true);
  const [submittingTeamId, setSubmittingTeamId] = useState<TeamId | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const dashboardData = await fetchDashboardData();
        setState(dashboardData);
      } catch (loadError) {
        toast.error(
          loadError instanceof Error
            ? loadError.message
            : "Não foi possível carregar o placar.",
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function registerWin({ teamId, note }: RegisterWinInput) {
    setSubmittingTeamId(teamId);

    const execute = async () => {
      const response = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winnerTeamId: teamId, note }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error ?? "Não foi possível salvar a partida.");
      }

      const payload = (await response.json()) as CreateMatchResponse;
      const dashboardData = await fetchDashboardData();
      setState(dashboardData);
      return payload.message;
    };

    // execute() cria a promise uma vez. toast.promise cuida do feedback visual;
    // o await abaixo dirige a atualização de estado e o valor de retorno.
    const promise = execute();

    toast.promise(promise, {
      loading: "Registrando partida...",
      success: (msg) => msg,
      error: (err) =>
        err instanceof Error ? err.message : "Não foi possível salvar a partida.",
    });

    try {
      await promise;
      return true;
    } catch {
      return false;
    } finally {
      setSubmittingTeamId(null);
    }
  }

  return {
    scoreboard: state.scoreboard,
    matches: state.matches,
    loading,
    submittingTeamId,
    registerWin,
  };
}
```

- [ ] **Step 7: Refatorar `dashboard-sidebar.tsx`**

Substituir o conteúdo completo pelo seguinte (remove o primeiro card inteiro, remove todas as props):

```tsx
import { Flame, Swords, TimerReset } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { IconCallout } from "@/components/primitives/icon-callout";
import { SectionHeader } from "@/components/primitives/section-header";

export function DashboardSidebar() {
  return (
    <div className="grid gap-6">
      <Card variant="brand">
        <CardContent className="space-y-4 p-6">
          <SectionHeader eyebrow="Painel rápido" title="Painel rápido" inverse hideTitle className="gap-0" />
          <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
            <IconCallout
              icon={<Flame className="size-4" />}
              title="Sem burocracia"
              description="O fluxo continua 1-clique para registrar a vitória."
              tone="strong"
            />
            <IconCallout
              icon={<TimerReset className="size-4" />}
              title="Placar derivado"
              description="Liderança e streak continuam calculados pelo histórico."
              tone="strong"
            />
            <IconCallout
              icon={<Swords className="size-4" />}
              title="Base escalável"
              description="A linguagem visual aceita novos times sem virar tela de admin."
              tone="strong"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 8: Atualizar `dashboard/index.tsx`**

No `Dashboard`, atualizar o destructuring de `useDashboardData` para remover `flashMessage` e `status`:

```ts
const {
  scoreboard,
  matches,
  loading,
  submittingTeamId,
  registerWin,
} = useDashboardData();
```

E atualizar o JSX para chamar `<DashboardSidebar />` sem props:

```tsx
<DashboardSidebar />
```

- [ ] **Step 9: Rodar os testes**

```bash
npm run test -- src/components/dashboard.test.tsx
```

Esperado: todos os 5 testes passam.

- [ ] **Step 10: Typecheck**

```bash
npm run typecheck
```

Esperado: sem erros.

- [ ] **Step 11: Commit (inclui `dashboard-utils.tsx` da Task 2)**

```bash
git add src/components/dashboard/dashboard-utils.tsx src/components/dashboard.test.tsx src/components/dashboard/use-dashboard-data.ts src/components/dashboard/dashboard-sidebar.tsx src/components/dashboard/index.tsx
git commit -m "feat: migrar feedback do dashboard para toast via Sonner"
```

---

## Task 4: Refatorar feedback do ProfileEditDialog para toast (TDD)

**Files:**
- Modify: `src/components/profile/profile-edit-dialog.test.tsx`
- Modify: `src/components/profile/profile-edit-dialog.tsx`

### 4a — Escrever testes falhando

- [ ] **Step 1: Adicionar mock do Sonner no `profile-edit-dialog.test.tsx`**

No início do arquivo, após os imports existentes:

```ts
import { toast } from "sonner";

vi.mock("sonner", () => ({
  toast: {
    promise: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  },
}));
```

O `beforeEach` já chama `vi.clearAllMocks()` — não é necessário alterar.

- [ ] **Step 2: Atualizar "calls onSave and closes on successful save"**

Adicionar a asserção do toast de sucesso dentro do `waitFor` existente:

```ts
await waitFor(() => {
  expect(onSave).toHaveBeenCalledWith(updatedProfile);
  expect(onOpenChange).toHaveBeenCalledWith(false);
  expect(toast.success).toHaveBeenCalledWith("Perfil atualizado.");
});
```

- [ ] **Step 3: Atualizar "shows 503 error message when service is unavailable"**

Substituir a asserção de texto inline por verificação no mock do toast e confirmar que o texto não aparece mais no DOM:

```ts
it("shows 503 error message when service is unavailable", async () => {
  mockFetch.mockResolvedValueOnce({ ok: false, status: 503, json: async () => ({}) });

  render(<ProfileEditDialog {...defaultProps} />);
  fireEvent.click(screen.getByRole("button", { name: /salvar/i }));

  await waitFor(() => {
    expect(toast.error).toHaveBeenCalledWith(
      "Serviço indisponível. Tente novamente mais tarde.",
    );
  });
  expect(screen.queryByText(/serviço indisponível/i)).not.toBeInTheDocument();
});
```

- [ ] **Step 4: Adicionar teste para erro genérico de API (não-503)**

Adicionar novo teste que cobre o `else` branch de erros de API:

```ts
it("shows generic API error message for non-503 failures", async () => {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status: 500,
    json: async () => ({ error: "Erro customizado do servidor." }),
  });

  render(<ProfileEditDialog {...defaultProps} />);
  fireEvent.click(screen.getByRole("button", { name: /salvar/i }));

  await waitFor(() => {
    expect(toast.error).toHaveBeenCalledWith("Erro customizado do servidor.");
  });
  expect(screen.queryByText(/erro customizado/i)).not.toBeInTheDocument();
});
```

- [ ] **Step 5: Rodar testes para confirmar que falham**

```bash
npm run test -- src/components/profile/profile-edit-dialog.test.tsx
```

Esperado: os 3 testes atualizados/novos falham. "renders the dialog" e "shows validation error" passam.

### 4b — Implementar as mudanças

- [ ] **Step 6: Refatorar `handleSubmit` em `profile-edit-dialog.tsx`**

Adicionar o import de `toast` e modificar `handleSubmit`. O state `error` e `<FieldError>` permanecem para validação Zod local:

```ts
import { toast } from "sonner";

// ...

async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();

  const result = schema.safeParse({ displayName });
  if (!result.success) {
    setError(result.error.issues[0]?.message ?? "Dados inválidos.");
    return;
  }

  setLoading(true);
  setError(null); // limpa erros Zod anteriores ao retentar

  try {
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName }),
    });

    if (!res.ok) {
      if (res.status === 503) {
        toast.error("Serviço indisponível. Tente novamente mais tarde.");
      } else {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        toast.error(body.error ?? "Erro ao salvar. Tente novamente.");
      }
      return;
    }

    const updated = (await res.json()) as ProfileResponse;
    toast.success("Perfil atualizado.");
    onSave(updated);
    onOpenChange(false);
  } finally {
    setLoading(false);
  }
}
```

- [ ] **Step 7: Rodar os testes**

```bash
npm run test -- src/components/profile/profile-edit-dialog.test.tsx
```

Esperado: todos os 5 testes passam.

- [ ] **Step 8: Rodar todos os testes**

```bash
npm run test
```

Esperado: todos os testes passam sem erros.

- [ ] **Step 9: Typecheck final**

```bash
npm run typecheck
```

Esperado: sem erros.

- [ ] **Step 10: Commit**

```bash
git add src/components/profile/profile-edit-dialog.test.tsx src/components/profile/profile-edit-dialog.tsx
git commit -m "feat: migrar feedback do ProfileEditDialog para toast via Sonner"
```
