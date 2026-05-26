/**
 * Mapper TCE-SP — L1→L3: raw_records (despesa) → payments.
 *
 * Deriva o typed-core "pagamento" das despesas do TCE-SP, resolvendo o credor em
 * entidade canônica (o CNPJ que cruza com os contratos do PNCP) e o órgão. Liga
 * cada pagamento à sua evidência (raw_record_id). Idempotente por (source, key).
 *
 * Roda vazio enquanto o endpoint real do TCE-SP não for resolvido (ver
 * adapters/tce-sp.ts) — fica pronto para quando houver despesas cruas no banco.
 */
import "dotenv/config";
import { and, eq } from "drizzle-orm";
import { getDb } from "../utils/ingest.js";
import { upsertEntity, addEntityReference } from "../reconcile/entities.js";
import { AMERICANA } from "../config.js";
import { rawRecords, payments } from "@deolho/db";
import type { TceSpDespesa } from "../types.js";

export async function mapearTceSp(): Promise<void> {
  const db = getDb();
  if (!db) {
    console.error("[map:tce] DATABASE_URL não definida — nada a mapear.");
    return;
  }

  const raws = await db
    .select()
    .from(rawRecords)
    .where(and(eq(rawRecords.sourceId, "tce-sp"), eq(rawRecords.recordType, "despesa")));
  console.log(`[map:tce] ${raws.length} despesas cruas a mapear`);

  let n = 0;
  for (const raw of raws) {
    const d = raw.payload as TceSpDespesa;

    let credorId: string | null = null;
    if (d.cpfCnpjCredor || d.nomeCredor) {
      credorId = await upsertEntity(db, {
        kind: "empresa",
        nome: d.nomeCredor,
        documento: d.cpfCnpjCredor,
      });
      await addEntityReference(db, {
        entityId: credorId,
        sourceId: "tce-sp",
        sourceKey: raw.sourceKey,
        rawNome: d.nomeCredor,
        rawDocumento: d.cpfCnpjCredor,
      });
    }

    const orgaoId = await upsertEntity(db, {
      kind: "orgao",
      nome: d.nomeOrgao || "Município de Americana",
      documento: AMERICANA.cnpj,
    });

    const valores = {
      sourceId: "tce-sp",
      sourceKey: raw.sourceKey,
      rawRecordId: raw.id,
      credorEntityId: credorId,
      orgaoEntityId: orgaoId,
      numeroEmpenho: d.empenho ?? null,
      exercicio: d.exercicio ?? null,
      valorEmpenhado: d.valorEmpenhado != null ? String(d.valorEmpenhado) : null,
      valorLiquidado: d.valorLiquidado != null ? String(d.valorLiquidado) : null,
      valorPago: d.valorPago != null ? String(d.valorPago) : null,
      municipioIbge: AMERICANA.ibge,
      uf: AMERICANA.uf,
      sourceUrl: raw.sourceUrl,
      publishedAt: raw.publishedAt,
      fetchedAt: raw.fetchedAt,
    };

    const existing = await db
      .select({ id: payments.id })
      .from(payments)
      .where(and(eq(payments.sourceId, "tce-sp"), eq(payments.sourceKey, raw.sourceKey)))
      .limit(1);

    if (existing[0]) {
      await db
        .update(payments)
        .set({ ...valores, atualizadoEm: new Date() })
        .where(eq(payments.id, existing[0].id));
    } else {
      await db.insert(payments).values(valores);
    }
    n++;
  }
  console.log(`[map:tce] ${n} pagamentos no typed-core (payments)`);
}

if (process.argv[1]?.endsWith("tce-sp.ts") || process.argv[1]?.endsWith("tce-sp.js")) {
  mapearTceSp().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
