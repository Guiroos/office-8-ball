# Tech Spec - Theme System

## Objetivo

Centralizar a revisao tecnica do sistema de tema atual e organizar os proximos passos do design system da aplicacao.

## Solido

### Arquitetura geral do tema

Status: manter

- O uso de tokens globais em `src/app/globals.css` com Tailwind v4 via `@theme inline` esta correto
- O provider em `src/components/theme/theme-provider.tsx` cuida de estado, persistencia e sincronizacao com o sistema
- O script inicial em `src/app/layout.tsx` evita flash de tema errado antes da hidratacao

### Adocao pelos primitives

Status: manter e expandir

- `Button`, `Card` e `Badge` ja consomem tokens semanticos em vez de cores fixas
- login e dashboard agora compartilham uma escala minima de `radius`, `shadow` e `type` via tokens globais
- Isso reduz retrabalho e evita duplicacao de paleta entre login e dashboard

### Modo claro/escuro

Status: manter

- A estrategia `system` por padrao com persistencia local esta coerente
- O toggle reutilizavel permite reaproveitamento sem acoplar a alternancia a uma tela unica

## Aceitavel, mas provisorio

### Tokens ainda misturam sistema e composicao

Status: aceitavel agora, mas precisa organizacao antes de escalar

- Existem tokens realmente globais junto com tokens especificos de composicao, como `--hero-gradient`, `--brand-gradient` e `--page-gradient`

Direcao:

- Separar em grupos:
  - foundation
  - semantic surfaces
  - brand/team
  - composition

### Tokens de composicao ainda convivem com foundation no mesmo arquivo

Status: aceitavel agora, mas ainda pede disciplina

- Os aliases redundantes de card ja foram removidos em favor da semantica de `surface`
- Ainda existem tokens de composicao, como `--hero-gradient`, `--brand-gradient` e `--page-gradient`, no mesmo arquivo dos foundations

Direcao:

- Manter `surface` como semantica principal
- Reavaliar separacao fisica por grupos apenas se o volume de tokens crescer

### Provider robusto para runtime, mas relaxado para consumo

Status: resolvido

- `useTheme()` voltou a ser estrito e agora falha explicitamente fora de `ThemeProvider`
- A regra de leitura/resolve do tema foi centralizada em helper compartilhado entre provider, testes e script de bootstrap

Direcao:

- Manter o hook estrito

## Vale refatorar antes de expandir

### Inputs e controles do login

Status: concluido parcialmente

- Os campos do login ja foram migrados para primitives locais em `src/components/ui/form.tsx`
- O controle segmentado `Entrar` / `Criar conta` ainda nao virou primitive reutilizavel

Direcao:

- Opcionalmente extrair esse controle quando surgir mais de um fluxo que precise dele

### Dashboard usa variantes previsiveis por time

Status: resolvido

- O `TeamScoreCard` agora usa variantes por time e estado de lideranca
- O componente expõe `data-team` e `data-leader` para leitura e teste sem depender de `style` inline

Direcao:

- Reutilizar o mesmo padrao se surgirem novos cards tematicos

### Tipografia, radius e sombras ganharam escala minima

Status: resolvido no pacote atual

- `globals.css` agora define foundation tokens para `radius`, `shadow`, `font` e tamanhos de display/label
- Primitives e telas principais migraram dos valores soltos mais repetidos para essa escala

Direcao:

- Expandir a escala apenas quando houver novo caso real de uso

### Cobertura de teste de tema

Status: concluido para provider, toggle e bootstrap

- Ja existe cobertura dedicada para provider e toggle
- Agora tambem existe cobertura para o script inline de bootstrap do tema

Direcao:

- Manter a cobertura sincronizada com qualquer mudanca no bootstrap inicial

## Ordem recomendada

1. Preservar `useTheme()` estrito em qualquer novo componente de tema
2. Reaproveitar a escala minima de `radius`, `shadow` e `type` antes de introduzir novos valores soltos
3. So depois disso iniciar redesign maior do dashboard
