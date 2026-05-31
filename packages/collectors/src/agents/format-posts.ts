import "dotenv/config";
import { eq, schema, sql } from "@deolho/db";
import { closeDb, getDb } from "../utils/ingest.js";
import { formatarComAgenteLeve, type CivicPostAgentInput } from "./civic-post-agent.js";

const { civicEvents } = schema;

interface Args {
  limit: number;
  force: boolean;
  dryRun: boolean;
  since: string;
}

function args(): Args {
  const argv = process.argv.slice(2);
  const value = (name: string): string | null => {
    const i = argv.indexOf(name);
    const inline = argv.find((arg) => arg.startsWith(`${name}=`));
    if (inline) return inline.slice(name.length + 1);
    return i >= 0 ? argv[i + 1] ?? null : null;
  };
  return {
    limit: Math.min(Number(value("--limit") ?? 50), 250),
    force: argv.includes("--force"),
    dryRun: argv.includes("--dry-run"),
    since: normalizarData(value("--since") ?? "2026-01-01"),
  };
}

function normalizarData(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("--since deve usar o formato YYYY-MM-DD");
  }
  return value;
}

function rowsFrom<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  return ((result as { rows?: unknown[] }).rows ?? []) as T[];
}

function mergeEntidades(entidades: unknown, meta: unknown): Record<string, unknown> {
  return {
    ...(entidades && typeof entidades === "object" && !Array.isArray(entidades) ? entidades as Record<string, unknown> : {}),
    apresentacao: meta,
  };
}

export async function formatarEventosRecentes(options: Args = args()): Promise<void> {
  const db = getDb();
  if (!db) {
    console.error("[format:posts] DATABASE_URL não definida.");
    return;
  }

  const result = await db.execute(sql`
    select id, categoria, tipo, titulo, resumo, valor::text as valor,
           source_id as "sourceId", source_url as "sourceUrl",
           data_evento as "dataEvento", entidades, limitacoes
    from civic_events
    where source_url is not null
      and coalesce(data_evento, published_at::date) >= ${options.since}::date
      ${options.force ? sql`` : sql`and (entidades is null or entidades->'apresentacao' is null)`}
    order by coalesce(data_evento, published_at::date) desc nulls last, criado_em desc
    limit ${options.limit}
  `);
  const rows = rowsFrom<CivicPostAgentInput>(result);
  console.log(`[format:posts] ${rows.length} eventos desde ${options.since} para formatar`);

  let n = 0;
  for (const row of rows) {
    const evidencias = rowsFrom<NonNullable<CivicPostAgentInput["evidencias"]>[number]>(await db.execute(sql`
      select titulo, source_url as "sourceUrl", trecho, metodo_extracao as "metodoExtracao"
      from evidence
      where civic_event_id = ${row.id}
      order by criado_em asc
      limit 3
    `));
    const input: CivicPostAgentInput = { ...row, evidencias };
    const { output, modo, modelo } = await formatarComAgenteLeve(input);
    const apresentacao = {
      v: 1,
      modo,
      modelo,
      linhaFina: output.linhaFina,
      leituraCompleta: output.leituraCompleta,
      etiquetas: output.etiquetas,
      conexoesTexto: output.conexoesTexto,
      aviso: output.aviso,
      tituloOriginal: row.titulo,
      resumoOriginal: row.resumo,
      evidenciasLidas: evidencias.length,
      desde: options.since,
      geradoEm: new Date().toISOString(),
    };

    if (options.dryRun) {
      console.log(`[format:posts] ${row.id}: ${output.titulo}`);
      continue;
    }

    await db
      .update(civicEvents)
      .set({
        titulo: output.titulo,
        resumo: output.resumo,
        entidades: mergeEntidades(row.entidades, apresentacao),
        atualizadoEm: new Date(),
      })
      .where(eq(civicEvents.id, row.id!));
    n++;
  }

  console.log(`[format:posts] ${n} eventos atualizados`);
}

if (process.argv[1]?.endsWith("format-posts.ts") || process.argv[1]?.endsWith("format-posts.js")) {
  formatarEventosRecentes()
    .catch((e) => {
      console.error(e);
      process.exitCode = 1;
    })
    .finally(() => closeDb());
}
