/**
 * Adapter Diário Oficial de Americana — scrape direto (o Querido Diário ainda
 * não cobre Americana: availability_date vazio em /cities/3501608).
 *
 * O portal (https://diariooficial.americana.sp.gov.br) é HTML server-rendered
 * (ISO-8859-1), não SPA — CheerioCrawler resolve. As edições ficam em
 * `diario-oficial-edicaoAnterior.php` (e `-edicaoExtra.php`); cada uma aponta
 * para um PDF em https://www.americana.sp.gov.br/download/diarioOficial/<hash>.pdf.
 *
 * Captura a metadata da edição (data + URL do PDF) → raw_records + gazettes.
 * A extração de texto do PDF e as menções (CNPJ/nº de contrato → gazette_mentions)
 * são um passo seguinte (precisa de parser de PDF); o util extrairCnpjs já existe.
 */
import "dotenv/config";
import { CheerioCrawler, RequestQueue } from "crawlee";
import { and, eq } from "drizzle-orm";
import { getDb, ingestRaw } from "../utils/ingest.js";
import { salvar, salvarLatest } from "../utils/save.js";
import { AMERICANA } from "../config.js";
import { gazettes, type DB } from "@deolho/db";
import type { ResultadoColeta } from "../types.js";

const SITE = "https://diariooficial.americana.sp.gov.br";
const PDF_HOST = "https://www.americana.sp.gov.br";

interface EdicaoDiario {
  date: string | null; // ISO YYYY-MM-DD
  url: string; // PDF
  edition: string | null;
  isExtra: boolean;
}

function brParaIso(texto: string): string | null {
  const m = texto.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}

function urlAbsolutaPdf(href: string): string {
  if (/^https?:\/\//i.test(href)) return href;
  return `${PDF_HOST}/${href.replace(/^\/+/, "")}`;
}

export async function coletarDiarioAmericana(): Promise<void> {
  console.log(`[diario-americana] Crawling ${SITE}`);
  const edicoes: EdicaoDiario[] = [];
  const erros: string[] = [];

  const queue = await RequestQueue.open("diario-americana");
  await queue.addRequest({
    url: `${SITE}/diario-oficial-edicaoAnterior.php`,
    userData: { extra: false },
  });
  await queue.addRequest({
    url: `${SITE}/diario-oficial-edicaoExtra.php`,
    userData: { extra: true },
  });

  const crawler = new CheerioCrawler({
    requestQueue: queue,
    maxRequestsPerCrawl: 20,
    async requestHandler({ $, request }) {
      const isExtra = Boolean((request.userData as { extra?: boolean })?.extra);
      $('a[href*="download/diarioOficial"]').each((_, el) => {
        const href = $(el).attr("href");
        if (!href || !/\.pdf(\?|$)/i.test(href)) return;
        const container = $(el).closest("li, tr, div, article").first();
        const texto = (container.text() || $(el).text() || "").trim();
        edicoes.push({
          date: brParaIso(texto),
          url: urlAbsolutaPdf(href),
          edition: null,
          isExtra,
        });
      });
    },
    failedRequestHandler({ request, error }) {
      const msg = error instanceof Error ? error.message : String(error);
      erros.push(`${request.url}: ${msg}`);
    },
  });

  await crawler.run();

  // Dedup por URL do PDF.
  const vistas = new Set<string>();
  const unicas = edicoes.filter((e) => (vistas.has(e.url) ? false : (vistas.add(e.url), true)));
  console.log(`[diario-americana] ${unicas.length} edições encontradas`);

  const db = getDb();
  if (db) {
    for (const e of unicas) {
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
    console.log(`[diario-americana] ingeridas ${unicas.length} edições em raw_records + gazettes`);
  }

  const resultado: ResultadoColeta<EdicaoDiario> = {
    fonte: "diario-americana",
    coletadoEm: new Date().toISOString(),
    municipio: AMERICANA.nome,
    ibge: AMERICANA.ibge,
    totalRegistros: unicas.length,
    dados: unicas,
    erros,
  };
  await salvar(resultado);
  await salvarLatest(resultado);
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
  coletarDiarioAmericana().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
