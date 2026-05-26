import {
  pgTable,
  uuid,
  text,
  integer,
  numeric,
  date,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { trustType } from "./_enums";
import { sources } from "./sources";
import { entities } from "./entities";
import { contracts } from "./contracts";
import { rawRecords } from "./raw-records";

// Execução da despesa municipal (empenho → liquidação → pagamento). É o "eixo do
// dinheiro" do lado da saída: liga o credor (entidade canônica) ao órgão e, quando
// possível, ao contrato — o cruzamento que dá sentido investigativo.
//
// Mesmo padrão de contracts: typed-core + raw (raw_record_id) + proveniência por
// campo (source_url/published_at/fetched_at) + tipagem de confiança (trust_type).
// Nem toda despesa tem contrato → contract_id é nullable.
export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sourceId: text("source_id")
      .notNull()
      .references(() => sources.id),
    sourceKey: text("source_key").notNull(),
    rawRecordId: uuid("raw_record_id").references(() => rawRecords.id), // evidência

    // Vínculos — o join do eixo do dinheiro (CONT-09)
    credorEntityId: uuid("credor_entity_id").references(() => entities.id),
    orgaoEntityId: uuid("orgao_entity_id").references(() => entities.id),
    contractId: uuid("contract_id").references(() => contracts.id), // nullable

    // Identificação na fonte
    numeroEmpenho: text("numero_empenho"),
    exercicio: integer("exercicio"),

    // As três fases que o TCE-SP publica
    valorEmpenhado: numeric("valor_empenhado", { precision: 18, scale: 2 }),
    valorLiquidado: numeric("valor_liquidado", { precision: 18, scale: 2 }),
    valorPago: numeric("valor_pago", { precision: 18, scale: 2 }),
    moeda: text("moeda").notNull().default("BRL"),
    data: date("data"),
    descricao: text("descricao"),
    municipioIbge: text("municipio_ibge"),
    uf: text("uf"),

    // Proveniência (TRUST-02/03) + confiança (TRUST-01)
    sourceUrl: text("source_url"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }),
    trustType: trustType("trust_type").notNull().default("fato_oficial"),

    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
    atualizadoEm: timestamp("atualizado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("payments_source_idx").on(t.sourceId, t.sourceKey),
    index("payments_credor_idx").on(t.credorEntityId),
    index("payments_orgao_idx").on(t.orgaoEntityId),
    index("payments_contract_idx").on(t.contractId),
    index("payments_municipio_idx").on(t.municipioIbge),
  ],
);

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
