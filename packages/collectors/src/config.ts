export const AMERICANA = {
  nome: "Americana",
  uf: "SP",
  ibge: "3501608",
  // CNPJ do Município de Americana — confirmado via Portal da Transparência federal
  // e CNES (2026-05-25). O valor anterior (46523163000106) estava INCORRETO.
  cnpj: "45781176000166",
} as const;

// API de publicação (requer auth) — não usar para leitura
// export const PNCP_TRANSACTION_BASE = "https://pncp.gov.br/api/pncp/v1";

// API de consulta pública — sem autenticação
export const PNCP_BASE = "https://pncp.gov.br/api/consulta/v1";
export const TCE_SP_BASE = "https://transparencia.tce.sp.gov.br";
// Host da API (o domínio principal serve o SPA; /api cai no front e devolve HTML)
export const QUERIDO_DIARIO_BASE = "https://api.queridodiario.ok.org.br";
export const TRANSPARENCIA_AMERICANA_BASE = "https://transparencia.americana.sp.gov.br";
// Quadro de sócios (QSA) — dados públicos da Receita via BrasilAPI.
export const BRASILAPI_CNPJ_BASE = "https://brasilapi.com.br/api/cnpj/v1";
// API de dados da CGU (CEIS/CNEP) — exige header `chave-api-dados` (chave gratuita).
export const CGU_API_BASE = "https://api.portaldatransparencia.gov.br/api-de-dados";
// Dados abertos do TSE (prestação de contas eleitorais — bulk CSV/ZIP).
export const TSE_CDN_BASE = "https://cdn.tse.jus.br/estatistica/sead/odsele";

// janela de coleta inicial: últimos 12 meses
const hoje = new Date();
const umAnoAtras = new Date(hoje);
umAnoAtras.setFullYear(hoje.getFullYear() - 1);

export const DATA_INICIAL = umAnoAtras.toISOString().slice(0, 10).replace(/-/g, "");
export const DATA_FINAL = hoje.toISOString().slice(0, 10).replace(/-/g, "");

export const DATA_INICIAL_ISO = umAnoAtras.toISOString().slice(0, 10);
export const DATA_FINAL_ISO = hoje.toISOString().slice(0, 10);
