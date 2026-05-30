export type Fonte =
  | "pncp"
  | "tce-sp"
  | "querido-diario"
  | "diario-americana"
  | "transparencia-americana"
  | "receita-cnpj"
  | "camara-americana"
  | "cgu-transparencia"
  | "tse";

export interface ResultadoColeta<T = unknown> {
  fonte: Fonte;
  coletadoEm: string;
  municipio: string;
  ibge: string;
  totalRegistros: number;
  dados: T[];
  erros: string[];
}

// --- PNCP ---

export interface PncpCompra {
  sequencialCompra: number;
  anoCompra: number;
  numeroCompra: string;
  modalidadeId: number;
  modalidadeNome: string;
  objetoCompra: string;
  valorTotalEstimado: number;
  valorTotalHomologado: number | null;
  situacaoCompraId: number;
  situacaoCompraNome: string;
  dataPublicacaoPncp: string;
  dataAberturaProposta: string | null;
  dataEncerramentoProposta: string | null;
  orgaoEntidade: {
    cnpj: string;
    razaoSocial: string;
    poderId: string;
    esferaId: string;
  };
  unidadeOrgao: {
    codigoUnidade: string;
    nomeUnidade: string;
    municipioNome: string;
    ufSigla: string;
  };
}

export interface PncpContrato {
  sequencialContrato: number;
  anoContrato: number;
  numeroControlePNCP?: string | null;
  numeroContrato?: string | null;
  numeroContratoEmpenho?: string | null;
  objetoContrato: string;
  valorInicial: number;
  valorGlobal: number;
  dataVigenciaInicio: string;
  dataVigenciaFim: string;
  dataAssinatura: string;
  dataPublicacaoPncp?: string | null;
  situacaoContrato: { codigo: number; nome: string };
  niFornecedor?: string | null;
  nomeRazaoSocialFornecedor?: string | null;
  fornecedor?: {
    cnpjCpf: string;
    nomeRazaoSocial: string;
    tipo: string;
  };
  receita: boolean;
  compraAssociada?: { numeroCompra: string; anoCompra: number };
}

// --- TCE-SP ---

export interface TceSpDespesa {
  exercicio: number;
  mes: number;
  orgao: string;
  nomeOrgao: string;
  funcao?: string | null;
  subfuncao?: string | null;
  programa?: string | null;
  acao?: string | null;
  elemento?: string | null;
  modalidade?: string | null;
  credor?: string | null;
  nomeCredor: string;
  cpfCnpjCredor: string | null;
  empenho: string;
  valorEmpenhado: number;
  valorLiquidado: number;
  valorPago: number;
  eventoDespesa?: string | null;
  valorDespesa?: number | null;
  dataEmissaoDespesa?: string | null;
}

export interface TceSpReceita {
  exercicio: number;
  mes: number;
  orgao: string;
  categoria: string;
  origem: string;
  especie: string;
  rubrica: string;
  valorPrevisto: number;
  valorArrecadado: number;
  fonteRecurso?: string | null;
  codigoAplicacao?: string | null;
}

// --- Querido Diário ---

export interface GazetaEdicao {
  territory_id: string;
  territory_name: string;
  state_code: string;
  date: string;
  url: string;
  txt_url: string | null;
  edition: string | null;
  is_extra_edition: boolean | null;
  scraped_at: string;
  excerpts: string[];
}
