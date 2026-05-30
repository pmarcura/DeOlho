export { createDb, schema, type DB } from "./client";
export * from "./schema/index";

// Reexporta os operadores de query do Drizzle para os consumidores (app web,
// workers) não precisarem declarar drizzle-orm como dependência direta — o
// pacote @deolho/db encapsula o acesso ao banco.
export {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  or,
  sql,
} from "drizzle-orm";
