/**
 * Normalização de documentos (CNPJ/CPF) — a chave de cruzamento entre fontes.
 *
 * A resolução de entidades (L2) depende de uma forma canônica: só dígitos.
 * "46.523.163/0001-06" e "46523163000106" têm que virar a MESMA chave, senão
 * o mesmo fornecedor aparece duplicado em cada fonte e o join não acontece.
 */

export type DocumentoKind = "cnpj" | "cpf";

/** Mantém só os dígitos; retorna null se não sobrar nada. */
export function normalizarDocumento(doc: string | null | undefined): string | null {
  if (!doc) return null;
  const digitos = doc.replace(/\D+/g, "");
  return digitos.length > 0 ? digitos : null;
}

/** Classifica pelo tamanho: 14 dígitos = CNPJ, 11 = CPF. */
export function tipoDocumento(doc: string | null | undefined): DocumentoKind | null {
  const d = normalizarDocumento(doc);
  if (!d) return null;
  if (d.length === 14) return "cnpj";
  if (d.length === 11) return "cpf";
  return null;
}

/** Valida os dígitos verificadores de um CNPJ (14 dígitos). */
export function cnpjValido(c: string): boolean {
  if (c.length !== 14 || /^(\d)\1{13}$/.test(c)) return false;
  const dv = (base: string, pesos: number[]): number => {
    let soma = 0;
    for (let i = 0; i < pesos.length; i++) soma += Number(base[i]) * pesos[i];
    const r = soma % 11;
    return r < 2 ? 0 : 11 - r;
  };
  const p1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const p2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  return dv(c.slice(0, 12), p1) === Number(c[12]) && dv(c.slice(0, 13), p2) === Number(c[13]);
}

// CNPJ com máscara, sem máscara, ou com espaços que a extração de PDF costuma
// inserir dentro do número (ex.: "12. 345.678/0001-90"). O separador é opcional
// e tolera 1 espaço por grupo.
const CNPJ_RE = /\d{2}[.\s]?\d{3}[.\s]?\d{3}[/\s]?\d{4}[-\s]?\d{2}/g;

/**
 * Extrai CNPJs de um texto livre (ex.: corpo de um diário oficial), validados
 * pelos dígitos verificadores e deduplicados. A validação por DV é o que evita
 * que ruído de OCR/PDF vire uma "menção" falsa (TRUST: nunca afirmar sem base).
 */
export function extrairCnpjs(texto: string): string[] {
  const encontrados = new Set<string>();
  for (const match of texto.matchAll(CNPJ_RE)) {
    const d = match[0].replace(/\D+/g, "");
    if (d.length === 14 && cnpjValido(d)) encontrados.add(d);
  }
  return [...encontrados];
}
