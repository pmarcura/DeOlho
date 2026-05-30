/**
 * Mapper TCE-SP — L1→L3: raw_records (despesa) → payments.
 *
 * Deriva o typed-core "pagamento" das despesas do TCE-SP, resolvendo o credor em
 * entidade canônica (o CNPJ que cruza com os contratos do PNCP) e o órgão. Liga
 * cada pagamento à sua evidência (raw_record_id). Idempotente por (source, key).
 */
import "dotenv/config";
import { and, eq, isNull, or } from "drizzle-orm";
import { closeDb, getDb } from "../utils/ingest.js";
import { upsertEntity, addEntityReference } from "../reconcile/entities.js";
import { AMERICANA } from "../config.js";
import { civicEvents, evidence as evidenceTable, moneyFlows, rawRecords, payments } from "@deolho/db";
import type { TceSpDespesa, TceSpReceita } from "../types.js";
import { upsertCivicEvent, upsertEvidence, upsertMoneyFlow } from "../utils/civic.js";

function competencia(exercicio: number | null | undefined, mes: number | null | undefined): string | null {
  if (!exercicio || !mes || mes < 1 || mes > 12) return null;
  return `${exercicio}-${String(mes).padStart(2, "0")}-01`;
}

function formatarValor(valor: number): string {
  return `R$ ${valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

function dataBrParaIso(data: string | null | undefined): string | null {
  if (!data) return null;
  const partes = data.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!partes) return null;
  const [, dia, mes, ano] = partes;
  return `${ano}-${mes}-${dia}`;
}

function documentoCnpj(documento: string | null | undefined): string | null {
  const digits = documento?.replace(/\D/g, "") ?? "";
  return digits.length === 14 ? digits : null;
}

function tipoFluxoDespesa(evento: string | null | undefined): "empenhado" | "liquidado" | "pago" | "reforcado" | "anulado" | null {
  const normalizado = evento
    ?.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  if (normalizado === "empenhado") return "empenhado";
  if (normalizado === "liquidado" || normalizado === "valor liquidado") return "liquidado";
  if (normalizado === "pago" || normalizado === "valor pago") return "pago";
  if (normalizado === "reforco" || normalizado === "reforcado") return "reforcado";
  if (normalizado === "anulacao" || normalizado === "anulado") return "anulado";
  return null;
}

function entityCacheKey(kind: string, nome: string, documento: string | null | undefined): string {
  return `${kind}:${documento ?? nome}`;
}

export async function mapearTceSp(): Promise<void> {
  const db = getDb();
  if (!db) {
    console.error("[map:tce] DATABASE_URL não definida — nada a mapear.");
    return;
  }
  const database = db;

  const despesaRows = await db
    .select({ raw: rawRecords })
    .from(rawRecords)
    .leftJoin(
      civicEvents,
      and(
        eq(civicEvents.sourceId, rawRecords.sourceId),
        eq(civicEvents.sourceKey, rawRecords.sourceKey),
        eq(civicEvents.tipo, "pagamento_registrado"),
      ),
    )
    .leftJoin(
      evidenceTable,
      and(
        eq(evidenceTable.sourceId, rawRecords.sourceId),
        eq(evidenceTable.sourceKey, rawRecords.sourceKey),
      ),
    )
    .leftJoin(
      moneyFlows,
      and(eq(moneyFlows.sourceId, rawRecords.sourceId), eq(moneyFlows.sourceKey, rawRecords.sourceKey)),
    )
    .where(
      and(
        eq(rawRecords.sourceId, "tce-sp"),
        eq(rawRecords.recordType, "despesa"),
        or(isNull(civicEvents.id), isNull(evidenceTable.id), isNull(moneyFlows.id)),
      ),
    );
  const raws = despesaRows.map((row) => row.raw);
  console.log(`[map:tce] ${raws.length} despesas cruas a mapear`);

  const receitaRows = await db
    .select({ raw: rawRecords })
    .from(rawRecords)
    .leftJoin(
      civicEvents,
      and(
        eq(civicEvents.sourceId, rawRecords.sourceId),
        eq(civicEvents.sourceKey, rawRecords.sourceKey),
        eq(civicEvents.tipo, "receita_registrada"),
      ),
    )
    .leftJoin(
      evidenceTable,
      and(
        eq(evidenceTable.sourceId, rawRecords.sourceId),
        eq(evidenceTable.sourceKey, rawRecords.sourceKey),
      ),
    )
    .leftJoin(
      moneyFlows,
      and(eq(moneyFlows.sourceId, rawRecords.sourceId), eq(moneyFlows.sourceKey, rawRecords.sourceKey)),
    )
    .where(
      and(
        eq(rawRecords.sourceId, "tce-sp"),
        eq(rawRecords.recordType, "receita"),
        or(isNull(civicEvents.id), isNull(evidenceTable.id), isNull(moneyFlows.id)),
      ),
    );
  const receitasRaw = receitaRows.map((row) => row.raw);
  console.log(`[map:tce] ${receitasRaw.length} receitas cruas a mapear`);

  const entidadeCache = new Map<string, string>();
  async function upsertEntityCached(args: {
    kind: "empresa" | "orgao";
    nome: string;
    documento?: string | null;
  }): Promise<string> {
    const key = entityCacheKey(args.kind, args.nome, args.documento);
    const cached = entidadeCache.get(key);
    if (cached) return cached;
    const id = await upsertEntity(database, args);
    entidadeCache.set(key, id);
    return id;
  }

  let n = 0;
  for (const [index, raw] of raws.entries()) {
    const d = raw.payload as TceSpDespesa;
    const credorDocumento = documentoCnpj(d.cpfCnpjCredor);

    let credorId: string | null = null;
    if (credorDocumento) {
      credorId = await upsertEntityCached({
        kind: "empresa",
        nome: d.nomeCredor || credorDocumento,
        documento: credorDocumento,
      });
      await addEntityReference(db, {
        entityId: credorId,
        sourceId: "tce-sp",
        sourceKey: raw.sourceKey,
        rawNome: d.nomeCredor || credorDocumento,
        rawDocumento: credorDocumento,
      });
    }

    const orgaoId = await upsertEntityCached({
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
      data: dataBrParaIso(d.dataEmissaoDespesa) ?? competencia(d.exercicio, d.mes),
      descricao: d.acao ?? d.eventoDespesa ?? null,
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

    const maiorValor = Math.max(d.valorPago ?? 0, d.valorLiquidado ?? 0, d.valorEmpenhado ?? 0);
    const dataCompetencia = competencia(d.exercicio, d.mes);
    const dataMovimento = dataBrParaIso(d.dataEmissaoDespesa) ?? dataCompetencia;
    const valorEvento = d.valorDespesa ?? maiorValor;
    const valorRepresentativo = valorEvento !== 0 ? valorEvento : maiorValor;
    const civicEventId = await upsertCivicEvent(db, {
      sourceId: "tce-sp",
      sourceKey: raw.sourceKey,
      rawRecordId: raw.id,
      tipo: "pagamento_registrado",
      categoria: "pagamento",
      titulo: d.nomeCredor
        ? `Despesa registrada para ${d.nomeCredor}`
        : "Despesa registrada pelo TCE-SP",
      resumo: [
        d.nomeOrgao ? `Órgão: ${d.nomeOrgao}.` : null,
        d.nomeCredor ? `Credor: ${d.nomeCredor}.` : null,
        valorRepresentativo !== 0 ? `Valor da fase informada: ${formatarValor(valorRepresentativo)}.` : null,
        d.acao ? `Ação orçamentária: ${d.acao}.` : null,
      ].filter(Boolean).join(" "),
      dataEvento: dataCompetencia,
      valor: valorRepresentativo !== 0 ? String(valorRepresentativo) : null,
      municipioIbge: AMERICANA.ibge,
      uf: AMERICANA.uf,
      territorio: { municipio: AMERICANA.nome, ibge: AMERICANA.ibge, uf: AMERICANA.uf },
      entidades: {
        orgaoEntityId: orgaoId,
        credorEntityId: credorId,
        credorDocumento,
        evento: d.eventoDespesa ?? null,
      },
      limitacoes: credorId
        ? null
        : [{ campo: "credor", mensagem: "A fonte não informou CNPJ completo do credor neste registro; pessoa física comum não vira entidade pública." }],
      sourceUrl: raw.sourceUrl,
      publishedAt: raw.publishedAt,
      fetchedAt: raw.fetchedAt,
      trustType: "fato_oficial",
    });

    await upsertEvidence(db, {
      evidenceKey: `tce-sp:${raw.sourceKey}:despesa`,
      civicEventId,
      rawRecordId: raw.id,
      sourceId: "tce-sp",
      sourceKey: raw.sourceKey,
      fieldPath: "$",
      titulo: "Registro oficial de despesa no TCE-SP",
      sourceUrl: raw.sourceUrl,
      trecho: d.acao || d.nomeCredor || null,
      metodoExtracao: "api-tce-sp",
      publishedAt: raw.publishedAt,
      fetchedAt: raw.fetchedAt,
      trustType: "fato_oficial",
    });

    const tipoPrincipal = tipoFluxoDespesa(d.eventoDespesa);
    if (tipoPrincipal && Number.isFinite(valorEvento)) {
      await upsertMoneyFlow(db, {
        flowKey: `tce-sp:${raw.sourceKey}:${tipoPrincipal}`,
        sourceId: "tce-sp",
        sourceKey: raw.sourceKey,
        rawRecordId: raw.id,
        civicEventId,
        orgaoEntityId: orgaoId,
        counterpartyEntityId: credorId,
        tipo: tipoPrincipal,
        valor: String(valorEvento),
        dataCompetencia,
        dataMovimento,
        exercicio: d.exercicio ?? null,
        municipioIbge: AMERICANA.ibge,
        uf: AMERICANA.uf,
        descricao: d.acao || d.nomeCredor || `Despesa ${raw.sourceKey}`,
        sourceUrl: raw.sourceUrl,
        publishedAt: raw.publishedAt,
        fetchedAt: raw.fetchedAt,
        trustType: "fato_oficial",
      });
      n++;
      continue;
    }

    const fases = [
      ["empenhado", d.valorEmpenhado],
      ["liquidado", d.valorLiquidado],
      ["pago", d.valorPago],
    ] as const;
    for (const [tipo, valor] of fases) {
      if (valor == null || !Number.isFinite(valor)) continue;
      await upsertMoneyFlow(db, {
        flowKey: `tce-sp:${raw.sourceKey}:${tipo}`,
        sourceId: "tce-sp",
        sourceKey: raw.sourceKey,
        rawRecordId: raw.id,
        civicEventId,
        orgaoEntityId: orgaoId,
        counterpartyEntityId: credorId,
        tipo,
        valor: String(valor),
        dataCompetencia,
        dataMovimento,
        exercicio: d.exercicio ?? null,
        municipioIbge: AMERICANA.ibge,
        uf: AMERICANA.uf,
        descricao: d.acao || d.nomeCredor || `Despesa ${raw.sourceKey}`,
        sourceUrl: raw.sourceUrl,
        publishedAt: raw.publishedAt,
        fetchedAt: raw.fetchedAt,
        trustType: "fato_oficial",
      });
    }
    n++;
    if ((index + 1) % 5000 === 0) {
      console.log(`[map:tce] ${index + 1}/${raws.length} despesas processadas`);
    }
  }

  let receitas = 0;
  for (const [index, raw] of receitasRaw.entries()) {
    const r = raw.payload as TceSpReceita;
    const orgaoId = await upsertEntityCached({
      kind: "orgao",
      nome: r.orgao || "Município de Americana",
      documento: AMERICANA.cnpj,
    });

    const dataCompetencia = competencia(r.exercicio, r.mes);
    const civicEventId = await upsertCivicEvent(db, {
      sourceId: "tce-sp",
      sourceKey: raw.sourceKey,
      rawRecordId: raw.id,
      tipo: "receita_registrada",
      categoria: "receita",
      titulo: r.especie
        ? `Receita arrecadada: ${r.especie}`
        : "Receita arrecadada registrada pelo TCE-SP",
      resumo: [
        r.orgao ? `Órgão: ${r.orgao}.` : null,
        r.categoria ? `Fonte: ${r.categoria}.` : null,
        Number.isFinite(r.valorArrecadado) ? `Valor arrecadado: ${formatarValor(r.valorArrecadado)}.` : null,
      ].filter(Boolean).join(" "),
      dataEvento: dataCompetencia,
      valor: Number.isFinite(r.valorArrecadado) ? String(r.valorArrecadado) : null,
      municipioIbge: AMERICANA.ibge,
      uf: AMERICANA.uf,
      territorio: { municipio: AMERICANA.nome, ibge: AMERICANA.ibge, uf: AMERICANA.uf },
      entidades: {
        orgaoEntityId: orgaoId,
        fonteRecurso: r.fonteRecurso ?? r.categoria,
        codigoAplicacao: r.codigoAplicacao ?? r.origem,
      },
      sourceUrl: raw.sourceUrl,
      publishedAt: raw.publishedAt,
      fetchedAt: raw.fetchedAt,
      trustType: "fato_oficial",
    });

    await upsertEvidence(db, {
      evidenceKey: `tce-sp:${raw.sourceKey}:receita`,
      civicEventId,
      rawRecordId: raw.id,
      sourceId: "tce-sp",
      sourceKey: raw.sourceKey,
      fieldPath: "$",
      titulo: "Registro oficial de receita no TCE-SP",
      sourceUrl: raw.sourceUrl,
      trecho: [r.categoria, r.especie, r.rubrica].filter(Boolean).join(" | ") || null,
      metodoExtracao: "api-tce-sp",
      publishedAt: raw.publishedAt,
      fetchedAt: raw.fetchedAt,
      trustType: "fato_oficial",
    });

    if (Number.isFinite(r.valorArrecadado)) {
      await upsertMoneyFlow(db, {
        flowKey: `tce-sp:${raw.sourceKey}:receita_arrecadada`,
        sourceId: "tce-sp",
        sourceKey: raw.sourceKey,
        rawRecordId: raw.id,
        civicEventId,
        orgaoEntityId: orgaoId,
        tipo: "receita_arrecadada",
        valor: String(r.valorArrecadado),
        dataCompetencia,
        dataMovimento: dataCompetencia,
        exercicio: r.exercicio ?? null,
        municipioIbge: AMERICANA.ibge,
        uf: AMERICANA.uf,
        descricao: r.especie || r.categoria || `Receita ${raw.sourceKey}`,
        sourceUrl: raw.sourceUrl,
        publishedAt: raw.publishedAt,
        fetchedAt: raw.fetchedAt,
        trustType: "fato_oficial",
      });
    }
    receitas++;
    if ((index + 1) % 1000 === 0) {
      console.log(`[map:tce] ${index + 1}/${receitasRaw.length} receitas processadas`);
    }
  }

  console.log(`[map:tce] ${n} despesas + ${receitas} receitas mapeadas para eventos/evidências/fluxos canônicos`);
}

if (process.argv[1]?.endsWith("tce-sp.ts") || process.argv[1]?.endsWith("tce-sp.js")) {
  mapearTceSp()
    .catch((e) => {
      console.error(e);
      process.exitCode = 1;
    })
    .finally(() => closeDb());
}
