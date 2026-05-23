# DeOlho

DeOlho é uma plataforma brasileira de transparência cívica open source. O objetivo é transformar dados públicos difíceis de entender em páginas claras, rastreáveis e verificáveis, começando por contratos públicos.

O produto ainda está em fase de fundação. Este repositório hoje contém o contexto do projeto, pesquisa de stack, roadmap inicial e regras de colaboração para agentes e contribuidores.

## Valor central

Transformar um contrato público difícil de entender em uma página clara, rastreável e verificável que qualquer cidadão consegue compreender em segundos, com fonte, evidência, limitações e contexto.

## Princípios

- **Evidência obrigatória:** nenhuma afirmação deve aparecer sem fonte documentada.
- **Confiança explícita:** fatos oficiais, explicações, sinais de atenção, notícias e opiniões precisam ser separados.
- **Sem acusações automáticas:** o DeOlho não julga, não acusa e não cria score de corrupção.
- **IA responsável:** modelos podem resumir, explicar e sugerir perguntas, mas nunca inventar fatos.
- **Português do Brasil:** interface, documentação pública e issues devem priorizar PT-BR.
- **Aberto e reproduzível:** decisões, código, issues e critérios de aceite devem ser revisáveis no GitHub.

## Status

Fase atual: **M0 - Fundação aberta**.

Trabalho em andamento:

- [#7 - Configurar repositório público, licença, README e CONTRIBUTING](https://github.com/pmarcura/DeOlho/issues/7)
- [#22 - Scaffold técnico Next/Postgres/Drizzle](https://github.com/pmarcura/DeOlho/issues/22)
- [#24 - Implementar design system shadcn social-cívico](https://github.com/pmarcura/DeOlho/issues/24)
- [#8 - Criar CI inicial com lint, typecheck, test e build](https://github.com/pmarcura/DeOlho/issues/8)

O próximo bloco técnico deve criar o scaffold antes do CI completo, porque ainda não há `package.json` nem scripts para `lint`, `typecheck`, `test` e `build`.

## Roadmap inicial

- **M0 - Fundação aberta:** documentação OSS, regras de contribuição, coordenação entre agentes e base para CI.
- **M1 - Modelo de confiança e dados:** proveniência, evidência, tipos de confiança, freshness e entidades canônicas.
- **M2 - Ingestão PNCP mínima:** coleta inicial, payload raw em JSONB, campos normalizados e controle incremental.
- **M3 - Página viva de contrato:** busca, página pública, fontes, limitações, timeline e resumo controlado.
- **M4 - Relações, sinais e exportação:** relações empresa/órgão, sinais não acusatórios, export CSV/JSON e correção de erros.

Veja os milestones e issues em [GitHub Issues](https://github.com/pmarcura/DeOlho/issues).

## Stack prescrita

A arquitetura segue a pesquisa em [.planning/research/STACK.md](.planning/research/STACK.md):

- Next.js App Router + React
- TypeScript strict
- PostgreSQL com JSONB, FTS, `pg_trgm`, `unaccent` e pgvector
- Drizzle ORM e migrations revisáveis
- pg-boss para jobs/ETL em worker separado
- shadcn/ui, Radix, Tailwind e lucide-react
- Zod para validação de payloads de fontes públicas

Versões exatas devem ser verificadas no momento do scaffold. A arquitetura do Claude deve ser preservada, e qualquer troca relevante precisa virar decisão registrada.

## Documentos de contexto

- [.planning/PROJECT.md](.planning/PROJECT.md) - fonte principal de produto, requisitos e limites.
- [.planning/config.json](.planning/config.json) - configuração GSD deixada pelo Claude.
- [.planning/OBSIDIAN.md](.planning/OBSIDIAN.md) - ponte entre Obsidian, `.planning/` e GitHub.
- [.planning/DESIGN_SYSTEM.md](.planning/DESIGN_SYSTEM.md) - fundação shadcn/ui e componentes cívicos próprios.
- [.planning/research/STACK.md](.planning/research/STACK.md) - pesquisa de stack.
- [.planning/research/FEATURES.md](.planning/research/FEATURES.md) - pesquisa de features e ordem recomendada.
- [.planning/HANDOFF.md](.planning/HANDOFF.md) - handoff curto para Codex, Claude e próximos agentes.
- [AGENTS.md](AGENTS.md) - regras compartilhadas para agentes.

## Obsidian

O projeto mantém a conexão com Obsidian como camada de pensamento. O fluxo atual é:

```text
Obsidian vault local -> .planning/ versionado -> GitHub issues/PRs
```

O vault local não é o repositório central e configurações `.obsidian/` não devem ser versionadas. Decisões que orientam implementação precisam ser promovidas para `.planning/` antes de virar código ou issue. Veja [.planning/OBSIDIAN.md](.planning/OBSIDIAN.md).

## Colaboração com agentes

Este projeto será construído com Codex, Claude Code e GSD trabalhando sobre o mesmo repositório. Antes de executar qualquer issue, leia:

1. `.planning/PROJECT.md`
2. `.planning/config.json`
3. `.planning/OBSIDIAN.md`
4. `.planning/DESIGN_SYSTEM.md`, quando a tarefa tocar UI ou experiência de usuário
5. A issue GitHub ativa
6. `AGENTS.md`
7. `.planning/HANDOFF.md`

Trabalhe em branch curta por issue, deixe handoff claro e não versione `.claude/`.

## Contribuição

Leia [CONTRIBUTING.md](CONTRIBUTING.md). Contribuições devem preservar a regra central: sem fonte, sem afirmação pública.

## Licença

O código do projeto está sob a licença MIT. Veja [LICENSE](LICENSE).

Dados públicos, documentos oficiais e exports do DeOlho devem preservar fonte, licença, data de coleta e termos aplicáveis das bases públicas originais. A licença do código não muda os termos das fontes de dados.
