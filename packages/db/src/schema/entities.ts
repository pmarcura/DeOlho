import {
  pgTable,
  uuid,
  text,
  numeric,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { entityKind, documentKind } from "./_enums";
import { sources } from "./sources";

// IDs canônicos de entidade (FEATURES.md: caríssimo de retrofitar — fazer cedo).
// Um nó por empresa/órgão, reconciliado entre fontes. Evita duplicatas e habilita
// relacionamentos (CONT-09) e reconciliação na API (§10).
export const entities = pgTable(
  "entities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kind: entityKind("kind").notNull(),
    nome: text("nome").notNull(), // melhor nome canônico conhecido
    documento: text("documento"), // CNPJ/CPF só dígitos (normalizado)
    documentoKind: documentKind("documento_kind"),
    uf: text("uf"),
    municipioIbge: text("municipio_ibge"),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
    atualizadoEm: timestamp("atualizado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // Um canônico por (tipo, documento) quando há documento.
    uniqueIndex("entities_documento_idx")
      .on(t.kind, t.documento)
      .where(sql`${t.documento} is not null`),
    // Busca fuzzy por nome (pg_trgm) — FEATURES §1. Requer extensão pg_trgm.
    index("entities_nome_trgm_idx").using("gin", sql`${t.nome} gin_trgm_ops`),
  ],
);

// Ponte de resolução de entidade: cada ocorrência numa fonte aponta para o
// canônico, preservando o nome cru como apareceu (proveniência) e a confiança
// do match (1.000 = match exato por documento; <1 = heurística/fuzzy).
export const entityReferences = pgTable(
  "entity_references",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    entityId: uuid("entity_id")
      .notNull()
      .references(() => entities.id),
    sourceId: text("source_id")
      .notNull()
      .references(() => sources.id),
    sourceKey: text("source_key"),
    rawNome: text("raw_nome").notNull(), // nome como apareceu na fonte
    rawDocumento: text("raw_documento"),
    confianca: numeric("confianca", { precision: 4, scale: 3 }),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("entity_references_entity_idx").on(t.entityId),
    index("entity_references_source_idx").on(t.sourceId, t.sourceKey),
  ],
);

export type Entity = typeof entities.$inferSelect;
export type NewEntity = typeof entities.$inferInsert;
export type EntityReference = typeof entityReferences.$inferSelect;
export type NewEntityReference = typeof entityReferences.$inferInsert;
