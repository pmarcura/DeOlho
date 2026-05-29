/**
 * Re-compila atoms.json a partir dos `resumo` JÁ extraídos — sem rebaixar os 60
 * PDFs. Use quando a lógica do compiler muda mas o texto cru continua igual.
 *
 * Uso: pnpm --filter @deolho/collectors recompile
 */
import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { compilarLote } from "./index.js";
import { agregarEntidades } from "./aggregate.js";
import type { Atom } from "../extract/atoms.js";

const ATOMS = path.resolve(process.cwd(), "data/diario-americana/atoms.json");
const ENTID = path.resolve(process.cwd(), "data/diario-americana/entidades.json");

const BASE_KEYS = [
  "id", "edicaoSlug", "edicaoDate", "tipo", "numero", "ano", "titulo",
  "resumo", "posicao", "cnpjsMencionados", "valorMencionado",
] as const;

async function main() {
  const data = JSON.parse(await fs.readFile(ATOMS, "utf8")) as { atomos: Record<string, unknown>[]; edicoesProcessadas?: number; porTipo?: Record<string, number> };
  const base: Atom[] = data.atomos.map((a) => {
    const o: Record<string, unknown> = {};
    for (const k of BASE_KEYS) o[k] = a[k];
    return o as unknown as Atom;
  });
  console.log(`[recompile] recompilando ${base.length} átomos (zero LLM)...`);
  const start = Date.now();
  const compilados = compilarLote(base);
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  const porTipo: Record<string, number> = {};
  for (const a of compilados) porTipo[a.tipo] = (porTipo[a.tipo] ?? 0) + 1;
  const comTituloHumano = compilados.filter((a) => a.tituloHumano).length;
  const comCampos = compilados.filter((a) => Object.keys(a.campos.dados).length > 0).length;
  const comPessoa = compilados.filter((a) => a.pessoas.length > 0).length;
  const comOrgao = compilados.filter((a) => a.orgaos.length > 0).length;
  const porComplexidade: Record<string, number> = {};
  for (const a of compilados) porComplexidade[a.complexidade.label] = (porComplexidade[a.complexidade.label] ?? 0) + 1;

  const saida = {
    geradoEm: new Date().toISOString(),
    totalAtomos: compilados.length,
    edicoesProcessadas: data.edicoesProcessadas ?? 0,
    porTipo,
    qualidade: { comTituloHumano, comCampos, comPessoa, comOrgao, porComplexidade },
    atomos: compilados,
  };
  await fs.writeFile(ATOMS, JSON.stringify(saida, null, 2), "utf8");

  const entidades = agregarEntidades(compilados);
  await fs.writeFile(ENTID, JSON.stringify(entidades, null, 2), "utf8");

  console.log(`[recompile] ok em ${elapsed}s`);
  console.log(`[recompile] qualidade: ${comTituloHumano} título humano, ${comCampos} campos, ${comPessoa} c/ pessoa, ${comOrgao} c/ órgão`);
  console.log(`[recompile] entidades: ${entidades.totais.pessoas} pessoas, ${entidades.totais.familias} famílias, ${entidades.totais.orgaos} órgãos`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
