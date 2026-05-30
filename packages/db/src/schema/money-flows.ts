import {
  pgTable,
  uuid,
  text,
  integer,
  numeric,
  date,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { moneyFlowType, trustType } from "./_enums";
import { sources } from "./sources";
import { rawRecords } from "./raw-records";
import { entities } from "./entities";
import { contracts } from "./contracts";
import { civicEvents } from "./civic-events";

// Fluxo financeiro normalizado. Contratos, empenhos, liquidações, pagamentos e
// receitas entram na mesma linha analítica, com origem e evidência explícitas.
export const moneyFlows = pgTable(
  "money_flows",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    flowKey: text("flow_key").notNull(),
    sourceId: text("source_id")
      .notNull()
      .references(() => sources.id),
    sourceKey: text("source_key").notNull(),
    rawRecordId: uuid("raw_record_id").references(() => rawRecords.id),
    civicEventId: uuid("civic_event_id").references(() => civicEvents.id),
    contractId: uuid("contract_id").references(() => contracts.id),
    orgaoEntityId: uuid("orgao_entity_id").references(() => entities.id),
    counterpartyEntityId: uuid("counterparty_entity_id").references(() => entities.id),
    tipo: moneyFlowType("tipo").notNull(),
    valor: numeric("valor", { precision: 18, scale: 2 }).notNull(),
    moeda: text("moeda").notNull().default("BRL"),
    dataCompetencia: date("data_competencia"),
    dataMovimento: date("data_movimento"),
    exercicio: integer("exercicio"),
    municipioIbge: text("municipio_ibge"),
    uf: text("uf"),
    descricao: text("descricao"),
    sourceUrl: text("source_url"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }),
    trustType: trustType("trust_type").notNull().default("fato_oficial"),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
    atualizadoEm: timestamp("atualizado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("money_flows_key_idx").on(t.flowKey),
    index("money_flows_source_idx").on(t.sourceId, t.sourceKey),
    index("money_flows_type_idx").on(t.tipo),
    index("money_flows_contract_idx").on(t.contractId),
    index("money_flows_orgao_idx").on(t.orgaoEntityId),
    index("money_flows_counterparty_idx").on(t.counterpartyEntityId),
    index("money_flows_municipio_idx").on(t.municipioIbge),
  ],
);

export type MoneyFlow = typeof moneyFlows.$inferSelect;
export type NewMoneyFlow = typeof moneyFlows.$inferInsert;
