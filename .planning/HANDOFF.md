# Handoff

Última atualização: 2026-05-23

## Estado atual

- Repositório canônico: `https://github.com/pmarcura/DeOlho`
- Branch base: `main`
- Branch de trabalho atual: `codex/issue-7-m0-fundacao`
- Milestone atual: `M0 - Fundação aberta`
- Issue atual: [#7 - Configurar repositório público, licença, README e CONTRIBUTING](https://github.com/pmarcura/DeOlho/issues/7)
- Próxima issue preparada: [#22 - Scaffold técnico Next/Postgres/Drizzle](https://github.com/pmarcura/DeOlho/issues/22)
- Issue de UI preparada: [#24 - Implementar design system shadcn social-cívico](https://github.com/pmarcura/DeOlho/issues/24)

## O que este pacote entrega

- Documentação inicial do projeto em PT-BR.
- Regras de contribuição e conduta.
- Licença MIT para o código.
- Instruções compartilhadas para Codex, Claude Code e GSD.
- Ponte Obsidian local -> `.planning/` -> GitHub documentada.
- Fundação de design system shadcn/ui documentada em `.planning/DESIGN_SYSTEM.md`.
- Documentação operacional do DeOlho Interface System criada em `docs/design-system`, `docs/components`, `docs/patterns` e `docs/agents`.
- Página HTML estática inicial do DeOlho Interface System criada em `apps/docs/index.html`.
- Referências externas de maturidade registradas em `docs/design-system/referencias.md`.
- Estrutura inicial de `apps/docs` e `packages/ui` preparada para o scaffold futuro.
- Ponte explícita para scaffold técnico antes do CI completo.

## Decisões preservadas do Claude

- MVP é a página viva de contrato público.
- Sistema de confiança vem antes da UI final.
- PNCP é a primeira fonte de dados.
- Next.js + PostgreSQL + Drizzle é a arquitetura base.
- IA não pode inventar fatos, acusar ou substituir evidência oficial.
- Obsidian continua como camada de pensamento; `.planning/` é o contexto versionado para execução.
- Interface deve seguir o design system social-cívico: eventos públicos, páginas de entidade, evidência, fonte e confiança.
- `.claude/` fica fora do versionamento.

## Obsidian

Leia `.planning/OBSIDIAN.md` antes de mexer em decisões de produto ou arquitetura vindas de notas locais. O vault Obsidian atual não foi detectado dentro deste repositório; por isso, não há configuração `.obsidian/` versionada.

## Próximo passo recomendado

Executar a issue #22 em uma branch nova após merge deste pacote:

```bash
git pull --ff-only
git switch main
git pull --ff-only
git switch -c codex/issue-22-scaffold-tecnico
```

O scaffold deve criar os scripts que a issue #8 usará no CI.

Ao criar `apps/web` e `packages/ui`, seguir `.planning/DESIGN_SYSTEM.md`, `docs/design-system/index.md` e a referência visual em `apps/docs/index.html` para estrutura de pastas, componentes shadcn base, componentes cívicos, estados obrigatórios e regras de agentes.
