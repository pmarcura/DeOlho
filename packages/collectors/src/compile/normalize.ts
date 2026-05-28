/**
 * Normalizer — converte texto bruto de diário em texto legível, sem perder
 * semântica. Zero LLM, zero custo. Pura engenharia.
 *
 * Implementação token-by-token (sem regex global com \b ASCII) — robusto
 * com acentos (Á/Ç/Ê/...) e com preposições curtas em maiúsculo (DE/DA/DO
 * que precisam virar minúsculo).
 */

// Siglas brasileiras de uso público que devem permanecer em maiúsculo.
const SIGLAS = new Set([
  "DAE", "GAMA", "SMEC", "SMS", "SAU", "PMA", "IBGE", "IBAMA", "INSS",
  "CNPJ", "CPF", "ARP", "CGM", "CMA", "CCSP", "RH", "PCD",
  "LDO", "LOA", "PPA", "CEIS", "CNEP", "TCE", "TSE", "TCU", "STF",
  "STJ", "TJ", "MP", "DOU", "DOE", "CGU", "ANP", "ANS", "ANTT",
  "INMETRO", "INPI", "INPE", "INPC", "IPCA", "ICMS", "ISS",
  "IPTU", "IPVA", "IRPF", "IRPJ", "PIS", "COFINS",
  "FUNDEB", "FUNDEF", "SUS", "SUAS", "SISMUN", "SINESP",
  "PPP", "PEC", "EC", "PL", "PLS", "PLP", "PLC",
  "S.A", "SA", "LTDA", "ME", "EPP", "EIRELI", "MEI", "SPE",
  "UF", "BR", "SP", "RJ", "MG", "BA", "RS", "PR", "SC",
  "PA", "RO", "AC", "TO", "MT", "MS", "GO", "DF", "ES",
  "AL", "SE", "PE", "PB", "CE", "RN", "PI", "MA", "AM", "RR", "AP",
]);

// Palavras que devem ficar em minúsculo no meio de frases/títulos.
const MINUSCULAS = new Set([
  "a", "e", "o", "à", "às", "ao", "aos", "as", "os",
  "da", "de", "di", "do", "du",
  "das", "dos",
  "em", "no", "na", "nos", "nas", "num", "numa", "nuns", "numas",
  "para", "pra", "por", "pelo", "pela", "pelos", "pelas",
  "com", "sem", "sob", "sobre", "até", "ante", "após",
  "que", "se", "ou",
]);

/** Recompõe palavras quebradas por hifenização da diagramação. */
export function corrigirHifenizacao(t: string): string {
  return t.replace(/(\p{L})-\s+(\p{L})/gu, "$1$2");
}

/** Normaliza espaços/quebras de linha em espaços simples. */
export function normalizarEspacos(t: string): string {
  return t.replace(/\s+/g, " ").trim();
}

/**
 * Insere espaço após `:` ou `;` quando o próximo char não é espaço.
 * Crítico pro tokenizer: "CONTRATADA:SABARÁ" precisa virar
 * "CONTRATADA: SABARÁ" pra que cada token seja processado independente.
 */
export function separarPosColon(t: string): string {
  return t.replace(/([:;])(\S)/g, "$1 $2");
}

/** Verifica se o token contém SÓ letras maiúsculas (acentos incluídos). */
function ehTudoMaiusculo(token: string): boolean {
  const letras = token.replace(/[^\p{L}]/gu, "");
  if (letras.length === 0) return false;
  return letras === letras.toUpperCase() && letras !== letras.toLowerCase();
}

/** "SABARÁ" → "Sabará". Preserva acentos. */
function paraTitleCase(token: string): string {
  const lower = token.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/**
 * Pipeline token-by-token.
 * - Quebra por whitespace mantendo separadores
 * - Cada token: se for ALL CAPS de 3+ letras e não for sigla → Title Case
 * - Se token (em qualquer caixa) for preposição (de/da/do/e/em/etc.) e não
 *   for a primeira palavra do texto → minúsculo
 */
export function suavizarAllCaps(t: string): string {
  const partes = t.split(/(\s+)/);
  let palavrasVistas = 0;
  return partes
    .map((parte) => {
      if (/^\s+$/.test(parte) || parte === "") return parte;
      palavrasVistas++;

      // Separa o "core" alfanumérico do trailing punctuation
      const m = parte.match(/^([\p{L}\d.,;:!?()\-/]*)(\W*)$/u);
      const core = (m?.[1] ?? parte);
      const trail = (m?.[2] ?? "");

      const letrasCore = core.replace(/[^\p{L}]/gu, "");

      // Caso 1: token todo em maiúsculas com 3+ letras
      if (letrasCore.length >= 3 && ehTudoMaiusculo(core)) {
        if (SIGLAS.has(letrasCore.toUpperCase())) return parte;
        return paraTitleCase(core) + trail;
      }

      // Caso 2: preposição curta em qualquer caixa (DE, De, de)
      const lowerCore = core.toLowerCase();
      if (MINUSCULAS.has(lowerCore) && palavrasVistas > 1) {
        return lowerCore + trail;
      }

      return parte;
    })
    .join("");
}

/** Formata valor R$ pra notação amigável. */
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
  if (n >= 1_000) return `R$ ${Math.round(n / 1_000)} mil`;
  return `R$ ${n.toFixed(2).replace(".", ",")}`;
}

/** Parseia "R$ 1.240.000,00" pra número. */
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

/** Pipeline completo. */
export function normalizar(t: string): string {
  let out = t;
  out = normalizarEspacos(out);
  out = corrigirHifenizacao(out);
  out = separarPosColon(out);
  out = suavizarAllCaps(out);
  return out;
}
