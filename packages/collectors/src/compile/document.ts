/**
 * Document text cleaner — "pegar o texto direto do documento mesmo".
 *
 * O extrator pega uma janela de ~1500 chars em torno do match do ato. Essa
 * janela começa ANTES do ato (pra dar contexto ao parser) e por isso vaza o
 * rodapé/assinatura do ato anterior ("…NTONIO SARDELLI PREFEITO MUNICIPAL…").
 *
 * Este módulo produz um texto FIEL ao documento, porém legível:
 *  1. começa exatamente no cabeçalho do próprio ato;
 *  2. remove boilerplate de página (DIÁRIO OFICIAL, datas de rodapé, e-mails…);
 *  3. corta no início do próximo ato numerado (1 ato = 1 post);
 *  4. corrige hifenização de quebra de linha.
 *
 * Não reescreve nem inventa — só recorta e limpa ruído de diagramação.
 */

import type { TipoAto } from "../extract/atoms.js";

const ACT_LABEL: Record<TipoAto, string> = {
  lei: "LEI(?:\\s+COMPLEMENTAR)?",
  decreto: "DECRETO",
  portaria: "PORTARIA",
  resolucao: "RESOLU[ÇC][ÃA]O",
  contrato: "CONTRATO",
  aditivo: "(?:TERMO\\s+ADITIVO|ADITIVO|EXTRATO\\s+DE\\s+TERMO\\s+ADITIVO)",
  edital: "EDITAL",
  pregao: "PREG[ÃA]O",
  convite: "(?:CARTA\\s+CONVITE|CONVITE)",
  concorrencia: "CONCORR[ÊE]NCIA",
  convenio: "CONV[ÊE]NIO",
  ata_registro: "ATA\\s+DE\\s+REGISTRO\\s+DE\\s+PRE[ÇC]OS?",
};

// Cabeçalhos de ato numerado que marcam claramente um NOVO ato (pra corte).
// CASE-SENSITIVE de propósito: o cabeçalho real vem em CAIXA ALTA com data
// formal ("PORTARIA Nº 12.273, DE 22 DE OUTUBRO DE 2025"), enquanto uma CITAÇÃO
// dentro da ementa vem em minúsculo ("revoga a Portaria nº 11.345, de 22 de
// janeiro"). Exigir "DE <dia>" maiúsculo evita cortar numa citação.
const PROXIMO_ATO_RE =
  /\b(?:PORTARIA|DECRETO|LEI(?:\s+COMPLEMENTAR)?|RESOLU[ÇC][ÃA]O)\s+N[º°.]?\s*[\d.]+,?\s+DE\s+\d/g;

// Ruído de diagramação a remover em qualquer posição.
const BOILERPLATE: RegExp[] = [
  /\b\d{1,3}\s+DI[ÁA]RIO\s+OFICIAL\b/gi,
  /\bDI[ÁA]RIO\s+OFICIAL\b/gi,
  /(?:Segunda|Ter[çc]a|Quarta|Quinta|Sexta|S[áa]bado|Domingo)[\s-]*feira,?\s+\d{1,2}\s+de\s+[a-zç]+\s+de\s+\d{4}\.?/gi,
  /[\w.+-]+@[\w.-]+\.\w{2,}/g, // e-mails
  /\bwww\.[\w.-]+/gi,
  /\bRua\s+[A-ZÀ-Ý][^,]{2,40},\s*n[º°.]?\s*\d+/gi, // endereço do cabeçalho
];

function escaparNumero(numero: string): string {
  return numero.replace(/[.\\]/g, "\\.?").replace(/\//g, "\\/");
}

/** Acha o índice do cabeçalho do próprio ato dentro do trecho. */
function indiceDoAto(texto: string, tipo: TipoAto, numero: string): number {
  const label = ACT_LABEL[tipo];
  const re = new RegExp(`${label}[^\\n]{0,18}?N[º°.]?\\s*${escaparNumero(numero)}\\b`, "i");
  const m = re.exec(texto);
  return m ? m.index : -1;
}

/**
 * Produz o texto fiel e legível do ato.
 * @param maxLen comprimento máximo do corpo (corta em fronteira de frase).
 */
export function textoDocumento(
  resumoCru: string,
  tipo: TipoAto,
  numero: string,
  maxLen = 900,
): string {
  // 1. Corrige hifenização + normaliza espaços + espaço após pontuação.
  let t = resumoCru
    .replace(/^…/, "")
    .replace(/(\p{L})-\s+(\p{L})/gu, "$1$2")
    .replace(/\s+/g, " ")
    // espaço após pontuação só quando vem LETRA (não quebra "12.274"/"31.774,56")
    .replace(/([,;:.])(?=\p{L})/gu, "$1 ")
    .trim();

  // 2. Começa no cabeçalho do próprio ato.
  const idx = indiceDoAto(t, tipo, numero);
  if (idx > 0) {
    t = t.slice(idx);
  } else {
    // Fallback: descarta fragmento inicial (palavra cortada / minúsculas) até
    // a primeira palavra "limpa" iniciada em maiúscula após espaço.
    const limpoStart = /[\s]([A-ZÀ-Ý][a-zà-ÿ])/.exec(" " + t);
    if (limpoStart && limpoStart.index > 0 && limpoStart.index < 60) {
      t = t.slice(limpoStart.index);
    }
  }

  // 3. Corta no início do PRÓXIMO ato numerado (1 ato = 1 post).
  PROXIMO_ATO_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  let safety = 0;
  while ((m = PROXIMO_ATO_RE.exec(t)) !== null && safety < 20) {
    safety++;
    if (m.index > 40) {
      t = t.slice(0, m.index);
      break;
    }
  }

  // 4. Remove boilerplate de diagramação.
  for (const re of BOILERPLATE) t = t.replace(re, " ");

  // 5. Corta blocos de fechamento/assinatura repetitivos.
  t = t
    .replace(/\bPublicad[oa]\s+na\s+mesma\s+data.*$/i, "")
    .replace(/\bRegistre-se\s+e\s+publique-se.*$/i, "")
    .replace(/\s+/g, " ")
    .trim();

  // 6. Limita o tamanho terminando em fronteira de frase.
  if (t.length > maxLen) {
    const corte = t.slice(0, maxLen);
    const ultimoPonto = Math.max(corte.lastIndexOf(". "), corte.lastIndexOf("; "));
    t = (ultimoPonto > maxLen * 0.5 ? corte.slice(0, ultimoPonto + 1) : corte).trim() + "…";
  }

  return t;
}

/**
 * Extrai a EMENTA entre aspas que vem logo após o cabeçalho de portarias,
 * decretos e leis: «PORTARIA Nº X, DE … . "Que exonera servidor comissionado."»
 * Devolve sem o "Que " inicial e sem aspas. null se não houver.
 */
export function extrairEmenta(textoCru: string): string | null {
  const t = textoCru.replace(/\s+/g, " ");
  const m = /["“”]\s*([^"“”]{6,180})\s*["“”]/.exec(t);
  if (!m) return null;
  let e = m[1]!.trim().replace(/\s+/g, " ");
  e = e.replace(/^Que\s+/i, ""); // "Que exonera..." → "exonera..."
  e = e.charAt(0).toUpperCase() + e.slice(1);
  return e.replace(/\.$/, "");
}
