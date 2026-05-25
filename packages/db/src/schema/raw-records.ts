import {
  pgTable,
  uuid,
  text,
  jsonb,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sources } from "./sources";

// Trilha de evidência + proveniência + versionamento (TRUST-02/03, DATA-04).
//
// Append-only: a MESMA (source_id, source_key) com content_hash diferente ao
// longo do tempo É o histórico de mudanças (expõe edições silenciosas — ouro
// investigativo). Nunca sobrescrever um registro raw; sempre inserir um novo.
// O payload verbatim permite rederivar campos após bugs de parsing sem refetch
// e torna "a fonte não informa X" literalmente inspecionável.
export const rawRecords = pgTable(
  "raw_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sourceId: text("source_id")
      .notNull()
      .references(() => sources.id),
    sourceKey: text("source_key").notNull(), // chave natural na fonte
    recordType: text("record_type").notNull(), // compra | contrato | despesa | gazeta | ...
    payload: jsonb("payload").notNull(), // resposta verbatim da fonte
    contentHash: text("content_hash").notNull(), // sha256(payload) — dedup + detecção de mudança
    sourceUrl: text("source_url"), // TRUST-02
    publishedAt: timestamp("published_at", { withTimezone: true }), // TRUST-03 (quando publicado)
    fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull(), // TRUST-03 (quando coletado)
    sourceVersion: text("source_version"),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // Dedup: ignora refetch idêntico; permite versão nova quando o conteúdo muda.
    uniqueIndex("raw_records_dedup_idx").on(t.sourceId, t.sourceKey, t.contentHash),
    // Histórico de mudanças por chave da fonte.
    index("raw_records_history_idx").on(t.sourceId, t.sourceKey),
    index("raw_records_type_idx").on(t.recordType),
  ],
);

export type RawRecord = typeof rawRecords.$inferSelect;
export type NewRawRecord = typeof rawRecords.$inferInsert;
