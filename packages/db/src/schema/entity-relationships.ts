import {
  pgTable,
  uuid,
  text,
  numeric,
  date,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relationshipType, trustType } from "./_enums";
import { entities } from "./entities";
import { sources } from "./sources";
import { rawRecords } from "./raw-records";
import { civicEvents } from "./civic-events";
import { evidence } from "./evidence";

// Arestas documentadas entre entidades canônicas. Não registra parentesco por
// sobrenome nem hipótese pública sem evidência oficial.
export const entityRelationships = pgTable(
  "entity_relationships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    relationshipKey: text("relationship_key").notNull(),
    fromEntityId: uuid("from_entity_id")
      .notNull()
      .references(() => entities.id),
    toEntityId: uuid("to_entity_id")
      .notNull()
      .references(() => entities.id),
    tipo: relationshipType("tipo").notNull(),
    sourceId: text("source_id")
      .notNull()
      .references(() => sources.id),
    sourceKey: text("source_key"),
    rawRecordId: uuid("raw_record_id").references(() => rawRecords.id),
    civicEventId: uuid("civic_event_id").references(() => civicEvents.id),
    evidenceId: uuid("evidence_id").references(() => evidence.id),
    descricao: text("descricao"),
    confianca: numeric("confianca", { precision: 4, scale: 3 }).notNull().default("1.000"),
    dataInicio: date("data_inicio"),
    dataFim: date("data_fim"),
    metadata: jsonb("metadata"),
    trustType: trustType("trust_type").notNull().default("fato_oficial"),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("entity_relationships_key_idx").on(t.relationshipKey),
    index("entity_relationships_from_idx").on(t.fromEntityId),
    index("entity_relationships_to_idx").on(t.toEntityId),
    index("entity_relationships_source_idx").on(t.sourceId, t.sourceKey),
    index("entity_relationships_type_idx").on(t.tipo),
  ],
);

export type EntityRelationship = typeof entityRelationships.$inferSelect;
export type NewEntityRelationship = typeof entityRelationships.$inferInsert;
