/**
 * Agregador de ENTIDADES — transforma os átomos compilados num índice de
 * pessoas (agentes públicos), famílias (coocorrência de sobrenome) e órgãos.
 *
 * Responde, de forma factual e com fonte, à pergunta do produto:
 * "quantas famílias estão no poder e há quanto tempo?" — sempre como
 * COOCORRÊNCIA em atos oficiais, NUNCA como prova de parentesco ou acusação.
 *
 * Tudo determinístico, zero LLM, zero custo.
 */

import type { CompiledAtom } from "./index.js";
import type { PapelPessoa } from "./people.js";
import { sobrenomeDe, SOBRENOMES_COMUNS, slugify } from "./people.js";
import { parsearValor } from "./normalize.js";

export interface PessoaAgg {
  slug: string;
  nome: string;
  sobrenome: string;
  sobrenomeComum: boolean;
  papeis: PapelPessoa[];
  cargos: string[];
  orgaos: string[]; // slugs de órgãos co-citados
  anos: number[];
  primeiraData: string | null;
  ultimaData: string | null;
  mencoes: number;
  atomIds: string[];
}

export interface FamiliaAgg {
  slug: string;
  sobrenome: string;
  comum: boolean;
  totalPessoas: number;
  pessoas: Array<{ slug: string; nome: string; cargos: string[] }>;
  cargos: string[];
  anos: number[];
  primeiraData: string | null;
  ultimaData: string | null;
  mencoes: number;
  atomIds: string[];
}

export interface OrgaoAgg {
  slug: string;
  nome: string;
  sigla: string | null;
  mencoes: number;
  valorTotal: number;
  anos: number[];
  primeiraData: string | null;
  ultimaData: string | null;
  atomIds: string[];
  pessoas: string[]; // slugs de pessoas co-citadas
}

export interface EntidadesIndex {
  geradoEm: string;
  totais: { pessoas: number; familias: number; orgaos: number };
  pessoas: PessoaAgg[];
  familias: FamiliaAgg[];
  orgaos: OrgaoAgg[];
}

// Acumulador mutável interno.
interface PAcc {
  slugs: Set<string>; // todos os slugs já fundidos aqui
  nomeVariants: Map<string, number>; // nome exato → contagem
  papeis: Set<PapelPessoa>;
  cargos: Set<string>;
  orgaos: Set<string>;
  anos: Set<number>;
  datas: string[];
  atomIds: Set<string>;
}

function anoDe(iso: string | null): number | null {
  if (!iso) return null;
  const y = Number(iso.slice(0, 4));
  return Number.isFinite(y) && y > 1990 ? y : null;
}

function nomeCanonico(variants: Map<string, number>): string {
  // Preferência: mais tokens (nome completo) → mais acentos → mais frequente.
  let best = "";
  let bestScore = -Infinity;
  for (const [nome, freq] of variants) {
    const tokens = nome.split(" ").length;
    const acentos = (nome.match(/[À-ÿ]/g) ?? []).length;
    const score = tokens * 1000 + acentos * 10 + freq;
    if (score > bestScore) { bestScore = score; best = nome; }
  }
  return best;
}

function minMax(datas: string[]): [string | null, string | null] {
  const validas = datas.filter(Boolean).sort();
  return [validas[0] ?? null, validas[validas.length - 1] ?? null];
}

export function agregarEntidades(atoms: CompiledAtom[]): EntidadesIndex {
  const pAcc = new Map<string, PAcc>(); // slug → acumulador
  const oAcc = new Map<string, {
    nome: string; sigla: string | null; anos: Set<number>; datas: string[];
    atomIds: Set<string>; valor: number; pessoas: Set<string>;
  }>();

  for (const a of atoms) {
    // Ano: data da edição (publicação) ou, na falta, o ano do próprio ato
    // (ex.: contrato 04/2022 sem data de edição → 2022). Dá timeline ao
    // "há quanto tempo no poder".
    const anoAto = a.ano && /^\d{4}$/.test(a.ano) ? Number(a.ano) : null;
    const ano = anoDe(a.edicaoDate) ?? anoAto;
    const valor = parsearValor(a.valorMencionado ?? "");
    const orgaoSlugs = a.orgaos.map((o) => o.slug);
    const pessoaSlugs = a.pessoas.map((p) => p.slug);

    for (const p of a.pessoas) {
      let acc = pAcc.get(p.slug);
      if (!acc) {
        acc = {
          slugs: new Set([p.slug]), nomeVariants: new Map(), papeis: new Set(),
          cargos: new Set(), orgaos: new Set(), anos: new Set(), datas: [], atomIds: new Set(),
        };
        pAcc.set(p.slug, acc);
      }
      acc.nomeVariants.set(p.nome, (acc.nomeVariants.get(p.nome) ?? 0) + 1);
      acc.papeis.add(p.papel);
      if (p.cargo) acc.cargos.add(p.cargo);
      for (const os of orgaoSlugs) acc.orgaos.add(os);
      if (ano) acc.anos.add(ano);
      if (a.edicaoDate) acc.datas.push(a.edicaoDate);
      acc.atomIds.add(a.id);
    }

    for (const o of a.orgaos) {
      let acc = oAcc.get(o.slug);
      if (!acc) {
        acc = { nome: o.nome, sigla: o.sigla, anos: new Set(), datas: [], atomIds: new Set(), valor: 0, pessoas: new Set() };
        oAcc.set(o.slug, acc);
      }
      if (o.sigla && !acc.sigla) acc.sigla = o.sigla;
      if (ano) acc.anos.add(ano);
      if (a.edicaoDate) acc.datas.push(a.edicaoDate);
      acc.atomIds.add(a.id);
      acc.valor += Number.isFinite(valor) ? valor : 0;
      for (const ps of pessoaSlugs) acc.pessoas.add(ps);
    }
  }

  // Suffix-merge: "eduardo-da-cruz-rodrigues-flores" ⊂ "jose-eduardo-da-cruz-
  // rodrigues-flores" (primeiro nome perdido na extração). Funde o curto no longo.
  const slugsOrdenados = Array.from(pAcc.keys()).sort((a, b) => b.length - a.length);
  for (const longo of slugsOrdenados) {
    if (!pAcc.has(longo)) continue;
    const longTokens = longo.split("-");
    for (const curto of Array.from(pAcc.keys())) {
      if (curto === longo || !pAcc.has(curto)) continue;
      const curtoTokens = curto.split("-");
      if (curtoTokens.length < 3 || curtoTokens.length >= longTokens.length) continue;
      const sufixo = longTokens.slice(longTokens.length - curtoTokens.length).join("-");
      if (sufixo === curto) {
        // funde curto → longo
        const src = pAcc.get(curto)!;
        const dst = pAcc.get(longo)!;
        for (const s of src.slugs) dst.slugs.add(s);
        for (const [n, f] of src.nomeVariants) dst.nomeVariants.set(n, (dst.nomeVariants.get(n) ?? 0) + f);
        for (const x of src.papeis) dst.papeis.add(x);
        for (const x of src.cargos) dst.cargos.add(x);
        for (const x of src.orgaos) dst.orgaos.add(x);
        for (const x of src.anos) dst.anos.add(x);
        dst.datas.push(...src.datas);
        for (const x of src.atomIds) dst.atomIds.add(x);
        pAcc.delete(curto);
      }
    }
  }

  // Materializa pessoas.
  const pessoas: PessoaAgg[] = [];
  for (const [slug, acc] of pAcc) {
    const nome = nomeCanonico(acc.nomeVariants);
    const sobrenome = sobrenomeDe(nome);
    const [primeiraData, ultimaData] = minMax(acc.datas);
    pessoas.push({
      slug,
      nome,
      sobrenome,
      sobrenomeComum: SOBRENOMES_COMUNS.has(sobrenome),
      papeis: Array.from(acc.papeis),
      cargos: Array.from(acc.cargos),
      orgaos: Array.from(acc.orgaos),
      anos: Array.from(acc.anos).sort(),
      primeiraData,
      ultimaData,
      mencoes: acc.atomIds.size,
      atomIds: Array.from(acc.atomIds),
    });
  }
  pessoas.sort((a, b) => b.mencoes - a.mencoes);

  // Famílias: agrupa pessoas por sobrenome.
  const fMap = new Map<string, FamiliaAgg>();
  for (const p of pessoas) {
    const fslug = slugify(p.sobrenome);
    if (!fslug) continue;
    let f = fMap.get(fslug);
    if (!f) {
      f = {
        slug: fslug, sobrenome: p.sobrenome, comum: p.sobrenomeComum, totalPessoas: 0,
        pessoas: [], cargos: [], anos: [], primeiraData: null, ultimaData: null, mencoes: 0, atomIds: [],
      };
      fMap.set(fslug, f);
    }
    f.pessoas.push({ slug: p.slug, nome: p.nome, cargos: p.cargos });
    f.cargos = Array.from(new Set([...f.cargos, ...p.cargos]));
    f.anos = Array.from(new Set([...f.anos, ...p.anos])).sort();
    f.mencoes += p.mencoes;
    f.atomIds = Array.from(new Set([...f.atomIds, ...p.atomIds]));
  }
  const familias: FamiliaAgg[] = [];
  for (const f of fMap.values()) {
    f.totalPessoas = f.pessoas.length;
    const datas = f.atomIds.length ? atoms.filter((a) => f.atomIds.includes(a.id)).map((a) => a.edicaoDate).filter(Boolean) as string[] : [];
    [f.primeiraData, f.ultimaData] = minMax(datas);
    familias.push(f);
  }
  // Ordena: mais pessoas distintas primeiro, depois menções. Comuns vão pro fim.
  familias.sort((a, b) =>
    Number(a.comum) - Number(b.comum) || b.totalPessoas - a.totalPessoas || b.mencoes - a.mencoes);

  // Órgãos.
  const orgaos: OrgaoAgg[] = [];
  for (const [slug, acc] of oAcc) {
    const [primeiraData, ultimaData] = minMax(acc.datas);
    orgaos.push({
      slug, nome: acc.nome, sigla: acc.sigla, mencoes: acc.atomIds.size,
      valorTotal: Math.round(acc.valor), anos: Array.from(acc.anos).sort(),
      primeiraData, ultimaData, atomIds: Array.from(acc.atomIds), pessoas: Array.from(acc.pessoas),
    });
  }
  orgaos.sort((a, b) => b.mencoes - a.mencoes);

  return {
    geradoEm: new Date().toISOString(),
    totais: { pessoas: pessoas.length, familias: familias.length, orgaos: orgaos.length },
    pessoas,
    familias,
    orgaos,
  };
}
