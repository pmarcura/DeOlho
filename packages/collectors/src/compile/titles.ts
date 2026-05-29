/**
 * Title generator — produz títulos humanos a partir dos campos extraídos.
 *
 * Estratégia: vários templates por tipo, com regras de seleção condicional
 * (qual usar depende de quais campos estão presentes). Determinístico,
 * sem invenção. Quando os campos não bastam, cai pro título original
 * ("Contrato nº 03/2022").
 */

import type { Campos } from "./sections.js";
import { valorAmigavel } from "./normalize.js";

const STOP_WORDS_TITULO = ["o", "a", "os", "as", "do", "da", "dos", "das", "de", "para", "com", "em"];

/** Primeira frase — corta só em "." seguido de espaço/fim (não quebra "11.345"). */
function primeiraFrase(s: string): string {
  return s.split(/[.;](?=\s|$)/)[0]!.trim();
}

/** Pega só as N palavras significativas iniciais do objeto pra título compacto. */
function objetoCurto(objeto: string | undefined, maxPalavras = 6): string | null {
  if (!objeto) return null;
  // Tira o "prestação de serviços de", "aquisição de", etc.
  const limpo = objeto
    .replace(/^\s*(presta[çc][ãa]o\s+de\s+(?:servi[çc]os?\s+de\s+)?|aquisi[çc][ãa]o\s+de\s+|contrata[çc][ãa]o\s+de\s+(?:empresa\s+(?:especializada\s+)?(?:para\s+a\s+)?(?:presta[çc][ãa]o\s+de\s+servi[çc]os?\s+de\s+)?)?|fornecimento\s+de\s+|execu[çc][ãa]o\s+de\s+)/i, "")
    .replace(/[.;,].*$/, "")
    .trim();
  const palavras = limpo.split(/\s+/).slice(0, maxPalavras);
  // Capitaliza primeira letra
  if (palavras.length === 0) return null;
  const txt = palavras.join(" ");
  return txt[0]!.toLowerCase() + txt.slice(1);
}

/** "DAE Americana" -> "DAE", "Departamento de Água e Esgoto - DAE" -> "DAE" */
function siglaOuCurto(nome: string | undefined, maxPalavras = 4): string | null {
  if (!nome) return null;
  // Se tem sigla entre parênteses ou após "-", usa a sigla
  const siglaParens = /\(([A-Z]{2,5})\)/.exec(nome);
  if (siglaParens) return siglaParens[1]!;
  const siglaTraco = /-\s*([A-Z]{2,5})\s*$/.exec(nome);
  if (siglaTraco) return siglaTraco[1]!;
  // Senão pega as primeiras N palavras
  const palavras = nome.split(/\s+/).filter((w) => !STOP_WORDS_TITULO.includes(w.toLowerCase())).slice(0, maxPalavras);
  return palavras.join(" ");
}

/** Limita o nome da empresa a algo razoável pra título. */
function nomeEmpresaCurto(razao: string | undefined): string | null {
  if (!razao) return null;
  // Remove sufixos jurídicos
  const limpo = razao.replace(/\s*(LTDA|S\/?A|EIRELI|ME|EPP|SPE|MEI|EMPRESA\s+INDIVIDUAL)\b.*$/i, "").trim();
  const palavras = limpo.split(/\s+/).slice(0, 4);
  return palavras.join(" ");
}

/**
 * Gera título humano a partir dos campos. Retorna null quando não há
 * dados suficientes pra gerar título melhor que o padrão.
 */
export function gerarTituloHumano(campos: Campos, titulo: string): string | null {
  switch (campos.tipo) {
    case "contrato":
    case "aditivo": {
      const c = campos.dados;
      const empresa = nomeEmpresaCurto(c.contratada);
      const orgao = siglaOuCurto(c.contratante);
      const valor = c.valor;
      const isAditivo = campos.tipo === "aditivo";

      // Empresa + valor
      if (empresa && valor) {
        return isAditivo
          ? `Aditivo de ${valorAmigavel(valor)} com ${empresa}`
          : `${orgao ?? "Prefeitura"} contrata ${empresa} por ${valorAmigavel(valor)}`;
      }
      // Empresa sem valor
      if (empresa) {
        return isAditivo
          ? `Aditivo no contrato com ${empresa}`
          : `${orgao ?? "Prefeitura"} contrata ${empresa}`;
      }
      // Objeto + valor (sem empresa)
      const objeto = objetoCurto(c.objeto);
      if (objeto && valor) {
        return isAditivo
          ? `Aditivo de ${valorAmigavel(valor)} em contrato de ${objeto}`
          : `Contrato de ${valorAmigavel(valor)} para ${objeto}`;
      }
      if (objeto) {
        return isAditivo ? `Aditivo no contrato de ${objeto}` : `Contrato de ${objeto}`;
      }
      if (valor) {
        return isAditivo ? `Aditivo de ${valorAmigavel(valor)}` : `Contrato de ${valorAmigavel(valor)}`;
      }
      return null;
    }

    case "lei": {
      const l = campos.dados;
      if (l.ementa) {
        // Pega a primeira frase da ementa (limitada)
        const palavras = primeiraFrase(l.ementa).split(/\s+/).slice(0, 12).join(" ");
        return palavras;
      }
      return null;
    }

    case "portaria":
    case "decreto":
    case "resolucao": {
      const p = campos.dados;
      // 1) Ementa oficial entre aspas é o melhor título ("Exonera servidor…").
      if (p.ementa) {
        return primeiraFrase(p.ementa).split(/\s+/).slice(0, 14).join(" ");
      }
      // 2) Ato + cargo do alvo.
      if (p.ato && p.cargo) {
        const cargoCurto = p.cargo.split(/\s+/).slice(0, 6).join(" ");
        return `${p.ato} para ${cargoCurto}`;
      }
      if (p.ato) return `${p.ato} oficial`;
      return null;
    }

    case "edital":
    case "pregao":
    case "concorrencia":
    case "convite":
    case "ata_registro":
    case "convenio": {
      const p = campos.dados;
      const objeto = objetoCurto(p.objeto, 7);

      if (p.estado === "suspenso") {
        return objeto ? `Licitação suspensa: ${objeto}` : "Licitação suspensa";
      }
      if (p.estado === "anulado") {
        return objeto ? `Licitação anulada: ${objeto}` : "Licitação anulada";
      }
      if (p.estado === "homologado") {
        return objeto ? `Licitação homologada: ${objeto}` : "Licitação homologada";
      }
      if (objeto) {
        return campos.tipo === "convenio"
          ? `Convênio para ${objeto}`
          : `Licitação para ${objeto}`;
      }
      return null;
    }
  }
}

/**
 * Gera subtítulo (1 frase de contexto). Quando o título é técnico ("Contrato
 * nº 03/2022"), o subtítulo dá a pista humana — quem com quem por quanto.
 */
export function gerarSubtitulo(campos: Campos): string | null {
  switch (campos.tipo) {
    case "contrato":
    case "aditivo": {
      const c = campos.dados;
      const partes = [c.contratante, c.contratada].filter(Boolean).map((s) => siglaOuCurto(s!));
      const partesTxt = partes.length === 2 ? `${partes[0]} → ${partes[1]}` : partes[0];
      if (c.valor && c.modalidade) return `${c.modalidade} · ${valorAmigavel(c.valor)}${partesTxt ? ` · ${partesTxt}` : ""}`;
      if (c.valor) return `${valorAmigavel(c.valor)}${partesTxt ? ` · ${partesTxt}` : ""}`;
      if (c.modalidade) return c.modalidade;
      return partesTxt ?? null;
    }
    case "lei": {
      const l = campos.dados;
      if (l.citacoes && l.citacoes.length > 0) {
        return `Cita ${l.citacoes.length} ${l.citacoes.length === 1 ? "referência" : "referências"} legais`;
      }
      return null;
    }
    case "portaria":
    case "decreto":
    case "resolucao": {
      const p = campos.dados;
      // Quem + cargo é o contexto mais útil ("Marcio Raimundo · Chefe de Gabinete").
      if (p.agente) return p.cargo ? `${p.agente} · ${p.cargo}` : p.agente;
      if (p.cargo && p.ato) return `${p.ato.toLowerCase()} para função pública`;
      return null;
    }
    case "edital":
    case "pregao":
    case "concorrencia":
    case "convite":
    case "ata_registro":
    case "convenio": {
      const p = campos.dados;
      const partes = [p.modalidade, p.estado && p.estado !== "indefinido" ? p.estado : null].filter(Boolean);
      return partes.length > 0 ? partes.join(" · ") : null;
    }
  }
}
