/**
 * Loader server-side dos ÁTOMOS extraídos do Diário de Americana.
 *
 * Cada átomo é uma unidade de conteúdo do feed cívico (lei, decreto, portaria,
 * contrato, pregão, etc.) com posição no texto, número, resumo e CNPJs/valores
 * detectados na vizinhança. O extrator (packages/collectors/src/extract/atoms.ts)
 * gera atoms.json a partir dos 60 PDFs reais.
 *
 * Quando o pipeline DB entrar em produção, substituir por queries em
 * gazette_atoms (ou nome correspondente) no @deolho/db.
 */
import "server-only";
import fs from "node:fs/promises";
import path from "node:path";

export type TipoAto =
  | "lei"
  | "decreto"
  | "portaria"
  | "resolucao"
  | "contrato"
  | "aditivo"
  | "edital"
  | "pregao"
  | "convite"
  | "concorrencia"
  | "convenio"
  | "ata_registro";

export interface Atom {
  id: string;
  edicaoSlug: string;
  edicaoDate: string | null;
  tipo: TipoAto;
  numero: string;
  ano: string | null;
  titulo: string;
  resumo: string;
  posicao: number;
  cnpjsMencionados: string[];
  valorMencionado: string | null;
}

interface AtomsFile {
  geradoEm: string;
  totalAtomos: number;
  edicoesProcessadas: number;
  porTipo: Record<TipoAto, number>;
  atomos: Atom[];
}

const ATOMS_JSON = path.resolve(
  process.cwd(),
  "..",
  "..",
  "packages",
  "collectors",
  "data",
  "diario-americana",
  "atoms.json",
);

let _cache: AtomsFile | null = null;

async function load(): Promise<AtomsFile> {
  if (_cache) return _cache;
  const raw = await fs.readFile(ATOMS_JSON, "utf8");
  _cache = JSON.parse(raw) as AtomsFile;
  return _cache;
}

/** Categoria visual do feed — agrupamento de tipos por "tema". */
export type CategoriaFeed = "tudo" | "dinheiro" | "leis" | "atos" | "convenios";

const POR_CATEGORIA: Record<CategoriaFeed, TipoAto[]> = {
  tudo: [],
  dinheiro: ["contrato", "aditivo", "pregao", "convite", "concorrencia", "ata_registro", "edital"],
  leis: ["lei"],
  atos: ["decreto", "portaria", "resolucao"],
  convenios: ["convenio"],
};

export function categoriaIncludes(cat: CategoriaFeed, tipo: TipoAto): boolean {
  if (cat === "tudo") return true;
  return POR_CATEGORIA[cat].includes(tipo);
}

/**
 * Retorna átomos filtrados por categoria, opcionalmente paginado.
 * Aplica filtros de qualidade leves:
 *  - "leis" muito antigas (ano < edição_ano - 5) são citações de lei
 *    federal/estadual, não atos novos do município — escondidas por padrão.
 */
export async function getAtoms(
  options: { categoria?: CategoriaFeed; limit?: number; tipo?: TipoAto } = {},
): Promise<Atom[]> {
  const { categoria = "tudo", limit, tipo } = options;
  const data = await load();
  let lista = data.atomos.filter((a) => categoriaIncludes(categoria, a.tipo));
  if (tipo) lista = lista.filter((a) => a.tipo === tipo);

  // Heurística anti-citação: lei muito antiga referenciada num diário recente
  // quase sempre é citação (ex.: Lei 8.666/93 mencionada no diário de 2025).
  lista = lista.filter((a) => {
    if (a.tipo !== "lei" || !a.ano || !a.edicaoDate) return true;
    const anoEd = Number(a.edicaoDate.slice(0, 4));
    const anoLei = Number(a.ano);
    if (Number.isNaN(anoEd) || Number.isNaN(anoLei)) return true;
    // Se a lei é de >5 anos antes da edição, é referência (filtrada da home).
    return anoLei >= anoEd - 5;
  });

  return limit ? lista.slice(0, limit) : lista;
}

export async function getAtomPorId(id: string): Promise<Atom | null> {
  const data = await load();
  return data.atomos.find((a) => a.id === id) ?? null;
}

export async function getAtomsPorEdicao(edicaoSlug: string): Promise<Atom[]> {
  const data = await load();
  return data.atomos.filter((a) => a.edicaoSlug === edicaoSlug);
}

export async function getAtomsPorCnpj(cnpj: string): Promise<Atom[]> {
  const data = await load();
  const doc = cnpj.replace(/\D+/g, "");
  return data.atomos.filter((a) => a.cnpjsMencionados.includes(doc));
}

export async function getAtomsStats(): Promise<{
  total: number;
  porTipo: Record<TipoAto, number>;
  edicoesProcessadas: number;
  geradoEm: string;
}> {
  const data = await load();
  return {
    total: data.totalAtomos,
    porTipo: data.porTipo,
    edicoesProcessadas: data.edicoesProcessadas,
    geradoEm: data.geradoEm,
  };
}

// ── Helpers de apresentação ──────────────────────────────────────────────────

export const TIPO_META: Record<
  TipoAto,
  { label: string; emoji: string; cor: string; cat: CategoriaFeed }
> = {
  lei: { label: "Lei", emoji: "📜", cor: "from-amber-100 to-rose-100", cat: "leis" },
  decreto: { label: "Decreto", emoji: "📃", cor: "from-sky-100 to-emerald-100", cat: "atos" },
  portaria: { label: "Portaria", emoji: "🔖", cor: "from-violet-100 to-sky-100", cat: "atos" },
  resolucao: { label: "Resolução", emoji: "📑", cor: "from-violet-100 to-sky-100", cat: "atos" },
  contrato: { label: "Contrato", emoji: "📋", cor: "from-emerald-100 to-teal-100", cat: "dinheiro" },
  aditivo: { label: "Aditivo", emoji: "🧾", cor: "from-orange-100 to-amber-100", cat: "dinheiro" },
  edital: { label: "Edital", emoji: "📣", cor: "from-rose-100 to-amber-100", cat: "dinheiro" },
  pregao: { label: "Pregão", emoji: "🔨", cor: "from-rose-100 to-violet-100", cat: "dinheiro" },
  convite: { label: "Convite", emoji: "✉️", cor: "from-amber-100 to-rose-100", cat: "dinheiro" },
  concorrencia: { label: "Concorrência", emoji: "🏷️", cor: "from-rose-100 to-amber-100", cat: "dinheiro" },
  convenio: { label: "Convênio", emoji: "🤝", cor: "from-emerald-100 to-sky-100", cat: "convenios" },
  ata_registro: { label: "Ata de Preços", emoji: "🪙", cor: "from-emerald-100 to-amber-100", cat: "dinheiro" },
};

export function tipoLabel(t: TipoAto): string {
  return TIPO_META[t].label;
}
