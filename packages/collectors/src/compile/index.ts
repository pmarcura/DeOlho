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

import type { Atom } from "../extract/atoms.js";
import { parsearCampos, type Campos } from "./sections.js";
import { gerarTituloHumano, gerarSubtitulo } from "./titles.js";
import { listarTermosUnicos } from "./glossary.js";
import { scoreComplexidade, type Complexidade } from "./complexity.js";
import { normalizar } from "./normalize.js";
import { textoDocumento, extrairEmenta } from "./document.js";
import { extrairPessoas, extrairOrgaos, type PessoaCitada, type OrgaoCitado } from "./people.js";

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
  /** Texto fiel ao documento, legível (começa no ato, sem boilerplate). */
  textoDocumento: string;
  /** Agentes públicos citados (signatário + nomeado/exonerado), com cargo. */
  pessoas: PessoaCitada[];
  /** Órgãos citados (Secretarias, DAE, Guarda Municipal…). */
  orgaos: OrgaoCitado[];
}

const PAPEL_ALVO = new Set(["nomeado", "exonerado", "designado", "revogado"]);

export function compilar(atom: Atom): CompiledAtom {
  const textoDoc = textoDocumento(atom.resumo, atom.tipo, atom.numero);
  const resumoLimpo = normalizar(atom.resumo);
  const pessoas = extrairPessoas(textoDoc);
  const orgaos = extrairOrgaos(atom.resumo);
  const ementa = extrairEmenta(atom.resumo);

  const campos = parsearCampos(atom.tipo, atom.resumo);

  // Injeta ementa + pessoa-alvo nos atos administrativos — dá título/subtítulo
  // MUITO melhores que o parser de regex sozinho ("Nomear oficial").
  if (campos.tipo === "portaria" || campos.tipo === "decreto" || campos.tipo === "resolucao") {
    if (ementa) campos.dados.ementa = ementa;
    const alvo = pessoas.find((p) => PAPEL_ALVO.has(p.papel));
    if (alvo) {
      campos.dados.agente = alvo.nome;
      if (alvo.cargo && !campos.dados.cargo) campos.dados.cargo = alvo.cargo;
    }
  }

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
    textoDocumento: textoDoc,
    pessoas,
    orgaos,
  };
}

export function compilarLote(atoms: Atom[]): CompiledAtom[] {
  return atoms.map(compilar);
}

export type { Campos } from "./sections.js";
export type { Complexidade } from "./complexity.js";
