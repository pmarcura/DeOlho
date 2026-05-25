import "dotenv/config";
import { createDb } from "./client";
import { sources } from "./schema/index";

// Query de prova: confirma que o banco está migrado e acessível.
const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL não definida. Copie .env.example para .env.");

const db = createDb(url);

async function main() {
  const fontes = await db.select().from(sources);
  console.log(`[check] ${fontes.length} fontes no banco:`);
  for (const f of fontes) console.log(`  - ${f.id}: ${f.nome}`);
  process.exit(0);
}

main().catch((e) => {
  console.error("[check] erro:", e);
  process.exit(1);
});
