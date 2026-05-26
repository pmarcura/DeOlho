/**
 * Camada L2 — resolução de entidades (o coração do cruzamento).
 *
 * Reconcilia empresas/órgãos/pessoas em IDs canônicos por documento (CNPJ/CPF)
 * normalizado. É o que faz o mesmo fornecedor que aparece no PNCP, no TCE e no
 * diário virar UM nó — sem isso, não há "seguir o dinheiro".
 *
 * `entityReferences` preserva o nome como apareceu em cada fonte (proveniência)
 * e a confiança do match (1.000 = exato por documento; <1 = heurística).
 *
 * Os mappers chamam `upsertEntity` / `addEntityReference` ao construir o
 * typed-core. Match fuzzy por nome (pg_trgm) fica para uma evolução posterior;
 * por ora, sem documento resolvemos por nome exato dentro do mesmo `kind`.
 */
import { and, eq } from "drizzle-orm";
import { entities, entityReferences, type DB } from "@deolho/db";
import { normalizarDocumento, tipoDocumento } from "../utils/documento.js";

export type EntityKind = "empresa" | "orgao" | "unidade_orgao" | "pessoa_publica";

export interface UpsertEntityArgs {
  kind: EntityKind;
  nome: string;
  documento?: string | null;
}

/** Encontra ou cria a entidade canônica; retorna o id. */
export async function upsertEntity(db: DB, args: UpsertEntityArgs): Promise<string> {
  const doc = normalizarDocumento(args.documento);
  const nome = args.nome?.trim() || "(sem nome)";

  if (doc) {
    const found = await db
      .select({ id: entities.id })
      .from(entities)
      .where(and(eq(entities.kind, args.kind), eq(entities.documento, doc)))
      .limit(1);
    if (found[0]) return found[0].id;

    await db
      .insert(entities)
      .values({ kind: args.kind, nome, documento: doc, documentoKind: tipoDocumento(doc) })
      .onConflictDoNothing();

    const after = await db
      .select({ id: entities.id })
      .from(entities)
      .where(and(eq(entities.kind, args.kind), eq(entities.documento, doc)))
      .limit(1);
    if (after[0]) return after[0].id;
    throw new Error(`upsertEntity: não resolveu ${args.kind} documento=${doc}`);
  }

  // Sem documento: resolução conservadora por nome exato dentro do kind.
  const byName = await db
    .select({ id: entities.id })
    .from(entities)
    .where(and(eq(entities.kind, args.kind), eq(entities.nome, nome)))
    .limit(1);
  if (byName[0]) return byName[0].id;

  const ins = await db.insert(entities).values({ kind: args.kind, nome }).returning({ id: entities.id });
  if (!ins[0]) throw new Error("upsertEntity: insert sem retorno");
  return ins[0].id;
}

export interface EntityRefArgs {
  entityId: string;
  sourceId: string;
  sourceKey?: string | null;
  rawNome: string;
  rawDocumento?: string | null;
  confianca?: number;
}

/** Registra a ocorrência da entidade numa fonte (idempotente por chave). */
export async function addEntityReference(db: DB, args: EntityRefArgs): Promise<void> {
  const doc = normalizarDocumento(args.rawDocumento);
  const confianca = args.confianca ?? (doc ? 1 : 0.5);

  if (args.sourceKey) {
    const exists = await db
      .select({ id: entityReferences.id })
      .from(entityReferences)
      .where(
        and(
          eq(entityReferences.entityId, args.entityId),
          eq(entityReferences.sourceId, args.sourceId),
          eq(entityReferences.sourceKey, args.sourceKey),
        ),
      )
      .limit(1);
    if (exists[0]) return;
  }

  await db.insert(entityReferences).values({
    entityId: args.entityId,
    sourceId: args.sourceId,
    sourceKey: args.sourceKey ?? null,
    rawNome: args.rawNome?.trim() || "(sem nome)",
    rawDocumento: doc,
    confianca: confianca.toFixed(3),
  });
}
