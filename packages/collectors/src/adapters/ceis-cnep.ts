/**
 * Adapter CEIS/CNEP (CGU) — sanções a empresas.
 *
 * CEIS = empresas inidôneas/suspensas de licitar; CNEP = punidas pela Lei
 * Anticorrupção. É o RED-FLAG mais forte do eixo do dinheiro: fornecedor
 * sancionado com contrato/pagamento ativo no município.
 *
 * Requer chave gratuita da CGU em PORTAL_TRANSPARENCIA_API_KEY
 * (https://portaldatransparencia.gov.br/api-de-dados/cadastrar-email).
 *
 * Estratégia: varre o cadastro e guarda apenas sanções de fornecedores que JÁ
 * conhecemos (CNPJ em entities.kind=empresa) — o cruzamento que interessa, sem
 * inchar o banco com sanções de empresas sem relação com Americana. O payload
 * cru é sempre preservado (raw_records), então um mapeamento de campo impreciso
 * é recuperável sem refetch (princípio L0).
 *
 * Uso: PORTAL_TRANSPARENCIA_API_KEY=... pnpm --filter @deolho/collectors collect:ceis [cnep]
 */
import "dotenv/config";
import { and, eq } from "drizzle-orm";
import { closeDb, getDb, ingestRaw } from "../utils/ingest.js";
import { AMERICANA, CGU_API_BASE } from "../config.js";
import { normalizarDocumento } from "../utils/documento.js";
import { sleep } from "../utils/http.js";
import { entities, sanctions, type DB } from "@deolho/db";
import { recordSourceCoverage, upsertCivicEvent, upsertEvidence } from "../utils/civic.js";

const KEY = process.env.PORTAL_TRANSPARENCIA_API_KEY;

// Shape REAL da API CGU CEIS (verificado ao vivo 2026-05-25): os campos de
// sanção ficam no TOPO do item, não aninhados em `sancao`. `pessoa` traz
// cnpjFormatado (PJ) ou cpfFormatado (PF). `orgaoSancionador` e `fonteSancao`
// coexistem (órgão original vs publicador). CEIS e CNEP usam o mesmo shape.
interface CeisItem {
  pessoa?: {
    cnpjFormatado?: string;
    cpfFormatado?: string;
    nome?: string;
    razaoSocialReceita?: string;
    tipo?: string; // 'Pessoa Jurídica' | 'Pessoa Física'
  };
  tipoSancao?: { descricaoResumida?: string };
  orgaoSancionador?: { nome?: string };
  fonteSancao?: { nomeExibicao?: string };
  dataInicioSancao?: string;
  dataFimSancao?: string;
  textoPublicacao?: string;
  linkPublicacao?: string;
}

async function fetchPagina(cadastro: "ceis" | "cnep", pagina: number): Promise<unknown[]> {
  const res = await fetch(`${CGU_API_BASE}/${cadastro}?pagina=${pagina}`, {
    headers: { "chave-api-dados": KEY ?? "", Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${cadastro} pág ${pagina}`);
  const body = (await res.json()) as unknown;
  return Array.isArray(body) ? body : [];
}

function isoData(br?: string): string | null {
  if (!br) return null;
  const m = br.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return br.length >= 10 ? br.slice(0, 10) : null;
}

function sancaoKey(cadastro: "ceis" | "cnep", doc: string, it: CeisItem): string {
  const tipo = it.tipoSancao?.descricaoResumida ?? "sem-tipo";
  const inicio = isoData(it.dataInicioSancao) ?? "sem-inicio";
  const orgao = it.orgaoSancionador?.nome ?? it.fonteSancao?.nomeExibicao ?? "sem-orgao";
  return `${cadastro}-${doc}-${inicio}-${tipo}-${orgao}`.replace(/\s+/g, "-").toLowerCase();
}

export async function coletarSancoes(
  cadastro: "ceis" | "cnep" = "ceis",
  maxPaginas = 300,
): Promise<void> {
  const db = getDb();
  if (!db) {
    console.error("[ceis-cnep] DATABASE_URL não definida.");
    return;
  }
  if (!KEY) {
    console.error(
      "[ceis-cnep] defina PORTAL_TRANSPARENCIA_API_KEY (chave gratuita: " +
        "https://portaldatransparencia.gov.br/api-de-dados/cadastrar-email).",
    );
    await recordSourceCoverage({
      sourceId: "cgu-transparencia",
      collector: `cgu-${cadastro}`,
      territoryIbge: AMERICANA.ibge,
      uf: AMERICANA.uf,
      recordType: cadastro,
      status: "unavailable",
      lastAttemptAt: new Date(),
      lastSuccessAt: null,
      totalRecords: 0,
      errorMessage: "PORTAL_TRANSPARENCIA_API_KEY ausente",
      limitations: "A API da CGU exige chave gratuita; sem chave, CEIS/CNEP não são consultados.",
      metadata: { cadastro },
    });
    return;
  }

  const empresas = await db
    .select({ documento: entities.documento })
    .from(entities)
    .where(eq(entities.kind, "empresa"));
  const conhecidos = new Set(
    empresas.map((e) => normalizarDocumento(e.documento)).filter((d): d is string => Boolean(d)),
  );
  console.log(
    `[ceis-cnep] ${conhecidos.size} fornecedores conhecidos; varrendo ${cadastro.toUpperCase()}`,
  );
  if (conhecidos.size === 0) {
    console.warn("[ceis-cnep] nenhum fornecedor no banco — rode collect:pncp + map:pncp antes.");
    await recordSourceCoverage({
      sourceId: "cgu-transparencia",
      collector: `cgu-${cadastro}`,
      territoryIbge: AMERICANA.ibge,
      uf: AMERICANA.uf,
      recordType: cadastro,
      status: "pending",
      lastAttemptAt: new Date(),
      lastSuccessAt: null,
      totalRecords: 0,
      errorMessage: null,
      limitations: "A coleta de sanções depende de fornecedores conhecidos no banco.",
      metadata: { cadastro, fornecedoresConhecidos: 0 },
    });
    return;
  }

  let varridas = 0;
  let casadas = 0;
  let erroFinal: string | null = null;
  for (let p = 1; p <= maxPaginas; p++) {
    let itens: unknown[];
    try {
      itens = await fetchPagina(cadastro, p);
    } catch (e) {
      erroFinal = e instanceof Error ? e.message : String(e);
      console.warn(`[ceis-cnep] ${erroFinal}`);
      break;
    }
    if (itens.length === 0) break;
    for (const item of itens) {
      varridas++;
      const it = item as CeisItem;
      const doc = normalizarDocumento(it.pessoa?.cnpjFormatado ?? it.pessoa?.cpfFormatado ?? null);
      if (!doc || !conhecidos.has(doc)) continue;
      casadas++;
      await ingestRaw(db, {
        sourceId: "cgu-transparencia",
        sourceKey: `${cadastro}-${doc}-${p}`,
        recordType: cadastro,
        payload: item,
        sourceUrl: `${CGU_API_BASE}/${cadastro}?pagina=${p}`,
      });
      await gravarSancao(db, cadastro, doc, it);
    }
    await sleep(800); // respeita o rate limit da CGU (~90/min)
  }
  console.log(
    `[ceis-cnep] ${cadastro.toUpperCase()}: ${casadas} sanções de fornecedores conhecidos (de ${varridas} varridas)`,
  );
  const tentativa = new Date();
  const execucaoLimitada = maxPaginas < 300;
  await recordSourceCoverage({
    sourceId: "cgu-transparencia",
    collector: `cgu-${cadastro}`,
    territoryIbge: AMERICANA.ibge,
    uf: AMERICANA.uf,
    recordType: cadastro,
    status: erroFinal || execucaoLimitada ? "partial" : casadas > 0 ? "fresh" : "no_data",
    lastAttemptAt: tentativa,
    lastSuccessAt: erroFinal && casadas === 0 ? null : tentativa,
    totalRecords: casadas,
    errorMessage: erroFinal,
    limitations:
      "A varredura guarda sanções somente de fornecedores já conhecidos em Americana; não é busca nacional completa." +
      (execucaoLimitada ? ` Execução limitada a ${maxPaginas} página(s) nesta rodada.` : ""),
    metadata: { cadastro, varridas, fornecedoresConhecidos: conhecidos.size, maxPaginas },
  });
}

async function gravarSancao(
  db: DB,
  cadastro: "ceis" | "cnep",
  doc: string,
  it: CeisItem,
): Promise<void> {
  const ent = await db
    .select({ id: entities.id })
    .from(entities)
    .where(and(eq(entities.kind, "empresa"), eq(entities.documento, doc)))
    .limit(1);
  const key = sancaoKey(cadastro, doc, it);
  const existente = await db
    .select({ id: sanctions.id })
    .from(sanctions)
    .where(
      and(
        eq(sanctions.sourceId, "cgu-transparencia"),
        eq(sanctions.cadastro, cadastro.toUpperCase()),
        eq(sanctions.documento, doc),
        eq(sanctions.tipoSancao, it.tipoSancao?.descricaoResumida ?? ""),
      ),
    )
    .limit(1);
  if (!existente[0]) {
  await db.insert(sanctions).values({
    entityId: ent[0]?.id ?? null,
    sourceId: "cgu-transparencia",
    cadastro: cadastro.toUpperCase(),
    documento: doc,
    nomeSancionado: it.pessoa?.nome ?? it.pessoa?.razaoSocialReceita ?? null,
    tipoSancao: it.tipoSancao?.descricaoResumida ?? null,
    orgaoSancionador: it.orgaoSancionador?.nome ?? it.fonteSancao?.nomeExibicao ?? null,
    dataInicio: isoData(it.dataInicioSancao),
    dataFim: isoData(it.dataFimSancao),
    fundamentacao: it.textoPublicacao ?? null,
    sourceUrl: it.linkPublicacao ?? `${CGU_API_BASE}/${cadastro}`,
    fetchedAt: new Date(),
  });
  }

  const civicEventId = await upsertCivicEvent(db, {
    sourceId: "cgu-transparencia",
    sourceKey: key,
    tipo: "sancao_registrada",
    categoria: "sancao",
    titulo: `Sanção oficial registrada no ${cadastro.toUpperCase()}`,
    resumo: [
      it.pessoa?.nome ?? it.pessoa?.razaoSocialReceita ?? "Pessoa sancionada",
      it.tipoSancao?.descricaoResumida ? `Tipo: ${it.tipoSancao.descricaoResumida}.` : null,
      "Sinal oficial de sanção; não indica irregularidade nova no município por si só.",
    ].filter(Boolean).join(" "),
    dataEvento: isoData(it.dataInicioSancao),
    municipioIbge: AMERICANA.ibge,
    uf: AMERICANA.uf,
    territorio: { municipio: AMERICANA.nome, ibge: AMERICANA.ibge, uf: AMERICANA.uf },
    entidades: { entityId: ent[0]?.id ?? null, documento: doc },
    limitacoes: [
      {
        campo: "escopo",
        mensagem:
          "A sanção é fato oficial da CGU; o vínculo com Americana só existe quando a empresa também aparece como fornecedor conhecido.",
      },
    ],
    sourceUrl: it.linkPublicacao ?? `${CGU_API_BASE}/${cadastro}`,
    fetchedAt: new Date(),
    trustType: "fato_oficial",
  });
  await upsertEvidence(db, {
    evidenceKey: `cgu:${key}:sancao`,
    civicEventId,
    sourceId: "cgu-transparencia",
    sourceKey: key,
    fieldPath: "$",
    titulo: `Registro oficial ${cadastro.toUpperCase()} da CGU`,
    sourceUrl: it.linkPublicacao ?? `${CGU_API_BASE}/${cadastro}`,
    trecho: it.textoPublicacao ?? it.tipoSancao?.descricaoResumida ?? null,
    metodoExtracao: "api-cgu",
    fetchedAt: new Date(),
    trustType: "fato_oficial",
  });
}

if (process.argv[1]?.endsWith("ceis-cnep.ts") || process.argv[1]?.endsWith("ceis-cnep.js")) {
  const cad: "ceis" | "cnep" = process.argv[2] === "cnep" ? "cnep" : "ceis";
  const maxArg = process.argv.find((arg) => arg.startsWith("--max-pages="));
  const maxPaginas = maxArg ? Number.parseInt(maxArg.split("=")[1] ?? "", 10) : 300;
  coletarSancoes(cad, Number.isFinite(maxPaginas) && maxPaginas > 0 ? maxPaginas : 300)
    .catch((e) => {
      console.error(e);
      process.exitCode = 1;
    })
    .finally(() => closeDb());
}
