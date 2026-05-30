/**
 * Compositor de POSTS — o coração do feed cívico.
 *
 * Transforma um evento "seco" do banco (civic_events) num POST excelente de
 * leitura, estilo Instagram: título humano, uma linha fina clara, valor legível,
 * capa temática (gradiente + ícone) e disclaimers fiéis à doutrina.
 *
 * Módulo PURO (sem banco, sem server-only) — testável isoladamente e reaproveitável
 * tanto no Início quanto em páginas de detalhe.
 *
 * Doutrina respeitada:
 *  - Sanção mostra aviso "não indica culpa".
 *  - Nada de acusação; linguagem neutra ("contratou", "pagou", "recebeu").
 *  - Fonte sempre presente (quem chama o post mostra a fonte/evidência).
 */

export interface EventoParaPost {
  categoria: string;
  titulo: string;
  resumo: string | null;
  valor: string | null;
  sourceId: string;
  /** Referências do evento (jsonb civic_events.entidades), quando houver. */
  entidades?: {
    fornecedorDocumento?: string | null;
    /** Nome do órgão já resolvido pelo read model (join em entities), opcional. */
    orgaoNome?: string | null;
  } | null;
}

/** Uma conexão navegável a partir do post (o "clicar no nome e ir fundo"). */
export interface Conexao {
  tipo: "empresa" | "orgao" | "pessoa" | "termo";
  label: string;
  /** Destino do clique (drill-down). Ausente em "termo" puro (só tooltip). */
  href?: string;
  /** Explicação curta para termos cívicos (glossário inline). */
  tooltip?: string;
}

export interface PostCapa {
  /** Classe Tailwind de gradiente para a capa (a "imagem" base do post). */
  gradiente: string;
  emoji: string;
}

export interface Post {
  /** Título humano, pronto pra ler — substitui o título seco do banco. */
  titulo: string;
  /** Uma linha de contexto em linguagem simples (objeto, finalidade…). */
  linhaFina: string | null;
  /** Valor legível e abreviado: "R$ 12,6 milhões". null quando não há. */
  valorLabel: string | null;
  selo: { emoji: string; label: string };
  capa: PostCapa;
  /** Aviso obrigatório quando o tipo exige (ex.: sanção). */
  disclaimer: string | null;
  /** Conexões clicáveis — empresa, órgão, pessoa, termos. O coração do "conectar tudo". */
  conexoes: Conexao[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** "R$ 12,6 milhões" · "R$ 56 mil" · "R$ 1.234,00" — legível pro cidadão. */
export function valorHumano(valor: string | number | null): string | null {
  if (valor === null) return null;
  const n = typeof valor === "number" ? valor : Number(valor);
  if (!Number.isFinite(n) || n === 0) return null;
  if (n >= 1_000_000_000) return `R$ ${(n / 1_000_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} bilhões`;
  if (n >= 1_000_000) return `R$ ${(n / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} milhões`;
  if (n >= 10_000) return `R$ ${Math.round(n / 1000).toLocaleString("pt-BR")} mil`;
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Extrai "Label: valor" do resumo semi-estruturado (até o próximo ". " ou fim). */
function extrair(resumo: string | null, label: string): string | null {
  if (!resumo) return null;
  const re = new RegExp(`${label}\\s*:?\\s*([^.]+?)(?:\\.\\s|\\.$|$)`, "i");
  const m = resumo.match(re);
  return m?.[1]?.trim() || null;
}

const CONECTIVOS = new Set([
  "de", "da", "do", "das", "dos", "e", "a", "o", "as", "os",
  "em", "para", "por", "com", "no", "na", "ao", "pela", "pelo", "pelas", "pelos",
]);

/** Title Case em pt-BR: conectivos minúsculos, siglas preservadas só em texto MISTO. */
function titleCasePt(s: string): string {
  // Texto todo-maiúsculo (PNCP/PDF) → não dá pra distinguir sigla de palavra; faz
  // title case puro. Só preserva siglas quando há minúsculas (token all-caps = sigla).
  const textoMisto = /[a-zà-ÿ]/.test(s);
  return s
    .split(/\s+/)
    .map((w, i) => {
      const lw = w.toLocaleLowerCase("pt-BR");
      if (i > 0 && CONECTIVOS.has(lw)) return lw; // conectivo minúsculo (antes da sigla)
      if (textoMisto && w.length >= 2 && w.length <= 5 && /[A-ZÀ-Ú]/.test(w) && w === w.toLocaleUpperCase("pt-BR")) {
        return w; // sigla preservada (ex.: "Empresa XPTO Ltda")
      }
      return lw.charAt(0).toLocaleUpperCase("pt-BR") + lw.slice(1);
    })
    .join(" ");
}

/** Capitaliza e encurta um nome próprio/empresa pra caber no título. */
function nomeCurto(s: string | null, max = 48): string | null {
  if (!s) return null;
  const tc = titleCasePt(s.replace(/\s+/g, " ").trim());
  return tc.length > max ? tc.slice(0, max - 1).trimEnd() + "…" : tc;
}

/** Proporção de letras maiúsculas (ignora dígitos/pontuação). */
function fracaoMaiusculas(s: string): number {
  const letras = s.replace(/[^A-Za-zÀ-ÿ]/g, "");
  if (!letras) return 0;
  const maius = letras.replace(/[^A-ZÀ-Þ]/g, "").length;
  return maius / letras.length;
}

/** Objeto/contexto em caixa de leitura: corta metadados, normaliza CAIXA ALTA do PDF. */
function objetoLegivel(resumo: string | null, max = 150): string | null {
  if (!resumo) return null;
  // Tira os campos estruturados que viram chips (Fornecedor/Credor/Valor/Órgão…).
  let texto = resumo
    .split(/\b(?:Fornecedor|Credor|Valor registrado|Valor arrecadado|Maior fase|Tipo|Fonte|Órg[ãa]o|Ação or[çc])/i)[0]
    .replace(/,?\s*conforme.*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!texto) return null;
  // PDFs vêm majoritariamente em CAIXA ALTA → sentence case quando >60% maiúsculas.
  if (fracaoMaiusculas(texto) > 0.6 && texto.length > 12) {
    texto = texto.toLocaleLowerCase("pt-BR");
    texto = texto.charAt(0).toLocaleUpperCase("pt-BR") + texto.slice(1);
  }
  return texto.length > max ? texto.slice(0, max - 1).trimEnd() + "…" : texto;
}

const CAPA: Record<string, PostCapa> = {
  contratacao: { gradiente: "from-emerald-500/15 to-teal-500/10", emoji: "📋" },
  pagamento: { gradiente: "from-sky-500/15 to-indigo-500/10", emoji: "💸" },
  receita: { gradiente: "from-amber-500/15 to-yellow-500/10", emoji: "🪙" },
  ato_normativo: { gradiente: "from-violet-500/15 to-fuchsia-500/10", emoji: "📜" },
  nomeacao_exoneracao: { gradiente: "from-rose-500/15 to-orange-500/10", emoji: "👤" },
  sancao: { gradiente: "from-red-500/20 to-orange-500/10", emoji: "⚠️" },
  audiencia_conselho: { gradiente: "from-blue-500/15 to-cyan-500/10", emoji: "🏛️" },
  obra_zeladoria: { gradiente: "from-orange-500/15 to-amber-500/10", emoji: "🚧" },
};

const SELO: Record<string, string> = {
  contratacao: "Contrato",
  pagamento: "Pagamento",
  receita: "Arrecadação",
  ato_normativo: "Ato oficial",
  nomeacao_exoneracao: "Cargo público",
  sancao: "Sanção",
  audiencia_conselho: "Audiência",
  obra_zeladoria: "Obra",
};

// ── Compositor ─────────────────────────────────────────────────────────────

/** slug estável em pt-BR (sem acento, minúsculo, hifenizado) para /orgao, /pessoa. */
function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Termos cívicos explicados em 1 linha — o glossário que vira tooltip clicável. */
const GLOSSARIO: Array<{ re: RegExp; label: string; tooltip: string }> = [
  { re: /pregão eletrônico/i, label: "Pregão eletrônico", tooltip: "Disputa de preços online; vence quem oferece o menor valor cumprindo as regras." },
  { re: /pregão/i, label: "Pregão", tooltip: "Modalidade de licitação para compras comuns; vence o menor preço." },
  { re: /dispensa de licitação|dispensa/i, label: "Dispensa de licitação", tooltip: "Contratação direta, sem licitação, permitida por lei em casos específicos." },
  { re: /inexigibilidade/i, label: "Inexigibilidade", tooltip: "Contratação sem licitação quando só há um fornecedor possível." },
  { re: /concorrência/i, label: "Concorrência", tooltip: "Modalidade de licitação para contratos de maior valor." },
  { re: /termo aditivo|aditivo/i, label: "Termo aditivo", tooltip: "Alteração de um contrato já existente (prazo, valor ou objeto)." },
  { re: /empenhad|empenho/i, label: "Empenho", tooltip: "Primeira fase do gasto: o governo reserva o dinheiro para a despesa." },
  { re: /liquidad|liquidação/i, label: "Liquidação", tooltip: "O governo confirma que o serviço/produto foi entregue." },
  { re: /\bpago\b|pagamento/i, label: "Pagamento", tooltip: "Fase final: o dinheiro efetivamente sai dos cofres públicos." },
];

/** Detecta termos cívicos no texto e os transforma em conexões com tooltip. */
function detectarTermos(texto: string, limite = 3): Conexao[] {
  const out: Conexao[] = [];
  const vistos = new Set<string>();
  for (const g of GLOSSARIO) {
    if (out.length >= limite) break;
    if (g.re.test(texto) && !vistos.has(g.label)) {
      vistos.add(g.label);
      out.push({ tipo: "termo", label: g.label, tooltip: g.tooltip });
    }
  }
  return out;
}

export function comporPost(e: EventoParaPost): Post {
  const capa = CAPA[e.categoria] ?? { gradiente: "from-foreground/10 to-foreground/5", emoji: "•" };
  const selo = { emoji: capa.emoji, label: SELO[e.categoria] ?? e.categoria };
  const valorLabel = valorHumano(e.valor);
  let titulo = e.titulo;
  let linhaFina = objetoLegivel(e.resumo);
  let disclaimer: string | null = null;
  const conexoes: Conexao[] = [];

  // Empresa: CNPJ do fornecedor → página da empresa (drill-down financeiro).
  const cnpj = e.entidades?.fornecedorDocumento?.replace(/\D/g, "") ?? null;

  switch (e.categoria) {
    case "contratacao": {
      const fornecedor = nomeCurto(extrair(e.resumo, "Fornecedor"));
      titulo = fornecedor
        ? `Prefeitura contratou ${fornecedor}${valorLabel ? ` por ${valorLabel}` : ""}`
        : `Prefeitura fez uma contratação${valorLabel ? ` de ${valorLabel}` : ""}`;
      if (cnpj?.length === 14) conexoes.push({ tipo: "empresa", label: fornecedor ?? "Empresa contratada", href: `/empresa/${cnpj}` });
      break;
    }
    case "pagamento": {
      const credor = nomeCurto(extrair(e.resumo, "Credor"));
      titulo = credor
        ? `Prefeitura pagou ${valorLabel ?? "uma despesa"} a ${credor}`
        : `Prefeitura registrou pagamento${valorLabel ? ` de ${valorLabel}` : ""}`;
      linhaFina = nomeCurto(extrair(e.resumo, "Ação orçament[áa]ria"), 120) ?? linhaFina;
      if (cnpj?.length === 14 && credor) conexoes.push({ tipo: "empresa", label: credor, href: `/empresa/${cnpj}` });
      break;
    }
    case "receita": {
      const tipo = nomeCurto(e.titulo.replace(/^Receita arrecadada:\s*\d*\s*-?\s*/i, ""), 60);
      titulo = `Prefeitura arrecadou ${valorLabel ?? "receita"}${tipo ? ` — ${tipo}` : ""}`;
      break;
    }
    case "sancao": {
      const empresa = nomeCurto(e.resumo?.split(/\bTipo\b/i)[0] ?? null);
      const tipo = nomeCurto(extrair(e.resumo, "Tipo"), 70);
      titulo = empresa ? `${empresa} consta em lista de sanção` : "Sanção registrada";
      linhaFina = tipo;
      disclaimer = "Sinal oficial de sanção — não indica culpa nem irregularidade; veja a fonte.";
      if (cnpj?.length === 14 && empresa) conexoes.push({ tipo: "empresa", label: empresa, href: `/empresa/${cnpj}` });
      break;
    }
    case "nomeacao_exoneracao": {
      const partes = (e.resumo ?? "").split("·").map((s) => s.trim());
      const nome = nomeCurto(partes[0] ?? null, 40);
      const cargo = partes[1] ?? null;
      titulo = nome ? `${e.titulo}: ${nome}` : e.titulo;
      linhaFina = cargo ?? linhaFina;
      // Agente público nomeado/exonerado é informação pública → drill-down na pessoa.
      if (nome) conexoes.push({ tipo: "pessoa", label: nome, href: `/pessoa/${slugify(nome)}` });
      break;
    }
    // ato_normativo / audiencia_conselho / obra_zeladoria: título do banco + linha fina.
  }

  // Órgão: nome resolvido pelo read model (join), ou "Órgão: X" no resumo.
  const orgao = e.entidades?.orgaoNome ?? extrair(e.resumo, "Órg[ãa]o");
  const orgaoNome = nomeCurto(orgao, 50);
  if (orgaoNome && !/prefeitura municipal de americana/i.test(orgaoNome)) {
    conexoes.push({ tipo: "orgao", label: orgaoNome, href: `/orgao/${slugify(orgaoNome)}` });
  }

  // Termos cívicos (glossário inline) a partir de título + resumo.
  conexoes.push(...detectarTermos(`${e.titulo} ${e.resumo ?? ""}`));

  return { titulo, linhaFina, valorLabel, selo, capa, disclaimer, conexoes };
}
