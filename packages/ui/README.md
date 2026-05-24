# packages/ui

Pacote futuro do design system compartilhado do DeOlho.

Este pacote deve conter os componentes shadcn base, componentes cívicos próprios, tokens visuais e stories. Ele não deve conter lógica de rota, banco, fetch, autenticação, ETL ou decisões de produto que pertençam ao `apps/web`.

## Estrutura esperada

```text
packages/ui/
  src/
    components/
      ui/        # componentes base shadcn/ui
      deolho/    # componentes civicos do DeOlho
    tokens/      # cores, tipos, confianca, fontes, espacamento
    lib/
      cn.ts
    index.ts
```

## Regras

- Componentes base shadcn ficam em `src/components/ui` e devem permanecer próximos do original.
- Componentes de domínio cívico ficam em `src/components/deolho`.
- Todo componente cívico novo precisa ter Storybook e documentação em `docs/components`.
- Props devem ser explícitas para tipo de informação, fonte, confiança, evidência e limitação quando aplicável.
- Dados de exemplo devem ser sintéticos e marcados como tal.

## shadcn/ui

Antes de rodar a CLI, leia `docs/design-system/shadcn.md`. O DeOlho deve usar shadcn como código próprio em monorepo: componentes base em `src/components/ui`, componentes cívicos em `src/components/deolho` e tokens em `src/tokens`.
