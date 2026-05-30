import {
  pgTable,
  uuid,
  text,
  numeric,
  date,
  timestamp,
  jsonb,
  customType,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { civicEventCategory, civicEventType, trustType } from "./_enums";
import { sources } from "./sources";
import { rawRecords } from "./raw-records";

const tsvector = customType<{ data: string }>({
  dataType() {
    return "tsvector";
  },
});

// Unidade pública principal do produto: um acontecimento verificável da cidade.
// Pode nascer de Diário, PNCP, TCE-SP, Câmara, CGU, TSE etc. Fatos ficam aqui;
// explicações e sinais usam `trust_type` e evidências próprias.
export const civicEvents = pgTable(
  "civic_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sourceId: text("source_id")
      .notNull()
      .references(() => sources.id),
    sourceKey: text("source_key").notNull(),
    rawRecordId: uuid("raw_record_id").references(() => rawRecords.id),
    tipo: civicEventType("tipo").notNull(),
    categoria: civicEventCategory("categoria").notNull(),
    titulo: text("titulo").notNull(),
    resumo: text("resumo"),
    dataEvento: date("data_evento"),
    valor: numeric("valor", { precision: 18, scale: 2 }),
    moeda: text("moeda").notNull().default("BRL"),
    municipioIbge: text("municipio_ibge"),
    uf: text("uf"),
    territorio: jsonb("territorio"),
    entidades: jsonb("entidades"),
    limitacoes: jsonb("limitacoes"),
    sourceUrl: text("source_url"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }),
    trustType: trustType("trust_type").notNull().default("fato_oficial"),
    searchDocument: tsvector("search_document").generatedAlwaysAs(
      sql`to_tsvector('portuguese', coalesce(titulo, '') || ' ' || coalesce(resumo, ''))`,
    ),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
    atualizadoEm: timestamp("atualizado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("civic_events_source_tipo_idx").on(t.sourceId, t.sourceKey, t.tipo),
    index("civic_events_category_idx").on(t.categoria),
    index("civic_events_source_idx").on(t.sourceId, t.sourceKey),
    index("civic_events_municipio_idx").on(t.municipioIbge),
    index("civic_events_data_idx").on(t.dataEvento),
    index("civic_events_search_idx").using("gin", t.searchDocument),
    index("civic_events_titulo_trgm_idx").using("gin", sql`${t.titulo} gin_trgm_ops`),
  ],
);

export type CivicEvent = typeof civicEvents.$inferSelect;
export type NewCivicEvent = typeof civicEvents.$inferInsert;
