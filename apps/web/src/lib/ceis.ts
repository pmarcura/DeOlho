/**
 * CGU CEIS — sanções a empresas (inidôneas, suspensas de licitar).
 *
 * API CGU em `https://api.portaldatransparencia.gov.br/api-de-dados/ceis`,
 * exige header `chave-api-dados` (chave gratuita de cadastro de e-mail).
 * Shape verificado ao vivo em 26/05 — campos de sanção no TOPO do item.
 *
 * Usado pra mostrar honestamente "essa empresa consta no CEIS" como SINAL
 * de atenção (nunca acusação) na página da empresa.
 */
import "server-only";

const BASE = "https://api.portaldatransparencia.gov.br/api-de-dados";

export interface CeisItem {
  id: number;
  pessoa?: {
    cnpjFormatado?: string;
    cpfFormatado?: string;
    nome?: string;
    razaoSocialReceita?: string;
    tipo?: string;
  };
  tipoSancao?: { descricaoResumida?: string };
  orgaoSancionador?: { nome?: string };
  fonteSancao?: { nomeExibicao?: string };
  dataInicioSancao?: string;
  dataFimSancao?: string;
  textoPublicacao?: string;
  linkPublicacao?: string;
}

/**
 * Procura sanções em CEIS para um CNPJ. A API não tem filtro direto por CNPJ
 * estável — varremos páginas e filtramos. Como é chamada server-side com cache,
 * o custo é absorvido. Limite default conservador (30 páginas = 450 sanções
 * varridas) — produção real precisa de índice próprio (futuro).
 */
export async function fetchSancoesCnpj(
  cnpj: string,
  cadastro: "ceis" | "cnep" = "ceis",
  maxPaginas = 30,
): Promise<CeisItem[]> {
  const key = process.env.PORTAL_TRANSPARENCIA_API_KEY;
  if (!key) return [];

  const docAlvo = cnpj.replace(/\D+/g, "");
  if (docAlvo.length !== 14) return [];

  const achadas: CeisItem[] = [];
  for (let p = 1; p <= maxPaginas; p++) {
    try {
      const res = await fetch(`${BASE}/${cadastro}?pagina=${p}`, {
        headers: { "chave-api-dados": key, Accept: "application/json" },
        next: { revalidate: 21600 }, // 6h
      });
      if (!res.ok) break;
      const body = (await res.json()) as unknown;
      if (!Array.isArray(body) || body.length === 0) break;
      for (const item of body as CeisItem[]) {
        const docItem = (item.pessoa?.cnpjFormatado ?? item.pessoa?.cpfFormatado ?? "").replace(/\D+/g, "");
        if (docItem === docAlvo) achadas.push(item);
      }
    } catch {
      break;
    }
  }
  return achadas;
}
