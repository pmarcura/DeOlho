/**
 * Mapper de menções do Diário — fecha o join diário↔dinheiro.
 *
 * Baixa o PDF de cada edição (tabela gazettes), extrai o texto e procura CNPJs.
 * Cada CNPJ que casa com uma EMPRESA já conhecida (entities) vira uma
 * `gazette_mention` — ligando o ato publicado ao fornecedor/contrato.
 *
 * Não cria entidade nova a partir do diário: só liga ao que já foi resolvido
 * pelos mappers de contrato/pagamento (evita ruído de OCR/regex virar "fato").
 *
 * Uso:
 *   pnpm --filter @deolho/collectors map:diario                 (processa gazettes do banco)
 *   pnpm --filter @deolho/collectors map:diario https://.../x.pdf   (teste de 1 PDF, sem banco)
 */
import "dotenv/config";
import { and, eq } from "drizzle-orm";
import { getDb } from "../utils/ingest.js";
import { baixarPdf, extrairTextoPdf } from "../utils/pdf.js";
import { extrairCnpjs } from "../utils/documento.js";
import { gazettes, gazetteMentions, entities } from "@deolho/db";

export async function mapearMencoesDiario(maxGazetas = 30): Promise<void> {
  const db = getDb();
  if (!db) {
    console.error("[map:diario] DATABASE_URL não definida.");
    return;
  }
  const gz = await db
    .select()
    .from(gazettes)
    .where(eq(gazettes.sourceId, "diario-americana"))
    .limit(maxGazetas);
  console.log(`[map:diario] ${gz.length} edições a processar`);

  let mencoes = 0;
  for (const g of gz) {
    if (!g.url) continue;
    let texto: string;
    try {
      texto = await extrairTextoPdf(await baixarPdf(g.url));
    } catch (e) {
      console.warn(`[map:diario] ${g.url}: ${e instanceof Error ? e.message : String(e)}`);
      continue;
    }
    for (const doc of extrairCnpjs(texto)) {
      const ent = await db
        .select({ id: entities.id })
        .from(entities)
        .where(and(eq(entities.kind, "empresa"), eq(entities.documento, doc)))
        .limit(1);
      if (!ent[0]) continue; // só liga ao que já conhecemos
      const exists = await db
        .select({ id: gazetteMentions.id })
        .from(gazetteMentions)
        .where(and(eq(gazetteMentions.gazetteId, g.id), eq(gazetteMentions.entityId, ent[0].id)))
        .limit(1);
      if (exists[0]) continue;
      await db.insert(gazetteMentions).values({
        gazetteId: g.id,
        entityId: ent[0].id,
        rawDocumento: doc,
        confianca: "0.900", // CNPJ por regex no texto do PDF
      });
      mencoes++;
    }
  }
  console.log(`[map:diario] ${mencoes} menções (diário↔entidade) gravadas`);
}

if (
  process.argv[1]?.endsWith("diario-mentions.ts") ||
  process.argv[1]?.endsWith("diario-mentions.js")
) {
  const arg = process.argv[2];
  if (arg && /^https?:\/\//.test(arg)) {
    // Teste: 1 PDF, imprime os CNPJs achados (não precisa de banco).
    baixarPdf(arg)
      .then(extrairTextoPdf)
      .then((t) => {
        const cs = extrairCnpjs(t);
        console.log(`[map:diario] texto: ${t.length} chars; CNPJs distintos: ${cs.length}`);
        for (const c of cs.slice(0, 40)) console.log("  -", c);
      })
      .catch((e) => {
        console.error(e);
        process.exit(1);
      });
  } else {
    mapearMencoesDiario().catch((e) => {
      console.error(e);
      process.exit(1);
    });
  }
}
