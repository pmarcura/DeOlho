import { pgEnum } from "drizzle-orm/pg-core";

// TRUST-01 — tipo de confiança de cada informação exibida no produto.
// Toda informação pública nasce tipada: fato oficial, explicação, sinal de
// atenção, notícia ou opinião. Fatos vêm da fonte; explicações da IA; sinais
// são computados com disclaimer obrigatório.
export const trustType = pgEnum("trust_type", [
  "fato_oficial",
  "explicacao",
  "sinal_atencao",
  "noticia",
  "opiniao",
]);

// Tipo de entidade canônica. Separar pessoa pública (em função) de cidadão
// comum é obrigação jurídica/ética — por isso é parte do tipo, não um detalhe.
export const entityKind = pgEnum("entity_kind", [
  "empresa",
  "orgao",
  "unidade_orgao",
  "pessoa_publica",
]);

export const documentKind = pgEnum("document_kind", ["cnpj", "cpf"]);

// Eventos da linha do tempo de um contrato (CONT-04).
export const contractEventType = pgEnum("contract_event_type", [
  "publicacao",
  "assinatura",
  "aditivo",
  "pagamento",
  "alteracao",
  "rescisao",
]);
