# AGENTS.md

Instruções compartilhadas para Codex, Claude Code, GSD e outros agentes trabalhando no DeOlho.

## Postura

Faça tudo profissionalmente, de forma pragmática e organizada, com foco em experiência de usuário e confiança pública. Questione cada etapa quando houver risco para evidência, ética, segurança, manutenção ou clareza.

## Fonte de verdade

Antes de implementar qualquer coisa, leia nesta ordem:

1. `.planning/PROJECT.md`
2. `.planning/config.json`
3. `.planning/OBSIDIAN.md`
4. A issue GitHub ativa
5. `.planning/research/STACK.md` e `.planning/research/FEATURES.md`, quando a tarefa tocar stack, arquitetura ou produto
6. `.planning/HANDOFF.md`, quando existir

Não ignore o trabalho do Claude. A arquitetura e a ordem de build atuais vêm da pesquisa em `.planning/research/`.

## Regras de produto

- Evidência obrigatória: nenhuma afirmação pública sem fonte documentada.
- Tipagem obrigatória: separar fato oficial, explicação, sinal de atenção, notícia e opinião.
- Sem acusações automáticas, score de corrupção ou ranking de suspeita.
- Sinais de atenção sempre precisam de aviso explícito de que não indicam irregularidade.
- IA pode resumir, explicar e sugerir perguntas; não pode inventar fatos ou acusar.
- Dados de pessoa física comum estão fora do escopo.
- Português do Brasil é o idioma padrão da interface e da documentação pública.

## Fluxo de trabalho

- Sempre comece com `git pull --ff-only` e `git status`.
- Trabalhe em branch curta por issue, por exemplo `codex/issue-7-m0-fundacao`.
- Faça commits pequenos, com mensagem clara e referência à issue quando possível.
- Não versione `.claude/`.
- Não versione `.obsidian/` ou configurações pessoais do vault local.
- Não rode comandos GSD mutantes sem uma fase explicitamente aprovada.
- O Claude pode usar `gsd-sdk query *` para contexto conforme `.claude/settings.local.json`.
- Se Codex e Claude trabalharem juntos, um agente implementa e o outro revisa ou continua a partir do handoff.

## Obsidian

O Obsidian é a camada de pensamento do projeto. `.planning/` é a camada versionada que agentes devem usar para execução. Se o usuário trouxer uma nota ou decisão do Obsidian, promova o conteúdo relevante para `.planning/` antes de usar como base de implementação.

Não altere o vault local sem pedido explícito. Se houver divergência entre Obsidian e `.planning/`, peça confirmação.

## Handoff obrigatório

Ao terminar uma entrega, deixe claro:

- issue trabalhada;
- arquivos alterados;
- verificações executadas;
- pendências conhecidas;
- próxima issue recomendada;
- qualquer decisão que precise ser registrada.

Use `.planning/HANDOFF.md` para handoff persistente entre agentes quando a próxima etapa depender de contexto.

## Stack padrão

Preserve a arquitetura pesquisada pelo Claude:

- Next.js App Router + React
- TypeScript strict
- PostgreSQL com JSONB, FTS, `pg_trgm`, `unaccent` e pgvector
- Drizzle ORM
- pg-boss para jobs e ETL
- shadcn/ui, Radix, Tailwind e lucide-react
- Zod para validação de payloads externos

Versões exatas devem ser verificadas no npm no momento do scaffold. Trocas de stack precisam de justificativa e registro.
