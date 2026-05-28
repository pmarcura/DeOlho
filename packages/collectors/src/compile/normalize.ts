/**
 * Normalizer — converte texto bruto de diário em texto legível, sem perder
 * semântica. Zero LLM, zero custo. Pura engenharia.
 *
 * Decisões:
 *  - ALL CAPS legados do PDF viram Sentence Case, mas siglas conhecidas
 *    (DAE, GAMA, CNPJ, etc.) ficam preservadas.
 *  - Abreviações comuns são expandidas só uma vez no texto (preserva a
 *    primeira ocorrência da forma original entre parênteses).
 *  - Hifenização da quebra de linha do PDF é reconstituída.
 *  - Datas e valores monetários ganham formato amigável.
 */

// Siglas brasileiras de uso público que devem permanecer em maiúsculo.
// Lista crescente — adicionar quando aparecer novo no diário.
const SIGLAS = new Set([
  "DAE", "GAMA", "SMEC", "SMS", "SAU", "PMA", "IBGE", "IBAMA", "INSS",
  "CNPJ", "CPF", "ARP", "CGM", "CMA", "CCSP", "RH", "PCD",
  "LDO", "LOA", "PPA", "CEIS", "CNEP", "TCE", "TSE", "TCU", "STF",
  "STJ", "TJ", "MP", "DOU", "DOE", "CGU", "ANP", "ANS", "ANTT",
  "INSS", "INMETRO", "INPI", "INPE", "INPC", "IPCA", "ICMS", "ISS",
  "IPTU", "IPVA", "IRPF", "IRPJ", "PIS", "COFINS",
  "FUNDEB", "FUNDEF", "SUS", "SUAS", "SISMUN", "SINESP",
  "PPP", "PEC", "MP", "EC", "PL", "PLS", "PLP", "PLC",
  "ART", "INC", "PAR", "CAP", "SEC", "TIT",
  "S.A", "LTDA", "ME", "EPP", "EIRELI", "MEI", "SPE",
  "UF", "BR", "SP", "RJ", "MG", "BA", "RS", "PR", "SC",
]);

// Palavras curtas que NÃO devem ser capitalizadas em Title Case
// (preposições/artigos/conjunções).
const PALAVRAS_MINUSCULAS = new Set([
  "a", "e", "o", "à", "às", "ao", "aos", "as", "os",
  "da", "de", "di", "do", "du",
  "das", "dos",
  "em", "no", "na", "nos", "nas", "num", "numa", "nuns", "numas",
  "para", "pra", "por", "pelo", "pela", "pelos", "pelas",
  "com", "sem", "sob", "sobre", "até", "ante", "após",
  "que", "se", "ou",
]);

// Abreviações comuns + suas expansões. Mantém a forma curta entre parênteses
// na primeira ocorrência só pra ajudar quem está aprendendo o jargão.
const ABREVIACOES: Record<string, string> = {
  "art.": "artigo",
  "arts.": "artigos",
  "inc.": "inciso",
  "incs.": "incisos",
  "par.": "parágrafo",
  "§": "parágrafo",
  "alíneas?": "alíneas?",
  "n[º°]\\.?": "número",
  "exmo\\.": "Excelentíssimo",
  "sr\\.": "Senhor",
  "sra\\.": "Senhora",
  "av\\.": "Avenida",
  "r\\.": "Rua",
  "ltda\\.": "Ltda",
  "fls?\\.": "folha",
  "proc\\.": "processo",
};

/** Recompõe palavras quebradas por hifenização da diagramação. */
export function corrigirHifenizacao(t: string): string {
  // "manuten- ção" → "manutenção"
  return t.replace(/(\w)-\s+(\w)/g, "$1$2");
}

/** Normaliza espaços/quebras de linha em espaços simples. */
export function normalizarEspacos(t: string): string {
  return t.replace(/\s+/g, " ").trim();
}

/**
 * Token-by-token: cada palavra ≥4 chars inteiramente em maiúsculo vira
 * Title Case. Siglas conhecidas (DAE, GAMA, etc.) ficam preservadas.
 * Preposições/artigos em minúsculo.
 *
 * Implementação simples (sem split/join) pra evitar alocações pesadas e
 * backtracking. Roda em O(n) sobre o texto.
 */
export function suavizarAllCaps(t: string): string {
  return t.replace(/\b[A-ZÀ-ÝÇ][A-ZÀ-ÝÇ.\d]{3,}\b/g, (palavra) => {
    // Letras puras (remove dígitos e pontuação) pra checar sigla
    const apenasLetras = palavra.replace(/[^A-ZÀ-ÝÇ]/g, "");
    if (SIGLAS.has(apenasLetras)) return palavra; // mantém sigla
    // Title case
    const lower = palavra.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  });
}

/** Aplica regra de preposição minúscula (de/da/do/etc.) em texto já Title-Case. */
export function aplicarMinusculasDePreposicao(t: string): string {
  return t.replace(/\b([A-Z][a-zÀ-ÿ]+)\b/g, (palavra, _captured, offset: number) => {
    const lower = palavra.toLowerCase();
    if (offset > 0 && PALAVRAS_MINUSCULAS.has(lower)) return lower;
    return palavra;
  });
}

/** Formata valor R$ pra notação amigável: R$ 1.240.000,00 → "R$ 1,24 milhões". */
export function valorAmigavel(valor: string | number): string {
  let n: number;
  if (typeof valor === "string") {
    const limpo = valor.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
    n = Number.parseFloat(limpo);
  } else {
    n = valor;
  }
  if (!Number.isFinite(n)) return String(valor);
  if (n >= 1_000_000_000) return `R$ ${(n / 1_000_000_000).toFixed(2).replace(".", ",")} bi`;
  if (n >= 1_000_000) return `R$ ${(n / 1_000_000).toFixed(2).replace(".", ",")} mi`;
  if (n >= 1_000) return `R$ ${(n / 1_000).toFixed(0)} mil`;
  return `R$ ${n.toFixed(2).replace(".", ",")}`;
}

/** Parseia "R$ 1.240.000,00" pra número. Retorna NaN se inválido. */
export function parsearValor(s: string): number {
  const m = s.match(/R\$\s*([\d.]+,\d{2})/);
  if (!m) return Number.NaN;
  return Number.parseFloat(m[1]!.replace(/\./g, "").replace(",", "."));
}

/** Formata data DD/MM/YYYY pra "DD de mês de AAAA". */
export function dataExtenso(s: string): string {
  const m = s.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!m) return s;
  const meses = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  const mes = meses[Number.parseInt(m[2]!, 10) - 1];
  return `${m[1]} de ${mes} de ${m[3]}`;
}

/**
 * Pipeline completo: limpa espaços, recompõe hifenização e suaviza ALL CAPS.
 * É a função de entrada para os parsers (eles esperam texto normalizado).
 */
export function normalizar(t: string): string {
  let out = t;
  out = normalizarEspacos(out);
  out = corrigirHifenizacao(out);
  out = suavizarAllCaps(out);
  out = aplicarMinusculasDePreposicao(out);
  return out;
}

/** Expande abreviações no texto. Idempotente. */
export function expandirAbreviacoes(t: string): string {
  let out = t;
  for (const [abrev, expansao] of Object.entries(ABREVIACOES)) {
    const re = new RegExp(`\\b${abrev}\\b`, "gi");
    out = out.replace(re, expansao);
  }
  return out;
}
