export type Fonte =
  | "pncp"
  | "tce-sp"
  | "querido-diario"
  | "camara-americana"
  | "cgu-transparencia";

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
  numeroContrato: string;
  objetoContrato: string;
  valorInicial: number;
  valorGlobal: number;
  dataVigenciaInicio: string;
  dataVigenciaFim: string;
  dataAssinatura: string;
  situacaoContrato: { codigo: number; nome: string };
  fornecedor: {
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
  funcao: string;
  subfuncao: string;
  programa: string;
  acao: string;
  elemento: string;
  modalidade: string;
  credor: string;
  nomeCredor: string;
  cpfCnpjCredor: string;
  empenho: string;
  valorEmpenhado: number;
  valorLiquidado: number;
  valorPago: number;
}

export interface TceSpReceita {
  exercicio: number;
  mes: number;
  categoria: string;
  origem: string;
  especie: string;
  rubrica: string;
  valorPrevisto: number;
  valorArrecadado: number;
}

// --- Querido Diário ---

export interface GazetaEdicao {
  territory_id: string;
  territory_name: string;
  date: string;
  url: string;
  is_extra_edition: boolean;
  edition: string | null;
  scraped_at: string;
  txt_url: string | null;
  highlight_texts: string[];
}
