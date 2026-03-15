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

### Alias e sobreposicoes de token ainda estao redundantes

Status: aceitavel agora, mas gera ruido

- Alias como `--card`, `--card-strong` e `--card-strong-foreground` ainda convivem com a semantica de `surface`

Direcao:

- Escolher uma semantica principal e remover alias cosmeticos desnecessarios

### Provider robusto para runtime, mas relaxado para consumo

Status: aceitavel agora por causa dos testes, mas fragil para evolucao

- `useTheme()` hoje retorna contexto default com no-op fora do provider
- Isso evita quebrar testes, mas mascara erro de integracao

Direcao:

- Voltar o hook para modo estrito quando a base de testes suportar isso

## Vale refatorar antes de expandir

### Inputs e controles do login

Status: concluido parcialmente

- Os campos do login ja foram migrados para primitives locais em `src/components/ui/form.tsx`
- O controle segmentado `Entrar` / `Criar conta` ainda nao virou primitive reutilizavel

Direcao:

- Opcionalmente extrair esse controle quando surgir mais de um fluxo que precise dele

### Dashboard ainda depende de `style` inline para cor de time

Prioridade: media

- O `TeamScoreCard` ainda usa `style` inline para algumas cores

Direcao:

- Criar variante previsivel por time, via `cva` ou `data-team`

### Tipografia, radius e sombras ainda nao foram sistematizados

Prioridade: media

- Existem valores repetidos de raio, sombras e tipografia espalhados em login/dashboard

Direcao:

- Definir escalas minimas para:
  - radius
  - shadow
  - type

### Cobertura de teste de tema

Status: concluido para provider e toggle

- Ja existe cobertura dedicada para provider e toggle
- Ainda nao ha cobertura focada no script inline de tema em `src/app/layout.tsx`

Direcao:

- Avaliar teste do script inline
- Endurecer `useTheme()` depois disso

## Ordem recomendada

1. Tornar `useTheme()` estrito de novo
2. Padronizar escala minima de radius, shadow e type
3. Refatorar cards de time do dashboard para variantes sem inline style
4. Avaliar se vale testar o script inline de tema em `layout.tsx`
5. So depois disso iniciar redesign maior do dashboard
