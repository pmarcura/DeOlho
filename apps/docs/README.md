# apps/docs

Aplicação futura da documentação pública do **DeOlho Interface System**.

Este diretório existe para separar a documentação web do produto principal (`apps/web`). O scaffold técnico ainda será criado em issue própria; até lá, a fonte de conteúdo operacional fica em `docs/`.

Enquanto o scaffold não existe, `index.html` funciona como página estática inicial do **DeOlho Interface System**. Ela pode ser aberta diretamente no navegador e deve evoluir como referência visual até ser convertida para Next.js.

## Responsabilidade

- Publicar os guias de UI/UX, componentes, padrões de tela, acessibilidade e regras para agentes.
- Renderizar `docs/design-system`, `docs/components`, `docs/patterns` e `docs/agents`.
- Linkar exemplos vivos do Storybook quando `packages/ui` existir com componentes implementados.
- Servir como referência pública para humanos, Codex, Claude, GSD e contribuidores.

## Stack escolhida

Preferência inicial: Next.js App Router, para manter a mesma base mental de `apps/web` e permitir exemplos interativos com os componentes do pacote `packages/ui`.

Storybook continua sendo o laboratório de componente vivo. `apps/docs` explica o porquê, quando usar e como revisar; Storybook mostra variantes, estados e comportamento isolado.

## Rotas conceituais

```text
/
/design-system
/components/base
/components/civicos
/patterns/telas
/patterns/navegacao
/patterns/estados
/patterns/conteudo-linguagem
/patterns/acessibilidade
/agents/regras
/agents/checklist-pr-ui
```

## Regra de implementação futura

Não duplicar conteúdo manualmente em `apps/docs`. O app deve importar ou renderizar os documentos de `docs/` para manter uma única fonte de verdade.

## Referências externas

As referências usadas para estruturar a maturidade do sistema estão em `docs/design-system/referencias.md`. Elas incluem Carbon, Fluent, Figma, USWDS, GOV.UK, Atlassian, Primer, Spectrum e Polaris.
