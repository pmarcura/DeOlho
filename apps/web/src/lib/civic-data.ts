/**
 * Fixtures sintéticas para o piloto Americana-SP.
 *
 * TODOS os dados aqui são SINTÉTICOS, marcados como tal. Nada deve ser
 * apresentado sem o badge `Dados sintéticos`. Quando a ingestão real entrar
 * em produção, este arquivo será trocado por queries no `@deolho/db`.
 */
import type {
  ContratoUI,
  EventoPublico,
  Fonte,
  EntidadeRef,
  SinalAtencao,
  SocioPartner,
  TerritorioItem,
} from "./civic-types";

const HOJE = "2026-05-25";
const ONTEM = "2026-05-24";
const ANTEONTEM = "2026-05-23";

// ── Fontes (sintéticas) ───────────────────────────────────────────────────────
export const FONTE_PNCP: Fonte = {
  id: "pncp",
  nome: "PNCP",
  url: "https://pncp.gov.br",
  estado: "synthetic",
  isSynthetic: true,
};
export const FONTE_TCE: Fonte = {
  id: "tce-sp",
  nome: "TCE-SP",
  estado: "synthetic",
  isSynthetic: true,
};
export const FONTE_DIARIO: Fonte = {
  id: "diario-americana",
  nome: "Diário de Americana",
  url: "https://diariooficial.americana.sp.gov.br",
  estado: "synthetic",
  isSynthetic: true,
};
export const FONTE_RECEITA: Fonte = {
  id: "receita-cnpj",
  nome: "Receita (CNPJ)",
  estado: "synthetic",
  isSynthetic: true,
};
export const FONTE_CGU: Fonte = {
  id: "cgu-transparencia",
  nome: "CGU CEIS",
  estado: "synthetic",
  isSynthetic: true,
};

// ── Entidades-referência (sintéticas) ────────────────────────────────────────
export const PREFEITURA_REF: EntidadeRef = {
  id: "orgao-1",
  tipo: "orgao",
  nome: "Município de Americana (sintético)",
  sigla: "PMA",
  href: "/entidade/orgao/municipio-americana",
};

export const EMPRESAS_REF: EntidadeRef[] = [
  {
    id: "empresa-1",
    tipo: "empresa",
    nome: "Construtora Sintética Alfa Ltda",
    href: "/entidade/empresa/construtora-sintetica-alfa",
  },
  {
    id: "empresa-2",
    tipo: "empresa",
    nome: "Saúde Integrada Sintética S/A",
    href: "/entidade/empresa/saude-integrada-sintetica",
  },
  {
    id: "empresa-3",
    tipo: "empresa",
    nome: "Tech Beta Sintética ME",
    href: "/entidade/empresa/tech-beta-sintetica",
  },
];

// ── Carrossel territorial (sintético) ────────────────────────────────────────
export const TERRITORIOS: TerritorioItem[] = [
  { id: "br", label: "Brasil", tipo: "brasil", isSynthetic: true },
  { id: "sp", label: "São Paulo", tipo: "estado", isSynthetic: true },
  { id: "americana", label: "Americana", tipo: "cidade", isSynthetic: true },
  { id: "centro", label: "Centro", tipo: "bairro", isSynthetic: true },
  { id: "saude", label: "Saúde", tipo: "tema", isSynthetic: true },
  { id: "educacao", label: "Educação", tipo: "tema", isSynthetic: true },
  { id: "infra", label: "Infraestrutura", tipo: "tema", isSynthetic: true },
];

// ── Radar de mudanças públicas (sintético) ───────────────────────────────────
export const EVENTOS_RADAR: EventoPublico[] = [
  {
    id: "ev-1",
    tipoEvento: "contrato_publicado",
    tipoInformacao: "fato_oficial",
    titulo: "Contrato sintético publicado no PNCP",
    resumo:
      "Contratação de serviços de manutenção de escolas. Valor R$ 1.240.000,00. Modalidade: pregão eletrônico.",
    entidades: [PREFEITURA_REF, EMPRESAS_REF[0]!],
    timestamp: `${HOJE}T09:14:00-03:00`,
    fonte: FONTE_PNCP,
    confianca: "fonte_oficial",
    href: "/contrato/ct-sint-001",
  },
  {
    id: "ev-2",
    tipoEvento: "limitacao_detectada",
    tipoInformacao: "dado_incompleto",
    titulo: "Campo de território impactado ausente",
    resumo:
      "O contrato sintético CT-2026/118 não informa o bairro/região onde a obra acontece.",
    entidades: [PREFEITURA_REF],
    timestamp: `${HOJE}T07:45:00-03:00`,
    fonte: FONTE_PNCP,
    confianca: "incompleto",
    limitacoes: [
      {
        tipo: "dado_ausente",
        mensagem:
          "A fonte PNCP não informa o território impactado. Última coleta: hoje.",
        campoAfetado: "territorio",
        fonte: "pncp",
      },
    ],
  },
  {
    id: "ev-3",
    tipoEvento: "ato_publicado",
    tipoInformacao: "fato_oficial",
    titulo: "Diário Oficial — edição de 04/05",
    resumo:
      "Diário publicado com 2 menções a CNPJs já catalogados (47145224000155, 23228076000174).",
    entidades: [PREFEITURA_REF],
    timestamp: `${ONTEM}T08:00:00-03:00`,
    fonte: FONTE_DIARIO,
    confianca: "fonte_oficial",
    href: "/contrato/ct-sint-001",
  },
  {
    id: "ev-4",
    tipoEvento: "sancao_registrada",
    tipoInformacao: "sinal_atencao",
    titulo: "Sinal de atenção: fornecedor consta no CEIS",
    resumo:
      "A empresa sintética Construtora Sintética Alfa aparece em uma sanção sintética do CEIS dentro do período do contrato CT-2026/118.",
    entidades: [EMPRESAS_REF[0]!],
    timestamp: `${ANTEONTEM}T14:22:00-03:00`,
    fonte: FONTE_CGU,
    confianca: "verificacao_pendente",
    href: "/entidade/empresa/construtora-sintetica-alfa",
  },
  {
    id: "ev-5",
    tipoEvento: "pagamento_registrado",
    tipoInformacao: "fato_oficial",
    titulo: "Pagamento sintético registrado (TCE-SP)",
    resumo:
      "Liquidação parcial de R$ 312.000,00 para Saúde Integrada Sintética S/A.",
    entidades: [EMPRESAS_REF[1]!, PREFEITURA_REF],
    timestamp: `${ANTEONTEM}T11:10:00-03:00`,
    fonte: FONTE_TCE,
    confianca: "fonte_atrasada",
    limitacoes: [
      {
        tipo: "fonte_atrasada",
        mensagem: "Última coleta do TCE-SP: 2 dias atrás.",
        fonte: "tce-sp",
      },
    ],
  },
];

// ── Contrato sintético em destaque (página viva) ──────────────────────────────
export const CONTRATO_DESTAQUE: ContratoUI = {
  id: "ct-sint-001",
  numero: "CT-2026/118",
  objeto: "Manutenção preventiva e corretiva de unidades escolares municipais (sintético).",
  valor: 1240000,
  valorTexto: "R$ 1.240.000,00",
  orgao: PREFEITURA_REF,
  empresa: EMPRESAS_REF[0],
  status: "Vigente",
  dataAssinatura: "2026-04-15",
  vigenciaFim: "2027-04-14",
  fonte: FONTE_PNCP,
  confianca: "fonte_oficial",
  tipoInformacao: "fato_oficial",
  limitacoes: [
    {
      tipo: "dado_ausente",
      mensagem: "A fonte PNCP não informa o território impactado.",
      campoAfetado: "territorio",
      fonte: "pncp",
    },
  ],
};

// ── Sócios sintéticos da empresa em destaque ─────────────────────────────────
export const SOCIOS_EMPRESA_ALFA: SocioPartner[] = [
  {
    nome: "MARIA SINTÉTICA DA SILVA",
    documentoMascarado: "***571038**",
    qualificacao: "Sócia administradora",
    dataEntrada: "2018-03-14",
  },
  {
    nome: "JOÃO EXEMPLO PEREIRA",
    documentoMascarado: "***460718**",
    qualificacao: "Sócio quotista",
    dataEntrada: "2020-08-02",
  },
];

// ── Sinal de atenção sintético (para a página de empresa) ────────────────────
export const SINAL_EMPRESA_ALFA: SinalAtencao = {
  id: "sin-1",
  titulo: "Sinal de atenção: fornecedor consta no CEIS sintético",
  descricao:
    "A empresa aparece em uma sanção sintética do CEIS em um período que se sobrepõe ao contrato CT-2026/118.",
  metodo:
    "Cruzamento por CNPJ entre o catálogo CEIS sintético e o contrato sintético.",
  evidencias: [
    {
      titulo: "Publicação sintética CEIS",
      href: "#",
      fonte: "cgu-transparencia",
    },
    { titulo: "Contrato CT-2026/118", href: "/contrato/ct-sint-001", fonte: "pncp" },
  ],
  limitacoes: [
    {
      tipo: "dado_ausente",
      mensagem: "Estes dados são SINTÉTICOS. Nada aqui se refere a pessoa ou empresa real.",
      fonte: "sinteticos",
    },
  ],
  severidadeVisual: "media",
};
