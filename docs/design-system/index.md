# DeOlho Interface System

O **DeOlho Interface System** é a documentação operacional de UI/UX do DeOlho. Ele orienta como construir interfaces cívicas modernas, verificáveis e compreensíveis para dados públicos brasileiros.

O objetivo não é apenas listar componentes. O sistema define princípios, vocabulário, padrões de tela, estados obrigatórios, acessibilidade, linguagem e regras que humanos, Codex, Claude e GSD devem seguir antes de alterar qualquer experiência de produto.

## Por que existe

DeOlho lida com informação pública sensível. Uma decisão visual ruim pode misturar fato oficial com explicação de IA, transformar sinal estatístico em acusação ou esconder uma limitação relevante da fonte.

Este design system existe para garantir que toda tela responda:

- Qual é o tipo da informação?
- Qual é a fonte?
- Qual é a evidência?
- Qual é o nível de confiança?
- O que a fonte não informa?
- Como o usuário volta ao documento original?

## Como ajuda humanos e agentes

Para humanos, a documentação reduz ambiguidade de design, revisão e contribuição. Para agentes, ela funciona como contrato de implementação: antes de criar componente, rota ou padrão novo, o agente deve verificar se já existe uma regra, componente ou estado obrigatório.

Todo agente deve tratar este sistema como fonte operacional para UI. Quando houver conflito entre preferência estética e confiança pública, vence confiança pública.

## Relação entre Storybook, docs e app

| Camada | Função | Fonte |
|--------|--------|-------|
| `packages/ui` | Componentes base, componentes cívicos, tokens e stories | Código |
| Storybook | Estados vivos, acessibilidade visual e variantes isoladas | `packages/ui` |
| `docs/` | Regras, padrões, linguagem, checklists e decisões | Markdown versionado |
| `apps/docs` | Site público que renderiza a documentação; por enquanto tem um HTML estático inicial em `apps/docs/index.html` | `docs/` |
| `apps/web` | Produto final usando componentes e padrões aprovados | App |

## Leitura mínima para UI

1. [Princípios de UX](principios-ux.md)
2. [Princípios de UI](principios-ui.md)
3. [Tokens](tokens.md)
4. [Referências de design systems](referencias.md)
5. [Componentes cívicos](../components/civicos.md)
6. [Padrões de tela](../patterns/telas.md)
7. [Estados obrigatórios](../patterns/estados.md)
8. [Regras para agentes](../agents/regras.md)
9. [Checklist de PR de UI](../agents/checklist-pr-ui.md)

## Página HTML inicial

A primeira versão navegável da documentação está em `apps/docs/index.html`. Ela é um protótipo estático e pode ser aberta diretamente no navegador enquanto o scaffold de `apps/docs` ainda não existe.

O HTML não substitui os arquivos Markdown. Ele deve ser tratado como a face pública inicial do conteúdo versionado em `docs/`.

## Regra central

Sem fonte, sem afirmação pública. Sem evidência, sem conclusão. Sem contexto, sem sinal de atenção.
