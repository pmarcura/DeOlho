import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { trustType } from "./_enums";
import { sources } from "./sources";
import { rawRecords } from "./raw-records";
import { civicEvents } from "./civic-events";

// Evidência granular. Cada campo público sensível deve conseguir apontar para
// documento, trecho, payload ou posição de extração que sustenta a afirmação.
export const evidence = pgTable(
  "evidence",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    evidenceKey: text("evidence_key").notNull(),
    civicEventId: uuid("civic_event_id").references(() => civicEvents.id),
    rawRecordId: uuid("raw_record_id").references(() => rawRecords.id),
    sourceId: text("source_id")
      .notNull()
      .references(() => sources.id),
    sourceKey: text("source_key"),
    fieldPath: text("field_path"),
    titulo: text("titulo").notNull(),
    sourceUrl: text("source_url"),
    trecho: text("trecho"),
    pagina: integer("pagina"),
    posicaoInicio: integer("posicao_inicio"),
    posicaoFim: integer("posicao_fim"),
    metodoExtracao: text("metodo_extracao").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }),
    trustType: trustType("trust_type").notNull().default("fato_oficial"),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("evidence_key_idx").on(t.evidenceKey),
    index("evidence_event_idx").on(t.civicEventId),
    index("evidence_raw_idx").on(t.rawRecordId),
    index("evidence_source_idx").on(t.sourceId, t.sourceKey),
  ],
);

export type Evidence = typeof evidence.$inferSelect;
export type NewEvidence = typeof evidence.$inferInsert;
