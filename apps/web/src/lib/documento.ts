/**
 * Validador/normalizador de CNPJ/CPF — versão client-safe (sem server-only)
 * usado no entity-highlighter pra decidir quando linkar uma referência a /empresa.
 *
 * Lógica idêntica ao packages/collectors/src/utils/documento.ts.
 */
export function normalizarDocumento(doc: string | null | undefined): string | null {
  if (!doc) return null;
  const digitos = doc.replace(/\D+/g, "");
  return digitos.length > 0 ? digitos : null;
}

export function cnpjValido(c: string): boolean {
  if (c.length !== 14 || /^(\d)\1{13}$/.test(c)) return false;
  const dv = (base: string, pesos: number[]): number => {
    let soma = 0;
    for (let i = 0; i < pesos.length; i++) soma += Number(base[i]) * pesos[i]!;
    const r = soma % 11;
    return r < 2 ? 0 : 11 - r;
  };
  const p1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const p2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  return dv(c.slice(0, 12), p1) === Number(c[12]) && dv(c.slice(0, 13), p2) === Number(c[13]);
}
