import {
  pgTable,
  uuid,
  text,
  integer,
  numeric,
  date,
  timestamp,
  customType,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { trustType, contractEventType } from "./_enums";
import { sources } from "./sources";
import { entities } from "./entities";
import { rawRecords } from "./raw-records";

const tsvector = customType<{ data: string }>({
  dataType() {
    return "tsvector";
  },
});

// Unidade central do MVP — a "página viva de contrato público".
// Padrão typed-core + raw (via raw_record_id) + proveniência por campo
// (source_url/published_at/fetched_at) + tipagem de confiança (trust_type).
export const contracts = pgTable(
  "contracts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sourceId: text("source_id")
      .notNull()
      .references(() => sources.id),
    sourceKey: text("source_key").notNull(),
    rawRecordId: uuid("raw_record_id").references(() => rawRecords.id), // evidência
    numero: text("numero"),
    ano: integer("ano"),
    objeto: text("objeto").notNull(),
    valorInicial: numeric("valor_inicial", { precision: 18, scale: 2 }),
    valorGlobal: numeric("valor_global", { precision: 18, scale: 2 }),
    moeda: text("moeda").notNull().default("BRL"),
    dataAssinatura: date("data_assinatura"),
    dataVigenciaInicio: date("data_vigencia_inicio"),
    dataVigenciaFim: date("data_vigencia_fim"),
    situacao: text("situacao"),
    orgaoEntityId: uuid("orgao_entity_id").references(() => entities.id),
    fornecedorEntityId: uuid("fornecedor_entity_id").references(() => entities.id),
    municipioIbge: text("municipio_ibge"),
    uf: text("uf"),
    sourceUrl: text("source_url"), // TRUST-02
    publishedAt: timestamp("published_at", { withTimezone: true }), // TRUST-03
    fetchedAt: timestamp("fetched_at", { withTimezone: true }), // TRUST-03
    trustType: trustType("trust_type").notNull().default("fato_oficial"), // TRUST-01
    // Busca textual (CONT-01). Coluna gerada STORED, indexada via GIN.
    // unaccent no índice é refinamento futuro (FTS tuning) — por ora unaccent
    // é aplicado em tempo de query.
    searchDocument: tsvector("search_document").generatedAlwaysAs(
      sql`to_tsvector('portuguese', coalesce(objeto, '') || ' ' || coalesce(numero, ''))`,
    ),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
    atualizadoEm: timestamp("atualizado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("contracts_source_idx").on(t.sourceId, t.sourceKey),
    index("contracts_orgao_idx").on(t.orgaoEntityId),
    index("contracts_fornecedor_idx").on(t.fornecedorEntityId),
    index("contracts_municipio_idx").on(t.municipioIbge),
    index("contracts_search_idx").using("gin", t.searchDocument),
    index("contracts_objeto_trgm_idx").using("gin", sql`${t.objeto} gin_trgm_ops`),
  ],
);

// Linha do tempo do contrato (CONT-04). Cada evento aponta para sua evidência
// (raw_record_id / source_url) e carrega seu próprio tipo de confiança.
export const contractEvents = pgTable(
  "contract_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contractId: uuid("contract_id")
      .notNull()
      .references(() => contracts.id),
    tipo: contractEventType("tipo").notNull(),
    data: date("data").notNull(),
    descricao: text("descricao"),
    valorDelta: numeric("valor_delta", { precision: 18, scale: 2 }), // ex.: variação de aditivo
    rawRecordId: uuid("raw_record_id").references(() => rawRecords.id),
    sourceUrl: text("source_url"),
    trustType: trustType("trust_type").notNull().default("fato_oficial"),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("contract_events_contract_idx").on(t.contractId, t.data)],
);

export type Contract = typeof contracts.$inferSelect;
export type NewContract = typeof contracts.$inferInsert;
export type ContractEvent = typeof contractEvents.$inferSelect;
export type NewContractEvent = typeof contractEvents.$inferInsert;
