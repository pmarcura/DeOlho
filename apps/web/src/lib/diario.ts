/**
 * Loader REAL do Diário Oficial de Americana.
 *
 * Lê o JSON raspado pelo coletor (`packages/collectors/data/diario-americana/latest.json`)
 * em runtime, server-side. 60 edições reais com PDFs reais (PDFs em www.americana.sp.gov.br).
 *
 * Quando a ingestão entrar no Postgres, substituir por query no @deolho/db.
 * Por enquanto, ler o JSON é o caminho mais honesto — é o dado que existe.
 */
import "server-only";
import fs from "node:fs/promises";
import path from "node:path";

export interface EdicaoDiario {
  /** ISO YYYY-MM-DD, ou null pra edições destacadas sem data inline. */
  date: string | null;
  /** URL absoluta do PDF (sempre em www.americana.sp.gov.br/download/diarioOficial/<hash>.pdf). */
  url: string;
  edition: string | null;
  /** True quando vem da página de edições extras. */
  isExtra: boolean;
  /** Slug derivado do hash do PDF — estável e único por edição. */
  slug: string;
}

interface RawSnapshot {
  fonte: string;
  coletadoEm: string;
  municipio: string;
  ibge: string;
  totalRegistros: number;
  dados: Array<{ date: string | null; url: string; edition: string | null; isExtra: boolean }>;
  erros: string[];
}

const DIARIO_JSON_PATH = path.resolve(
  process.cwd(),
  "..",
  "..",
  "packages",
  "collectors",
  "data",
  "diario-americana",
  "latest.json",
);

function slugFromUrl(url: string): string {
  const file = url.split("/").pop() ?? url;
  return file.replace(/\.pdf$/i, "");
}

async function loadRaw(): Promise<RawSnapshot> {
  const raw = await fs.readFile(DIARIO_JSON_PATH, "utf8");
  return JSON.parse(raw) as RawSnapshot;
}

/**
 * Retorna edições ordenadas (mais recentes primeiro). Edições sem data caem no fim.
 */
export async function getDiarioEdicoes(): Promise<EdicaoDiario[]> {
  const snap = await loadRaw();
  return snap.dados
    .map((d) => ({ ...d, slug: slugFromUrl(d.url) }))
    .sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return a.date < b.date ? 1 : -1;
    });
}

export async function getEdicaoPorSlug(slug: string): Promise<EdicaoDiario | null> {
  const todas = await getDiarioEdicoes();
  return todas.find((e) => e.slug === slug) ?? null;
}

export async function getDiarioMeta(): Promise<{
  total: number;
  ultimaColeta: string;
  municipio: string;
}> {
  const snap = await loadRaw();
  return {
    total: snap.totalRegistros,
    ultimaColeta: snap.coletadoEm,
    municipio: snap.municipio,
  };
}

// ── Helpers de apresentação ──────────────────────────────────────────────────

/** "ontem", "hoje", "há 3 dias", ou "dd/mm". Tom conversacional, mobile-friendly. */
export function dataAmigavel(iso: string | null, agora = new Date()): string {
  if (!iso) return "sem data";
  const data = new Date(iso + "T12:00:00");
  const diffMs = agora.getTime() - data.getTime();
  const dias = Math.floor(diffMs / 86_400_000);
  if (dias === 0) return "hoje";
  if (dias === 1) return "ontem";
  if (dias < 7) return `há ${dias} dias`;
  if (dias < 30) return `há ${Math.floor(dias / 7)} sem`;
  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

/** Texto longo: "19 de maio de 2026" */
export function dataExtensa(iso: string | null): string {
  if (!iso) return "sem data";
  return new Date(iso + "T12:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
