/**
 * Enriquecimento "envolvidos" — sócios das empresas (QSA da Receita via BrasilAPI).
 *
 * Para cada empresa fornecedora (entities.kind=empresa com CNPJ), busca o quadro
 * societário e grava em `company_partners` (atributo da empresa, documento
 * mascarado). É a base para o sinal "sócio de fornecedor também é agente público
 * / doador" — computado depois, com disclaimer, nunca exposição automática.
 *
 * Uso:
 *   pnpm --filter @deolho/collectors enrich:socios            (varre empresas no banco)
 *   pnpm --filter @deolho/collectors enrich:socios 47960950000121   (teste de 1 CNPJ, sem banco)
 */
import "dotenv/config";
import { and, eq, isNotNull } from "drizzle-orm";
import { get } from "../utils/http.js";
import { closeDb, getDb, ingestRaw } from "../utils/ingest.js";
import { AMERICANA, BRASILAPI_CNPJ_BASE } from "../config.js";
import { normalizarDocumento } from "../utils/documento.js";
import { entities, companyPartners, type DB } from "@deolho/db";
import { recordSourceCoverage } from "../utils/civic.js";

interface BrasilApiSocio {
  nome_socio: string;
  cnpj_cpf_do_socio: string | null;
  qualificacao_socio: string | null;
  faixa_etaria: string | null;
  data_entrada_sociedade: string | null;
}
interface BrasilApiCnpj {
  cnpj: string;
  razao_social?: string;
  nome_fantasia?: string;
  qsa?: BrasilApiSocio[];
}

export async function fetchCnpj(cnpj: string): Promise<BrasilApiCnpj> {
  return get<BrasilApiCnpj>(`${BRASILAPI_CNPJ_BASE}/${cnpj}`, {}, 1200);
}

async function upsertPartner(db: DB, entityId: string, s: BrasilApiSocio): Promise<boolean> {
  const exists = await db
    .select({ id: companyPartners.id })
    .from(companyPartners)
    .where(and(eq(companyPartners.entityId, entityId), eq(companyPartners.nomeSocio, s.nome_socio)))
    .limit(1);
  if (exists[0]) return false;
  await db.insert(companyPartners).values({
    entityId,
    sourceId: "receita-cnpj",
    nomeSocio: s.nome_socio,
    documentoSocio: s.cnpj_cpf_do_socio ?? null,
    qualificacao: s.qualificacao_socio ?? null,
    faixaEtaria: s.faixa_etaria ?? null,
    dataEntrada: s.data_entrada_sociedade ? s.data_entrada_sociedade.slice(0, 10) : null,
  });
  return true;
}

export async function enrichSocios(maxEmpresas = 100): Promise<void> {
  const db = getDb();
  if (!db) {
    console.error("[enrich:socios] DATABASE_URL não definida.");
    return;
  }
  const empresas = await db
    .select({ id: entities.id, nome: entities.nome, documento: entities.documento })
    .from(entities)
    .where(and(eq(entities.kind, "empresa"), isNotNull(entities.documento)))
    .limit(maxEmpresas);
  console.log(`[enrich:socios] ${empresas.length} empresas com CNPJ a enriquecer`);

  let vinculos = 0;
  let erros = 0;
  for (const e of empresas) {
    const doc = normalizarDocumento(e.documento);
    if (!doc || doc.length !== 14) continue; // só CNPJ
    let data: BrasilApiCnpj;
    try {
      data = await fetchCnpj(doc);
    } catch (err) {
      erros++;
      console.warn(`[enrich:socios] ${doc}: ${err instanceof Error ? err.message : String(err)}`);
      continue;
    }
    await ingestRaw(db, {
      sourceId: "receita-cnpj",
      sourceKey: doc,
      recordType: "cnpj",
      payload: data,
      sourceUrl: `${BRASILAPI_CNPJ_BASE}/${doc}`,
    });
    for (const s of data.qsa ?? []) {
      if (await upsertPartner(db, e.id, s)) vinculos++;
    }
  }
  console.log(`[enrich:socios] ${vinculos} vínculos de sócios gravados em company_partners`);
  await recordSourceCoverage({
    sourceId: "receita-cnpj",
    collector: "brasilapi-cnpj-socios",
    territoryIbge: AMERICANA.ibge,
    uf: AMERICANA.uf,
    recordType: "cnpj-qsa",
    status: erros > 0 && vinculos === 0 ? "partial" : empresas.length > 0 ? "fresh" : "pending",
    lastAttemptAt: new Date(),
    lastSuccessAt: empresas.length > 0 && erros < empresas.length ? new Date() : null,
    totalRecords: vinculos,
    errorMessage: erros > 0 ? `${erros} CNPJs falharam no enriquecimento` : null,
    limitations:
      "QSA é guardado como atributo da empresa; só vira vínculo público quando houver entidade pública documentada e regra explícita.",
    metadata: { empresasConsultadas: empresas.length, erros },
  });
}

if (
  process.argv[1]?.endsWith("cnpj-socios.ts") ||
  process.argv[1]?.endsWith("cnpj-socios.js")
) {
  const arg = process.argv[2];
  const docArg = arg ? normalizarDocumento(arg) : null;
  if (docArg && docArg.length === 14) {
    // Teste: 1 CNPJ, imprime o QSA (não precisa de banco).
    fetchCnpj(docArg)
      .then((d) => {
        console.log(`razao_social: ${d.razao_social ?? "?"}`);
        console.log(`sócios (${d.qsa?.length ?? 0}):`);
        for (const s of d.qsa ?? []) {
          console.log(`  - ${s.nome_socio} (${s.cnpj_cpf_do_socio ?? "?"}) — ${s.qualificacao_socio ?? "?"}`);
        }
      })
      .catch((e) => {
        console.error(e);
        process.exit(1);
      });
  } else {
    enrichSocios()
      .catch((e) => {
        console.error(e);
        process.exitCode = 1;
      })
      .finally(() => closeDb());
  }
}
