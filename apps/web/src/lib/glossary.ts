/**
 * Glossário cívico — espelho do collector's `compile/glossary.ts`.
 *
 * Cada termo tem regex pra detectar no texto e definição leiga em PT-BR.
 * Mantido aqui pra detectar inline no client durante render do AtomCard.
 */

export interface TermoGlossario {
  termo: string;
  padroes: RegExp[];
  definicao: string;
}

export const GLOSSARIO: TermoGlossario[] = [
  {
    termo: "Dispensa de licitação",
    padroes: [/\bdispensa\s+de\s+licita[çc][ãa]o\b/i],
    definicao: "Quando a prefeitura compra direto de uma empresa, sem licitação pública. Só é permitido em casos previstos em lei — pequeno valor, emergência, fornecedor único, etc.",
  },
  {
    termo: "Inexigibilidade",
    padroes: [/\binexigibilidade\b/i],
    definicao: "Quando licitação é impossível porque só existe um fornecedor (ex.: serviço técnico específico, artista consagrado).",
  },
  {
    termo: "Pregão eletrônico",
    padroes: [/\bpreg[ãa]o\s+eletr[ôo]nico\b/i],
    definicao: "Licitação online onde empresas competem em preço ao vivo. O mais usado pra compras simples.",
  },
  {
    termo: "Concorrência pública",
    padroes: [/\bconcorr[êe]ncia\s+p[úu]blica\b/i, /\bconcorr[êe]ncia\s+n[º°]/i],
    definicao: "Licitação maior, pra obras e contratos de valor alto. Aberta a qualquer empresa que cumpra os requisitos.",
  },
  {
    termo: "Tomada de preços",
    padroes: [/\btomada\s+de\s+pre[çc]os\b/i],
    definicao: "Licitação de valor médio, só pra empresas previamente cadastradas no município.",
  },
  {
    termo: "Termo aditivo",
    padroes: [/\btermo\s+aditivo\b/i, /\baditivo\s+contratual\b/i],
    definicao: "Mudança num contrato existente — geralmente acrescenta prazo, valor ou serviço.",
  },
  {
    termo: "Ata de registro de preços",
    padroes: [/\bata\s+de\s+registro\s+de\s+pre[çc]os?\b/i, /\bARP\b/],
    definicao: "Catálogo de produtos com preço acordado. A prefeitura compra quando precisar, sem nova licitação a cada vez.",
  },
  {
    termo: "Lei 14.133/21",
    padroes: [/\b(?:lei\s+(?:federal\s+)?(?:n[º°.]?\s*)?)?14\.?133\s*\/?\s*(?:2021|21)\b/i],
    definicao: "Nova Lei de Licitações brasileira, em vigor desde 2021. Substitui a Lei 8.666/93.",
  },
  {
    termo: "Lei 8.666/93",
    padroes: [/\b(?:lei\s+(?:federal\s+)?(?:n[º°.]?\s*)?)?8\.?666\s*\/?\s*(?:1993|93)\b/i],
    definicao: "Antiga Lei de Licitações (1993). Ainda usada em contratos firmados antes da nova lei (14.133).",
  },
  {
    termo: "Fundamento legal",
    padroes: [/\bfundamento\s+legal\b/i],
    definicao: "Base jurídica que autoriza o ato. Cita lei + artigo + inciso que dá amparo legal.",
  },
  {
    termo: "Empenho",
    padroes: [/\bempenho\b/i],
    definicao: "Promessa formal de pagamento. A prefeitura 'reserva' o dinheiro no orçamento antes de efetivamente pagar.",
  },
  {
    termo: "Liquidação",
    padroes: [/\bliquida[çc][ãa]o\b/i],
    definicao: "Confirmação de que o serviço foi entregue/produto recebido. Só depois disso o pagamento pode ser feito.",
  },
  {
    termo: "Ementa",
    padroes: [/\bementa\b/i],
    definicao: "Resumo oficial de uma lei. Uma ou duas frases dizendo do que ela trata.",
  },
  {
    termo: "Vigência",
    padroes: [/\bvig[êe]ncia\b/i],
    definicao: "Período em que algo vale legalmente — quando começa e quando termina.",
  },
  {
    termo: "Homologação",
    padroes: [/\bhomologa[çc][ãa]o\b/i, /\bhomologad[oa]\b/i],
    definicao: "Aprovação final de uma licitação. Depois disso, o contrato pode ser assinado com a empresa vencedora.",
  },
];

export interface OcorrenciaTermo {
  termo: string;
  definicao: string;
  match: string;
  start: number;
  end: number;
}

/** Detecta ocorrências no texto. Anti-loop e dedup por posição. */
export function detectarTermos(texto: string): OcorrenciaTermo[] {
  const todas: OcorrenciaTermo[] = [];
  for (const t of GLOSSARIO) {
    for (const padrao of t.padroes) {
      padrao.lastIndex = 0;
      let safety = 0;
      let m: RegExpExecArray | null;
      while ((m = padrao.exec(texto)) !== null && safety < 30) {
        safety++;
        if (m[0].length === 0) { padrao.lastIndex++; continue; }
        todas.push({
          termo: t.termo,
          definicao: t.definicao,
          match: m[0],
          start: m.index,
          end: m.index + m[0].length,
        });
      }
    }
  }
  todas.sort((a, b) => a.start - b.start);
  const final: OcorrenciaTermo[] = [];
  let cursor = 0;
  for (const o of todas) {
    if (o.start < cursor) continue;
    final.push(o);
    cursor = o.end;
  }
  return final;
}
