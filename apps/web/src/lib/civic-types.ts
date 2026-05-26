/**
 * Tipos de UI para o sistema cívico do DeOlho.
 *
 * Estes são tipos de APRESENTAÇÃO — encadeiam com os enums do banco
 * (`packages/db/src/schema/_enums.ts`) mas adicionam estados de UI
 * (revisão pendente, contraditório, dado incompleto) que não viram
 * registro persistente. Toda regra cívica de UI passa por aqui.
 */

// ── Tipo de informação ────────────────────────────────────────────────────────
// Espelha o enum `trust_type` do banco + estados de UI extras.
export type TipoInformacao =
  | "fato_oficial"
  | "explicacao_ia"
  | "sinal_atencao"
  | "noticia"
  | "opiniao"
  | "dado_incompleto"
  | "revisao_pendente";

// ── Nível de confiança (orientado à FONTE, nunca à entidade) ──────────────────
export type NivelConfianca =
  | "fonte_oficial"
  | "copia_verificada"
  | "verificacao_pendente"
  | "fonte_atrasada"
  | "incompleto"
  | "contraditorio";

// ── Fontes cívicas catalogadas ───────────────────────────────────────────────
export type FonteId =
  | "pncp"
  | "tce-sp"
  | "cgu-transparencia"
  | "querido-diario"
  | "diario-americana"
  | "transparencia-americana"
  | "receita-cnpj"
  | "camara-americana"
  | "tse"
  | "sinteticos";

export type EstadoFonte = "fresh" | "delayed" | "unavailable" | "partial" | "synthetic";

// ── Tipos de entidade (espelha `entity_kind` + extensões de UI) ───────────────
export type TipoEntidade =
  | "empresa"
  | "orgao"
  | "unidade_orgao"
  | "pessoa_publica"
  | "contrato"
  | "obra"
  | "lei"
  | "documento"
  | "territorio"
  | "tema";

// ── Tipos de evento público (unidades do radar) ──────────────────────────────
export type TipoEventoPublico =
  | "contrato_publicado"
  | "contrato_atualizado"
  | "pagamento_registrado"
  | "ato_publicado"
  | "sancao_registrada"
  | "limitacao_detectada"
  | "revisao_aplicada";

// ── Aliases / shapes para a UI ────────────────────────────────────────────────

export interface Fonte {
  id: FonteId;
  nome: string;
  url?: string;
  dataPublicacao?: string;
  dataColeta?: string;
  estado?: EstadoFonte;
  isSynthetic?: boolean;
}

export interface Limitacao {
  tipo: "dado_ausente" | "fonte_atrasada" | "fonte_indisponivel" | "campo_contraditorio";
  mensagem: string;
  campoAfetado?: string;
  fonte?: FonteId;
}

export interface EntidadeRef {
  id: string;
  tipo: TipoEntidade;
  nome: string;
  sigla?: string;
  href?: string;
}

export interface EventoPublico {
  id: string;
  tipoEvento: TipoEventoPublico;
  tipoInformacao: TipoInformacao;
  titulo: string;
  resumo: string;
  entidades: EntidadeRef[];
  timestamp: string;
  fonte: Fonte;
  confianca: NivelConfianca;
  limitacoes?: Limitacao[];
  href?: string;
}

export interface ContratoUI {
  id: string;
  numero: string;
  objeto: string;
  valor?: number;
  valorTexto?: string;
  orgao: EntidadeRef;
  empresa?: EntidadeRef;
  status?: string;
  dataAssinatura?: string;
  vigenciaFim?: string;
  fonte: Fonte;
  confianca: NivelConfianca;
  tipoInformacao: TipoInformacao;
  limitacoes?: Limitacao[];
}

export interface SocioPartner {
  nome: string;
  documentoMascarado?: string; // ex.: ***571038**
  qualificacao?: string;
  dataEntrada?: string;
}

export interface SinalAtencao {
  id: string;
  titulo: string;
  descricao: string;
  metodo: string;
  evidencias: { titulo: string; href: string; fonte: FonteId }[];
  limitacoes?: Limitacao[];
  // severidade VISUAL — nunca moral. Só ajusta intensidade do ícone.
  severidadeVisual?: "baixa" | "media" | "alta";
}

export interface TerritorioItem {
  id: string;
  label: string;
  tipo: "brasil" | "estado" | "cidade" | "bairro" | "orgao" | "tema";
  href?: string;
  isSynthetic?: boolean;
}
