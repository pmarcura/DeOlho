/**
 * Glossário de jargão legal/cívico brasileiro.
 *
 * Cada termo tem (a) regex pra detectar no texto, (b) definição curta em
 * linguagem de leigo. Usado pra: marcar termos no resumo do post como
 * tooltipáveis. Sem LLM, só dict mantido pela equipe.
 */

export interface TermoGlossario {
  /** Termo canônico exibido no tooltip. */
  termo: string;
  /** Padrões que detectam o termo no texto (case-insensitive). */
  padroes: RegExp[];
  /** Definição em PT-BR leigo, 1-2 frases. */
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
    definicao: "Quando licitação é impossível porque só existe um fornecedor que pode fornecer aquilo (ex.: serviço técnico específico, artista consagrado).",
  },
  {
    termo: "Pregão eletrônico",
    padroes: [/\bpreg[ãa]o\s+eletr[ôo]nico\b/i],
    definicao: "Tipo de licitação online onde empresas competem em preço ao vivo. Geralmente o mais usado pra compras simples.",
  },
  {
    termo: "Concorrência",
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
    definicao: "Mudança num contrato que já existe — geralmente acrescenta prazo, valor ou serviço.",
  },
  {
    termo: "Ata de registro de preços",
    padroes: [/\bata\s+de\s+registro\s+de\s+pre[çc]os?\b/i, /\bARP\b/],
    definicao: "Catálogo de produtos com preço já combinado. A prefeitura compra quando precisar, sem nova licitação a cada vez.",
  },
  {
    termo: "Lei 14.133/21",
    padroes: [/\b(?:lei\s+(?:federal\s+)?(?:n[º°.]?\s*)?)?14\.?133\s*\/?\s*(?:2021|21)\b/i],
    definicao: "Nova Lei de Licitações brasileira, em vigor desde 2021. Substitui a Lei 8.666/93. Define as regras pra qualquer compra/contrato do poder público.",
  },
  {
    termo: "Lei 8.666/93",
    padroes: [/\b(?:lei\s+(?:federal\s+)?(?:n[º°.]?\s*)?)?8\.?666\s*\/?\s*(?:1993|93)\b/i],
    definicao: "Antiga Lei de Licitações, em vigor de 1993 a 2024 (em transição). Ainda usada em contratos firmados antes da nova lei (14.133).",
  },
  {
    termo: "Fundamento legal",
    padroes: [/\bfundamento\s+legal\b/i],
    definicao: "Base jurídica que autoriza o ato. Cita a lei + artigo + inciso que dá amparo legal ao que está sendo feito.",
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

/**
 * Encontra termos técnicos no texto e retorna lista deduplicada de matches
 * — cada um com posição inicial pra renderização inline.
 */
export interface OcorrenciaTermo {
  termo: string;
  definicao: string;
  match: string;
  start: number;
  end: number;
}

export function detectarTermos(texto: string): OcorrenciaTermo[] {
  const todas: OcorrenciaTermo[] = [];
  for (const t of GLOSSARIO) {
    for (const padrao of t.padroes) {
      padrao.lastIndex = 0;
      let safety = 0;
      let m: RegExpExecArray | null;
      while ((m = padrao.exec(texto)) !== null && safety < 50) {
        safety++;
        // Anti-zero-width: força avanço se match vazio
        if (m[0].length === 0) {
          padrao.lastIndex++;
          continue;
        }
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

/**
 * Lista deduplicada de termos únicos detectados no texto. Útil pra exibir
 * "termos técnicos que aparecem aqui" sem repetir o mesmo termo.
 */
export function listarTermosUnicos(texto: string): Array<{ termo: string; definicao: string }> {
  const ocorrencias = detectarTermos(texto);
  const vistos = new Set<string>();
  const out: Array<{ termo: string; definicao: string }> = [];
  for (const o of ocorrencias) {
    if (vistos.has(o.termo)) continue;
    vistos.add(o.termo);
    out.push({ termo: o.termo, definicao: o.definicao });
  }
  return out;
}
