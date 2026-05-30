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

export const civicEventType = pgEnum("civic_event_type", [
  "licitacao_publicada",
  "contrato_publicado",
  "contrato_atualizado",
  "pagamento_registrado",
  "receita_registrada",
  "ato_publicado",
  "proposta_legislativa",
  "indicacao_zeladoria",
  "sancao_registrada",
  "relacionamento_documentado",
  "limitacao_detectada",
  "revisao_aplicada",
]);

export const civicEventCategory = pgEnum("civic_event_category", [
  "contratacao",
  "pagamento",
  "receita",
  "obra_zeladoria",
  "ato_normativo",
  "nomeacao_exoneracao",
  "proposta_legislativa",
  "indicacao_requerimento",
  "sancao",
  "audiencia_conselho",
  "limitacao_fonte",
  "relacionamento",
]);

export const relationshipType = pgEnum("relationship_type", [
  "socio_oficial",
  "administrador_oficial",
  "fornecedor",
  "orgao_responsavel",
  "doacao_eleitoral_oficial",
  "sancao_oficial",
  "mencao_documentada",
  "representante_legal",
]);

export const moneyFlowType = pgEnum("money_flow_type", [
  "previsto",
  "contratado",
  "empenhado",
  "liquidado",
  "pago",
  "anulado",
  "reforcado",
  "aditado",
  "receita_arrecadada",
]);

export const sourceCoverageStatus = pgEnum("source_coverage_status", [
  "fresh",
  "partial",
  "no_data",
  "unavailable",
  "error",
  "pending",
]);
