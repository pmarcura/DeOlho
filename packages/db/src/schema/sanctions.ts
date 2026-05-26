import { pgTable, uuid, text, date, timestamp, index } from "drizzle-orm/pg-core";
import { entities } from "./entities";
import { sources } from "./sources";
import { rawRecords } from "./raw-records";
import { trustType } from "./_enums";

// Sanções a empresas: CEIS (inidôneas/suspensas de licitar) e CNEP (punidas pela
// Lei Anticorrupção). É o sinal mais forte do eixo do dinheiro — fornecedor
// sancionado com contrato/pagamento ativo. Fato oficial (cadastro da CGU).
// `entityId` é preenchido quando o CNPJ casa com uma empresa já conhecida.
export const sanctions = pgTable(
  "sanctions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    entityId: uuid("entity_id").references(() => entities.id),
    sourceId: text("source_id")
      .notNull()
      .references(() => sources.id),
    rawRecordId: uuid("raw_record_id").references(() => rawRecords.id),
    cadastro: text("cadastro").notNull(), // 'CEIS' | 'CNEP'
    documento: text("documento"), // CNPJ/CPF do sancionado (normalizado)
    nomeSancionado: text("nome_sancionado"),
    tipoSancao: text("tipo_sancao"),
    orgaoSancionador: text("orgao_sancionador"),
    dataInicio: date("data_inicio"),
    dataFim: date("data_fim"),
    fundamentacao: text("fundamentacao"),
    sourceUrl: text("source_url"),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }),
    trustType: trustType("trust_type").notNull().default("fato_oficial"),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("sanctions_entity_idx").on(t.entityId),
    index("sanctions_documento_idx").on(t.documento),
  ],
);

export type Sanction = typeof sanctions.$inferSelect;
export type NewSanction = typeof sanctions.$inferInsert;
