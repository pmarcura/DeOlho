/**
 * Mapper PNCP — L1→L3: raw_records (contrato) → contracts + contractEvents.
 *
 * Lê os registros crus do PNCP e deriva o typed-core "contrato", resolvendo as
 * entidades (órgão = Prefeitura de Americana, fornecedor) e ligando cada linha à
 * sua evidência (raw_record_id). Idempotente: re-rodar atualiza em vez de duplicar.
 *
 * Reusa o tipo `PncpContrato` (types.ts) e os utilitários de entidade (reconcile).
 */
import "dotenv/config";
import { and, eq } from "drizzle-orm";
import { getDb } from "../utils/ingest.js";
import { upsertEntity, addEntityReference } from "../reconcile/entities.js";
import { AMERICANA } from "../config.js";
import { rawRecords, contracts, contractEvents } from "@deolho/db";
import type { PncpContrato } from "../types.js";

const ORGAO_NOME = "Município de Americana";

export async function mapearPncp(): Promise<void> {
  const db = getDb();
  if (!db) {
    console.error("[map:pncp] DATABASE_URL não definida — nada a mapear.");
    return;
  }

  const raws = await db
    .select()
    .from(rawRecords)
    .where(and(eq(rawRecords.sourceId, "pncp"), eq(rawRecords.recordType, "contrato")));
  console.log(`[map:pncp] ${raws.length} contratos crus a mapear`);

  let n = 0;
  for (const raw of raws) {
    const c = raw.payload as PncpContrato;

    // Órgão — coletamos contratos de Americana, logo o órgão é a Prefeitura.
    const orgaoId = await upsertEntity(db, {
      kind: "orgao",
      nome: ORGAO_NOME,
      documento: AMERICANA.cnpj,
    });
    await addEntityReference(db, {
      entityId: orgaoId,
      sourceId: "pncp",
      sourceKey: raw.sourceKey,
      rawNome: ORGAO_NOME,
      rawDocumento: AMERICANA.cnpj,
    });

    // Fornecedor — a ponta que cruza com pagamentos (TCE) e sanções (CEIS).
    let fornecedorId: string | null = null;
    if (c.fornecedor?.cnpjCpf || c.fornecedor?.nomeRazaoSocial) {
      fornecedorId = await upsertEntity(db, {
        kind: "empresa",
        nome: c.fornecedor.nomeRazaoSocial,
        documento: c.fornecedor.cnpjCpf,
      });
      await addEntityReference(db, {
        entityId: fornecedorId,
        sourceId: "pncp",
        sourceKey: raw.sourceKey,
        rawNome: c.fornecedor.nomeRazaoSocial,
        rawDocumento: c.fornecedor.cnpjCpf,
      });
    }

    const valores = {
      sourceId: "pncp",
      sourceKey: raw.sourceKey,
      rawRecordId: raw.id,
      numero: c.numeroContrato ?? null,
      ano: c.anoContrato ?? null,
      objeto: c.objetoContrato || "(sem objeto)",
      valorInicial: c.valorInicial != null ? String(c.valorInicial) : null,
      valorGlobal: c.valorGlobal != null ? String(c.valorGlobal) : null,
      dataAssinatura: c.dataAssinatura ? c.dataAssinatura.slice(0, 10) : null,
      dataVigenciaInicio: c.dataVigenciaInicio ? c.dataVigenciaInicio.slice(0, 10) : null,
      dataVigenciaFim: c.dataVigenciaFim ? c.dataVigenciaFim.slice(0, 10) : null,
      situacao: c.situacaoContrato?.nome ?? null,
      orgaoEntityId: orgaoId,
      fornecedorEntityId: fornecedorId,
      municipioIbge: AMERICANA.ibge,
      uf: AMERICANA.uf,
      sourceUrl: raw.sourceUrl,
      publishedAt: raw.publishedAt,
      fetchedAt: raw.fetchedAt,
    };

    const existing = await db
      .select({ id: contracts.id })
      .from(contracts)
      .where(and(eq(contracts.sourceId, "pncp"), eq(contracts.sourceKey, raw.sourceKey)))
      .limit(1);

    let contractId: string;
    if (existing[0]) {
      contractId = existing[0].id;
      await db
        .update(contracts)
        .set({ ...valores, atualizadoEm: new Date() })
        .where(eq(contracts.id, contractId));
    } else {
      const ins = await db.insert(contracts).values(valores).returning({ id: contracts.id });
      if (!ins[0]) throw new Error("[map:pncp] insert de contrato sem retorno");
      contractId = ins[0].id;
    }

    // Linha do tempo — evento de assinatura (idempotente).
    if (valores.dataAssinatura) {
      const ev = await db
        .select({ id: contractEvents.id })
        .from(contractEvents)
        .where(and(eq(contractEvents.contractId, contractId), eq(contractEvents.tipo, "assinatura")))
        .limit(1);
      if (!ev[0]) {
        await db.insert(contractEvents).values({
          contractId,
          tipo: "assinatura",
          data: valores.dataAssinatura,
          descricao: `Assinatura do contrato ${c.numeroContrato ?? ""}`.trim(),
          rawRecordId: raw.id,
          sourceUrl: raw.sourceUrl,
        });
      }
    }
    n++;
  }
  console.log(`[map:pncp] ${n} contratos no typed-core + entidades resolvidas`);
}

if (process.argv[1]?.endsWith("pncp.ts") || process.argv[1]?.endsWith("pncp.js")) {
  mapearPncp().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
