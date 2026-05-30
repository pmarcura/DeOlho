/**
 * Adapter Câmara Municipal de Americana
 *
 * Americana usa o sistema Sapl (Software de Apoio ao Processo Legislativo)
 * ou portal próprio. Verificar se há API antes de usar Crawlee.
 *
 * Portal provável: https://www.camara-americana.sp.gov.br/
 *
 * Este adapter usa Crawlee CheerioCrawler para HTML estático.
 * Se o portal usar JavaScript, trocar por PlaywrightCrawler.
 */

import { CheerioCrawler } from "crawlee";
import { salvar, salvarLatest } from "../utils/save.js";
import { AMERICANA } from "../config.js";
import { recordSourceCoverage } from "../utils/civic.js";
import { closeDb } from "../utils/ingest.js";
import type { ResultadoColeta } from "../types.js";

interface SessaoLegislativa {
  titulo: string;
  data: string;
  tipo: string;
  url: string;
}

const BASE_URL = "https://www.camara-americana.sp.gov.br";

export async function coletarCamaraAmericana(): Promise<void> {
  console.log(`[camara-americana] Crawling ${BASE_URL}`);

  const erros: string[] = [];
  const sessoes: SessaoLegislativa[] = [];

  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: 50,
    async requestHandler({ $, request, enqueueLinks }) {
      console.log(`[camara-americana] ${request.url}`);

      // Heurística genérica: coletar links e títulos de sessões
      // Ajustar seletores após inspecionar o HTML real do portal
      $("a[href*='sessao'], a[href*='sessoes'], a[href*='legislativa']").each((_, el) => {
        const href = $(el).attr("href");
        const texto = $(el).text().trim();
        if (!href || !texto) return;

        const url = href.startsWith("http") ? href : `${BASE_URL}${href}`;
        sessoes.push({
          titulo: texto,
          data: "",
          tipo: "sessao",
          url,
        });
      });

      // Seguir paginação se houver
      await enqueueLinks({
        globs: [`${BASE_URL}/sessoes*`, `${BASE_URL}/legislativa*`],
      });
    },
    failedRequestHandler({ request, error }) {
      const msg = error instanceof Error ? error.message : String(error);
      erros.push(`${request.url}: ${msg}`);
    },
  });

  await crawler.run([{ url: `${BASE_URL}/sessoes` }]);

  const resultado: ResultadoColeta<SessaoLegislativa> = {
    fonte: "camara-americana",
    coletadoEm: new Date().toISOString(),
    municipio: AMERICANA.nome,
    ibge: AMERICANA.ibge,
    totalRegistros: sessoes.length,
    dados: sessoes,
    erros,
  };

  const arq = await salvar(resultado);
  await salvarLatest(resultado);
  console.log(`[camara-americana] ${sessoes.length} itens salvos em ${arq}`);

  const tentativa = new Date();
  await recordSourceCoverage({
    sourceId: "camara-americana",
    collector: "camara-americana",
    territoryIbge: AMERICANA.ibge,
    uf: AMERICANA.uf,
    recordType: "atividade-legislativa",
    status: erros.length > 0 ? "partial" : sessoes.length > 0 ? "fresh" : "no_data",
    lastAttemptAt: tentativa,
    lastSuccessAt: erros.length > 0 && sessoes.length === 0 ? null : tentativa,
    totalRecords: sessoes.length,
    errorMessage: erros.join(" | ") || null,
    limitations:
      "Coleta HTML inicial com seletores genéricos; projetos, indicações e votações precisam de mapeamento dedicado do portal legislativo.",
    metadata: { baseUrl: BASE_URL },
  });
}

if (
  process.argv[1]?.endsWith("camara-americana.ts") ||
  process.argv[1]?.endsWith("camara-americana.js")
) {
  coletarCamaraAmericana()
    .catch(console.error)
    .finally(() => closeDb());
}
