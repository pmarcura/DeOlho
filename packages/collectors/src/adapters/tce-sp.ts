/**
 * Adapter TCE-SP — Tribunal de Contas do Estado de São Paulo
 * Transparência Municipal — despesas e receitas de Americana
 *
 * API base: https://transparencia.tce.sp.gov.br
 * Endpoints documentados no portal (verificar em produção):
 *   GET /despesas.json?municipio=3501608&exercicio=2025
 *   GET /receitas.json?municipio=3501608&exercicio=2025
 *
 * ATENÇÃO: Os endpoints exatos precisam de verificação na documentação oficial.
 * Se retornarem 404, inspecionar https://transparencia.tce.sp.gov.br com DevTools
 * para encontrar os endpoints reais usados pela interface.
 */

import { get } from "../utils/http.js";
import { salvar, salvarLatest } from "../utils/save.js";
import { AMERICANA, TCE_SP_BASE } from "../config.js";
import type { ResultadoColeta, TceSpDespesa, TceSpReceita } from "../types.js";

// exercícios a coletar (ano atual + anterior)
const anoAtual = new Date().getFullYear();
const EXERCICIOS = [anoAtual - 1, anoAtual];

async function coletarDespesas(exercicio: number): Promise<TceSpDespesa[]> {
  try {
    const res = await get<TceSpDespesa[] | { data: TceSpDespesa[] }>(
      `${TCE_SP_BASE}/despesas.json`,
      { municipio: AMERICANA.ibge, exercicio },
      800
    );
    return Array.isArray(res) ? res : (res as { data: TceSpDespesa[] }).data ?? [];
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn(`[tce-sp] despesas ${exercicio}: ${msg}`);
    return [];
  }
}

async function coletarReceitas(exercicio: number): Promise<TceSpReceita[]> {
  try {
    const res = await get<TceSpReceita[] | { data: TceSpReceita[] }>(
      `${TCE_SP_BASE}/receitas.json`,
      { municipio: AMERICANA.ibge, exercicio },
      800
    );
    return Array.isArray(res) ? res : (res as { data: TceSpReceita[] }).data ?? [];
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn(`[tce-sp] receitas ${exercicio}: ${msg}`);
    return [];
  }
}

export async function coletarTceSp(): Promise<void> {
  console.log(`[tce-sp] Coletando despesas e receitas — Americana — exercícios ${EXERCICIOS.join(", ")}`);

  const erros: string[] = [];
  const despesas: TceSpDespesa[] = [];
  const receitas: TceSpReceita[] = [];

  for (const exercicio of EXERCICIOS) {
    const d = await coletarDespesas(exercicio);
    const r = await coletarReceitas(exercicio);
    despesas.push(...d);
    receitas.push(...r);
    console.log(`[tce-sp] ${exercicio}: ${d.length} despesas, ${r.length} receitas`);
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
}

if (process.argv[1]?.endsWith("tce-sp.ts") || process.argv[1]?.endsWith("tce-sp.js")) {
  coletarTceSp().catch(console.error);
}
