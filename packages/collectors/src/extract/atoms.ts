/**
 * Extrator de ATOS ATÔMICOS do Diário Oficial de Americana.
 *
 * Pra cada edição (60 PDFs reais já raspados), baixa o PDF, extrai texto via
 * pdf-parse e identifica unidades discretas — leis, decretos, portarias,
 * contratos, etc. Cada match vira um "átomo" com posição no texto, número,
 * resumo curto em torno da match, CNPJs validados por checksum e valor R$
 * mais próximo (quando faz sentido pra contratos/licitações).
 *
 * Importante: NÃO inventa nada. Só registra o que está literalmente no texto.
 * Quando o regex erra (texto fora do padrão), o átomo simplesmente não é
 * criado — preferimos falso-negativo a falso-positivo (princípio TRUST).
 *
 * Saída: packages/collectors/data/diario-americana/atoms.json
 *
 * Uso: pnpm --filter @deolho/collectors extract:atoms
 */
import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { baixarPdf, extrairTextoPdf } from "../utils/pdf.js";
import { extrairCnpjs } from "../utils/documento.js";
import { compilarLote } from "../compile/index.js";

const IN_PATH = path.resolve(process.cwd(), "data/diario-americana/latest.json");
const OUT_PATH = path.resolve(process.cwd(), "data/diario-americana/atoms.json");

interface EdicaoMin {
  date: string | null;
  url: string;
  isExtra: boolean;
}

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
  /** Estável e único: <edicao>-<tipo>-<numero>-<ano>. */
  id: string;
  edicaoSlug: string;
  edicaoDate: string | null;
  tipo: TipoAto;
  numero: string;
  ano: string | null;
  /** "Lei nº 5.523/2024" */
  titulo: string;
  /** ~260 chars de contexto em torno do match. */
  resumo: string;
  /** Offset do match no texto extraído — pra deep-link futuro. */
  posicao: number;
  /** CNPJs validados (dígitos verificadores) na vizinhança do átomo. */
  cnpjsMencionados: string[];
  /** "R$ 1.240.000,00" — só pra tipos que tipicamente trazem valor. */
  valorMencionado: string | null;
}

const TIPOS: Array<{ tipo: TipoAto; padroes: RegExp[] }> = [
  {
    tipo: "lei",
    padroes: [
      /\b(?:LEI(?:\s+MUNICIPAL)?|Lei(?:\s+Municipal)?)\s+(?:N|n)[º°.\s]?\s*([\d.]+)(?:\s*\/\s*(\d{2,4}))?/g,
    ],
  },
  {
    tipo: "decreto",
    padroes: [/\b(?:DECRETO|Decreto)\s+(?:N|n)[º°.\s]?\s*([\d.]+)(?:\s*\/\s*(\d{2,4}))?/g],
  },
  {
    tipo: "portaria",
    padroes: [/\b(?:PORTARIA|Portaria)\s+(?:N|n)[º°.\s]?\s*([\d.]+)(?:\s*\/\s*(\d{2,4}))?/g],
  },
  {
    tipo: "resolucao",
    padroes: [
      /\b(?:RESOLU[ÇC][ÃA]O|Resolu[çc][ãa]o)\s+(?:N|n)[º°.\s]?\s*([\d.]+)(?:\s*\/\s*(\d{2,4}))?/g,
    ],
  },
  {
    tipo: "contrato",
    padroes: [/\b(?:CONTRATO|Contrato)\s+(?:N|n)[º°.\s]?\s*([\d.]+)(?:\s*\/\s*(\d{2,4}))?/g],
  },
  {
    tipo: "aditivo",
    padroes: [
      /\b(?:TERMO\s+ADITIVO|Termo\s+Aditivo|ADITIVO|Aditivo)\s+(?:N|n)[º°.\s]?\s*([\d.]+)(?:\s*\/\s*(\d{2,4}))?/g,
    ],
  },
  {
    tipo: "edital",
    padroes: [/\b(?:EDITAL|Edital)\s+(?:N|n)[º°.\s]?\s*([\d.]+)(?:\s*\/\s*(\d{2,4}))?/g],
  },
  {
    tipo: "pregao",
    padroes: [
      /\b(?:PREG[ÃA]O|Preg[ãa]o)(?:\s+(?:ELETR[ÔO]NICO|Eletr[ôo]nico|PRESENCIAL|Presencial))?\s+(?:N|n)[º°.\s]?\s*([\d.]+)(?:\s*\/\s*(\d{2,4}))?/g,
    ],
  },
  {
    tipo: "convite",
    padroes: [/\b(?:CARTA\s+CONVITE|Carta\s+Convite|CONVITE|Convite)\s+(?:N|n)[º°.\s]?\s*([\d.]+)(?:\s*\/\s*(\d{2,4}))?/g],
  },
  {
    tipo: "concorrencia",
    padroes: [
      /\b(?:CONCORR[ÊE]NCIA|Concorr[êe]ncia)\s+(?:N|n)[º°.\s]?\s*([\d.]+)(?:\s*\/\s*(\d{2,4}))?/g,
    ],
  },
  {
    tipo: "convenio",
    padroes: [
      /\b(?:CONV[ÊE]NIO|Conv[êe]nio)\s+(?:N|n)[º°.\s]?\s*([\d.]+)(?:\s*\/\s*(\d{2,4}))?/g,
    ],
  },
  {
    tipo: "ata_registro",
    padroes: [
      /\b(?:ATA\s+DE\s+REGISTRO\s+DE\s+PRE[ÇC]OS?|Ata\s+de\s+Registro\s+de\s+Pre[çc]os?)\s+(?:N|n)[º°.\s]?\s*([\d.]+)(?:\s*\/\s*(\d{2,4}))?/g,
    ],
  },
];

const TIPOS_COM_VALOR: TipoAto[] = ["contrato", "aditivo", "pregao", "convite", "concorrencia", "ata_registro"];

const VALOR_RE = /R\$\s*([\d.]+,\d{2})/;

function labelTipo(tipo: TipoAto): string {
  return {
    lei: "Lei",
    decreto: "Decreto",
    portaria: "Portaria",
    resolucao: "Resolução",
    contrato: "Contrato",
    aditivo: "Aditivo",
    edital: "Edital",
    pregao: "Pregão Eletrônico",
    convite: "Carta Convite",
    concorrencia: "Concorrência",
    convenio: "Convênio",
    ata_registro: "Ata de Registro de Preços",
  }[tipo];
}

function slugFromUrl(url: string): string {
  const file = url.split("/").pop() ?? url;
  return file.replace(/\.pdf$/i, "");
}

// Contexto amplo: o compiler (sections.ts) precisa de bastante texto pra
// encontrar CONTRATANTE/CONTRATADA/OBJETO/VALOR/PROCESSO de um contrato.
// 1500 chars cobre a maior parte dos atos sem aumentar muito o JSON.
function trechoEmTornoDe(texto: string, posicao: number, antes = 100, depois = 1400): string {
  const start = Math.max(0, posicao - antes);
  const end = Math.min(texto.length, posicao + depois);
  let trecho = texto.slice(start, end).replace(/\s+/g, " ").trim();
  if (start > 0) trecho = "…" + trecho;
  if (end < texto.length) trecho = trecho + "…";
  return trecho;
}

function valorMaisProximo(texto: string, posicao: number): string | null {
  // Procura R$ em uma janela à frente do match (até 800 chars).
  const fim = Math.min(texto.length, posicao + 800);
  const janela = texto.slice(posicao, fim);
  const m = janela.match(VALOR_RE);
  return m ? `R$ ${m[1]}` : null;
}

function extrairAtomosDoTexto(
  texto: string,
  edicaoSlug: string,
  edicaoDate: string | null,
): Atom[] {
  const out: Atom[] = [];
  // Dedup por (tipo, numero, ano) dentro da MESMA edição — texto repete a mesma
  // referência várias vezes, queremos uma só.
  const visto = new Set<string>();

  for (const { tipo, padroes } of TIPOS) {
    for (const padrao of padroes) {
      padrao.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = padrao.exec(texto))) {
        const numero = (m[1] ?? "").replace(/\.+$/, "").trim();
        if (!numero || numero === "0") continue;
        const ano = (m[2] ?? "").trim() || null;
        const key = `${tipo}-${numero}-${ano ?? ""}`;
        if (visto.has(key)) continue;
        visto.add(key);

        const posicao = m.index;
        const resumo = trechoEmTornoDe(texto, posicao);
        const cnpjs = extrairCnpjs(resumo);
        const valorMencionado = TIPOS_COM_VALOR.includes(tipo)
          ? valorMaisProximo(texto, posicao)
          : null;

        const idBase = `${edicaoSlug}-${tipo}-${numero}-${ano ?? "x"}`;
        const id = idBase.replace(/[^\w-]/g, "-").toLowerCase();

        out.push({
          id,
          edicaoSlug,
          edicaoDate,
          tipo,
          numero,
          ano,
          titulo: `${labelTipo(tipo)} nº ${numero}${ano ? "/" + ano : ""}`,
          resumo,
          posicao,
          cnpjsMencionados: cnpjs,
          valorMencionado,
        });
      }
    }
  }
  return out;
}

async function processarEdicao(e: EdicaoMin): Promise<Atom[]> {
  const slug = slugFromUrl(e.url);
  try {
    const buf = await baixarPdf(e.url);
    const texto = await extrairTextoPdf(buf);
    return extrairAtomosDoTexto(texto, slug, e.date);
  } catch (err) {
    console.warn(`[atoms] falha em ${slug}: ${err instanceof Error ? err.message : err}`);
    return [];
  }
}

async function processWithConcurrency<T, R>(
  items: T[],
  worker: (item: T) => Promise<R>,
  concurrency = 5,
): Promise<R[]> {
  const results: R[] = [];
  let i = 0;
  async function next(): Promise<void> {
    while (i < items.length) {
      const idx = i++;
      const r = await worker(items[idx]!);
      results.push(r);
      if (idx % 5 === 0 || idx === items.length - 1) {
        console.log(`[atoms] ${idx + 1}/${items.length} edições processadas`);
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => next()));
  return results;
}

async function main() {
  console.log(`[atoms] lendo ${IN_PATH}`);
  const snap = JSON.parse(await fs.readFile(IN_PATH, "utf8")) as { dados: EdicaoMin[] };
  const edicoes = snap.dados.filter((e) => e.url);
  console.log(`[atoms] processando ${edicoes.length} edições (concorrência 5)...`);

  const start = Date.now();
  const buckets = await processWithConcurrency(edicoes, processarEdicao, 5);
  const todos = buckets.flat();
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  // Estatística por tipo
  const porTipo: Record<string, number> = {};
  for (const a of todos) porTipo[a.tipo] = (porTipo[a.tipo] ?? 0) + 1;

  // Ordena por data (mais recente primeiro) — átomos sem data caem no fim
  todos.sort((a, b) => {
    if (!a.edicaoDate && !b.edicaoDate) return 0;
    if (!a.edicaoDate) return 1;
    if (!b.edicaoDate) return -1;
    return a.edicaoDate < b.edicaoDate ? 1 : -1;
  });

  // Civic Content Compiler — enriquece cada átomo com titulo humano,
  // campos estruturados, glossário e score de complexidade.
  console.log(`[atoms] compilando ${todos.length} átomos (zero LLM, regras determinísticas)...`);
  const compilados = compilarLote(todos);

  // Estatísticas de qualidade
  const comTituloHumano = compilados.filter((a) => a.tituloHumano).length;
  const comCampos = compilados.filter((a) => Object.keys(a.campos.dados).length > 0).length;
  const porComplexidade: Record<string, number> = {};
  for (const a of compilados) porComplexidade[a.complexidade.label] = (porComplexidade[a.complexidade.label] ?? 0) + 1;

  const saida = {
    geradoEm: new Date().toISOString(),
    totalAtomos: todos.length,
    edicoesProcessadas: edicoes.length,
    porTipo,
    qualidade: { comTituloHumano, comCampos, porComplexidade },
    atomos: compilados,
  };
  await fs.writeFile(OUT_PATH, JSON.stringify(saida, null, 2), "utf8");
  console.log(`[atoms] ${todos.length} átomos extraídos + compilados em ${elapsed}s → ${OUT_PATH}`);
  console.log("[atoms] distribuição por tipo:", porTipo);
  console.log(`[atoms] qualidade: ${comTituloHumano} com título humano, ${comCampos} com campos estruturados`);
  console.log("[atoms] complexidade:", porComplexidade);
}

if (process.argv[1]?.endsWith("atoms.ts") || process.argv[1]?.endsWith("atoms.js")) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
