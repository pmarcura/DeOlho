/**
 * Enriquecimento via Wikipedia (REST API em português) para contexto
 * enciclopedico dentro da pagina do evento.
 *
 * Decisão de stack: usa a API REST pública da Wikipedia direto via `fetch`
 * (sem dependência Python/lib externa). Cache de 7 dias via Next.
 *
 * DOUTRINA: enriquecer apenas entidades, leis e conceitos citados no evento.
 * Nunca buscar pessoas fisicas comuns, nunca usar fallback generico de cidade e
 * nunca usar Wikipedia como fonte dos eventos oficiais.
 */
import "server-only";
import type { EventoRanqueado, EvidenciaEvento } from "./eventos";
import { podeEnriquecerComWikipedia, type WikiEntityKind } from "./wiki-policy";

export interface WikiInfo {
  titulo: string;
  resumo: string | null;
  /** URL da imagem (thumbnail). */
  foto: string | null;
  /** Link para a página completa na Wikipedia. */
  url: string | null;
  /** ID Wikidata (ex.: Q467421) — porta para fatos estruturados no futuro. */
  wikidataId: string | null;
}

const REST = "https://pt.wikipedia.org/api/rest_v1/page/summary/";

// Cache em processo (além do cache HTTP do Next) — evita refetch no mesmo render.
const _cache = new Map<string, WikiInfo | null>();

/**
 * Busca resumo + foto de um título na Wikipedia PT. Retorna null se não existir,
 * for desambiguação, ou em qualquer falha.
 */
export async function buscarWikipedia(titulo: string): Promise<WikiInfo | null> {
  const chave = titulo.trim();
  if (!chave) return null;
  if (_cache.has(chave)) return _cache.get(chave) ?? null;

  try {
    const res = await fetch(REST + encodeURIComponent(chave.replace(/\s+/g, "_")), {
      headers: { accept: "application/json" },
      // 7 dias: fatos da Wikipedia mudam devagar; não martelar a API.
      next: { revalidate: 604_800 },
    });
    if (!res.ok) {
      _cache.set(chave, null);
      return null;
    }
    const d = (await res.json()) as {
      type?: string;
      title?: string;
      extract?: string;
      thumbnail?: { source?: string };
      content_urls?: { desktop?: { page?: string } };
      wikibase_item?: string;
    };
    // Páginas de desambiguação não servem como contexto confiável.
    if (d.type === "disambiguation" || !d.title) {
      _cache.set(chave, null);
      return null;
    }
    const info: WikiInfo = {
      titulo: d.title,
      resumo: d.extract?.trim() || null,
      foto: d.thumbnail?.source ?? null,
      url: d.content_urls?.desktop?.page ?? null,
      wikidataId: d.wikibase_item ?? null,
    };
    _cache.set(chave, info);
    return info;
  } catch {
    _cache.set(chave, null);
    return null;
  }
}

export interface WikiContextoEvento {
  id: string;
  tipo: WikiEntityKind;
  label: string;
  motivo: string;
  query: string;
  info: WikiInfo;
}

interface WikiCandidato {
  id: string;
  tipo: WikiEntityKind;
  label: string;
  motivo: string;
  query: string;
  prioridade: number;
}

type WikiCandidatoInput = Omit<WikiCandidato, "id">;

export function buscarWikipediaSegura(input: {
  titulo: string;
  tipo: WikiEntityKind;
}): Promise<WikiInfo | null> {
  if (!podeEnriquecerComWikipedia(input.tipo)) return Promise.resolve(null);
  return buscarWikipedia(input.titulo);
}

/** Utilitário explicito para telas territoriais futuras; não usar como fallback de evento. */
export function contextoCidade(): Promise<WikiInfo | null> {
  return buscarWikipediaSegura({ titulo: "Americana (São Paulo)", tipo: "cidade" });
}

export async function contextoWikipediaEvento(input: {
  evento: EventoRanqueado;
  evidencias: EvidenciaEvento[];
  limite?: number;
}): Promise<WikiContextoEvento[]> {
  const candidatos = candidatosWikipediaEvento(input.evento, input.evidencias)
    .sort((a, b) => b.prioridade - a.prioridade)
    .slice(0, 8);

  const encontrados = await Promise.all(candidatos.map(async (candidato): Promise<WikiContextoEvento | null> => {
    const info = await buscarWikipediaSegura({ titulo: candidato.query, tipo: candidato.tipo });
    return info
      ? {
        id: candidato.id,
        tipo: candidato.tipo,
        label: candidato.label,
        motivo: candidato.motivo,
        query: candidato.query,
        info,
      }
      : null;
  }));

  return encontrados
    .filter((item): item is WikiContextoEvento => Boolean(item))
    .slice(0, input.limite ?? 5);
}

function candidatosWikipediaEvento(evento: EventoRanqueado, evidencias: EvidenciaEvento[]): WikiCandidato[] {
  const candidatos: WikiCandidato[] = [];
  const vistos = new Set<string>();
  const texto = [
    evento.titulo,
    evento.resumo,
    ...evidencias.map((e) => e.trecho ?? ""),
  ].join("\n");

  const push = (candidato: WikiCandidatoInput) => {
    const key = normalizar(`${candidato.tipo}:${candidato.query}`);
    if (!key || vistos.has(key)) return;
    vistos.add(key);
    candidatos.push({ ...candidato, id: key });
  };

  const orgaos = [
    evento.entidades?.orgaoNome,
    ...((evento.entidades?.orgaos ?? []).map((o) => o.nome)),
    extrairCampo(evento.resumo, "Órg[ãa]o"),
  ].filter((nome): nome is string => Boolean(nome && nome.trim().length > 4));
  for (const orgao of orgaos) {
    push({
      tipo: "orgao",
      label: orgao,
      query: limparNome(orgao),
      motivo: "Órgão ou instituição citada no evento.",
      prioridade: 90,
    });
  }

  const empresa = extrairCampo(evento.resumo, evento.categoria === "pagamento" ? "Credor" : "Fornecedor")
    ?? extrairCampo(evento.resumo, "Contratado")
    ?? extrairCampo(evento.resumo, "Empresa");
  if (empresa) {
    push({
      tipo: "empresa",
      label: empresa,
      query: limparNome(empresa),
      motivo: "Empresa citada pela fonte oficial; Wikipedia é apenas contexto institucional.",
      prioridade: 76,
    });
  }

  for (const pessoa of evento.entidades?.pessoas ?? []) {
    if (!pessoa.nome || pessoa.nome.trim().length < 6) continue;
    push({
      tipo: "pessoa_publica",
      label: pessoa.nome,
      query: limparNome(pessoa.nome),
      motivo: pessoa.cargo ? `Pessoa citada em função pública: ${pessoa.cargo}.` : "Pessoa citada em função pública.",
      prioridade: 72,
    });
  }

  for (const lei of detectarLeis(texto)) push(lei);
  for (const conceito of detectarConceitosPublicos(texto)) push(conceito);

  return candidatos;
}

function detectarLeis(texto: string): WikiCandidatoInput[] {
  const out: WikiCandidatoInput[] = [];
  const push = (label: string, query: string, prioridade = 70) => {
    out.push({
      tipo: "lei",
      label,
      query,
      motivo: "Lei citada ou necessária para contextualizar o ato.",
      prioridade,
    });
  };
  if (/\b(?:lei\s*(?:federal\s*)?(?:n[ºo]\s*)?14\.?133(?:\/(?:21|2021))?|art\.?\s*75\b)/i.test(texto)) {
    push("Lei 14.133/2021", "Lei de Licitações e Contratos Administrativos", 82);
  }
  if (/\b(?:lei\s*(?:n[ºo]\s*)?8\.?666(?:\/93|\/1993)?)\b/i.test(texto)) {
    push("Lei 8.666/1993", "Lei de Licitações", 75);
  }
  if (/\b(?:lei\s*complementar\s*(?:n[ºo]\s*)?101(?:\/2000)?|LRF|responsabilidade fiscal)\b/i.test(texto)) {
    push("Lei de Responsabilidade Fiscal", "Lei de Responsabilidade Fiscal", 75);
  }
  if (/\bconstitui[cç][aã]o\s+federal\b/i.test(texto)) {
    push("Constituição Federal", "Constituição brasileira de 1988", 70);
  }
  return out;
}

function detectarConceitosPublicos(texto: string): WikiCandidatoInput[] {
  const regras: Array<{ re: RegExp; label: string; query: string; prioridade: number }> = [
    { re: /\bpreg[aã]o\b/i, label: "Pregão", query: "Pregão (licitação)", prioridade: 64 },
    { re: /\bdispensa de licita[cç][aã]o\b/i, label: "Dispensa de licitação", query: "Licitação", prioridade: 62 },
    { re: /\btermo aditivo\b/i, label: "Termo aditivo", query: "Contrato administrativo", prioridade: 60 },
    { re: /\bdi[aá]rio oficial\b/i, label: "Diário oficial", query: "Diário oficial", prioridade: 54 },
    { re: /\bSUS\b/i, label: "Sistema Único de Saúde", query: "Sistema Único de Saúde", prioridade: 52 },
    { re: /\bguarda municipal\b/i, label: "Guarda municipal", query: "Guarda municipal", prioridade: 52 },
  ];
  return regras
    .filter((regra) => regra.re.test(texto))
    .map((regra) => ({
      tipo: "conceito_publico" as const,
      label: regra.label,
      query: regra.query,
      motivo: "Conceito público ajuda a entender o documento, mas não prova o evento.",
      prioridade: regra.prioridade,
    }));
}

function extrairCampo(resumo: string | null, label: string): string | null {
  if (!resumo) return null;
  const re = new RegExp(`${label}\\s*:?\\s*([^.]+?)(?:\\.\\s|\\.$|$)`, "i");
  return re.exec(resumo)?.[1]?.trim() ?? null;
}

function limparNome(nome: string): string {
  return nome
    .replace(/\b(?:CNPJ|CPF)\b.*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizar(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
