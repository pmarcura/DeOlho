/**
 * Adapter TCE-SP — Tribunal de Contas do Estado de São Paulo
 * Transparência Municipal — despesas e receitas de Americana
 *
 * API base: https://transparencia.tce.sp.gov.br
 * Endpoints documentados no portal:
 *   GET /api/json/despesas/{municipio}/{exercicio}/{mes}
 *   GET /api/json/receitas/{municipio}/{exercicio}/{mes}
 *
 * Cuidado: o TCE-SP usa slug próprio de município ("americana"), não o IBGE.
 */

import { get } from "../utils/http.js";
import { salvar, salvarLatest } from "../utils/save.js";
import { closeDb, getDb, ingestMany, type IngestInput } from "../utils/ingest.js";
import { recordSourceCoverage } from "../utils/civic.js";
import { AMERICANA, TCE_SP_BASE } from "../config.js";
import type { ResultadoColeta, TceSpDespesa, TceSpReceita } from "../types.js";

// exercícios a coletar (ano atual + anterior)
const anoAtual = new Date().getFullYear();
const EXERCICIOS = [anoAtual - 1, anoAtual];
const TCE_MUNICIPIO = "americana";

interface TceDespesaApi {
  orgao: string;
  mes: string;
  evento: string;
  nr_empenho: string;
  id_fornecedor: string;
  nm_fornecedor: string;
  dt_emissao_despesa: string;
  vl_despesa: string;
}

interface TceReceitaApi {
  orgao: string;
  mes: string;
  ds_fonte_recurso: string;
  ds_cd_aplicacao_fixo: string;
  ds_alinea: string;
  ds_subalinea: string;
  vl_arrecadacao: string;
}

const MESES: Record<string, number> = {
  janeiro: 1,
  fevereiro: 2,
  marco: 3,
  março: 3,
  abril: 4,
  maio: 5,
  junho: 6,
  julho: 7,
  agosto: 8,
  setembro: 9,
  outubro: 10,
  novembro: 11,
  dezembro: 12,
};

function mesesDoExercicio(exercicio: number): number[] {
  if (exercicio === anoAtual) {
    return Array.from({ length: new Date().getMonth() + 1 }, (_, i) => i + 1);
  }
  return Array.from({ length: 12 }, (_, i) => i + 1);
}

function parseValorBr(valor: string | number | null | undefined): number {
  if (typeof valor === "number") return valor;
  if (!valor) return 0;
  const normalizado = valor.replace(/\./g, "").replace(",", ".");
  const parsed = Number.parseFloat(normalizado);
  return Number.isFinite(parsed) ? parsed : 0;
}

function mesNumero(valor: string | number, fallback: number): number {
  if (typeof valor === "number") return valor;
  return MESES[valor.trim().toLowerCase()] ?? fallback;
}

function documentoPublicavel(idFornecedor: string | null | undefined): string | null {
  if (!idFornecedor) return null;
  const digits = idFornecedor.replace(/\D/g, "");
  return digits.length === 14 ? digits : null;
}

function chaveSegura(valor: string | number | null | undefined): string {
  return String(valor ?? "sem-valor")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9.-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

function despesaSourceUrl(exercicio: number, mes: number): string {
  return `${TCE_SP_BASE}/api/json/despesas/${TCE_MUNICIPIO}/${exercicio}/${mes}`;
}

function receitaSourceUrl(exercicio: number, mes: number): string {
  return `${TCE_SP_BASE}/api/json/receitas/${TCE_MUNICIPIO}/${exercicio}/${mes}`;
}

function normalizarDespesa(row: TceDespesaApi, exercicio: number, mesConsulta: number): TceSpDespesa {
  const mes = mesNumero(row.mes, mesConsulta);
  const valor = parseValorBr(row.vl_despesa);
  const evento = row.evento?.trim() || null;

  return {
    exercicio,
    mes,
    orgao: row.orgao,
    nomeOrgao: row.orgao,
    funcao: null,
    subfuncao: null,
    programa: null,
    acao: evento ? `${evento} - empenho ${row.nr_empenho}` : `Empenho ${row.nr_empenho}`,
    elemento: null,
    modalidade: null,
    credor: row.id_fornecedor,
    nomeCredor: row.nm_fornecedor,
    cpfCnpjCredor: documentoPublicavel(row.id_fornecedor),
    empenho: row.nr_empenho,
    valorEmpenhado: evento?.toLowerCase() === "empenhado" ? valor : 0,
    valorLiquidado: evento?.toLowerCase() === "liquidado" ? valor : 0,
    valorPago: evento?.toLowerCase() === "pago" ? valor : 0,
    eventoDespesa: evento,
    valorDespesa: valor,
    dataEmissaoDespesa: row.dt_emissao_despesa,
  };
}

function normalizarReceita(row: TceReceitaApi, exercicio: number, mesConsulta: number): TceSpReceita {
  return {
    exercicio,
    mes: mesNumero(row.mes, mesConsulta),
    orgao: row.orgao,
    categoria: row.ds_fonte_recurso,
    origem: row.ds_cd_aplicacao_fixo,
    especie: row.ds_alinea,
    rubrica: row.ds_subalinea,
    valorPrevisto: 0,
    valorArrecadado: parseValorBr(row.vl_arrecadacao),
    fonteRecurso: row.ds_fonte_recurso,
    codigoAplicacao: row.ds_cd_aplicacao_fixo,
  };
}

async function coletarDespesasMes(
  exercicio: number,
  mes: number,
): Promise<{ dados: TceSpDespesa[]; erro?: string }> {
  try {
    const res = await get<TceDespesaApi[] | { data: TceDespesaApi[] }>(
      despesaSourceUrl(exercicio, mes),
      {},
      800,
    );
    const rows = Array.isArray(res) ? res : (res as { data: TceDespesaApi[] }).data ?? [];
    return { dados: rows.map((row) => normalizarDespesa(row, exercicio, mes)) };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn(`[tce-sp] despesas ${exercicio}/${mes}: ${msg}`);
    return { dados: [], erro: `despesas ${exercicio}/${mes}: ${msg}` };
  }
}

async function coletarReceitasMes(
  exercicio: number,
  mes: number,
): Promise<{ dados: TceSpReceita[]; erro?: string }> {
  try {
    const res = await get<TceReceitaApi[] | { data: TceReceitaApi[] }>(
      receitaSourceUrl(exercicio, mes),
      {},
      800,
    );
    const rows = Array.isArray(res) ? res : (res as { data: TceReceitaApi[] }).data ?? [];
    return { dados: rows.map((row) => normalizarReceita(row, exercicio, mes)) };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn(`[tce-sp] receitas ${exercicio}/${mes}: ${msg}`);
    return { dados: [], erro: `receitas ${exercicio}/${mes}: ${msg}` };
  }
}

export async function coletarTceSp(): Promise<void> {
  console.log(`[tce-sp] Coletando despesas e receitas — Americana — exercícios ${EXERCICIOS.join(", ")}`);

  const erros: string[] = [];
  const despesas: TceSpDespesa[] = [];
  const receitas: TceSpReceita[] = [];

  for (const exercicio of EXERCICIOS) {
    let totalDespesasAno = 0;
    let totalReceitasAno = 0;
    for (const mes of mesesDoExercicio(exercicio)) {
      const d = await coletarDespesasMes(exercicio, mes);
      const r = await coletarReceitasMes(exercicio, mes);
      despesas.push(...d.dados);
      receitas.push(...r.dados);
      totalDespesasAno += d.dados.length;
      totalReceitasAno += r.dados.length;
      if (d.erro) erros.push(d.erro);
      if (r.erro) erros.push(r.erro);
      console.log(`[tce-sp] ${exercicio}/${mes}: ${d.dados.length} despesas, ${r.dados.length} receitas`);
    }
    console.log(`[tce-sp] ${exercicio}: ${totalDespesasAno} despesas, ${totalReceitasAno} receitas`);
  }

  // Ingestão L0 — despesas como raw_records (eixo do dinheiro, lado da saída).
  const db = getDb();
  if (db) {
    const inputs: IngestInput[] = [];
    for (const d of despesas) {
      const mes = String(d.mes ?? 1).padStart(2, "0");
      inputs.push({
        sourceId: "tce-sp",
        sourceKey: [
          "despesa",
          d.exercicio,
          mes,
          chaveSegura(d.empenho),
          chaveSegura(d.eventoDespesa),
          chaveSegura(d.dataEmissaoDespesa),
          chaveSegura(d.valorDespesa),
        ].join("-"),
        recordType: "despesa",
        payload: d,
        sourceUrl: despesaSourceUrl(d.exercicio, d.mes),
        publishedAt: d.exercicio ? new Date(`${d.exercicio}-${mes}-01`) : null,
      });
    }
    for (const r of receitas) {
      const mes = String(r.mes ?? 1).padStart(2, "0");
      inputs.push({
        sourceId: "tce-sp",
        sourceKey: [
          "receita",
          r.exercicio,
          mes,
          chaveSegura(r.orgao),
          chaveSegura(r.categoria),
          chaveSegura(r.especie),
          chaveSegura(r.rubrica),
          chaveSegura(r.valorArrecadado),
        ].join("-"),
        recordType: "receita",
        payload: r,
        sourceUrl: receitaSourceUrl(r.exercicio, r.mes),
        publishedAt: r.exercicio ? new Date(`${r.exercicio}-${mes}-01`) : null,
      });
    }
    await ingestMany(db, inputs, 500);
    if (despesas.length) {
      console.log(`[tce-sp] ingeridas ${despesas.length} despesas em raw_records`);
    }
    if (receitas.length) {
      console.log(`[tce-sp] ingeridas ${receitas.length} receitas em raw_records`);
    }
  }

  const agora = new Date().toISOString();

  const resDespesas: ResultadoColeta<TceSpDespesa> = {
    fonte: "tce-sp",
    coletadoEm: agora,
    municipio: AMERICANA.nome,
    ibge: AMERICANA.ibge,
    totalRegistros: despesas.length,
    dados: despesas,
    erros,
  };

  const resReceitas: ResultadoColeta<TceSpReceita> = {
    fonte: "tce-sp",
    coletadoEm: agora + "-receitas",
    municipio: AMERICANA.nome,
    ibge: AMERICANA.ibge,
    totalRegistros: receitas.length,
    dados: receitas,
    erros,
  };

  const arqD = await salvar(resDespesas);
  await salvarLatest(resDespesas);
  console.log(`[tce-sp] ${despesas.length} despesas salvas em ${arqD}`);

  if (receitas.length > 0) {
    const arqR = await salvar(resReceitas);
    console.log(`[tce-sp] ${receitas.length} receitas salvas em ${arqR}`);
  }

  const tentativa = new Date();
  const status = erros.length > 0 && despesas.length === 0 && receitas.length === 0
    ? "unavailable"
    : erros.length > 0
      ? "partial"
      : despesas.length + receitas.length > 0
        ? "fresh"
        : "no_data";

  await recordSourceCoverage({
    sourceId: "tce-sp",
    collector: "tce-sp",
    territoryIbge: AMERICANA.ibge,
    uf: AMERICANA.uf,
    recordType: "despesa",
    status,
    coverageStart: `${EXERCICIOS[0]}-01-01`,
    coverageEnd: `${EXERCICIOS[EXERCICIOS.length - 1]}-12-31`,
    lastAttemptAt: tentativa,
    lastSuccessAt: status === "fresh" || status === "partial" ? tentativa : null,
    totalRecords: despesas.length,
    errorMessage: erros.filter((e) => e.startsWith("despesas")).join(" | ") || null,
    limitations:
      "API oficial do TCE-SP publica despesas por mês e por slug municipal; documentos de pessoa física aparecem apenas parcialmente e não viram entidade pública.",
    metadata: { exercicios: EXERCICIOS, municipioApi: TCE_MUNICIPIO },
  });
  await recordSourceCoverage({
    sourceId: "tce-sp",
    collector: "tce-sp",
    territoryIbge: AMERICANA.ibge,
    uf: AMERICANA.uf,
    recordType: "receita",
    status,
    coverageStart: `${EXERCICIOS[0]}-01-01`,
    coverageEnd: `${EXERCICIOS[EXERCICIOS.length - 1]}-12-31`,
    lastAttemptAt: tentativa,
    lastSuccessAt: status === "fresh" || status === "partial" ? tentativa : null,
    totalRecords: receitas.length,
    errorMessage: erros.filter((e) => e.startsWith("receitas")).join(" | ") || null,
    limitations:
      "API oficial do TCE-SP publica receitas por mês e por slug municipal.",
    metadata: { exercicios: EXERCICIOS, municipioApi: TCE_MUNICIPIO },
  });
}

if (process.argv[1]?.endsWith("tce-sp.ts") || process.argv[1]?.endsWith("tce-sp.js")) {
  coletarTceSp()
    .catch(console.error)
    .finally(() => closeDb());
}
