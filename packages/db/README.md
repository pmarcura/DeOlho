# @deolho/db

Camada de dados do DeOlho — schema Drizzle, migrations e cliente Postgres.

O schema implementa os requisitos transversais que precisam existir **desde o
dia 1** (caríssimos de retrofitar, conforme `.planning/research/FEATURES.md`):

- **Proveniência por campo** — `source_id`, `source_url`, `published_at`,
  `fetched_at` em registros que carregam fato (TRUST-02/03).
- **Tipagem de confiança** — enum `trust_type` (TRUST-01).
- **IDs canônicos de entidade** — `entities` + `entity_references` (resolução).
- **Versionamento append-only** — `raw_records` keyed por
  `(source_id, source_key, content_hash)`; a mudança de hash ao longo do tempo
  É o histórico (DATA-04).

## Tabelas

| Tabela | Papel |
|--------|-------|
| `sources` | Catálogo de fontes; `limitacoes` alimenta TRUST-05 |
| `raw_records` | Evidência verbatim (JSONB) + proveniência + versionamento |
| `entities` / `entity_references` | IDs canônicos + ponte de resolução |
| `contracts` | Unidade do MVP (página viva de contrato) + busca FTS/trgm |
| `contract_events` | Linha do tempo do contrato (CONT-04) |

## Uso

```bash
# 1. Subir um Postgres com pgvector (na raiz do repo)
docker compose up -d

# 2. Configurar a conexão
cp packages/db/.env.example packages/db/.env   # ajuste DATABASE_URL se necessário

# 3. Gerar / aplicar migrations
pnpm --filter @deolho/db generate   # SQL a partir do schema (offline)
pnpm --filter @deolho/db migrate    # aplica no banco

# 4. Semear o catálogo de fontes e validar
pnpm --filter @deolho/db seed
pnpm --filter @deolho/db check
```

Sem Docker local, aponte `DATABASE_URL` para um Postgres gerenciado
(Supabase/Neon) — ambos já trazem `pg_trgm`, `unaccent` e `pgvector`.

## Extensões Postgres

As migrations criam `pg_trgm`, `unaccent` e `vector`. A coluna de embeddings
(pgvector) será adicionada quando o provedor de embeddings for definido — a
extensão já fica disponível.

## Ainda não modelado (próximas fases, sobre esta fundação)

`signals` (sinais de atenção), `ai_outputs` (cache de resumos da IA),
`corrections` (correções da comunidade) e as colunas de embedding pgvector.
