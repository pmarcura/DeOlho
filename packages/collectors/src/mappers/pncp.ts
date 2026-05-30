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
import { closeDb, getDb } from "../utils/ingest.js";
import { upsertEntity, addEntityReference } from "../reconcile/entities.js";
import { AMERICANA } from "../config.js";
import { rawRecords, contracts, contractEvents } from "@deolho/db";
import type { PncpCompra, PncpContrato } from "../types.js";
import {
  upsertCivicEvent,
  upsertEntityRelationship,
  upsertEvidence,
  upsertMoneyFlow,
} from "../utils/civic.js";

const ORGAO_NOME = "Município de Americana";

function dataIso(s: string | null | undefined): string | null {
  return s ? s.slice(0, 10) : null;
}

function valorContrato(c: PncpContrato): number {
  return c.valorGlobal || c.valorInicial || 0;
}

function numeroContrato(c: PncpContrato): string | null {
  return c.numeroContrato ?? c.numeroContratoEmpenho ?? c.numeroControlePNCP ?? null;
}

function fornecedorDocumento(c: PncpContrato): string | null {
  return c.fornecedor?.cnpjCpf ?? c.niFornecedor ?? null;
}

function fornecedorNome(c: PncpContrato): string | null {
  return c.fornecedor?.nomeRazaoSocial ?? c.nomeRazaoSocialFornecedor ?? null;
}

function contratoSourceUrl(c: PncpContrato): string | null {
  const controle = c.numeroControlePNCP?.match(/^(\d+)-2-(\d+)\/(\d{4})$/);
  if (controle) {
    const [, cnpj, sequencial, ano] = controle;
    return `https://pncp.gov.br/app/contratos/${cnpj}/${ano}/${sequencial}`;
  }

  if (c.anoContrato && c.sequencialContrato) {
    return `https://pncp.gov.br/app/contratos/${AMERICANA.cnpj}/${c.anoContrato}/${c.sequencialContrato}`;
  }

  return null;
}

function contratoNumeroControleSeguro(c: PncpContrato): string | null {
  return c.numeroControlePNCP
    ? c.numeroControlePNCP.replace(/[^A-Za-z0-9.-]/g, "-")
    : null;
}

function contratoSourceKey(c: PncpContrato): string {
  const numeroControle = contratoNumeroControleSeguro(c);
  if (numeroControle) return `contrato-${numeroControle}`;

  const numero = c.numeroContrato ?? c.numeroContratoEmpenho ?? "sem-numero";
  return `contrato-${c.anoContrato}-${numero}-${c.sequencialContrato}`;
}

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

  const comprasRaw = await db
    .select()
    .from(rawRecords)
    .where(and(eq(rawRecords.sourceId, "pncp"), eq(rawRecords.recordType, "compra")));
  console.log(`[map:pncp] ${comprasRaw.length} licitações cruas a mapear`);

  let comprasMapeadas = 0;
  for (const raw of comprasRaw) {
    const compra = raw.payload as PncpCompra;
    const orgaoNome = compra.orgaoEntidade?.razaoSocial || ORGAO_NOME;
    const orgaoDoc = compra.orgaoEntidade?.cnpj || AMERICANA.cnpj;
    const orgaoId = await upsertEntity(db, {
      kind: "orgao",
      nome: orgaoNome,
      documento: orgaoDoc,
    });
    await addEntityReference(db, {
      entityId: orgaoId,
      sourceId: "pncp",
      sourceKey: raw.sourceKey,
      rawNome: orgaoNome,
      rawDocumento: orgaoDoc,
    });

    const valorEstimado = compra.valorTotalEstimado || 0;
    const civicEventId = await upsertCivicEvent(db, {
      sourceId: "pncp",
      sourceKey: raw.sourceKey,
      rawRecordId: raw.id,
      tipo: "licitacao_publicada",
      categoria: "contratacao",
      titulo: compra.numeroCompra
        ? `Licitação ${compra.numeroCompra}/${compra.anoCompra} publicada no PNCP`
        : "Licitação publicada no PNCP",
      resumo: compra.objetoCompra || null,
      dataEvento: dataIso(compra.dataPublicacaoPncp),
      valor: valorEstimado > 0 ? String(valorEstimado) : null,
      municipioIbge: AMERICANA.ibge,
      uf: AMERICANA.uf,
      territorio: { municipio: AMERICANA.nome, ibge: AMERICANA.ibge, uf: AMERICANA.uf },
      entidades: {
        orgaoEntityId: orgaoId,
        modalidade: compra.modalidadeNome,
        situacao: compra.situacaoCompraNome,
      },
      limitacoes: compra.valorTotalHomologado == null
        ? [{ campo: "valorTotalHomologado", mensagem: "A fonte ainda não informa valor homologado para esta licitação." }]
        : null,
      sourceUrl: raw.sourceUrl,
      publishedAt: raw.publishedAt,
      fetchedAt: raw.fetchedAt,
      trustType: "fato_oficial",
    });

    await upsertEvidence(db, {
      evidenceKey: `pncp:${raw.sourceKey}:compra`,
      civicEventId,
      rawRecordId: raw.id,
      sourceId: "pncp",
      sourceKey: raw.sourceKey,
      fieldPath: "$",
      titulo: "Registro oficial da licitação no PNCP",
      sourceUrl: raw.sourceUrl,
      trecho: compra.objetoCompra ?? null,
      metodoExtracao: "api-pncp",
      publishedAt: raw.publishedAt,
      fetchedAt: raw.fetchedAt,
      trustType: "fato_oficial",
    });

    if (valorEstimado > 0) {
      await upsertMoneyFlow(db, {
        flowKey: `pncp:${raw.sourceKey}:previsto`,
        sourceId: "pncp",
        sourceKey: raw.sourceKey,
        rawRecordId: raw.id,
        civicEventId,
        orgaoEntityId: orgaoId,
        tipo: "previsto",
        valor: String(valorEstimado),
        dataCompetencia: dataIso(compra.dataPublicacaoPncp),
        dataMovimento: dataIso(compra.dataPublicacaoPncp),
        exercicio: compra.anoCompra ?? null,
        municipioIbge: AMERICANA.ibge,
        uf: AMERICANA.uf,
        descricao: compra.objetoCompra || `Licitação ${compra.numeroCompra ?? raw.sourceKey}`,
        sourceUrl: raw.sourceUrl,
        publishedAt: raw.publishedAt,
        fetchedAt: raw.fetchedAt,
        trustType: "fato_oficial",
      });
    }
    comprasMapeadas++;
  }

  let n = 0;
  for (const raw of raws) {
    const c = raw.payload as PncpContrato;
    const fornecedorDoc = fornecedorDocumento(c);
    const fornecedorRazaoSocial = fornecedorNome(c);
    const contratoNumero = numeroContrato(c);
    const sourceKey = contratoSourceKey(c);
    const sourceUrl = raw.sourceUrl ?? contratoSourceUrl(c);

    // Órgão — coletamos contratos de Americana, logo o órgão é a Prefeitura.
    const orgaoId = await upsertEntity(db, {
      kind: "orgao",
      nome: ORGAO_NOME,
      documento: AMERICANA.cnpj,
    });
    await addEntityReference(db, {
      entityId: orgaoId,
      sourceId: "pncp",
      sourceKey,
      rawNome: ORGAO_NOME,
      rawDocumento: AMERICANA.cnpj,
    });

    // Fornecedor — a ponta que cruza com pagamentos (TCE) e sanções (CEIS).
    let fornecedorId: string | null = null;
    if (fornecedorDoc || fornecedorRazaoSocial) {
      fornecedorId = await upsertEntity(db, {
        kind: "empresa",
        nome: fornecedorRazaoSocial ?? fornecedorDoc ?? "Fornecedor PNCP sem nome",
        documento: fornecedorDoc,
      });
      await addEntityReference(db, {
        entityId: fornecedorId,
        sourceId: "pncp",
        sourceKey,
        rawNome: fornecedorRazaoSocial ?? fornecedorDoc ?? "Fornecedor PNCP sem nome",
        rawDocumento: fornecedorDoc,
      });
    }

    const valores = {
      sourceId: "pncp",
      sourceKey,
      rawRecordId: raw.id,
      numero: contratoNumero,
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
      sourceUrl,
      publishedAt: raw.publishedAt,
      fetchedAt: raw.fetchedAt,
    };

    const existing = await db
      .select({ id: contracts.id })
      .from(contracts)
      .where(and(eq(contracts.sourceId, "pncp"), eq(contracts.sourceKey, sourceKey)))
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
          descricao: `Assinatura do contrato ${contratoNumero ?? ""}`.trim(),
          rawRecordId: raw.id,
          sourceUrl,
        });
      }
    }

    const valor = valorContrato(c);
    const titulo = contratoNumero
      ? `Contrato ${contratoNumero}/${c.anoContrato ?? ""} publicado no PNCP`
      : "Contrato publicado no PNCP";
    const resumo = [
      c.objetoContrato,
      fornecedorRazaoSocial ? `Fornecedor: ${fornecedorRazaoSocial}.` : null,
      valor > 0 ? `Valor registrado: R$ ${valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}.` : null,
    ].filter(Boolean).join(" ");

    const civicEventId = await upsertCivicEvent(db, {
      sourceId: "pncp",
      sourceKey,
      rawRecordId: raw.id,
      tipo: "contrato_publicado",
      categoria: "contratacao",
      titulo,
      resumo: resumo || c.objetoContrato || null,
      dataEvento: dataIso(c.dataAssinatura),
      valor: valor > 0 ? String(valor) : null,
      municipioIbge: AMERICANA.ibge,
      uf: AMERICANA.uf,
      territorio: { municipio: AMERICANA.nome, ibge: AMERICANA.ibge, uf: AMERICANA.uf },
      entidades: {
        orgaoEntityId: orgaoId,
        fornecedorEntityId: fornecedorId,
        fornecedorDocumento: fornecedorDoc,
      },
      limitacoes: fornecedorId
        ? null
        : [{ campo: "fornecedor", mensagem: "A fonte não informou fornecedor com CNPJ neste registro." }],
      sourceUrl,
      publishedAt: raw.publishedAt,
      fetchedAt: raw.fetchedAt,
      trustType: "fato_oficial",
    });

    await upsertEvidence(db, {
      evidenceKey: `pncp:${sourceKey}:contrato`,
      civicEventId,
      rawRecordId: raw.id,
      sourceId: "pncp",
      sourceKey,
      fieldPath: "$",
      titulo: "Registro oficial do contrato no PNCP",
      sourceUrl,
      trecho: c.objetoContrato ?? null,
      metodoExtracao: "api-pncp",
      publishedAt: raw.publishedAt,
      fetchedAt: raw.fetchedAt,
      trustType: "fato_oficial",
    });

    if (valor > 0) {
      await upsertMoneyFlow(db, {
        flowKey: `pncp:${sourceKey}:contratado`,
        sourceId: "pncp",
        sourceKey,
        rawRecordId: raw.id,
        civicEventId,
        contractId,
        orgaoEntityId: orgaoId,
        counterpartyEntityId: fornecedorId,
        tipo: "contratado",
        valor: String(valor),
        dataCompetencia: dataIso(c.dataAssinatura),
        dataMovimento: dataIso(c.dataAssinatura),
        exercicio: c.anoContrato ?? null,
        municipioIbge: AMERICANA.ibge,
        uf: AMERICANA.uf,
        descricao: c.objetoContrato || `Contrato ${contratoNumero ?? sourceKey}`,
        sourceUrl,
        publishedAt: raw.publishedAt,
        fetchedAt: raw.fetchedAt,
        trustType: "fato_oficial",
      });
    }

    if (fornecedorId) {
      await upsertEntityRelationship(db, {
        relationshipKey: `pncp:${sourceKey}:orgao-fornecedor`,
        fromEntityId: orgaoId,
        toEntityId: fornecedorId,
        tipo: "fornecedor",
        sourceId: "pncp",
        sourceKey,
        rawRecordId: raw.id,
        civicEventId,
        descricao: `Fornecedor vinculado ao contrato ${contratoNumero ?? sourceKey}.`,
        confianca: "1.000",
        dataInicio: dataIso(c.dataAssinatura),
        metadata: { numeroContrato: contratoNumero, anoContrato: c.anoContrato },
        trustType: "fato_oficial",
      });
    }
    n++;
  }
  console.log(`[map:pncp] ${comprasMapeadas} licitações + ${n} contratos mapeados para a camada canônica`);
}

if (process.argv[1]?.endsWith("pncp.ts") || process.argv[1]?.endsWith("pncp.js")) {
  mapearPncp()
    .catch((e) => {
      console.error(e);
      process.exitCode = 1;
    })
    .finally(() => closeDb());
}
