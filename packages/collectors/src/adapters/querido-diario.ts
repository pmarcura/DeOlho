/**
 * Adapter Querido Diário — Diário Oficial de Americana
 *
 * O projeto Querido Diário (Open Knowledge Brasil) agrega diários oficiais
 * municipais e expõe uma API pública de busca.
 * Docs: https://queridodiario.ok.org.br/api/docs
 *
 * Americana está coberta: territory_id = 3501608
 */

import { get } from "../utils/http.js";
import { salvar, salvarLatest } from "../utils/save.js";
import {
  AMERICANA,
  DATA_FINAL_ISO,
  DATA_INICIAL_ISO,
  QUERIDO_DIARIO_BASE,
} from "../config.js";
import type { GazetaEdicao, ResultadoColeta } from "../types.js";

interface QdResponse {
  total_gazettes: number;
  gazettes: GazetaEdicao[];
}

async function coletarGazetas(offset = 0, size = 100): Promise<QdResponse> {
  return get<QdResponse>(`${QUERIDO_DIARIO_BASE}/gazettes`, {
    territory_ids: AMERICANA.ibge,
    since: DATA_INICIAL_ISO,
    until: DATA_FINAL_ISO,
    offset,
    size,
  });
}

export async function coletarQueiridoDiario(): Promise<void> {
  console.log(`[querido-diario] Coletando edições — Americana ${DATA_INICIAL_ISO} → ${DATA_FINAL_ISO}`);

  const erros: string[] = [];
  const edicoes: GazetaEdicao[] = [];

  try {
    let offset = 0;
    const pageSize = 100;

    while (true) {
      const res = await coletarGazetas(offset, pageSize);
      edicoes.push(...res.gazettes);
      console.log(`[querido-diario] ${edicoes.length}/${res.total_gazettes} edições`);

      if (edicoes.length >= res.total_gazettes || res.gazettes.length < pageSize) break;
      offset += pageSize;
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    erros.push(msg);
    console.error(`[querido-diario] Erro: ${msg}`);
  }

  const resultado: ResultadoColeta<GazetaEdicao> = {
    fonte: "querido-diario",
    coletadoEm: new Date().toISOString(),
    municipio: AMERICANA.nome,
    ibge: AMERICANA.ibge,
    totalRegistros: edicoes.length,
    dados: edicoes,
    erros,
  };

  const arq = await salvar(resultado);
  await salvarLatest(resultado);
  console.log(`[querido-diario] ${edicoes.length} edições salvas em ${arq}`);
}

if (process.argv[1]?.endsWith("querido-diario.ts") || process.argv[1]?.endsWith("querido-diario.js")) {
  coletarQueiridoDiario().catch(console.error);
}
