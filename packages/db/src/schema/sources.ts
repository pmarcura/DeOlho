import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { trustType } from "./_enums";

// Catálogo de fontes públicas. `limitacoes` é de primeira classe: alimenta
// TRUST-05 ("a fonte não informa X" / "essa fonte está incompleta").
export const sources = pgTable("sources", {
  id: text("id").primaryKey(), // ex.: 'pncp', 'cgu-transparencia', 'dou-inlabs'
  nome: text("nome").notNull(),
  descricao: text("descricao"),
  baseUrl: text("base_url"),
  licenca: text("licenca"),
  termosUrl: text("termos_url"),
  cobertura: text("cobertura"),
  limitacoes: text("limitacoes"), // TRUST-05
  defaultTrustType: trustType("default_trust_type").notNull().default("fato_oficial"),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
});

export type Source = typeof sources.$inferSelect;
export type NewSource = typeof sources.$inferInsert;
