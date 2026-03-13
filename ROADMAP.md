# Roadmap

## Visao geral

Evoluir o app em 4 fases, nesta ordem:

1. Introduzir `Prisma` para padronizar acesso a dados.
2. Migrar a interface para `Tailwind + shadcn/ui` com visual mais profissional.
3. Adicionar `Auth.js` com leitura publica e escrita restrita.
4. Expandir o dominio para multiplos usuarios, ligas e times proprios.

O objetivo e reduzir custo de manutencao agora sem bloquear a evolucao futura do produto.

## Status atual

- Fase 1: concluida
- Fase 2: concluida
- Fase 3: nao iniciada
- Fase 4: nao iniciada

## Mudancas em relacao ao plano original

- `Prisma`, que antes era planejado como proxima etapa, ja foi implementado no codigo.
- A UI principal agora usa `Tailwind CSS` com componentes locais no estilo `shadcn/ui`.
- A leitura segue publica e a escrita segue sem autenticacao, como esperado para o estado pre-`Auth.js`.
- O dominio continua fixo em dois times globais, sem `League`, `Workspace` ou contas de usuario.

## Fase 1: Prisma

Status: concluida

- [x] Adicionar `prisma` e `@prisma/client`.
- [x] Criar `schema.prisma` para o dominio atual (`Team` e `Match`).
- [x] Substituir SQL manual por consultas Prisma na camada de dados.
- [x] Manter `DATABASE_URL` como fonte unica de conexao.
- [x] Preservar o contrato atual das APIs e o comportamento do dashboard.
- [x] Criar seed para os times fixos `frontend` e `backend`.
- [x] Manter fallback em memoria para desenvolvimento local sem banco.

## Fase 2: Tailwind + shadcn/ui

Status: concluida

- [x] Instalar e configurar `tailwindcss` e `shadcn/ui`.
- [x] Reescrever o dashboard atual com componentes reutilizaveis.
- [x] Remover a dependencia principal de CSS Modules da tela principal.
- [x] Manter visual limpo, profissional e responsivo.

## Fase 3: Login e autorizacao

Status: nao iniciada

- [ ] Adotar `Auth.js` no App Router.
- [x] Permitir leitura publica do placar e historico.
- [ ] Restringir criacao de partidas a usuarios autenticados e autorizados.
- [ ] Implementar RBAC simples com papeis como `admin` ou `scorekeeper`.
- [ ] Garantir a regra de permissao no backend, nao apenas na UI.

## Fase 4: Multiusuario, ligas e times

Status: nao iniciada

- [ ] Deixar de depender de times fixos globais.
- [ ] Evoluir o modelo para suportar:
  - `User`
  - `League` ou `Workspace`
  - `Membership`
  - `Team`
  - `Match`
- [ ] Permitir que usuarios criem contas, times e partidas dentro de uma liga.
- [ ] Isolar dados por liga e preparar migracao dos dados atuais para uma liga inicial.

## Premissas

- O banco continua sendo `Neon/Postgres`.
- A ordem das fases e obrigatoria.
- A leitura permanecera publica no curto prazo.
- `Tailwind + shadcn/ui` sera a stack visual padrao.
- `Auth.js` sera a stack padrao de autenticacao.
