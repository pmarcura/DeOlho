/**
 * Enriquecimento via Wikipedia (REST API em português) — fotos, resumo e fatos
 * para dar contexto humano aos posts: a cidade, os órgãos públicos, lugares.
 *
 * Decisão de stack: usa a API REST pública da Wikipedia direto via `fetch`
 * (sem dependência Python/lib externa). Cache de 7 dias via Next.
 *
 * DOUTRINA: enriquecer apenas ENTIDADES PÚBLICAS (cidade, órgãos, lugares).
 * NUNCA buscar pessoas físicas comuns — só cabe a agente público notório, e ainda
 * assim com cautela. Por isso o enriquecimento é opt-in por tipo, nunca automático
 * sobre nomes de pessoas.
 */
import "server-only";

export interface WikiInfo {
  titulo: string;
  resumo: string | null;
  /** URL da imagem (thumbnail) — a "foto" do post. */
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
 * for desambiguação, ou em qualquer falha (degrada sem quebrar o post).
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

/** Contexto da cidade-piloto (foto + resumo de Americana) para o cabeçalho do feed. */
export function contextoCidade(): Promise<WikiInfo | null> {
  return buscarWikipedia("Americana (São Paulo)");
}
