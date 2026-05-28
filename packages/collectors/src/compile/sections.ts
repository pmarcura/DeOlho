/**
 * Section parser — extrai campos estruturados do texto cru do diário.
 *
 * Cada tipo de ato tem schema próprio. O parser é determinístico: encontra
 * marcadores de seção (CONTRATANTE:, OBJETO:, VALOR, etc.) e captura o que
 * vem até o próximo marcador. Falha silenciosamente quando o padrão não bate
 * (preferimos campo vazio a invenção).
 */

import type { TipoAto } from "../extract/atoms.js";
import { normalizar, dataExtenso, valorAmigavel, parsearValor } from "./normalize.js";

export interface CamposContrato {
  contratante?: string;
  contratada?: string;
  objeto?: string;
  valor?: string;        // já formatado (R$ X,XX mi)
  valorNum?: number;     // bruto
  processo?: string;
  modalidade?: string;
  fundamento?: string;
  vigencia?: string;
  prazo?: string;
}

export interface CamposLei {
  ementa?: string;
  citacoes?: string[];
}

export interface CamposPortaria {
  ato?: string;          // "Nomear", "Exonerar", "Designar", etc.
  agente?: string;       // pessoa (somente quando é função pública)
  cargo?: string;
  fundamento?: string;
}

export interface CamposPregao {
  objeto?: string;
  processo?: string;
  modalidade?: string;
  abertura?: string;
  estado?: "aberto" | "suspenso" | "anulado" | "homologado" | "deserto" | "indefinido";
}

export type Campos =
  | { tipo: "contrato" | "aditivo"; dados: CamposContrato }
  | { tipo: "lei"; dados: CamposLei }
  | { tipo: "portaria" | "decreto" | "resolucao"; dados: CamposPortaria }
  | { tipo: "edital" | "pregao" | "concorrencia" | "convite" | "ata_registro" | "convenio"; dados: CamposPregao };

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Captura conteúdo após marcador até próximo marcador/fim. */
function capturar(texto: string, padrao: RegExp, marcadores: RegExp[]): string | undefined {
  const m = padrao.exec(texto);
  if (!m) return undefined;
  const start = m.index + m[0].length;
  // Encontra próximo marcador depois do match atual
  let proximoFim = texto.length;
  for (const stop of marcadores) {
    stop.lastIndex = start;
    const s = stop.exec(texto);
    if (s && s.index < proximoFim) proximoFim = s.index;
  }
  return normalizar(texto.slice(start, Math.min(proximoFim, start + 400))).trim();
}

// Marcadores comuns de fim de campo num documento de contrato.
const MARCADORES_CONTRATO = [
  /\b(?:CONTRATANTE|CONTRATADA?|CONTRATADO|OBJETO|VALOR|PRAZO|VIG[ÊE]NCIA|PROCESSO|MODALIDADE|FUNDAMENTO|ASSINATURA|DATA)\s*[:\.]/gi,
  /\b(?:CONTRATO|TERMO\s+ADITIVO|EXTRATO)\s+N[º°.]?\s*\d/gi,
];

const MARCADORES_PORTARIA = [
  /\b(?:RESOLVE|CONSIDERANDO|FUNDAMENTO|ART(?:IGO)?\.?\s*1)\b/gi,
  /\b(?:PORTARIA|DECRETO|RESOLU[ÇC][ÃA]O)\s+N[º°.]?\s*\d/gi,
];

const MARCADORES_PREGAO = [
  /\b(?:OBJETO|PROCESSO|ABERTURA|DATA|EDITAL|VALOR|FUNDAMENTO|HOMOLOGA[ÇC][ÃA]O|SUSPENS[ÃA]O|ANULA[ÇC][ÃA]O|FRACASSAD)/gi,
  /\b(?:PREG[ÃA]O|CONCORR[ÊE]NCIA|EDITAL|CONVITE|ATA\s+DE\s+REGISTRO)\s+(?:ELETR[ÔO]NICO|N[º°.]?\s*\d)/gi,
];

// ── Parsers por tipo ─────────────────────────────────────────────────────────

function parsearContrato(t: string): CamposContrato {
  const c: CamposContrato = {};

  c.contratante = capturar(t, /\bCONTRATANTE\s*[:\.]\s*/gi, MARCADORES_CONTRATO);
  c.contratada = capturar(t, /\bCONTRATADA?\s*[:\.]\s*/gi, MARCADORES_CONTRATO)
    ?? capturar(t, /\bCONTRATADO\s*[:\.]\s*/gi, MARCADORES_CONTRATO);
  c.objeto = capturar(t, /\b(?:OBJETO|Objeto)\s*[:\.]?\s+/g, MARCADORES_CONTRATO);
  c.processo = capturar(t, /\bPROCESSO(?:\s+ORIGINAL)?\s*(?:N[º°.]?)?\s*[:\.]?\s*/gi, MARCADORES_CONTRATO);

  // Modalidade — captura até o próximo marcador OU "-" (separador comum)
  const modMatch = /\b(DISPENSA\s+DE\s+LICITA[ÇC][ÃA]O|INEXIGIBILIDADE|PREG[ÃA]O\s+ELETR[ÔO]NICO|CONCORR[ÊE]NCIA|TOMADA\s+DE\s+PRE[ÇC]OS|CONVITE)/i.exec(t);
  if (modMatch) c.modalidade = titleCaseSimples(modMatch[1]!);

  // Fundamento legal — "Art X Inc Y Lei Z"
  const fundMatch = /\b(?:Fundamento(?:\s+Legal)?|FUNDAMENTO)\s*[:\.]?\s*([^|\n]+?(?:Lei\s+[\d./]+|14\.133\/21|8\.666\/93)[^|\n]*)/i.exec(t);
  if (fundMatch) c.fundamento = normalizar(fundMatch[1]!).trim();

  // Vigência / prazo
  const vigMatch = /\bVIG[ÊE]NCIA\s*[:\.]?\s*([^|\n]+)/i.exec(t);
  if (vigMatch) c.vigencia = normalizar(vigMatch[1]!.slice(0, 80));

  const prazoMatch = /\bPRAZO\s*[:\.]?\s*([^|\n]+)/i.exec(t);
  if (prazoMatch) c.prazo = normalizar(prazoMatch[1]!.slice(0, 80));

  // Valor R$
  const valMatch = /R\$\s*([\d.]+,\d{2})/.exec(t);
  if (valMatch) {
    c.valor = `R$ ${valMatch[1]}`;
    c.valorNum = parsearValor(valMatch[0]);
  }

  return c;
}

function parsearLei(t: string): CamposLei {
  const l: CamposLei = {};

  // Ementa típica: "Dispõe sobre..." ou "Autoriza..."
  // Limita o lookbehind pra não dar regex backtracking catastrófico.
  const ementaMatch = /\b(Disp[õo]e\s+sobre|Autoriza|Institui|Cria|Estabelece|Altera|Revoga|Concede|Define)[^.]{20,300}/i.exec(t);
  if (ementaMatch) l.ementa = ementaMatch[0].trim().slice(0, 320);

  // Citações: regex SIMPLES (sem grupos opcionais aninhados — evita backtracking)
  const cits = new Set<string>();
  const citRe = /\bLei\s+n[º°.]?\s*[\d.]+(?:\/\d{2,4})?/gi;
  let safety = 0;
  let cm: RegExpExecArray | null;
  while ((cm = citRe.exec(t)) !== null && safety < 100) {
    safety++;
    cits.add(cm[0].replace(/\s+/g, " "));
    if (cits.size >= 8) break;
  }
  l.citacoes = Array.from(cits);
  return l;
}

function parsearPortaria(t: string): CamposPortaria {
  const p: CamposPortaria = {};

  // Ato administrativo: "Nomear", "Exonerar", "Designar", etc.
  const atoMatch = /\b(Nomear|Exonerar|Designar|Conceder|Aprovar|Dispor|Autorizar|Retificar|Constituir|Convocar|Suspender)\s+/i.exec(t);
  if (atoMatch) p.ato = atoMatch[1]!;

  // Cargo — captura padrão "no cargo de" ou "para o cargo de"
  const cargoMatch = /(?:no\s+cargo\s+de|para\s+o?\s*cargo\s+de|para\s+exercer\s+(?:a\s+)?fun[çc][ãa]o\s+de)\s+([^.,;()|]+?)(?:[.,;]|\s+do\s+|\s+da\s+|\s+na\s+|\s+no\s+|\s+em\s+|$)/i.exec(t);
  if (cargoMatch) p.cargo = normalizar(cargoMatch[1]!).trim().slice(0, 120);

  // Fundamento
  const fundMatch = /\b(?:Fundamento(?:\s+Legal)?|FUNDAMENTO)\s*[:\.]?\s*([^|\n]+?(?:Lei\s+[\d./]+)[^|\n]*)/i.exec(t);
  if (fundMatch) p.fundamento = normalizar(fundMatch[1]!).trim();

  return p;
}

function parsearPregao(t: string): CamposPregao {
  const p: CamposPregao = {};

  p.objeto = capturar(t, /\b(?:OBJETO|Objeto)\s*[:\.]?\s+/g, MARCADORES_PREGAO);
  p.processo = capturar(t, /\bPROCESSO\s*(?:N[º°.]?)?\s*[:\.]?\s*/gi, MARCADORES_PREGAO);

  // Modalidade
  const modMatch = /\b(PREG[ÃA]O\s+(?:ELETR[ÔO]NICO|PRESENCIAL)|CONCORR[ÊE]NCIA|CONVITE|TOMADA\s+DE\s+PRE[ÇC]OS|DISPENSA\s+DE\s+LICITA[ÇC][ÃA]O)/i.exec(t);
  if (modMatch) p.modalidade = titleCaseSimples(modMatch[1]!);

  // Abertura
  const abMatch = /\b(?:ABERTURA|DATA\s+DA\s+ABERTURA)\s*[:\.]?\s*(\d{2}\/\d{2}\/\d{4}(?:\s+às?\s+\d{2}[:h]\d{2})?)/i.exec(t);
  if (abMatch) p.abertura = dataExtenso(abMatch[1]!).replace(/(às?\s+\d+):?(\d+)/, "às $1:$2");

  // Estado
  if (/\b(?:SUSPENS[AÃ]O|SUSPENDID[OA])\b/i.test(t)) p.estado = "suspenso";
  else if (/\bANULAD[OA]\b/i.test(t)) p.estado = "anulado";
  else if (/\bHOMOLOGAD[OA]\b/i.test(t)) p.estado = "homologado";
  else if (/\bFRACASSAD[OA]|DESERTO\b/i.test(t)) p.estado = "deserto";
  else if (/\bABERTUR[AO]|AVISO\s+DE\s+LICITA[ÇC][ÃA]O\b/i.test(t)) p.estado = "aberto";
  else p.estado = "indefinido";

  return p;
}

function titleCaseSimples(s: string): string {
  return s
    .toLowerCase()
    .split(/\s+/)
    .map((w, i) => (i === 0 || !["de", "da", "do", "das", "dos", "e"].includes(w))
      ? (w[0]?.toUpperCase() ?? "") + w.slice(1)
      : w)
    .join(" ");
}

// ── Dispatcher principal ─────────────────────────────────────────────────────

export function parsearCampos(tipo: TipoAto, texto: string): Campos {
  const t = normalizar(texto);
  switch (tipo) {
    case "contrato":
    case "aditivo":
      return { tipo, dados: parsearContrato(t) };
    case "lei":
      return { tipo, dados: parsearLei(t) };
    case "portaria":
    case "decreto":
    case "resolucao":
      return { tipo, dados: parsearPortaria(t) };
    case "edital":
    case "pregao":
    case "concorrencia":
    case "convite":
    case "ata_registro":
    case "convenio":
      return { tipo, dados: parsearPregao(t) };
  }
}

// Exports auxiliares pra outros módulos
export { valorAmigavel };
