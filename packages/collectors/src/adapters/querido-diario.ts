/**
 * Adapter Querido Diário — Diário Oficial de Americana
 *
 * O projeto Querido Diário (Open Knowledge Brasil) agrega diários oficiais
 * municipais e expõe uma API pública de busca.
 * Docs: https://api.queridodiario.ok.org.br/docs
 *
 * Americana está registrada (territory_id = 3501608), mas no momento sem
 * edições raspadas (availability_date vazio em /cities/3501608) — a coleta
 * retornará 0 até o QD começar a raspar o diário do município.
 */

import { get } from "../utils/http.js";
import { salvar, salvarLatest } from "../utils/save.js";
import { recordSourceCoverage } from "../utils/civic.js";
import { closeDb } from "../utils/ingest.js";
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
    published_since: DATA_INICIAL_ISO,
    published_until: DATA_FINAL_ISO,
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

  const tentativa = new Date();
  await recordSourceCoverage({
    sourceId: "querido-diario",
    collector: "querido-diario",
    territoryIbge: AMERICANA.ibge,
    uf: AMERICANA.uf,
    recordType: "gazeta",
    status: erros.length > 0 ? "error" : edicoes.length > 0 ? "fresh" : "no_data",
    coverageStart: DATA_INICIAL_ISO,
    coverageEnd: DATA_FINAL_ISO,
    lastAttemptAt: tentativa,
    lastSuccessAt: erros.length > 0 ? null : tentativa,
    totalRecords: edicoes.length,
    errorMessage: erros.join(" | ") || null,
    limitations:
      edicoes.length === 0
        ? "Americana aparece no Querido Diário, mas a API não retornou edições no período consultado."
        : null,
    metadata: { municipio: AMERICANA.nome },
  });
}

if (process.argv[1]?.endsWith("querido-diario.ts") || process.argv[1]?.endsWith("querido-diario.js")) {
  coletarQueiridoDiario()
    .catch(console.error)
    .finally(() => closeDb());
}
