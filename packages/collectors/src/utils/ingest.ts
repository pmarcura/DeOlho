/**
 * Camada L0 — captura crua com proveniência.
 *
 * Todo dado coletado entra primeiro como `raw_records`: payload verbatim +
 * sha256 + (source_id, source_key) + proveniência. É append-only — a mesma
 * chave com hash novo é uma nova versão (expõe edições silenciosas da fonte).
 * Só depois os mappers derivam o typed-core (contracts, payments, gazettes).
 *
 * Reusa `createDb` de @deolho/db. Se DATABASE_URL não estiver definida, a
 * ingestão é desativada (o coletor ainda roda e grava o snapshot JSON) — isso
 * mantém os adapters utilizáveis em dev sem Postgres.
 */
import "dotenv/config";
import { createHash } from "node:crypto";
import { createDb, rawRecords, type DB, type NewRawRecord } from "@deolho/db";

let _db: DB | null | undefined;

/** Conexão única por processo, derivada de DATABASE_URL. null = sem banco. */
export function getDb(): DB | null {
  if (_db !== undefined) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.warn(
      "[ingest] DATABASE_URL não definida — ingestão no Postgres desativada (apenas snapshot JSON).",
    );
    _db = null;
    return _db;
  }
  _db = createDb(url);
  return _db;
}

/** sha256 do payload serializado — dedup + detecção de mudança (DATA-04). */
export function contentHash(payload: unknown): string {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

export interface IngestInput {
  sourceId: string;
  sourceKey: string;
  recordType: string;
  payload: unknown;
  sourceUrl?: string | null;
  publishedAt?: Date | null;
  fetchedAt?: Date;
}

/**
 * Insere um registro cru. Dedup por (source_id, source_key, content_hash) via
 * `onConflictDoNothing`: refetch idêntico é no-op; conteúdo novo na mesma chave
 * cria nova versão (histórico).
 */
export async function ingestRaw(db: DB, input: IngestInput): Promise<void> {
  const row: NewRawRecord = {
    sourceId: input.sourceId,
    sourceKey: input.sourceKey,
    recordType: input.recordType,
    payload: input.payload,
    contentHash: contentHash(input.payload),
    sourceUrl: input.sourceUrl ?? null,
    publishedAt: input.publishedAt ?? null,
    fetchedAt: input.fetchedAt ?? new Date(),
  };
  await db.insert(rawRecords).values(row).onConflictDoNothing();
}

/** Ingestão em lote. Retorna quantos registros foram processados. */
export async function ingestMany(db: DB, inputs: IngestInput[]): Promise<number> {
  for (const input of inputs) await ingestRaw(db, input);
  return inputs.length;
}
