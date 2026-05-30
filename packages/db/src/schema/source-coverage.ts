import {
  pgTable,
  uuid,
  text,
  integer,
  date,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sourceCoverageStatus } from "./_enums";
import { sources } from "./sources";

// Estado operacional de cada fonte/coletor. Permite publicar lacunas como dado:
// sem API, sem chave, sem registros, atrasado, parcial ou com erro.
export const sourceCoverage = pgTable(
  "source_coverage",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sourceId: text("source_id")
      .notNull()
      .references(() => sources.id),
    collector: text("collector").notNull(),
    territoryIbge: text("territory_ibge"),
    uf: text("uf"),
    recordType: text("record_type").notNull(),
    status: sourceCoverageStatus("status").notNull(),
    coverageStart: date("coverage_start"),
    coverageEnd: date("coverage_end"),
    lastAttemptAt: timestamp("last_attempt_at", { withTimezone: true }).notNull(),
    lastSuccessAt: timestamp("last_success_at", { withTimezone: true }),
    totalRecords: integer("total_records"),
    errorMessage: text("error_message"),
    limitations: text("limitations"),
    metadata: jsonb("metadata"),
    atualizadoEm: timestamp("atualizado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("source_coverage_unique_idx").on(
      t.sourceId,
      t.collector,
      t.territoryIbge,
      t.recordType,
    ),
    index("source_coverage_source_idx").on(t.sourceId, t.status),
    index("source_coverage_territory_idx").on(t.territoryIbge),
  ],
);

export type SourceCoverage = typeof sourceCoverage.$inferSelect;
export type NewSourceCoverage = typeof sourceCoverage.$inferInsert;
