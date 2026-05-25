import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index";

// Fábrica de conexão. Cada consumidor (scripts, worker, app web) cria a sua
// própria instância a partir da sua DATABASE_URL — sem singleton global.
export function createDb(connectionString: string, options?: { max?: number }) {
  const client = postgres(connectionString, { max: options?.max ?? 10 });
  return drizzle(client, { schema });
}

export type DB = ReturnType<typeof createDb>;
export { schema };
