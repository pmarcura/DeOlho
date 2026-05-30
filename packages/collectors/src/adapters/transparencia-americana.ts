/**
 * Adapter Portal da Transparência de Americana — execução orçamentária (SIAFIC).
 *
 * VERIFICADO 2026-05-25: a seção SIAFIC (despesas/empenhos/pagamentos com credor)
 * está marcada como "em breve" no portal
 * (transparencia.americana.sp.gov.br/transparencia_index.php?p=siafic). Ou seja, a
 * execução detalhada do município ainda NÃO foi publicada — não é bug do coletor,
 * é lacuna da fonte (como o Querido Diário ainda não cobrir Americana).
 *
 * Quando a seção entrar no ar, a execução com credor deve virar `payments` pelo
 * mesmo padrão do TCE-SP (raw_records → mappers → payments, ligando credor→entities),
 * fechando o eixo do dinheiro do lado da SAÍDA (pagamentos) para o município.
 */
import "dotenv/config";
import { AMERICANA, TRANSPARENCIA_AMERICANA_BASE } from "../config.js";
import { recordSourceCoverage } from "../utils/civic.js";
import { closeDb } from "../utils/ingest.js";

export async function coletarTransparenciaAmericana(): Promise<void> {
  console.log(
    `[transparencia-americana] ${AMERICANA.nome}: verificando ${TRANSPARENCIA_AMERICANA_BASE}`,
  );
  console.warn(
    "[transparencia-americana] SIAFIC (despesas/empenhos/pagamentos com credor) ainda 'em breve' " +
      "no portal — sem execução detalhada a coletar. Reavaliar periodicamente; o mapper para " +
      "payments já está previsto (mesmo padrão do TCE-SP).",
  );
  await recordSourceCoverage({
    sourceId: "transparencia-americana",
    collector: "transparencia-americana",
    territoryIbge: AMERICANA.ibge,
    uf: AMERICANA.uf,
    recordType: "execucao-orcamentaria",
    status: "unavailable",
    lastAttemptAt: new Date(),
    lastSuccessAt: null,
    totalRecords: 0,
    errorMessage: null,
    limitations:
      "A seção SIAFIC do portal municipal estava marcada como 'em breve'; despesas com credor ainda não estão disponíveis para coleta estruturada.",
    metadata: { baseUrl: TRANSPARENCIA_AMERICANA_BASE },
  });
}

if (
  process.argv[1]?.endsWith("transparencia-americana.ts") ||
  process.argv[1]?.endsWith("transparencia-americana.js")
) {
  coletarTransparenciaAmericana()
    .catch((e) => {
      console.error(e);
      process.exitCode = 1;
    })
    .finally(() => closeDb());
}
