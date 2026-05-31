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
  territorio: unknown;
  sourceId: string;
  sourceUrl: string | null;
  publishedAt: Date | null;
  fetchedAt: Date | null;
  limitacoes: unknown;
  trustType: string;
  entidades: unknown;
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
  ordem?: OrdemEventos;
}

export type OrdemEventos = "recentes" | "semana" | "relevantes";

/** Eventos mais recentes primeiro por data publica; sem data caem no fim. */
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
        territorio: civicEvents.territorio,
        sourceId: civicEvents.sourceId,
        sourceUrl: civicEvents.sourceUrl,
        publishedAt: civicEvents.publishedAt,
        fetchedAt: civicEvents.fetchedAt,
        limitacoes: civicEvents.limitacoes,
        trustType: civicEvents.trustType,
        entidades: civicEvents.entidades,
      })
      .from(civicEvents)
      .where(categoria ? eq(civicEvents.categoria, categoria) : undefined)
      .orderBy(sql`coalesce(${civicEvents.dataEvento}, ${civicEvents.publishedAt}::date) desc nulls last`, desc(civicEvents.criadoEm))
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

export interface ResumoMensalRadar {
  periodoLabel: string;
  inicio: string;
  fim: string;
  totalEventos: number;
  totalValor: string | null;
  porCategoria: Array<{ categoria: string; total: number; valor: string | null }>;
  fontes: Array<{ sourceId: string; total: number }>;
  recomendados: EventoRanqueado[];
  leitura: {
    titulo: string;
    texto: string;
    pontos: string[];
    limitacoes: string[];
  };
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

// ── Algoritmo do radar social-cívico ─────────────────────────────────────────
/**
 * Ranking de relevância: sem ele o radar seria 124k pagamentos por data. Pesa
 * tipo (contrato/sanção no topo, pagamento no fim), valor (log) e recência (leve,
 * porque os dados se concentram nos últimos meses). Depois aplica diversidade
 * para não repetir a mesma categoria em sequência.
 */
export interface EventoRanqueado extends EventoCivico {
  entidades: {
    fornecedorDocumento?: string | null;
    credorDocumento?: string | null;
    orgaoNome?: string | null;
    orgaoEntityId?: string | null;
    fornecedorEntityId?: string | null;
    credorEntityId?: string | null;
    cnpjs?: string[];
    pessoas?: Array<{ nome?: string | null; papel?: string | null; cargo?: string | null }>;
    orgaos?: Array<{ nome?: string | null; sigla?: string | null }>;
    apresentacao?: {
      linhaFina?: string;
      leituraCompleta?: string;
      etiquetas?: string[];
      conexoesTexto?: string[];
      aviso?: string | null;
      modo?: string;
      modelo?: string | null;
      geradoEm?: string;
      tituloOriginal?: string;
      resumoOriginal?: string | null;
      evidenciasLidas?: number;
      desde?: string;
    };
  } | null;
}

// Score de relevância (texto SQL reutilizado no select e no row_number).
const SCORE_SQL = `(
  case categoria
    when 'contratacao' then 30 when 'sancao' then 28
    when 'ato_normativo' then 16 when 'nomeacao_exoneracao' then 14
    when 'obra_zeladoria' then 14 when 'audiencia_conselho' then 10
    when 'receita' then 8 when 'pagamento' then 2 else 5 end
  + least(40, coalesce(ln(greatest(valor, 1)) * 3, 0))
  + case when coalesce(data_evento, published_at::date) is null then 0
      when current_date - coalesce(data_evento, published_at::date) < 30 then 20
      when current_date - coalesce(data_evento, published_at::date) < 90 then 12
      when current_date - coalesce(data_evento, published_at::date) < 365 then 5 else 0 end
)`;

interface PeriodoMensal {
  inicio: string;
  fimExclusivo: string;
  fimInclusivo: string;
}

function periodoDoMes(data: Date): PeriodoMensal {
  const inicio = new Date(data.getFullYear(), data.getMonth(), 1);
  const fim = new Date(data.getFullYear(), data.getMonth() + 1, 1);
  const fimInclusivo = new Date(fim);
  fimInclusivo.setDate(fimInclusivo.getDate() - 1);
  return {
    inicio: dataIso(inicio),
    fimExclusivo: dataIso(fim),
    fimInclusivo: dataIso(fimInclusivo),
  };
}

function dataIso(data: Date): string {
  const y = data.getFullYear();
  const m = String(data.getMonth() + 1).padStart(2, "0");
  const d = String(data.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function labelMes(inicio: string): string {
  const data = new Date(`${inicio}T12:00:00`);
  return data.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

async function consultarBaseMensal(db: DB, periodo: PeriodoMensal, categoria?: CategoriaEvento): Promise<{
  totalEventos: number;
  totalValor: string | null;
}> {
  const row = rowsFrom<{ totalEventos: number; totalValor: string | null }>(await db.execute(sql`
    select count(*)::int as "totalEventos",
           nullif(coalesce(sum(valor), 0), 0)::text as "totalValor"
    from civic_events
    where coalesce(data_evento, published_at::date) >= ${periodo.inicio}::date
      and coalesce(data_evento, published_at::date) < ${periodo.fimExclusivo}::date
      ${categoria ? sql`and categoria = ${categoria}` : sql``}
  `))[0];
  return {
    totalEventos: Number(row?.totalEventos ?? 0),
    totalValor: row?.totalValor ?? null,
  };
}

async function consultarCategoriasMensais(db: DB, periodo: PeriodoMensal, categoria?: CategoriaEvento): Promise<Array<{
  categoria: string;
  total: number;
  valor: string | null;
}>> {
  return rowsFrom<{ categoria: string; total: number; valor: string | null }>(await db.execute(sql`
    select categoria,
           count(*)::int as total,
           nullif(coalesce(sum(valor), 0), 0)::text as valor
    from civic_events
    where coalesce(data_evento, published_at::date) >= ${periodo.inicio}::date
      and coalesce(data_evento, published_at::date) < ${periodo.fimExclusivo}::date
      ${categoria ? sql`and categoria = ${categoria}` : sql``}
    group by categoria
    order by count(*) desc
    limit 6
  `));
}

async function consultarFontesMensais(db: DB, periodo: PeriodoMensal, categoria?: CategoriaEvento): Promise<Array<{
  sourceId: string;
  total: number;
}>> {
  return rowsFrom<{ sourceId: string; total: number }>(await db.execute(sql`
    select source_id as "sourceId", count(*)::int as total
    from civic_events
    where coalesce(data_evento, published_at::date) >= ${periodo.inicio}::date
      and coalesce(data_evento, published_at::date) < ${periodo.fimExclusivo}::date
      ${categoria ? sql`and categoria = ${categoria}` : sql``}
    group by source_id
    order by count(*) desc
    limit 4
  `));
}

async function consultarRecomendadosMensais(db: DB, periodo: PeriodoMensal, categoria?: CategoriaEvento): Promise<EventoRanqueado[]> {
  const rows = rowsFrom<EventoRanqueado>(await db.execute(sql`
    select id, categoria, tipo, titulo, resumo, valor::text as valor,
           territorio,
           source_id as "sourceId", source_url as "sourceUrl",
           data_evento as "dataEvento", entidades,
           published_at as "publishedAt", fetched_at as "fetchedAt",
           limitacoes, trust_type as "trustType"
    from civic_events
    where source_url is not null
      and coalesce(data_evento, published_at::date) >= ${periodo.inicio}::date
      and coalesce(data_evento, published_at::date) < ${periodo.fimExclusivo}::date
      ${categoria ? sql`and categoria = ${categoria}` : sql``}
    order by ${sql.raw(SCORE_SQL)} desc, coalesce(data_evento, published_at::date) desc nulls last, criado_em desc
    limit 18
  `));
  return diversificar(rows).slice(0, 6);
}

function montarLeituraMensal(input: {
  periodoLabel: string;
  totalEventos: number;
  totalValor: string | null;
  porCategoria: Array<{ categoria: string; total: number; valor: string | null }>;
  fontes: Array<{ sourceId: string; total: number }>;
  recomendados: EventoRanqueado[];
  categoria?: CategoriaEvento;
}): ResumoMensalRadar["leitura"] {
  const principal = input.porCategoria[0];
  const segunda = input.porCategoria[1];
  const fontePrincipal = input.fontes[0];
  const categoriaLabel = principal ? categoriaMeta(principal.categoria).label.toLocaleLowerCase("pt-BR") : "eventos públicos";
  const escopo = input.categoria ? ` em ${categoriaMeta(input.categoria).label.toLocaleLowerCase("pt-BR")}` : "";
  const titulo = `${capitalizar(input.periodoLabel)} em Americana`;
  const texto = input.totalEventos > 0
    ? `O mês tem ${input.totalEventos.toLocaleString("pt-BR")} acontecimentos públicos${escopo}. A maior concentração aparece em ${categoriaLabel}${segunda ? `, seguida por ${categoriaMeta(segunda.categoria).label.toLocaleLowerCase("pt-BR")}` : ""}.${input.totalValor ? ` Os valores citados pelas fontes somam ${input.totalValor}.` : ""}`
    : `Ainda não há acontecimentos públicos com data neste mês para este recorte.`;
  const pontos = [
    principal ? `${categoriaMeta(principal.categoria).label}: ${principal.total.toLocaleString("pt-BR")} registro(s) no mês.` : null,
    fontePrincipal ? `Fonte mais presente: ${fonteLabel(fontePrincipal.sourceId)} (${fontePrincipal.total.toLocaleString("pt-BR")} registro(s)).` : null,
    input.recomendados.length > 0 ? `${input.recomendados.length} evento(s) recomendados para começar a leitura do mês.` : null,
  ].filter((item): item is string => Boolean(item));
  const limitacoes = [
    "Leitura local organizada por algoritmo determinístico; não cria fatos novos.",
    "Valores são somas dos campos publicados pelas fontes e podem não representar execução financeira completa.",
  ];
  return { titulo, texto, pontos, limitacoes };
}

function capitalizar(texto: string): string {
  return texto.charAt(0).toLocaleUpperCase("pt-BR") + texto.slice(1);
}

/**
 * Round-robin por categoria: pega 1 de cada categoria por rodada, com cada grupo
 * ordenado por score. Evita que uma única categoria esconda as demais.
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
 * Radar vivo: usa cotas por categoria (row_number) para garantir variedade. Depois ordena
 * por score e diversifica. Quando há filtro de categoria, traz só ela (sem cota).
 */
export async function getEventosRanqueados(filtro: FiltroEventos = {}): Promise<EventoRanqueado[]> {
  const db = getDb();
  if (!db) return [];
  const { categoria, limit = 30, ordem = "recentes" } = filtro;
  const cotaPorCategoria = categoria ? 120 : 14; // sem filtro: até 14 de cada categoria
  try {
    if (ordem === "recentes") {
      const result = await db.execute(sql`
        select id, categoria, tipo, titulo, resumo, valor::text as valor,
               territorio,
               source_id as "sourceId", source_url as "sourceUrl",
               data_evento as "dataEvento", entidades,
               published_at as "publishedAt", fetched_at as "fetchedAt",
               limitacoes, trust_type as "trustType"
        from civic_events
        where true
          ${categoria ? sql`and categoria = ${categoria}` : sql``}
        order by coalesce(data_evento, published_at::date) desc nulls last, criado_em desc
        limit ${Math.min(limit, 200)}
      `);
      return rowsFrom<EventoRanqueado>(result);
    }

    const result = await db.execute(sql`
      select id, categoria, tipo, titulo, resumo, valor::text as valor,
             territorio,
             source_id as "sourceId", source_url as "sourceUrl",
             data_evento as "dataEvento", entidades,
             published_at as "publishedAt", fetched_at as "fetchedAt",
             limitacoes, trust_type as "trustType"
      from (
        select *, ${sql.raw(SCORE_SQL)} as _score,
          row_number() over (partition by categoria order by ${sql.raw(SCORE_SQL)} desc, coalesce(data_evento, published_at::date) desc nulls last) as _rn
        from civic_events
        where true
          ${categoria ? sql`and categoria = ${categoria}` : sql``}
          ${ordem === "semana" ? sql`and coalesce(data_evento, published_at::date) >= current_date - interval '7 days'` : sql``}
      ) t
      where _rn <= ${cotaPorCategoria}
      order by _score desc
      limit 120
    `);
    const rows = rowsFrom<EventoRanqueado>(result);
    return diversificar(rows).slice(0, limit);
  } catch (e) {
    console.warn(`[eventos] ranking falhou (${e instanceof Error ? e.message : e})`);
    return [];
  }
}

export async function getResumoMensalRadar(filtro: { categoria?: CategoriaEvento } = {}): Promise<ResumoMensalRadar | null> {
  const db = getDb();
  if (!db) return null;
  try {
    let periodo = periodoDoMes(new Date());
    let base = await consultarBaseMensal(db, periodo, filtro.categoria);

    if (base.totalEventos === 0) {
      const ultimo = rowsFrom<{ data: string }>(await db.execute(sql`
        select coalesce(data_evento, published_at::date)::text as data
        from civic_events
        where coalesce(data_evento, published_at::date) is not null
          ${filtro.categoria ? sql`and categoria = ${filtro.categoria}` : sql``}
        order by coalesce(data_evento, published_at::date) desc
        limit 1
      `))[0]?.data;
      if (!ultimo) return null;
      periodo = periodoDoMes(new Date(`${ultimo}T12:00:00`));
      base = await consultarBaseMensal(db, periodo, filtro.categoria);
    }

    const [porCategoria, fontes, recomendados] = await Promise.all([
      consultarCategoriasMensais(db, periodo, filtro.categoria),
      consultarFontesMensais(db, periodo, filtro.categoria),
      consultarRecomendadosMensais(db, periodo, filtro.categoria),
    ]);

    return {
      periodoLabel: labelMes(periodo.inicio),
      inicio: periodo.inicio,
      fim: periodo.fimInclusivo,
      totalEventos: base.totalEventos,
      totalValor: valorBRL(base.totalValor),
      porCategoria,
      fontes,
      recomendados,
      leitura: montarLeituraMensal({
        periodoLabel: labelMes(periodo.inicio),
        totalEventos: base.totalEventos,
        totalValor: valorBRL(base.totalValor),
        porCategoria,
        fontes,
        recomendados,
        categoria: filtro.categoria,
      }),
    };
  } catch (e) {
    console.warn(`[eventos] resumo mensal falhou (${e instanceof Error ? e.message : e})`);
    return null;
  }
}

function rowsFrom<T>(result: unknown): T[] {
  return (Array.isArray(result) ? result : (result as { rows?: unknown[] }).rows ?? []) as T[];
}

export interface EvidenciaEvento {
  id: string;
  titulo: string;
  sourceId: string;
  sourceUrl: string | null;
  trecho: string | null;
  pagina: number | null;
  metodoExtracao: string;
  fieldPath: string | null;
  publishedAt: Date | null;
  fetchedAt: Date | null;
  trustType: string;
}

export interface RelacaoEvento {
  id: string;
  tipo: string;
  descricao: string | null;
  fromLabel: string;
  fromKind: string;
  fromHref: string | null;
  toLabel: string;
  toKind: string;
  toHref: string | null;
  evidenceHref: string | null;
  sourceId: string;
  confianca: string;
  trustType: string;
}

export interface EventoDetalhe {
  evento: EventoRanqueado;
  evidencias: EvidenciaEvento[];
  relacoes: RelacaoEvento[];
  relacionados: EventoRanqueado[];
}

function hrefEntidade(kind: string, label: string, documento: string | null): string | null {
  if (kind === "empresa" && documento) return `/empresa/${documento.replace(/\D/g, "")}`;
  if (kind === "orgao") return `/orgao/${slugify(label)}`;
  if (kind === "pessoa_publica") return `/pessoa/${slugify(label)}`;
  return null;
}

function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function getEventoDetalhe(id: string): Promise<EventoDetalhe | null> {
  const db = getDb();
  if (!db) return null;
  try {
    const eventos = await db
      .select({
        id: civicEvents.id,
        categoria: civicEvents.categoria,
        tipo: civicEvents.tipo,
        titulo: civicEvents.titulo,
        resumo: civicEvents.resumo,
        dataEvento: civicEvents.dataEvento,
        valor: civicEvents.valor,
        territorio: civicEvents.territorio,
        sourceId: civicEvents.sourceId,
        sourceUrl: civicEvents.sourceUrl,
        publishedAt: civicEvents.publishedAt,
        fetchedAt: civicEvents.fetchedAt,
        limitacoes: civicEvents.limitacoes,
        trustType: civicEvents.trustType,
        entidades: civicEvents.entidades,
      })
      .from(civicEvents)
      .where(eq(civicEvents.id, id))
      .limit(1);
    const evento = eventos[0] as EventoRanqueado | undefined;
    if (!evento) return null;

    const evidencias = rowsFrom<EvidenciaEvento>(await db.execute(sql`
      select id, titulo, source_id as "sourceId", source_url as "sourceUrl", trecho, pagina,
             metodo_extracao as "metodoExtracao", field_path as "fieldPath",
             published_at as "publishedAt", fetched_at as "fetchedAt", trust_type as "trustType"
      from evidence
      where civic_event_id = ${id}
      order by criado_em asc
    `));

    const relacoesRaw = rowsFrom<{
      id: string;
      tipo: string;
      descricao: string | null;
      fromLabel: string;
      fromKind: string;
      fromDocumento: string | null;
      toLabel: string;
      toKind: string;
      toDocumento: string | null;
      evidenceHref: string | null;
      sourceId: string;
      confianca: string;
      trustType: string;
    }>(await db.execute(sql`
      select r.id, r.tipo, r.descricao,
             ef.nome as "fromLabel", ef.kind as "fromKind", ef.documento as "fromDocumento",
             et.nome as "toLabel", et.kind as "toKind", et.documento as "toDocumento",
             ev.source_url as "evidenceHref",
             r.source_id as "sourceId", r.confianca::text as "confianca", r.trust_type as "trustType"
      from entity_relationships r
      join entities ef on ef.id = r.from_entity_id
      join entities et on et.id = r.to_entity_id
      left join evidence ev on ev.id = r.evidence_id
      where r.civic_event_id = ${id}
      order by r.criado_em asc
      limit 24
    `));
    const relacoes = relacoesRaw.map((r) => ({
      id: r.id,
      tipo: r.tipo,
      descricao: r.descricao,
      fromLabel: r.fromLabel,
      fromKind: r.fromKind,
      fromHref: hrefEntidade(r.fromKind, r.fromLabel, r.fromDocumento),
      toLabel: r.toLabel,
      toKind: r.toKind,
      toHref: hrefEntidade(r.toKind, r.toLabel, r.toDocumento),
      evidenceHref: r.evidenceHref,
      sourceId: r.sourceId,
      confianca: r.confianca,
      trustType: r.trustType,
    }));

    const entidades = (evento.entidades ?? {}) as {
      fornecedorDocumento?: string | null;
      credorDocumento?: string | null;
      orgaoEntityId?: string | null;
      fornecedorEntityId?: string | null;
      credorEntityId?: string | null;
    };
    const documento = entidades.fornecedorDocumento ?? entidades.credorDocumento ?? null;
    const orgaoEntityId = entidades.orgaoEntityId ?? null;
    let relacionados = rowsFrom<EventoRanqueado>(await db.execute(sql`
      select id, categoria, tipo, titulo, resumo, valor::text as valor,
             territorio,
             source_id as "sourceId", source_url as "sourceUrl",
             data_evento as "dataEvento", entidades,
             published_at as "publishedAt", fetched_at as "fetchedAt",
             limitacoes, trust_type as "trustType"
      from civic_events
      where id <> ${id}
        and (
          ${documento ? sql`entidades->>'fornecedorDocumento' = ${documento} or entidades->>'credorDocumento' = ${documento}` : sql`false`}
          ${orgaoEntityId ? sql`or entidades->>'orgaoEntityId' = ${orgaoEntityId}` : sql``}
        )
      order by coalesce(data_evento, published_at::date) desc nulls last, criado_em desc
      limit 8
    `));
    if (relacionados.length === 0) {
      relacionados = rowsFrom<EventoRanqueado>(await db.execute(sql`
        select id, categoria, tipo, titulo, resumo, valor::text as valor,
               territorio,
               source_id as "sourceId", source_url as "sourceUrl",
               data_evento as "dataEvento", entidades,
               published_at as "publishedAt", fetched_at as "fetchedAt",
               limitacoes, trust_type as "trustType"
        from civic_events
        where id <> ${id}
          and categoria = ${evento.categoria}
          and source_id = ${evento.sourceId}
        order by coalesce(data_evento, published_at::date) desc nulls last, criado_em desc
        limit 8
      `));
    }

    return { evento, evidencias, relacoes, relacionados };
  } catch (e) {
    console.warn(`[eventos] detalhe falhou (${e instanceof Error ? e.message : e})`);
    return null;
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
