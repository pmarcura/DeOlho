# Handoff

Última atualização: 2026-05-23

## Estado atual

- Repositório canônico: `https://github.com/pmarcura/DeOlho`
- Branch base: `main`
- Branch de trabalho atual: `codex/issue-7-m0-fundacao`
- Milestone atual: `M0 - Fundação aberta`
- Issue atual: [#7 - Configurar repositório público, licença, README e CONTRIBUTING](https://github.com/pmarcura/DeOlho/issues/7)
- Próxima issue preparada: [#22 - Scaffold técnico Next/Postgres/Drizzle](https://github.com/pmarcura/DeOlho/issues/22)

## O que este pacote entrega

- Documentação inicial do projeto em PT-BR.
- Regras de contribuição e conduta.
- Licença MIT para o código.
- Instruções compartilhadas para Codex, Claude Code e GSD.
- Ponte Obsidian local -> `.planning/` -> GitHub documentada.
- Ponte explícita para scaffold técnico antes do CI completo.

## Decisões preservadas do Claude

- MVP é a página viva de contrato público.
- Sistema de confiança vem antes da UI final.
- PNCP é a primeira fonte de dados.
- Next.js + PostgreSQL + Drizzle é a arquitetura base.
- IA não pode inventar fatos, acusar ou substituir evidência oficial.
- Obsidian continua como camada de pensamento; `.planning/` é o contexto versionado para execução.
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
