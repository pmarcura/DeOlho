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

  // Parâmetros comuns: município de Americana por código IBGE
  const baseParams = {
    codigoMunicipio: AMERICANA.ibge,
    dataInicial: DATA_INICIAL,
    dataFinal: DATA_FINAL,
  };

  // 1. Licitações / compras
  let compras: PncpCompra[] = [];
  try {
    console.log(`[pncp] Coletando licitações — ${AMERICANA.nome} — ${DATA_INICIAL} → ${DATA_FINAL}`);
    compras = await buscarTodos<PncpCompra>(
      "contratacoes/publicacao",
      baseParams,
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
      baseParams,
      "contratos"
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    erros.push(`contratos: ${msg}`);
    console.error(`[pncp] Contratos erro: ${msg}`);
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
}

if (process.argv[1]?.endsWith("pncp.ts") || process.argv[1]?.endsWith("pncp.js")) {
  coletarPncp().catch(console.error);
}
