/**
 * Adapter TSE — doações de campanha (envolvidos eleitorais).
 *
 * O cruzamento de maior valor político: um doador de campanha (TSE) que aparece
 * como sócio (Receita) de uma empresa que ganha contrato (PNCP) pago pelo
 * município. Liga doador↔candidato (pessoa_publica).
 *
 * VERIFICADO 2026-05-25: os dados estão em bulk no CDN do TSE
 * (cdn.tse.jus.br/estatistica/sead/odsele — alcançável, ZIP grande). A ingestão
 * completa exige: baixar o ZIP de prestação de contas da eleição (ex.: 2024),
 * descompactar, filtrar UF=SP e os candidatos/município de Americana, e ingerir
 * as doações. Por ser bulk + depender de banco, este adapter documenta a fonte e
 * o caminho; a ingestão completa é um passo focado (não roda neste sandbox).
 */
import "dotenv/config";
import { TSE_CDN_BASE } from "../config.js";

export async function coletarTseDoacoes(): Promise<void> {
  console.log(`[tse] Doações de campanha — fonte: ${TSE_CDN_BASE}/prestacao_contas`);
  console.warn(
    "[tse] Ingestão completa pendente: requer download do ZIP de prestação de contas " +
      "(grande), descompactação, filtragem por SP/Americana e gravação no banco. " +
      "Esqueleto e fonte prontos — próximo passo focado.",
  );
}

if (process.argv[1]?.endsWith("tse-doacoes.ts") || process.argv[1]?.endsWith("tse-doacoes.js")) {
  coletarTseDoacoes().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
