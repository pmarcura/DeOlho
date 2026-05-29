/**
 * Loader do índice de ENTIDADES (entidades.json) gerado pelo compiler.
 *
 * Pessoas (agentes públicos), famílias (coocorrência de sobrenome) e órgãos —
 * cada um com os atomIds onde foi citado, pra montar "ver tudo que conecta com
 * isso". Defensivo: se o arquivo não existir (checkout sem rodar o coletor),
 * devolve índice vazio em vez de quebrar a página.
 */
import "server-only";
import fs from "node:fs/promises";
import path from "node:path";

export type PapelPessoa =
  | "signatario" | "nomeado" | "exonerado" | "designado" | "revogado" | "citado";

export interface PessoaAgg {
  slug: string;
  nome: string;
  sobrenome: string;
  sobrenomeComum: boolean;
  papeis: PapelPessoa[];
  cargos: string[];
  orgaos: string[];
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
  pessoas: string[];
}

interface EntidadesIndex {
  geradoEm: string;
  totais: { pessoas: number; familias: number; orgaos: number };
  pessoas: PessoaAgg[];
  familias: FamiliaAgg[];
  orgaos: OrgaoAgg[];
}

const VAZIO: EntidadesIndex = {
  geradoEm: "",
  totais: { pessoas: 0, familias: 0, orgaos: 0 },
  pessoas: [],
  familias: [],
  orgaos: [],
};

const ENTIDADES_JSON = path.resolve(
  process.cwd(),
  "..",
  "..",
  "packages",
  "collectors",
  "data",
  "diario-americana",
  "entidades.json",
);

let _cache: EntidadesIndex | null = null;

async function load(): Promise<EntidadesIndex> {
  if (_cache) return _cache;
  try {
    const raw = await fs.readFile(ENTIDADES_JSON, "utf8");
    _cache = JSON.parse(raw) as EntidadesIndex;
  } catch {
    _cache = VAZIO;
  }
  return _cache;
}

// ── Pessoas ──────────────────────────────────────────────────────────────────

export async function getPessoa(slug: string): Promise<PessoaAgg | null> {
  const d = await load();
  return d.pessoas.find((p) => p.slug === slug) ?? null;
}

export async function getPessoas(limit?: number): Promise<PessoaAgg[]> {
  const d = await load();
  return limit ? d.pessoas.slice(0, limit) : d.pessoas;
}

// ── Famílias ─────────────────────────────────────────────────────────────────

export async function getFamilia(slug: string): Promise<FamiliaAgg | null> {
  const d = await load();
  return d.familias.find((f) => f.slug === slug) ?? null;
}

export async function getFamilias(opts: { incluirComuns?: boolean; limit?: number } = {}): Promise<FamiliaAgg[]> {
  const d = await load();
  let lista = d.familias;
  if (!opts.incluirComuns) lista = lista.filter((f) => !f.comum);
  return opts.limit ? lista.slice(0, opts.limit) : lista;
}

// ── Órgãos ───────────────────────────────────────────────────────────────────

export async function getOrgao(slug: string): Promise<OrgaoAgg | null> {
  const d = await load();
  return d.orgaos.find((o) => o.slug === slug) ?? null;
}

export async function getOrgaos(limit?: number): Promise<OrgaoAgg[]> {
  const d = await load();
  return limit ? d.orgaos.slice(0, limit) : d.orgaos;
}

export async function getTotais(): Promise<EntidadesIndex["totais"]> {
  return (await load()).totais;
}
