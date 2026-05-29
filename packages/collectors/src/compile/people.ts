/**
 * People & Órgão extractor — captura NOMES de agentes públicos e ÓRGÃOS citados
 * num ato, de forma 100% determinística (zero LLM, zero custo).
 *
 * PRINCÍPIO DE PRIVACIDADE (inegociável, ver project-deolho.md):
 * só capturamos uma pessoa quando ela está ancorada a uma FUNÇÃO PÚBLICA —
 * signatário do ato (Prefeito/Secretário/Superintendente/Diretor) ou alvo de
 * nomeação/exoneração para um cargo público (com "matrícula"/"cargo de"). Nunca
 * capturamos cidadão comum. Todos os registros aqui são `pessoa_publica` no
 * exercício/investidura de função pública — exatamente o que o Diário publica.
 *
 * O agrupamento por SOBRENOME ("famílias no poder") é coocorrência factual em
 * atos oficiais, com fonte — NÃO é prova de parentesco nem acusação. A UI
 * carrega esse disclaimer.
 */

// ── Slug / nome ────────────────────────────────────────────────────────────

export function semAcento(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function slugify(s: string): string {
  return semAcento(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const CONECTORES = new Set(["da", "de", "di", "do", "du", "das", "dos", "e"]);

// Siglas que devem permanecer em CAIXA ALTA num título (cargo/órgão). Heurística
// de comprimento falha ("MEIO","CHEFE" não são siglas), então usamos lista.
const SIGLAS_CONHECIDAS = new Set([
  "DAE", "GAMA", "SME", "SMEC", "SMS", "SAU", "PMA", "CCZ", "ARP", "CGM",
  "CMA", "RH", "PCD", "SP", "ODS", "ETA", "ETE", "UPA", "USF", "UBS",
]);

/** "MARCIO RAIMUNDO" / "luciana severina dos santos" → "Marcio Raimundo" / "Luciana Severina dos Santos". */
export function normalizarNome(nome: string): string {
  return nome
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((w) => {
      const lower = w.toLowerCase();
      if (CONECTORES.has(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

/**
 * Sobrenome de família. Pega o último token significativo; se vier precedido
 * de conector ("dos Santos", "da Silva") mantém só o núcleo ("Santos","Silva").
 * Para sobrenomes muito comuns marcamos `comum` na agregação (não aqui).
 */
export function sobrenomeDe(nomeNormalizado: string): string {
  const toks = nomeNormalizado.split(" ").filter(Boolean);
  for (let i = toks.length - 1; i >= 0; i--) {
    const t = toks[i]!;
    if (!CONECTORES.has(t.toLowerCase()) && t.length >= 2) return t;
  }
  return toks[toks.length - 1] ?? nomeNormalizado;
}

/** Sobrenomes brasileiros muito comuns — não indicam parentesco. */
export const SOBRENOMES_COMUNS = new Set([
  "Silva", "Santos", "Souza", "Sousa", "Oliveira", "Lima", "Pereira", "Costa",
  "Rodrigues", "Almeida", "Ferreira", "Nascimento", "Gomes", "Martins", "Araujo",
  "Araújo", "Ribeiro", "Carvalho", "Alves", "Cardoso", "Rocha", "Dias", "Barbosa",
  "Moraes", "Moares", "Freitas", "Cruz", "Vieira", "Mendes", "Castro", "Campos",
]);

// ── Validação de nome próprio ────────────────────────────────────────────────

// Palavras que aparecem em CAIXA ALTA mas NÃO são nome de pessoa (cargos,
// órgãos, ruído). Se um "nome" candidato consistir só destas, descartamos.
const STOP_NOME = new Set([
  "PREFEITO", "PREFEITA", "MUNICIPAL", "SECRETARIO", "SECRETARIA", "SECRETÁRIO",
  "SECRETÁRIA", "NEGOCIOS", "NEGÓCIOS", "JURIDICOS", "JURÍDICOS", "ADMINISTRACAO",
  "ADMINISTRAÇÃO", "DIARIO", "DIÁRIO", "OFICIAL", "DEPARTAMENTO", "AGUA", "ÁGUA",
  "ESGOTO", "SUPERINTENDENTE", "DIRETOR", "DIRETORA", "PRESIDENTE", "GABINETE",
  "AMERICANA", "ESTADO", "PAULO", "CONTRATANTE", "CONTRATADA", "CONTRATADO",
  "OBJETO", "PROCESSO", "EDITAL", "PREGAO", "PREGÃO", "ELETRONICO", "ELETRÔNICO",
  "VALOR", "VIGENCIA", "VIGÊNCIA", "ASSINATURA", "RESOLVE", "CONSIDERANDO",
  "PORTARIA", "DECRETO", "LEI", "RESOLUCAO", "RESOLUÇÃO", "LICITACOES", "LICITAÇÕES",
  "COMISSAO", "COMISSÃO", "FUNDO", "CONSELHO", "CAMARA", "CÂMARA", "GUARDA",
  "CENTRO", "CONTROLE", "REGISTRO", "PRECOS", "PREÇOS", "TERMO", "ADITIVO",
]);

/**
 * Valida um candidato a nome próprio: 2 a 6 tokens, ao menos 2 tokens "núcleo"
 * (não-conector) que pareçam nome (não estão na STOP list de cargo/órgão).
 */
function nomeValido(nome: string): boolean {
  const toks = nome.split(/\s+/).filter(Boolean);
  if (toks.length < 2 || toks.length > 6) return false;
  let nucleos = 0;
  for (const t of toks) {
    const up = semAcento(t).toUpperCase();
    if (CONECTORES.has(t.toLowerCase())) continue;
    if (STOP_NOME.has(t.toUpperCase()) || STOP_NOME.has(up)) return false;
    if (t.length < 2) continue;
    nucleos++;
  }
  return nucleos >= 2;
}

// ── Papéis ───────────────────────────────────────────────────────────────────

export type PapelPessoa =
  | "signatario" // assina o ato (prefeito, secretário, superintendente)
  | "nomeado"
  | "exonerado"
  | "designado"
  | "revogado"
  | "citado"; // mencionado em função pública sem ato claro de nomeação

export interface PessoaCitada {
  nome: string; // normalizado, Title Case
  slug: string;
  sobrenome: string;
  papel: PapelPessoa;
  cargo: string | null;
}

// Token de nome: caixa alta OU Title Case; conectores; cap em comprimento.
// Mantém ASCII+acentos. Sem aninhamento perigoso (cada alternativa é simples).
const NAME_WORD = "(?:[A-ZÀ-Ý][A-Za-zà-ÿ'’]+|[A-ZÀ-Ý]{2,}|d[aeiou]s?|D[AEIOU]S?|e|E)";
// Primeiro token NÃO pode ser conector (evita capturar "do Marcio" de
// "comissiona[do] Marcio"). Ancorado à esquerda por non-letra no chamador.
const NAME_HEAD = "(?:[A-ZÀ-Ý][A-Za-zà-ÿ'’]+|[A-ZÀ-Ý]{2,})";
const NAME_RE = `${NAME_HEAD}(?:\\s+${NAME_WORD}){1,5}`;

// Palavras-limite: onde um cargo capturado deve parar (cabeçalhos de seção,
// outro ato, conectivos de continuação de frase).
const CARGO_STOP =
  /\s+(?:PORTARIA|DECRETO|RESOLU[ÇC][ÃA]O|LEI\s+N|RESOLVE|CONSIDERANDO|EDITAL|EXTRATO|CONTRATO|CONTRATANTE|CONTRATADA|PROCESSO|OBJETO|AVISO|LICITA[ÇC]|no\s+uso|nos\s+termos|a\s+partir|conforme|na\s+data|do\s+dia|matr[íi]cula|em\s+\d).*/i;

function limparCargo(raw: string): string {
  let c = raw
    .replace(/\s+/g, " ")
    .replace(CARGO_STOP, "")
    .replace(/[.,;:].*$/, "")
    .trim();
  // Cap a ~6 palavras significativas (evita run-on "...Unidade de Fiscalização…").
  const palavras = c.split(" ").slice(0, 6);
  c = palavras
    .map((w) => {
      const low = w.toLowerCase();
      if (CONECTORES.has(low)) return low;
      if (SIGLAS_CONHECIDAS.has(w.toUpperCase()) && /^[A-ZÀ-Ý]+$/.test(w)) return w;
      return low.charAt(0).toUpperCase() + low.slice(1);
    })
    .join(" ")
    .replace(/\s+(?:de|da|do|dos|das|e)\s*$/i, ""); // trailing conector
  return c.slice(0, 90).trim();
}

function atoParaPapel(verbo: string): PapelPessoa {
  const v = verbo.toLowerCase();
  if (v.startsWith("nome")) return "nomeado";
  if (v.startsWith("exoner")) return "exonerado";
  if (v.startsWith("design")) return "designado";
  if (v.startsWith("revog")) return "revogado";
  return "citado";
}

/**
 * Extrai pessoas em função pública do texto cru do ato.
 * Sempre ancorado: nada de nome solto.
 */
export function extrairPessoas(textoCru: string): PessoaCitada[] {
  // Texto base: normaliza espaços + hifenização de quebra ("SAN- TOS"→"SANTOS")
  // + garante espaço após vírgula. Preserva caixa (precisamos detectar nomes).
  const texto = textoCru
    .replace(/(\p{L})-\s+(\p{L})/gu, "$1$2")
    .replace(/\s+/g, " ")
    .replace(/([,;:])(?=\p{L})/gu, "$1 ")
    .trim();

  const achados = new Map<string, PessoaCitada>(); // slug → pessoa (dedup)
  const add = (nomeRaw: string, papel: PapelPessoa, cargo: string | null) => {
    const nome = normalizarNome(nomeRaw);
    if (!nomeValido(nome)) return;
    const slug = slugify(nome);
    if (!slug) return;
    const existente = achados.get(slug);
    // Prioridade de papel: nomeado/exonerado/designado > signatario > citado
    const rank: Record<PapelPessoa, number> = {
      nomeado: 5, exonerado: 5, designado: 5, revogado: 4, signatario: 3, citado: 1,
    };
    if (!existente || rank[papel] > rank[existente.papel]) {
      achados.set(slug, {
        nome,
        slug,
        sobrenome: sobrenomeDe(nome),
        papel,
        cargo: cargo ? limparCargo(cargo) : existente?.cargo ?? null,
      });
    } else if (existente && !existente.cargo && cargo) {
      existente.cargo = limparCargo(cargo);
    }
  };

  // 1) ALVO de nomeação/exoneração: ... <ato> ... <NOME>, matrícula <N> ... cargo de <CARGO>
  //    Captura o nome imediatamente antes de "matrícula".
  {
    const re = new RegExp(`(?<![A-Za-zÀ-ÿ])(${NAME_RE})\\s*,?\\s*matr[íi]cula`, "g");
    let m: RegExpExecArray | null;
    let safety = 0;
    while ((m = re.exec(texto)) !== null && safety < 60) {
      safety++;
      const nome = m[1]!;
      // verbo de ato nos ~140 chars anteriores
      const antes = texto.slice(Math.max(0, m.index - 140), m.index);
      const vMatch = /\b(Nomear|Exonerar|Designar|Revogar|Conceder|Constituir|Convocar|Promover|Reintegrar)\b/i.exec(antes);
      const papel = vMatch ? atoParaPapel(vMatch[1]!) : "citado";
      // cargo nos ~160 chars seguintes
      const depois = texto.slice(m.index, m.index + 220);
      const cargoMatch = /(?:no\s+cargo\s+de|do\s+cargo\s+de|para\s+(?:exercer\s+)?(?:o\s+)?cargo\s+de|para\s+exercer\s+as\s+fun[çc][õo]es\s+de|para\s+a\s+fun[çc][ãa]o\s+de)\s+([^.,;()]+)/i.exec(depois);
      add(nome, papel, cargoMatch ? cargoMatch[1]! : null);
    }
  }

  // 2) "o senhor/a senhora <NOME>, para exercer as funções de <CARGO>"
  {
    const re = new RegExp(`\\b(?:o\\s+senhor|a\\s+senhora)\\s+(${NAME_RE})`, "gi");
    let m: RegExpExecArray | null;
    let safety = 0;
    while ((m = re.exec(texto)) !== null && safety < 60) {
      safety++;
      const nome = m[1]!;
      const antes = texto.slice(Math.max(0, m.index - 120), m.index);
      const vMatch = /\b(Nomear|Exonerar|Designar|Revogar|design[ou]u?)\b/i.exec(antes);
      const papel = vMatch ? atoParaPapel(vMatch[1]!.replace(/u$/, "ar")) : "citado";
      const depois = texto.slice(m.index, m.index + 220);
      const cargoMatch = /(?:cargo\s+de|fun[çc][õo]es\s+de|fun[çc][ãa]o\s+de)\s+([^.,;()]+)/i.exec(depois);
      add(nome, papel, cargoMatch ? cargoMatch[1]! : null);
    }
  }

  // 3) SIGNATÁRIO Title Case: "<Nome>, Prefeito Municipal..." / "<Nome>, Secretário..."
  {
    const reTitle = new RegExp(
      `(?<![A-Za-zÀ-ÿ])([A-ZÀ-Ý][a-zà-ÿ'’]+(?:\\s+(?:d[aeiou]s?|e|[A-ZÀ-Ý][a-zà-ÿ'’]+)){1,5})\\s*,\\s*(Prefeit[oa]|Vice-?Prefeit[oa]|Secret[áa]ri[oa](?:\\s+Adjunt[oa])?(?:\\s+(?:Municipal|de|da|do)\\b[^.,;]{0,40})?|Superintendente|Diretor[a]?(?:\\s+Presidente)?|Presidente)`,
      "g",
    );
    let m: RegExpExecArray | null;
    let safety = 0;
    while ((m = reTitle.exec(texto)) !== null && safety < 60) {
      safety++;
      add(m[1]!, "signatario", m[2]!);
    }
  }

  // 4) SIGNATÁRIO CAIXA ALTA: "<NOME>, SUPERINTENDENTE" / "<NOME> SUPERINTENDENTE"
  {
    const reCaps = new RegExp(
      `\\b([A-ZÀ-Ý]{2,}(?:\\s+(?:D[AEIOU]S?|E|[A-ZÀ-Ý]{2,})){1,4})\\s*,?\\s+(SUPERINTENDENTE|PREFEIT[OA]\\s+MUNICIPAL|SECRET[ÁA]RI[OA](?:\\s+ADJUNT[OA])?[^.,;]{0,40}|DIRETOR[A]?(?:[- ]?(?:GERAL|PRESIDENTE|COMANDANTE))?|PRESIDENTE\\b)`,
      "g",
    );
    let m: RegExpExecArray | null;
    let safety = 0;
    while ((m = reCaps.exec(texto)) !== null && safety < 60) {
      safety++;
      add(m[1]!, "signatario", m[2]!);
    }
  }

  return Array.from(achados.values());
}

// ── Órgãos ─────────────────────────────────────────────────────────────────

export interface OrgaoCitado {
  nome: string; // canônico legível
  slug: string;
  sigla: string | null;
}

/**
 * Lista curada dos órgãos de Americana (alta precisão). O matcher roda sobre o
 * texto sem acento + minúsculo, então cobre tanto a forma CAIXA ALTA do
 * cabeçalho quanto a Title Case do corpo. Cada entrada já vem com o nome
 * canônico legível — não dependemos de capturar a grafia exata do PDF.
 */
interface OrgaoDef {
  nome: string;
  sigla: string | null;
  re: RegExp;
}

const ORGAOS_CANONICOS: OrgaoDef[] = [
  { nome: "Departamento de Água e Esgoto", sigla: "DAE", re: /departamento\s+de\s+agua\s+e\s+esgoto|\bdae\b/ },
  { nome: "Guarda Municipal de Americana", sigla: "GAMA", re: /guarda\s+(?:civil\s+)?municipal|\bgama\b/ },
  { nome: "Câmara Municipal de Americana", sigla: null, re: /camara\s+municipal/ },
  { nome: "Gabinete do Prefeito", sigla: null, re: /gabinete\s+do\s+(?:prefeito|chefe)/ },
  { nome: "Centro de Controle de Zoonoses", sigla: "CCZ", re: /centro\s+de\s+controle\s+de\s+zoono|\bccz\b/ },
  { nome: "Secretaria de Administração", sigla: null, re: /secretaria\s+(?:municipal\s+)?(?:de\s+|da\s+)?administracao/ },
  { nome: "Secretaria de Negócios Jurídicos", sigla: null, re: /(?:secretaria|negocios)\s+(?:municipal\s+)?(?:de\s+)?(?:negocios\s+)?juridicos/ },
  { nome: "Secretaria de Educação", sigla: "SME", re: /secretaria\s+(?:municipal\s+)?(?:de\s+)?educacao/ },
  { nome: "Secretaria de Saúde", sigla: "SMS", re: /secretaria\s+(?:municipal\s+)?(?:de\s+)?saude/ },
  { nome: "Secretaria de Meio Ambiente", sigla: null, re: /secretaria\s+(?:municipal\s+)?(?:de\s+)?meio\s+ambiente/ },
  { nome: "Secretaria de Obras e Serviços Urbanos", sigla: null, re: /secretaria\s+(?:municipal\s+)?(?:de\s+)?obras/ },
  { nome: "Secretaria de Fazenda", sigla: null, re: /secretaria\s+(?:municipal\s+)?(?:de\s+)?(?:fazenda|financas)/ },
  { nome: "Secretaria de Desenvolvimento Econômico", sigla: null, re: /secretaria\s+(?:municipal\s+)?(?:de\s+)?desenvolvimento\s+economico/ },
  { nome: "Secretaria de Assistência Social", sigla: null, re: /secretaria\s+(?:municipal\s+)?(?:de\s+)?(?:assistencia\s+social|desenvolvimento\s+social)/ },
  { nome: "Secretaria de Cultura e Turismo", sigla: null, re: /secretaria\s+(?:municipal\s+)?(?:de\s+)?(?:cultura|turismo)/ },
  { nome: "Secretaria de Esportes e Lazer", sigla: null, re: /secretaria\s+(?:municipal\s+)?(?:de\s+)?(?:esporte|lazer)/ },
  { nome: "Secretaria de Planejamento", sigla: null, re: /secretaria\s+(?:municipal\s+)?(?:de\s+)?planejamento/ },
  { nome: "Secretaria de Habitação", sigla: null, re: /secretaria\s+(?:municipal\s+)?(?:de\s+)?habitacao/ },
  { nome: "Secretaria de Trânsito e Sistema Viário", sigla: null, re: /secretaria\s+(?:municipal\s+)?(?:de\s+)?transito/ },
  { nome: "Secretaria de Governo", sigla: null, re: /secretaria\s+(?:municipal\s+)?(?:de\s+)?governo/ },
];

// Padrões genéricos (recall) — Title Case OU caixa alta, continuação SÓ via
// conector (evita engolir o nome de pessoa que vem depois: "...ADMINISTRAÇÃO JOSÉ").
const ORGAO_GENERICO: RegExp[] = [
  /\b(Fundo\s+(?:Municipal\s+)?(?:de|da|do)\s+\p{Lu}[\p{L}]+(?:\s+(?:e|de|da|do|dos|das)\s+\p{Lu}[\p{L}]+){0,3})/gu,
  /\b(Coordenadoria\s+(?:de|da|do)\s+\p{Lu}[\p{L}]+(?:\s+(?:e|de|da|do)\s+\p{Lu}[\p{L}]+){0,3})/gu,
  /\b(Conselho\s+(?:Municipal\s+)?(?:de|da|do)\s+\p{Lu}[\p{L}]+(?:\s+(?:e|de|da|do)\s+\p{Lu}[\p{L}]+){0,3})/gu,
  /\b(Instituto\s+(?:de|da|do)\s+\p{Lu}[\p{L}]+(?:\s+(?:e|de|da|do)\s+\p{Lu}[\p{L}]+){0,3})/gu,
];

function tituloOrgao(s: string): string {
  return s
    .replace(/\s+/g, " ")
    .replace(/\s+(?:de\s+Americana|de\s+Americana\s*\/?\s*SP)\s*$/i, "")
    .replace(/\s+(?:de|da|do|dos|das|e)\s*$/i, "") // trailing conector
    .split(" ")
    .map((w) => {
      const low = w.toLowerCase();
      if (CONECTORES.has(low)) return low;
      if (SIGLAS_CONHECIDAS.has(w.toUpperCase()) && /^[A-ZÀ-Ý]+$/.test(w)) return w;
      return low.charAt(0).toUpperCase() + low.slice(1);
    })
    .join(" ")
    .trim();
}

export function extrairOrgaos(textoCru: string): OrgaoCitado[] {
  const texto = textoCru.replace(/(\p{L})-\s+(\p{L})/gu, "$1$2").replace(/\s+/g, " ");
  const plano = semAcento(texto).toLowerCase();
  const achados = new Map<string, OrgaoCitado>();

  // 1. Canônicos (alta precisão).
  for (const def of ORGAOS_CANONICOS) {
    if (def.re.test(plano)) {
      const slug = slugify(def.nome);
      achados.set(slug, { nome: def.nome, slug, sigla: def.sigla });
    }
  }

  // 2. Genéricos (recall) — conector-bounded, sem engolir nomes.
  for (const padrao of ORGAO_GENERICO) {
    padrao.lastIndex = 0;
    let m: RegExpExecArray | null;
    let safety = 0;
    while ((m = padrao.exec(texto)) !== null && safety < 40) {
      safety++;
      if (m[0].length === 0) { padrao.lastIndex++; continue; }
      const nome = tituloOrgao(m[1]!);
      if (nome.split(" ").length < 2) continue;
      const slug = slugify(nome);
      if (slug && !achados.has(slug)) achados.set(slug, { nome, slug, sigla: null });
    }
  }

  // 3. Dedup por prefixo: se um slug é prefixo de outro ("secretaria-de-negocios"
  //    ⊂ "secretaria-de-negocios-juridicos"), mantém só o mais específico.
  const slugs = Array.from(achados.keys());
  for (const a of slugs) {
    for (const b of slugs) {
      if (a !== b && b.startsWith(a + "-") && achados.has(a)) {
        achados.delete(a);
        break;
      }
    }
  }

  return Array.from(achados.values());
}
