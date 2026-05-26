/**
 * Join proof — a "página viva de contrato" em forma de query (L5, sem UI).
 *
 * Monta, para um contrato real de Americana, o cruzamento completo: linha do
 * tempo + pagamentos do TCE ligados ao MESMO fornecedor (cruzamento por CNPJ) +
 * menções no diário + entidades canônicas — cada elo com sua fonte.
 *
 * É o teste de aceite da pergunta "estamos cruzando informações?": se imprime
 * fornecedor canônico + pagamentos do mesmo CNPJ + proveniência, a resposta é sim.
 *
 * Uso: pnpm --filter @deolho/collectors view:contract [contractId]
 */
import "dotenv/config";
import { desc, eq } from "drizzle-orm";
import { getDb } from "../utils/ingest.js";
import {
  contracts,
  contractEvents,
  payments,
  entities,
  gazetteMentions,
} from "@deolho/db";

export async function contractView(contractId?: string): Promise<void> {
  const db = getDb();
  if (!db) {
    console.error("[view:contract] DATABASE_URL não definida.");
    return;
  }

  const base = contractId
    ? await db.select().from(contracts).where(eq(contracts.id, contractId)).limit(1)
    : await db.select().from(contracts).orderBy(desc(contracts.publishedAt)).limit(1);

  const c = base[0];
  if (!c) {
    console.log(
      "[view:contract] nenhum contrato no banco. Rode: collect:pncp → map:pncp (e tenha DATABASE_URL).",
    );
    return;
  }

  const fornecedor = c.fornecedorEntityId
    ? (await db.select().from(entities).where(eq(entities.id, c.fornecedorEntityId)).limit(1))[0]
    : undefined;
  const orgao = c.orgaoEntityId
    ? (await db.select().from(entities).where(eq(entities.id, c.orgaoEntityId)).limit(1))[0]
    : undefined;

  const eventos = await db
    .select()
    .from(contractEvents)
    .where(eq(contractEvents.contractId, c.id))
    .orderBy(contractEvents.data);

  const pagamentosDoContrato = await db
    .select()
    .from(payments)
    .where(eq(payments.contractId, c.id));

  // O cruzamento que importa: pagamentos ao MESMO fornecedor (por CNPJ canônico),
  // mesmo que a despesa não cite o número do contrato.
  const pagamentosDoFornecedor = c.fornecedorEntityId
    ? await db.select().from(payments).where(eq(payments.credorEntityId, c.fornecedorEntityId))
    : [];

  const mencoes = await db
    .select()
    .from(gazetteMentions)
    .where(eq(gazetteMentions.contractId, c.id));

  console.log("=== PÁGINA VIVA DE CONTRATO (prova de cruzamento) ===");
  console.log(`Contrato:  ${c.numero ?? "?"}/${c.ano ?? "?"} — ${c.objeto}`);
  console.log(`Valor:     R$ ${c.valorGlobal ?? c.valorInicial ?? "?"}  [${c.trustType}]`);
  console.log(`Fonte:     ${c.sourceUrl ?? c.sourceId}`);
  console.log(`Órgão:     ${orgao?.nome ?? "?"} (${orgao?.documento ?? "?"})`);
  console.log(`Fornecedor:${fornecedor?.nome ?? "?"} (${fornecedor?.documento ?? "?"})`);

  console.log(`\nLinha do tempo (${eventos.length}):`);
  for (const e of eventos) {
    console.log(`  - ${e.data} ${e.tipo} [${e.trustType}] fonte: ${e.sourceUrl ?? "-"}`);
  }

  console.log(`\nCruzamento — eixo do dinheiro:`);
  console.log(`  pagamentos ligados a ESTE contrato (TCE): ${pagamentosDoContrato.length}`);
  console.log(`  pagamentos ao MESMO fornecedor (por CNPJ): ${pagamentosDoFornecedor.length}`);
  let totalPago = 0;
  for (const p of pagamentosDoFornecedor) totalPago += Number(p.valorPago ?? 0);
  if (pagamentosDoFornecedor.length) console.log(`  total pago ao fornecedor: R$ ${totalPago.toFixed(2)}`);
  console.log(`  menções no diário oficial: ${mencoes.length}`);

  console.log("\nRESUMO:", {
    contrato: true,
    fornecedor_canonico: Boolean(fornecedor),
    orgao_canonico: Boolean(orgao),
    pagamentos_tce: pagamentosDoFornecedor.length,
    mencoes_diario: mencoes.length,
  });
}

if (process.argv[1]?.endsWith("contract-view.ts") || process.argv[1]?.endsWith("contract-view.js")) {
  contractView(process.argv[2]).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
