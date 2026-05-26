import { pgTable, uuid, text, date, timestamp, index } from "drizzle-orm/pg-core";
import { entities } from "./entities";
import { sources } from "./sources";
import { rawRecords } from "./raw-records";

// Sócios/representantes de uma EMPRESA (quadro societário público do CNPJ — QSA).
//
// Decisão de privacidade/arquitetura: NÃO promovemos sócio a `entities`. O modelo
// separa pessoa pública (em função) de cidadão comum, e um sócio é, por padrão,
// cidadão. Guardamos o sócio como ATRIBUTO da empresa, com o documento mascarado
// exatamente como a Receita o expõe (ex.: ***571038**). "Esse sócio também é
// agente público / doador" é um SINAL computado depois (cruzando com pessoa_publica
// e TSE), com disclaimer — nunca uma exposição automática de cidadão comum.
export const companyPartners = pgTable(
  "company_partners",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    entityId: uuid("entity_id")
      .notNull()
      .references(() => entities.id), // a empresa (kind=empresa)
    sourceId: text("source_id")
      .notNull()
      .references(() => sources.id),
    rawRecordId: uuid("raw_record_id").references(() => rawRecords.id),
    nomeSocio: text("nome_socio").notNull(),
    documentoSocio: text("documento_socio"), // mascarado, como a fonte expõe
    qualificacao: text("qualificacao"),
    faixaEtaria: text("faixa_etaria"),
    dataEntrada: date("data_entrada"),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("company_partners_entity_idx").on(t.entityId),
    index("company_partners_nome_idx").on(t.nomeSocio),
  ],
);

export type CompanyPartner = typeof companyPartners.$inferSelect;
export type NewCompanyPartner = typeof companyPartners.$inferInsert;
