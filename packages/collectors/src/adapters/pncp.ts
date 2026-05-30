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
import { getDb, ingestRaw } from "../utils/ingest.js";
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

  // Período comum. ATENÇÃO aos filtros do PNCP: /contratos filtra por ÓRGÃO
  // (cnpjOrgao), não por município; /contratacoes/publicacao aceita
  // codigoMunicipioIbge e EXIGE codigoModalidadeContratacao — iteramos as 14
  // modalidades vigentes (Lei 14.133/21 + legados Lei 8.666/93). O
  // `codigoMunicipio` antigo não era filtro válido.
  const periodo = { dataInicial: DATA_INICIAL, dataFinal: DATA_FINAL };
  const contratosParams = { ...periodo, cnpjOrgao: AMERICANA.cnpj };

  // 1. Licitações / compras — uma chamada por modalidade.
  // Códigos PNCP: 1 Leilão eletrônico · 2 Diálogo competitivo · 3 Concurso ·
  // 4 Concorrência eletrônica · 5 Concorrência presencial · 6 Pregão eletrônico ·
  // 7 Pregão presencial · 8 Dispensa · 9 Inexigibilidade · 10 Manifestação de
  // interesse · 11 Pré-qualificação · 12 Credenciamento · 13 Leilão presencial ·
  // 14 Inaplicabilidade da licitação.
  const MODALIDADES_PNCP = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14] as const;
  let compras: PncpCompra[] = [];
  console.log(`[pncp] Coletando licitações — ${AMERICANA.nome} — ${DATA_INICIAL} → ${DATA_FINAL}`);
  for (const modalidade of MODALIDADES_PNCP) {
    try {
      const lote = await buscarTodos<PncpCompra>(
        "contratacoes/publicacao",
        {
          ...periodo,
          codigoMunicipioIbge: AMERICANA.ibge,
          codigoModalidadeContratacao: modalidade,
        },
        `licitações m${modalidade}`,
      );
      compras.push(...lote);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      erros.push(`licitações m${modalidade}: ${msg}`);
      console.error(`[pncp] Licitações modalidade ${modalidade} erro: ${msg}`);
    }
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
        sourceKey: `contrato-${ct.anoContrato}-${ct.numeroContrato}-${ct.sequencialContrato}`,
        recordType: "contrato",
        payload: ct,
        publishedAt: ct.dataAssinatura ? new Date(ct.dataAssinatura) : null,
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
}

if (process.argv[1]?.endsWith("pncp.ts") || process.argv[1]?.endsWith("pncp.js")) {
  coletarPncp().catch(console.error);
}
