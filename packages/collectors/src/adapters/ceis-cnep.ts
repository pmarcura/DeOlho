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
import { getDb, ingestRaw } from "../utils/ingest.js";
import { CGU_API_BASE } from "../config.js";
import { normalizarDocumento } from "../utils/documento.js";
import { sleep } from "../utils/http.js";
import { entities, sanctions, type DB } from "@deolho/db";

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
    return;
  }

  let varridas = 0;
  let casadas = 0;
  for (let p = 1; p <= maxPaginas; p++) {
    let itens: unknown[];
    try {
      itens = await fetchPagina(cadastro, p);
    } catch (e) {
      console.warn(`[ceis-cnep] ${e instanceof Error ? e.message : String(e)}`);
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

if (process.argv[1]?.endsWith("ceis-cnep.ts") || process.argv[1]?.endsWith("ceis-cnep.js")) {
  const cad: "ceis" | "cnep" = process.argv[2] === "cnep" ? "cnep" : "ceis";
  coletarSancoes(cad).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
