# shadcn/ui no DeOlho

Este documento define como o DeOlho deve usar shadcn/ui no monorepo. Ele complementa `.planning/DESIGN_SYSTEM.md` e deve ser lido antes de implementar `packages/ui`, `apps/web` ou `apps/docs`.

## Decisão de arquitetura

shadcn/ui não deve ser tratado como dependência visual fechada. O modelo correto é **código aberto dentro do repositório**: a CLI copia componentes para o projeto, e o DeOlho passa a possuir, revisar e evoluir esse código.

Isso combina com o produto por três motivos:

- componentes de dado público precisam de revisão ética, acessibilidade e linguagem cívica;
- agentes precisam ler código real para entender como compor telas;
- o design system precisa evoluir com Storybook, docs e regras de confiança.

## Estrutura alvo

```text
apps/
  web/
    components.json
    app/
    components/app-shell/
    features/
  docs/
    index.html
    app/                 # futuro Next.js docs site
    components.json      # quando o docs site usar shadcn
packages/
  ui/
    components.json
    src/
      components/
        ui/              # shadcn base
        deolho/          # componentes civicos
      hooks/
      lib/
        utils.ts
      styles/
        globals.css
      tokens/
        deolho.tokens.json
```

## Regra de instalação

Durante o scaffold técnico (#22), usar o modo não interativo e base Radix:

```bash
npx shadcn@latest init -d --monorepo --base radix
```

Se o scaffold já existir e a CLI não conseguir inferir a estrutura, inicializar `components.json` de cada workspace manualmente e rodar `npx shadcn@latest info` antes de adicionar componentes.

## Requisitos de `components.json`

Cada workspace que consome ou instala shadcn precisa de `components.json`.

Regras para o DeOlho:

- `apps/web/components.json` aponta `ui` para o pacote compartilhado.
- `packages/ui/components.json` aponta `ui`, `components`, `lib`, `hooks` e `utils` para dentro do próprio pacote.
- `style`, `iconLibrary` e `baseColor` devem ser iguais entre workspaces.
- Tailwind v4 deve deixar `tailwind.config` vazio quando não houver arquivo dedicado.
- `cssVariables` deve permanecer `true`.

Exemplo conceitual para `apps/web`:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "radix-nova",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "../../packages/ui/src/styles/globals.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/components",
    "hooks": "@/hooks",
    "lib": "@/lib",
    "utils": "@workspace/ui/lib/utils",
    "ui": "@workspace/ui/components"
  }
}
```

Exemplo conceitual para `packages/ui`:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "radix-nova",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/styles/globals.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@workspace/ui/components",
    "utils": "@workspace/ui/lib/utils",
    "hooks": "@workspace/ui/hooks",
    "lib": "@workspace/ui/lib",
    "ui": "@workspace/ui/components"
  }
}
```

## Ordem de adição dos componentes base

Depois do scaffold, instalar os componentes em pacotes pequenos:

```bash
cd apps/web
npx shadcn@latest add button badge card avatar tooltip skeleton alert
npx shadcn@latest add command dialog drawer sheet sidebar tabs table scroll-area
npx shadcn@latest add carousel dropdown-menu hover-card input popover sonner
```

Antes de sobrescrever qualquer componente já alterado pelo DeOlho, usar `--diff` e revisar manualmente.

## Camadas de componente

| Camada | Pasta | Regra |
|--------|-------|-------|
| Base shadcn | `packages/ui/src/components/ui` | Genérica, próxima do original, sem domínio cívico |
| Cívica | `packages/ui/src/components/deolho` | Fonte, evidência, confiança, limitação, IA e sinais |
| Feature | `apps/web/features/*` | Dados sintéticos, composição de rota e integração futura |
| Shell | `apps/web/components/app-shell` | Navegação, busca, painéis e layout |
| Docs | `apps/docs` e `docs/*` | Explica decisão, uso, estados e governança |

## Contrato de componente cívico

Todo componente em `components/deolho` deve ter:

- props explícitas para `tipoInformacao`, `fonte`, `confianca`, `evidencias` e `limitacoes` quando aplicável;
- estado visual padrão, loading, vazio, erro, incompleto, fonte atrasada e revisão pendente;
- Storybook com dados sintéticos;
- documentação em `docs/components/civicos.md`;
- regra de acessibilidade: texto e ícone, nunca só cor;
- teste mínimo de renderização quando o pacote de testes existir.

## Registro futuro

Quando `packages/ui` amadurecer, o DeOlho pode publicar um registro próprio shadcn para reutilizar componentes em outros projetos cívicos:

```text
registry/
  deolho/
    tipo-informacao-badge.json
    evento-publico-card.json
    painel-evidencia.json
```

Não criar registry antes de haver componentes estáveis e Storybook revisado.

## Figma e handoff

A biblioteca Figma futura deve espelhar tokens e props reais. Figma não vira fonte de verdade isolada: a fonte operacional continua em `docs/`, `packages/ui` e Storybook.

Regras:

- componente Figma precisa mapear para componente React;
- variants precisam refletir props reais;
- exemplos usam dados sintéticos;
- mudanças visuais que alteram confiança, fonte ou IA precisam atualizar docs antes de código.

## Anti-padrões

- Instalar componente shadcn direto em `apps/web/components/ui` quando ele deveria ser compartilhado em `packages/ui`.
- Colocar lógica de contrato, empresa, político ou fonte dentro de componente base.
- Usar `Dialog` para confirmação destrutiva sem `AlertDialog`.
- Criar `div rounded border p-*` repetido quando existe `Card`, `Sheet`, `Table`, `Tabs` ou `Sidebar`.
- Misturar tokens semânticos do DeOlho com classes ad hoc para estados críticos.
- Atualizar componente base sem Storybook e sem checklist de PR.

## Fontes oficiais consultadas

- `https://ui.shadcn.com/docs`
- `https://ui.shadcn.com/docs/monorepo`
- `https://ui.shadcn.com/docs/cli`
- `https://ui.shadcn.com/docs/components-json`
- `https://ui.shadcn.com/docs/theming`
- `https://ui.shadcn.com/docs/registry`
- `https://ui.shadcn.com/docs/figma`
