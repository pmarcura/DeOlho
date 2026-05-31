/**
 * Compositor de eventos publicos.
 *
 * Transforma um registro de `civic_events` em uma unidade de UI verificavel:
 * titulo legivel, resumo curto, valor, fonte, confianca, limitacoes, evidencias
 * e conexoes navegaveis. O modulo e puro para permanecer testavel sem banco.
 */
import type {
  Fonte,
  FonteId,
  Limitacao,
  NivelConfianca,
  TipoInformacao,
} from "@/lib/civic-types";

export interface ApresentacaoIA {
  linhaFina?: string;
  leituraCompleta?: string;
  etiquetas?: string[];
  conexoesTexto?: string[];
  aviso?: string | null;
  modo?: string;
  modelo?: string | null;
  geradoEm?: string;
  tituloOriginal?: string;
  resumoOriginal?: string | null;
  evidenciasLidas?: number;
  desde?: string;
}

export interface EventoParaComposicao {
  id?: string;
  categoria: string;
  tipo?: string;
  titulo: string;
  resumo: string | null;
  valor: string | null;
  sourceId?: string | null;
  sourceUrl?: string | null;
  dataEvento?: string | null;
  publishedAt?: string | Date | null;
  fetchedAt?: string | Date | null;
  limitacoes?: unknown;
  trustType?: string | null;
  /** Referências do evento (jsonb civic_events.entidades), quando houver. */
  entidades?: {
    fornecedorDocumento?: string | null;
    credorDocumento?: string | null;
    /** Nome do órgão já resolvido pelo read model (join em entities), opcional. */
    orgaoNome?: string | null;
    apresentacao?: ApresentacaoIA;
  } | null;
}

/** Uma conexao navegavel a partir do evento publico. */
export interface Conexao {
  tipo: "empresa" | "orgao" | "pessoa_publica" | "termo" | "evidencia" | "ia";
  label: string;
  /** Destino do clique. Ausente em termo puro, que usa tooltip. */
  href?: string;
  /** Explicacao curta para termos civicos. */
  tooltip?: string;
}

export interface EventoMedia {
  tipo: "tematica" | "wikipedia";
  gradiente: string;
  emoji: string;
  alt: string;
  imagemUrl?: string | null;
  credito?: string | null;
  href?: string | null;
}

export interface EvidenciaComposta {
  titulo: string;
  href: string;
  fonte: FonteId;
}

export interface EventoComposto {
  titulo: string;
  resumo: string | null;
  valorLabel: string | null;
  tipoInformacao: TipoInformacao;
  fonte: Fonte;
  confianca: NivelConfianca;
  limitacoes: Limitacao[];
  evidencias: EvidenciaComposta[];
  conexoes: Conexao[];
  media: EventoMedia;
  selo: { emoji: string; label: string };
  avisos: string[];
  apresentacaoIA?: ApresentacaoIA;
  permiteAcoesCivicas: boolean;
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
  const labels = "Envolvido|Órg[ãa]o citado|Fornecedor|Credor|Contratado|Contratada|Empresa|Órg[ãa]o|Objeto\\/finalidade|Objeto|Finalidade|Ação orçament[áa]ria|Valor|Fonte|Tipo";
  const re = new RegExp(`${label}\\s*:\\s*([^\\n.]+?)(?=\\s+(?:${labels})\\s*:|\\.\\s|\\.$|$)`, "i");
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

const MEDIA: Record<string, EventoMedia> = {
  contratacao: { tipo: "tematica", gradiente: "from-emerald-500/15 to-teal-500/10", emoji: "📋", alt: "Imagem temática de contrato público", imagemUrl: "/media/eventos/contratacao.png" },
  pagamento: { tipo: "tematica", gradiente: "from-sky-500/15 to-indigo-500/10", emoji: "💸", alt: "Imagem temática de pagamento público", imagemUrl: "/media/eventos/pagamento.png" },
  receita: { tipo: "tematica", gradiente: "from-amber-500/15 to-yellow-500/10", emoji: "🪙", alt: "Imagem temática de receita pública", imagemUrl: "/media/eventos/receita.png" },
  ato_normativo: { tipo: "tematica", gradiente: "from-violet-500/15 to-fuchsia-500/10", emoji: "📜", alt: "Imagem temática de ato oficial", imagemUrl: "/media/eventos/ato-normativo.png" },
  nomeacao_exoneracao: { tipo: "tematica", gradiente: "from-rose-500/15 to-orange-500/10", emoji: "👤", alt: "Imagem temática de mudança de cargo público", imagemUrl: "/media/eventos/cargo-publico.png" },
  sancao: { tipo: "tematica", gradiente: "from-amber-500/20 to-orange-500/10", emoji: "⚠️", alt: "Imagem temática de sanção oficial", imagemUrl: "/media/eventos/sancao.png" },
  audiencia_conselho: { tipo: "tematica", gradiente: "from-blue-500/15 to-cyan-500/10", emoji: "🏛️", alt: "Imagem temática de audiência ou conselho", imagemUrl: "/media/eventos/audiencia.png" },
  obra_zeladoria: { tipo: "tematica", gradiente: "from-orange-500/15 to-amber-500/10", emoji: "🚧", alt: "Imagem temática de obra ou zeladoria", imagemUrl: "/media/eventos/obra.png" },
  relacionamento: { tipo: "tematica", gradiente: "from-slate-500/15 to-cyan-500/10", emoji: "🔗", alt: "Vinculo documentado" },
  limitacao_fonte: { tipo: "tematica", gradiente: "from-amber-500/15 to-stone-500/10", emoji: "ℹ️", alt: "Limitacao de fonte" },
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
    .replace(/[\u0300-\u036f]/g, "")
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

const FONTE_LABEL: Record<FonteId, string> = {
  pncp: "Portal Nacional de Contratações (PNCP)",
  "tce-sp": "Tribunal de Contas do Estado (TCE-SP)",
  "cgu-transparencia": "Portal da Transparência (CGU)",
  "querido-diario": "Querido Diário",
  "diario-americana": "Diário Oficial de Americana",
  "transparencia-americana": "Transparência Americana",
  "receita-cnpj": "Receita Federal (CNPJ)",
  "camara-americana": "Câmara Municipal de Americana",
  tse: "Justiça Eleitoral (TSE)",
  sinteticos: "Dados sintéticos",
};

const FONTES_VALIDAS = new Set<FonteId>(Object.keys(FONTE_LABEL) as FonteId[]);

function fonteId(sourceId: string | null | undefined): FonteId {
  if (sourceId && FONTES_VALIDAS.has(sourceId as FonteId)) return sourceId as FonteId;
  return "sinteticos";
}

function dataIsoCurta(data: string | Date | null | undefined): string | undefined {
  if (!data) return undefined;
  if (data instanceof Date) return data.toISOString();
  return data;
}

function normalizarLimitacoes(raw: unknown): Limitacao[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item): Limitacao | null => {
      if (!item || typeof item !== "object") return null;
      const registro = item as { campo?: unknown; mensagem?: unknown; tipo?: unknown; fonte?: unknown };
      const mensagem = typeof registro.mensagem === "string" ? registro.mensagem : null;
      if (!mensagem) return null;
      return {
        tipo: typeof registro.tipo === "string" && registro.tipo in LIMITE_TIPO
          ? LIMITE_TIPO[registro.tipo]
          : "dado_ausente",
        mensagem,
        campoAfetado: typeof registro.campo === "string" ? registro.campo : undefined,
        fonte: typeof registro.fonte === "string" && FONTES_VALIDAS.has(registro.fonte as FonteId)
          ? registro.fonte as FonteId
          : undefined,
      };
    })
    .filter((item): item is Limitacao => Boolean(item));
}

const LIMITE_TIPO: Record<string, Limitacao["tipo"]> = {
  dado_ausente: "dado_ausente",
  fonte_atrasada: "fonte_atrasada",
  fonte_indisponivel: "fonte_indisponivel",
  campo_contraditorio: "campo_contraditorio",
};

function tipoInformacao(e: EventoParaComposicao, semFonte: boolean, semEvidencia: boolean): TipoInformacao {
  if (semFonte || semEvidencia) return "dado_incompleto";
  switch (e.trustType) {
    case "explicacao":
      return "explicacao_ia";
    case "sinal_atencao":
      return "sinal_atencao";
    case "noticia":
      return "noticia";
    case "opiniao":
      return "opiniao";
    default:
      return "fato_oficial";
  }
}

function confiancaFonte(e: EventoParaComposicao, limitacoes: Limitacao[], semFonte: boolean, semEvidencia: boolean): NivelConfianca {
  if (semFonte || semEvidencia || limitacoes.length > 0) return "incompleto";
  if (e.trustType === "sinal_atencao" || e.trustType === "explicacao") return "verificacao_pendente";
  return "fonte_oficial";
}

function documentoEmpresa(e: EventoParaComposicao): string | null {
  const doc = e.categoria === "pagamento"
    ? e.entidades?.credorDocumento ?? e.entidades?.fornecedorDocumento
    : e.entidades?.fornecedorDocumento ?? e.entidades?.credorDocumento;
  return doc?.replace(/\D/g, "") ?? null;
}

export function comporEvento(e: EventoParaComposicao): EventoComposto {
  const media = MEDIA[e.categoria] ?? {
    tipo: "tematica",
    gradiente: "from-foreground/10 to-foreground/5",
    emoji: "•",
    alt: "Evento publico",
  };
  const selo = { emoji: media.emoji, label: SELO[e.categoria] ?? e.categoria };
  const valorLabel = valorHumano(e.valor);
  const apresentacaoIA = e.entidades?.apresentacao;
  const usarTextoFormatado = Boolean(apresentacaoIA);
  let titulo = e.titulo;
  let resumo = apresentacaoIA?.linhaFina || objetoLegivel(e.resumo);
  const avisos: string[] = [];
  const conexoes: Conexao[] = [];

  const sourceId = e.sourceId?.trim() || null;
  const fonteDesconhecida = Boolean(sourceId && !FONTES_VALIDAS.has(sourceId as FonteId));
  const fid = fonteId(sourceId);
  const semFonte = !sourceId || fonteDesconhecida;
  const semEvidencia = !e.sourceUrl;
  const limitacoes = normalizarLimitacoes(e.limitacoes);
  if (!sourceId) {
    limitacoes.push({
      tipo: "dado_ausente",
      campoAfetado: "fonte",
      mensagem: "Este evento ainda não informa a base pública de origem; trate como dado incompleto.",
    });
  } else if (fonteDesconhecida) {
    limitacoes.push({
      tipo: "dado_ausente",
      campoAfetado: "fonte",
      mensagem: `A base pública "${sourceId}" ainda não está catalogada no DeOlho; trate como dado incompleto.`,
    });
  }
  if (semEvidencia) {
    limitacoes.push({
      tipo: "dado_ausente",
      campoAfetado: "evidência",
      fonte: fid === "sinteticos" ? undefined : fid,
      mensagem: "A fonte deste evento não disponibilizou um link de evidência direta neste registro.",
    });
  }
  if (!e.dataEvento && !e.publishedAt) {
    limitacoes.push({
      tipo: "dado_ausente",
      campoAfetado: "data pública",
      fonte: fid === "sinteticos" ? undefined : fid,
      mensagem: "A fonte não informou uma data pública confiável para ordenar este evento; ele não deve aparecer como recente.",
    });
  }

  if (apresentacaoIA?.aviso) {
    avisos.push(apresentacaoIA.aviso);
  }

  const fonte: Fonte = {
    id: fid,
    nome: FONTE_LABEL[fid],
    url: e.sourceUrl ?? undefined,
    dataPublicacao: dataIsoCurta(e.publishedAt),
    dataColeta: dataIsoCurta(e.fetchedAt),
    estado: semFonte || semEvidencia ? "partial" : "fresh",
    isSynthetic: fid === "sinteticos",
  };

  const evidencias: EvidenciaComposta[] = e.sourceUrl
    ? [{ titulo: `Abrir fonte ${fonte.nome}`, href: e.sourceUrl, fonte: fid }]
    : [];

  // Empresa: fornecedor ou credor com CNPJ completo leva para a pagina da empresa.
  const cnpj = documentoEmpresa(e);

  switch (e.categoria) {
    case "contratacao": {
      const fornecedor = nomeCurto(extrair(e.resumo, "Fornecedor"));
      if (!usarTextoFormatado) {
        titulo = fornecedor
          ? `Prefeitura contratou ${fornecedor}${valorLabel ? ` por ${valorLabel}` : ""}`
          : `Prefeitura fez uma contratação${valorLabel ? ` de ${valorLabel}` : ""}`;
      }
      if (cnpj?.length === 14) conexoes.push({ tipo: "empresa", label: fornecedor ?? "Empresa contratada", href: `/empresa/${cnpj}` });
      break;
    }
    case "pagamento": {
      const credor = nomeCurto(extrair(e.resumo, "Credor"));
      if (!usarTextoFormatado) {
        titulo = credor
          ? `Prefeitura pagou ${valorLabel ?? "uma despesa"} a ${credor}`
          : `Prefeitura registrou pagamento${valorLabel ? ` de ${valorLabel}` : ""}`;
        resumo = nomeCurto(extrair(e.resumo, "Ação orçament[áa]ria"), 120) ?? resumo;
      }
      if (cnpj?.length === 14 && credor) conexoes.push({ tipo: "empresa", label: credor, href: `/empresa/${cnpj}` });
      break;
    }
    case "receita": {
      const tipo = nomeCurto(e.titulo.replace(/^Receita arrecadada:\s*\d*\s*-?\s*/i, ""), 60);
      if (!usarTextoFormatado) {
        titulo = `Prefeitura arrecadou ${valorLabel ?? "receita"}${tipo ? ` — ${tipo}` : ""}`;
      }
      break;
    }
    case "sancao": {
      const empresa = nomeCurto(e.resumo?.split(/\bTipo\b/i)[0] ?? null);
      const tipo = nomeCurto(extrair(e.resumo, "Tipo"), 70);
      if (!usarTextoFormatado) {
        titulo = empresa ? `${empresa} consta em lista de sanção` : "Sanção registrada";
        resumo = tipo;
      }
      avisos.push("Sinal oficial de sanção não indica irregularidade por si só. Consulte a fonte e o contexto.");
      if (cnpj?.length === 14 && empresa) conexoes.push({ tipo: "empresa", label: empresa, href: `/empresa/${cnpj}` });
      break;
    }
    case "nomeacao_exoneracao": {
      const partes = (e.resumo ?? "").split("·").map((s) => s.trim());
      const nome = nomeCurto(partes[0] ?? null, 40);
      const cargo = partes[1] ?? null;
      if (!usarTextoFormatado) {
        titulo = nome ? `${e.titulo}: ${nome}` : e.titulo;
        resumo = cargo ?? resumo;
      }
      if (nome) conexoes.push({ tipo: "pessoa_publica", label: nome, href: `/pessoa/${slugify(nome)}` });
      break;
    }
    // ato_normativo / audiencia_conselho / obra_zeladoria: titulo do banco + resumo.
  }

  // Orgao: nome resolvido pelo read model (join), ou "Orgao: X" no resumo.
  const orgao = e.entidades?.orgaoNome ?? extrair(e.resumo, "Órg[ãa]o citado") ?? extrair(e.resumo, "Órg[ãa]o");
  const orgaoNome = nomeCurto(orgao, 50);
  if (orgaoNome && !/prefeitura municipal de americana/i.test(orgaoNome)) {
    conexoes.push({ tipo: "orgao", label: orgaoNome, href: `/orgao/${slugify(orgaoNome)}` });
  }

  if (e.sourceUrl) {
    conexoes.push({ tipo: "evidencia", label: "Ver evidência", href: e.sourceUrl });
  }

  // Termos civicos a partir de titulo + resumo.
  conexoes.push(...detectarTermos(`${e.titulo} ${e.resumo ?? ""}`));
  for (const label of apresentacaoIA?.conexoesTexto ?? []) {
    conexoes.push({
      tipo: "ia",
      label,
      tooltip: "Conexão textual organizada pelo agente a partir dos campos e evidências deste evento.",
    });
  }

  const possuiPessoaComoAlvo = conexoes.some((c) => c.tipo === "pessoa_publica");

  return {
    titulo,
    resumo,
    valorLabel,
    tipoInformacao: tipoInformacao(e, semFonte, semEvidencia),
    fonte,
    confianca: confiancaFonte(e, limitacoes, semFonte, semEvidencia),
    limitacoes,
    evidencias,
    conexoes,
    media,
    selo,
    avisos,
    apresentacaoIA,
    permiteAcoesCivicas: !possuiPessoaComoAlvo,
  };
}

/** Deixa a primeira letra minúscula (para encaixar objeto no meio de uma frase). */
function minuscInicial(s: string): string {
  return s ? s.charAt(0).toLocaleLowerCase("pt-BR") + s.slice(1) : s;
}

function objetoDoResumo(resumo: string | null): string | null {
  return nomeCurto(
    extrair(resumo, "Objeto\\/finalidade")
      ?? extrair(resumo, "Objeto")
      ?? extrair(resumo, "Finalidade")
      ?? extrair(resumo, "Ação orçament[áa]ria"),
    160,
  );
}

/**
 * Leitura INTERPRETATIVA local (sem IA, sem recitar o trecho bruto). Diferente da
 * Ficha (que lista fatos) e das Provas (que mostram o documento), esta explica o
 * SIGNIFICADO em linguagem simples e orienta o que acompanhar — a partir dos
 * campos já publicados pela fonte. Pura e testável.
 */
export function leituraLocalInterpretativa(e: EventoParaComposicao): string {
  const valor = valorHumano(e.valor);
  const objeto = objetoDoResumo(e.resumo);
  const orgao = nomeCurto(e.entidades?.orgaoNome ?? extrair(e.resumo, "Órg[ãa]o citado") ?? extrair(e.resumo, "Órg[ãa]o"), 60);
  const partes: string[] = [];
  const acompanhar: string[] = [];

  switch (e.categoria) {
    case "contratacao": {
      const fornecedor = nomeCurto(extrair(e.resumo, "Fornecedor")) ?? "uma empresa";
      partes.push(`A Prefeitura contratou ${fornecedor}${objeto ? ` para ${minuscInicial(objeto)}` : ""}${valor ? `, ao valor registrado de ${valor}` : ""}.`);
      if (orgao) partes.push(`O órgão responsável citado é ${orgao}.`);
      partes.push("Um contrato é um compromisso de gasto público: o dinheiro só deve sair conforme o serviço ou produto é entregue.");
      acompanhar.push("a vigência e eventuais aditivos que aumentem prazo ou valor", "se a entrega corresponde ao que foi contratado");
      break;
    }
    case "pagamento": {
      const credor = nomeCurto(extrair(e.resumo, "Credor")) ?? "um credor";
      partes.push(`A Prefeitura registrou um pagamento${valor ? ` de ${valor}` : ""} a ${credor}.`);
      if (objeto) partes.push(`Finalidade informada: ${minuscInicial(objeto)}.`);
      partes.push("Todo gasto passa por empenho (reserva do dinheiro), liquidação (confirmação da entrega) e pagamento (saída efetiva).");
      acompanhar.push("se este pagamento corresponde a um contrato já publicado", "a fase informada — empenhado, liquidado ou pago");
      break;
    }
    case "receita": {
      partes.push(`Entrou ${valor ?? "uma receita"} nos cofres da Prefeitura.`);
      partes.push("Receita é o dinheiro que o município arrecada — impostos, transferências e outras fontes — e que financia os serviços públicos.");
      acompanhar.push("como essa arrecadação evolui ao longo do ano");
      break;
    }
    case "sancao": {
      const empresa = nomeCurto(e.resumo?.split(/\bTipo\b/i)[0] ?? null) ?? "Uma empresa";
      const tipo = nomeCurto(extrair(e.resumo, "Tipo"), 80);
      partes.push(`${empresa} aparece em uma lista pública de sanção${tipo ? ` (${minuscInicial(tipo)})` : ""}.`);
      partes.push("Constar em lista de sanção é um registro administrativo e não significa, por si só, culpa ou irregularidade neste evento.");
      acompanhar.push("o órgão que aplicou a sanção, o prazo e o motivo na fonte oficial");
      break;
    }
    case "nomeacao_exoneracao": {
      const partesNome = (e.resumo ?? "").split("·").map((s) => s.trim());
      const nome = nomeCurto(partesNome[0] ?? null, 40);
      const cargo = partesNome[1] ?? null;
      partes.push(`${e.titulo}${nome ? `: ${nome}` : ""}${cargo ? ` (${minuscInicial(cargo)})` : ""}.`);
      partes.push("Nomeações e exonerações de cargos em comissão são decisões do Executivo publicadas no diário oficial.");
      acompanhar.push("quem ocupa funções de confiança e por quanto tempo");
      break;
    }
    default: {
      partes.push(objeto ? `${e.titulo}: ${minuscInicial(objeto)}.` : `${e.titulo}.`);
      partes.push("Atos publicados no diário oficial valem como decisão pública a partir da publicação.");
      acompanhar.push("o que o ato muda na prática e quem é afetado");
    }
  }

  const blocos = [partes.join(" ")];
  if (acompanhar.length > 0) blocos.push(`Vale acompanhar: ${acompanhar.join("; ")}.`);
  blocos.push("Esta leitura organiza, em linguagem simples, os campos já publicados pela fonte. Os fatos, valores e vínculos estão na ficha e nas provas desta página.");
  return blocos.join("\n\n");
}
