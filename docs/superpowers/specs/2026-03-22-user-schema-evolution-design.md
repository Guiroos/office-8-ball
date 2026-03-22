# Design Spec — Evolução do Schema de User

**Data:** 2026-03-22
**Status:** aprovado

## Contexto

O modelo `User` atual expõe apenas `displayName` como campo editável no perfil. O objetivo é enriquecer o perfil do usuário com `avatarUrl` e `bio`, tornar `email` opcional (a identidade passa a ser `username` + senha), e migrar o login de email-based para username-based.

## Escopo

### O que muda

- `email` vira opcional no schema (`String?`), no `registerSchema` e no formulário de registro
- Login migra de email → username como identificador principal
- Dois novos campos no `User`: `avatarUrl` e `bio`
- `PUT /api/profile` passa a aceitar `email`, `displayName`, `avatarUrl`, `bio`
- `ProfileEditDialog` expande para os 4 campos editáveis
- Avatar exibido com URL fornecida pelo usuário; fallback: identicon via Gravatar usando hash do `username`
- `RegisterUserResponse` / `SessionUser` passam a aceitar `email: string | null`
- Rate limit usa `identifier` (username ou email) em vez de `email` fixo

### O que não muda

- `username` continua único e imutável após o cadastro
- Rate limiting de auth continua funcionando (coluna `email` do `AuthRateLimit` armazena o valor de identificação — sem migration de schema nessa tabela)
- In-memory fallback não tem mudanças funcionais: auth exige `DATABASE_URL`, então não há estrutura de usuário em memória para atualizar
- Domínio de times: sem mudança nesta iteração (`teamId` fica para o spec de times)
- Fluxo de troca de senha: sem mudança (item 7 do roadmap, independente)
- `displayName` não pode ser limpo (enviando `null`); apenas atualizado ou omitido no payload

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

**Unicidade de `email` nullable:** no PostgreSQL, `UNIQUE` em coluna nullable permite múltiplos `NULL`. Dois usuários sem email não conflitam entre si.

### Migration

Gerada via `prisma migrate dev`. Remove `NOT NULL` de `email` e adiciona `avatar_url` e `bio` como colunas nullable. Usuários existentes mantêm seus dados.

### Invalidação de sessões JWT ativas

Sessões existentes expiram naturalmente no TTL do JWT (padrão Auth.js: 30 dias). Se invalidação imediata for necessária, rotacionar `NEXTAUTH_SECRET` na deploy invalida todos os tokens.

---

## Seção 2 — Refatoração do Auth (email → username)

### `src/lib/auth-validation.ts`

Duas mudanças:

1. **`loginSchema`** muda de `{ email, password }` para `{ username, password }`. Validação de formato de email removida.

2. **`registerSchema`** tem `email` tornado opcional:
   ```ts
   email: emailSchema.optional()
   ```

O helper `mapZodErrorToFieldErrors` já aceita `"username"` como chave válida — sem alteração.

### `src/lib/auth-rate-limit.ts`

`buildAuthRateLimitKey` passa a receber `identifier` no lugar do parâmetro público `email`. O tipo `AuthRateLimitKey` **mantém o campo interno chamado `email`** (compatível com a coluna de mesmo nome no `AuthRateLimit`): o parâmetro público `identifier` é atribuído ao campo `email` internamente.

Normalização: substituir `normalizeEmail(input.email)` por `normalizeUsername(input.identifier)` (mesma semântica: `trim().toLowerCase()`). Remover o import de `normalizeEmail` — passa a ser desnecessário neste módulo.

O `id` da chave muda de `"${action}:${email}:${ip}"` para `"${action}:${identifier}:${ip}"`. Sem migration de schema na tabela `auth_rate_limits`.

### `src/lib/auth.ts`

**`CredentialsProvider`:**
- O objeto `credentials` declarado no provider muda de `{ email: { label: "Email", type: "email" }, password: ... }` para `{ username: { label: "Usuário", type: "text" }, password: ... }` — sem essa mudança, `credentials?.username` em `authorize()` seria `undefined` em runtime
- `authorize()` usa `prisma.user.findUnique({ where: { username } })`
- Call-site de `buildAuthRateLimitKey` muda de `{ action: "login", email, ... }` para `{ action: "login", identifier: username, ... }`
- Retorna `{ id, email: user.email ?? null, name: user.username, username: user.username }`

**Session callback** — nova condição de guarda (remove `token.email`):

```ts
if (session.user && token.sub && token.username) {
  session.user.id = token.sub;
  session.user.email = token.email ?? null;
  session.user.username = String(token.username ?? session.user.name ?? "");
  session.user.name = session.user.username;
}
```

**`getAuthenticatedUser()`** — remove checagem de email:

```ts
if (!session?.user?.id || !session.user.username) {
  return null;
}

return {
  id: session.user.id,
  email: session.user.email ?? null,
  username: session.user.username,
};
```

### `src/app/api/auth/register/route.ts`

- `email` vira campo opcional no payload (validado pelo `registerSchema` atualizado)
- Após `validateRegisterPayload`, desestruturar como `const { username, password, email } = validation.data` — `email` terá tipo `string | undefined`
- Verificação de duplicidade usa OR condicional: `OR: [{ username }, ...(email ? [{ email }] : [])]`
- Call-site de `buildAuthRateLimitKey` muda para `{ action: "register", identifier: email ?? username, ... }`
- `prisma.user.create`: passar `email: email ?? undefined` — `undefined` faz o Prisma omitir o campo (sem valor no banco, ficará `NULL`); **nunca passar `null` explícito** pois isso seria um valor explícito diferente de omitido no Prisma
- `RegisterUserResponse` retorna `SessionUser` com `email: string | null`

### `src/components/login/login-screen.tsx`

**Modo login:**
- **Remover** o `<Field>` de email do caminho de renderização do modo login (atualmente o campo email aparece nos dois modos)
- **Adicionar** `<Field>` de username (`type="text"`, label "Usuário") visível apenas no modo login — espelhando a lógica inversa do campo username atual que só aparece no registro
- `getValidationErrors()`: substituir `getLoginFieldErrors({ email: nextForm.email, password })` por `getLoginFieldErrors({ username: nextForm.username, password })`
- `handleLogin()`: payload do `signIn()` muda de `{ email: form.email, password }` para `{ username: form.username, password }`

**Modo registro:**
- Campo `email` torna-se opcional: remover atributo `required`, adicionar "(opcional)" ao label ou placeholder
- Ordem dos campos no registro: username, senha, email (opcional)
- `handleRegister()`: envia `{ username, password, email: form.email || undefined }` para `POST /api/auth/register`
- Após cadastro bem-sucedido, o `signIn()` automático passa `{ username: form.username, password }` em vez de `{ email: form.email, password }`

### `src/lib/types.ts`

```ts
export type SessionUser = {
  id: string;
  username: string;
  email: string | null;
};
```

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

Sem mudança de lógica — basta expor `avatarUrl` e `bio` na resposta serializada. O campo `email` já é retornado diretamente de `profile.email`; com o tipo `ProfileResponse` atualizado, TypeScript aceita `string | null`.

### `PUT /api/profile` — schema Zod

```ts
const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(50).optional(),          // sem nullable: limpeza fora do escopo
  email: z.string().email().optional().nullable(),
  avatarUrl: z.string().url().max(500).optional().nullable(),  // 500 chars: intencional
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

**Ordem de implementação:** atualizar `ProfileResponse` em `types.ts` antes de modificar `ProfileEditDialog`.

### `profile-page.tsx`

**Avatar:** lógica condicional no lugar do círculo de iniciais atual:
1. Se `avatarUrl` está preenchida → `<img src={avatarUrl}>`
2. Se não → identicon via Gravatar: `https://www.gravatar.com/avatar/<hash(username)>?d=identicon`
   - Hash do `username` (não do email): garante identicon determinístico mesmo sem email
   - Usar Web Crypto API (`crypto.subtle.digest("SHA-256", ...)`) para gerar hash no cliente (disponível em browser e Node 18+); não adicionar dependência de lib de MD5
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

### Testes de registro (`/api/auth/register/route.test.ts`)

- Registro sem email cria usuário com sucesso (retorna 201)
- Registro com email duplicado retorna 409 com `fieldErrors.email`
- Dois registros sem email não conflitam entre si (unicidade de NULL)
- Rate limit de registro usa username como chave quando email está ausente

### Testes de auth

- Login com `username` + senha correta autentica com sucesso
- Login com `username` inexistente retorna null
- Rate limit continua bloqueando após falhas usando username como chave

### Testes de componente

- `ProfileEditDialog` renderiza os 4 campos
- `ProfileEditDialog` exibe erro para URL inválida no avatar
- `profile-page.tsx` renderiza `<img>` quando `avatarUrl` está presente
- `profile-page.tsx` usa URL do Gravatar quando `avatarUrl` é null

### E2E (`e2e/helpers/auth.ts` e `e2e/auth-and-scoreboard.spec.ts`)

- `login()` helper: `getByLabel("E-mail corporativo")` → `getByLabel` do novo label de username
- `createCredentials()`: mantém `email` como campo opcional (ainda usado no registro quando presente); garante que `username` é passado no login
- Payloads de `page.fill()` nos fixtures usam `username` em vez de `email`
- Teste de conflito de email no cadastro: continua válido (email ainda é único quando fornecido); `createCredentials()` deve fornecer email explicitamente nesse cenário

---

## Arquivos afetados

| Arquivo | Tipo de mudança |
|---|---|
| `prisma/schema.prisma` | `email` nullable, `avatarUrl`, `bio` adicionados |
| `prisma/migrations/` | nova migration gerada |
| `src/lib/types.ts` | `SessionUser.email` nullable, `ProfileResponse` expandido |
| `src/lib/auth-validation.ts` | `loginSchema`: email → username; `registerSchema`: email opcional |
| `src/lib/auth-rate-limit.ts` | parâmetro público `email` → `identifier`; normalização via `normalizeUsername`; import de `normalizeEmail` removido |
| `src/lib/auth.ts` | CredentialsProvider, authorize (call-site identifier), session callback, getAuthenticatedUser |
| `src/app/api/profile/route.ts` | GET expõe novos campos; PUT schema Zod expandido |
| `src/app/api/auth/register/route.ts` | email opcional, OR condicional, call-site identifier, create com `email ?? undefined` |
| `src/components/login/login-screen.tsx` | campo email removido do login; email opcional no registro; getValidationErrors e signIn payload atualizados |
| `src/components/profile/profile-edit-dialog.tsx` | 4 campos editáveis, recebe ProfileResponse completo |
| `src/components/profile/profile-page.tsx` | avatar com Gravatar identicon, bio no hero |
| `e2e/helpers/auth.ts` | helper de login atualizado para username |
| `e2e/auth-and-scoreboard.spec.ts` | fixtures e labels atualizados |
