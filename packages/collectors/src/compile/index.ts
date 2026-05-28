/**
 * Civic Content Compiler — entrada principal.
 *
 * Pega um átomo cru (texto extraído do PDF) e produz um átomo enriquecido
 * com título humano, subtítulo, campos estruturados, glossário detectado
 * e score de complexidade. Tudo determinístico, zero LLM, zero custo.
 *
 * O compiler nunca INVENTA — só REORGANIZA o que já existe no texto.
 * Quando um campo não aparece no padrão esperado, fica vazio (preferimos
 * lacuna a fato fabricado).
 */

import type { Atom, TipoAto } from "../extract/atoms.js";
import { parsearCampos, type Campos } from "./sections.js";
import { gerarTituloHumano, gerarSubtitulo } from "./titles.js";
import { listarTermosUnicos } from "./glossary.js";
import { scoreComplexidade, type Complexidade } from "./complexity.js";
import { normalizar } from "./normalize.js";

export interface CompiledAtom extends Atom {
  /** Título humano gerado por templates condicionais — null = sem dados. */
  tituloHumano: string | null;
  /** 1 frase de contexto extra (modalidade, partes, valor). */
  subtitulo: string | null;
  /** Campos estruturados extraídos por tipo. */
  campos: Campos;
  /** Termos técnicos únicos detectados no resumo, com definição leiga. */
  glossario: Array<{ termo: string; definicao: string }>;
  /** Score de legibilidade + tempo de leitura. */
  complexidade: Complexidade;
  /** Texto cru já normalizado (espaços, hifenização, ALL CAPS suavizado). */
  resumoLimpo: string;
}

export function compilar(atom: Atom): CompiledAtom {
  const resumoLimpo = normalizar(atom.resumo);
  const campos = parsearCampos(atom.tipo, atom.resumo);
  const tituloHumano = gerarTituloHumano(campos, atom.titulo);
  const subtitulo = gerarSubtitulo(campos);
  const glossario = listarTermosUnicos(atom.resumo);
  const complexidade = scoreComplexidade(resumoLimpo);

  return {
    ...atom,
    tituloHumano,
    subtitulo,
    campos,
    glossario,
    complexidade,
    resumoLimpo,
  };
}

export function compilarLote(atoms: Atom[]): CompiledAtom[] {
  return atoms.map(compilar);
}

export type { Campos } from "./sections.js";
export type { Complexidade } from "./complexity.js";
