export const AMERICANA = {
  nome: "Americana",
  uf: "SP",
  ibge: "3501608",
  // CNPJ da Prefeitura de Americana — verificar em https://pncp.gov.br antes de produção
  cnpj: "46523163000106",
} as const;

// API de publicação (requer auth) — não usar para leitura
// export const PNCP_TRANSACTION_BASE = "https://pncp.gov.br/api/pncp/v1";

// API de consulta pública — sem autenticação
export const PNCP_BASE = "https://pncp.gov.br/api/consulta/v1";
export const TCE_SP_BASE = "https://transparencia.tce.sp.gov.br";
// Host da API (o domínio principal serve o SPA; /api cai no front e devolve HTML)
export const QUERIDO_DIARIO_BASE = "https://api.queridodiario.ok.org.br";

// janela de coleta inicial: últimos 12 meses
const hoje = new Date();
const umAnoAtras = new Date(hoje);
umAnoAtras.setFullYear(hoje.getFullYear() - 1);

export const DATA_INICIAL = umAnoAtras.toISOString().slice(0, 10).replace(/-/g, "");
export const DATA_FINAL = hoje.toISOString().slice(0, 10).replace(/-/g, "");

export const DATA_INICIAL_ISO = umAnoAtras.toISOString().slice(0, 10);
export const DATA_FINAL_ISO = hoje.toISOString().slice(0, 10);
