# Design Spec — Evolução do Schema de User

**Data:** 2026-03-22
**Status:** aprovado

## Contexto

O modelo `User` atual expõe apenas `displayName` como campo editável no perfil. O objetivo é enriquecer o perfil do usuário com `avatarUrl` e `bio`, tornar `email` opcional (a identidade passa a ser `username` + senha), e migrar o login de email-based para username-based.

## Escopo

### O que muda

- `email` vira opcional no schema (`String?`) e no fluxo de registro
- Login migra de email → username como identificador principal
- Dois novos campos no `User`: `avatarUrl` e `bio`
- `PUT /api/profile` passa a aceitar `email`, `displayName`, `avatarUrl`, `bio`
- `ProfileEditDialog` expande para os 4 campos editáveis
- Avatar exibido com fallback para Gravatar (hash MD5 do username)

### O que não muda

- `username` continua único e imutável após o cadastro
- Rate limiting de auth continua funcionando (usa a coluna `email` do `AuthRateLimit` para armazenar o username — sem migration de schema nessa tabela)
- Domínio de times: sem mudança nesta iteração (`teamId` fica para o spec de times)
- Fluxo de troca de senha: sem mudança (item 7 do roadmap, independente)

---

## Seção 1 — Schema & Camada de Dados

### `prisma/schema.prisma`

```prisma
model User {
  id           String   @id @db.Text
  username     String   @unique @db.Text
  passwordHash String   @map("password_hash") @db.Text
  email        String?  @unique @db.Text
  displayName  String?  @map("display_name") @db.Text
  avatarUrl    String?  @map("avatar_url") @db.Text
  bio          String?  @db.Text
  createdAt    DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt    DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  @@map("users")
}
```

### Migration

Gerada via `prisma migrate dev`. Apenas remove o `NOT NULL` de `email` e adiciona as duas novas colunas nullable. Usuários existentes mantêm seus dados — sem perda.

### In-memory fallback (`src/lib/data.ts`)

O tipo do usuário em memória espelha as mudanças: `email` vira `string | null`, `avatarUrl` e `bio` adicionados como `string | null`.

---

## Seção 2 — Refatoração do Auth (email → username)

### `src/lib/auth-validation.ts`

Schema de login muda de `{ email, password }` para `{ username, password }`. Validação de formato de email é removida; `username` entra com as mesmas regras existentes no registro (min/max, sem caracteres especiais).

### `src/lib/auth-rate-limit.ts`

`buildAuthRateLimitKey` passa a receber `{ action, username, headers }` no lugar de `{ action, email, headers }`. A coluna `email` na tabela `AuthRateLimit` continua sendo usada — apenas armazena o username agora. Sem migration de schema.

### `src/lib/auth.ts`

- `CredentialsProvider` troca `{ email, password }` por `{ username, password }`
- `authorize()` usa `prisma.user.findUnique({ where: { username } })`
- Callback de sessão remove dependência de `token.email` para compor o `SessionUser`
- `getAuthenticatedUser()` para de verificar `session.user.email` — valida apenas `id` e `username`

### `src/lib/types.ts`

```ts
export type SessionUser = {
  id: string;
  username: string;
  email: string | null;
};
```

### `src/components/login/`

Campo de login muda de email (`type="email"`) para username (`type="text"`). Label e placeholder atualizados.

---

## Seção 3 — Profile API & Types

### `src/lib/types.ts` — `ProfileResponse`

```ts
export type ProfileResponse = {
  id: string;
  username: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string;
};
```

### `GET /api/profile`

Sem mudança de lógica — o `findUnique` já retorna todos os campos. Basta expor `avatarUrl` e `bio` na resposta serializada.

### `PUT /api/profile` — schema Zod

```ts
const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(50).optional(),
  email: z.string().email().optional().nullable(),
  avatarUrl: z.string().url().max(500).optional().nullable(),
  bio: z.string().max(200).optional().nullable(),
});
```

Patch parcial: apenas os campos presentes no payload são atualizados. Retorna `ProfileResponse` completo.

---

## Seção 4 — UI

### `ProfileEditDialog`

Recebe o `ProfileResponse` completo como prop (em vez de campos individuais). Exibe 4 campos editáveis:

| Campo | Input | Validação client-side |
|---|---|---|
| `displayName` | `<Input type="text">` | min 2, max 50 |
| `email` | `<Input type="email">` | formato de email, opcional |
| `bio` | `<Textarea>` | max 200, contador de chars visível |
| `avatarUrl` | `<Input type="text">` | URL válida, opcional |

### `profile-page.tsx`

**Avatar:** lógica condicional no lugar do círculo de iniciais atual:
1. Se `avatarUrl` está preenchida → `<img src={avatarUrl}>`
2. Se não → Gravatar via `https://www.gravatar.com/avatar/<md5(username)>?d=identicon`
3. Fallback de erro no `<img>` → iniciais (comportamento atual)

**Bio:** exibida abaixo do `@username` no hero section quando preenchida.

---

## Seção 5 — Testes

### Testes de rota (`/api/profile/route.test.ts`)

- `GET` retorna `avatarUrl` e `bio` na resposta
- `PUT` persiste `displayName`, `email`, `avatarUrl`, `bio` individualmente
- `PUT` com `email` inválido retorna 400
- `PUT` com `avatarUrl` que não é URL retorna 400
- `PUT` com `bio` acima de 200 chars retorna 400

### Testes de auth

- Login com `username` + senha correta autentica com sucesso
- Login com `username` inexistente retorna null
- Rate limit continua bloqueando após falhas usando username como chave

### Testes de componente

- `ProfileEditDialog` renderiza os 4 campos
- `ProfileEditDialog` exibe erro para URL inválida no avatar
- `profile-page.tsx` renderiza `<img>` quando `avatarUrl` está presente
- `profile-page.tsx` usa URL do Gravatar quando `avatarUrl` é null

### E2E existentes

Fixtures de login precisam trocar o campo `email` por `username` nas credenciais de teste.

---

## Arquivos afetados

| Arquivo | Tipo de mudança |
|---|---|
| `prisma/schema.prisma` | `email` nullable, `avatarUrl`, `bio` adicionados |
| `prisma/migrations/` | nova migration gerada |
| `src/lib/types.ts` | `SessionUser.email` nullable, `ProfileResponse` expandido |
| `src/lib/auth-validation.ts` | login schema: email → username |
| `src/lib/auth-rate-limit.ts` | chave: email → username |
| `src/lib/auth.ts` | CredentialsProvider + authorize + session callbacks |
| `src/lib/data.ts` | tipo in-memory atualizado |
| `src/app/api/profile/route.ts` | GET + PUT expandidos |
| `src/app/api/auth/register/route.ts` | email vira opcional |
| `src/components/login/` | campo email → username |
| `src/components/profile/profile-edit-dialog.tsx` | 4 campos editáveis |
| `src/components/profile/profile-page.tsx` | avatar com Gravatar, bio no hero |
| `tests/e2e/` | fixtures de login atualizados |
