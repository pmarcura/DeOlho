import {
  pgTable,
  uuid,
  text,
  boolean,
  numeric,
  date,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sources } from "./sources";
import { entities } from "./entities";
import { contracts } from "./contracts";
import { rawRecords } from "./raw-records";
import { trustType } from "./_enums";

// Edição de diário oficial municipal (atos publicados). Documento-evidência: o
// diário é onde contratos/pagamentos viram ato público. A fonte pode ser
// 'querido-diario' (API agregadora) ou 'diario-americana' (scrape direto do
// portal da prefeitura) — por isso source_id é parte da chave.
export const gazettes = pgTable(
  "gazettes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sourceId: text("source_id")
      .notNull()
      .references(() => sources.id),
    sourceKey: text("source_key").notNull(), // ex.: '3501608/2025-02-07' ou id da edição
    rawRecordId: uuid("raw_record_id").references(() => rawRecords.id), // evidência
    territoryIbge: text("territory_ibge"),
    uf: text("uf"),
    date: date("date"),
    edition: text("edition"),
    isExtraEdition: boolean("is_extra_edition"),
    url: text("url"), // PDF/origem da edição
    txtUrl: text("txt_url"),
    sourceUrl: text("source_url"), // TRUST-02
    publishedAt: timestamp("published_at", { withTimezone: true }), // TRUST-03
    fetchedAt: timestamp("fetched_at", { withTimezone: true }), // TRUST-03
    trustType: trustType("trust_type").notNull().default("fato_oficial"),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("gazettes_source_key_idx").on(t.sourceId, t.sourceKey),
    index("gazettes_date_idx").on(t.territoryIbge, t.date),
  ],
);

// Menção extraída do texto do diário → liga o ato a uma entidade/contrato. É o
// join diário↔dinheiro. `confianca` reflete o método: CNPJ por regex = alto;
// nome fuzzy = baixo. `trecho` preserva onde apareceu (proveniência textual).
export const gazetteMentions = pgTable(
  "gazette_mentions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    gazetteId: uuid("gazette_id")
      .notNull()
      .references(() => gazettes.id),
    entityId: uuid("entity_id").references(() => entities.id),
    contractId: uuid("contract_id").references(() => contracts.id),
    trecho: text("trecho"),
    rawDocumento: text("raw_documento"),
    rawNumeroContrato: text("raw_numero_contrato"),
    confianca: numeric("confianca", { precision: 4, scale: 3 }),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("gazette_mentions_gazette_idx").on(t.gazetteId),
    index("gazette_mentions_entity_idx").on(t.entityId),
    index("gazette_mentions_contract_idx").on(t.contractId),
  ],
);

export type Gazette = typeof gazettes.$inferSelect;
export type NewGazette = typeof gazettes.$inferInsert;
export type GazetteMention = typeof gazetteMentions.$inferSelect;
export type NewGazetteMention = typeof gazetteMentions.$inferInsert;
