/**
 * Adapter PNCP — Portal Nacional de Contratações Públicas
 *
 * API de consulta pública (sem autenticação):
 *   https://pncp.gov.br/api/consulta/v1/
 *
 * Swagger: https://pncp.gov.br/api/consulta/swagger-ui/index.html
 *
 * Endpoints usados:
 *   GET /contratacoes/publicacao         — compras/licitações por período e município
 *   GET /contratos                        — contratos por período e município
 */

import { get, sleep } from "../utils/http.js";
import { salvar, salvarLatest } from "../utils/save.js";
import { closeDb, getDb, ingestRaw } from "../utils/ingest.js";
import { recordSourceCoverage } from "../utils/civic.js";
import {
  AMERICANA,
  DATA_FINAL,
  DATA_INICIAL,
  PNCP_BASE,
} from "../config.js";
import type { PncpCompra, PncpContrato, ResultadoColeta } from "../types.js";

interface PncpPage<T> {
  data: T[];
  totalRegistros: number;
  totalPaginas: number;
  numeroPagina: number;
  tamanhoPagina: number;
}

function dataCompactaParaIso(data: string): string {
  return `${data.slice(0, 4)}-${data.slice(4, 6)}-${data.slice(6, 8)}`;
}

function contratoNumeroControleSeguro(ct: PncpContrato): string | null {
  return ct.numeroControlePNCP
    ? ct.numeroControlePNCP.replace(/[^A-Za-z0-9.-]/g, "-")
    : null;
}

function contratoSourceKey(ct: PncpContrato): string {
  const numeroControle = contratoNumeroControleSeguro(ct);
  if (numeroControle) return `contrato-${numeroControle}`;

  const numero = ct.numeroContrato ?? ct.numeroContratoEmpenho ?? "sem-numero";
  return `contrato-${ct.anoContrato}-${numero}-${ct.sequencialContrato}`;
}

function contratoSourceUrl(ct: PncpContrato): string | null {
  const controle = ct.numeroControlePNCP?.match(/^(\d+)-2-(\d+)\/(\d{4})$/);
  if (controle) {
    const [, cnpj, sequencial, ano] = controle;
    return `https://pncp.gov.br/app/contratos/${cnpj}/${ano}/${sequencial}`;
  }

  if (ct.anoContrato && ct.sequencialContrato) {
    return `https://pncp.gov.br/app/contratos/${AMERICANA.cnpj}/${ct.anoContrato}/${ct.sequencialContrato}`;
  }

  return null;
}

async function buscarPagina<T>(
  endpoint: string,
  params: Record<string, string | number>,
  pagina: number,
  tamanhoPagina = 50
): Promise<PncpPage<T>> {
  return get<PncpPage<T>>(
    `${PNCP_BASE}/${endpoint}`,
    { ...params, pagina, tamanhoPagina },
    700
  );
}

async function buscarTodos<T>(
  endpoint: string,
  params: Record<string, string | number>,
  label: string,
  tamanhoPagina = 50
): Promise<T[]> {
  const todos: T[] = [];
  let pagina = 1;

  while (true) {
    const page = await buscarPagina<T>(endpoint, params, pagina, tamanhoPagina);
    const items = page?.data ?? [];
    todos.push(...items);

    const total = page?.totalRegistros ?? 0;
    console.log(`[pncp] ${label} — página ${pagina}/${page?.totalPaginas ?? "?"} (${todos.length}/${total})`);

    if (items.length < tamanhoPagina || todos.length >= total) break;
    pagina++;
    await sleep(400);
  }

  return todos;
}

export async function coletarPncp(): Promise<void> {
  const erros: string[] = [];
  const agora = new Date().toISOString();

  // Período comum. ATENÇÃO aos filtros do PNCP: /contratos filtra por ÓRGÃO
  // (cnpjOrgao), não por município; /contratacoes/publicacao aceita
  // codigoMunicipioIbge e EXIGE codigoModalidadeContratacao (iterar 1..14 é o
  // próximo passo — TODO). O `codigoMunicipio` antigo não era filtro válido.
  const periodo = { dataInicial: DATA_INICIAL, dataFinal: DATA_FINAL };
  const contratosParams = { ...periodo, cnpjOrgao: AMERICANA.cnpj };
  const comprasParams = { ...periodo, codigoMunicipioIbge: AMERICANA.ibge };

  // 1. Licitações / compras
  let compras: PncpCompra[] = [];
  try {
    console.log(`[pncp] Coletando licitações — ${AMERICANA.nome} — ${DATA_INICIAL} → ${DATA_FINAL}`);
    compras = await buscarTodos<PncpCompra>(
      "contratacoes/publicacao",
      comprasParams,
      "licitações"
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    erros.push(`licitações: ${msg}`);
    console.error(`[pncp] Licitações erro: ${msg}`);
  }

  // 2. Contratos
  let contratos: PncpContrato[] = [];
  try {
    console.log(`[pncp] Coletando contratos — ${AMERICANA.nome}`);
    contratos = await buscarTodos<PncpContrato>(
      "contratos",
      contratosParams,
      "contratos"
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    erros.push(`contratos: ${msg}`);
    console.error(`[pncp] Contratos erro: ${msg}`);
  }

  // Ingestão L0 — registros crus com proveniência (raw_records).
  // Dedup por content_hash: re-rodar não duplica; conteúdo novo vira nova versão.
  const db = getDb();
  if (db) {
    for (const c of compras) {
      const cnpj = c.orgaoEntidade?.cnpj ?? "sem-cnpj";
      await ingestRaw(db, {
        sourceId: "pncp",
        sourceKey: `compra-${cnpj}-${c.anoCompra}-${c.sequencialCompra}`,
        recordType: "compra",
        payload: c,
        sourceUrl: c.orgaoEntidade?.cnpj
          ? `https://pncp.gov.br/app/editais/${c.orgaoEntidade.cnpj}/${c.anoCompra}/${c.sequencialCompra}`
          : null,
        publishedAt: c.dataPublicacaoPncp ? new Date(c.dataPublicacaoPncp) : null,
      });
    }
    for (const ct of contratos) {
      await ingestRaw(db, {
        sourceId: "pncp",
        sourceKey: contratoSourceKey(ct),
        recordType: "contrato",
        payload: ct,
        sourceUrl: contratoSourceUrl(ct),
        publishedAt: ct.dataPublicacaoPncp
          ? new Date(ct.dataPublicacaoPncp)
          : ct.dataAssinatura
            ? new Date(ct.dataAssinatura)
            : null,
      });
    }
    console.log(
      `[pncp] ingeridos ${compras.length} compras + ${contratos.length} contratos em raw_records`,
    );
  }

  // Salva licitações
  if (compras.length > 0) {
    const res: ResultadoColeta<PncpCompra> = {
      fonte: "pncp",
      coletadoEm: agora,
      municipio: AMERICANA.nome,
      ibge: AMERICANA.ibge,
      totalRegistros: compras.length,
      dados: compras,
      erros,
    };
    const arq = await salvar(res);
    await salvarLatest(res);
    console.log(`[pncp] ${compras.length} licitações salvas em ${arq}`);
  }

  // Salva contratos
  if (contratos.length > 0) {
    const res: ResultadoColeta<PncpContrato> = {
      fonte: "pncp",
      coletadoEm: agora + "-contratos",
      municipio: AMERICANA.nome,
      ibge: AMERICANA.ibge,
      totalRegistros: contratos.length,
      dados: contratos,
      erros,
    };
    const arq = await salvar(res);
    console.log(`[pncp] ${contratos.length} contratos salvos em ${arq}`);
  }

  if (erros.length) {
    console.warn(`[pncp] ${erros.length} erros:`);
    erros.forEach((e) => console.warn("  ", e));
  }

  const tentativa = new Date();
  await recordSourceCoverage({
    sourceId: "pncp",
    collector: "pncp",
    territoryIbge: AMERICANA.ibge,
    uf: AMERICANA.uf,
    recordType: "compra",
    status: erros.some((e) => e.startsWith("licitações:")) ? "partial" : compras.length > 0 ? "fresh" : "no_data",
    coverageStart: dataCompactaParaIso(DATA_INICIAL),
    coverageEnd: dataCompactaParaIso(DATA_FINAL),
    lastAttemptAt: tentativa,
    lastSuccessAt: erros.some((e) => e.startsWith("licitações:")) ? null : tentativa,
    totalRecords: compras.length,
    errorMessage: erros.find((e) => e.startsWith("licitações:")) ?? null,
    limitations:
      "O endpoint de publicações do PNCP exige modalidade; esta coleta ainda usa a consulta disponível para Americana e pode ficar parcial.",
    metadata: { municipio: AMERICANA.nome, cnpjOrgao: AMERICANA.cnpj },
  });
  await recordSourceCoverage({
    sourceId: "pncp",
    collector: "pncp",
    territoryIbge: AMERICANA.ibge,
    uf: AMERICANA.uf,
    recordType: "contrato",
    status: erros.some((e) => e.startsWith("contratos:")) ? "partial" : contratos.length > 0 ? "fresh" : "no_data",
    coverageStart: dataCompactaParaIso(DATA_INICIAL),
    coverageEnd: dataCompactaParaIso(DATA_FINAL),
    lastAttemptAt: tentativa,
    lastSuccessAt: erros.some((e) => e.startsWith("contratos:")) ? null : tentativa,
    totalRecords: contratos.length,
    errorMessage: erros.find((e) => e.startsWith("contratos:")) ?? null,
    limitations: "Contratos filtrados pelo CNPJ do órgão municipal no PNCP.",
    metadata: { municipio: AMERICANA.nome, cnpjOrgao: AMERICANA.cnpj },
  });
}

if (process.argv[1]?.endsWith("pncp.ts") || process.argv[1]?.endsWith("pncp.js")) {
  coletarPncp()
    .catch(console.error)
    .finally(() => closeDb());
}
