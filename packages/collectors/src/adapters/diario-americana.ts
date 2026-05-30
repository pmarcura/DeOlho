/**
 * Adapter Diário Oficial de Americana — scrape direto + backfill incremental.
 *
 * O portal (https://diariooficial.americana.sp.gov.br) é HTML server-rendered
 * (ISO-8859-1), não SPA — CheerioCrawler resolve. A página de edições anteriores
 * aceita `?mes=M&ano=AAAA`, então dá pra varrer mês a mês PRA TRÁS e montar o
 * histórico inteiro. Cada edição aponta pra um PDF em
 * https://www.americana.sp.gov.br/download/diarioOficial/<hash>.pdf.
 *
 * Dois modos:
 *  - incremental (default): mês corrente + anterior + extras recentes. Barato,
 *    pra rodar todo dia. "Aconteceu na prefeitura → aparece aqui."
 *  - backfill (`--backfill`): caminha pra trás até `MESES_VAZIOS_LIMITE` meses
 *    consecutivos sem NENHUMA edição nova (portal esgotado), com teto de segurança.
 *
 * As edições são ACUMULADAS num master `data/diario-americana/edicoes.json`
 * (merge por URL do PDF) — nunca sobrescreve histórico. `latest.json` segue como
 * snapshot da última rodada.
 */
import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CheerioCrawler } from "crawlee";
import { and, eq } from "drizzle-orm";
import { closeDb, getDb, ingestRaw } from "../utils/ingest.js";
import { recordSourceCoverage } from "../utils/civic.js";
import { salvar, salvarLatest } from "../utils/save.js";
import { AMERICANA } from "../config.js";
import { gazettes, type DB } from "@deolho/db";
import type { ResultadoColeta } from "../types.js";

const SITE = "https://diariooficial.americana.sp.gov.br";
const PDF_HOST = "https://www.americana.sp.gov.br";

// Backfill para após N meses consecutivos sem edição nova; teto duro de segurança.
const MESES_VAZIOS_LIMITE = 8;
const MESES_MAX = 360; // 30 anos — só evita loop infinito se o portal repetir página

const MASTER_PATH = path.resolve(
  fileURLToPath(new URL("../../data/diario-americana/edicoes.json", import.meta.url)),
);

interface EdicaoDiario {
  date: string | null; // ISO YYYY-MM-DD
  url: string; // PDF
  edition: string | null;
  isExtra: boolean;
}

export interface ColetaOpts {
  backfill?: boolean;
  mesesIncremental?: number; // quantos meses pra trás no modo incremental (default 2)
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function brParaIso(texto: string): string | null {
  const m = texto.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}

/** Reconstrói a data quando a célula do calendário traz só o dia. */
function isoDeDiaMesAno(diaTexto: string, mes: number, ano: number): string | null {
  const m = diaTexto.match(/\b([0-3]?\d)\b/);
  if (!m) return null;
  const dia = Number(m[1]);
  if (dia < 1 || dia > 31) return null;
  return `${ano}-${pad2(mes)}-${pad2(dia)}`;
}

function urlAbsolutaPdf(href: string): string {
  if (/^https?:\/\//i.test(href)) return href;
  return `${PDF_HOST}/${href.replace(/^\/+/, "")}`;
}

function urlMes(php: string, mes: number, ano: number): string {
  return `${SITE}/${php}?mes=${mes}&ano=${ano}`;
}

function mesAnterior(mes: number, ano: number): { mes: number; ano: number } {
  return mes <= 1 ? { mes: 12, ano: ano - 1 } : { mes: mes - 1, ano };
}

async function lerMaster(): Promise<EdicaoDiario[]> {
  try {
    const raw = await fs.readFile(MASTER_PATH, "utf8");
    const parsed = JSON.parse(raw) as { dados?: EdicaoDiario[] };
    return Array.isArray(parsed.dados) ? parsed.dados : [];
  } catch {
    return [];
  }
}

async function escreverMaster(dados: EdicaoDiario[]): Promise<void> {
  await fs.mkdir(path.dirname(MASTER_PATH), { recursive: true });
  const payload = {
    fonte: "diario-americana",
    atualizadoEm: new Date().toISOString(),
    municipio: AMERICANA.nome,
    ibge: AMERICANA.ibge,
    total: dados.length,
    dados,
  };
  await fs.writeFile(MASTER_PATH, JSON.stringify(payload, null, 2), "utf8");
}

export async function coletarDiarioAmericana(opts: ColetaOpts = {}): Promise<void> {
  const backfill = opts.backfill ?? false;
  const mesesIncremental = opts.mesesIncremental ?? 2;
  console.log(`[diario-americana] modo=${backfill ? "BACKFILL" : "incremental"} — ${SITE}`);

  // Master existente seedа o dedup global (re-backfill fica barato: para cedo).
  const master = await lerMaster();
  const vistas = new Set<string>(master.map((e) => e.url));
  const novas: EdicaoDiario[] = [];
  const erros: string[] = [];

  const hoje = new Date();
  let consecutivosVazios = 0;
  let mesesVisitados = 0;

  const crawler = new CheerioCrawler({
    maxConcurrency: backfill ? 1 : 3, // sequencial no backfill (stop condition correta)
    maxRequestsPerCrawl: backfill ? MESES_MAX * 2 + 10 : 30,
    requestHandlerTimeoutSecs: 60,
    async requestHandler({ $, request, addRequests }) {
      const ud = request.userData as { extra?: boolean; mes?: number; ano?: number; walk?: boolean };
      const isExtra = Boolean(ud.extra);
      let novasNaPagina = 0;

      $('a[href*="download/diarioOficial"]').each((_, el) => {
        const href = $(el).attr("href");
        if (!href || !/\.pdf(\?|$)/i.test(href)) return;
        const url = urlAbsolutaPdf(href);
        if (vistas.has(url)) return;
        const container = $(el).closest("li, tr, td, div, article").first();
        const texto = (container.text() || $(el).text() || "").trim();
        const date =
          brParaIso(texto) ??
          (ud.mes && ud.ano ? isoDeDiaMesAno(texto, ud.mes, ud.ano) : null);
        vistas.add(url);
        novas.push({ date, url, edition: null, isExtra });
        novasNaPagina++;
      });

      if (backfill && ud.walk && ud.mes && ud.ano) {
        // "Vazio" = nenhuma edição NOVA nesta página (cobre mês sem publicação E
        // página repetida do portal). Para após N consecutivos.
        if (novasNaPagina === 0) consecutivosVazios++;
        else consecutivosVazios = 0;
        mesesVisitados++;
        if (consecutivosVazios < MESES_VAZIOS_LIMITE && mesesVisitados < MESES_MAX) {
          const prev = mesAnterior(ud.mes, ud.ano);
          await addRequests([
            { url: urlMes("diario-oficial-edicaoAnterior.php", prev.mes, prev.ano), userData: { mes: prev.mes, ano: prev.ano, walk: true } },
          ]);
        } else {
          console.log(`[diario-americana] backfill parou em ${pad2(ud.mes)}/${ud.ano} (${consecutivosVazios} meses vazios seguidos)`);
        }
      }
    },
    failedRequestHandler({ request, error }) {
      const msg = error instanceof Error ? error.message : String(error);
      erros.push(`${request.url}: ${msg}`);
    },
  });

  // Sementes.
  const seeds: { url: string; userData: Record<string, unknown> }[] = [];
  const mesAtual = hoje.getMonth() + 1;
  const anoAtual = hoje.getFullYear();

  if (backfill) {
    // Começa no mês corrente e caminha pra trás (anterior + extra).
    seeds.push({ url: urlMes("diario-oficial-edicaoAnterior.php", mesAtual, anoAtual), userData: { mes: mesAtual, ano: anoAtual, walk: true } });
    seeds.push({ url: `${SITE}/diario-oficial-edicaoExtra.php`, userData: { extra: true } });
  } else {
    // Incremental: últimos N meses (anterior) + extras recentes.
    let { mes, ano } = { mes: mesAtual, ano: anoAtual };
    for (let i = 0; i < mesesIncremental; i++) {
      seeds.push({ url: urlMes("diario-oficial-edicaoAnterior.php", mes, ano), userData: { mes, ano } });
      ({ mes, ano } = mesAnterior(mes, ano));
    }
    seeds.push({ url: `${SITE}/diario-oficial-edicaoExtra.php`, userData: { extra: true } });
  }

  await crawler.run(seeds);

  console.log(`[diario-americana] ${novas.length} edições novas (master tinha ${master.length})`);

  // Merge: master antigo + novas (dedup já garantido pelo Set `vistas`).
  const todas = [...master, ...novas];
  await escreverMaster(todas);

  // DB opcional (raw_records + gazettes) — só as novas. Resiliente: se o Postgres
  // estiver fora (ou DATABASE_URL apontar pra um banco indisponível), o JSON segue
  // como fonte da verdade e a coleta NÃO falha. No CI sem DATABASE_URL, getDb()=null.
  const db = getDb();
  if (db && novas.length > 0) {
    try {
      for (const e of novas) {
        const sourceKey = e.url.split("/").pop() ?? e.url;
        await ingestRaw(db, {
          sourceId: "diario-americana",
          sourceKey,
          recordType: "gazeta",
          payload: e,
          sourceUrl: e.url,
          publishedAt: e.date ? new Date(e.date) : null,
        });
        await upsertGazette(db, sourceKey, e);
      }
      console.log(`[diario-americana] ingeridas ${novas.length} edições em raw_records + gazettes`);
    } catch (err) {
      console.warn(`[diario-americana] ingestão no Postgres pulada (${err instanceof Error ? err.message : err}) — JSON segue como fonte da verdade.`);
    }
  }

  // Snapshot JSON (todas, pra compatibilidade com quem lê latest.json).
  const resultado: ResultadoColeta<EdicaoDiario> = {
    fonte: "diario-americana",
    coletadoEm: new Date().toISOString(),
    municipio: AMERICANA.nome,
    ibge: AMERICANA.ibge,
    totalRegistros: todas.length,
    dados: todas,
    erros,
  };
  await salvar(resultado);
  await salvarLatest(resultado);
  console.log(`[diario-americana] master agora com ${todas.length} edições`);

  const tentativa = new Date();
  const datas = todas.map((e) => e.date).filter((d): d is string => Boolean(d)).sort();
  await recordSourceCoverage({
    sourceId: "diario-americana",
    collector: "diario-americana",
    territoryIbge: AMERICANA.ibge,
    uf: AMERICANA.uf,
    recordType: "gazeta",
    status: erros.length > 0 ? "partial" : todas.length > 0 ? "fresh" : "no_data",
    coverageStart: datas[0] ?? null,
    coverageEnd: datas[datas.length - 1] ?? null,
    lastAttemptAt: tentativa,
    lastSuccessAt: erros.length > 0 && novas.length === 0 ? null : tentativa,
    totalRecords: todas.length,
    errorMessage: erros.join(" | ") || null,
    limitations:
      "Cobertura baseada no portal oficial do Diário de Americana; datas ausentes em algumas edições são lacuna da própria página.",
    metadata: { novas: novas.length, backfill, mesesIncremental },
  });
}

async function upsertGazette(db: DB, sourceKey: string, e: EdicaoDiario): Promise<void> {
  const exists = await db
    .select({ id: gazettes.id })
    .from(gazettes)
    .where(and(eq(gazettes.sourceId, "diario-americana"), eq(gazettes.sourceKey, sourceKey)))
    .limit(1);
  if (exists[0]) return;
  await db
    .insert(gazettes)
    .values({
      sourceId: "diario-americana",
      sourceKey,
      territoryIbge: AMERICANA.ibge,
      uf: AMERICANA.uf,
      date: e.date,
      edition: e.edition,
      isExtraEdition: e.isExtra,
      url: e.url,
      sourceUrl: e.url,
      publishedAt: e.date ? new Date(e.date) : null,
      fetchedAt: new Date(),
    })
    .onConflictDoNothing();
}

if (
  process.argv[1]?.endsWith("diario-americana.ts") ||
  process.argv[1]?.endsWith("diario-americana.js")
) {
  const backfill = process.argv.includes("--backfill");
  coletarDiarioAmericana({ backfill })
    .catch((e) => {
      console.error(e);
      process.exitCode = 1;
    })
    .finally(() => closeDb());
}
