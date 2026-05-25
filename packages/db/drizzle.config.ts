import "dotenv/config";
import { defineConfig } from "drizzle-kit";

// `drizzle-kit generate` produz SQL a partir do schema sem conectar ao banco.
// `migrate`/`push`/`studio` precisam de DATABASE_URL apontando para um Postgres real.
export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://deolho:deolho@localhost:5432/deolho",
  },
  verbose: true,
  strict: true,
});
