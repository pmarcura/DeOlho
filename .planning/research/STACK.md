# Technology Stack — DeOlho (Civic Transparency Platform)

**Project:** DeOlho — Brazilian civic transparency platform
**Researched:** 2026-05-23
**Mode:** Ecosystem
**Overall confidence:** MEDIUM-HIGH

> **Research note on confidence:** Live verification tools (Context7, WebSearch,
> WebFetch) were unavailable for this run. Findings are based on training
> knowledge (cutoff January 2026), strong for the 2025 stack. Architectural and
> library-choice recommendations are HIGH confidence. Exact version pins are
> LOW-MEDIUM confidence — provided as a "known-good as of early 2026" baseline.
> Verify every pin with `npm view <pkg> version` before locking.

---

## TL;DR — The Prescribed Stack

| Layer | Choice | One-liner |
|-------|--------|-----------|
| Framework | **Next.js 15 (App Router) + React 19** | Server Components para páginas read-heavy públicas; AI-agent friendly |
| Language | **TypeScript 5.x (strict)** | Type safety full-stack, melhor suporte de agentes |
| Database | **PostgreSQL 16+** | FTS (`tsvector`+`pg_trgm`) + `JSONB` + `pgvector` num só engine |
| ORM | **Drizzle ORM** | SQL-first, typed, migrations legíveis por agentes |
| Migrations | **drizzle-kit** | Versionadas, revisáveis em PRs |
| Job queue / ETL | **pg-boss** | Postgres-nativo — sem Redis |
| Search | **Postgres FTS (`tsvector`+`pg_trgm`+`unaccent`)** | Sem segundo datastore em v1; Typesense adiado |
| Vector / embeddings | **pgvector** | Mesmo DB; "contratos similares" + busca semântica |
| AI SDK | **`@anthropic-ai/sdk` (Claude)** | Projeto Claude-native; extração estruturada + sumarização |
| UI components | **shadcn/ui + Radix + Tailwind CSS v4** | Código próprio, editável por agentes, estética civic séria/limpa |
| Tables UI | **TanStack Table v8 (headless)** | Paginação/sort/filter server-driven |
| Validation | **Zod 3.x** | Validação runtime de payloads imprevisíveis das APIs gov |
| Auth | **Better Auth** (ou Auth.js v5) | Só para writes de contribuidores; leitura pública é anônima |
| Hosting (app) | **Vercel** (ou Railway se self-host preferido) | Next.js nativo |
| Hosting (DB) | **Supabase** ou **Neon** | Postgres gerenciado c/ pgvector; tiers OSS |
| Background workers | **Railway / Fly.io / VPS** | ETL longa-duração NÃO pode rodar em Vercel serverless |

---

## Core Framework

| Technology | Version (verificar) | Propósito | Por que no DeOlho |
|------------|---------------------|-----------|-------------------|
| Next.js | `15.x` | Full-stack React framework | App Router + RSC ideal para páginas públicas read-heavy (páginas de contrato fazem server-render, enviam JS mínimo, fazem cache, SEO-friendly — crítico para ferramenta pública que as pessoas buscam no Google). Server Actions cobrem os poucos write paths (correções, edições de contribuidores). |
| React | `19.x` | UI runtime | Bundled com Next 15; Server Components + `use()` + Actions estáveis. |
| TypeScript | `5.x` (`strict:true`) | Type safety | Linguagem única em ingestion/API/UI. Melhor ergonomia para agentes — Claude raciocina melhor sobre código tipado. |
| Node.js | `22 LTS` | Runtime | LTS até 2027; `fetch` nativo, streams estáveis para XML. |

**Por que App Router e não Pages Router:** RSC permite que páginas de contrato/entidade façam server-render com acesso direto ao DB (sem round-trip de API) — exatamente o shape desse app (maioria reads, público, SEO-sensível). Confiança: HIGH.

**O que NÃO usar:**
- **Pages Router** — legacy; menos sinal de treinamento de agentes no futuro.
- **Backend separado (NestJS/Express) em v1** — desnecessário. Route Handlers + Server Actions + processo worker dedicado cobrem tudo. Segundo serviço é complexidade prematura.

---

## Database & Data Layer

### Extensões PostgreSQL (tudo num engine — a tese central)

| Extensão | Propósito | Uso no DeOlho |
|----------|-----------|---------------|
| `pg_trgm` | Fuzzy matching por trigrama | Busca tolerante a erros de digitação em nomes de empresas/órgãos, objetos de contratos |
| FTS (`tsvector`/`tsquery`) | Busca keyword com ranking | CONT-01, ENT-03 — buscar contratos por objeto/palavra-chave. Usar config `portuguese` + `unaccent` |
| `unaccent` | Busca insensível a acentos | Usuários brasileiros digitam sem acentos constantemente |
| `pgvector` | Similaridade vetorial | "Contratos similares", busca semântica, entidades relacionadas por significado. Usar `halfvec` + HNSW para eficiência de armazenamento |
| `JSONB` | Armazenamento schema-flexível | **Crítico.** APIs gov retornam payloads imensos/inconsistentes/mutáveis. Armazenar resposta raw em `JSONB` junto com colunas tipadas extraídas — trilha de evidência (TRUST-02) E seguro contra schema drift |

**Padrão: "typed core + JSONB raw" (HIGH).** Cada registro ingerido recebe:
- Colunas tipadas/normalizadas para campos consultados/exibidos (valor, CNPJ, órgão, datas)
- Uma coluna `raw JSONB` com payload verbatim da API/XML
- Colunas de proveniência: `source`, `source_url`, `fetched_at`, `published_at`, `source_version` — servindo TRUST-02/03 e DATA-04

Permite rederiver campos após bugs de parsing sem re-fetch, e faz "a fonte não informa X" (CONT-07/TRUST-05) literalmente inspecionável.

### ORM: Drizzle ORM (HIGH para fit)

| Technology | Version (verificar) | Propósito | Por que |
|------------|---------------------|-----------|---------|
| Drizzle ORM | `0.3x.x` (verificar — fast-moving) | Query builder tipado | SQL-first: queries leem como SQL, então agentes e revisores veem exatamente o que atinge o DB. FTS/`pg_trgm`/`pgvector` de primeira classe via fragmentos raw `sql\`\``. Migrations são SQL puro no git — revisáveis em PRs |
| drizzle-kit | matches Drizzle | Geração de migration | `drizzle-kit generate` produz SQL revisável |

**Por que Drizzle sobre Prisma aqui:**
- DeOlho precisa de `tsvector`, GIN indexes `pg_trgm`, `pgvector` — primeira classe em SQL raw; Drizzle sai do caminho. Prisma historicamente precisa de `Unsupported(...)`, `$queryRaw` e steps externos para FTS/vector, fragmentando o schema.
- API SQL-shaped do Drizzle é mais legível para agentes de IA — menos magia.
- Migrations como SQL commitado fit CI reproduzível (OSS-02).

**Prisma é alternativa razoável** se quiser seu DX/Studio e aceitar SQL raw para FTS/vector. Não está errado — mas Drizzle é o melhor default aqui. (Confiança: MEDIUM-HIGH.)

**O que NÃO usar:** TypeORM (declinando, tipos fracos), Sequelize (legacy).

### Driver Postgres
- **`postgres` (porsager) ou `pg` (node-postgres)** — Drizzle suporta ambos. Usar `postgres` para app/worker, ou o driver serverless Neon/Supabase nessas plataformas. (HIGH.)

---

## Ingestão de Dados / ETL

A parte mais difícil do DeOlho — maior cuidado arquitetural vai aqui.

### Job queue: pg-boss (HIGH para fit)

| Technology | Version (verificar) | Propósito | Por que |
|------------|---------------------|-----------|---------|
| pg-boss | `10.x` (verificar) | Queue + scheduler Postgres-backed | Sem Redis, sem infra extra. Agendamento cron (pull DOU diário, sync incremental PNCP), retries com backoff, queues com rate limit, dead-letter, dedup. Serve DATA-04 (incremental) e DATA-05 (rate limits) |

**Por que pg-boss sobre BullMQ:** BullMQ requer Redis — custo real para um projeto OSS de baixo footprint construído por agentes (mais failure modes, mais para contribuidores rodar localmente). pg-boss mantém tudo no Postgres. Throughput é mais que suficiente — são batch ETL jobs (milhares/dia), não event bus de alta frequência. Um datastore = dev local mais simples (OSS-01) e CI (OSS-02).

**Graphile Worker é alternativa forte** (também Postgres-nativo, muito rápido, excelente cron). Escolher pg-boss para semânticas de queue mais ricas built-in; Graphile para minimalismo/throughput. **Usar BullMQ só se** precisar de eventos de alta frequência de baixa latência — não é preocupação do MVP.

### Rate limiting para APIs gov (HIGH na abordagem)

Portal da Transparência: **90 req/min (dia) / 300 req/min (madrugada)** — cap rígido.

1. **Bulk via "Dados Abertos" CSV/ZIP, NÃO a API.** Usar dumps bulk para carga inicial pesada + refresh periódico; API só para enriquecimento pontual.
2. **Token-bucket limiter no path da API** — `bottleneck` (`2.x`) ou `p-limit`. Bottleneck suporta reservoir refresh (90/min) e pode clusterizar via Redis depois; in-memory suficiente para um único worker.
3. **Agendar jobs pesados de API das 0h–6h** para usar janela de 300/min (pg-boss cron).
4. **Persistir cursor/watermark por fonte** para sync incremental DATA-04.

### Processamento de CSV / arquivos grandes (HIGH)

| Library | Version | Propósito |
|---------|---------|-----------|
| `csv-parse` (node-csv) ou `papaparse` (stream mode) | latest | CSVs da Transparência são grandes (centenas de MB). **Stream, nunca carregar em memória.** `csv-parse` integra com Node streams + backpressure |
| Postgres `COPY` via `pg-copy-streams` | latest | Pipe de rows parseados para `COPY ... FROM STDIN` — ordens de magnitude mais rápido que INSERT linha a linha. Carregar em staging, então upsert |

**Padrão:** stream CSV → tabela staging via `COPY` → upsert `INSERT ... ON CONFLICT` em tabelas normalizadas. ETL Postgres bulk canônico.

### Parsing XML (DOU / INLABS) (HIGH)

| Library | Version | Propósito |
|---------|---------|-----------|
| `fast-xml-parser` | `4.x` (verificar) | Parse XML diário do INLABS → JSON. Rápido, sem deps nativas. Armazenar resultado parseado em `JSONB`, extrair campos tipados |

INLABS requer login/credenciais e serve ZIP-de-XML diário. Agendar um job pg-boss diário pós-publicação. Evitar `xml2js` (mais lento, menos mantido).

### HTTP client
- **`fetch`** nativo (Node 22) é suficiente. Envolver com `p-retry` + o limiter bottleneck. Sem necessidade de axios. (HIGH.)

### Validação na boundary: Zod (HIGH)

| Library | Version | Propósito |
|---------|---------|-----------|
| Zod | `3.x` (verificar; v4 pode estar disponível) | Validar runtime cada payload de API/XML gov antes de tocar o DB |

APIs gov mentem sobre seus schemas e mudam sem aviso. Parse-don't-validate: um schema Zod por fonte, `safeParse` em cada registro, rotear falhas para tabela de quarentena com o payload raw (alimenta TRUST-05 "essa fonte está incompleta"). Zod também gera tipos TS — única fonte da verdade para agentes.

---

## Integração de IA

| Technology | Version (verificar) | Propósito | Por que |
|------------|---------------------|-----------|---------|
| `@anthropic-ai/sdk` | latest `0.x` (verificar) | Claude API client | Projeto é Claude-native. Usar para: resumos de contratos em PT-BR simples (CONT-02), explicação de termos jurídicos, perguntas cívicas (CONT-08), sinais de atenção (CONT-06) |
| Embeddings | **Voyage AI** (`voyage-3` family) ou **OpenAI `text-embedding-3-*`** | Vetorizar contratos/entidades para pgvector | Anthropic recomenda Voyage (sem endpoint de embedding nativo Anthropic). Escolher um, padronizar, armazenar no pgvector |

**Restrições críticas de design de IA (lei do produto per TRUST-04):**
- **Outputs estruturados apenas.** Usar tool use / JSON estruturado do Claude com schema validado por Zod para que o modelo retorne *campos controlados* (summary, definitions, suggested questions) — nunca prosa livre que poderia fabricar fatos.
- **O modelo NUNCA produz fatos.** Fatos (valor, CNPJ, datas, partes) vêm do DB/fonte. O modelo só reescreve/explica texto que recebe. Passar texto fonte como contexto; instruí-lo a fundar cada afirmação e emitir "a fonte não informa" quando dado ausente (CONT-07, TRUST-05).
- **Cachear outputs de IA no DB**, keyed por hash do conteúdo fonte, com `model`, `prompt_version`, `generated_at`. Re-rodar é caro e não-determinístico; cache + versão para reprodutibilidade/auditoria. Um resumo de IA é marcado como "explicação", não "fato oficial" (TRUST-01).
- Considerar **Anthropic prompt caching** para system prompts longos compartilhados / glossários jurídicos para reduzir custo.

**O que NÃO fazer:**
- Não usar IA para **buscar/recuperar fatos** — esse é o trabalho do DB. RAG sobre dados indexados é ok, mas a *resposta* deve citar rows armazenadas.
- Não construir chatbot como produto (fora do escopo per PROJECT.md).
- Não usar framework de agente (LangChain etc.) em v1 — tarefas são sumarização/extração single-call limitada. Uma chamada direta ao SDK com schema tipado é mais clara e muito mais manutenível por agentes. (HIGH.)

---

## Search

**Recomendação: Postgres FTS para v1. Adiar search engine dedicado. (HIGH.)**

| Necessidade | Solução v1 | Quando fazer upgrade |
|------------|------------|---------------------|
| Busca por keyword (CONT-01, ENT-03) | `tsvector` (portuguese) + `unaccent`, GIN index | — |
| Fuzzy match em nomes de entidades | similaridade `pg_trgm` + GIN/GiST | — |
| Semântico / "contratos similares" | `pgvector` HNSW | — |
| Tolerância a erros, faceting, instant search, tuning de ranking em escala | **Typesense** ou **Meilisearch** (self-host) | Quando FTS ranking/faceting se tornar o bottleneck (provavelmente v2 em escala municipal) |

**Por que FTS primeiro:** um datastore, sem pipeline de sync, sem infra extra (OSS low-footprint). `tsvector`+`pg_trgm`+`unaccent` cobre busca PT-BR bem em volume de dados federal. Construir um `search_document tsvector` (trigger ou coluna gerada), indexado GIN, `ts_rank` para relevância.

**Por que NÃO Elasticsearch:** pesado (JVM, ops, memória), overkill para v1, responsabilidade de manutenção para um projeto OSS mantido por agentes. **Evitar.**

**Quando superar FTS, preferir Typesense/Meilisearch sobre Elasticsearch** — leve, rápido, tolerante a typos, self-host fácil. Typesense tem edge para busca facetada de entidades cívicas. Adicionar como *índice secundário sincronizado do Postgres*, não source of truth. (MEDIUM-HIGH.)

---

## UI Component Library

**Recomendação: shadcn/ui + Radix UI + Tailwind CSS v4. (HIGH.)**

| Technology | Version | Propósito | Por que |
|------------|---------|-----------|---------|
| shadcn/ui | CLI-based (não é dep versionada) | Source de componentes que você possui | Você copia componentes para o seu repo — seu código, totalmente editável. **Ideal para manutenção por agentes:** Claude lê/modifica fonte real, não uma black box. Estética limpa, séria, neutra — o look "ferramenta pública moderna / data-journalism" que o projeto quer |
| Radix UI | latest | Primitivos acessíveis | a11y de graça — importante para ferramenta pública cívica |
| Tailwind CSS | `v4.x` | Styling | Utility-first, agent-friendly (estilos co-localizados, sem bikeshed de naming). v4 novo engine/config |
| lucide-react | latest | Ícones | Set padrão shadcn, limpo/neutro |

**Por que shadcn sobre MUI / Chakra / Ant:** MUI/Ant carregam identidades fortemente opinadas (Material / enterprise-admin) que brigam com a estética premium-civic e são mais pesadas para sobrescrever (Ant lê como "admin dashboard" — errado para uma enciclopédia pública). O modelo "own the code" do shadcn significa sem brigas de version-lock e agentes editam componentes diretamente — decisivo para uma codebase mantida por IA. Tailwind+shadcn é o padrão dominante de 2025 com mais sinal de treinamento de agentes.

**UI de suporte:**

| Library | Version | Propósito |
|---------|---------|-----------|
| TanStack Table | `v8.x` | Lógica de tabela headless para listas de contratos/entidades — paginação/sort/filter server-side driven pelo Postgres. Combinar com styling de tabela shadcn |
| nuqs | latest | URL search params type-safe — estado de filtros na URL (compartilhável para jornalistas, SSR-friendly, SEO) |
| Recharts **ou** visx/Observable Plot | latest | Charts/timeline (CONT-04). Começar Recharts; chegar em Plot quando timelines ficarem ricas |
| date-fns | `3.x`/`4.x` | Formatação de data pt-BR para "publicado/coletado/atualizado" (TRUST-03) |
| TanStack Query | `v5.x` | Client fetching/caching para ilhas interativas (search-as-you-type). Maioria dos reads de página devem ser RSC |

**O que NÃO usar:** MUI, Ant Design, Chakra (mismatch de identidade visual + custo de override), Bootstrap (datado), AG Grid em v1 (comercial/pesado — TanStack Table é suficiente).

---

## Auth

**Recomendação: Better Auth (ou Auth.js/NextAuth v5). Leitura pública não precisa de auth. (MEDIUM-HIGH.)**

| Technology | Version | Propósito | Por que |
|------------|---------|-----------|---------|
| Better Auth | `1.x` (verificar) | Auth para features de contribuidor/write | TypeScript-first, self-hostable, possui tabelas no *seu* Postgres (ethos single-datastore), email + OAuth (login GitHub natural para dev-contribuidores, OSS-01). Moderno, legível por agentes |

**Escopar auth estritamente:**
- **Todas as páginas públicas anônimas** — contratos, entidades, busca são reads públicos. Sem barreira de login (atrito aqui é anti-missão para uma ferramenta de transparência).
- Auth apenas para: submissão de correções (o "mecanismo de correção" do projeto), moderação de contribuidores, admin/curação. Esses são os "writes" que a constraint de segurança referencia.
- **GitHub OAuth** é o provider primário óbvio para uma base de dev-ativistas.

**Alternativa: Auth.js (NextAuth v5)** — mais maduro/comunidade maior, mas camada de dados menos limpa que Better Auth. Ambos corretos; Better Auth mais moderno/tipado, Auth.js mais battle-tested. Fallback para Auth.js se documentação mais nova do Better Auth travar os agentes. (Comparação: MEDIUM — verificar maturidade do Better Auth.)

**O que NÃO usar:** IdP hospedado (Clerk/Auth0) — ok tecnicamente, mas adiciona custo + dependência proprietária conflitando com identidade OSS/self-host. Evitar em v1.

**Sempre adicionar:** rate limiting em endpoints write + API pública/busca (constraint anti-abuso). Usar **Upstash Ratelimit** (no Vercel) ou limiter Postgres/in-memory no worker/edge. (MEDIUM-HIGH.)

---

## Deployment & Infraestrutura

**Recomendação: Vercel (app) + Supabase/Neon (Postgres) + worker always-on separado (Railway/Fly.io/VPS) para ETL. (HIGH na shape; vendor é custo/preferência.)**

### A regra arquitetural crítica
**ETL longa-duração NÃO roda no Vercel serverless.** Serverless tem limites de tempo de execução — modelo errado para streaming de CSVs grandes, pulls XML diários, crawls multi-minuto com rate limiting. **Rodar o worker como processo long-lived separado.** Decisão de infra mais importante.

### Duas topologias viáveis

**Opção A — Vercel + Postgres Gerenciado + worker separado (máximo alcance OSS):**
| Componente | Serviço | Por que |
|------------|---------|---------|
| App Next.js | Vercel | Melhor hosting Next.js, tier OSS, preview deploys por PR (OSS-02) |
| Postgres (+pgvector) | Supabase ou Neon | Postgres gerenciado c/ pgvector. Supabase inclui auth/storage; Neon tem branching (PR preview DBs) |
| Worker ETL + pg-boss | Railway ou Fly.io (container always-on) | Jobs cron/queue longa-duração. Barato, baseado em container |

**Opção B — All-in no Railway / Docker Compose (máxima reprodutibilidade / self-host):**
| Componente | Serviço |
|------------|---------|
| App + worker + Postgres | Railway (ou VPS com Docker Compose) |
| Por que | Um provider, modelo mental mais simples, trivialmente reproduzível. `docker compose up` para dev local — forte onboarding OSS (OSS-01) |

**Recomendação:** Começar com **Opção B para v1** (maximiza reprodutibilidade/self-hostability — central para um projeto cívico aberto — e evita dividir conhecimento de infra enquanto agentes constroem). **Migrar o app público para Vercel** quando quiser CDN/preview polish + hosting OSS gratuito para o site read-heavy. Documentar ambos os caminhos.

**Fornecer `docker-compose.yml`** (Postgres+pgvector, app, worker) independente de hosting — backbone de CI reproduzível + onboarding (OSS-01, OSS-02). Usar a imagem `pgvector/pgvector` ou Supabase para que extensões estejam presentes localmente. (HIGH.)

### CI/CD
- **GitHub Actions** — lint, typecheck, test, rodar drizzle migrations contra service container Postgres efêmero, build. Aberto e reproduzível (OSS-02). (HIGH.)

**O que NÃO fazer:**
- Não rodar ingestão pesada em Vercel Cron + serverless — timeouts machucam. (Cron leve que *enfileira* um job pg-boss é ok; o *trabalho* roda no worker.)
- Não travar em Vercel-Postgres-only se portabilidade importa — Neon/Supabase/self-host mantêm portabilidade.
- Não colocar pgvector + ETL pesado em tier de DB compartilhado pequeno — embeddings + GIN indexes + bulk COPY precisam de I/O real. Dimensionar o DB para ETL, não apenas leituras.

---

## Alternativas Consideradas (sumário)

| Categoria | Recomendado | Alternativa | Por que não a alternativa |
|-----------|-------------|-------------|---------------------------|
| ORM | Drizzle | Prisma | FTS/vector precisam de workarounds raw-SQL; Drizzle é SQL-first/agent-legível. (Prisma ainda válido.) |
| Job queue | pg-boss | BullMQ | Precisa Redis — infra extra vs objetivo OSS low-footprint |
| Job queue | pg-boss | Graphile Worker | Ambos Postgres-nativos/corretos; pg-boss semânticas built-in mais ricas |
| Search | Postgres FTS | Elasticsearch | Ops pesado desnecessário para v1; evitar |
| Search | Postgres FTS | Typesense/Meilisearch | Excelente — adiar para v2; não adicionar datastore prematuramente |
| UI | shadcn/ui | MUI / Ant Design | Mismatch de identidade visual; override mais difícil; menos editável por agentes |
| Auth | Better Auth | Auth.js v5 | Ambos ok; Better Auth moderno/tipado, Auth.js battle-tested |
| Auth | Self-hosted | Clerk/Auth0 | Proprietário + custo vs identidade OSS/self-host |

---

## Instalação Indicativa (verificar versões antes de travar)

```bash
# Core
npx create-next-app@latest deolho --typescript --tailwind --app --eslint

# DB + ORM
npm install drizzle-orm postgres
npm install -D drizzle-kit

# AI
npm install @anthropic-ai/sdk

# Ingestão / ETL
npm install pg-boss bottleneck p-retry fast-xml-parser csv-parse pg-copy-streams zod

# UI (shadcn inicializado via CLI, não npm install)
npx shadcn@latest init
npm install @tanstack/react-table @tanstack/react-query nuqs date-fns lucide-react recharts

# Auth (escolher um)
npm install better-auth
# ou: npm install next-auth@beta

# Extensões Postgres (rodar no DB):
#   CREATE EXTENSION IF NOT EXISTS pg_trgm;
#   CREATE EXTENSION IF NOT EXISTS unaccent;
#   CREATE EXTENSION IF NOT EXISTS vector;   -- pgvector
```

> Rodar `npm view <package> version` para confirmar majors atuais antes de travar.
> Tratar cada versão aqui como baseline a verificar, não pin final.

---

## Avaliação de Confiança

| Área | Confiança | Notas |
|------|-----------|-------|
| Framework (Next 15 / RSC) | HIGH | Padrão dominante estável; ideal para páginas públicas read-heavy |
| Postgres (FTS + JSONB + pgvector) | HIGH | Tese central sólida e bem estabelecida |
| ORM (Drizzle sobre Prisma) | MEDIUM-HIGH | Forte fit; ambos válidos — verificar churn de API do Drizzle |
| Job queue (pg-boss) | HIGH | pg-boss/Graphile ambos corretos; pg-boss safe default |
| Padrões ETL (COPY/streaming/bottleneck) | HIGH | Padrões canônicos de bulk-load Postgres |
| IA (Anthropic SDK + output estruturado) | HIGH | Alinha com constraints Claude-native, sem fabricação |
| Search (FTS primeiro, Typesense adiado) | HIGH | Claro, bem suportado |
| UI (shadcn/Tailwind v4) | HIGH | Padrão dominante 2025; melhor ergonomia para agentes |
| Auth (Better Auth) | MEDIUM | Verificar maturidade vs Auth.js em build time |
| Deployment | HIGH (shape) / MEDIUM (vendor) | Separação de worker firme; vendor é preferência |
| **Pins de versão exatos** | **LOW-MEDIUM** | **Não foi possível verificar contra fontes live — verificar todos** |

---

## Gaps / A Verificar Antes do Build

1. **Todos os números de versão** — verificar Next.js, React, Drizzle, pg-boss, Zod (v3 vs v4), Tailwind v4, Better Auth, `@anthropic-ai/sdk` atuais.
2. **Formatos exatos de API/arquivo PNCP & INLABS** — confirmar endpoints bulk PNCP, fluxo de auth INLABS, catálogo atual de CSV "dados abertos" da Transparência. (Domínio específico; precisa de pesquisa de fase.)
3. **Disponibilidade de pgvector no tier de DB escolhido** — confirmar Supabase/Neon/Railway plan inclui `vector` + I/O adequado.
4. **Provider de embedding** — Voyage vs OpenAI: escolher um, confirmar pricing/latência para embedding batch de contratos.
5. **Better Auth vs Auth.js decisão final** — quick spike sobre qual agentes constroem/mantêm mais confiável.
6. **Tuning de dicionário FTS português** — config `unaccent` + `portuguese` + stopwords customizadas para termos gov/jurídicos precisará de iteração.
