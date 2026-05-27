/**
 * BrasilAPI — dados públicos de CNPJ (Receita Federal), incluindo QSA.
 *
 * Usado server-side em páginas de empresa. Cache de 1 hora via fetch revalidate.
 * Sócios vêm com CPF mascarado (***571038**) — é o que a Receita expõe e o que
 * respeita a separação pessoa pública × cidadão comum.
 */
import "server-only";

const BASE = "https://brasilapi.com.br/api/cnpj/v1";

export interface BrasilApiSocio {
  nome_socio: string;
  cnpj_cpf_do_socio: string | null;
  qualificacao_socio: string | null;
  faixa_etaria: string | null;
  data_entrada_sociedade: string | null;
}

export interface BrasilApiCnpj {
  cnpj: string;
  razao_social?: string;
  nome_fantasia?: string;
  cnae_fiscal_descricao?: string;
  descricao_situacao_cadastral?: string;
  data_inicio_atividade?: string;
  logradouro?: string;
  numero?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  cep?: string;
  qsa?: BrasilApiSocio[];
}

export interface BrasilApiError {
  type: string;
  name: string;
  message: string;
}

export function normalizarCnpj(s: string): string {
  return s.replace(/\D+/g, "");
}

/**
 * Busca os dados públicos do CNPJ. Retorna null se inválido/inexistente
 * (em vez de lançar — facilita renderização de página "não encontrada" honesta).
 */
export async function fetchCnpj(cnpj: string): Promise<BrasilApiCnpj | null> {
  const doc = normalizarCnpj(cnpj);
  if (doc.length !== 14) return null;
  try {
    const res = await fetch(`${BASE}/${doc}`, {
      headers: { Accept: "application/json", "User-Agent": "DeOlho/0.1 (transparencia civica)" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return (await res.json()) as BrasilApiCnpj;
  } catch {
    return null;
  }
}
