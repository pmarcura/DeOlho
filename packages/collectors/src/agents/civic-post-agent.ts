import path from "node:path";
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ path: path.resolve(process.cwd(), "../../.env.local"), quiet: true });
dotenv.config({ quiet: true });

export const CivicPostAgentOutputSchema = z.object({
  titulo: z.string().min(8).max(130),
  resumo: z.string().min(16).max(460),
  linhaFina: z.string().max(180),
  leituraCompleta: z.string().min(24).max(3600),
  etiquetas: z.array(z.string().min(2).max(32)).max(6),
  conexoesTexto: z.array(z.string().min(4).max(90)).max(6),
  aviso: z.string().max(180).nullable(),
});

export type CivicPostAgentOutput = z.infer<typeof CivicPostAgentOutputSchema>;

export interface CivicPostAgentInput {
  id?: string;
  categoria: string;
  tipo: string;
  titulo: string;
  resumo: string | null;
  valor: string | null;
  sourceId: string;
  sourceUrl: string | null;
  dataEvento: string | null;
  entidades: unknown;
  limitacoes: unknown;
  evidencias?: Array<{
    titulo: string | null;
    sourceUrl: string | null;
    trecho: string | null;
    metodoExtracao?: string | null;
  }>;
}

type AgentProvider = "auto" | "openai" | "ollama" | "local";
type AgentMode = "openai" | "ollama" | "local" | "fallback";

const PROVIDER = provider();
const MODEL = process.env.DEOLHO_POST_AGENT_MODEL || "gpt-4.1-nano";
const OLLAMA_MODEL = process.env.DEOLHO_POST_AGENT_LOCAL_MODEL || "llama3.2:3b";
const RESPONSES_URL = "https://api.openai.com/v1/responses";
let apiDisabledReason: string | null = null;

function provider(): AgentProvider {
  const raw = (process.env.DEOLHO_POST_AGENT_PROVIDER ?? "local").toLowerCase();
  if (raw === "auto" || raw === "openai" || raw === "ollama" || raw === "local") return raw;
  return "local";
}

const OUTPUT_JSON_SCHEMA = {
  name: "civic_post_agent_output",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["titulo", "resumo", "linhaFina", "leituraCompleta", "etiquetas", "conexoesTexto", "aviso"],
    properties: {
      titulo: { type: "string", minLength: 8, maxLength: 130 },
      resumo: { type: "string", minLength: 16, maxLength: 460 },
      linhaFina: { type: "string", maxLength: 180 },
      leituraCompleta: { type: "string", minLength: 24, maxLength: 3600 },
      etiquetas: {
        type: "array",
        maxItems: 6,
        items: { type: "string", minLength: 2, maxLength: 32 },
      },
      conexoesTexto: {
        type: "array",
        maxItems: 6,
        items: { type: "string", minLength: 4, maxLength: 90 },
      },
      aviso: { type: ["string", "null"], maxLength: 180 },
    },
  },
};

const INSTRUCTIONS = [
  "Voce e o agente leve de apresentacao civica do DeOlho.",
  "Sua unica funcao e formatar texto para um evento civico claro e verificavel.",
  "Use somente os campos recebidos. Nao invente nomes, valores, datas, leis, vinculos, irregularidades ou relacoes.",
  "Leia os trechos de evidencia quando existirem e use-os para escrever leituraCompleta com secoes curtas.",
  "leituraCompleta deve explicar o documento inteiro em linguagem simples, preservando nomes, valores e datas exatamente como vieram no input.",
  "Use secoes como: O que aconteceu, O que o documento diz, Pontos para acompanhar e Limitacoes.",
  "Nao acuse pessoas ou empresas. Nao crie score, ranking de suspeita ou conclusao moral.",
  "Se houver sancao ou sinal de atencao, escreva aviso neutro dizendo que nao indica irregularidade por si so.",
  "Prefira portugues do Brasil simples, direto e sem sensacionalismo.",
  "Otimize para custo: responda apenas JSON no schema pedido.",
].join("\n");

function crop(value: unknown, max: number): unknown {
  if (typeof value === "string") return value.slice(0, max);
  if (Array.isArray(value)) return value.slice(0, 12).map((item) => crop(item, max));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value).slice(0, 20)) out[key] = crop(val, max);
    return out;
  }
  return value;
}

function inputCompacto(input: CivicPostAgentInput): string {
  return JSON.stringify({
    categoria: input.categoria,
    tipo: input.tipo,
    titulo: crop(input.titulo, 220),
    resumo: crop(input.resumo, 900),
    valor: input.valor,
    fonte: input.sourceId,
    temLinkFonte: Boolean(input.sourceUrl),
    dataEvento: input.dataEvento,
    entidades: crop(input.entidades, 700),
    limitacoes: crop(input.limitacoes, 420),
    evidencias: input.evidencias?.slice(0, 5).map((e) => ({
      titulo: crop(e.titulo, 120),
      temLinkFonte: Boolean(e.sourceUrl),
      metodoExtracao: e.metodoExtracao,
      trecho: crop(e.trecho, Number(process.env.DEOLHO_POST_AGENT_EVIDENCE_MAX_CHARS ?? 3000)),
    })) ?? [],
  });
}

function extractOutputText(data: unknown): string {
  const obj = data as { output_text?: unknown; output?: unknown };
  if (typeof obj.output_text === "string") return obj.output_text;
  if (!Array.isArray(obj.output)) return "";
  for (const item of obj.output) {
    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      const text = (part as { text?: unknown }).text;
      if (typeof text === "string") return text;
    }
  }
  return "";
}

function parseJsonOutput(text: string): CivicPostAgentOutput {
  try {
    return CivicPostAgentOutputSchema.parse(JSON.parse(text));
  } catch {
    const inicio = text.indexOf("{");
    const fim = text.lastIndexOf("}");
    if (inicio >= 0 && fim > inicio) {
      return CivicPostAgentOutputSchema.parse(JSON.parse(text.slice(inicio, fim + 1)));
    }
    throw new Error("saida do agente nao e JSON valido");
  }
}

function valorCurto(valor: string | null): string | null {
  if (!valor) return null;
  const n = Number(valor);
  if (!Number.isFinite(n) || n === 0) return null;
  if (n >= 1_000_000) return `R$ ${(n / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mi`;
  if (n >= 10_000) return `R$ ${Math.round(n / 1000).toLocaleString("pt-BR")} mil`;
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fallback(input: CivicPostAgentInput): CivicPostAgentOutput {
  const valor = valorCurto(input.valor);
  const base = input.titulo.replace(/\s+/g, " ").trim();
  const historico = extrairHistoricoApresentacao(input.entidades);
  const evidenciasTexto = (input.evidencias?.map((e) => e.trecho ?? "").join("\n") ?? "")
    .replace(/\s+/g, " ")
    .trim();
  const texto = [
    historico.tituloOriginal,
    historico.resumoOriginal,
    input.titulo,
    input.resumo,
    evidenciasTexto,
  ].join("\n").replace(/\s+/g, " ").trim();
  const fornecedor = extrairCampo(texto, input.categoria === "pagamento" ? "Credor" : "Fornecedor")
    ?? extrairCampo(texto, "Contratad[oa]")
    ?? extrairCampo(texto, "Empresa");
  const fornecedorDoTitulo = fornecedor ?? extrairFornecedorDeTitulo(texto, input.categoria);
  const orgao = extrairCampo(texto, "Órgão") ?? extrairCampo(texto, "Secretaria") ?? extrairSecretaria(texto);
  const objeto = extrairCampo(evidenciasTexto, "Objeto")
    ?? extrairObjetoSolto(evidenciasTexto)
    ?? primeiraFrase(evidenciasTexto)
    ?? extrairCampo(texto, "Objeto")
    ?? extrairCampo(texto, "Finalidade")
    ?? extrairCampo(texto, "Ação orçamentária")
    ?? primeiraFrase(input.resumo ?? texto);
  const label = labelCategoria(input.categoria);
  const fonte = labelFonte(input.sourceId);
  const titulo = tituloInteligente({ input, fornecedor: fornecedorDoTitulo, valor, base });
  const resumo = resumoInteligente({ input, fornecedor: fornecedorDoTitulo, orgao, objeto, valor, fonte, base: input.resumo ?? base });
  const aviso = input.categoria === "sancao" || input.tipo.includes("sinal")
    ? "Sinal oficial não indica irregularidade por si só; consulte a fonte e o contexto."
    : null;

  return {
    titulo: titulo.length >= 8 ? titulo : `Atualização pública: ${label}`,
    resumo: resumo.slice(0, 460) || "Atualização pública registrada com fonte documentada.",
    linhaFina: [label, valor, fonte].filter(Boolean).join(" · ").slice(0, 180),
    leituraCompleta: leituraCompletaFallback(input),
    etiquetas: [label, fonte].filter(Boolean).slice(0, 6),
    conexoesTexto: conexoesFallback(input),
    aviso,
  };
}

function extrairHistoricoApresentacao(entidades: unknown): {
  tituloOriginal?: string;
  resumoOriginal?: string;
} {
  if (!entidades || typeof entidades !== "object" || Array.isArray(entidades)) return {};
  const apresentacao = (entidades as { apresentacao?: unknown }).apresentacao;
  if (!apresentacao || typeof apresentacao !== "object" || Array.isArray(apresentacao)) return {};
  const item = apresentacao as { tituloOriginal?: unknown; resumoOriginal?: unknown };
  return {
    tituloOriginal: typeof item.tituloOriginal === "string" ? item.tituloOriginal : undefined,
    resumoOriginal: typeof item.resumoOriginal === "string" ? item.resumoOriginal : undefined,
  };
}

function extrairFornecedorDeTitulo(texto: string, categoria: string): string | null {
  const re = categoria === "pagamento"
    ? /Prefeitura\s+paga\s+(?:R\$\s*[\d.,]+(?:\s*(?:mil|mi|milhões))?\s+)?a\s+(.+?)(?:\s+por\s+R\$|\.|$)/i
    : /Prefeitura\s+contrata\s+(.+?)(?:\s+por\s+R\$|\.|$)/i;
  return normalizarCampo(texto.match(re)?.[1]);
}

function tituloInteligente(input: {
  input: CivicPostAgentInput;
  fornecedor: string | null;
  valor: string | null;
  base: string;
}): string {
  const fornecedor = input.fornecedor ? nomeCurto(input.fornecedor, 54) : null;
  if (input.input.categoria === "contratacao") {
    return fornecedor
      ? `Prefeitura contrata ${fornecedor}${input.valor ? ` por ${input.valor}` : ""}`.slice(0, 130)
      : `Prefeitura registra contratação${input.valor ? ` de ${input.valor}` : ""}`.slice(0, 130);
  }
  if (input.input.categoria === "pagamento") {
    return fornecedor
      ? `Prefeitura paga ${input.valor ?? "despesa pública"} a ${fornecedor}`.slice(0, 130)
      : `Prefeitura registra pagamento${input.valor ? ` de ${input.valor}` : ""}`.slice(0, 130);
  }
  if (input.input.categoria === "receita") return `Prefeitura registra receita${input.valor ? ` de ${input.valor}` : ""}`.slice(0, 130);
  if (input.input.categoria === "sancao") {
    return fornecedor ? `${fornecedor} aparece em cadastro oficial de sanção` : "Cadastro oficial registra sanção";
  }
  const precisaTituloGenerico = input.base.length < 24 || /^[a-zà-ÿ]/.test(input.base);
  const baseSeguro = precisaTituloGenerico ? tituloGenerico(input.input.categoria, input.input.tipo) : input.base;
  return input.valor && !baseSeguro.includes(input.valor)
    ? `${baseSeguro.slice(0, 90)} · ${input.valor}`.slice(0, 130)
    : baseSeguro.slice(0, 130);
}

function resumoInteligente(input: {
  input: CivicPostAgentInput;
  fornecedor: string | null;
  orgao: string | null;
  objeto: string | null;
  valor: string | null;
  fonte: string;
  base: string;
}): string {
  const partes: string[] = [];
  const acao = input.input.categoria === "pagamento"
    ? "registrou um pagamento"
    : input.input.categoria === "receita"
      ? "registrou uma receita"
      : input.input.categoria === "sancao"
        ? "registrou uma sanção em base pública"
        : "registrou uma contratação";
  partes.push(`A fonte ${input.fonte} ${acao}${input.valor ? ` com valor citado de ${input.valor}` : ""}.`);
  if (input.fornecedor) partes.push(`Envolvido: ${nomeCurto(input.fornecedor, 90)}.`);
  if (input.orgao) partes.push(`Órgão citado: ${nomeCurto(input.orgao, 90)}.`);
  if (input.objeto) partes.push(`Objeto/finalidade: ${nomeCurto(input.objeto, 210)}.`);
  if (partes.length <= 1 && input.base) partes.push(input.base);
  return partes.join(" ");
}

function nomeCurto(value: string, max: number): string {
  const texto = value
    .replace(/\b(?:CNPJ|CPF)\b.*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
  return texto.length > max ? `${texto.slice(0, max - 1).trimEnd()}…` : texto;
}

function primeiraFrase(texto: string): string | null {
  const frase = texto.match(/[^.!?]+[.!?]?/)?.[0]?.replace(/\s+/g, " ").trim();
  return frase && frase.length > 18 ? frase : null;
}

function leituraCompletaFallback(input: CivicPostAgentInput): string {
  const evidencias = input.evidencias?.filter((e) => e.trecho?.trim()).slice(0, 5) ?? [];
  const textoBase = (evidencias.map((e) => e.trecho).join("\n\n") || input.resumo || input.titulo)
    .replace(/\s+/g, " ")
    .trim();
  const linhas = [
    `O que aconteceu\n${labelCategoria(input.categoria)} registrado em ${labelFonte(input.sourceId)}.${input.valor ? ` Valor citado: ${valorCurto(input.valor) ?? input.valor}.` : ""}`,
    `O que o documento diz\n${quebrarEmParagrafos(textoBase, 480).join("\n\n")}`,
    `Pontos para acompanhar\nConfira a evidência oficial, os nomes citados, valores, prazos e órgãos envolvidos antes de tirar qualquer conclusão.`,
    `Limitações\nEsta leitura local apenas organiza o texto disponível. Quando a fonte não informa data, objeto completo ou vínculo documentado, o DeOlho deve mostrar essa limitação.`,
  ].filter((linha): linha is string => Boolean(linha));
  return linhas.join("\n\n").slice(0, 3600);
}

function quebrarEmParagrafos(texto: string, tamanho: number): string[] {
  const frases = texto.match(/[^.!?]+[.!?]?/g)?.map((s) => s.trim()).filter(Boolean) ?? [texto];
  const out: string[] = [];
  let atual = "";
  for (const frase of frases) {
    if ((atual + " " + frase).trim().length > tamanho && atual) {
      out.push(atual);
      atual = frase;
    } else {
      atual = `${atual} ${frase}`.trim();
    }
    if (out.length >= 3) break;
  }
  if (atual && out.length < 4) out.push(atual);
  return out;
}

function conexoesFallback(input: CivicPostAgentInput): string[] {
  const texto = `${input.titulo}. ${input.resumo ?? ""}`;
  return [
    extrairCampo(texto, "Fornecedor"),
    extrairCampo(texto, "Credor"),
    extrairCampo(texto, "Órgão"),
    extrairCampo(texto, "Modalidade"),
    extrairCampo(texto, "Tipo"),
  ].filter((item, index, arr): item is string => Boolean(item) && arr.indexOf(item) === index).slice(0, 6);
}

function extrairCampo(texto: string, label: string): string | null {
  const labels = "Fornecedor|Credor|Contratad[oa]|Empresa|Órgão|Orgao|Secretaria|Objeto|Finalidade|Ação orçamentária|Acao orcamentaria|Valor|Modalidade|Fonte|Tipo";
  const re = new RegExp(`${label}\\s*:\\s*([^.;\\n]+?)(?=\\s+(?:${labels})\\s*:|[.;\\n]|$)`, "i");
  const valor = normalizarCampo(texto.match(re)?.[1]);
  if (!valor || valor.length < 4) return null;
  return valor.slice(0, 90);
}

function extrairObjetoSolto(texto: string): string | null {
  const re = /\bObjeto\s+(.+?)(?=\s+(?:Fornecedor|Credor|Contratad[oa]|Empresa|Órgão|Valor|Modalidade|Fonte|Tipo)\s*:|[.;\n]|$)/i;
  const valor = normalizarCampo(texto.match(re)?.[1]);
  if (!valor || valor.length < 12) return null;
  return nomeCurto(valor, 210);
}

function normalizarCampo(value: string | undefined): string | null {
  if (!value) return null;
  const limpo = value
    .replace(/\s+/g, " ")
    .replace(/\b(?:Fornecedor|Credor|Contratad[oa]|Empresa|Órgão|Orgao|Objeto|Finalidade|Valor|Modalidade|Fonte|Tipo)\s*:.*$/i, "")
    .replace(/^[,:;\-\s]+|[,:;\-\s]+$/g, "")
    .trim();
  if (!limpo || /^não informado$/i.test(limpo)) return null;
  return limpo;
}

function extrairSecretaria(texto: string): string | null {
  const m = texto.match(/\bSECRETARIA\s+(?:MUNICIPAL\s+)?DE\s+([A-ZÀ-Ú\s]{3,40})/i);
  if (!m?.[1]) return null;
  return `Secretaria de ${titleCasePt(m[1].replace(/\s+/g, " ").trim())}`;
}

function titleCasePt(texto: string): string {
  return texto
    .toLocaleLowerCase("pt-BR")
    .split(/\s+/)
    .map((palavra) => palavra.charAt(0).toLocaleUpperCase("pt-BR") + palavra.slice(1))
    .join(" ");
}

function labelCategoria(categoria: string): string {
  const map: Record<string, string> = {
    contratacao: "Contratação",
    pagamento: "Pagamento",
    receita: "Receita",
    ato_normativo: "Ato oficial",
    nomeacao_exoneracao: "Cargo público",
    sancao: "Sanção",
    audiencia_conselho: "Audiência ou conselho",
    obra_zeladoria: "Obra ou zeladoria",
    limitacao_fonte: "Fonte parcial",
  };
  return map[categoria] ?? categoria.replace(/_/g, " ");
}

function labelFonte(sourceId: string): string {
  const map: Record<string, string> = {
    pncp: "PNCP",
    "tce-sp": "TCE-SP",
    "diario-americana": "Diário de Americana",
    "cgu-transparencia": "CGU Transparência",
    "camara-americana": "Câmara de Americana",
  };
  return map[sourceId] ?? sourceId;
}

function tituloGenerico(categoria: string, tipo: string): string {
  if (categoria === "contratacao") return tipo.includes("licitacao") ? "Licitação publicada em Americana" : "Contrato público registrado em Americana";
  if (categoria === "pagamento") return "Pagamento público registrado em Americana";
  if (categoria === "receita") return "Receita pública registrada em Americana";
  if (categoria === "sancao") return "Sanção oficial registrada em base pública";
  if (categoria === "nomeacao_exoneracao") return "Mudança de cargo público registrada";
  if (categoria === "obra_zeladoria") return "Atualização sobre obra ou zeladoria";
  return "Ato oficial publicado em Americana";
}

export async function formatarComAgenteLeve(input: CivicPostAgentInput): Promise<{
  output: CivicPostAgentOutput;
  modo: AgentMode;
  modelo: string | null;
}> {
  if (PROVIDER === "local") return { output: fallback(input), modo: "local", modelo: "deterministico-local" };
  if (PROVIDER === "ollama") return formatarComOllama(input);
  if (PROVIDER === "auto") {
    const local = await tentarOllama(input);
    if (local) return local;
    return formatarComOpenAI(input);
  }
  return formatarComOpenAI(input);
}

async function formatarComOpenAI(input: CivicPostAgentInput): Promise<{
  output: CivicPostAgentOutput;
  modo: AgentMode;
  modelo: string | null;
}> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { output: fallback(input), modo: "fallback", modelo: null };
  if (apiDisabledReason) return { output: fallback(input), modo: "fallback", modelo: null };

  try {
    const res = await fetch(RESPONSES_URL, {
      method: "POST",
      signal: AbortSignal.timeout(20_000),
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        instructions: INSTRUCTIONS,
        input: inputCompacto(input),
        max_output_tokens: Number(process.env.DEOLHO_POST_AGENT_MAX_OUTPUT_TOKENS ?? 1200),
        text: {
          format: {
            type: "json_schema",
            ...OUTPUT_JSON_SCHEMA,
          },
        },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      if (res.status === 429 && body.includes("insufficient_quota")) {
        apiDisabledReason = "insufficient_quota";
        console.warn("[post-agent] OpenAI sem cota; usando fallback deterministico nesta execução.");
      }
      throw new Error(`OpenAI ${res.status}: ${body}`);
    }
    const data = await res.json() as unknown;
    const text = extractOutputText(data);
    const parsed = parseJsonOutput(text);
    return { output: parsed, modo: "openai", modelo: MODEL };
  } catch (e) {
    if (!apiDisabledReason) console.warn(`[post-agent] fallback deterministico (${e instanceof Error ? e.message : e})`);
    return { output: fallback(input), modo: "fallback", modelo: null };
  }
}

async function tentarOllama(input: CivicPostAgentInput): Promise<{
  output: CivicPostAgentOutput;
  modo: AgentMode;
  modelo: string | null;
} | null> {
  try {
    return await formatarComOllama(input);
  } catch {
    return null;
  }
}

async function formatarComOllama(input: CivicPostAgentInput): Promise<{
  output: CivicPostAgentOutput;
  modo: AgentMode;
  modelo: string | null;
}> {
  try {
    const host = (process.env.OLLAMA_HOST || "http://127.0.0.1:11434").replace(/\/+$/, "");
    const res = await fetch(`${host}/api/generate`, {
      method: "POST",
      signal: AbortSignal.timeout(Number(process.env.DEOLHO_POST_AGENT_LOCAL_TIMEOUT_MS ?? 45_000)),
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        stream: false,
        format: "json",
        prompt: [
          INSTRUCTIONS,
          "Responda somente JSON valido, sem markdown, no schema: titulo, resumo, linhaFina, leituraCompleta, etiquetas, conexoesTexto, aviso.",
          inputCompacto(input),
        ].join("\n\n"),
        options: {
          temperature: 0.1,
          num_predict: Number(process.env.DEOLHO_POST_AGENT_LOCAL_NUM_PREDICT ?? 1400),
        },
      }),
    });
    if (!res.ok) throw new Error(`Ollama ${res.status}: ${await res.text()}`);
    const data = await res.json() as { response?: unknown };
    const parsed = parseJsonOutput(typeof data.response === "string" ? data.response : "");
    return { output: parsed, modo: "ollama", modelo: OLLAMA_MODEL };
  } catch (e) {
    console.warn(`[post-agent] Ollama indisponivel; usando modo local (${e instanceof Error ? e.message : e})`);
    return { output: fallback(input), modo: "local", modelo: "deterministico-local" };
  }
}
