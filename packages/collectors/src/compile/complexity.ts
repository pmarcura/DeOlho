/**
 * Score de legibilidade — Flesch adaptado para o português brasileiro.
 *
 * Métricas:
 *  - Comprimento médio de frase
 *  - Sílabas médias por palavra
 *  - Densidade de jargão (termos técnicos do glossário)
 *  - Densidade de siglas (UPPERCASE ≥ 3 letras)
 *
 * Saída: nível 1-5 (simples → técnico) + tempo estimado de leitura.
 */

import { detectarTermos } from "./glossary.js";

const VOGAIS = "aeiouáàâãéêíóôõúüy";

/** Conta sílabas heurísticamente (PT-BR). Não é perfeito, mas suficiente. */
function contarSilabas(palavra: string): number {
  const p = palavra.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  let silabas = 0;
  let emVogal = false;
  for (const c of p) {
    const ehVogal = "aeiouy".includes(c);
    if (ehVogal && !emVogal) silabas++;
    emVogal = ehVogal;
  }
  return Math.max(1, silabas);
}

export interface Complexidade {
  /** 1 = muito fácil, 5 = muito técnico */
  nivel: 1 | 2 | 3 | 4 | 5;
  /** Label amigável */
  label: "muito fácil" | "fácil" | "médio" | "técnico" | "muito técnico";
  /** Tempo estimado em segundos (200 WPM padrão) */
  tempoLeitura: number;
  /** Estatísticas brutas */
  stats: {
    palavras: number;
    frases: number;
    palavrasPorFrase: number;
    silabasPorPalavra: number;
    densidadeJargao: number;
    densidadeSiglas: number;
  };
}

export function scoreComplexidade(texto: string): Complexidade {
  // Sentenças (split por ponto/exclamação/interrogação)
  const frases = texto.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const nFrases = Math.max(1, frases.length);

  // Palavras
  const palavras = (texto.match(/[\p{L}]+/gu) ?? []).filter((p) => p.length > 1);
  const nPalavras = Math.max(1, palavras.length);

  const totalSilabas = palavras.reduce((s, p) => s + contarSilabas(p), 0);
  const silabasPorPalavra = totalSilabas / nPalavras;
  const palavrasPorFrase = nPalavras / nFrases;

  // Densidade de jargão (termos do glossário)
  const jargao = detectarTermos(texto).length;
  const densidadeJargao = jargao / nPalavras;

  // Densidade de siglas (palavras inteiramente em maiúsculo, ≥3 letras)
  const siglas = (texto.match(/\b[A-ZÀ-ÝÇ]{3,}\b/g) ?? []).length;
  const densidadeSiglas = siglas / nPalavras;

  // Fórmula composta — quanto MAIOR o score, mais difícil
  // (não é exatamente Flesch, é adaptado pra textos legais BR)
  let score = 0;
  score += palavrasPorFrase * 0.4;     // frases longas pesam
  score += silabasPorPalavra * 12;     // palavras complexas pesam mais
  score += densidadeJargao * 200;      // jargão pesa MUITO
  score += densidadeSiglas * 80;       // siglas pesam médio

  // Bandas (ajustadas empiricamente pra textos do diário)
  let nivel: 1 | 2 | 3 | 4 | 5;
  let label: Complexidade["label"];
  if (score < 25) { nivel = 1; label = "muito fácil"; }
  else if (score < 45) { nivel = 2; label = "fácil"; }
  else if (score < 65) { nivel = 3; label = "médio"; }
  else if (score < 90) { nivel = 4; label = "técnico"; }
  else { nivel = 5; label = "muito técnico"; }

  // Tempo de leitura: 200 wpm = 3,33 wps. Adiciona penalidade pra textos densos.
  const tempoBase = nPalavras / 3.33;
  const tempoLeitura = Math.round(tempoBase * (1 + nivel * 0.1));

  return {
    nivel,
    label,
    tempoLeitura,
    stats: {
      palavras: nPalavras,
      frases: nFrases,
      palavrasPorFrase: Number(palavrasPorFrase.toFixed(1)),
      silabasPorPalavra: Number(silabasPorPalavra.toFixed(1)),
      densidadeJargao: Number(densidadeJargao.toFixed(3)),
      densidadeSiglas: Number(densidadeSiglas.toFixed(3)),
    },
  };
}
