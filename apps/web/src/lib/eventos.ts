/**
 * Read model da LINHA DO TEMPO CÍVICA — lê os eventos reais do banco canônico
 * (civic_events) populado pelos coletores (PNCP, TCE-SP, Diário, CEIS…).
 *
 * É a ponte que torna VISÍVEL a fundação cívica: ~130 mil acontecimentos
 * verificáveis de Americana, cada um com fonte, data e (quando há) valor.
 *
 * Resiliente: se DATABASE_URL não estiver definida (ex.: build no CI sem banco),
 * degrada para vazio em vez de quebrar — mesma filosofia do loader de átomos.
 */
import "server-only";
import { createDb, schema, type DB, desc, eq, sql } from "@deolho/db";

const { civicEvents } = schema;

export type CategoriaEvento =
  | "pagamento"
  | "receita"
  | "contratacao"
  | "ato_normativo"
  | "nomeacao_exoneracao"
  | "sancao"
  | "audiencia_conselho"
  | "obra_zeladoria";

export interface EventoCivico {
  id: string;
  categoria: string;
  tipo: string;
  titulo: string;
  resumo: string | null;
  dataEvento: string | null;
  valor: string | null;
  sourceId: string;
  sourceUrl: string | null;
  publishedAt: Date | null;
  fetchedAt: Date | null;
  limitacoes: unknown;
  trustType: string;
}

let _db: DB | null | undefined;

/** Conexão lazy. null se não houver DATABASE_URL (degrada para vazio). */
function getDb(): DB | null {
  if (_db !== undefined) return _db;
  const url = process.env.DATABASE_URL;
  _db = url ? createDb(url, { max: 3 }) : null;
  return _db;
}

export interface FiltroEventos {
  categoria?: CategoriaEvento;
  limit?: number;
  offset?: number;
}

/** Eventos mais recentes primeiro (sem data caem no fim). */
export async function getEventos(filtro: FiltroEventos = {}): Promise<EventoCivico[]> {
  const db = getDb();
  if (!db) return [];
  const { categoria, limit = 50, offset = 0 } = filtro;
  try {
    const rows = await db
      .select({
        id: civicEvents.id,
        categoria: civicEvents.categoria,
        tipo: civicEvents.tipo,
        titulo: civicEvents.titulo,
        resumo: civicEvents.resumo,
        dataEvento: civicEvents.dataEvento,
        valor: civicEvents.valor,
        sourceId: civicEvents.sourceId,
        sourceUrl: civicEvents.sourceUrl,
        publishedAt: civicEvents.publishedAt,
        fetchedAt: civicEvents.fetchedAt,
        limitacoes: civicEvents.limitacoes,
        trustType: civicEvents.trustType,
      })
      .from(civicEvents)
      .where(categoria ? eq(civicEvents.categoria, categoria) : undefined)
      .orderBy(sql`${civicEvents.dataEvento} desc nulls last`, desc(civicEvents.criadoEm))
      .limit(Math.min(limit, 200))
      .offset(offset);
    return rows as EventoCivico[];
  } catch (e) {
    console.warn(`[eventos] query falhou (${e instanceof Error ? e.message : e}) — degradando para vazio`);
    return [];
  }
}

export interface EstatEventos {
  total: number;
  porCategoria: Array<{ categoria: string; total: number }>;
}

/** Contagem total + por categoria, para o cabeçalho e os filtros. */
export async function getEventosStats(): Promise<EstatEventos> {
  const db = getDb();
  if (!db) return { total: 0, porCategoria: [] };
  try {
    const rows = await db
      .select({ categoria: civicEvents.categoria, total: sql<number>`count(*)::int` })
      .from(civicEvents)
      .groupBy(civicEvents.categoria)
      .orderBy(sql`count(*) desc`);
    const total = rows.reduce((acc, r) => acc + Number(r.total), 0);
    return { total, porCategoria: rows.map((r) => ({ categoria: r.categoria, total: Number(r.total) })) };
  } catch (e) {
    console.warn(`[eventos] stats falhou (${e instanceof Error ? e.message : e})`);
    return { total: 0, porCategoria: [] };
  }
}

// ── Algoritmo do feed — dá "vida" à rede social ──────────────────────────────
/**
 * Ranking de relevância: sem ele o feed seria 124k pagamentos por data. Pesa
 * tipo (contrato/sanção no topo, pagamento no fim), valor (log) e recência (leve,
 * porque os dados se concentram nos últimos meses). Depois aplica diversidade
 * pra não repetir a mesma categoria em sequência — feed que "respira".
 */
export interface EventoRanqueado extends EventoCivico {
  entidades: { fornecedorDocumento?: string | null; orgaoNome?: string | null } | null;
}

// Score de relevância (texto SQL reutilizado no select e no row_number).
const SCORE_SQL = `(
  case categoria
    when 'contratacao' then 30 when 'sancao' then 28
    when 'ato_normativo' then 16 when 'nomeacao_exoneracao' then 14
    when 'obra_zeladoria' then 14 when 'audiencia_conselho' then 10
    when 'receita' then 8 when 'pagamento' then 2 else 5 end
  + least(40, coalesce(ln(greatest(valor, 1)) * 3, 0))
  + case when data_evento is null then 0
      when current_date - data_evento < 30 then 20
      when current_date - data_evento < 90 then 12
      when current_date - data_evento < 365 then 5 else 0 end
)`;

/**
 * Round-robin por categoria: pega 1 de cada categoria por rodada (cada grupo já
 * vem ordenado por score). Garante que sanções/atos/nomeações apareçam no topo do
 * feed em vez de serem afogados por contratos — feed variado, que "respira".
 */
function diversificar<T extends { categoria: string }>(rows: T[]): T[] {
  const grupos = new Map<string, T[]>();
  for (const r of rows) {
    const g = grupos.get(r.categoria);
    if (g) g.push(r);
    else grupos.set(r.categoria, [r]);
  }
  const ordem = [...grupos.keys()]; // ordem de primeira aparição = por score
  const out: T[] = [];
  let restam = true;
  while (restam) {
    restam = false;
    for (const cat of ordem) {
      const g = grupos.get(cat)!;
      if (g.length) {
        out.push(g.shift()!);
        restam = true;
      }
    }
  }
  return out;
}

/**
 * Feed vivo: usa COTAS por categoria (row_number) pra garantir variedade — sem
 * isso, contratos (score alto) afogariam sanções, atos e nomeações. Depois ordena
 * por score e diversifica. Quando há filtro de categoria, traz só ela (sem cota).
 */
export async function getEventosRanqueados(filtro: FiltroEventos = {}): Promise<EventoRanqueado[]> {
  const db = getDb();
  if (!db) return [];
  const { categoria, limit = 30 } = filtro;
  const cotaPorCategoria = categoria ? 120 : 14; // sem filtro: até 14 de cada categoria
  try {
    const result = await db.execute(sql`
      select id, categoria, tipo, titulo, resumo, valor::text as valor,
             source_id as "sourceId", source_url as "sourceUrl",
             data_evento as "dataEvento", entidades,
             published_at as "publishedAt", fetched_at as "fetchedAt",
             limitacoes, trust_type as "trustType"
      from (
        select *, ${sql.raw(SCORE_SQL)} as _score,
          row_number() over (partition by categoria order by ${sql.raw(SCORE_SQL)} desc, data_evento desc nulls last) as _rn
        from civic_events
        ${categoria ? sql`where categoria = ${categoria}` : sql``}
      ) t
      where _rn <= ${cotaPorCategoria}
      order by _score desc
      limit 120
    `);
    const rows = (Array.isArray(result) ? result : (result as { rows?: unknown[] }).rows ?? []) as EventoRanqueado[];
    return diversificar(rows).slice(0, limit);
  } catch (e) {
    console.warn(`[eventos] ranking falhou (${e instanceof Error ? e.message : e})`);
    return [];
  }
}

// ── Apresentação legível (linguagem pro cidadão comum) ───────────────────────

export const CATEGORIA_META: Record<
  string,
  { label: string; emoji: string; frase: string }
> = {
  pagamento: { label: "Pagamento", emoji: "💸", frase: "a prefeitura pagou" },
  receita: { label: "Receita", emoji: "🪙", frase: "a prefeitura recebeu" },
  contratacao: { label: "Contrato", emoji: "📋", frase: "a prefeitura contratou" },
  ato_normativo: { label: "Ato oficial", emoji: "📜", frase: "foi publicado no diário" },
  nomeacao_exoneracao: { label: "Nomeação/Exoneração", emoji: "👤", frase: "mudança de cargo público" },
  sancao: { label: "Sanção", emoji: "⚠️", frase: "empresa com sanção registrada" },
  audiencia_conselho: { label: "Audiência/Conselho", emoji: "🏛️", frase: "reunião pública" },
  obra_zeladoria: { label: "Obra/Zeladoria", emoji: "🚧", frase: "obra ou serviço urbano" },
};

export function categoriaMeta(cat: string) {
  return CATEGORIA_META[cat] ?? { label: cat, emoji: "•", frase: "" };
}

/** Fonte em linguagem humana. */
export function fonteLabel(sourceId: string): string {
  const map: Record<string, string> = {
    pncp: "Portal Nacional de Contratações (PNCP)",
    "tce-sp": "Tribunal de Contas do Estado (TCE-SP)",
    "diario-americana": "Diário Oficial de Americana",
    "querido-diario": "Querido Diário",
    "cgu-transparencia": "Portal da Transparência (CGU)",
    "transparencia-americana": "Transparência Americana",
    "camara-americana": "Câmara Municipal de Americana",
    "receita-cnpj": "Receita Federal (CNPJ)",
    tse: "Justiça Eleitoral (TSE)",
  };
  return map[sourceId] ?? sourceId;
}

/** "R$ 56.424,00" ou null se sem valor. */
export function valorBRL(valor: string | null): string | null {
  if (!valor) return null;
  const n = Number(valor);
  if (Number.isNaN(n) || n === 0) return null;
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** "19 de maio de 2026" ou "sem data". */
export function dataExtensa(iso: string | null): string {
  if (!iso) return "sem data";
  return new Date(iso + "T12:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
