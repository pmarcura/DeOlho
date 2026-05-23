# Ponte Obsidian

Este documento registra como o DeOlho deve continuar conectado ao Obsidian sem transformar o vault local no repositório central.

## Estado atual

- O Obsidian é a camada de pensamento: rascunhos, mapas mentais, notas longas, referências e decisões em formação.
- `.planning/` é a camada versionada: contexto curado, requisitos, pesquisas, handoffs e decisões prontas para execução.
- GitHub é a camada de execução: issues, milestones, branches, PRs, revisão e histórico público.
- `.obsidian/` e configurações locais de vault não devem ser versionadas neste repositório.

## Fluxo correto

1. Ideias e rascunhos nascem no vault Obsidian local.
2. O que virar requisito, decisão ou contexto operacional é promovido para `.planning/`.
3. O que virar trabalho executável entra em issue GitHub.
4. Codex, Claude e GSD executam a partir de `.planning/` e da issue ativa.
5. Ao fim da entrega, o handoff volta para `.planning/HANDOFF.md` e, quando fizer sentido, para uma nota no Obsidian.

## O que deve ir para o Obsidian

- Exploração livre de ideias.
- Mapas mentais e contexto de produto.
- Referências longas de pesquisa.
- Rascunhos de ADRs e specs antes de ficarem estáveis.
- Notas de decisão ainda não prontas para issue.

## O que deve ir para `.planning/`

- Requisitos ativos e fora de escopo.
- Decisões que afetam arquitetura, dados, confiança, UX ou roadmap.
- Pesquisas que agentes precisam ler antes de implementar.
- Handoffs entre Codex, Claude e GSD.
- Contexto mínimo para reproduzir a próxima execução sem depender do vault local.

## O que deve ir para GitHub

- Issues executáveis.
- Milestones e roadmap público.
- Pull requests e revisões.
- Discussões que precisam de histórico público.
- Bugs, tarefas, critérios de aceite e validações.

## Regras para agentes

- Não procurar ou alterar o vault Obsidian local sem pedido explícito.
- Não versionar `.obsidian/`, plugins, temas ou configurações pessoais.
- Se uma decisão aparecer só no Obsidian, ela precisa ser promovida para `.planning/PROJECT.md`, `.planning/HANDOFF.md` ou outro documento versionado antes de guiar implementação.
- Se houver divergência entre Obsidian e `.planning/`, parar e pedir confirmação; não escolher silenciosamente.
- Todo PR que alterar decisões de produto deve atualizar `.planning/` para manter a ponte com Obsidian consistente.

## Publicação futura

O requisito OSS-03 prevê um vault Obsidian público via Obsidian Publish. Isso ainda não está implementado. Antes de publicar, revisar:

- dados sensíveis ou notas pessoais;
- rascunhos que possam parecer afirmações públicas sem fonte;
- decisões antigas que foram superadas;
- linguagem que possa sugerir acusação ou julgamento.

Enquanto Obsidian Publish não existir, o repositório GitHub e `.planning/` são a fonte pública do projeto.
