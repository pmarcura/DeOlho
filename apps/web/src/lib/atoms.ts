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

// ── Algoritmo de relevância ──────────────────────────────────────────────────
// O feed não é só "cronológico cego". Atos de dinheiro pesam mais, com CNPJ
// pesa mais, recente pesa mais. Resultado: o usuário vê o que importa primeiro.
const PESO_TIPO: Record<TipoAto, number> = {
  contrato: 30,
  pregao: 25,
  edital: 20,
  concorrencia: 20,
  ata_registro: 15,
  aditivo: 12,
  convite: 10,
  convenio: 10,
  lei: 5,
  decreto: 3,
  resolucao: 2,
  portaria: 1,
};

function scoreAtomo(a: Atom, hojeMs = Date.now()): number {
  let s = PESO_TIPO[a.tipo];
  if (a.valorMencionado) s += 25;
  if (a.cnpjsMencionados.length > 0) s += 15 * Math.min(a.cnpjsMencionados.length, 3);
  if (a.edicaoDate) {
    const dias = (hojeMs - new Date(a.edicaoDate + "T12:00:00").getTime()) / 86_400_000;
    if (dias < 7) s += 25;
    else if (dias < 30) s += 15;
    else if (dias < 90) s += 8;
    else if (dias < 365) s += 3;
  }
  return s;
}

/**
 * Versão ranqueada do feed — substitui ordering cronológico cego por relevância.
 * Mesma assinatura de getAtoms; usar nas páginas de feed (Home, Radar).
 */
export async function getAtomsRanqueados(
  options: { categoria?: CategoriaFeed; limit?: number; tipo?: TipoAto } = {},
): Promise<Atom[]> {
  const lista = await getAtoms({ ...options, limit: undefined });
  const ordenada = [...lista].sort((a, b) => scoreAtomo(b) - scoreAtomo(a));
  return options.limit ? ordenada.slice(0, options.limit) : ordenada;
}

// ── Limpeza leve do resumo ───────────────────────────────────────────────────
/**
 * Limpa noise comum de extração de PDF: espaços múltiplos, hifenizações de
 * quebra de linha, sequências "…". Não é normalização de NLP — só ajustes
 * cosméticos pra leitura ficar mais fluida.
 */
export function limparResumo(t: string): string {
  return t
    .replace(/\s+/g, " ")
    .replace(/(\w)-\s(\w)/g, "$1$2") // junta palavras hifenizadas pela quebra
    .replace(/…\s*/g, "… ")
    .trim();
}

// ── Top entidades (CNPJs mais mencionados) ───────────────────────────────────
/**
 * Empresas em destaque no diário — CNPJs ordenados pelo nº de átomos
 * em que aparecem. Usado em /explorar pra ranking de "empresas em alta".
 */
export async function getTopCnpjs(limit = 10): Promise<Array<{ cnpj: string; mencoes: number }>> {
  const data = await load();
  const cont: Record<string, number> = {};
  for (const a of data.atomos) {
    for (const c of a.cnpjsMencionados) cont[c] = (cont[c] ?? 0) + 1;
  }
  return Object.entries(cont)
    .map(([cnpj, mencoes]) => ({ cnpj, mencoes }))
    .sort((a, b) => b.mencoes - a.mencoes)
    .slice(0, limit);
}

// ── Resolver referência cruzada ──────────────────────────────────────────────
/**
 * "lei-6274-2019" → todos os átomos onde (tipo=lei, numero=6274, ano=2019).
 * Usado em /ref/[slug] pra mostrar "tudo que correlaciona com essa lei".
 */
export async function getAtomsPorRef(
  tipo: TipoAto,
  numero: string,
  ano: string | null,
): Promise<Atom[]> {
  const data = await load();
  const numLimpo = numero.replace(/\./g, "");
  return data.atomos.filter(
    (a) =>
      a.tipo === tipo &&
      a.numero.replace(/\./g, "") === numLimpo &&
      (ano === null || a.ano === ano),
  );
}
