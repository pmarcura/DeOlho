import { and, eq } from "drizzle-orm";
import {
  civicEvents,
  evidence,
  entityRelationships,
  moneyFlows,
  sourceCoverage,
  type DB,
  type NewCivicEvent,
  type NewEvidence,
  type NewEntityRelationship,
  type NewMoneyFlow,
  type NewSourceCoverage,
} from "@deolho/db";
import { AMERICANA } from "../config.js";
import { getDb } from "./ingest.js";

export type CivicEventInput = Omit<NewCivicEvent, "id" | "criadoEm" | "atualizadoEm">;
export type EvidenceInput = Omit<NewEvidence, "id" | "criadoEm">;
export type MoneyFlowInput = Omit<NewMoneyFlow, "id" | "criadoEm" | "atualizadoEm">;
export type EntityRelationshipInput = Omit<NewEntityRelationship, "id" | "criadoEm">;
export type SourceCoverageInput = Omit<NewSourceCoverage, "id" | "atualizadoEm">;

export async function upsertCivicEvent(
  db: DB,
  input: CivicEventInput,
): Promise<string> {
  const existing = await db
    .select({ id: civicEvents.id })
    .from(civicEvents)
    .where(
      and(
        eq(civicEvents.sourceId, input.sourceId),
        eq(civicEvents.sourceKey, input.sourceKey),
        eq(civicEvents.tipo, input.tipo),
      ),
    )
    .limit(1);

  if (existing[0]) {
    await db
      .update(civicEvents)
      .set({ ...input, atualizadoEm: new Date() })
      .where(eq(civicEvents.id, existing[0].id));
    return existing[0].id;
  }

  const inserted = await db.insert(civicEvents).values(input).returning({ id: civicEvents.id });
  if (!inserted[0]) throw new Error("[civic] insert de evento sem retorno");
  return inserted[0].id;
}

export async function upsertEvidence(db: DB, input: EvidenceInput): Promise<string> {
  const existing = await db
    .select({ id: evidence.id })
    .from(evidence)
    .where(eq(evidence.evidenceKey, input.evidenceKey))
    .limit(1);

  if (existing[0]) return existing[0].id;
  const inserted = await db.insert(evidence).values(input).returning({ id: evidence.id });
  if (!inserted[0]) throw new Error("[civic] insert de evidência sem retorno");
  return inserted[0].id;
}

export async function upsertMoneyFlow(db: DB, input: MoneyFlowInput): Promise<string> {
  const existing = await db
    .select({ id: moneyFlows.id })
    .from(moneyFlows)
    .where(eq(moneyFlows.flowKey, input.flowKey))
    .limit(1);

  if (existing[0]) {
    await db
      .update(moneyFlows)
      .set({ ...input, atualizadoEm: new Date() })
      .where(eq(moneyFlows.id, existing[0].id));
    return existing[0].id;
  }

  const inserted = await db.insert(moneyFlows).values(input).returning({ id: moneyFlows.id });
  if (!inserted[0]) throw new Error("[civic] insert de fluxo financeiro sem retorno");
  return inserted[0].id;
}

export async function upsertEntityRelationship(
  db: DB,
  input: EntityRelationshipInput,
): Promise<string> {
  const existing = await db
    .select({ id: entityRelationships.id })
    .from(entityRelationships)
    .where(eq(entityRelationships.relationshipKey, input.relationshipKey))
    .limit(1);

  if (existing[0]) return existing[0].id;
  const inserted = await db
    .insert(entityRelationships)
    .values(input)
    .returning({ id: entityRelationships.id });
  if (!inserted[0]) throw new Error("[civic] insert de vínculo sem retorno");
  return inserted[0].id;
}

export async function upsertSourceCoverage(db: DB, input: SourceCoverageInput): Promise<void> {
  const territoryIbge = input.territoryIbge ?? AMERICANA.ibge;
  const existing = await db
    .select({ id: sourceCoverage.id })
    .from(sourceCoverage)
    .where(
      and(
        eq(sourceCoverage.sourceId, input.sourceId),
        eq(sourceCoverage.collector, input.collector),
        eq(sourceCoverage.territoryIbge, territoryIbge),
        eq(sourceCoverage.recordType, input.recordType),
      ),
    )
    .limit(1);

  const row = {
    ...input,
    territoryIbge,
    uf: input.uf ?? AMERICANA.uf,
    atualizadoEm: new Date(),
  };

  if (existing[0]) {
    await db.update(sourceCoverage).set(row).where(eq(sourceCoverage.id, existing[0].id));
    return;
  }

  await db.insert(sourceCoverage).values(row);
}

export async function recordSourceCoverage(input: SourceCoverageInput): Promise<void> {
  const db = getDb();
  if (!db) return;
  await upsertSourceCoverage(db, input);
}

