# Handoff

Última atualização: 2026-05-24

## Estado atual

- Repositório canônico: `https://github.com/pmarcura/DeOlho`
- Branch base: `main` (agora COM a fundação M0 — reconciliado)
- Branch de trabalho atual: `claude/issue-22-scaffold-tecnico`
- Milestone atual: `M0 - Fundação aberta`
- Issue em andamento: [#22 - Scaffold técnico Next/Postgres/Drizzle](https://github.com/pmarcura/DeOlho/issues/22)
- Próxima issue de UI: [#24 - Design system shadcn social-cívico](https://github.com/pmarcura/DeOlho/issues/24)

## O que foi entregue nesta sessão (2026-05-24)

### 1. Reconciliação do repositório
- O branch `codex/issue-7-m0-fundacao` tinha 6 commits locais não enviados (risco de perda) e estava 12 commits à frente do `main`. Tudo foi enviado ao `origin` e o `main` recebeu fast-forward com toda a fundação M0.
- `main` agora contém: docs OSS, design system, `apps/web` (Next 16 + shadcn + `/financas` mock), `packages/collectors`, `packages/ui`.

### 2. Saneamento do monorepo (commit `chore: unificar monorepo em pnpm`)
- Package manager unificado em **pnpm** (root tinha npm workspaces + `apps/web` tinha pnpm aninhado — inconsistente).
- Removidos: `package-lock.json` (raiz e collectors), `apps/web/pnpm-workspace.yaml`, `apps/web/pnpm-lock.yaml`.
- Criados: `pnpm-workspace.yaml` na raiz, lockfile único.
- `.gitignore` expandido (`.env`, build outputs, `.obsidian`, editores).

### 3. Fundação de dados — `@deolho/db` (commit `feat(db): fundação de dados`)
Pacote novo `packages/db` (Drizzle ORM + driver `postgres`) com o núcleo transversal que precisa existir desde o dia 1 (caro de retrofitar — `research/FEATURES.md`):
- `sources` — catálogo de fontes; `limitacoes` alimenta TRUST-05.
- `raw_records` — evidência verbatim (JSONB) + proveniência + versionamento append-only por `content_hash` (TRUST-02/03, DATA-04).
- `entities` + `entity_references` — IDs canônicos + ponte de resolução.
- `contracts` + `contract_events` — unidade do MVP + linha do tempo (CONT-04).
- Tipagem de confiança (`trust_type`) embutida (TRUST-01); busca FTS portuguesa (tsvector gerado) + fuzzy `pg_trgm` (CONT-01).
- Migration `0000` gerada + extensões `pg_trgm`/`unaccent`/`vector`.
- `docker-compose.yml` (pgvector) na raiz; scripts `seed`/`check`; `.env.example`.

## Verificações executadas
- `pnpm --filter @deolho/db typecheck` → OK (0 erros).
- `drizzle-kit generate` → migration `0000_square_talon.sql` gerada corretamente.
- `pnpm --filter web build` → OK (Next 16.2.6 Turbopack; 3 rotas estáticas).

## Pendências conhecidas (bloqueios)
- **Migrations ao vivo + seed + check**: precisam de um Postgres acessível.
  Docker **não está instalado** nesta máquina. Caminhos:
  1. Instalar Docker Desktop → `docker compose up -d` → `pnpm --filter @deolho/db migrate && seed && check`.
  2. OU usar Postgres gerenciado (Supabase/Neon, free tier — já trazem pg_trgm/unaccent/pgvector): pôr a connection string em `packages/db/.env` e rodar migrate/seed/check.
- **Conectores**: o registry de MCP está vazio neste ambiente — **GitHub MCP e Supabase/Postgres MCP não estão disponíveis para adicionar**. Alternativas: `gh` CLI (não instalado) para issues/PRs; `DATABASE_URL` direto (não precisa de MCP para migrar). `Apify`, `Claude Preview` e `Claude in Chrome` estão conectados e prontos. Bright Data depende da CLI `bdata` (não instalada — skill `brightdata` guia o install).

## Próximo passo recomendado
1. Prover um Postgres (Docker ou Supabase/Neon) e rodar `migrate → seed → check` para validar a fundação ao vivo.
2. **Fatia vertical PNCP**: adaptar `packages/collectors/src/adapters/pncp.ts` para persistir em `@deolho/db` (raw_records → contracts + entities), e criar a primeira página viva de contrato em `apps/web` consumindo o banco (substituindo o mock de Americana). Requer `transpilePackages: ['@deolho/db']` no `next.config.ts` e ler `node_modules/next/dist/docs/` antes (Next 16 tem breaking changes — ver `apps/web/AGENTS.md`).
3. Consertar o adapter `querido-diario` (recebe HTML em vez de JSON — `totalRegistros: 0`).

## Decisões a registrar (candidatas a ADR)
- Package manager: **pnpm** como padrão do monorepo.
- Modelo de dados: padrão **typed-core + raw JSONB** com proveniência por campo, tipagem de confiança e IDs canônicos desde o início.
- `pg-boss` (jobs) e colunas de embedding pgvector ficam para fases posteriores; a extensão `vector` já é criada.
