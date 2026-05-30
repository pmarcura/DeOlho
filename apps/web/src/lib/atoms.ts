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

// Campos estruturados extraídos pelo Civic Content Compiler (collectors/compile/).
export interface CamposContrato {
  contratante?: string;
  contratada?: string;
  objeto?: string;
  valor?: string;
  valorNum?: number;
  processo?: string;
  modalidade?: string;
  fundamento?: string;
  vigencia?: string;
  prazo?: string;
}
export interface CamposLei {
  ementa?: string;
  citacoes?: string[];
}
export interface CamposPortaria {
  ato?: string;
  ementa?: string;
  agente?: string;
  cargo?: string;
  fundamento?: string;
}
export interface CamposPregao {
  objeto?: string;
  processo?: string;
  modalidade?: string;
  abertura?: string;
  estado?: "aberto" | "suspenso" | "anulado" | "homologado" | "deserto" | "indefinido";
}
export type Campos =
  | { tipo: "contrato" | "aditivo"; dados: CamposContrato }
  | { tipo: "lei"; dados: CamposLei }
  | { tipo: "portaria" | "decreto" | "resolucao"; dados: CamposPortaria }
  | { tipo: "edital" | "pregao" | "concorrencia" | "convite" | "ata_registro" | "convenio"; dados: CamposPregao };

export interface ComplexidadeUI {
  nivel: 1 | 2 | 3 | 4 | 5;
  label: "muito fácil" | "fácil" | "médio" | "técnico" | "muito técnico";
  tempoLeitura: number;
  stats?: Record<string, number>;
}

export type PapelPessoa =
  | "signatario" | "nomeado" | "exonerado" | "designado" | "revogado" | "citado";

export interface PessoaCitada {
  nome: string;
  slug: string;
  sobrenome: string;
  papel: PapelPessoa;
  cargo: string | null;
}

export interface OrgaoCitado {
  nome: string;
  slug: string;
  sigla: string | null;
}

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
  // Enriquecimento do Civic Content Compiler (opcionais — alguns átomos podem
  // não ter tudo se o compiler não conseguiu extrair).
  tituloHumano?: string | null;
  subtitulo?: string | null;
  campos?: Campos;
  glossario?: Array<{ termo: string; definicao: string }>;
  complexidade?: ComplexidadeUI;
  resumoLimpo?: string;
  /** Texto fiel ao documento, legível (começa no ato, sem boilerplate). */
  textoDocumento?: string;
  /** Agentes públicos citados (signatário + nomeado/exonerado), com cargo. */
  pessoas?: PessoaCitada[];
  /** Órgãos citados (Secretarias, DAE, Guarda Municipal…). */
  orgaos?: OrgaoCitado[];
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

// Estrutura vazia para quando os dados ainda não foram coletados (ex.: checkout
// limpo no CI, ou primeiro deploy antes do pipeline rodar). O app renderiza vazio
// em vez de quebrar — mesma filosofia do collector ("coleta não falha").
const VAZIO: AtomsFile = {
  geradoEm: "",
  totalAtomos: 0,
  edicoesProcessadas: 0,
  porTipo: {} as Record<TipoAto, number>,
  atomos: [],
};

async function load(): Promise<AtomsFile> {
  if (_cache) return _cache;
  try {
    const raw = await fs.readFile(ATOMS_JSON, "utf8");
    _cache = JSON.parse(raw) as AtomsFile;
  } catch {
    // atoms.json ausente (não versionado) ou ilegível: degrada para vazio.
    _cache = VAZIO;
  }
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

/** Átomos por lista de ids, preservando a ordem cronológica do feed. */
export async function getAtomsPorIds(ids: string[]): Promise<Atom[]> {
  const data = await load();
  const set = new Set(ids);
  return data.atomos.filter((a) => set.has(a.id));
}

/**
 * Átomos que mencionam um nº de processo. O slug vem como "818-2025" /
 * "11-634-2025"; reconstruímos um regex tolerante a separadores (.,/) pra achar
 * "11.634/2025" no texto. Resposta a "processo… clicar e ver tudo que conecta".
 */
export async function getAtomsPorProcesso(numeroSlug: string): Promise<Atom[]> {
  const partes = numeroSlug.split("-").filter((p) => /^\d+$/.test(p));
  if (partes.length < 2) return [];
  const re = new RegExp(`\\b${partes.join("\\D{0,3}")}\\b`);
  const data = await load();
  return data.atomos.filter((a) => re.test(a.resumo));
}

/** Átomos de um ano — pela data da edição OU pelo ano do próprio ato. */
export async function getAtomsPorAno(ano: string): Promise<Atom[]> {
  const data = await load();
  return data.atomos.filter(
    (a) => a.ano === ano || (a.edicaoDate?.slice(0, 4) === ano),
  );
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

function parsearValor(s: string | null | undefined): number {
  if (!s) return 0;
  const m = s.match(/R\$\s*([\d.]+,\d{2})/);
  if (!m) return 0;
  return Number.parseFloat(m[1]!.replace(/\./g, "").replace(",", "."));
}

function scoreAtomo(a: Atom, hojeMs = Date.now()): number {
  let s = PESO_TIPO[a.tipo];

  // Valor R$ — log scale (R$ 1M ≠ 1000× R$ 1k, mas pesa mais)
  const valor = parsearValor(a.valorMencionado);
  if (valor > 0) {
    s += Math.min(40, Math.log10(valor) * 8); // log10(1k)=3 → +24; log10(1M)=6 → +40 (cap)
  }

  // CNPJ — múltiplos pesam mais (até 3)
  if (a.cnpjsMencionados.length > 0) s += 15 * Math.min(a.cnpjsMencionados.length, 3);

  // Título humano e campos estruturados = melhor pra ler
  if (a.tituloHumano) s += 10;
  if (a.campos && Object.keys((a.campos as { dados: object }).dados).length >= 3) s += 8;

  // Freshness
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
 * Versão ranqueada com DIVERSIDADE: depois de ordenar por score, aplica uma
 * penalidade leve em átomos do mesmo tipo/empresa consecutivos. Resultado:
 * o feed mistura conteúdos em vez de mostrar 5 contratos seguidos da mesma
 * empresa.
 */
export async function getAtomsRanqueados(
  options: { categoria?: CategoriaFeed; limit?: number; tipo?: TipoAto } = {},
): Promise<Atom[]> {
  const lista = await getAtoms({ ...options, limit: undefined });
  if (lista.length === 0) return [];

  // Ranqueia inicialmente
  const ranked = [...lista]
    .map((a) => ({ atom: a, score: scoreAtomo(a) }))
    .sort((a, b) => b.score - a.score);

  // Aplica re-ranking com diversidade (round-robin leve)
  const out: Atom[] = [];
  const ultimosTipos: string[] = [];
  const ultimasEmpresas: string[] = [];
  const usados = new Set<string>();

  while (out.length < ranked.length) {
    let bestIdx = -1;
    let bestScore = -Infinity;
    for (let i = 0; i < ranked.length; i++) {
      if (usados.has(ranked[i]!.atom.id)) continue;
      const a = ranked[i]!.atom;
      let s = ranked[i]!.score;
      // Penalidade se o tipo apareceu nas 2 últimas posições
      if (ultimosTipos.slice(-2).includes(a.tipo)) s -= 8;
      // Penalidade se algum CNPJ apareceu nas 3 últimas posições
      for (const c of a.cnpjsMencionados) {
        if (ultimasEmpresas.slice(-3).includes(c)) { s -= 12; break; }
      }
      if (s > bestScore) { bestScore = s; bestIdx = i; }
    }
    if (bestIdx === -1) break;
    const escolhido = ranked[bestIdx]!.atom;
    out.push(escolhido);
    usados.add(escolhido.id);
    ultimosTipos.push(escolhido.tipo);
    for (const c of escolhido.cnpjsMencionados) ultimasEmpresas.push(c);
  }

  return options.limit ? out.slice(0, options.limit) : out;
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
