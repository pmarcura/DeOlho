/**
 * Runner principal — executa todos os adapters em sequência
 *
 * Uso: npm run collect
 *      npm run collect:pncp   (fonte específica)
 */

import { coletarPncp } from "./adapters/pncp.js";
import { coletarQueiridoDiario } from "./adapters/querido-diario.js";
import { coletarTceSp } from "./adapters/tce-sp.js";
import { coletarCamaraAmericana } from "./adapters/camara-americana.js";

interface Adapter {
  nome: string;
  fn: () => Promise<void>;
}

const adapters: Adapter[] = [
  { nome: "pncp", fn: coletarPncp },
  { nome: "querido-diario", fn: coletarQueiridoDiario },
  { nome: "tce-sp", fn: coletarTceSp },
  { nome: "camara-americana", fn: coletarCamaraAmericana },
];

async function run() {
  console.log("=== DeOlho Collectors — Americana/SP ===\n");

  const resultados: { nome: string; status: "ok" | "erro"; erro?: string }[] = [];

  for (const adapter of adapters) {
    console.log(`\n--- ${adapter.nome} ---`);
    try {
      await adapter.fn();
      resultados.push({ nome: adapter.nome, status: "ok" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`[${adapter.nome}] FALHOU: ${msg}`);
      resultados.push({ nome: adapter.nome, status: "erro", erro: msg });
    }
  }

  console.log("\n=== Resumo ===");
  for (const r of resultados) {
    const icon = r.status === "ok" ? "✓" : "✗";
    console.log(`  ${icon} ${r.nome}${r.erro ? ` — ${r.erro}` : ""}`);
  }
}

run().catch(console.error);
